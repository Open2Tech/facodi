#!/usr/bin/env python3
"""Configure and verify the guarded FACODI editorial create automation."""

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
AUTOMATION_ID = 1


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


async def read_automation(client: AsyncOdooClient) -> dict[str, Any]:
    fields = [
        "id",
        "name",
        "active",
        "trigger",
        "model_id",
        "trg_date_id",
        "trg_date_range",
        "trg_date_range_mode",
        "trg_date_range_type",
        "filter_domain",
        "action_server_ids",
    ]
    return (await client.read("base.automation", [AUTOMATION_ID], fields))[0]


async def main() -> None:
    args = parse_args()
    args.state_dir.mkdir(parents=True, exist_ok=True)
    async with AsyncOdooClient(load_config(target=args.target, env_file=args.env)) as client:
        current = await read_automation(client)
        plan = {
            "automation_id": AUTOMATION_ID,
            "current": current,
            "target": {"trigger": "on_create", "trg_date_id": False, "trg_date_range": 0},
            "reason": "The automation must run at record creation, not through a scheduled Created on trigger.",
        }
        if args.mode == "dry-run":
            print(json.dumps({"mode": args.mode, "plan": plan}, ensure_ascii=False, indent=2))
            return
        snapshot_path = args.state_dir / "editorial-automation-before.json"
        if args.mode == "snapshot":
            snapshot_path.write_text(json.dumps({"generated_at": now(), "automation": current, "writes_performed": False}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(json.dumps({"mode": args.mode, "snapshot": str(snapshot_path)}, indent=2))
            return
        if args.mode in {"apply", "rollback"} and args.confirm != CONFIRMATION:
            raise RuntimeError(f"Remote writes require --confirm {CONFIRMATION}")
        if args.mode == "apply":
            snapshot_path.write_text(json.dumps({"generated_at": now(), "automation": current, "writes_performed": False}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            await client.write("base.automation", [AUTOMATION_ID], {"trigger": "on_create", "trg_date_id": False, "trg_date_range": 0})
            result = {"generated_at": now(), "automation_id": AUTOMATION_ID, "before": current, "after": await read_automation(client), "snapshot": str(snapshot_path)}
            (args.state_dir / "editorial-automation-apply.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return
        if args.mode == "verify":
            print(json.dumps({"mode": args.mode, "automation": current, "expected_trigger": "on_create", "verified": current.get("trigger") == "on_create"}, ensure_ascii=False, indent=2))
            return
        result_path = args.state_dir / "editorial-automation-apply.json"
        if not result_path.exists():
            raise RuntimeError(f"Missing apply artifact: {result_path}")
        result = json.loads(result_path.read_text(encoding="utf-8"))
        before = result["before"]
        restore = {key: before[key] for key in ("trigger", "trg_date_id", "trg_date_range", "trg_date_range_mode", "trg_date_range_type") if key in before}
        await client.write("base.automation", [AUTOMATION_ID], restore)
        rollback = {"generated_at": now(), "automation_id": AUTOMATION_ID, "restored": restore}
        (args.state_dir / "editorial-automation-rollback.json").write_text(json.dumps(rollback, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(rollback, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
