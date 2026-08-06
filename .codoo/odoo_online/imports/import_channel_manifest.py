#!/usr/bin/env python3
"""Idempotently import a public channel manifest into FACODI proposals.

The manifest is deliberately source-neutral: playlist classification and
curriculum decisions remain explicit data reviewed by humans.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
from pathlib import Path
from typing import Any

from codoo.config import load_config
from codoo.odoo import AsyncOdooClient

CONFIRMATION = "APPLY-EDU-OPEN2"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("mode", choices=("dry-run", "apply"), nargs="?", default="dry-run")
    parser.add_argument("--target", default="online")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument("--confirm", default="")
    return parser.parse_args()


def fingerprint(url: str, playlist_id: str) -> str:
    return hashlib.sha256(f"{url}|{playlist_id}".encode()).hexdigest()


def load_manifest(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


async def main() -> None:
    args = parse_args()
    manifest = load_manifest(args.manifest)
    videos = []
    playlists = list(manifest.get("playlists", []))
    if manifest.get("playlist") and manifest.get("pilot_videos"):
        playlist = {
            **manifest["playlist"],
            "url": manifest["playlist"].get("url"),
            "classification": {
                "uc": manifest.get("curricular_classification", {}).get("suggested_area"),
                "confidence": "medium",
                "reason": manifest.get("curricular_classification", {}).get("reason"),
                "ects": None,
            },
        }
        playlists.append({"id": playlist["id"], "url": playlist["url"], "title": playlist.get("title"), "classification": playlist["classification"], "videos": manifest["pilot_videos"]})
    for playlist in playlists:
        for position, video in enumerate(playlist.get("videos", []), 1):
            video = {**video, "playlist": playlist, "position": position}
            videos.append(video)
    if args.mode == "apply" and args.confirm != CONFIRMATION:
        raise RuntimeError(f"Remote writes require --confirm {CONFIRMATION}")
    async with AsyncOdooClient(load_config(target=args.target, env_file=args.env), timeout=120) as client:
        plan = []
        for video in videos:
            existing = await client.search_read(
                "x_propostas_de_conteud",
                [("x_studio_canonical_url", "=", video["canonical_url"])],
                ["id", "x_name", "x_studio_editorial_state", "x_studio_source_fingerprint"],
                limit=5,
            )
            plan.append({"video": video, "existing": existing, "fingerprint": fingerprint(video["canonical_url"], video["playlist"]["id"])})
        if args.mode == "dry-run":
            print(json.dumps({"total": len(plan), "new": sum(not p["existing"] for p in plan), "reused": sum(bool(p["existing"]) for p in plan), "plan": plan}, ensure_ascii=False, indent=2))
            return
        created = []
        reused = []
        for item in plan:
            video = item["video"]
            playlist = video["playlist"]
            classification = playlist.get("classification", {})
            values = {
                "x_name": video["title"],
                "x_studio_source_url": video["canonical_url"],
                "x_studio_canonical_url": video["canonical_url"],
                "x_studio_source_fingerprint": item["fingerprint"],
                "x_studio_content_type": "video",
                "x_studio_source_description": video.get("description") or False,
                "x_studio_source_author": manifest["source"].get("channel_name") or manifest["source"].get("channel"),
                "x_studio_suggested_area": classification.get("uc") or False,
                "x_studio_playlist_url": playlist.get("url"),
                "x_studio_playlist_id": playlist["id"],
                "x_studio_playlist_position": video["position"],
                "x_studio_classification_confidence": classification.get("confidence") or "low",
                "x_studio_classification_justification": classification.get("reason") or "Revisão curricular necessária.",
                "x_studio_classification_origin": "source",
                "x_studio_suggested_order": video["position"],
                "x_studio_curriculum_ects_related": classification.get("ects") or False,
                "x_studio_transcript_available": bool(video.get("transcript")),
                "x_studio_captions_available": bool(video.get("captions")),
                "x_studio_import_status": "proposed",
                "x_studio_stage_id": 1,
                "x_studio_editorial_state": "received",
                "x_studio_consent_origin": True,
                "x_studio_attempt_count": 0,
            }
            if item["existing"]:
                reused.append(item["existing"][0]["id"])
                continue
            created.append(await client.create("x_propostas_de_conteud", values))
        print(json.dumps({"created": created, "reused": reused, "slides_created": 0}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
