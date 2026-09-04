import uuid

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, UserError, ValidationError


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
    youtube_listing_type = fields.Selection(
        [("playlist", "Playlist"), ("channel", "Channel")],
    )
    youtube_listing_id = fields.Char(copy=False)
    auto_enrich = fields.Boolean(
        string="Queue enrichment after ingestion",
        default=False,
    )

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

    @api.constrains("source_type", "youtube_listing_type", "youtube_listing_id")
    def _check_youtube_listing(self):
        for source in self:
            if source.source_type == "youtube" and bool(
                source.youtube_listing_type
            ) != bool(source.youtube_listing_id):
                raise ValidationError(
                    _("YouTube listing type and identifier must be configured together.")
                )

    def _ensure_curator(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can manage discovery."))

    def queue_discovery(self):
        self.ensure_one()
        self._ensure_curator()
        if (
            self.source_type != "youtube"
            or not self.youtube_listing_type
            or not self.youtube_listing_id
        ):
            raise UserError(_("Configure a YouTube playlist or channel first."))
        run_ref = uuid.uuid4().hex
        return self.env["facodi.job"].enqueue(
            "discover",
            f"discover:{self.id}:{run_ref}:first",
            {
                "source_id": self.id,
                "listing_type": self.youtube_listing_type,
                "listing_id": self.youtube_listing_id,
                "page_token": "",
                "run_ref": run_ref,
            },
            company=self.company_id,
        )

    def action_queue_discovery(self):
        job = self.queue_discovery()
        return {
            "type": "ir.actions.act_window",
            "res_model": "facodi.job",
            "res_id": job.id,
            "view_mode": "form",
        }

    @api.model
    def _run_discovery_job(self, payload):
        source = self.browse(int(payload.get("source_id") or 0)).exists()
        if not source:
            raise UserError(_("The discovery source no longer exists."))
        source.ensure_one()
        api_key = self.env["ir.config_parameter"].sudo().get_param(
            "facodi.youtube.api_key"
        )
        if not api_key:
            raise UserError(_("Configure the YouTube API key before discovery."))
        client = self.env["facodi.resource"]._ingestion_client()
        items, next_cursor = client.discover_youtube_page(
            listing_type=payload.get("listing_type") or source.youtube_listing_type,
            listing_id=payload.get("listing_id") or source.youtube_listing_id,
            api_key=api_key,
            page_token=payload.get("page_token") or "",
        )
        resource_ids = []
        for result in items:
            resource, _snapshot, _changed = self.env["facodi.resource"].ingest_result(
                source,
                result,
                enqueue_enrichment=source.auto_enrich,
            )
            resource_ids.append(resource.id)
        source.write(
            {
                "discovery_cursor": next_cursor or False,
                "last_discovered_at": fields.Datetime.now(),
            }
        )
        if next_cursor:
            run_ref = str(payload.get("run_ref") or uuid.uuid4().hex)
            self.env["facodi.job"].enqueue(
                "discover",
                f"discover:{source.id}:{run_ref}:{next_cursor}",
                {
                    "source_id": source.id,
                    "listing_type": payload.get("listing_type")
                    or source.youtube_listing_type,
                    "listing_id": payload.get("listing_id")
                    or source.youtube_listing_id,
                    "page_token": next_cursor,
                    "run_ref": run_ref,
                },
                company=source.company_id,
            )
        return {
            "ingested_count": len(resource_ids),
            "resource_ids": resource_ids,
            "next_cursor": next_cursor or "",
        }
