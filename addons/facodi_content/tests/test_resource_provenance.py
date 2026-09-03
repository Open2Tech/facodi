from psycopg2 import IntegrityError

from odoo.exceptions import UserError
from odoo.tests import tagged

from .common import FacodiCase


@tagged("post_install", "-at_install")
class TestFacodiResourceProvenance(FacodiCase):
    def test_source_external_key_identifies_one_resource(self):
        self.create_resource()

        with self.assertRaises(IntegrityError), self.env.cr.savepoint():
            self.create_resource(name="Duplicate title")

    def test_record_snapshot_is_idempotent_and_advances_current_version(self):
        resource = self.create_resource()
        first = resource.record_snapshot(
            {"title": "Vectors", "author": "Open Lecturer"},
            source_version="etag-v1",
        )
        repeated = resource.record_snapshot(
            {"author": "Open Lecturer", "title": "Vectors"},
            source_version="etag-v1",
        )
        second = resource.record_snapshot(
            {"title": "Vectors — revised", "author": "Open Lecturer"},
            source_version="etag-v2",
        )

        self.assertEqual(first, repeated)
        self.assertNotEqual(first, second)
        self.assertEqual(resource.current_snapshot_id, second)
        self.assertEqual(resource.snapshot_count, 2)
        self.assertEqual(len(first.checksum), 64)

    def test_snapshot_is_immutable(self):
        snapshot = self.create_resource().record_snapshot({"title": "Original"})

        with self.assertRaises(UserError):
            snapshot.write({"payload_json": {"title": "Rewritten"}})
        with self.assertRaises(UserError):
            snapshot.unlink()

    def test_snapshot_preserves_attachment_and_capture_context(self):
        resource = self.create_resource(resource_type="document")
        attachment = self.env["ir.attachment"].create(
            {
                "name": "syllabus.pdf",
                "type": "binary",
                "raw": b"public educational document",
                "mimetype": "application/pdf",
            }
        )

        snapshot = resource.record_snapshot(
            {"title": "Syllabus"},
            source_version="2026-09",
            attachment=attachment,
        )

        self.assertEqual(snapshot.attachment_id, attachment)
        self.assertEqual(snapshot.source_version, "2026-09")
        self.assertTrue(snapshot.captured_at)
        self.assertEqual(snapshot.captured_by_id, self.env.user)

    def test_rights_gate_requires_reviewed_eligible_policy(self):
        resource = self.create_resource()
        self.assertFalse(resource.publication_eligible)

        resource.write(
            {
                "rights_status": "creative_commons",
                "license_id": self.env.ref("facodi_content.license_cc_by_4_0").id,
                "usage_mode": "embed",
            }
        )
        self.assertFalse(resource.publication_eligible)

        resource.action_confirm_rights()

        self.assertTrue(resource.publication_eligible)
        self.assertEqual(resource.rights_reviewed_by_id, self.env.user)
        self.assertTrue(resource.rights_reviewed_at)

    def test_non_eligible_rights_cannot_be_confirmed_as_publishable(self):
        resource = self.create_resource(
            rights_status="not_eligible",
            usage_mode="forbidden",
        )

        resource.action_confirm_rights()

        self.assertFalse(resource.publication_eligible)
        self.assertEqual(resource.state, "rejected")
