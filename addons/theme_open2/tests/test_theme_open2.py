from pathlib import Path

from odoo.modules.module import get_module_path
from odoo.tests import TransactionCase, tagged


@tagged("post_install", "-at_install")
class TestOpen2Theme(TransactionCase):
    def test_theme_templates_and_assets_are_declared(self):
        module = self.env["ir.module.module"].search([("name", "=", "theme_open2")], limit=1)
        self.assertEqual(module.state, "installed")
        self.assertTrue(self.env.ref("theme_open2.open2_homepage"))
        self.assertTrue(self.env.ref("theme_open2.page_solutions"))
        self.assertTrue(self.env.ref("theme_open2.menu_contact"))
        asset_paths = self.env["theme.ir.asset"].search([
            ("path", "=like", "theme_open2/%"),
        ]).mapped("path")
        self.assertIn("theme_open2/static/src/scss/theme.scss", asset_paths)
        self.assertIn("theme_open2/static/src/js/loader.js", asset_paths)

    def test_legal_pages_are_unpublished_and_not_indexed(self):
        for xmlid in ("theme_open2.page_privacy", "theme_open2.page_terms"):
            page = self.env.ref(xmlid)
            self.assertFalse(page.is_published)
            self.assertFalse(page.website_indexed)

    def test_no_retired_brand_reference(self):
        module_path = Path(get_module_path("theme_open2"))
        retired = "mony" + "nha"
        for path in module_path.rglob("*"):
            if (
                not path.is_file()
                or "__pycache__" in path.parts
                or path.suffix.lower() in {".pyc", ".png", ".jpg", ".jpeg", ".woff2", ".ico"}
            ):
                continue
            self.assertNotIn(retired, path.read_text(errors="ignore").lower(), str(path))
