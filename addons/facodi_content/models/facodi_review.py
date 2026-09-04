from odoo import _, fields, models
from odoo.exceptions import UserError


class FacodiReview(models.Model):
    _name = "facodi.review"
    _description = "FACODI Immutable Human Review"
    _order = "reviewed_at desc, id desc"

    assertion_id = fields.Many2one(
        "facodi.assertion",
        required=True,
        ondelete="restrict",
        index=True,
    )
    analysis_run_id = fields.Many2one(
        related="assertion_id.analysis_run_id",
        store=True,
        index=True,
    )
    resource_id = fields.Many2one(
        related="assertion_id.resource_id",
        store=True,
        index=True,
    )
    company_id = fields.Many2one(
        related="assertion_id.company_id",
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

    def write(self, values):
        raise UserError(_("Human review records are immutable."))

    def unlink(self):
        raise UserError(_("Human review records are immutable."))
