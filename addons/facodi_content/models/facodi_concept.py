from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class FacodiConcept(models.Model):
    _name = "facodi.concept"
    _description = "FACODI Canonical Educational Concept"
    _order = "concept_type, name, id"

    code = fields.Char(required=True, index=True)
    name = fields.Char(required=True, translate=True, index="trigram")
    description = fields.Text(translate=True)
    concept_type = fields.Selection(
        [
            ("topic", "Topic"),
            ("learning_outcome", "Learning Outcome"),
            ("competency", "Competency"),
            ("prerequisite", "Prerequisite"),
        ],
        required=True,
        default="topic",
        index=True,
    )
    external_uri = fields.Char(index=True)
    broader_id = fields.Many2one(
        "facodi.concept",
        ondelete="restrict",
        index=True,
    )
    company_id = fields.Many2one(
        "res.company",
        required=True,
        default=lambda self: self.env.company,
        index=True,
    )
    active = fields.Boolean(default=True)

    _code_company_unique = models.Constraint(
        "UNIQUE(code, company_id)",
        "A canonical concept code must be unique per company.",
    )

    @api.model_create_multi
    def create(self, values_list):
        for values in values_list:
            if values.get("code"):
                values["code"] = str(values["code"]).strip().lower()
        return super().create(values_list)

    @api.constrains("broader_id")
    def _check_broader_cycle(self):
        if self._has_cycle("broader_id"):
            raise ValidationError(_("A concept hierarchy cannot contain a cycle."))
