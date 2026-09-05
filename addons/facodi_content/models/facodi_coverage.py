import hashlib
import json

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, UserError, ValidationError

from ..services.matching import classify_coverage


class FacodiCoverage(models.Model):
    _name = "facodi.coverage"
    _description = "FACODI Versioned Curriculum Coverage"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "unit_id, version desc, id desc"

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
    version = fields.Integer(required=True, copy=False, index=True)
    input_fingerprint = fields.Char(required=True, copy=False, index=True)
    good_threshold = fields.Float(required=True, default=0.80)
    partial_threshold = fields.Float(required=True, default=0.30)
    redundancy_count = fields.Integer(required=True, default=3)
    overall_score = fields.Float(required=True, default=0.0)
    resource_count = fields.Integer(required=True, default=0)
    state = fields.Selection(
        [("proposed", "Proposed"), ("validated", "Validated")],
        required=True,
        default="proposed",
        copy=False,
        index=True,
        tracking=True,
    )
    computed_at = fields.Datetime(required=True, copy=False, readonly=True)
    computed_by_id = fields.Many2one(
        "res.users",
        required=True,
        copy=False,
        readonly=True,
        ondelete="restrict",
    )
    validated_at = fields.Datetime(copy=False, readonly=True)
    validated_by_id = fields.Many2one(
        "res.users",
        copy=False,
        readonly=True,
        ondelete="set null",
    )
    line_ids = fields.One2many(
        "facodi.coverage.line",
        "coverage_id",
        copy=False,
    )

    _unit_version_unique = models.Constraint(
        "UNIQUE(unit_id, version)",
        "A coverage version must be unique within its curricular unit.",
    )
    _unit_fingerprint_unique = models.Constraint(
        "UNIQUE(unit_id, input_fingerprint)",
        "Identical accepted inputs must reuse the same coverage assessment.",
    )

    @api.constrains("good_threshold", "partial_threshold", "overall_score")
    def _check_scores(self):
        for coverage in self:
            if not 0 <= coverage.partial_threshold <= coverage.good_threshold <= 1:
                raise ValidationError(
                    _("Coverage thresholds must satisfy 0 <= partial <= good <= 1.")
                )
            if coverage.overall_score < 0 or coverage.overall_score > 1:
                raise ValidationError(_("Overall coverage must be between 0 and 1."))

    @api.constrains("redundancy_count")
    def _check_redundancy_count(self):
        for coverage in self:
            if coverage.redundancy_count < 1:
                raise ValidationError(_("Redundancy count must be at least one."))

    @api.model
    def _thresholds(self):
        parameters = self.env["ir.config_parameter"].sudo()

        def decimal(name, default):
            try:
                value = float(parameters.get_param(name) or default)
            except (TypeError, ValueError):
                value = default
            return max(0.0, min(value, 1.0))

        good = decimal("facodi.coverage.good_threshold", 0.80)
        partial = min(decimal("facodi.coverage.partial_threshold", 0.30), good)
        try:
            redundancy = int(
                parameters.get_param("facodi.coverage.redundancy_count") or 3
            )
        except (TypeError, ValueError):
            redundancy = 3
        return good, partial, max(1, redundancy)

    @api.model
    def compute_for_unit(self, unit):
        """Create a reproducible assessment from accepted human decisions only."""

        unit.ensure_one()
        requirements = unit.concept_relation_ids.sorted(
            key=lambda relation: (relation.sequence, relation.id)
        )
        good, partial, redundancy = self._thresholds()
        matches = self.env["facodi.resource.unit.match"].search(
            [
                ("unit_id", "=", unit.id),
                ("state", "in", ["accepted", "corrected"]),
            ],
            order="resource_id, id",
        )
        evidence = self.env["facodi.resource.concept"].search(
            [
                ("resource_id", "in", matches.mapped("resource_id").ids),
                ("concept_id", "in", requirements.mapped("concept_id").ids),
                ("validation_state", "=", "accepted"),
            ],
            order="resource_id, concept_id, confidence desc, id",
        )
        evidence = evidence.filtered(
            lambda item: any(
                match.resource_id == item.resource_id
                and match.snapshot_id == item.snapshot_id
                for match in matches
            )
        )
        fingerprint_values = {
            "unit_id": unit.id,
            "requirements": [
                (
                    relation.id,
                    relation.concept_id.id,
                    relation.role,
                    round(relation.weight, 8),
                )
                for relation in requirements
            ],
            "matches": [
                (
                    match.id,
                    match.resource_id.id,
                    match.snapshot_id.checksum,
                    match.state,
                    round(match.coverage_score, 8),
                    round(match.confidence, 8),
                )
                for match in matches
            ],
            "evidence": [
                (
                    relation.resource_id.id,
                    relation.snapshot_id.checksum,
                    relation.concept_id.id,
                    round(relation.confidence, 8),
                )
                for relation in evidence
            ],
            "thresholds": (good, partial, redundancy),
        }
        canonical = json.dumps(
            fingerprint_values,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        fingerprint = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        existing = self.search(
            [
                ("unit_id", "=", unit.id),
                ("input_fingerprint", "=", fingerprint),
            ],
            limit=1,
        )
        if existing:
            return existing

        previous = self.search(
            [("unit_id", "=", unit.id)],
            order="version desc",
            limit=1,
        )
        line_commands = []
        weighted_total = 0.0
        total_weight = sum(requirements.mapped("weight"))
        covered_resource_ids = set()
        for requirement in requirements:
            relevant_evidence = evidence.filtered(
                lambda item: item.concept_id == requirement.concept_id
            )
            relevant_resource_ids = set(relevant_evidence.mapped("resource_id").ids)
            relevant_matches = matches.filtered(
                lambda match: match.resource_id.id in relevant_resource_ids
            )
            score = max(relevant_matches.mapped("coverage_score"), default=0.0)
            strong_count = len(
                set(
                    relevant_evidence.filtered(
                        lambda item: item.confidence >= good
                    ).mapped("resource_id").ids
                )
            )
            status = classify_coverage(
                score,
                strong_resource_count=strong_count,
                good=good,
                partial=partial,
                redundancy_count=redundancy,
            )
            covered_resource_ids.update(relevant_resource_ids)
            weighted_total += requirement.weight * score
            explanation = {
                "gap": _("No accepted resource covers this requirement."),
                "partial": _("Accepted resources provide partial coverage."),
                "good": _("Accepted resources provide good coverage."),
                "redundant": _(
                    "At least %(count)s strong accepted resources cover this requirement.",
                    count=redundancy,
                ),
            }[status]
            next_action = {
                "gap": _("Discover and curate new resources."),
                "partial": _("Find complementary resources or improve the match."),
                "good": _("Maintain and monitor the accepted resources."),
                "redundant": _("Review overlap and retain the best pedagogical options."),
            }[status]
            line_commands.append(
                (
                    0,
                    0,
                    {
                        "unit_concept_id": requirement.id,
                        "score": score,
                        "status": status,
                        "resource_count": len(relevant_resource_ids),
                        "resource_ids": [(6, 0, sorted(relevant_resource_ids))],
                        "explanation": explanation,
                        "next_action": next_action,
                    },
                )
            )
        overall = weighted_total / total_weight if total_weight else 0.0
        return self.create(
            {
                "unit_id": unit.id,
                "version": (previous.version or 0) + 1,
                "input_fingerprint": fingerprint,
                "good_threshold": good,
                "partial_threshold": partial,
                "redundancy_count": redundancy,
                "overall_score": overall,
                "resource_count": len(covered_resource_ids),
                "computed_at": fields.Datetime.now(),
                "computed_by_id": self.env.user.id,
                "line_ids": line_commands,
            }
        )

    @api.model
    def _run_coverage_job(self, payload):
        unit = self.env["facodi.course.unit"].browse(
            int(payload.get("unit_id") or 0)
        ).exists()
        if not unit:
            raise UserError(_("The curricular unit no longer exists."))
        coverage = self.compute_for_unit(unit)
        return {"unit_id": unit.id, "coverage_id": coverage.id}

    def action_validate(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can validate coverage."))
        now = fields.Datetime.now()
        for coverage in self:
            if coverage.state != "proposed":
                raise UserError(_("Only proposed coverage can be validated."))
            coverage.write(
                {
                    "state": "validated",
                    "validated_at": now,
                    "validated_by_id": self.env.user.id,
                }
            )
        return True


class FacodiCoverageLine(models.Model):
    _name = "facodi.coverage.line"
    _description = "FACODI Curriculum Coverage Line"
    _order = "coverage_id, unit_concept_id, id"

    coverage_id = fields.Many2one(
        "facodi.coverage",
        required=True,
        ondelete="cascade",
        index=True,
    )
    unit_id = fields.Many2one(
        related="coverage_id.unit_id",
        store=True,
        index=True,
    )
    company_id = fields.Many2one(
        related="coverage_id.company_id",
        store=True,
        index=True,
    )
    unit_concept_id = fields.Many2one(
        "facodi.unit.concept",
        required=True,
        ondelete="restrict",
        index=True,
    )
    concept_id = fields.Many2one(
        related="unit_concept_id.concept_id",
        store=True,
        index=True,
    )
    score = fields.Float(required=True, default=0.0)
    status = fields.Selection(
        [
            ("gap", "Gap"),
            ("partial", "Partial"),
            ("good", "Good"),
            ("redundant", "Redundant"),
        ],
        required=True,
        index=True,
    )
    resource_count = fields.Integer(required=True, default=0)
    resource_ids = fields.Many2many(
        "facodi.resource",
        "facodi_coverage_line_resource_rel",
        "line_id",
        "resource_id",
        string="Accepted Resources",
    )
    explanation = fields.Text(required=True)
    next_action = fields.Text(required=True)

    _coverage_requirement_unique = models.Constraint(
        "UNIQUE(coverage_id, unit_concept_id)",
        "A curricular requirement can occur only once in a coverage assessment.",
    )

    @api.constrains("score", "resource_count")
    def _check_values(self):
        for line in self:
            if line.score < 0 or line.score > 1:
                raise ValidationError(_("Coverage line score must be between 0 and 1."))
            if line.resource_count < 0:
                raise ValidationError(_("Coverage resource count cannot be negative."))

    @api.constrains("coverage_id", "unit_concept_id", "resource_ids")
    def _check_scope(self):
        for line in self:
            if line.unit_concept_id.unit_id != line.coverage_id.unit_id:
                raise ValidationError(
                    _("The coverage requirement must belong to the assessed unit.")
                )
            if any(resource.company_id != line.company_id for resource in line.resource_ids):
                raise ValidationError(
                    _("Coverage resources must belong to the assessment company.")
                )
