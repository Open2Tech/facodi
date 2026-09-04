from odoo import fields, models


class FacodiLicense(models.Model):
    _name = "facodi.license"
    _description = "FACODI Content License"
    _order = "sequence, name"

    name = fields.Char(required=True, translate=True)
    code = fields.Char(required=True, index=True)
    url = fields.Char()
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)
    allows_redistribution = fields.Boolean()
    allows_embed = fields.Boolean(default=True)
    allows_link = fields.Boolean(default=True)
    metadata_only = fields.Boolean()
    attribution_required = fields.Boolean(default=True)
    share_alike = fields.Boolean()
    noncommercial = fields.Boolean()

    _code_unique = models.Constraint(
        "UNIQUE(code)",
        "The license code must be unique.",
    )
