#!/usr/bin/env python3
"""Import the reviewed Matemateca pilot into standard Odoo eLearning models."""

from __future__ import annotations

import argparse
import asyncio
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from codoo.config import load_config
from codoo.odoo import AsyncOdooClient

CONFIRMATION = "APPLY-EDU-OPEN2"
MANIFEST_DEFAULT = Path("odoo/facodi/.codoo/odoo_online/imports/matemateca/manifest-2026-08-06.json")
STATE_DEFAULT = Path("odoo/facodi/.codoo/odoo_online/state")
PARTNER_NAME = "Matemateca - Ester Velasquez"
CHANNEL_NAME = "Matemateca — Piloto de Cálculo"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("dry-run", "snapshot", "apply", "verify", "rollback"), nargs="?", default="dry-run")
    parser.add_argument("--target", default="online")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument("--manifest", type=Path, default=MANIFEST_DEFAULT)
    parser.add_argument("--state-dir", type=Path, default=STATE_DEFAULT)
    parser.add_argument("--confirm", default="")
    return parser.parse_args()


def now() -> str:
    return datetime.now(UTC).isoformat()


def read_manifest(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


async def build_plan(client: AsyncOdooClient, manifest: dict[str, Any]) -> dict[str, Any]:
    partner = await client.search_read("res.partner", [("name", "=", PARTNER_NAME)], ["id", "name"], limit=5, order="id")
    channel = await client.search_read("slide.channel", [("name", "=", CHANNEL_NAME)], ["id", "name", "website_published", "is_published"], limit=5, order="id")
    videos = []
    for video in manifest["videos"]:
        existing = await client.search_read(
            "slide.slide",
            [("x_studio_source_url", "=", video["canonical_url"])],
            ["id", "name", "channel_id", "website_published", "is_published", "x_studio_editorial_state"],
            limit=5,
            order="id",
        )
        videos.append({"manifest": video, "existing": existing})
    return {"partner": partner[0] if partner else None, "channel": channel[0] if channel else None, "videos": videos}


def slide_values(video: dict[str, Any], channel_id: int) -> dict[str, Any]:
    description = video["description"]
    return {
        "name": video["title"],
        "channel_id": channel_id,
        "slide_category": "video",
        "slide_type": "youtube_video",
        "url": video["canonical_url"],
        "website_published": False,
        "is_published": False,
        "x_studio_source_url": video["canonical_url"],
        "x_studio_source_platform": "youtube",
        "x_studio_source_author": video["channel"],
        "x_studio_source_license": "Não declarada na fonte pública; revisão necessária antes da publicação.",
        "x_studio_source_description": f"<p>{description}</p>" if description else False,
        "x_studio_editorial_state": "preparing",
        "x_studio_approved_for_publication": False,
    }


async def main() -> None:  # noqa: C901
    args = parse_args()
    args.state_dir.mkdir(parents=True, exist_ok=True)
    manifest = read_manifest(args.manifest)
    async with AsyncOdooClient(load_config(target=args.target, env_file=args.env)) as client:
        plan = await build_plan(client, manifest)
        summary = {
            "partner": {"existing": bool(plan["partner"]), "name": PARTNER_NAME},
            "channel": {"existing": bool(plan["channel"]), "name": CHANNEL_NAME},
            "videos": {"total": len(plan["videos"]), "existing": sum(bool(item["existing"]) for item in plan["videos"]), "to_create": sum(not item["existing"] for item in plan["videos"])},
            "publishes": 0,
        }
        if args.mode == "dry-run":
            print(json.dumps({"mode": args.mode, "summary": summary, "plan": plan}, ensure_ascii=False, indent=2))
            return
        snapshot_path = args.state_dir / "matemateca-before.json"
        if args.mode == "snapshot":
            snapshot_path.write_text(json.dumps({"generated_at": now(), "manifest": manifest, "plan": plan, "writes_performed": False}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(json.dumps({"mode": args.mode, "snapshot": str(snapshot_path)}, indent=2))
            return
        if args.mode in {"apply", "rollback"} and args.confirm != CONFIRMATION:
            raise RuntimeError(f"Remote writes require --confirm {CONFIRMATION}")
        if args.mode == "apply":
            snapshot_path.write_text(json.dumps({"generated_at": now(), "manifest": manifest, "plan": plan, "writes_performed": False}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            created_partner = False
            created_channel = False
            created_slides: list[int] = []
            partner_id = plan["partner"]["id"] if plan["partner"] else await client.create("res.partner", {"name": PARTNER_NAME})
            created_partner = not bool(plan["partner"])
            channel_id = plan["channel"]["id"] if plan["channel"] else await client.create(
                "slide.channel",
                {
                    "name": CHANNEL_NAME,
                    "description_short": "Piloto de vídeos públicos do canal Matemateca. Fonte: Matemateca; curadoria: FACODI. Autorização institucional não presumida.",
                    "website_published": False,
                    "is_published": False,
                    "x_studio_publisher_id": partner_id,
                    "x_studio_collection_type": "topic_collection",
                    "x_studio_editorial_state": "preparing",
                    "x_studio_approved_for_publication": False,
                },
            )
            created_channel = not bool(plan["channel"])
            actions = []
            for item in plan["videos"]:
                values = slide_values(item["manifest"], channel_id)
                if item["existing"]:
                    slide_id = item["existing"][0]["id"]
                    source_values = {
                        key: values[key]
                        for key in (
                            "url",
                            "x_studio_source_url",
                            "x_studio_source_platform",
                            "x_studio_source_author",
                            "x_studio_source_license",
                            "x_studio_source_description",
                        )
                    }
                    await client.write("slide.slide", [slide_id], source_values)
                    actions.append({"id": slide_id, "action": "reused"})
                else:
                    slide_id = await client.create("slide.slide", values)
                    created_slides.append(slide_id)
                    actions.append({"id": slide_id, "action": "created"})
            result = {"generated_at": now(), "partner_id": partner_id, "channel_id": channel_id, "created_partner": created_partner, "created_channel": created_channel, "created_slides": created_slides, "actions": actions, "snapshot": str(snapshot_path)}
            (args.state_dir / "matemateca-apply.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return
        if args.mode == "verify":
            verified = await build_plan(client, manifest)
            channel_id = verified["channel"]["id"] if verified["channel"] else None
            records = []
            if channel_id:
                records = await client.search_read("slide.slide", [("channel_id", "=", channel_id)], ["id", "name", "url", "website_published", "is_published", "x_studio_source_url", "x_studio_editorial_state", "x_studio_approved_for_publication"], limit=100, order="id")
            print(json.dumps({"mode": args.mode, "channel": verified["channel"], "count": len(records), "duplicate_urls": len(records) - len({r.get("x_studio_source_url") for r in records}), "records": records}, ensure_ascii=False, indent=2))
            return
        path = args.state_dir / "matemateca-apply.json"
        if not path.exists():
            raise RuntimeError(f"Missing apply artifact: {path}")
        result = json.loads(path.read_text(encoding="utf-8"))
        if result.get("created_slides"):
            await client.unlink("slide.slide", result["created_slides"])
        if result.get("created_channel"):
            await client.unlink("slide.channel", [result["channel_id"]])
        if result.get("created_partner"):
            await client.unlink("res.partner", [result["partner_id"]])
        rollback = {"generated_at": now(), "removed_slides": result.get("created_slides", []), "removed_channel": result.get("created_channel", False), "removed_partner": result.get("created_partner", False)}
        (args.state_dir / "matemateca-rollback.json").write_text(json.dumps(rollback, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(rollback, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
