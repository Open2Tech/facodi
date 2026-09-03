from odoo import fields, models


class FacodiResource(models.Model):
    _name = "facodi.resource"
    _description = "FACODI Educational Resource"

    name = fields.Char(required=True, translate=True)
