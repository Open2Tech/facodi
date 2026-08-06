#!/usr/bin/env python3
"""Mark existing FACODI dynamic fields as Studio-exportable metadata."""

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
STATE_DIR = Path("odoo/facodi/.codoo/odoo_online/state")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("dry-run", "snapshot", "apply", "verify", "rollback"), nargs="?", default="dry-run")
    parser.add_argument("--target", default="online")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument("--confirm", default="")
    parser.add_argument("--state-dir", type=Path, default=STATE_DIR)
    return parser.parse_args()


def now() -> str:
    return datetime.now(UTC).isoformat()


async def build_plan(client: AsyncOdooClient) -> dict[str, Any]:
    fields = await client.search_read(
        "ir.model.fields",
        [
            ("name", "ilike", "x_studio_"),
            ("model", "in", ["slide.channel", "slide.slide"]),
        ],
        ["id", "name", "model", "field_description", "ttype"],
        limit=100,
        order="id",
    )
    metadata = await client.search_read(
        "ir.model.data",
        [("model", "=", "ir.model.fields"), ("res_id", "in", [item["id"] for item in fields])],
        ["id", "module", "name", "model", "res_id", "studio", "noupdate"],
        limit=100,
        order="id",
    )
    by_res_id = {item["res_id"]: item for item in metadata}
    operations = []
    for field in fields:
        existing = by_res_id.get(field["id"])
        external_name = f"facodi_{field['model'].replace('.', '_')}_{field['name']}"
        if existing:
            operations.append({"field": field, "metadata": existing, "action": "write" if not existing.get("studio") else "keep", "values": {"studio": True}})
        else:
            operations.append({
                "field": field,
                "metadata": None,
                "action": "create",
                "values": {
                    "module": "studio_customization",
                    "name": external_name,
                    "model": "ir.model.fields",
                    "res_id": field["id"],
                    "studio": True,
                    "noupdate": False,
                },
            })
    return {"field_count": len(fields), "operations": operations, "studio_metadata_count": len(metadata)}


async def main() -> None:  # noqa: C901
    args = parse_args()
    args.state_dir.mkdir(parents=True, exist_ok=True)
    async with AsyncOdooClient(load_config(target=args.target, env_file=args.env)) as client:
        plan = await build_plan(client)
        if args.mode == "dry-run":
            print(json.dumps({"mode": args.mode, "plan": plan}, ensure_ascii=False, indent=2))
            return
        snapshot_path = args.state_dir / "studio-fields-before.json"
        if args.mode == "snapshot":
            snapshot_path.write_text(json.dumps({"generated_at": now(), "plan": plan, "writes_performed": False}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(json.dumps({"mode": args.mode, "snapshot": str(snapshot_path)}, indent=2))
            return
        if args.mode in {"apply", "rollback"} and args.confirm != CONFIRMATION:
            raise RuntimeError(f"Remote writes require --confirm {CONFIRMATION}")
        if args.mode == "apply":
            snapshot_path.write_text(json.dumps({"generated_at": now(), "plan": plan, "writes_performed": False}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            created = []
            updated = []
            for operation in plan["operations"]:
                if operation["action"] == "create":
                    record_id = await client.create("ir.model.data", operation["values"], context={"studio": True})
                    created.append({"id": record_id, "res_id": operation["field"]["id"]})
                elif operation["action"] == "write":
                    await client.write("ir.model.data", [operation["metadata"]["id"]], operation["values"], context={"studio": True})
                    updated.append(operation["metadata"]["id"])
            result = {"generated_at": now(), "created": created, "updated": updated, "snapshot": str(snapshot_path)}
            (args.state_dir / "studio-fields-apply.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return
        if args.mode == "verify":
            verified = await build_plan(client)
            missing = [item["field"]["name"] for item in verified["operations"] if item["action"] not in {"keep", "write"}]
            not_studio = [item["field"]["name"] for item in verified["operations"] if item.get("metadata") and not item["metadata"].get("studio")]
            print(json.dumps({"mode": args.mode, "field_count": verified["field_count"], "missing": missing, "not_studio": not_studio, "verified": not missing and not not_studio}, ensure_ascii=False, indent=2))
            return
        path = args.state_dir / "studio-fields-apply.json"
        if not path.exists():
            raise RuntimeError(f"Missing apply artifact: {path}")
        result = json.loads(path.read_text(encoding="utf-8"))
        if result.get("created"):
            await client.unlink("ir.model.data", [item["id"] for item in result["created"]])
        rollback = {"generated_at": now(), "removed": result.get("created", []), "updated_not_reverted": result.get("updated", [])}
        (args.state_dir / "studio-fields-rollback.json").write_text(json.dumps(rollback, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(rollback, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
