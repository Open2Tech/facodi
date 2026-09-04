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

