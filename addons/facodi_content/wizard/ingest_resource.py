from odoo import _, fields, models
from odoo.exceptions import AccessError, UserError


class FacodiIngestResourceWizard(models.TransientModel):
    _name = "facodi.ingest.resource.wizard"
    _description = "FACODI Ingest Educational Resources"

    source_id = fields.Many2one(
        "facodi.source",
        required=True,
        domain="[('active', '=', True)]",
    )
    source_url = fields.Char(string="Single URL")
    batch_urls = fields.Text(string="Batch URLs", help="One HTTPS URL per line.")
    attachment_id = fields.Many2one(
        "ir.attachment",
        string="Uploaded PDF",
        domain="[('mimetype', '=', 'application/pdf')]",
    )
    source_language_code = fields.Char(string="Source language")
    enqueue_enrichment = fields.Boolean(default=True)

    def action_enqueue(self):
        self.ensure_one()
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can ingest resources."))
        urls = []
        for value in [self.source_url, *(self.batch_urls or "").splitlines()]:
            value = str(value or "").strip()
            if value and value not in urls:
                urls.append(value)
        if not urls and not self.attachment_id:
            raise UserError(_("Provide at least one URL or one PDF attachment."))
        jobs = self.env["facodi.job"]
        resource_model = self.env["facodi.resource"]
        for url in urls:
            jobs |= resource_model.enqueue_url_ingestion(
                self.source_id,
                url,
                language_code=self.source_language_code or "",
                enqueue_enrichment=self.enqueue_enrichment,
            )
        if self.attachment_id:
            jobs |= resource_model.enqueue_attachment_ingestion(
                self.source_id,
                self.attachment_id,
                enqueue_enrichment=self.enqueue_enrichment,
            )
        return {
            "type": "ir.actions.act_window",
            "name": _("FACODI ingestion jobs"),
            "res_model": "facodi.job",
            "view_mode": "list,form",
            "domain": [("id", "in", jobs.ids)],
        }
