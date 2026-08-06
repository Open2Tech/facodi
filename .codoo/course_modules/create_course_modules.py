#!/usr/bin/env python3
"""Create FACODI Mathematics courses from an approved video catalog.

The default is dry-run. The importer never invents video URLs and refuses apply
when the catalog is empty or contains unapproved entries. It uses only standard
Odoo eLearning models so it can target an Odoo Online database.
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel, HttpUrl, field_validator

from codoo.config import load_config
from codoo.odoo import AsyncOdooClient

APPROVED_HOSTS = {"youtube.com", "www.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com"}
DEFAULT_COURSES = Path(__file__).parent / "courses"


class Video(BaseModel):
    source: str
    source_key: str
    source_url: HttpUrl
    course_key: str
    module_key: str
    title: str
    sequence: int
    rights_note: str
    approved_for_import: bool = False

    @field_validator("source_key", "course_key", "module_key", "title", "rights_note")
    @classmethod
    def non_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("video catalog values cannot be empty")
        return value.strip()

    @field_validator("source_url")
    @classmethod
    def supported_host(cls, value: HttpUrl) -> HttpUrl:
        if value.host not in APPROVED_HOSTS:
            raise ValueError(f"unsupported video host: {value.host}")
        return value


class Catalog(BaseModel):
    videos: list[Video]


def load_catalog(path: Path) -> Catalog:
    data = json.loads(path.read_text(encoding="utf-8"))
    if "videos" not in data:
        raise ValueError("catalog must contain a videos list")
    if all("course_key" in video for video in data["videos"]):
        return Catalog.model_validate(data)

    # Adapt the existing FACODI production catalog without changing its source
    # records. The module mapping is deterministic and based on its approved topics.
    module_by_topic = {
        "Fundamentos de Estatística": "m1",
        "Estatística Descritiva": "m1",
        "Probabilidade": "m2",
        "Combinatória": "m2",
        "Teorema de Bayes": "m2",
        "Variáveis Aleatórias": "m3",
        "Distribuições de Probabilidade": "m3",
        "Distribuição Normal": "m3",
        "Amostragem": "m4",
        "Estatística Inferencial": "m4",
        "Intervalos de Confiança": "m4",
        "Testes de Hipótese": "m5",
        "Correlação e Regressão": "m6",
        "Aplicações": "m6",
        "Revisão": "m6",
        "Avaliações": "m6",
    }
    videos = []
    for video in data["videos"]:
        topics = video.get("topics", [])
        module_key = next(
            (module_by_topic[topic] for topic in topics if topic in module_by_topic), "m1"
        )
        videos.append(
            {
                "source": "approved_catalog",
                "source_key": video["source_key"],
                "source_url": video["source_url"],
                "course_key": "facodi.probabilidade-estatistica",
                "module_key": module_key,
                "title": video["title"],
                "sequence": len(videos) * 10 + 10,
                "rights_note": video["rights_note"],
                "approved_for_import": video.get("approved_for_import", False),
            }
        )
    return Catalog.model_validate({"videos": videos})


class CourseImporter:
    def __init__(self, client: AsyncOdooClient, courses_dir: Path, catalog: Catalog):
        self.client = client
        self.course_specs = [
            json.loads(path.read_text(encoding="utf-8"))
            for path in sorted(courses_dir.glob("*.json"))
        ]
        self.catalog = catalog
        self.by_course = {spec["course_key"]: spec for spec in self.course_specs}

    def plan(self) -> dict[str, Any]:
        approved = [video for video in self.catalog.videos if video.approved_for_import]
        unknown_courses = sorted({video.course_key for video in approved} - self.by_course.keys())
        unknown_modules = sorted(
            f"{video.course_key}:{video.module_key}"
            for video in approved
            if video.course_key in self.by_course
            and video.module_key
            not in {module["key"] for module in self.by_course[video.course_key]["modules"]}
        )
        return {
            "course_count": len(self.course_specs),
            "approved_video_count": len(approved),
            "blocked_video_count": len(self.catalog.videos) - len(approved),
            "unknown_courses": unknown_courses,
            "unknown_modules": unknown_modules,
            "courses": [
                {
                    "course_key": spec["course_key"],
                    "name": spec["name"],
                    "modules": len(spec["modules"]),
                    "videos": sum(video.course_key == spec["course_key"] for video in approved),
                }
                for spec in self.course_specs
            ],
        }

    async def apply(self) -> dict[str, Any]:
        plan = self.plan()
        if not plan["approved_video_count"]:
            raise RuntimeError("No approved video URLs available; refusing to create empty courses")
        if plan["unknown_courses"] or plan["unknown_modules"]:
            raise RuntimeError(f"Catalog references unknown curriculum nodes: {plan}")

        course_ids: dict[str, int] = {}
        created = {"courses": 0, "videos": 0}
        included_course_keys = {
            video.course_key for video in self.catalog.videos if video.approved_for_import
        }
        for spec in self.course_specs:
            if spec["course_key"] not in included_course_keys:
                continue
            records = await self.client.search_read(
                "slide.channel", [["name", "=", spec["name"]]], ["id"], limit=1
            )
            values = {
                "name": spec["name"],
                "description": spec["description"],
                "sequence": spec["sequence"],
                "website_published": False,
            }
            if records:
                course_ids[spec["course_key"]] = int(records[0]["id"])
                await self.client.write("slide.channel", [course_ids[spec["course_key"]]], values)
            else:
                course_ids[spec["course_key"]] = await self.client.create("slide.channel", values)
                created["courses"] += 1

        for video in self.catalog.videos:
            if not video.approved_for_import:
                continue
            course_id = course_ids[video.course_key]
            existing = await self.client.search_read(
                "slide.slide",
                [["channel_id", "=", course_id], ["url", "=", str(video.source_url)]],
                ["id"],
                limit=1,
            )
            values = {
                "name": video.title,
                "channel_id": course_id,
                "slide_category": "video",
                "url": str(video.source_url),
                "sequence": video.sequence,
                "is_published": False,
                "is_preview": False,
            }
            if existing:
                await self.client.write("slide.slide", [int(existing[0]["id"])], values)
            else:
                await self.client.create("slide.slide", values)
                created["videos"] += 1
        return {"ok": True, "created": created, "published": False, "plan": plan}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "mode", choices=("dry-run", "apply", "publish"), nargs="?", default="dry-run"
    )
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--courses-dir", type=Path, default=DEFAULT_COURSES)
    parser.add_argument("--target", default="staging")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument("--confirm", default="")
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    catalog = load_catalog(args.catalog)
    config = load_config(args.target, args.env)
    async with AsyncOdooClient(config) as client:
        importer = CourseImporter(client, args.courses_dir, catalog)
        plan = importer.plan()
        if args.mode == "dry-run":
            print(json.dumps(plan, ensure_ascii=False, indent=2))
            return
        if args.confirm != "APPLY-FACODI-COURSES":
            raise SystemExit("Pass --confirm APPLY-FACODI-COURSES to modify course records")
        if args.mode == "publish":
            approved = [video for video in catalog.videos if video.approved_for_import]
            course_names = {"Matemática I", "Probabilidade e Estatística"}
            courses = await client.search_read(
                "slide.channel", [["name", "in", list(course_names)]], ["id", "name"], limit=20
            )
            course_ids = {record["name"]: int(record["id"]) for record in courses}
            if "Probabilidade e Estatística" not in course_ids:
                raise RuntimeError("Probabilidade e Estatística must be created before publishing")
            videos = await client.search_read(
                "slide.slide",
                [["channel_id", "=", course_ids["Probabilidade e Estatística"]]],
                ["id", "is_published"],
                limit=200,
            )
            for record in courses:
                if record["name"] == "Probabilidade e Estatística":
                    await client.write(
                        "slide.channel",
                        [int(record["id"])],
                        {"website_published": True, "is_published": True},
                    )
            for record in videos:
                await client.write(
                    "slide.slide",
                    [int(record["id"])],
                    {"website_published": True, "is_published": True},
                )
            print(
                json.dumps(
                    {
                        "ok": True,
                        "published_course": "Probabilidade e Estatística",
                        "published_videos": len(videos),
                        "source_video_count": len(approved),
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
            return
        print(json.dumps(await importer.apply(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
