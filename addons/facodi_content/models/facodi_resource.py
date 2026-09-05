import hashlib
import json
from datetime import timedelta

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, ValidationError

from ..services.ingestion import (
    IngestionClient,
    canonicalise_source_url,
    normalise_pdf,
    youtube_video_id,
)


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
    difficulty_level = fields.Selection(
        [
            ("beginner", "Beginner"),
            ("intermediate", "Intermediate"),
            ("advanced", "Advanced"),
            ("expert", "Expert"),
        ],
        copy=False,
    )
    source_author_name = fields.Char(readonly=True)
    source_institution_name = fields.Char(readonly=True)
    mime_type = fields.Char(readonly=True)
    content_text = fields.Text(readonly=True)
    last_ingested_at = fields.Datetime(copy=False, readonly=True, index=True)
    refresh_enabled = fields.Boolean(default=False)
    refresh_interval_days = fields.Integer(default=7)
    last_checked_at = fields.Datetime(copy=False, readonly=True, index=True)
    next_check_at = fields.Datetime(copy=False, index=True)
    etag = fields.Char(copy=False)
    last_modified = fields.Char(copy=False)
    availability_status = fields.Selection(
        [
            ("unknown", "Unknown"),
            ("available", "Available"),
            ("missing", "Missing"),
            ("unreachable", "Unreachable"),
        ],
        required=True,
        default="unknown",
        copy=False,
        index=True,
    )
    refresh_error = fields.Text(copy=False, readonly=True)
    update_ids = fields.One2many(
        "facodi.resource.update",
        "resource_id",
        copy=False,
    )
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

    @api.constrains("refresh_interval_days")
    def _check_refresh_interval(self):
        for resource in self:
            if resource.refresh_interval_days < 1 or resource.refresh_interval_days > 365:
                raise ValidationError(
                    _("Refresh interval must be between 1 and 365 days.")
                )

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

    @api.model
    def enqueue_url_ingestion(
        self,
        source,
        url,
        *,
        language_code="",
        enqueue_enrichment=False,
    ):
        source.ensure_one()
        try:
            video_id = youtube_video_id(url)
        except ValueError:
            canonical_url = canonicalise_source_url(url)
        else:
            canonical_url = f"https://www.youtube.com/watch?v={video_id}"
        digest = hashlib.sha256(canonical_url.encode("utf-8")).hexdigest()
        return self.env["facodi.job"].enqueue(
            "ingest",
            f"ingest:url:{source.id}:{digest}",
            {
                "source_id": source.id,
                "url": canonical_url,
                "language_code": str(language_code or ""),
                "enqueue_enrichment": bool(enqueue_enrichment),
            },
            company=source.company_id,
        )

    @api.model
    def enqueue_attachment_ingestion(
        self,
        source,
        attachment,
        *,
        enqueue_enrichment=False,
    ):
        source.ensure_one()
        attachment.ensure_one()
        digest = attachment.checksum or hashlib.sha256(attachment.raw or b"").hexdigest()
        return self.env["facodi.job"].enqueue(
            "ingest",
            f"ingest:attachment:{source.id}:{digest}",
            {
                "source_id": source.id,
                "attachment_id": attachment.id,
                "enqueue_enrichment": bool(enqueue_enrichment),
            },
            company=source.company_id,
        )

    @api.model
    def _ingestion_client(self):
        parameters = self.env["ir.config_parameter"].sudo()
        try:
            timeout = int(parameters.get_param("facodi.connector.timeout") or 20)
        except (TypeError, ValueError):
            timeout = 20
        try:
            max_bytes = int(
                parameters.get_param("facodi.connector.max_bytes")
                or 10 * 1024 * 1024
            )
        except (TypeError, ValueError):
            max_bytes = 10 * 1024 * 1024
        return IngestionClient(
            timeout=max(1, min(timeout, 60)),
            max_bytes=max(1024, min(max_bytes, 50 * 1024 * 1024)),
        )

    @api.model
    def _run_ingest_job(self, payload):
        source = self.env["facodi.source"].browse(
            int(payload.get("source_id") or 0)
        ).exists()
        if not source:
            raise ValidationError(_("The ingestion source no longer exists."))
        source.ensure_one()
        attachment = self.env["ir.attachment"]
        if payload.get("attachment_id"):
            attachment = self.env["ir.attachment"].browse(
                int(payload["attachment_id"])
            ).exists()
            if not attachment:
                raise ValidationError(_("The uploaded document no longer exists."))
            from odoo.tools.pdf import PdfFileReader

            result = normalise_pdf(
                attachment.name,
                attachment.raw or b"",
                reader_factory=PdfFileReader,
            )
        elif payload.get("url"):
            result = self._ingestion_client().ingest_url(
                payload["url"],
                language_code=payload.get("language_code") or "",
            )
        else:
            raise ValidationError(_("The ingestion job has no URL or attachment."))
        resource, snapshot, changed = self.ingest_result(
            source,
            result,
            attachment=attachment or None,
            enqueue_enrichment=bool(payload.get("enqueue_enrichment")),
        )
        return {
            "resource_id": resource.id,
            "snapshot_id": snapshot.id,
            "changed": bool(changed),
        }

    def queue_enrichment(self, *, requested_language_code=""):
        self.ensure_one()
        self._ensure_curator()
        if not self.current_snapshot_id:
            raise ValidationError(_("Ingest a resource snapshot before enrichment."))
        parameters = self.env["ir.config_parameter"].sudo()
        model_name = parameters.get_param("facodi.ai.model") or ""
        prompt_version = parameters.get_param("facodi.ai.prompt_version") or "facodi-v1"
        if not model_name:
            raise ValidationError(_("Configure the FACODI AI model first."))
        input_payload = {
            "resource": {
                "name": self.name,
                "description": str(self.description or ""),
                "resource_type": self.resource_type,
                "source_language_code": self.source_language_code or "",
            },
            "snapshot": self.current_snapshot_id.payload_json,
        }
        run = self.env["facodi.analysis.run"].get_or_create(
            resource=self,
            snapshot=self.current_snapshot_id,
            provider="openai_compatible",
            model_name=model_name,
            prompt_version=prompt_version,
            source_language_code=self.source_language_code or "",
            requested_language_code=requested_language_code or "",
            input_payload=input_payload,
        )
        job = self.env["facodi.job"].enqueue(
            "enrich",
            f"enrich:{run.id}:{run.input_hash}",
            {"analysis_run_id": run.id},
            company=self.company_id,
            resource=self,
        )
        if self.state not in {"published", "stale", "rejected"}:
            self.state = "enrichment"
        return run, job

    def queue_refresh(self):
        self.ensure_one()
        self._ensure_curator()
        if not self.source_url:
            raise ValidationError(_("Only resources with a source URL can be refreshed."))
        if not self.current_snapshot_id:
            raise ValidationError(_("A resource needs a snapshot before refresh."))
        due_at = self.next_check_at or fields.Datetime.now()
        identity = fields.Datetime.to_string(due_at)
        return self.env["facodi.job"].enqueue(
            "refresh",
            f"refresh:{self.id}:{self.current_snapshot_id.checksum}:{identity}",
            {"resource_id": self.id},
            company=self.company_id,
            resource=self,
        )

    @api.model
    def _cron_queue_due_refresh(self, limit=100):
        due = self.search(
            [
                ("refresh_enabled", "=", True),
                ("source_url", "!=", False),
                ("current_snapshot_id", "!=", False),
                "|",
                ("next_check_at", "=", False),
                ("next_check_at", "<=", fields.Datetime.now()),
            ],
            order="next_check_at, id",
            limit=limit,
        )
        for resource in due:
            resource.queue_refresh()
        return len(due)

    @api.model
    def _run_refresh_job(self, payload):
        resource = self.browse(int(payload.get("resource_id") or 0)).exists()
        if not resource:
            raise ValidationError(_("The refresh resource no longer exists."))
        resource.ensure_one()
        checked_at = fields.Datetime.now()
        next_check_at = checked_at + timedelta(days=resource.refresh_interval_days)
        try:
            result = resource._ingestion_client().refresh_url(
                resource.source_url,
                etag=resource.etag or "",
                last_modified=resource.last_modified or "",
                language_code=resource.source_language_code or "",
            )
        except Exception as error:
            safe_error = str(error)[:2000]
            resource.write(
                {
                    "availability_status": "unreachable",
                    "refresh_error": safe_error,
                    "last_checked_at": checked_at,
                    "next_check_at": next_check_at,
                    "state": (
                        "stale"
                        if resource.state in {"published", "stale"}
                        else "error"
                    ),
                }
            )
            raise
        status = result.get("status")
        common_values = {
            "etag": result.get("etag") or resource.etag or False,
            "last_modified": (
                result.get("last_modified") or resource.last_modified or False
            ),
            "last_checked_at": checked_at,
            "next_check_at": next_check_at,
            "refresh_error": False,
        }
        if status == "not_modified":
            common_values["availability_status"] = "available"
            resource.write(common_values)
            return {
                "resource_id": resource.id,
                "snapshot_id": resource.current_snapshot_id.id,
                "status": status,
                "changed": False,
            }
        if status == "missing":
            common_values.update(
                {
                    "availability_status": "missing",
                    "state": (
                        "stale"
                        if resource.state in {"published", "stale"}
                        else "error"
                    ),
                }
            )
            resource.write(common_values)
            return {
                "resource_id": resource.id,
                "snapshot_id": resource.current_snapshot_id.id,
                "status": status,
                "changed": False,
            }
        if status != "changed" or not isinstance(result.get("result"), dict):
            raise ValidationError(_("The refresh adapter returned an invalid result."))
        previous_snapshot = resource.current_snapshot_id
        resource, snapshot, changed = self.ingest_result(
            resource.source_id,
            result["result"],
        )
        common_values["availability_status"] = "available"
        resource.write(common_values)
        update = self.env["facodi.resource.update"]
        if changed and previous_snapshot and previous_snapshot != snapshot:
            update = update.search(
                [
                    ("resource_id", "=", resource.id),
                    ("previous_snapshot_id", "=", previous_snapshot.id),
                    ("proposed_snapshot_id", "=", snapshot.id),
                ],
                limit=1,
            )
            if not update:
                published_impact = bool(
                    self.env["facodi.publication.item"].search_count(
                        [
                            ("resource_id", "=", resource.id),
                            ("snapshot_id", "=", previous_snapshot.id),
                            ("publication_id.state", "=", "published"),
                        ],
                        limit=1,
                    )
                )
                update = self.env["facodi.resource.update"].create(
                    {
                        "resource_id": resource.id,
                        "previous_snapshot_id": previous_snapshot.id,
                        "proposed_snapshot_id": snapshot.id,
                        "published_impact": published_impact,
                    }
                )
        return {
            "resource_id": resource.id,
            "snapshot_id": snapshot.id,
            "status": status,
            "changed": bool(changed),
            "update_id": update.id or False,
        }

    def native_feedback_signals(self):
        """Read native eLearning usage without creating a parallel progress store."""

        self.ensure_one()
        slides = self.env["slide.slide"].search(
            [("facodi_resource_id", "=", self.id)]
        )
        completions = self.env["slide.slide.partner"].search_count(
            [("slide_id", "in", slides.ids), ("completed", "=", True)]
        ) if slides else 0
        return {
            "slide_ids": slides.ids,
            "channel_ids": slides.mapped("channel_id").ids,
            "total_views": sum(slides.mapped("total_views")),
            "likes": sum(slides.mapped("likes")),
            "dislikes": sum(slides.mapped("dislikes")),
            "completion_count": completions,
        }

    def _ensure_curator(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can perform this action."))
