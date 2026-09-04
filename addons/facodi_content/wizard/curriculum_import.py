import base64

from odoo import _, fields, models
from odoo.exceptions import AccessError


class FacodiCurriculumImportWizard(models.TransientModel):
    _name = "facodi.curriculum.import.wizard"
    _description = "FACODI Import University Curriculum"

    source_id = fields.Many2one(
        "facodi.source",
        required=True,
        domain="[('source_type', '=', 'curriculum')]",
    )
    institution_partner_id = fields.Many2one(
        "res.partner",
        required=True,
        domain="[('is_company', '=', True)]",
    )
    filename = fields.Char(required=True)
    payload_file = fields.Binary(required=True, attachment=False)

    def action_import(self):
        self.ensure_one()
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can import curricula."))
        payload = base64.b64decode(self.payload_file or b"", validate=True)
        attachment = self.env["ir.attachment"].create(
            {
                "name": self.filename,
                "type": "binary",
                "raw": payload,
                "mimetype": (
                    "text/csv"
                    if self.filename.lower().endswith(".csv")
                    else "application/json"
                ),
            }
        )
        curriculum, _resource, _snapshot = self.env[
            "facodi.curriculum"
        ].import_payload(
            source=self.source_id,
            institution=self.institution_partner_id,
            payload=payload,
            filename=self.filename,
            attachment=attachment,
        )
        return {
            "type": "ir.actions.act_window",
            "name": curriculum.name,
            "res_model": "facodi.curriculum",
            "res_id": curriculum.id,
            "view_mode": "form",
        }
