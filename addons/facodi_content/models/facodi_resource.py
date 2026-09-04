import hashlib
import json

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, ValidationError


class FacodiResource(models.Model):
    _name = "facodi.resource"
    _description = "FACODI Educational Resource"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "write_date desc, id desc"

    name = fields.Char(required=True, translate=True, tracking=True)
    active = fields.Boolean(default=True)
    company_id = fields.Many2one(
        "res.company",
        required=True,
        default=lambda self: self.env.company,
        index=True,
    )
    source_id = fields.Many2one(
        "facodi.source",
        required=True,
        ondelete="restrict",
        index=True,
        tracking=True,
    )
    external_key = fields.Char(required=True, copy=False, index=True)
    source_url = fields.Char(index=True)
    resource_type = fields.Selection(
        [
            ("video", "Video"),
            ("playlist", "Playlist"),
            ("document", "Document"),
            ("article", "Article"),
            ("book", "Book"),
            ("chapter", "Chapter"),
            ("exercise", "Exercise"),
            ("quiz", "Quiz"),
            ("module", "Module"),
            ("course", "Course"),
            ("curricular_unit", "Curricular Unit"),
            ("curriculum", "Curriculum"),
            ("external", "External Resource"),
        ],
        required=True,
        default="external",
        index=True,
    )
    source_language_code = fields.Char(index=True)
    description = fields.Html(translate=True, sanitize_overridable=True)
    author_partner_id = fields.Many2one("res.partner", ondelete="set null")
    institution_partner_id = fields.Many2one("res.partner", ondelete="set null")
    publication_date = fields.Date()
    duration_minutes = fields.Float()
    source_author_name = fields.Char(readonly=True)
    source_institution_name = fields.Char(readonly=True)
    mime_type = fields.Char(readonly=True)
    content_text = fields.Text(readonly=True)
    last_ingested_at = fields.Datetime(copy=False, readonly=True, index=True)
    state = fields.Selection(
        [
            ("discovered", "Discovered"),
            ("ingested", "Ingested"),
            ("rights_review", "Rights Review"),
            ("enrichment", "Enrichment"),
            ("review", "Review"),
            ("approved", "Approved"),
            ("published", "Published"),
            ("stale", "Stale"),
            ("rejected", "Rejected"),
            ("error", "Error"),
        ],
        required=True,
        default="discovered",
        copy=False,
        index=True,
        tracking=True,
    )
    rights_status = fields.Selection(
        [
            ("unknown", "Unknown"),
            ("open", "Open"),
            ("creative_commons", "Creative Commons"),
            ("restricted", "Restricted"),
            ("needs_review", "Needs Review"),
            ("not_eligible", "Not Eligible"),
        ],
        default="unknown",
        required=True,
        tracking=True,
    )
    usage_mode = fields.Selection(
        [
            ("undecided", "Undecided"),
            ("redistribute", "Redistribute"),
            ("embed", "Embed"),
            ("link", "External Link"),
            ("metadata", "Metadata Only"),
            ("forbidden", "Forbidden"),
        ],
        default="undecided",
        required=True,
        tracking=True,
    )
    license_id = fields.Many2one("facodi.license", ondelete="restrict")
    rights_notes = fields.Text()
    rights_reviewed_by_id = fields.Many2one(
        "res.users",
        copy=False,
        readonly=True,
        ondelete="set null",
    )
    rights_reviewed_at = fields.Datetime(copy=False, readonly=True)
    publication_eligible = fields.Boolean(
        compute="_compute_publication_eligible",
        store=True,
    )
    snapshot_ids = fields.One2many(
        "facodi.resource.snapshot",
        "resource_id",
        string="Snapshots",
    )
    current_snapshot_id = fields.Many2one(
        "facodi.resource.snapshot",
        copy=False,
        ondelete="restrict",
    )
    snapshot_count = fields.Integer(compute="_compute_snapshot_count")

    _source_external_key_unique = models.Constraint(
        "UNIQUE(source_id, external_key)",
        "A source external key can identify only one FACODI resource.",
    )

    @api.depends(
        "rights_status",
        "usage_mode",
        "license_id",
        "rights_reviewed_at",
    )
    def _compute_publication_eligible(self):
        for resource in self:
            status_ok = resource.rights_status in {
                "open",
                "creative_commons",
                "restricted",
            }
            mode_ok = resource.usage_mode in {
                "redistribute",
                "embed",
                "link",
                "metadata",
            }
            license_ok = (
                resource.rights_status != "creative_commons"
                or bool(resource.license_id)
            )
            resource.publication_eligible = bool(
                resource.rights_reviewed_at and status_ok and mode_ok and license_ok
            )

    @api.depends("snapshot_ids")
    def _compute_snapshot_count(self):
        counts = self.env["facodi.resource.snapshot"]._read_group(
            [("resource_id", "in", self.ids)],
            ["resource_id"],
            ["__count"],
        ) if self.ids else []
        mapped = {resource.id: count for resource, count in counts}
        for resource in self:
            resource.snapshot_count = mapped.get(resource.id, 0)

    @api.constrains("source_id", "company_id")
    def _check_source_company(self):
        for resource in self:
            if resource.source_id.company_id != resource.company_id:
                raise ValidationError(_("The resource and source must belong to the same company."))

    def action_confirm_rights(self):
        self._ensure_curator()
        now = fields.Datetime.now()
        for resource in self:
            rejected = (
                resource.rights_status == "not_eligible"
                or resource.usage_mode == "forbidden"
            )
            resource.write(
                {
                    "rights_reviewed_by_id": self.env.user.id,
                    "rights_reviewed_at": now,
                    "state": "rejected" if rejected else "review",
                }
            )
        return True

    def record_snapshot(
        self,
        payload,
        *,
        source_version=None,
        attachment=None,
        captured_at=None,
    ):
        self.ensure_one()
        if not isinstance(payload, dict):
            raise ValidationError(_("Snapshot payload must be a JSON object."))
        canonical = json.dumps(
            payload,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        checksum = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        snapshot = self.env["facodi.resource.snapshot"].search(
            [("resource_id", "=", self.id), ("checksum", "=", checksum)],
            limit=1,
        )
        if not snapshot:
            snapshot = self.env["facodi.resource.snapshot"].create(
                {
                    "resource_id": self.id,
                    "checksum": checksum,
                    "payload_json": payload,
                    "source_version": source_version,
                    "attachment_id": attachment.id if attachment else False,
                    "captured_at": captured_at or fields.Datetime.now(),
                    "captured_by_id": self.env.user.id,
                }
            )
        if self.current_snapshot_id != snapshot:
            self.current_snapshot_id = snapshot
        return snapshot

    @api.model
    def ingest_result(
        self,
        source,
        result,
        *,
        attachment=None,
        enqueue_enrichment=False,
    ):
        """Atomically materialise one normalised adapter result."""
        source.ensure_one()
        if not isinstance(result, dict):
            raise ValidationError(_("An ingestion result must be a JSON object."))
        external_key = str(result.get("external_key") or "").strip()
        name = str(result.get("name") or "").strip()
        snapshot_payload = result.get("snapshot_payload")
        if not external_key or not name or not isinstance(snapshot_payload, dict):
            raise ValidationError(
                _("The ingestion result needs an identity, title and snapshot payload.")
            )
        resource = self.search(
            [("source_id", "=", source.id), ("external_key", "=", external_key)],
            limit=1,
        )
        common_values = {
            "name": name,
            "source_url": result.get("source_url") or False,
            "resource_type": result.get("resource_type") or "external",
            "source_language_code": result.get("source_language_code") or False,
            "description": result.get("description") or False,
            "publication_date": result.get("publication_date") or False,
            "duration_minutes": float(result.get("duration_minutes") or 0.0),
            "source_author_name": result.get("author_name") or False,
            "source_institution_name": result.get("institution_name") or False,
            "mime_type": result.get("mime_type") or False,
            "content_text": result.get("content_text") or False,
            "last_ingested_at": fields.Datetime.now(),
        }
        if not resource:
            resource = self.create(
                {
                    **common_values,
                    "company_id": source.company_id.id,
                    "source_id": source.id,
                    "external_key": external_key,
                }
            )
        previous_snapshot = resource.current_snapshot_id
        snapshot = resource.record_snapshot(
            snapshot_payload,
            source_version=result.get("source_version") or False,
            attachment=attachment,
        )
        changed = not previous_snapshot or previous_snapshot != snapshot
        values = {"last_ingested_at": common_values["last_ingested_at"]}
        if changed:
            values.update(common_values)
            values["state"] = (
                "stale" if resource.state == "published" else "rights_review"
            )
        resource.write(values)
        if enqueue_enrichment:
            self.env["facodi.job"].enqueue(
                "enrich",
                f"enrich:{resource.id}:{snapshot.checksum}",
                {
                    "resource_id": resource.id,
                    "snapshot_id": snapshot.id,
                    "snapshot_checksum": snapshot.checksum,
                },
                company=resource.company_id,
                resource=resource,
            )
        return resource, snapshot, bool(changed)

    def _ensure_curator(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can perform this action."))
