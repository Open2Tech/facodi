#!/usr/bin/env python3
"""Configure the FACODI Knowledge source for the Odoo AI agent."""

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
AGENT_ID = 4
ARTICLE_NAME = "Manual Editorial FACODI"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("dry-run", "snapshot", "apply", "verify", "rollback"), nargs="?", default="dry-run")
    parser.add_argument("--target", default="online")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument("--confirm", default="")
    parser.add_argument("--state-dir", type=Path, default=Path("odoo/facodi/.codoo/odoo_online/state"))
    return parser.parse_args()


def now() -> str:
    return datetime.now(UTC).isoformat()


async def build_plan(client: AsyncOdooClient) -> dict[str, Any]:
    articles = await client.search_read(
        "knowledge.article",
        [("name", "=", ARTICLE_NAME)],
        ["id", "name", "active"],
        limit=5,
        order="id desc",
    )
    if not articles:
        raise RuntimeError(f"Missing Knowledge article: {ARTICLE_NAME}")
    sources = await client.search_read(
        "ai.agent.source",
        [("agent_id", "=", AGENT_ID), ("article_id", "=", articles[0]["id"])],
        ["id", "name", "agent_id", "article_id", "type", "status", "is_active", "error_details"],
        limit=5,
        order="id",
    )
    return {
        "agent_id": AGENT_ID,
        "article": articles[0],
        "existing_sources": sources,
        "values": {"agent_id": AGENT_ID, "article_id": articles[0]["id"], "name": ARTICLE_NAME, "is_active": True},
    }


async def main() -> None:  # noqa: C901
    args = parse_args()
    args.state_dir.mkdir(parents=True, exist_ok=True)
    config = load_config(target=args.target, env_file=args.env)
    async with AsyncOdooClient(config) as client:
        plan = await build_plan(client)
        if args.mode == "dry-run":
            print(json.dumps({"mode": args.mode, "plan": plan}, ensure_ascii=False, indent=2))
            return
        snapshot_path = args.state_dir / "ai-source-before.json"
        if args.mode == "snapshot":
            snapshot_path.write_text(json.dumps({"generated_at": now(), "plan": plan, "writes_performed": False}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(json.dumps({"mode": args.mode, "snapshot": str(snapshot_path)}, indent=2))
            return
        if args.mode in {"apply", "rollback"} and args.confirm != CONFIRMATION:
            raise RuntimeError(f"Remote writes require --confirm {CONFIRMATION}")
        if args.mode == "apply":
            snapshot_path.write_text(json.dumps({"generated_at": now(), "plan": plan, "writes_performed": False}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            if plan["existing_sources"]:
                source_id = plan["existing_sources"][0]["id"]
                created = False
            else:
                await client.call("ai.agent.source", "create_from_articles", [[plan["article"]["id"]], AGENT_ID])
                created_sources = await client.search_read(
                    "ai.agent.source",
                    [("agent_id", "=", AGENT_ID), ("article_id", "=", plan["article"]["id"])],
                    ["id"],
                    limit=5,
                    order="id desc",
                )
                if not created_sources:
                    raise RuntimeError("create_from_articles returned no source")
                source_id = created_sources[0]["id"]
                created = True
            after = await client.read("ai.agent.source", [source_id], ["id", "name", "agent_id", "article_id", "type", "status", "is_active", "error_details"])
            result = {"generated_at": now(), "source_id": source_id, "created": created, "after": after, "snapshot": str(snapshot_path)}
            path = args.state_dir / "ai-source-apply.json"
            path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return
        if args.mode == "verify":
            verified = await build_plan(client)
            if verified["existing_sources"]:
                source_id = verified["existing_sources"][0]["id"]
                source = await client.read("ai.agent.source", [source_id], ["id", "name", "agent_id", "article_id", "type", "status", "is_active", "error_details"])
            else:
                source = []
            print(json.dumps({"mode": args.mode, "verified": bool(source), "source": source}, ensure_ascii=False, indent=2))
            return
        path = args.state_dir / "ai-source-apply.json"
        if not path.exists():
            raise RuntimeError(f"Missing apply artifact: {path}")
        result = json.loads(path.read_text(encoding="utf-8"))
        if result.get("created"):
            await client.unlink("ai.agent.source", [result["source_id"]])
        rollback = {"generated_at": now(), "source_id": result.get("source_id"), "removed": bool(result.get("created"))}
        (args.state_dir / "ai-source-rollback.json").write_text(json.dumps(rollback, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(rollback, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
