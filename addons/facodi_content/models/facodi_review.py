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
    )
    def _compute_subject_context(self):
        for review in self:
            subject = review.assertion_id or review.match_id
            review.analysis_run_id = subject.analysis_run_id if subject else False
            review.resource_id = subject.resource_id if subject else False
            review.company_id = subject.company_id if subject else False

    @api.constrains("assertion_id", "match_id")
    def _check_subject(self):
        for review in self:
            if bool(review.assertion_id) == bool(review.match_id):
                raise ValidationError(
                    _("A human review must target exactly one assertion or match.")
                )

    def write(self, values):
        raise UserError(_("Human review records are immutable."))

    def unlink(self):
        raise UserError(_("Human review records are immutable."))
