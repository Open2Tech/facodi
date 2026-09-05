from datetime import timedelta
from unittest.mock import patch

from odoo import fields
from odoo.tests import tagged

from .common import FacodiCase


@tagged("post_install", "-at_install")
class TestFacodiUpdateCycle(FacodiCase):
    def _published_resource(self):
        resource = self.create_resource(
            external_key="url:update-cycle",
            name="Original lesson",
            source_url="https://example.org/lesson",
            resource_type="article",
            rights_status="open",
            usage_mode="link",
            rights_reviewed_by_id=self.env.user.id,
            rights_reviewed_at="2026-09-05 10:00:00",
            state="approved",
            refresh_enabled=True,
            refresh_interval_days=7,
            next_check_at=fields.Datetime.now() - timedelta(minutes=1),
            etag='"v1"',
            last_modified="Fri, 04 Sep 2026 12:00:00 GMT",
        )
        snapshot = resource.record_snapshot(
            {"title": "Original lesson", "version": "v1"},
            source_version="v1",
        )
        composition = self.env["facodi.composition"].create(
            {
                "name": "Update course",
                "composition_type": "course",
                "origin": "manual",
                "company_id": self.company.id,
            }
        )
        self.env["facodi.composition.item"].create(
            {
                "composition_id": composition.id,
                "resource_id": resource.id,
                "snapshot_id": snapshot.id,
            }
        )
        composition.action_submit_review()
        composition.action_approve()
        publication = self.env["facodi.publication"].prepare_for_composition(
            composition
        )
        publication.action_publish()
        return resource, snapshot, publication

    def _changed_result(self):
        return {
            "external_key": "url:update-cycle",
            "source_url": "https://example.org/lesson",
            "resource_type": "article",
            "name": "Revised lesson",
            "description": "Updated public material",
            "source_language_code": "en",
            "author_name": "Open Lecturer",
            "institution_name": "Open Faculty",
            "mime_type": "text/html",
            "source_version": '"v2"',
            "snapshot_payload": {
                "provider": "website",
                "facts": {"title": "Revised lesson", "version": "v2"},
            },
        }

    def test_due_refresh_sends_validators_and_reschedules_unchanged_resource(self):
        resource, snapshot, publication = self._published_resource()

        class FakeClient:
            def refresh_url(self, url, **values):
                self.url = url
                self.values = values
                return {
                    "status": "not_modified",
                    "etag": '"v1"',
                    "last_modified": "Fri, 04 Sep 2026 12:00:00 GMT",
                }

        fake = FakeClient()
        job = resource.queue_refresh()
        with patch.object(type(resource), "_ingestion_client", return_value=fake):
            result = job._dispatch()

        self.assertFalse(result["changed"])
        self.assertEqual(fake.url, resource.source_url)
        self.assertEqual(fake.values["etag"], '"v1"')
        self.assertEqual(resource.current_snapshot_id, snapshot)
        self.assertEqual(resource.state, "published")
        self.assertEqual(resource.availability_status, "available")
        self.assertTrue(resource.last_checked_at)
        self.assertGreater(resource.next_check_at, fields.Datetime.now())
        self.assertEqual(publication.item_ids.snapshot_id, snapshot)

    def test_changed_source_stays_offline_until_human_accepts_revision(self):
        resource, original_snapshot, original_publication = self._published_resource()
        original_slide = original_publication.item_ids.slide_id

        class FakeClient:
            def refresh_url(self, *_args, **_kwargs):
                return {
                    "status": "changed",
                    "etag": '"v2"',
                    "last_modified": "Sat, 05 Sep 2026 12:00:00 GMT",
                    "result": changed_result,
                }

        changed_result = self._changed_result()
        job = resource.queue_refresh()
        with patch.object(type(resource), "_ingestion_client", return_value=FakeClient()):
            outcome = job._dispatch()

        update = self.env["facodi.resource.update"].browse(outcome["update_id"])
        revised_snapshot = resource.current_snapshot_id
        self.assertTrue(update.exists())
        self.assertEqual(update.state, "proposed")
        self.assertEqual(update.previous_snapshot_id, original_snapshot)
        self.assertEqual(update.proposed_snapshot_id, revised_snapshot)
        self.assertEqual(resource.state, "stale")
        self.assertEqual(resource.snapshot_count, 2)
        self.assertEqual(original_publication.item_ids.snapshot_id, original_snapshot)
        self.assertEqual(original_slide.facodi_snapshot_id, original_snapshot)
        self.assertEqual(original_slide.name, "Original lesson")

        update.action_accept(note="Reviewed against the new source snapshot.")

        revisions = self.env["facodi.publication"].search(
            [("composition_id", "=", original_publication.composition_id.id)],
            order="revision",
        )
        self.assertEqual(len(revisions), 2)
        self.assertEqual(revisions[0].state, "superseded")
        self.assertEqual(revisions[1].state, "published")
        self.assertEqual(revisions[1].item_ids.snapshot_id, revised_snapshot)
        self.assertEqual(revisions[1].item_ids.slide_id, original_slide)
        self.assertEqual(original_slide.facodi_snapshot_id, revised_snapshot)
        self.assertEqual(original_slide.name, "Revised lesson")
        self.assertEqual(resource.state, "published")
        self.assertEqual(update.state, "accepted")
        review = self.env["facodi.review"].search([("update_id", "=", update.id)])
        self.assertEqual(review.decision, "accept")

    def test_missing_then_available_source_preserves_snapshot_and_trace(self):
        resource, snapshot, _publication = self._published_resource()

        class MissingClient:
            def refresh_url(self, *_args, **_kwargs):
                return {
                    "status": "missing",
                    "etag": "",
                    "last_modified": "",
                }

        job = resource.queue_refresh()
        with patch.object(type(resource), "_ingestion_client", return_value=MissingClient()):
            outcome = job._dispatch()

        self.assertEqual(outcome["status"], "missing")
        self.assertEqual(resource.availability_status, "missing")
        self.assertEqual(resource.state, "stale")
        self.assertEqual(resource.current_snapshot_id, snapshot)

        resource.next_check_at = fields.Datetime.now() - timedelta(minutes=1)

        class AvailableClient:
            def refresh_url(self, *_args, **_kwargs):
                return {"status": "not_modified", "etag": '"v1"'}

        retry = resource.queue_refresh()
        with patch.object(type(resource), "_ingestion_client", return_value=AvailableClient()):
            retry._dispatch()

        self.assertEqual(resource.availability_status, "available")
        self.assertEqual(resource.current_snapshot_id, snapshot)
        self.assertEqual(resource.state, "stale")

    def test_feedback_reads_native_elearning_records_without_copying_progress(self):
        resource, _snapshot, publication = self._published_resource()
        slide = publication.item_ids.slide_id
        learner = self.env["res.partner"].create({"name": "Learner"})
        slide.public_views = 4
        self.env["slide.slide.partner"].create(
            {
                "slide_id": slide.id,
                "partner_id": learner.id,
                "vote": 1,
                "completed": True,
            }
        )

        signals = resource.native_feedback_signals()

        self.assertEqual(signals["completion_count"], 1)
        self.assertEqual(signals["likes"], 1)
        self.assertGreaterEqual(signals["total_views"], 4)
        self.assertEqual(signals["slide_ids"], [slide.id])
        self.assertNotIn("facodi.progress", self.env)

