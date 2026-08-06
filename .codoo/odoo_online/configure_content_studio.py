#!/usr/bin/env python3
"""Configure proven FACODI Content Studio capabilities on Odoo Online.

The default mode is read-only ``dry-run``. Every apply writes a redacted
before-snapshot and records only fields created by this script for rollback.
"""

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

PROOF_FIELDS = (
    {
        "model": "slide.slide",
        "name": "x_studio_approved_for_publication",
        "label": "Aprovado para publicacao",
        "ttype": "boolean",
    },
)

CORE_FIELDS = PROOF_FIELDS + (
    {"model": "slide.channel", "name": "x_studio_publisher_id", "label": "Instituicao publicadora", "ttype": "many2one", "relation": "res.partner"},
    {"model": "slide.channel", "name": "x_studio_collection_type", "label": "Tipo de colecao", "ttype": "selection", "selection": "[(\'course\', \'Course\'), (\'curricular_unit\', \'Curricular unit\'), (\'playlist\', \'Playlist\'), (\'learning_path\', \'Learning path\'), (\'topic_collection\', \'Topic collection\')]"},
    {"model": "slide.channel", "name": "x_studio_editorial_state", "label": "Estado editorial", "ttype": "selection", "selection": "[(\'draft\', \'Draft\'), (\'preparing\', \'Preparing\'), (\'under_review\', \'Under review\'), (\'changes_requested\', \'Changes requested\'), (\'approved\', \'Approved\'), (\'ready_to_publish\', \'Ready to publish\'), (\'published\', \'Published\'), (\'archived\', \'Archived\')]"},
    {"model": "slide.channel", "name": "x_studio_review_notes", "label": "Notas de revisao", "ttype": "text"},
    {"model": "slide.channel", "name": "x_studio_approved_for_publication", "label": "Aprovado para publicacao", "ttype": "boolean"},
    {"model": "slide.channel", "name": "x_studio_curriculum_code", "label": "Codigo curricular oficial", "ttype": "char"},
    {"model": "slide.channel", "name": "x_studio_curriculum_ects", "label": "ECTS curriculares", "ttype": "integer"},
    {"model": "slide.slide", "name": "x_studio_playlist_url", "label": "Playlist original", "ttype": "char"},
    {"model": "slide.slide", "name": "x_studio_playlist_id", "label": "ID da playlist", "ttype": "char"},
    {"model": "slide.slide", "name": "x_studio_playlist_position", "label": "Posicao na playlist", "ttype": "integer"},
    {"model": "slide.slide", "name": "x_studio_canonical_url", "label": "URL canonica", "ttype": "char"},
    {"model": "slide.slide", "name": "x_studio_source_fingerprint", "label": "Fingerprint da fonte", "ttype": "char"},
    {"model": "slide.slide", "name": "x_studio_classification_confidence", "label": "Confianca da classificacao", "ttype": "selection", "selection": "[('high', 'Alta'), ('medium', 'Media'), ('low', 'Baixa')]"},
    {"model": "slide.slide", "name": "x_studio_classification_justification", "label": "Justificacao da classificacao", "ttype": "text"},
    {"model": "slide.slide", "name": "x_studio_suggested_order", "label": "Ordem sugerida", "ttype": "integer"},
    {"model": "slide.slide", "name": "x_studio_prerequisites", "label": "Pre-requisitos sugeridos", "ttype": "text"},
    {"model": "slide.slide", "name": "x_studio_competences", "label": "Competencias sugeridas", "ttype": "text"},
    {"model": "slide.slide", "name": "x_studio_curriculum_ects_related", "label": "ECTS relacionados", "ttype": "integer"},
    {"model": "slide.slide", "name": "x_studio_curricular_year", "label": "Ano curricular", "ttype": "integer"},
    {"model": "slide.slide", "name": "x_studio_semester", "label": "Semestre", "ttype": "selection", "selection": "[('1', '1.'), ('2', '2.')]"},
    {"model": "slide.slide", "name": "x_studio_transcript_available", "label": "Transcricao disponivel", "ttype": "boolean"},
    {"model": "slide.slide", "name": "x_studio_captions_available", "label": "Legendas disponiveis", "ttype": "boolean"},
    {"model": "slide.slide", "name": "x_studio_import_status", "label": "Estado da importacao", "ttype": "selection", "selection": "[('discovered', 'Descoberto'), ('proposed', 'Proposto'), ('enriched', 'Enriquecido'), ('reviewed', 'Revisto'), ('converted', 'Convertido'), ('rejected', 'Rejeitado'), ('duplicate', 'Duplicado')]"},
    {"model": "slide.slide", "name": "x_studio_source_url", "label": "URL da fonte", "ttype": "char"},
    {"model": "slide.slide", "name": "x_studio_source_platform", "label": "Plataforma", "ttype": "selection", "selection": "[(\'youtube\', \'YouTube\'), (\'vimeo\', \'Vimeo\'), (\'other\', \'Other approved source\')]"},
    {"model": "slide.slide", "name": "x_studio_source_author", "label": "Autor da fonte", "ttype": "char"},
    {"model": "slide.slide", "name": "x_studio_source_license", "label": "Licenca e proveniencia", "ttype": "text"},
    {"model": "slide.slide", "name": "x_studio_source_description", "label": "Descricao original", "ttype": "html"},
    {"model": "slide.slide", "name": "x_studio_transcript", "label": "Transcricao", "ttype": "html"},
    {"model": "slide.slide", "name": "x_studio_ai_summary", "label": "Resumo sugerido", "ttype": "html"},
    {"model": "slide.slide", "name": "x_studio_ai_learning_objectives", "label": "Objetivos sugeridos", "ttype": "text"},
    {"model": "slide.slide", "name": "x_studio_ai_topics", "label": "Topicos sugeridos", "ttype": "text"},
    {"model": "slide.slide", "name": "x_studio_ai_keywords", "label": "Palavras-chave sugeridas", "ttype": "char"},
    {"model": "slide.slide", "name": "x_studio_ai_level", "label": "Nivel sugerido", "ttype": "selection", "selection": "[(\'introductory\', \'Introductory\'), (\'intermediate\', \'Intermediate\'), (\'advanced\', \'Advanced\')]"},
    {"model": "slide.slide", "name": "x_studio_ai_language", "label": "Idioma sugerido", "ttype": "char"},
    {"model": "slide.slide", "name": "x_studio_ai_quality_notes", "label": "Notas de qualidade", "ttype": "text"},
    {"model": "slide.slide", "name": "x_studio_editorial_state", "label": "Estado editorial", "ttype": "selection", "selection": "[(\'draft\', \'Draft\'), (\'preparing\', \'Preparing\'), (\'under_review\', \'Under review\'), (\'changes_requested\', \'Changes requested\'), (\'approved\', \'Approved\'), (\'ready_to_publish\', \'Ready to publish\'), (\'published\', \'Published\'), (\'archived\', \'Archived\')]"},
    {"model": "slide.slide", "name": "x_studio_review_notes", "label": "Notas de revisao", "ttype": "text"},
    {"model": "slide.slide", "name": "x_studio_ai_processed", "label": "Processado por IA", "ttype": "boolean"},
    {"model": "slide.slide", "name": "x_studio_ai_last_processing", "label": "Ultimo processamento IA", "ttype": "datetime"},
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("dry-run", "snapshot", "apply", "verify", "rollback"), nargs="?", default="dry-run")
    parser.add_argument("--target", default="online")
    parser.add_argument("--env", type=Path, default=Path(".env"))
    parser.add_argument("--confirm", default="")
    parser.add_argument("--batch", choices=("proof", "core"), default="proof")
    parser.add_argument("--state-dir", type=Path, default=Path("odoo/facodi/.codoo/odoo_online/state"))
    return parser.parse_args()


def timestamp() -> str:
    return datetime.now(UTC).isoformat()


async def model_id(client: AsyncOdooClient, model: str) -> int:
    records = await client.search_read("ir.model", [("model", "=", model)], ["id", "model"], limit=2)
    if len(records) != 1:
        raise RuntimeError(f"Expected one ir.model record for {model}, found {len(records)}")
    return int(records[0]["id"])


async def field_snapshot(client: AsyncOdooClient, field: dict[str, Any]) -> dict[str, Any]:
    records = await client.search_read(
        "ir.model.fields",
        [("model", "=", field["model"]), ("name", "=", field["name"])],
        ["id", "name", "field_description", "model", "model_id", "ttype", "state", "selection", "readonly", "required"],
        limit=2,
    )
    return {"spec": field, "records": records}


async def build_snapshot(client: AsyncOdooClient, fields: tuple[dict[str, Any], ...]) -> dict[str, Any]:
    return {
        "generated_at": timestamp(),
        "connection": client.config.public_odoo(),
        "batch": "proof",
        "fields": [await field_snapshot(client, field) for field in fields],
        "writes_performed": False,
    }


async def field_plan(client: AsyncOdooClient, fields: tuple[dict[str, Any], ...]) -> list[dict[str, Any]]:
    plan = []
    for field in fields:
        existing = await field_snapshot(client, field)
        model_record_id = await model_id(client, field["model"])
        values = {
            "model_id": model_record_id,
            "model": field["model"],
            "name": field["name"],
            "field_description": field["label"],
            "ttype": field["ttype"],
            "state": "manual",
            "selectable": True,
            "store": True,
        }
        if "relation" in field:
            values["relation"] = field["relation"]
        if "selection" in field:
            values["selection"] = field["selection"]
        plan.append(
            {
                "key": f"{field['model']}:{field['name']}",
                "model": "ir.model.fields",
                "record_id": existing["records"][0]["id"] if existing["records"] else None,
                "action": "write-not-supported" if existing["records"] else "create",
                "values": values,
            }
        )
    return plan


async def main() -> None:  # noqa: C901
    args = parse_args()
    config = load_config(target=args.target, env_file=args.env)
    fields = PROOF_FIELDS if args.batch == "proof" else CORE_FIELDS
    args.state_dir.mkdir(parents=True, exist_ok=True)
    async with AsyncOdooClient(config) as client:
        plan = await field_plan(client, fields)
        if args.mode == "dry-run":
            print(json.dumps({"mode": args.mode, "plan": plan}, ensure_ascii=True, indent=2))
            return
        if args.mode == "snapshot":
            snapshot = await build_snapshot(client, fields)
            path = args.state_dir / "content-studio-before.json"
            path.write_text(json.dumps(snapshot, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
            print(json.dumps({"mode": args.mode, "snapshot": str(path)}, indent=2))
            return
        if args.mode in {"apply", "rollback"} and args.confirm != CONFIRMATION:
            raise RuntimeError(f"Remote writes require --confirm {CONFIRMATION}")
        snapshot_path = args.state_dir / "content-studio-before.json"
        if args.mode == "apply":
            snapshot = await build_snapshot(client, fields)
            snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
            created = []
            for operation in plan:
                if operation["action"] != "create":
                    continue
                record_id = await client.create("ir.model.fields", operation["values"])
                created.append({"model": operation["model"], "id": record_id, "key": operation["key"]})
            result = {"generated_at": timestamp(), "plan": plan, "created": created, "snapshot": str(snapshot_path)}
            result_path = args.state_dir / "content-studio-apply.json"
            result_path.write_text(json.dumps(result, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
            print(json.dumps({"mode": args.mode, "created": created, "snapshot": str(snapshot_path)}, indent=2))
            return
        if args.mode == "verify":
            verified = []
            for field in fields:
                records = await field_snapshot(client, field)
                verified.append({"key": f"{field['model']}:{field['name']}", "count": len(records["records"]), "records": records["records"]})
            print(json.dumps({"mode": args.mode, "verified": verified}, ensure_ascii=True, indent=2))
            return
        result_path = args.state_dir / "content-studio-apply.json"
        if not result_path.exists():
            raise RuntimeError(f"Missing apply artifact: {result_path}")
        result = json.loads(result_path.read_text(encoding="utf-8"))
        rolled_back = []
        for created in result.get("created", []):
            await client.unlink(created["model"], [int(created["id"])])
            rolled_back.append(created)
        rollback_path = args.state_dir / "content-studio-rollback.json"
        rollback_path.write_text(json.dumps({"generated_at": timestamp(), "rolled_back": rolled_back}, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({"mode": args.mode, "rolled_back": rolled_back}, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
