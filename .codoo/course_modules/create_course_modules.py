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
        for spec in self.course_specs:
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
    parser.add_argument("mode", choices=("dry-run", "apply"), nargs="?", default="dry-run")
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--courses-dir", type=Path, default=DEFAULT_COURSES)
    parser.add_argument("--target", default="staging")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument("--confirm", default="")
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    catalog = Catalog.model_validate_json(args.catalog.read_text(encoding="utf-8"))
    config = load_config(args.target, args.env)
    async with AsyncOdooClient(config) as client:
        importer = CourseImporter(client, args.courses_dir, catalog)
        plan = importer.plan()
        if args.mode == "dry-run":
            print(json.dumps(plan, ensure_ascii=False, indent=2))
            return
        if args.confirm != "APPLY-FACODI-COURSES":
            raise SystemExit("Pass --confirm APPLY-FACODI-COURSES to create unpublished courses")
        print(json.dumps(await importer.apply(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
