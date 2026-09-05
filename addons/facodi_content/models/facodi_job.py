import logging
from datetime import timedelta

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError


_logger = logging.getLogger(__name__)


class FacodiJob(models.Model):
    _name = "facodi.job"
    _description = "FACODI Background Job"
    _rec_name = "idempotency_key"
    _order = "priority desc, run_after, id"

    kind = fields.Selection(
        [
            ("discover", "Discover"),
            ("ingest", "Ingest"),
            ("enrich", "Enrich"),
            ("match", "Match"),
            ("coverage", "Coverage"),
            ("compose", "Compose"),
            ("publish", "Publish"),
            ("refresh", "Refresh"),
            ("skill_sync", "Skill Sync"),
        ],
        required=True,
        index=True,
    )
    state = fields.Selection(
        [
            ("queued", "Queued"),
            ("running", "Running"),
            ("done", "Done"),
            ("failed", "Failed"),
            ("cancelled", "Cancelled"),
        ],
        required=True,
        default="queued",
        copy=False,
        index=True,
    )
    idempotency_key = fields.Char(required=True, copy=False, index=True)
    priority = fields.Integer(default=50, index=True)
    run_after = fields.Datetime(
        required=True,
        default=fields.Datetime.now,
        copy=False,
        index=True,
    )
    payload_json = fields.Json(default=dict, copy=False)
    result_json = fields.Json(copy=False, readonly=True)
    attempt_count = fields.Integer(default=0, copy=False, readonly=True)
    max_attempts = fields.Integer(default=3)
    locked_at = fields.Datetime(copy=False, readonly=True, index=True)
    locked_by_id = fields.Many2one(
        "res.users",
        copy=False,
        readonly=True,
        ondelete="set null",
    )
    error = fields.Text(copy=False, readonly=True)
    started_at = fields.Datetime(copy=False, readonly=True)
    completed_at = fields.Datetime(copy=False, readonly=True)
    company_id = fields.Many2one(
        "res.company",
        required=True,
        default=lambda self: self.env.company,
        index=True,
    )
    resource_id = fields.Many2one(
        "facodi.resource",
        ondelete="cascade",
        index=True,
    )

    _idempotency_company_unique = models.Constraint(
        "UNIQUE(company_id, idempotency_key)",
        "A FACODI job idempotency key can be used only once per company.",
    )

    @api.constrains("max_attempts")
    def _check_max_attempts(self):
        for job in self:
            if job.max_attempts < 1:
                raise ValidationError(_("Maximum attempts must be at least one."))

    @api.model
    def enqueue(
        self,
        kind,
        idempotency_key,
        payload,
        *,
        priority=50,
        run_after=None,
        max_attempts=3,
        company=None,
        resource=None,
    ):
        company = company or self.env.company
        existing = self.search(
            [
                ("company_id", "=", company.id),
                ("idempotency_key", "=", idempotency_key),
            ],
            limit=1,
        )
        if existing:
            return existing
        return self.create(
            {
                "kind": kind,
                "idempotency_key": idempotency_key,
                "payload_json": payload or {},
                "priority": priority,
                "run_after": run_after or fields.Datetime.now(),
                "max_attempts": max_attempts,
                "company_id": company.id,
                "resource_id": resource.id if resource else False,
            }
        )

    @api.model
    def claim_next(self):
        now = fields.Datetime.now()
        self.env.cr.execute(
            """
                SELECT id
                  FROM facodi_job
                 WHERE state = 'queued'
                   AND run_after <= %s
                   AND company_id = ANY(%s)
                 ORDER BY priority DESC, run_after, id
                   FOR UPDATE SKIP LOCKED
                 LIMIT 1
            """,
            (now, self.env.companies.ids),
        )
        row = self.env.cr.fetchone()
        if not row:
            return self.browse()
        job = self.browse(row[0])
        job.write(
            {
                "state": "running",
                "attempt_count": job.attempt_count + 1,
                "locked_at": now,
                "locked_by_id": self.env.user.id,
                "started_at": job.started_at or now,
                "error": False,
            }
        )
        return job

    def mark_done(self, result=None):
        now = fields.Datetime.now()
        for job in self:
            if job.state != "running":
                raise UserError(_("Only a running job can be completed."))
            job.write(
                {
                    "state": "done",
                    "result_json": result or {},
                    "completed_at": now,
                    "locked_at": False,
                    "locked_by_id": False,
                    "error": False,
                }
            )
        return True

    def mark_failed(self, error):
        now = fields.Datetime.now()
        safe_error = str(error or _("Unknown job error."))[:2000]
        for job in self:
            if job.state != "running":
                raise UserError(_("Only a running job can fail."))
            terminal = job.attempt_count >= job.max_attempts
            values = {
                "state": "failed" if terminal else "queued",
                "error": safe_error,
                "locked_at": False,
                "locked_by_id": False,
                "completed_at": now if terminal else False,
            }
            if not terminal:
                delay_minutes = min(2 ** job.attempt_count, 60)
                values["run_after"] = now + timedelta(minutes=delay_minutes)
            job.write(values)
        return True

    @api.model
    def recover_stale_locks(self, max_age_minutes=30):
        threshold = fields.Datetime.now() - timedelta(minutes=max_age_minutes)
        jobs = self.search(
            [("state", "=", "running"), ("locked_at", "<", threshold)]
        )
        if jobs:
            jobs.write(
                {
                    "state": "queued",
                    "locked_at": False,
                    "locked_by_id": False,
                    "run_after": fields.Datetime.now(),
                    "error": _("Recovered after a stale worker lock."),
                }
            )
        return len(jobs)

    def _dispatch(self):
        self.ensure_one()
        if self.kind == "ingest":
            return self.env["facodi.resource"]._run_ingest_job(self.payload_json or {})
        if self.kind == "discover":
            return self.env["facodi.source"]._run_discovery_job(self.payload_json or {})
        if self.kind == "enrich":
            return self.env["facodi.analysis.run"]._run_enrichment_job(
                self.payload_json or {}
            )
        if self.kind == "match":
            return self.env["facodi.resource.unit.match"]._run_match_job(
                self.payload_json or {}
            )
        if self.kind == "coverage":
            return self.env["facodi.coverage"]._run_coverage_job(
                self.payload_json or {}
            )
        if self.kind == "refresh":
            return self.env["facodi.resource"]._run_refresh_job(
                self.payload_json or {}
            )
        raise UserError(_("No handler is registered for job kind %s.", self.kind))

    @api.model
    def _cron_run_pending_jobs(self, limit=20):
        self.recover_stale_locks()
        processed = 0
        while processed < limit:
            job = self.claim_next()
            if not job:
                break
            try:
                result = job._dispatch()
                job.mark_done(result)
            except Exception as error:  # cron boundary: persist and continue
                _logger.exception("FACODI job %s failed", job.id)
                job.mark_failed(error)
            processed += 1
        return processed
