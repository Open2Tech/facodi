from datetime import timedelta

from odoo import fields
from odoo.tests import tagged

from .common import FacodiCase


@tagged("post_install", "-at_install")
class TestFacodiJobQueue(FacodiCase):
    def test_job_model_is_registered(self):
        """Catches removal of the Odoo-native background queue."""
        self.assertIn("facodi.job", self.env.registry.models)

    def test_enqueue_reuses_idempotency_key(self):
        jobs = self.env["facodi.job"]

        first = jobs.enqueue(
            "ingest",
            "ingest:youtube:abcdefghijk",
            {"source_url": "https://www.youtube.com/watch?v=abcdefghijk"},
        )
        repeated = jobs.enqueue(
            "ingest",
            "ingest:youtube:abcdefghijk",
            {"source_url": "https://www.youtube.com/watch?v=abcdefghijk"},
        )

        self.assertEqual(first, repeated)
        self.assertEqual(first.state, "queued")
        self.assertEqual(first.attempt_count, 0)

    def test_claim_next_prefers_high_priority_ready_job(self):
        jobs = self.env["facodi.job"]
        low = jobs.enqueue("refresh", "refresh:low", {}, priority=10)
        delayed = jobs.enqueue(
            "refresh",
            "refresh:delayed",
            {},
            priority=90,
            run_after=fields.Datetime.now() + timedelta(hours=1),
        )
        high = jobs.enqueue("ingest", "ingest:high", {}, priority=80)

        claimed = jobs.claim_next()

        self.assertEqual(claimed, high)
        self.assertEqual(claimed.state, "running")
        self.assertEqual(claimed.attempt_count, 1)
        self.assertTrue(claimed.locked_at)
        self.assertEqual(claimed.locked_by_id, self.env.user)
        self.assertEqual(low.state, "queued")
        self.assertEqual(delayed.state, "queued")

    def test_failure_requeues_then_stops_at_max_attempts(self):
        job = self.env["facodi.job"].enqueue(
            "ingest",
            "ingest:retry",
            {},
            max_attempts=2,
        )
        self.assertEqual(self.env["facodi.job"].claim_next(), job)

        job.mark_failed("temporary upstream failure")
        self.assertEqual(job.state, "queued")
        self.assertGreater(job.run_after, fields.Datetime.now())

        job.run_after = fields.Datetime.now()
        self.assertEqual(self.env["facodi.job"].claim_next(), job)
        job.mark_failed("permanent upstream failure")

        self.assertEqual(job.state, "failed")
        self.assertTrue(job.completed_at)
        self.assertEqual(job.error, "permanent upstream failure")

    def test_success_records_result_and_releases_lock(self):
        job = self.env["facodi.job"].enqueue("coverage", "coverage:unit:7", {})
        self.env["facodi.job"].claim_next()

        job.mark_done({"coverage_id": 42})

        self.assertEqual(job.state, "done")
        self.assertEqual(job.result_json, {"coverage_id": 42})
        self.assertTrue(job.completed_at)
        self.assertFalse(job.locked_at)
        self.assertFalse(job.locked_by_id)

    def test_stale_running_job_is_requeued(self):
        job = self.env["facodi.job"].enqueue("refresh", "refresh:stale", {})
        self.env["facodi.job"].claim_next()
        job.locked_at = fields.Datetime.now() - timedelta(hours=2)

        recovered = self.env["facodi.job"].recover_stale_locks(max_age_minutes=30)

        self.assertEqual(recovered, 1)
        self.assertEqual(job.state, "queued")
        self.assertFalse(job.locked_at)
