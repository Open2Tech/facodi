import hashlib
import json

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, UserError, ValidationError

from ..services.matching import score_candidate


MATCH_STATES = [
    ("proposed", "Proposed"),
    ("accepted", "Accepted"),
    ("corrected", "Corrected"),
    ("rejected", "Rejected"),
]


class FacodiResourceUnitMatch(models.Model):
    _name = "facodi.resource.unit.match"
    _description = "FACODI Resource to Curricular Unit Match"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "unit_id, relevance_score desc, confidence desc, id"

    resource_id = fields.Many2one(
        "facodi.resource",
        required=True,
        ondelete="cascade",
        index=True,
        tracking=True,
    )
    unit_id = fields.Many2one(
        "facodi.course.unit",
        required=True,
        ondelete="cascade",
        index=True,
        tracking=True,
    )
    company_id = fields.Many2one(
        related="unit_id.company_id",
        store=True,
        index=True,
    )
    snapshot_id = fields.Many2one(
        "facodi.resource.snapshot",
        required=True,
        ondelete="restrict",
        index=True,
    )
    analysis_run_id = fields.Many2one(
        "facodi.analysis.run",
        ondelete="restrict",
        index=True,
    )
    matched_concept_ids = fields.Many2many(
        "facodi.concept",
        "facodi_match_concept_rel",
        "match_id",
        "concept_id",
        string="Matched Concepts",
    )
    relevance_score = fields.Float(required=True, default=0.0)
    coverage_score = fields.Float(required=True, default=0.0)
    level_score = fields.Float(required=True, default=0.5)
    confidence = fields.Float(required=True, default=0.0)
    justification = fields.Text(required=True)
    origin = fields.Selection(
        [
            ("deterministic", "Deterministic"),
            ("ai", "AI Proposal"),
            ("manual", "Manual"),
        ],
        required=True,
        default="deterministic",
        index=True,
    )
    input_fingerprint = fields.Char(required=True, copy=False, index=True)
    state = fields.Selection(
        MATCH_STATES,
        required=True,
        default="proposed",
        copy=False,
        index=True,
        tracking=True,
    )
    decided_by_id = fields.Many2one(
        "res.users",
        copy=False,
        readonly=True,
        ondelete="set null",
    )
    decided_at = fields.Datetime(copy=False, readonly=True)

    _resource_unit_unique = models.Constraint(
        "UNIQUE(resource_id, unit_id)",
        "Only one current match may exist for a resource and curricular unit.",
    )

    @api.constrains(
        "relevance_score",
        "coverage_score",
        "level_score",
        "confidence",
    )
    def _check_scores(self):
        for match in self:
            for field_name in (
                "relevance_score",
                "coverage_score",
                "level_score",
                "confidence",
            ):
                value = match[field_name]
                if value < 0 or value > 1:
                    raise ValidationError(_("Match scores must be between 0 and 1."))

    @api.constrains(
        "resource_id",
        "unit_id",
        "snapshot_id",
        "analysis_run_id",
        "matched_concept_ids",
    )
    def _check_provenance(self):
        for match in self:
            if match.resource_id.company_id != match.unit_id.company_id:
                raise ValidationError(
                    _("The resource and curricular unit must belong to the same company.")
                )
            if match.snapshot_id.resource_id != match.resource_id:
                raise ValidationError(_("The match snapshot must belong to its resource."))
            if (
                match.analysis_run_id
                and match.analysis_run_id.resource_id != match.resource_id
            ):
                raise ValidationError(_("The analysis run must belong to the matched resource."))
            if any(
                concept.company_id != match.company_id
                for concept in match.matched_concept_ids
            ):
                raise ValidationError(
                    _("Matched concepts must belong to the match company.")
                )

    @api.model
    def generate_for_unit(self, unit):
        """Create or refresh deterministic candidates from accepted semantics."""

        unit.ensure_one()
        requirements = unit.concept_relation_ids
        if not requirements:
            return self.browse()
        requirement_ids = requirements.mapped("concept_id").ids
        evidence_records = self.env["facodi.resource.concept"].search(
            [
                ("company_id", "=", unit.company_id.id),
                ("concept_id", "in", requirement_ids),
                ("validation_state", "=", "accepted"),
            ],
            order="resource_id, concept_id, confidence desc, id",
        )
        by_resource = {}
        for evidence in evidence_records:
            if evidence.snapshot_id != evidence.resource_id.current_snapshot_id:
                continue
            by_resource.setdefault(evidence.resource_id.id, self.env[
                "facodi.resource.concept"
            ])
            by_resource[evidence.resource_id.id] |= evidence

        requirement_values = [
            {
                "concept_id": relation.concept_id.id,
                "weight": relation.weight,
            }
            for relation in requirements
        ]
        generated = self.browse()
        for resource_id in sorted(by_resource):
            evidence = by_resource[resource_id]
            resource = evidence[0].resource_id
            evidence_values = [
                {
                    "concept_id": relation.concept_id.id,
                    "confidence": relation.confidence,
                }
                for relation in evidence
            ]
            score = score_candidate(
                requirements=requirement_values,
                evidence=evidence_values,
                resource_level=resource.difficulty_level,
                unit_level=unit.difficulty_level,
            )
            if not score["matched_count"]:
                continue
            fingerprint_values = {
                "unit_id": unit.id,
                "unit_requirements": sorted(
                    (
                        relation.concept_id.id,
                        round(relation.weight, 8),
                    )
                    for relation in requirements
                ),
                "resource_id": resource.id,
                "snapshot_checksum": resource.current_snapshot_id.checksum,
                "evidence": sorted(
                    (
                        relation.concept_id.id,
                        round(relation.confidence, 8),
                    )
                    for relation in evidence
                ),
                "resource_level": resource.difficulty_level or "",
                "unit_level": unit.difficulty_level or "",
            }
            canonical = json.dumps(
                fingerprint_values,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            )
            values = {
                "resource_id": resource.id,
                "unit_id": unit.id,
                "snapshot_id": resource.current_snapshot_id.id,
                "matched_concept_ids": [(6, 0, score["matched_concept_ids"])],
                "relevance_score": score["relevance_score"],
                "coverage_score": score["coverage_score"],
                "level_score": score["level_score"],
                "confidence": score["confidence"],
                "justification": _(
                    "Accepted canonical evidence matches %(matched)s/%(required)s "
                    "curricular requirements.",
                    matched=score["matched_count"],
                    required=score["required_count"],
                ),
                "origin": "deterministic",
                "input_fingerprint": hashlib.sha256(
                    canonical.encode("utf-8")
                ).hexdigest(),
            }
            match = self.search(
                [
                    ("resource_id", "=", resource.id),
                    ("unit_id", "=", unit.id),
                ],
                limit=1,
            )
            if not match:
                match = self.create(values)
            elif match.state == "proposed" and (
                match.input_fingerprint != values["input_fingerprint"]
            ):
                match.write(values)
            generated |= match
        return generated

    @api.model
    def _run_match_job(self, payload):
        unit = self.env["facodi.course.unit"].browse(
            int(payload.get("unit_id") or 0)
        ).exists()
        if not unit:
            raise UserError(_("The curricular unit no longer exists."))
        matches = self.generate_for_unit(unit)
        return {"unit_id": unit.id, "match_ids": matches.ids}

    def _ensure_curator(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can decide matches."))

    def action_accept(self, note=None):
        return self._decide("accept", note=note)

    def action_reject(self, note=None):
        return self._decide("reject", note=note)

    def action_correct(
        self,
        *,
        relevance_score=None,
        coverage_score=None,
        level_score=None,
        confidence=None,
        justification=None,
        note=None,
    ):
        corrections = {
            key: value
            for key, value in {
                "relevance_score": relevance_score,
                "coverage_score": coverage_score,
                "level_score": level_score,
                "confidence": confidence,
                "justification": justification,
            }.items()
            if value is not None
        }
        if not corrections:
            raise UserError(_("A corrected match must change at least one value."))
        return self._decide("correct", corrections=corrections, note=note)

    def _decision_payload(self):
        self.ensure_one()
        return {
            "relevance_score": self.relevance_score,
            "coverage_score": self.coverage_score,
            "level_score": self.level_score,
            "confidence": self.confidence,
            "justification": self.justification,
            "matched_concept_ids": self.matched_concept_ids.ids,
        }

    def _decide(self, decision, *, corrections=None, note=None):
        self._ensure_curator()
        now = fields.Datetime.now()
        for match in self:
            if match.state != "proposed":
                raise UserError(_("This match already has a human decision."))
            original = match._decision_payload()
            values = dict(corrections or {})
            for field_name in (
                "relevance_score",
                "coverage_score",
                "level_score",
                "confidence",
            ):
                if field_name in values:
                    try:
                        values[field_name] = float(values[field_name])
                    except (TypeError, ValueError) as error:
                        raise UserError(_("Corrected match scores must be numeric.")) from error
            values.update(
                {
                    "state": {
                        "accept": "accepted",
                        "correct": "corrected",
                        "reject": "rejected",
                    }[decision],
                    "decided_by_id": self.env.user.id,
                    "decided_at": now,
                }
            )
            match.write(values)
            final = match._decision_payload() if decision != "reject" else {}
            self.env["facodi.review"].create(
                {
                    "match_id": match.id,
                    "decision": decision,
                    "original_value": json.dumps(original, sort_keys=True),
                    "final_value": (
                        json.dumps(final, sort_keys=True)
                        if decision != "reject"
                        else False
                    ),
                    "reviewer_id": self.env.user.id,
                    "reviewed_at": now,
                    "note": note or False,
                }
            )
        return True
