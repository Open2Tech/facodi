#!/usr/bin/env python3
from __future__ import annotations

import ast
import pathlib
import py_compile
import sys
import xml.etree.ElementTree as ET


ROOT = pathlib.Path(__file__).resolve().parents[1]
ADDON = ROOT / "addons" / "facodi_content"


def validate_python() -> list[str]:
    errors: list[str] = []
    for path in ADDON.rglob("*.py"):
        try:
            py_compile.compile(str(path), doraise=True)
        except py_compile.PyCompileError as exc:
            errors.append(str(exc))
    return errors


def validate_xml() -> list[str]:
    errors: list[str] = []
    for path in ADDON.rglob("*.xml"):
        try:
            ET.parse(path)
        except ET.ParseError as exc:
            errors.append(f"{path}: {exc}")
    return errors


def validate_manifest() -> list[str]:
    manifest_path = ADDON / "__manifest__.py"
    try:
        manifest = ast.literal_eval(manifest_path.read_text(encoding="utf-8"))
    except (OSError, SyntaxError, ValueError) as exc:
        return [f"{manifest_path}: {exc}"]
    required = {"name", "version", "depends", "data", "license"}
    missing = sorted(required.difference(manifest))
    return [f"Manifest missing keys: {', '.join(missing)}"] if missing else []


def main() -> int:
    errors = validate_python() + validate_xml() + validate_manifest()
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("FACODI static validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
