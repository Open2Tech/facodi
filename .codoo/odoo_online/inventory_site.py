#!/usr/bin/env python3
"""Inventory the FACODI source theme and an Odoo Online website.

This script is intentionally read-only against Odoo. It produces a redacted
inventory and an API-only migration plan; it never calls create, write, unlink,
or execute a server action remotely.

Run from the Codoo workspace so the installed ``codoo`` package is available:

    .venv/bin/python odoo/facodi/.codoo/odoo_online/inventory_site.py \
        --target online --env .env
"""

from __future__ import annotations

import argparse
import ast
import asyncio
import hashlib
import json
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from codoo.config import load_config
from codoo.odoo import AsyncOdooClient

READ_ONLY_METHODS = {
    "search",
    "search_count",
    "search_read",
    "read",
    "fields_get",
    "check_access_rights",
}

REMOTE_MODELS = (
    "website",
    "website.page",
    "website.menu",
    "ir.ui.view",
    "ir.asset",
    "ir.attachment",
    "ir.model.fields",
    "slide.channel",
    "slide.slide",
)

PLAN = [
    {
        "id": "ONLINE-001",
        "title": "Reconcile websites and homepage ownership",
        "priority": "P0",
        "api_surface": ["website", "website.page"],
        "action": "Choose the FACODI website record, archive or redirect duplicate homepage records, and preserve the existing site as a rollback snapshot before applying changes.",
        "acceptance": "Exactly one active FACODI homepage is selected for the target website and the original page architecture is stored locally with a checksum.",
    },
    {
        "id": "ONLINE-002",
        "title": "Port FACODI homepage through website.page",
        "priority": "P0",
        "api_surface": ["website.page", "ir.ui.view"],
        "action": "Translate the source homepage QWeb into an API-safe website page architecture. Keep the Website Builder content zone, use only standard website models, and preserve a local rollback copy.",
        "acceptance": "The Online homepage renders the FACODI hero, learning dashboard, course fallback, journey cards, manifesto, institutional sections, and footer without a custom Python module.",
    },
    {
        "id": "ONLINE-003",
        "title": "Rebuild menus without hardcoded theme inheritance",
        "priority": "P0",
        "api_surface": ["website.menu"],
        "action": "Create or update only the menus belonging to the selected FACODI website, preserving backend-managed hierarchy, routes, sequences, and rollback mappings.",
        "acceptance": "Header navigation contains the approved FACODI routes once, has no duplicate website menu tree, and remains editable in Website settings.",
    },
    {
        "id": "ONLINE-004",
        "title": "Port visual tokens and frontend assets",
        "priority": "P0",
        "api_surface": ["ir.attachment", "ir.asset", "ir.ui.view"],
        "action": "Probe write capabilities first. Prefer public attachments plus website asset records when allowed; otherwise use Website Builder custom CSS and Studio-managed snippets. Do not assume arbitrary module static paths exist on Odoo Online.",
        "acceptance": "FACODI tokens, typography, responsive rules, focus states, and card layouts render without the old CSS fallback and can be rolled back by attachment/asset IDs.",
    },
    {
        "id": "ONLINE-005",
        "title": "Port native website and eLearning surfaces",
        "priority": "P1",
        "api_surface": ["ir.ui.view", "website.page", "website.menu"],
        "action": "Replace Python QWeb inheritance with API-managed page/view customizations only where the Online instance permits it. Keep website_slides routes native and use Website Builder/Studio for catalog and course presentation.",
        "acceptance": "Catalog, search, login, error pages, course cards, footer, and mobile navigation match the source contract without controllers or addon-only XML dependencies.",
    },
    {
        "id": "ONLINE-006",
        "title": "Map FACODI content fields to Studio fields",
        "priority": "P1",
        "api_surface": ["ir.model.fields", "slide.channel", "slide.slide"],
        "action": "Create x_studio fields only after capability and naming review. Map collection type, publishing partner, source key, editorial state, and display metadata without pretending that Python methods, ACLs, or cron from facodi_content were migrated.",
        "acceptance": "Studio fields are documented, namespaced, visible in the intended forms, and all API writes use whitelisted fields with a rollback manifest.",
    },
    {
        "id": "ONLINE-007",
        "title": "Create API migration and rollback manifests",
        "priority": "P1",
        "api_surface": [
            "website",
            "website.page",
            "website.menu",
            "ir.ui.view",
            "ir.asset",
            "ir.attachment",
        ],
        "action": "Generate stable source-to-target mappings, before/after hashes, external references, and an explicit dry-run/apply/verify workflow. No destructive operation is allowed without a user-approved apply step.",
        "acceptance": "Every write has an idempotency key, an existing-record mapping, a redacted before snapshot, and a rollback operation or manual recovery note.",
    },
    {
        "id": "ONLINE-008",
        "title": "Verify visual parity at five breakpoints",
        "priority": "P1",
        "api_surface": ["browser", "website.page", "ir.asset"],
        "action": "Run public browser smoke tests at 390x844, 768x1024, 1024x768, 1440x1000, and 1920x1080. Compare screenshots and DOM contracts against the source branch.",
        "acceptance": "No horizontal overflow, missing Passo 02, stale English shell labels, duplicate menus, CSS error banner, or broken public route remains.",
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", default="online")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("odoo/facodi/.codoo/odoo_online/inventory"),
    )
    parser.add_argument("--limit", type=int, default=500)
    return parser.parse_args()


def json_value(value: Any) -> Any:
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, (list, tuple)):
        return [json_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): json_value(item) for key, item in value.items()}
    return str(value)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_inventory(script_path: Path) -> dict[str, Any]:
    repo_root = script_path.resolve().parents[2]
    theme_root = repo_root / "addons/theme_facodi"
    manifest_path = theme_root / "__manifest__.py"
    manifest = ast.literal_eval(manifest_path.read_text(encoding="utf-8"))
    files = []
    for path in sorted(theme_root.rglob("*")):
        if not path.is_file() or "__pycache__" in path.parts:
            continue
        relative = path.relative_to(repo_root).as_posix()
        files.append({"path": relative, "sha256": sha256(path), "bytes": path.stat().st_size})
    homepage = (theme_root / "views/homepage.xml").read_text(encoding="utf-8")
    scss = (theme_root / "static/src/scss/facodi_frontend.scss").read_text(encoding="utf-8")
    return {
        "repo": str(repo_root),
        "branch": "odoo-online",
        "module": "theme_facodi",
        "manifest": {
            "version": manifest.get("version"),
            "depends": manifest.get("depends", []),
            "data": manifest.get("data", []),
            "assets": manifest.get("assets", {}),
        },
        "files": files,
        "homepage_sections": re.findall(r'data-name="([^"]+)"', homepage),
        "frontend_tokens": re.findall(r"--(facodi-[a-z0-9-]+):", scss),
        "source_contract": {
            "homepage_contains_builder_zone": "oe_structure" in homepage,
            "homepage_contains_dashboard": "facodi-dashboard" in homepage,
            "homepage_contains_journey": "FACODI Journey" in homepage,
            "homepage_contains_footer_routes": [
                "/slides",
                "/sobre",
                "/manifesto",
                "/comunidade",
                "/roadmap",
                "/como-contribuir",
            ],
        },
    }


async def available_fields(client: AsyncOdooClient, model: str) -> set[str]:
    try:
        return set((await client.fields_get(model)).keys())
    except Exception as exc:
        return {"_error": f"{type(exc).__name__}: {exc}"}


async def read_model(
    client: AsyncOdooClient,
    model: str,
    domain: list[Any],
    requested_fields: list[str],
    limit: int,
) -> dict[str, Any]:
    fields = await available_fields(client, model)
    if "_error" in fields:
        return {"model": model, "error": fields["_error"], "records": []}
    selected = [field for field in requested_fields if field in fields]
    try:
        records = await client.search_read(model, domain, selected, limit=limit, order="id")
    except Exception as exc:
        return {
            "model": model,
            "fields": selected,
            "error": f"{type(exc).__name__}: {exc}",
            "records": [],
        }
    return {"model": model, "fields": selected, "records": json_value(records)}


async def access_inventory(client: AsyncOdooClient) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for model in REMOTE_MODELS:
        fields = await available_fields(client, model)
        rights = {}
        if "_error" not in fields:
            for operation in ("read", "write", "create", "unlink"):
                try:
                    rights[operation] = bool(
                        await client.call(
                            model,
                            "check_access_rights",
                            [operation],
                            {"raise_exception": False},
                        )
                    )
                except Exception as exc:
                    rights[operation] = f"{type(exc).__name__}: {exc}"
        result[model] = {
            "field_count": len(fields) if "_error" not in fields else 0,
            "has_fields_get": "_error" not in fields,
            "rights_as_current_user": rights,
        }
    return result


async def remote_inventory(client: AsyncOdooClient, limit: int) -> dict[str, Any]:
    website_records = await client.search_read(
        "website",
        [("domain", "=", "https://edu-open2.odoo.com")],
        ["id", "name", "domain"],
        limit=10,
    )
    website_id = website_records[0]["id"] if website_records else 2
    inventory: dict[str, Any] = {
        "access": await access_inventory(client),
        "models": {},
    }
    requests = {
        "website": ([], ["id", "name", "domain", "theme_id", "homepage_url", "company_id"]),
        "website.page": ([], ["id", "name", "url", "key", "is_published", "view_id", "website_id"]),
        "website.menu": (
            [],
            ["id", "name", "url", "parent_id", "sequence", "website_id", "active"],
        ),
        "ir.ui.view": (
            [
                ("type", "=", "qweb"),
                "|",
                ("website_id", "=", website_id),
                (
                    "key",
                    "in",
                    [
                        "codoo.facodi_online.header",
                        "codoo.facodi_online.footer",
                        "codoo.facodi_online.assets",
                    ],
                ),
            ],
            [
                "id",
                "name",
                "key",
                "type",
                "mode",
                "inherit_id",
                "website_id",
                "active",
                "priority",
                "arch_db",
            ],
        ),
        "ir.asset": ([], ["id", "name", "bundle", "directive", "path", "active", "website_id"]),
        "ir.attachment": (
            [("type", "=", "binary")],
            [
                "id",
                "name",
                "url",
                "mimetype",
                "public",
                "website_id",
                "checksum",
                "res_model",
                "res_id",
            ],
        ),
        "ir.model.fields": (
            [("model", "in", ["slide.channel", "slide.slide"]), ("name", "like", "x_studio_%")],
            ["id", "name", "field_description", "model", "ttype", "required", "readonly"],
        ),
        "slide.channel": (
            [],
            [
                "id",
                "name",
                "website_published",
                "visibility",
                "channel_type",
                "total_slides",
                "description_short",
            ],
        ),
        "slide.slide": (
            [],
            [
                "id",
                "name",
                "channel_id",
                "slide_category",
                "website_published",
                "url",
                "is_preview",
            ],
        ),
    }
    for model, (domain, fields) in requests.items():
        inventory["models"][model] = await read_model(client, model, domain, fields, limit)

    views = inventory["models"]["ir.ui.view"].get("records", [])
    summarized_views = []
    for view in views:
        arch = view.pop("arch_db", None)
        if arch is not None:
            view["arch_sha256"] = hashlib.sha256(str(arch).encode("utf-8")).hexdigest()
            view["arch_bytes"] = len(str(arch).encode("utf-8"))
        summarized_views.append(view)
    inventory["models"]["ir.ui.view"]["records"] = summarized_views
    return inventory


def build_plan(source: dict[str, Any], remote: dict[str, Any]) -> dict[str, Any]:
    websites = remote["models"].get("website", {}).get("records", [])
    pages = remote["models"].get("website.page", {}).get("records", [])
    menus = remote["models"].get("website.menu", {}).get("records", [])
    return {
        "source": source["source_contract"],
        "remote_facts": {
            "website_count": len(websites),
            "website_names": [item.get("name") for item in websites],
            "homepage_page_count": sum(item.get("url") == "/" for item in pages),
            "menu_count": len(menus),
            "facodi_qweb_view_count": sum(
                "facodi" in str(item).lower()
                for item in remote["models"].get("ir.ui.view", {}).get("records", [])
            ),
            "studio_field_count": len(
                remote["models"].get("ir.model.fields", {}).get("records", [])
            ),
        },
        "constraints": [
            "Odoo Online cannot install the Python theme/content addons or their controllers, cron, ACLs, and QWeb inheritance files.",
            "Every remote write must use JSON-RPC/API, be idempotent, preserve a before snapshot, and have a rollback mapping.",
            "The Website Builder zone and standard website_slides routes must remain editable and functional.",
            "Studio fields may represent data, but cannot reproduce arbitrary Python methods or record rules from facodi_content.",
        ],
        "implementation_order": PLAN,
        "completion_gate": [
            "Inventory reviewed and target website selected.",
            "Dry-run shows only intended website/page/menu/view/asset/attachment operations.",
            "Apply runs only after explicit approval and creates a local rollback manifest.",
            "Public browser parity verified at 390x844, 768x1024, 1024x768, 1440x1000, and 1920x1080.",
            "No CSS fallback, duplicate homepage, duplicate menu tree, broken route, or inaccessible primary action remains.",
        ],
    }


def render_markdown(inventory: dict[str, Any], plan: dict[str, Any]) -> str:
    remote = inventory["remote"]
    websites = remote["models"].get("website", {}).get("records", [])
    pages = remote["models"].get("website.page", {}).get("records", [])
    menus = remote["models"].get("website.menu", {}).get("records", [])
    lines = [
        "# FACODI Odoo Online Migration Inventory",
        "",
        f"Generated: `{inventory['generated_at']}`",
        f"Target: `{inventory['connection']['host']}` / database `{inventory['connection']['db']}`",
        "",
        "## Safety",
        "",
        "This artifact was generated by read-only JSON-RPC calls. It contains no password, token, cookie, page architecture, or attachment binary. No remote write is performed by the inventory script.",
        "",
        "## Remote baseline",
        "",
        f"- Websites: **{len(websites)}**",
        f"- Homepage records (`/`): **{sum(item.get('url') == '/' for item in pages)}**",
        f"- Menus: **{len(menus)}**",
        f"- QWeb views inspected: **{len(remote['models'].get('ir.ui.view', {}).get('records', []))}**",
        f"- FACODI QWeb views detected: **{plan['remote_facts']['facodi_qweb_view_count']}**",
        f"- Studio fields on slide models: **{plan['remote_facts']['studio_field_count']}**",
        "",
        "### Websites",
        "",
    ]
    lines.extend(
        f"- `{item.get('id')}` {item.get('name')} — `{item.get('domain')}`" for item in websites
    )
    lines.extend(["", "### Homepage records", ""])
    lines.extend(
        f"- `{item.get('id')}` `{item.get('url')}` — {item.get('name')} — key `{item.get('key')}`"
        for item in pages
        if item.get("url") == "/"
    )
    lines.extend(["", "### Menus", ""])
    lines.extend(
        f"- `{item.get('id')}` {item.get('name')} → `{item.get('url')}` (website `{item.get('website_id')}`)"
        for item in menus
    )
    lines.extend(["", "## Source visual contract", ""])
    lines.append(f"- Homepage sections: {', '.join(inventory['source']['homepage_sections'])}")
    lines.append(f"- FACODI tokens: {', '.join(inventory['source']['frontend_tokens'])}")
    lines.extend(["", "## Implementation backlog", ""])
    for item in plan["implementation_order"]:
        lines.extend(
            [
                f"### {item['id']} — {item['title']} ({item['priority']})",
                "",
                f"API surface: `{', '.join(item['api_surface'])}`",
                "",
                item["action"],
                "",
                f"Acceptance: {item['acceptance']}",
                "",
            ]
        )
    lines.extend(["## Odoo Online boundary", ""])
    lines.extend(f"- {constraint}" for constraint in plan["constraints"])
    lines.extend(["", "## Completion gate", ""])
    lines.extend(f"- {gate}" for gate in plan["completion_gate"])
    return "\n".join(lines) + "\n"


async def main() -> None:
    args = parse_args()
    config = load_config(target=args.target, env_file=args.env)
    source = source_inventory(Path(__file__))
    async with AsyncOdooClient(config) as client:
        remote = await remote_inventory(client, args.limit)
    inventory = {
        "generated_at": datetime.now(UTC).isoformat(),
        "connection": config.public_odoo(),
        "source": source,
        "remote": remote,
    }
    plan = build_plan(source, remote)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "inventory.json").write_text(
        json.dumps(inventory, ensure_ascii=True, indent=2) + "\n", encoding="utf-8"
    )
    (args.output / "migration-plan.json").write_text(
        json.dumps(plan, ensure_ascii=True, indent=2) + "\n", encoding="utf-8"
    )
    (args.output / "migration-plan.md").write_text(
        render_markdown(inventory, plan), encoding="utf-8"
    )
    print(json.dumps({"output": str(args.output), "connection": config.public_odoo()}, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
