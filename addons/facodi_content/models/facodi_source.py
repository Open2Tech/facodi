from odoo import api, fields, models


class FacodiSource(models.Model):
    _name = "facodi.source"
    _description = "FACODI Content Source"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "name, id"

    name = fields.Char(required=True, translate=True, tracking=True)
    code = fields.Char(required=True, index=True, tracking=True)
    source_type = fields.Selection(
        [
            ("manual", "Manual"),
            ("youtube", "YouTube"),
            ("website", "Website"),
            ("pdf", "PDF / Document"),
            ("odoo", "Odoo eLearning"),
            ("curriculum", "University Curriculum"),
            ("api", "External API"),
        ],
        required=True,
        default="manual",
        index=True,
    )
    base_url = fields.Char()
    active = fields.Boolean(default=True)
    company_id = fields.Many2one(
        "res.company",
        required=True,
        default=lambda self: self.env.company,
        index=True,
    )
    discovery_cursor = fields.Char(copy=False)
    last_discovered_at = fields.Datetime(copy=False, readonly=True)

    _code_company_unique = models.Constraint(
        "UNIQUE(code, company_id)",
        "The source code must be unique per company.",
    )

    @api.model_create_multi
    def create(self, values_list):
        for values in values_list:
            if values.get("code"):
                values["code"] = values["code"].strip().lower()
        return super().create(values_list)
