from pathlib import Path

from odoo.modules.module import get_module_path
from odoo.tests import TransactionCase, tagged


@tagged("post_install", "-at_install")
class TestOpen2Theme(TransactionCase):
    def test_theme_templates_and_assets_are_declared(self):
        module = self.env["ir.module.module"].search([("name", "=", "theme_open2")], limit=1)
        self.assertEqual(module.state, "installed")
        self.assertFalse(module.auto_install)
        self.assertFalse(module.application)
        self.assertTrue(self.env.ref("theme_open2.open2_homepage"))
        self.assertTrue(self.env.ref("theme_open2.page_about"))
        self.assertTrue(self.env.ref("theme_open2.page_solutions"))
        self.assertTrue(self.env.ref("theme_open2.page_services"))
        self.assertTrue(self.env.ref("theme_open2.page_contact_thank_you"))
        self.assertTrue(self.env.ref("theme_open2.menu_contact"))
        selected_websites = self.env["website"].search([("theme_id", "=", module.id)])
        copied_views = self.env["ir.ui.view"].search([
            ("key", "like", "theme_open2.%"),
        ])
        self.assertFalse(copied_views.filtered(
            lambda view: not view.website_id or view.website_id not in selected_websites
        ))
        copied_pages = self.env["website.page"].search([
            ("theme_template_id", "!=", False),
            ("url", "in", [
                "/about", "/solutions", "/services", "/partnerships",
                "/open-source", "/contact", "/contact/thank-you",
            ]),
        ])
        self.assertFalse(copied_pages.filtered(
            lambda page: page.website_id not in selected_websites
        ))
        asset_paths = self.env["theme.ir.asset"].search([
            ("path", "=like", "theme_open2/%"),
        ]).mapped("path")
        self.assertIn("theme_open2/static/src/scss/theme.scss", asset_paths)
        self.assertIn("theme_open2/static/src/js/loader.js", asset_paths)

    def test_contact_form_uses_native_helpdesk_website_form(self):
        model = self.env["ir.model"]._get("helpdesk.ticket")
        self.assertTrue(model.website_form_access)

        contact_view = self.env.ref("theme_open2.s_open2_contact")
        self.assertIn('action="/website/form/"', contact_view.arch)
        self.assertIn('data-model_name="helpdesk.ticket"', contact_view.arch)
        self.assertIn('name="team_id"', contact_view.arch)
        self.assertIn('name="partner_name"', contact_view.arch)
        self.assertIn('name="partner_email"', contact_view.arch)
        self.assertIn('name="Attachment"', contact_view.arch)
        self.assertIn("request.env['website'].get_current_website()", contact_view.arch)
        self.assertNotIn("request.website", contact_view.arch)

        footer_view = self.env.ref("theme_open2.open2_footer")
        self.assertIn("footer_menu.page_id.url or footer_menu.url", footer_view.arch)

    def test_portal_panel_styles_are_scoped_to_open2(self):
        stylesheet = (Path(get_module_path("theme_open2")) /
                      "static/src/scss/components.scss").read_text()
        self.assertIn(".open2-site .o_portal_wrap", stylesheet)
        self.assertIn(".open2-site .o_portal_my_home .o_portal_index_card > a", stylesheet)
        self.assertNotIn(".o_portal_wrap {", stylesheet.replace(".open2-site .o_portal_wrap {", ""))

    def test_brand_refresh_assets_are_available(self):
        module_path = Path(get_module_path("theme_open2"))
        expected_assets = [
            "static/src/img/branding/logos/open2-logo-horizontal.svg",
            "static/src/img/branding/logos/open2-logo-vertical.svg",
            "static/src/img/branding/logos/open2-symbol.svg",
            "static/src/img/branding/favicons/favicon.svg",
            "static/src/img/branding/favicons/favicon.ico",
            "static/src/img/branding/favicons/apple-touch-icon.png",
            "static/src/img/branding/social/open2-og.png",
            "static/src/img/branding/social/open2-twitter-card.png",
            "static/src/img/branding/icons/open2-odoo-app-icon.png",
            "static/src/img/branding/splash/open2-splash-logo.svg",
        ]
        for asset in expected_assets:
            self.assertTrue((module_path / asset).is_file(), asset)

        header_view = self.env.ref("theme_open2.open2_header")
        footer_view = self.env.ref("theme_open2.open2_footer")
        layout_view = self.env.ref("theme_open2.open2_layout")
        self.assertIn("/static/src/img/branding/logos/open2-logo-horizontal.svg", header_view.arch)
        self.assertIn("/static/src/img/branding/logos/open2-logo-vertical.svg", footer_view.arch)
        self.assertIn("/static/src/img/branding/social/open2-og.png", layout_view.arch)

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
