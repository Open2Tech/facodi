from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError


class FacodiReview(models.Model):
    _name = "facodi.review"
    _description = "FACODI Immutable Human Review"
    _order = "reviewed_at desc, id desc"

    assertion_id = fields.Many2one(
        "facodi.assertion",
        ondelete="restrict",
        index=True,
    )
    match_id = fields.Many2one(
        "facodi.resource.unit.match",
        ondelete="restrict",
        index=True,
    )
    composition_id = fields.Many2one(
        "facodi.composition",
        ondelete="restrict",
        index=True,
    )
    update_id = fields.Many2one(
        "facodi.resource.update",
        ondelete="restrict",
        index=True,
    )
    analysis_run_id = fields.Many2one(
        "facodi.analysis.run",
        compute="_compute_subject_context",
        store=True,
        index=True,
    )
    resource_id = fields.Many2one(
        "facodi.resource",
        compute="_compute_subject_context",
        store=True,
        index=True,
    )
    company_id = fields.Many2one(
        "res.company",
        compute="_compute_subject_context",
        store=True,
        index=True,
    )
    decision = fields.Selection(
        [("accept", "Accept"), ("correct", "Correct"), ("reject", "Reject")],
        required=True,
        index=True,
    )
    original_value = fields.Text(required=True)
    final_value = fields.Text()
    reviewer_id = fields.Many2one(
        "res.users",
        required=True,
        ondelete="restrict",
        index=True,
    )
    reviewed_at = fields.Datetime(required=True, index=True)
    note = fields.Text()

    _assertion_review_unique = models.Constraint(
        "UNIQUE(assertion_id)",
        "An AI assertion can receive only one terminal human decision.",
    )
    _match_review_unique = models.Constraint(
        "UNIQUE(match_id)",
        "A match can receive only one terminal human decision.",
    )

    @api.depends(
        "assertion_id.analysis_run_id",
        "assertion_id.resource_id",
        "assertion_id.company_id",
        "match_id.analysis_run_id",
        "match_id.resource_id",
        "match_id.company_id",
        "composition_id.analysis_run_id",
        "composition_id.company_id",
        "update_id.resource_id",
        "update_id.company_id",
    )
    def _compute_subject_context(self):
        for review in self:
            if review.assertion_id:
                review.analysis_run_id = review.assertion_id.analysis_run_id
                review.resource_id = review.assertion_id.resource_id
                review.company_id = review.assertion_id.company_id
            elif review.match_id:
                review.analysis_run_id = review.match_id.analysis_run_id
                review.resource_id = review.match_id.resource_id
                review.company_id = review.match_id.company_id
            elif review.update_id:
                review.analysis_run_id = False
                review.resource_id = review.update_id.resource_id
                review.company_id = review.update_id.company_id
            else:
                review.analysis_run_id = review.composition_id.analysis_run_id
                review.resource_id = False
                review.company_id = review.composition_id.company_id

    _composition_review_unique = models.Constraint(
        "UNIQUE(composition_id)",
        "A composition can receive only one terminal human decision.",
    )
    _update_review_unique = models.Constraint(
        "UNIQUE(update_id)",
        "A resource update can receive only one terminal human decision.",
    )

    @api.constrains("assertion_id", "match_id", "composition_id", "update_id")
    def _check_subject(self):
        for review in self:
            subject_count = sum(
                bool(value)
                for value in (
                    review.assertion_id,
                    review.match_id,
                    review.composition_id,
                    review.update_id,
                )
            )
            if subject_count != 1:
                raise ValidationError(
                    _(
                        "A human review must target exactly one assertion, match, "
                        "composition or resource update."
                    )
                )

    def write(self, values):
        raise UserError(_("Human review records are immutable."))

    def unlink(self):
        raise UserError(_("Human review records are immutable."))
