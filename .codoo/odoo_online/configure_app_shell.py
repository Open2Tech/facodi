#!/usr/bin/env python3
"""Create the evidence-backed FACODI Content Studio backend menu shell."""

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
ROOT_NAME = "FACODI Content Studio"
MENU_SPECS = (
    ("Cursos", "slide.channel", 10),
    ("Conteudos", "slide.slide", 20),
    ("Minhas atividades", "mail.activity", 30),
    ("Agentes de IA", "ai.agent", 40),
    ("Topicos de IA", "ai.topic", 50),
)


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
    models = await client.search_read("ir.model", [("model", "in", [item[1] for item in MENU_SPECS])], ["id", "model"], limit=20)
    model_ids = {item["model"]: item["id"] for item in models}
    missing = [model for _, model, _ in MENU_SPECS if model not in model_ids]
    if missing:
        raise RuntimeError(f"Missing standard models: {missing}")
    root = await client.search_read("ir.ui.menu", [("name", "=", ROOT_NAME), ("parent_id", "=", False)], ["id", "name", "parent_id"], limit=2)
    children = await client.search_read("ir.ui.menu", [("name", "in", [item[0] for item in MENU_SPECS])], ["id", "name", "parent_id", "action", "sequence"], limit=100)
    actions = await client.search_read("ir.actions.act_window", [("name", "in", [f"FACODI - {item[0]}" for item in MENU_SPECS])], ["id", "name", "res_model", "view_mode"], limit=100)
    return {"root": root[0] if root else None, "children": children, "actions": actions, "models": model_ids}


async def main() -> None:  # noqa: C901
    args = parse_args()
    args.state_dir.mkdir(parents=True, exist_ok=True)
    config = load_config(target=args.target, env_file=args.env)
    async with AsyncOdooClient(config) as client:
        plan = await build_plan(client)
        if args.mode == "dry-run":
            print(json.dumps({"mode": args.mode, "plan": plan, "operations": len(MENU_SPECS) + 1}, ensure_ascii=True, indent=2))
            return
        if args.mode == "snapshot":
            path = args.state_dir / "app-shell-before.json"
            path.write_text(json.dumps({"generated_at": now(), "connection": client.config.public_odoo(), "plan": plan, "writes_performed": False}, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
            print(json.dumps({"mode": args.mode, "snapshot": str(path)}, indent=2))
            return
        if args.mode in {"apply", "rollback"} and args.confirm != CONFIRMATION:
            raise RuntimeError(f"Remote writes require --confirm {CONFIRMATION}")
        if args.mode == "apply":
            snapshot_path = args.state_dir / "app-shell-before.json"
            snapshot_path.write_text(json.dumps({"generated_at": now(), "connection": client.config.public_odoo(), "plan": plan, "writes_performed": False}, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
            root_id = plan["root"]["id"] if plan["root"] else await client.create("ir.ui.menu", {"name": ROOT_NAME, "sequence": 10})
            existing_actions = {item["name"]: item for item in plan["actions"]}
            action_ids = {}
            created_actions = []
            for name, model, _sequence in MENU_SPECS:
                action_name = f"FACODI - {name}"
                existing = existing_actions.get(action_name)
                if existing:
                    action_ids[name] = existing["id"]
                    continue
                action_id = await client.create("ir.actions.act_window", {"name": action_name, "type": "ir.actions.act_window", "res_model": model, "view_mode": "list,form", "context": "{}", "target": "current"})
                action_ids[name] = action_id
                created_actions.append(action_id)
            existing_children = {item["name"]: item for item in plan["children"]}
            created_menus = []
            for name, _model, sequence in MENU_SPECS:
                if name in existing_children:
                    continue
                menu_id = await client.create("ir.ui.menu", {"name": name, "parent_id": root_id, "sequence": sequence, "action": f"ir.actions.act_window,{action_ids[name]}"})
                created_menus.append(menu_id)
            result = {"generated_at": now(), "root_id": root_id, "created_actions": created_actions, "created_menus": created_menus, "snapshot": str(snapshot_path)}
            path = args.state_dir / "app-shell-apply.json"
            path.write_text(json.dumps(result, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
            print(json.dumps(result, indent=2))
            return
        if args.mode == "verify":
            verified = await build_plan(client)
            print(json.dumps({"mode": args.mode, "root": verified["root"], "children": verified["children"], "actions": verified["actions"]}, ensure_ascii=True, indent=2))
            return
        path = args.state_dir / "app-shell-apply.json"
        if not path.exists():
            raise RuntimeError(f"Missing apply artifact: {path}")
        result = json.loads(path.read_text(encoding="utf-8"))
        if result.get("created_menus"):
            await client.unlink("ir.ui.menu", result["created_menus"])
        if result.get("created_actions"):
            await client.unlink("ir.actions.act_window", result["created_actions"])
        rollback = {"generated_at": now(), "created_menus": result.get("created_menus", []), "created_actions": result.get("created_actions", [])}
        path = args.state_dir / "app-shell-rollback.json"
        path.write_text(json.dumps(rollback, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({"mode": args.mode, "rollback": rollback}, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
