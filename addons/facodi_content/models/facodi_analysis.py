import hashlib
import json

from markupsafe import Markup, escape

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, UserError, ValidationError

from ..services.ai import OpenAICompatibleClient, normalise_ai_document


ASSERTION_TYPES = [
    ("summary", "Summary"),
    ("difficulty", "Difficulty"),
    ("concept", "Concept"),
    ("learning_outcome", "Learning Outcome"),
    ("competency", "Competency"),
    ("prerequisite", "Prerequisite"),
]


class FacodiAnalysisRun(models.Model):
    _name = "facodi.analysis.run"
    _description = "FACODI Versioned Analysis Run"
    _order = "create_date desc, id desc"

    resource_id = fields.Many2one(
        "facodi.resource",
        required=True,
        ondelete="cascade",
        index=True,
    )
    snapshot_id = fields.Many2one(
        "facodi.resource.snapshot",
        required=True,
        ondelete="restrict",
        index=True,
    )
    company_id = fields.Many2one(
        related="resource_id.company_id",
        store=True,
        index=True,
    )
    analysis_type = fields.Selection(
        [
            ("enrichment", "Content Enrichment"),
            ("matching", "Curriculum Matching"),
            ("composition", "Pedagogical Composition"),
            ("recommendation", "Recommendation"),
        ],
        required=True,
        default="enrichment",
        index=True,
    )
    provider = fields.Char(required=True, index=True)
    model_name = fields.Char(required=True, index=True)
    prompt_version = fields.Char(required=True, index=True)
    source_language_code = fields.Char(index=True)
    requested_language_code = fields.Char(index=True)
    input_hash = fields.Char(required=True, copy=False, index=True)
    input_payload_json = fields.Json(required=True, copy=False)
    state = fields.Selection(
        [
            ("queued", "Queued"),
            ("running", "Running"),
            ("succeeded", "Succeeded"),
            ("failed", "Failed"),
        ],
        required=True,
        default="queued",
        copy=False,
        index=True,
    )
    raw_result_json = fields.Json(copy=False, readonly=True)
    provider_model = fields.Char(copy=False, readonly=True)
    error = fields.Text(copy=False, readonly=True)
    started_at = fields.Datetime(copy=False, readonly=True)
    completed_at = fields.Datetime(copy=False, readonly=True)
    assertion_ids = fields.One2many(
        "facodi.assertion",
        "analysis_run_id",
        copy=False,
    )

    _analysis_identity_unique = models.Constraint(
        "UNIQUE(company_id, analysis_type, provider, model_name, prompt_version, input_hash)",
        "The same versioned analysis input can run only once.",
    )

    @api.constrains("snapshot_id", "resource_id")
    def _check_snapshot_resource(self):
        for run in self:
            if run.snapshot_id.resource_id != run.resource_id:
                raise ValidationError(_("The analysis snapshot must belong to its resource."))

    @api.model
    def get_or_create(
        self,
        *,
        resource,
        snapshot,
        provider,
        model_name,
        prompt_version,
        source_language_code="",
        requested_language_code="",
        input_payload=None,
        analysis_type="enrichment",
    ):
        resource.ensure_one()
        snapshot.ensure_one()
        fingerprint = {
            "analysis_type": analysis_type,
            "snapshot_checksum": snapshot.checksum,
            "provider": provider,
            "model": model_name,
            "prompt_version": prompt_version,
            "source_language": source_language_code or "",
            "requested_language": requested_language_code or "",
            "input": input_payload or {},
        }
        canonical = json.dumps(
            fingerprint,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        input_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        domain = [
            ("company_id", "=", resource.company_id.id),
            ("analysis_type", "=", analysis_type),
            ("provider", "=", provider),
            ("model_name", "=", model_name),
            ("prompt_version", "=", prompt_version),
            ("input_hash", "=", input_hash),
        ]
        run = self.search(domain, limit=1)
        if run:
            return run
        return self.create(
            {
                "resource_id": resource.id,
                "snapshot_id": snapshot.id,
                "analysis_type": analysis_type,
                "provider": provider,
                "model_name": model_name,
                "prompt_version": prompt_version,
                "source_language_code": source_language_code or False,
                "requested_language_code": requested_language_code or False,
                "input_hash": input_hash,
                "input_payload_json": input_payload or {},
            }
        )

    def record_result(self, document, *, raw_result, provider_model=None):
        self.ensure_one()
        if self.state == "succeeded":
            return self.assertion_ids
        values = normalise_ai_document(document)
        assertions = self.env["facodi.assertion"]
        for value in values:
            assertions |= self.env["facodi.assertion"].create(
                {**value, "analysis_run_id": self.id}
            )
        self.write(
            {
                "state": "succeeded",
                "raw_result_json": raw_result or {},
                "provider_model": provider_model or self.model_name,
                "completed_at": fields.Datetime.now(),
                "error": False,
            }
        )
        return assertions

    @api.model
    def _ai_client(self):
        parameters = self.env["ir.config_parameter"].sudo()
        try:
            timeout = int(parameters.get_param("facodi.ai.timeout") or 30)
        except (TypeError, ValueError):
            timeout = 30
        try:
            max_bytes = int(parameters.get_param("facodi.ai.max_bytes") or 2 * 1024 * 1024)
        except (TypeError, ValueError):
            max_bytes = 2 * 1024 * 1024
        return OpenAICompatibleClient(
            timeout=max(1, min(timeout, 120)),
            max_bytes=max(1024, min(max_bytes, 10 * 1024 * 1024)),
        )

    @api.model
    def _run_enrichment_job(self, payload):
        run = self.browse(int(payload.get("analysis_run_id") or 0)).exists()
        if not run:
            raise UserError(_("The analysis run no longer exists."))
        run.ensure_one()
        if run.state == "succeeded":
            return {"analysis_run_id": run.id, "assertion_count": len(run.assertion_ids)}
        parameters = self.env["ir.config_parameter"].sudo()
        endpoint = parameters.get_param("facodi.ai.endpoint") or ""
        api_key = parameters.get_param("facodi.ai.api_key") or ""
        if not endpoint or not api_key:
            raise UserError(_("Configure the FACODI AI endpoint and API key first."))
        system_prompt = parameters.get_param("facodi.ai.system_prompt") or (
            "Return only the FACODI JSON contract with summary, difficulty, concepts, "
            "learning_outcomes, competencies and prerequisites. Every item needs value, "
            "confidence from 0 to 1, and justification."
        )
        run.write(
            {
                "state": "running",
                "started_at": fields.Datetime.now(),
                "error": False,
            }
        )
        try:
            result = run._ai_client().analyse(
                endpoint=endpoint,
                api_key=api_key,
                model=run.model_name,
                system_prompt=system_prompt,
                input_payload=run.input_payload_json,
            )
            assertions = run.record_result(
                result["document"],
                raw_result=result.get("raw_result") or {},
                provider_model=result.get("provider_model"),
            )
        except Exception as error:
            safe_error = str(error).replace(api_key, "***")[:2000]
            run.write(
                {
                    "state": "failed",
                    "error": safe_error,
                    "completed_at": fields.Datetime.now(),
                }
            )
            raise
        return {"analysis_run_id": run.id, "assertion_count": len(assertions)}


class FacodiAssertion(models.Model):
    _name = "facodi.assertion"
    _description = "FACODI AI Assertion"
    _order = "analysis_run_id, id"

    analysis_run_id = fields.Many2one(
        "facodi.analysis.run",
        required=True,
        ondelete="cascade",
        index=True,
    )
    resource_id = fields.Many2one(
        related="analysis_run_id.resource_id",
        store=True,
        index=True,
    )
    snapshot_id = fields.Many2one(
        related="analysis_run_id.snapshot_id",
        store=True,
        index=True,
    )
    company_id = fields.Many2one(
        related="analysis_run_id.company_id",
        store=True,
        index=True,
    )
    assertion_type = fields.Selection(ASSERTION_TYPES, required=True, index=True)
    value_text = fields.Text(required=True)
    confidence = fields.Float(required=True)
    justification = fields.Text(required=True)
    evidence_json = fields.Json(default=dict)
    state = fields.Selection(
        [
            ("proposed", "Proposed"),
            ("accepted", "Accepted"),
            ("corrected", "Corrected"),
            ("rejected", "Rejected"),
        ],
        required=True,
        default="proposed",
        copy=False,
        index=True,
    )
    decision_value_text = fields.Text(copy=False, readonly=True)
    decided_by_id = fields.Many2one(
        "res.users",
        copy=False,
        readonly=True,
        ondelete="set null",
    )
    decided_at = fields.Datetime(copy=False, readonly=True)

    @api.constrains("confidence")
    def _check_confidence(self):
        for assertion in self:
            if assertion.confidence < 0 or assertion.confidence > 1:
                raise ValidationError(_("Assertion confidence must be between 0 and 1."))

    def _ensure_curator(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can decide AI assertions."))

    def action_accept(self, note=None):
        return self._decide("accept", note=note)

    def action_correct(self, corrected_value, note=None):
        return self._decide("correct", corrected_value=corrected_value, note=note)

    def action_reject(self, note=None):
        return self._decide("reject", note=note)

    def _decide(self, decision, *, corrected_value=None, note=None):
        self._ensure_curator()
        now = fields.Datetime.now()
        for assertion in self:
            if assertion.state != "proposed":
                raise UserError(_("This assertion already has a human decision."))
            final_value = assertion.value_text
            if decision == "correct":
                final_value = str(corrected_value or "").strip()
                if not final_value:
                    raise UserError(_("A correction must contain a value."))
            if decision in {"accept", "correct"}:
                assertion._materialise(final_value)
            assertion.write(
                {
                    "state": {
                        "accept": "accepted",
                        "correct": "corrected",
                        "reject": "rejected",
                    }[decision],
                    "decision_value_text": final_value if decision != "reject" else False,
                    "decided_by_id": self.env.user.id,
                    "decided_at": now,
                }
            )
            self.env["facodi.review"].create(
                {
                    "assertion_id": assertion.id,
                    "decision": decision,
                    "original_value": assertion.value_text,
                    "final_value": final_value if decision != "reject" else False,
                    "reviewer_id": self.env.user.id,
                    "reviewed_at": now,
                    "note": note or False,
                }
            )
        return True

    def _materialise(self, final_value):
        self.ensure_one()
        if self.assertion_type == "summary":
            self.resource_id.description = Markup("<p>%s</p>") % escape(final_value)
            return
        if self.assertion_type == "difficulty":
            if final_value not in {"beginner", "intermediate", "advanced", "expert"}:
                raise UserError(_("Difficulty must be beginner, intermediate, advanced or expert."))
            self.resource_id.difficulty_level = final_value
            return
        concept_type = {
            "concept": "topic",
            "learning_outcome": "learning_outcome",
            "competency": "competency",
            "prerequisite": "prerequisite",
        }.get(self.assertion_type)
        if not concept_type:
            return
        code = f"{concept_type}:" + hashlib.sha256(
            final_value.casefold().encode("utf-8")
        ).hexdigest()[:24]
        concept = self.env["facodi.concept"].search(
            [("code", "=", code), ("company_id", "=", self.company_id.id)],
            limit=1,
        )
        if not concept:
            concept = self.env["facodi.concept"].create(
                {
                    "code": code,
                    "name": final_value,
                    "concept_type": concept_type,
                    "company_id": self.company_id.id,
                }
            )
        relation = self.env["facodi.resource.concept"].search(
            [
                ("resource_id", "=", self.resource_id.id),
                ("concept_id", "=", concept.id),
                ("relation_type", "=", concept_type),
            ],
            limit=1,
        )
        values = {
            "resource_id": self.resource_id.id,
            "concept_id": concept.id,
            "relation_type": concept_type,
            "snapshot_id": self.snapshot_id.id,
            "analysis_run_id": self.analysis_run_id.id,
            "assertion_id": self.id,
            "confidence": self.confidence,
            "justification": self.justification,
            "validation_state": "accepted",
            "reviewer_id": self.env.user.id,
            "reviewed_at": fields.Datetime.now(),
        }
        if relation:
            relation.write(values)
        else:
            self.env["facodi.resource.concept"].create(values)


class FacodiResourceConcept(models.Model):
    _name = "facodi.resource.concept"
    _description = "FACODI Validated Resource Concept"
    _order = "resource_id, relation_type, concept_id"

    resource_id = fields.Many2one(
        "facodi.resource",
        required=True,
        ondelete="cascade",
        index=True,
    )
    concept_id = fields.Many2one(
        "facodi.concept",
        required=True,
        ondelete="restrict",
        index=True,
    )
    relation_type = fields.Selection(
        [
            ("topic", "Topic"),
            ("learning_outcome", "Learning Outcome"),
            ("competency", "Competency"),
            ("prerequisite", "Prerequisite"),
        ],
        required=True,
        index=True,
    )
    company_id = fields.Many2one(
        related="resource_id.company_id",
        store=True,
        index=True,
    )
    snapshot_id = fields.Many2one(
        "facodi.resource.snapshot",
        required=True,
        ondelete="restrict",
    )
    analysis_run_id = fields.Many2one(
        "facodi.analysis.run",
        ondelete="restrict",
    )
    assertion_id = fields.Many2one(
        "facodi.assertion",
        ondelete="restrict",
    )
    confidence = fields.Float(required=True)
    justification = fields.Text()
    validation_state = fields.Selection(
        [("accepted", "Accepted")],
        required=True,
        default="accepted",
        index=True,
    )
    reviewer_id = fields.Many2one("res.users", required=True, ondelete="restrict")
    reviewed_at = fields.Datetime(required=True)

    _resource_concept_unique = models.Constraint(
        "UNIQUE(resource_id, concept_id, relation_type)",
        "A validated semantic relation can occur only once per resource.",
    )

    @api.constrains("confidence")
    def _check_confidence(self):
        for relation in self:
            if relation.confidence < 0 or relation.confidence > 1:
                raise ValidationError(_("Relation confidence must be between 0 and 1."))
