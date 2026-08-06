#!/usr/bin/env python3
"""Port the FACODI visual contract to Odoo Online through JSON-RPC.

The default mode is ``dry-run``. ``apply`` is intentionally gated by an exact
confirmation string, writes a local rollback snapshot first, and never deletes
remote records. ``rollback`` restores only records recorded by a prior apply.
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import hashlib
import json
from copy import deepcopy
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from lxml import etree

from codoo.config import load_config
from codoo.odoo import AsyncOdooClient

CONFIRMATION = "APPLY-EDU-OPEN2"
SOURCE_RELATIVE = Path("addons/theme_facodi")
MENU_SPECS = (
    ("Home", "/", 10),
    ("Cursos", "/slides", 20),
    ("Sobre a FACODI", "/sobre", 30),
    ("Manifesto", "/manifesto", 40),
    ("Comunidade", "/comunidade", 50),
    ("Roadmap", "/roadmap", 60),
    ("Como contribuir", "/como-contribuir", 70),
    ("Contato", "/contactus", 80),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "mode", choices=("dry-run", "apply", "verify", "rollback"), nargs="?", default="dry-run"
    )
    parser.add_argument("--target", default="online")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument("--website-id", type=int)
    parser.add_argument("--confirm", default="")
    parser.add_argument(
        "--remove-extra-menus",
        action="store_true",
        help="Unlink website menus that are outside the FACODI source contract.",
    )
    parser.add_argument(
        "--state-dir",
        type=Path,
        default=Path("odoo/facodi/.codoo/odoo_online/state"),
    )
    return parser.parse_args()


def xml_tree(path: Path) -> etree._ElementTree:
    return etree.parse(path)


def template(tree: etree._ElementTree, template_id: str) -> etree._Element:
    result = tree.xpath(f"//template[@id='{template_id}']")
    if not result:
        raise ValueError(f"Template not found: {template_id}")
    return result[0]


def child_xml(field: etree._Element) -> str:
    children = list(field)
    if not children:
        return (field.text or "").strip()
    return etree.tostring(children[0], encoding="unicode")


def record_arch(path: Path, record_id: str) -> dict[str, Any]:
    tree = xml_tree(path)
    record = tree.xpath(f"//record[@id='{record_id}']")[0]
    values: dict[str, Any] = {}
    for field in record.xpath("./field"):
        name = field.get("name")
        if name == "arch":
            values[name] = child_xml(field)
        elif name:
            values[name] = "".join(field.itertext()).strip()
    values["name"] = values.get("name") or record_id
    return values


def local_source(facodi_root: Path) -> dict[str, Any]:
    theme_root = facodi_root / SOURCE_RELATIVE
    homepage_tree = xml_tree(theme_root / "views/homepage.xml")
    replacement = homepage_tree.xpath(
        "//template[@id='facodi_homepage']/xpath[@expr=\"//div[@id='wrap']\"]/*[self::div]"
    )
    if len(replacement) != 1:
        raise ValueError("FACODI homepage replacement is not uniquely identifiable")
    homepage_root = etree.Element("t", name="Homepage", **{"t-name": "website.homepage"})
    website_call = etree.SubElement(
        homepage_root, "t", **{"t-call": "website.layout", "pageName.f": "homepage"}
    )
    website_call.append(deepcopy(replacement[0]))

    pages_tree = xml_tree(theme_root / "views/pages.xml")
    pages = []
    for record in pages_tree.xpath("//record[@model='website.page']"):
        values = {
            field.get("name"): child_xml(field)
            if field.get("name") == "arch"
            else "".join(field.itertext()).strip()
            for field in record.xpath("./field")
            if field.get("name")
        }
        values["source_id"] = record.get("id")
        pages.append(values)

    extension_views = []
    for filename, view_id, key in (
        ("header.xml", "facodi_header", "codoo.facodi_online.header"),
        ("footer.xml", "facodi_footer", "codoo.facodi_online.footer"),
    ):
        view = template(xml_tree(theme_root / "views" / filename), view_id)
        arch = etree.Element("data")
        for node in view.xpath("./xpath"):
            arch.append(deepcopy(node))
        extension_views.append(
            {
                "name": f"FACODI Online {filename.removesuffix('.xml').title()}",
                "key": key,
                "arch": etree.tostring(arch, encoding="unicode"),
            }
        )

    css = (theme_root / "static/src/scss/facodi_frontend.scss").read_text(encoding="utf-8")
    return {
        "homepage_arch": etree.tostring(homepage_root, encoding="unicode"),
        "pages": pages,
        "extension_views": extension_views,
        "css": css,
        "source_files": sorted(
            path.relative_to(facodi_root).as_posix()
            for path in theme_root.rglob("*")
            if path.is_file() and "__pycache__" not in path.parts
        ),
    }


def digest(value: Any) -> str:
    if isinstance(value, bytes):
        payload = value
    else:
        payload = json.dumps(value, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def summary(
    model: str, key: str, action: str, record_id: int | None, values: dict[str, Any]
) -> dict[str, Any]:
    public_values = {name: value for name, value in values.items() if name not in {"arch", "datas"}}
    return {
        "model": model,
        "key": key,
        "action": action,
        "record_id": record_id,
        "values_sha256": digest(values),
        "arch_sha256": digest(values["arch"]) if "arch" in values else None,
        "public_values": public_values,
    }


async def fields(client: AsyncOdooClient, model: str) -> set[str]:
    return set((await client.fields_get(model)).keys())


async def find_website(client: AsyncOdooClient, requested_id: int | None) -> dict[str, Any]:
    records = await client.search_read(
        "website", [], ["id", "name", "domain", "homepage_url"], limit=100, order="id"
    )
    if requested_id:
        matches = [record for record in records if record["id"] == requested_id]
    else:
        matches = [
            record
            for record in records
            if record.get("domain") == "https://edu-open2.odoo.com"
            or record.get("name") == "FACODI"
        ]
    if len(matches) != 1:
        raise RuntimeError(f"Expected one FACODI website, found {len(matches)}: {records}")
    return matches[0]


async def existing_by_url(client: AsyncOdooClient, website_id: int) -> dict[str, dict[str, Any]]:
    records = await client.search_read(
        "website.page",
        [("website_id", "=", website_id)],
        ["id", "name", "url", "key", "view_id", "arch"],
        limit=500,
        order="id",
    )
    return {record["url"]: record for record in records}


async def build_plan(  # noqa: C901
    client: AsyncOdooClient,
    website: dict[str, Any],
    source: dict[str, Any],
    *,
    remove_extra_menus: bool = False,
) -> dict[str, Any]:
    website_id = website["id"]
    pages = await existing_by_url(client, website_id)
    layout_views = await client.search_read(
        "ir.ui.view", [("key", "=", "website.layout")], ["id", "name", "key"], limit=10
    )
    if not layout_views:
        raise RuntimeError("Base website.layout view not found")
    layout_id = layout_views[0]["id"]
    extension_views = await client.search_read(
        "ir.ui.view",
        [
            ("website_id", "=", website_id),
            ("key", "in", [item["key"] for item in source["extension_views"]]),
        ],
        ["id", "key", "name", "arch"],
        limit=20,
    )
    extension_by_key = {view["key"]: view for view in extension_views}
    operations: list[dict[str, Any]] = []

    homepage = pages.get("/")
    if not homepage:
        raise RuntimeError("FACODI homepage record not found for the selected website")
    operations.append(
        summary(
            "website.page",
            "homepage",
            "write",
            homepage["id"],
            {"arch": source["homepage_arch"], "website_published": True},
        )
    )

    for page in source["pages"]:
        url = page["url"]
        values = {name: page[name] for name in ("name", "url", "key", "arch") if name in page}
        values.update(
            {
                "website_id": website_id,
                "is_published": True,
                "website_published": True,
                "type": "qweb",
            }
        )
        existing = pages.get(url)
        operations.append(
            summary(
                "website.page",
                url,
                "write" if existing else "create",
                existing["id"] if existing else None,
                values,
            )
        )

    root_menus = await client.search_read(
        "website.menu",
        [("website_id", "=", website_id), ("parent_id", "=", False)],
        ["id", "name", "url", "website_id"],
        limit=50,
        order="id",
    )
    root = next(
        (
            menu
            for menu in root_menus
            if menu.get("name", "").startswith("Menu superior") or menu.get("name") == "FACODI"
        ),
        None,
    )
    root_values = {
        "name": "FACODI",
        "url": "#",
        "website_id": website_id,
        "sequence": 0,
    }
    operations.append(
        summary(
            "website.menu",
            "facodi-root",
            "write" if root else "create",
            root["id"] if root else None,
            root_values,
        )
    )
    parent_id = root["id"] if root else None
    children = await client.search_read(
        "website.menu",
        [("website_id", "=", website_id)],
        ["id", "name", "url", "parent_id", "sequence"],
        limit=200,
        order="id",
    )
    for name, url, sequence in MENU_SPECS:
        existing = next(
            (
                menu
                for menu in children
                if menu.get("url") == url and menu.get("parent_id", [None])[0] == parent_id
            ),
            None,
        )
        values = {
            "name": name,
            "url": url,
            "sequence": sequence,
            "website_id": website_id,
        }
        if parent_id:
            values["parent_id"] = parent_id
        operations.append(
            summary(
                "website.menu",
                url,
                "write" if existing else "create",
                existing["id"] if existing else None,
                values,
            )
        )
    if remove_extra_menus and parent_id:
        for menu in children:
            if menu.get("url") == "/appointment" and menu.get("parent_id"):
                if menu["parent_id"][0] == parent_id:
                    operations.append(
                        summary(
                            "website.menu",
                            f"remove-extra:{menu['id']}",
                            "unlink",
                            menu["id"],
                            {
                                "url": menu["url"],
                                "name": menu["name"],
                                "website_id": website_id,
                            },
                        )
                    )

    for view in source["extension_views"]:
        values = {
            "name": view["name"],
            "key": view["key"],
            "type": "qweb",
            "mode": "extension",
            "inherit_id": layout_id,
            "website_id": website_id,
            "active": True,
            "arch": view["arch"],
        }
        existing = extension_by_key.get(view["key"])
        operations.append(
            summary(
                "ir.ui.view",
                view["key"],
                "write" if existing else "create",
                existing["id"] if existing else None,
                values,
            )
        )

    css_bytes = source["css"].encode("utf-8")
    operations.append(
        summary(
            "ir.attachment",
            "facodi-online.css",
            "create-or-update",
            None,
            {
                "name": "facodi-online.css",
                "mimetype": "text/css",
                "public": True,
                "website_id": website_id,
                "datas": base64.b64encode(css_bytes).decode("ascii"),
            },
        )
    )
    operations.append(
        summary(
            "ir.ui.view",
            "codoo.facodi_online.assets",
            "create-or-update",
            None,
            {
                "name": "FACODI Online Assets",
                "key": "codoo.facodi_online.assets",
                "type": "qweb",
                "mode": "extension",
                "inherit_id": layout_id,
                "website_id": website_id,
                "active": True,
                "arch": '<data><xpath expr="//head" position="inside"><link rel="stylesheet" href="/web/content/FACODI_ATTACHMENT_ID"/></xpath></data>',
            },
        )
    )
    return {
        "website": website,
        "operations": operations,
        "source_files": source["source_files"],
    }


async def read_existing(client: AsyncOdooClient, operation: dict[str, Any]) -> dict[str, Any]:
    model = operation["model"]
    record_id = operation.get("record_id")
    if not record_id and model == "ir.attachment":
        records = await client.search_read(
            model,
            [("name", "=", "facodi-online.css")],
            ["id", "name", "datas", "mimetype", "public", "website_id"],
            limit=1,
        )
        return {
            "model": model,
            "record_id": records[0]["id"] if records else None,
            "record": records[0] if records else None,
        }
    if not record_id and model == "ir.ui.view":
        records = await client.search_read(
            model,
            [("key", "=", operation["key"])],
            ["id", "name", "key", "type", "mode", "inherit_id", "website_id", "active", "arch"],
            limit=1,
        )
        return {
            "model": model,
            "record_id": records[0]["id"] if records else None,
            "record": records[0] if records else None,
        }
    if not record_id:
        return {"model": model, "record_id": None, "record": None}
    fields_map = {
        "website.page": [
            "id",
            "name",
            "url",
            "key",
            "view_id",
            "arch",
            "website_id",
            "is_published",
            "website_published",
        ],
        "website.menu": ["id", "name", "url", "parent_id", "sequence", "website_id"],
        "ir.ui.view": [
            "id",
            "name",
            "key",
            "type",
            "mode",
            "inherit_id",
            "website_id",
            "active",
            "arch",
        ],
    }
    available = await fields(client, model)
    selected = [field for field in fields_map.get(model, ["id"]) if field in available]
    records = await client.read(model, [record_id], selected)
    return {"model": model, "record_id": record_id, "record": records[0] if records else None}


async def apply_plan(  # noqa: C901
    client: AsyncOdooClient, plan: dict[str, Any], source: dict[str, Any], state_dir: Path
) -> dict[str, Any]:
    state_dir.mkdir(parents=True, exist_ok=True)
    rollback = {
        "generated_at": datetime.now(UTC).isoformat(),
        "website": plan["website"],
        "before": [],
        "created": [],
    }
    for operation in plan["operations"]:
        rollback["before"].append(await read_existing(client, operation))
    (state_dir / "rollback-before.json").write_text(
        json.dumps(rollback, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    results = []
    website_id = plan["website"]["id"]
    pages = await existing_by_url(client, website_id)
    layout_views = await client.search_read(
        "ir.ui.view", [("key", "=", "website.layout")], ["id"], limit=10
    )
    if not layout_views:
        raise RuntimeError("Base website.layout view not found during apply preflight")
    layout_id = layout_views[0]["id"]

    # Preflight all local source payloads before the first remote write.
    if not source["homepage_arch"] or not source["extension_views"] or not source["css"]:
        raise RuntimeError("Source visual contract is incomplete; refusing remote write")

    for operation in plan["operations"]:
        model = operation["model"]
        key = operation["key"]
        if key == "homepage":
            values = {
                "arch": source["homepage_arch"],
                "website_published": True,
                "is_published": True,
            }
            await client.write(model, [operation["record_id"]], values)
            results.append(
                {"model": model, "key": key, "id": operation["record_id"], "action": "write"}
            )
        elif model == "website.page" and key not in {"homepage"}:
            page = next((item for item in source["pages"] if item["url"] == key), None)
            values = {name: page[name] for name in ("name", "url", "key", "arch") if name in page}
            values.update(
                {
                    "website_id": website_id,
                    "is_published": True,
                    "website_published": True,
                    "type": "qweb",
                }
            )
            existing = pages.get(key)
            if existing:
                await client.write(model, [existing["id"]], values)
                results.append(
                    {"model": model, "key": key, "id": existing["id"], "action": "write"}
                )
            else:
                record_id = await client.create(model, values)
                rollback["created"].append({"model": model, "id": record_id})
                pages[key] = {"id": record_id, "url": key}
                results.append({"model": model, "key": key, "id": record_id, "action": "create"})
        elif model == "website.menu":
            menus = await client.search_read(
                "website.menu",
                [("website_id", "=", website_id)],
                ["id", "name", "url", "parent_id", "sequence"],
                limit=500,
                order="id",
            )
            root = next(
                (
                    menu
                    for menu in menus
                    if not menu.get("parent_id")
                    and menu.get("name") in {"FACODI", "Menu superior para o site 2"}
                ),
                None,
            )
            if key == "facodi-root":
                values = {"name": "FACODI", "url": "#", "website_id": website_id, "sequence": 0}
                if root:
                    await client.write(model, [root["id"]], values)
                    menu_id = root["id"]
                    action = "write"
                else:
                    menu_id = await client.create(model, values)
                    rollback["created"].append({"model": model, "id": menu_id})
                    root = {"id": menu_id, "name": "FACODI", "parent_id": False}
                    action = "create"
                results.append({"model": model, "key": key, "id": menu_id, "action": action})
            elif key.startswith("remove-extra:"):
                menu_id = operation["record_id"]
                await client.unlink(model, [menu_id])
                results.append({"model": model, "key": key, "id": menu_id, "action": "unlink"})
            else:
                if not root:
                    raise RuntimeError("FACODI menu root was not created before child menu apply")
                menu_values = next((spec for spec in MENU_SPECS if spec[1] == key), None)
                if not menu_values:
                    raise RuntimeError(f"Unknown menu operation: {key}")
                name, url, sequence = menu_values
                existing = next(
                    (
                        menu
                        for menu in menus
                        if menu.get("url") == url
                        and menu.get("parent_id")
                        and menu["parent_id"][0] == root["id"]
                    ),
                    None,
                )
                values = {
                    "name": name,
                    "url": url,
                    "sequence": sequence,
                    "website_id": website_id,
                    "parent_id": root["id"],
                }
                if key in pages:
                    values["page_id"] = pages[key]["id"]
                if existing:
                    await client.write(model, [existing["id"]], values)
                    menu_id = existing["id"]
                    action = "write"
                else:
                    menu_id = await client.create(model, values)
                    rollback["created"].append({"model": model, "id": menu_id})
                    action = "create"
                results.append({"model": model, "key": key, "id": menu_id, "action": action})
        elif model == "ir.ui.view":
            view_source = next(
                (view for view in source["extension_views"] if view["key"] == key), None
            )
            if key == "codoo.facodi_online.assets":
                continue
            if not view_source:
                raise RuntimeError(f"Missing local extension view: {key}")
            values = {
                "name": view_source["name"],
                "key": view_source["key"],
                "type": "qweb",
                "mode": "extension",
                "inherit_id": layout_id,
                "website_id": website_id,
                "active": True,
                "arch": view_source["arch"],
            }
            existing = await client.search_read(
                "ir.ui.view", [("key", "=", key), ("website_id", "=", website_id)], ["id"], limit=1
            )
            if existing:
                await client.write(model, [existing[0]["id"]], values)
                view_id = existing[0]["id"]
                action = "write"
            else:
                view_id = await client.create(model, values)
                rollback["created"].append({"model": model, "id": view_id})
                action = "create"
            results.append({"model": model, "key": key, "id": view_id, "action": action})
        elif model == "ir.attachment":
            css_bytes = source["css"].encode("utf-8")
            values = {
                "name": "facodi-online.css",
                "type": "binary",
                "mimetype": "text/css",
                "public": True,
                "website_id": website_id,
                "datas": base64.b64encode(css_bytes).decode("ascii"),
            }
            existing = await client.search_read(
                "ir.attachment",
                [("name", "=", "facodi-online.css"), ("website_id", "=", website_id)],
                ["id"],
                limit=1,
            )
            if existing:
                await client.write(model, [existing[0]["id"]], values)
                attachment_id = existing[0]["id"]
                action = "write"
            else:
                attachment_id = await client.create(model, values)
                rollback["created"].append({"model": model, "id": attachment_id})
                action = "create"
            results.append({"model": model, "key": key, "id": attachment_id, "action": action})
            asset_arch = f'<data><xpath expr="//head" position="inside"><link rel="stylesheet" href="/web/content/{attachment_id}"/></xpath></data>'
            asset_values = {
                "name": "FACODI Online Assets",
                "key": "codoo.facodi_online.assets",
                "type": "qweb",
                "mode": "extension",
                "inherit_id": layout_id,
                "website_id": website_id,
                "active": True,
                "arch": asset_arch,
            }
            existing_asset_view = await client.search_read(
                "ir.ui.view",
                [("key", "=", "codoo.facodi_online.assets"), ("website_id", "=", website_id)],
                ["id"],
                limit=1,
            )
            if existing_asset_view:
                await client.write("ir.ui.view", [existing_asset_view[0]["id"]], asset_values)
                asset_view_id = existing_asset_view[0]["id"]
                asset_action = "write"
            else:
                asset_view_id = await client.create("ir.ui.view", asset_values)
                rollback["created"].append({"model": "ir.ui.view", "id": asset_view_id})
                asset_action = "create"
            results.append(
                {
                    "model": "ir.ui.view",
                    "key": "codoo.facodi_online.assets",
                    "id": asset_view_id,
                    "action": asset_action,
                }
            )
        else:
            raise RuntimeError(f"Unsupported apply operation: {model}:{key}")
    (state_dir / "apply-result.json").write_text(
        json.dumps({"results": results}, indent=2) + "\n", encoding="utf-8"
    )
    return {"results": results, "rollback": str(state_dir / "rollback-before.json")}


async def verify(client: AsyncOdooClient, website_id: int) -> dict[str, Any]:
    pages = await client.search_read(
        "website.page",
        [
            ("website_id", "=", website_id),
            (
                "url",
                "in",
                ["/", "/sobre", "/manifesto", "/comunidade", "/roadmap", "/como-contribuir"],
            ),
        ],
        ["id", "url", "name", "is_published", "website_published", "arch"],
        limit=100,
        order="id",
    )
    return {
        "website_id": website_id,
        "pages": [
            {
                "id": page["id"],
                "url": page["url"],
                "has_facodi_hero": "facodi-hero" in (page.get("arch") or ""),
                "published": page.get("is_published") or page.get("website_published"),
            }
            for page in pages
        ],
    }


async def rollback(client: AsyncOdooClient, state_dir: Path) -> dict[str, Any]:
    rollback_path = state_dir / "rollback-before.json"
    apply_path = state_dir / "apply-result.json"
    if not rollback_path.exists() or not apply_path.exists():
        raise RuntimeError("Rollback state is incomplete; refusing implicit recovery")
    state = json.loads(rollback_path.read_text(encoding="utf-8"))
    applied = json.loads(apply_path.read_text(encoding="utf-8"))
    restored = []
    deleted = []
    restore_fields = {
        "website.page": {"name", "url", "key", "arch", "is_published", "website_published"},
        "website.menu": {"name", "url", "parent_id", "sequence", "website_id"},
        "ir.ui.view": {"name", "key", "type", "mode", "inherit_id", "website_id", "active", "arch"},
        "ir.attachment": {"name", "datas", "mimetype", "public", "website_id"},
    }
    for item in state.get("before", []):
        record = item.get("record")
        if not record or not item.get("record_id") or item["model"] not in restore_fields:
            continue
        values = {
            key: value
            for key, value in record.items()
            if key in restore_fields[item["model"]] and key != "id"
        }
        values = {
            key: value[0] if isinstance(value, list) and len(value) == 2 else value
            for key, value in values.items()
        }
        if values:
            current = await client.read(item["model"], [item["record_id"]], ["id"])
            if current:
                await client.write(item["model"], [item["record_id"]], values)
                restored.append(
                    {"model": item["model"], "id": item["record_id"], "action": "write"}
                )
            else:
                recreated_id = await client.create(item["model"], values)
                restored.append({"model": item["model"], "id": recreated_id, "action": "create"})
    for item in reversed(state.get("created", [])):
        await client.unlink(item["model"], [item["id"]])
        deleted.append(item)
    return {"restored": restored, "deleted": deleted, "apply_results": applied.get("results", [])}


async def main() -> None:
    args = parse_args()
    if args.mode == "apply" and args.confirm != CONFIRMATION:
        raise SystemExit(f"Refusing remote write. Pass --confirm {CONFIRMATION} explicitly.")
    facodi_root = Path(__file__).resolve().parents[2]
    source = local_source(facodi_root)
    config = load_config(args.target, args.env)
    async with AsyncOdooClient(config) as client:
        website = await find_website(client, args.website_id)
        if args.mode == "rollback":
            if args.confirm != CONFIRMATION:
                raise SystemExit(f"Refusing rollback. Pass --confirm {CONFIRMATION} explicitly.")
            print(json.dumps(await rollback(client, args.state_dir), ensure_ascii=False, indent=2))
            return
        plan = await build_plan(
            client,
            website,
            source,
            remove_extra_menus=args.remove_extra_menus,
        )
        args.state_dir.mkdir(parents=True, exist_ok=True)
        (args.state_dir / "migration-plan.json").write_text(
            json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        if args.mode == "dry-run":
            print(
                json.dumps(
                    {
                        "mode": args.mode,
                        "website": website,
                        "operation_count": len(plan["operations"]),
                        "operations": plan["operations"],
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
        elif args.mode == "apply":
            print(
                json.dumps(
                    await apply_plan(client, plan, source, args.state_dir),
                    ensure_ascii=False,
                    indent=2,
                )
            )
        else:
            print(json.dumps(await verify(client, website["id"]), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
