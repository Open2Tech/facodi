from odoo import Command
from odoo.exceptions import AccessError
from odoo.tests import tagged

from .common import FacodiCase


@tagged("post_install", "-at_install")
class TestFacodiSecurity(FacodiCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.viewer = cls.create_user(
            "facodi-viewer", cls.env.ref("facodi_content.group_facodi_viewer")
        )
        cls.curator = cls.create_user(
            "facodi-curator", cls.env.ref("facodi_content.group_facodi_curator")
        )
        cls.manager = cls.create_user(
            "facodi-manager", cls.env.ref("facodi_content.group_facodi_manager")
        )
        cls.portal = cls.env["res.users"].with_context(no_reset_password=True).create(
            {
                "name": "FACODI Portal",
                "login": "facodi-portal",
                "email": "facodi-portal@example.test",
                "group_ids": [Command.set([cls.env.ref("base.group_portal").id])],
            }
        )

    def test_viewer_reads_but_cannot_create_or_write_resource(self):
        resource = self.create_resource()
        self.assertEqual(resource.with_user(self.viewer).name, resource.name)

        with self.assertRaises(AccessError):
            self.env["facodi.resource"].with_user(self.viewer).create(
                {
                    "name": "Forbidden",
                    "source_id": self.youtube_source.id,
                    "external_key": "forbidden",
                    "company_id": self.company.id,
                }
            )
        with self.assertRaises(AccessError):
            resource.with_user(self.viewer).write({"name": "Forbidden"})

    def test_curator_creates_and_edits_resource(self):
        resource = self.env["facodi.resource"].with_user(self.curator).create(
            {
                "name": "Curated resource",
                "source_id": self.youtube_source.id,
                "external_key": "curated-resource",
                "company_id": self.company.id,
            }
        )

        resource.with_user(self.curator).write({"name": "Reviewed resource"})

        self.assertEqual(resource.name, "Reviewed resource")

    def test_portal_cannot_read_operational_resource(self):
        resource = self.create_resource()

        with self.assertRaises(AccessError):
            resource.with_user(self.portal).check_access("read")

    def test_company_rule_hides_resources_from_other_company(self):
        other_company = self.env["res.company"].create({"name": "Other University"})
        other_source = self.env["facodi.source"].create(
            {
                "name": "Other source",
                "code": "other-source",
                "source_type": "manual",
                "company_id": other_company.id,
            }
        )
        own = self.create_resource()
        self.env["facodi.resource"].create(
            {
                "name": "Other resource",
                "source_id": other_source.id,
                "external_key": "other-resource",
                "company_id": other_company.id,
            }
        )

        visible = self.env["facodi.resource"].with_user(self.viewer).search([])

        self.assertIn(own, visible)
        self.assertEqual(visible.filtered(lambda item: item.company_id == other_company), self.env["facodi.resource"])
