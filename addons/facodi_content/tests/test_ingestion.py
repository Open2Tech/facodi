import json
from unittest.mock import patch

from odoo.tests import tagged

from .common import FacodiCase


@tagged("post_install", "-at_install")
class TestFacodiIngestion(FacodiCase):
    def _result(self, *, title="Vectors", version="v1", description="Intro"):
        return {
            "external_key": "youtube:abc123DEF45",
            "source_url": "https://www.youtube.com/watch?v=abc123DEF45",
            "resource_type": "video",
            "name": title,
            "description": description,
            "source_language_code": "en",
            "author_name": "Open Lecturer",
            "institution_name": "Open Faculty",
            "publication_date": "2026-01-02",
            "duration_minutes": 10.0,
            "mime_type": "text/html",
            "source_version": version,
            "snapshot_payload": {
                "provider": "youtube_oembed",
                "facts": {"title": title, "version": version},
            },
        }

    def test_ingestion_reuses_identity_and_versions_only_changed_facts(self):
        model = self.env["facodi.resource"]

        resource, first, changed = model.ingest_result(
            self.youtube_source,
            self._result(),
        )
        repeated_resource, repeated, repeated_changed = model.ingest_result(
            self.youtube_source,
            self._result(),
        )
        revised_resource, second, revised_changed = model.ingest_result(
            self.youtube_source,
            self._result(title="Vectors revised", version="v2"),
        )

        self.assertEqual(resource, repeated_resource)
        self.assertEqual(resource, revised_resource)
        self.assertEqual(first, repeated)
        self.assertFalse(repeated_changed)
        self.assertTrue(changed)
        self.assertTrue(revised_changed)
        self.assertNotEqual(first, second)
        self.assertEqual(resource.snapshot_count, 2)
        self.assertEqual(resource.current_snapshot_id, second)
        self.assertEqual(resource.name, "Vectors revised")
        self.assertEqual(resource.state, "rights_review")
        self.assertEqual(resource.source_author_name, "Open Lecturer")
        self.assertEqual(resource.source_institution_name, "Open Faculty")
        self.assertEqual(resource.mime_type, "text/html")
        self.assertTrue(resource.last_ingested_at)

    def test_enrichment_job_is_unique_per_resource_snapshot(self):
        model = self.env["facodi.resource"]
        resource, snapshot, _changed = model.ingest_result(
            self.youtube_source,
            self._result(),
            enqueue_enrichment=True,
        )
        model.ingest_result(
            self.youtube_source,
            self._result(),
            enqueue_enrichment=True,
        )

        jobs = self.env["facodi.job"].search(
            [("resource_id", "=", resource.id), ("kind", "=", "enrich")]
        )
        self.assertEqual(len(jobs), 1)
        self.assertEqual(
            jobs.idempotency_key,
            f"enrich:{resource.id}:{snapshot.checksum}",
        )
        self.assertEqual(jobs.payload_json["snapshot_id"], snapshot.id)

    def test_uploaded_pdf_snapshot_keeps_native_attachment(self):
        attachment = self.env["ir.attachment"].create(
            {
                "name": "notes.pdf",
                "type": "binary",
                "raw": b"%PDF educational bytes",
                "mimetype": "application/pdf",
            }
        )
        result = {
            "external_key": "sha256:pdfdigest",
            "resource_type": "document",
            "name": "Notes",
            "mime_type": "application/pdf",
            "content_text": "Vectors and matrices",
            "snapshot_payload": {
                "provider": "uploaded_pdf",
                "sha256": "pdfdigest",
                "byte_size": 22,
            },
        }

        resource, snapshot, changed = self.env["facodi.resource"].ingest_result(
            self.youtube_source,
            result,
            attachment=attachment,
        )

        self.assertTrue(changed)
        self.assertEqual(resource.resource_type, "document")
        self.assertEqual(resource.content_text, "Vectors and matrices")
        self.assertEqual(snapshot.attachment_id, attachment)

    def test_url_ingestion_job_dispatches_adapter_result(self):
        model = self.env["facodi.resource"]
        job = model.enqueue_url_ingestion(
            self.youtube_source,
            "https://youtu.be/abc123DEF45?t=12",
            enqueue_enrichment=True,
        )

        class FakeClient:
            def ingest_url(self, _url, *, language_code=""):
                self.language_code = language_code
                return self_result

        self_result = self._result()
        fake_client = FakeClient()
        with patch.object(type(model), "_ingestion_client", return_value=fake_client):
            outcome = job._dispatch()

        resource = self.env["facodi.resource"].browse(outcome["resource_id"])
        self.assertTrue(resource.exists())
        self.assertEqual(outcome["snapshot_id"], resource.current_snapshot_id.id)
        self.assertTrue(outcome["changed"])
        self.assertEqual(fake_client.language_code, "")
        self.assertNotIn("secret", json.dumps(job.payload_json))

    def test_source_discovery_paginates_without_persisting_api_key(self):
        self.youtube_source.write(
            {
                "youtube_listing_type": "playlist",
                "youtube_listing_id": "PL_OPEN",
                "auto_enrich": True,
            }
        )
        self.env["ir.config_parameter"].sudo().set_param(
            "facodi.youtube.api_key",
            "very-secret",
        )
        job = self.youtube_source.queue_discovery()

        class FakeClient:
            def discover_youtube_page(self, **values):
                self.values = values
                return [self_result], "NEXT"

        self_result = self._result()
        fake_client = FakeClient()
        model = self.env["facodi.resource"]
        with patch.object(type(model), "_ingestion_client", return_value=fake_client):
            outcome = job._dispatch()

        self.assertEqual(outcome["ingested_count"], 1)
        self.assertEqual(outcome["next_cursor"], "NEXT")
        self.assertEqual(self.youtube_source.discovery_cursor, "NEXT")
        self.assertEqual(fake_client.values["api_key"], "very-secret")
        self.assertNotIn("very-secret", json.dumps(job.payload_json))
        self.assertNotIn("very-secret", json.dumps(outcome))
        next_jobs = self.env["facodi.job"].search(
            [
                ("kind", "=", "discover"),
                ("state", "=", "queued"),
                ("id", "!=", job.id),
            ]
        )
        self.assertEqual(len(next_jobs), 1)
        self.assertEqual(next_jobs.payload_json["page_token"], "NEXT")
        self.assertNotIn("facodi_youtube_api_key", self.youtube_source._fields)

    def test_ingestion_wizard_enqueues_unique_urls_and_upload(self):
        attachment = self.env["ir.attachment"].create(
            {
                "name": "notes.pdf",
                "type": "binary",
                "raw": b"%PDF uploaded",
                "mimetype": "application/pdf",
            }
        )
        wizard = self.env["facodi.ingest.resource.wizard"].create(
            {
                "source_id": self.youtube_source.id,
                "source_url": "https://example.org/lesson-one",
                "batch_urls": (
                    "https://example.org/lesson-two\n"
                    "https://example.org/lesson-one\n\n"
                ),
                "attachment_id": attachment.id,
                "enqueue_enrichment": True,
            }
        )

        action = wizard.action_enqueue()

        jobs = self.env["facodi.job"].search(
            [("id", "in", action["domain"][0][2])],
            order="id",
        )
        self.assertEqual(len(jobs), 3)
        self.assertEqual(len(jobs.filtered(lambda item: item.payload_json.get("url"))), 2)
        upload_job = jobs.filtered(
            lambda item: item.payload_json.get("attachment_id") == attachment.id
        )
        self.assertEqual(len(upload_job), 1)
        self.assertTrue(all(job.kind == "ingest" for job in jobs))

    def test_native_slide_sync_keeps_standard_record_as_publishing_anchor(self):
        channel = self.env["slide.channel"].create(
            {"name": "Linear Algebra", "channel_type": "training"}
        )
        slide = self.env["slide.slide"].create(
            {
                "name": "Vectors",
                "channel_id": channel.id,
                "slide_category": "article",
                "html_content": "<p>Vectors and matrices</p>",
            }
        )

        resource = slide.action_sync_facodi_resource()

        self.assertEqual(slide.facodi_resource_id, resource)
        self.assertEqual(resource.source_id.code, "odoo-elearning")
        self.assertEqual(resource.external_key, f"slide:{slide.id}")
        self.assertEqual(resource.resource_type, "article")
        self.assertEqual(resource.current_snapshot_id.payload_json["provider"], "odoo")
