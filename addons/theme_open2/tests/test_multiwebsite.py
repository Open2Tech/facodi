from odoo.tests import TransactionCase, tagged


@tagged("post_install", "-at_install")
class TestOpen2MultiwebsiteIsolation(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.existing_website = cls.env["website"].search([], order="id", limit=1)
        cls.existing_snapshot = {
            "theme_id": cls.existing_website.theme_id.id,
            "pages": cls.env["website.page"].search_count([
                ("website_id", "=", cls.existing_website.id),
            ]),
            "menus": cls.env["website.menu"].search_count([
                ("website_id", "=", cls.existing_website.id),
            ]),
            "assets": cls.env["ir.asset"].search_count([
                ("website_id", "=", cls.existing_website.id),
            ]),
        }
        cls.open2_website = cls.env["website"].create({
            "name": "Open2 Technology Test",
            "domain": "https://open2.test",
            "company_id": cls.env.company.id,
        })
        cls.theme = cls.env["ir.module.module"].search([("name", "=", "theme_open2")], limit=1)

    def test_theme_load_is_scoped_to_target_website(self):
        self.open2_website.theme_id = self.theme
        self.theme._theme_load(self.open2_website)

        open2_pages = self.env["website.page"].search([
            ("website_id", "=", self.open2_website.id),
            ("theme_template_id", "!=", False),
        ])
        open2_assets = self.env["ir.asset"].search([
            ("website_id", "=", self.open2_website.id),
            ("theme_template_id", "!=", False),
        ])
        self.assertEqual(set(open2_pages.mapped("url")), {
            "/about", "/solutions", "/services", "/partnerships",
            "/open-source", "/contact", "/contact/thank-you", "/privacy", "/terms",
        })
        self.assertTrue(open2_assets)
        open2_team = self.env["helpdesk.team"].search([
            ("website_id", "=", self.open2_website.id),
        ])
        self.assertEqual(len(open2_team), 1)
        self.assertTrue(open2_team.use_website_helpdesk_form)
        self.assertTrue(open2_team.is_published)
        self.assertEqual(open2_team.privacy_visibility, "portal")
        self.assertFalse(open2_team.website_menu_id)
        self.assertEqual(self.existing_website.theme_id.id, self.existing_snapshot["theme_id"])
        self.assertEqual(self.env["website.page"].search_count([
            ("website_id", "=", self.existing_website.id),
        ]), self.existing_snapshot["pages"])
        self.assertEqual(self.env["website.menu"].search_count([
            ("website_id", "=", self.existing_website.id),
        ]), self.existing_snapshot["menus"])
        self.assertEqual(self.env["ir.asset"].search_count([
            ("website_id", "=", self.existing_website.id),
        ]), self.existing_snapshot["assets"])

    def test_open2_helpdesk_ticket_keeps_website_origin(self):
        self.open2_website.theme_id = self.theme
        self.theme._theme_load(self.open2_website)
        team = self.env["helpdesk.team"].search([
            ("website_id", "=", self.open2_website.id),
        ], limit=1)

        ticket = self.env["helpdesk.ticket"].create({
            "name": "Website form regression",
            "team_id": team.id,
            "partner_name": "Open2 Test Visitor",
            "partner_email": "open2-test@example.com",
            "description": "Native website form regression test.",
        })

        self.assertEqual(ticket.team_id, team)
        self.assertEqual(ticket.team_id.website_id, self.open2_website)
        self.assertEqual(ticket.partner_id.email, "open2-test@example.com")

    def test_theme_post_copy_removes_only_inherited_default_menus(self):
        default_url = self.env.ref("website.main_menu").child_id[:1].url
        inherited_menu = self.env["website.menu"].create({
            "name": "Inherited menu",
            "url": default_url,
            "website_id": self.open2_website.id,
            "parent_id": self.open2_website.menu_id.id,
        })
        custom_menu = self.env["website.menu"].create({
            "name": "Open2 editorial menu",
            "url": "/open2-editorial-menu",
            "website_id": self.open2_website.id,
            "parent_id": self.open2_website.menu_id.id,
        })

        self.open2_website.theme_id = self.theme
        self.theme._theme_load(self.open2_website)

        self.assertFalse(inherited_menu.exists())
        self.assertTrue(custom_menu.exists())
        self.assertTrue(self.existing_website.menu_id.exists())

    def test_theme_unload_preserves_website_and_editorial_content(self):
        self.open2_website.theme_id = self.theme
        self.theme._theme_load(self.open2_website)
        editorial_page = self.env["website.page"].create({
            "name": "Editorial Test",
            "url": "/editorial-test",
            "website_id": self.open2_website.id,
            "view_id": self.env["ir.ui.view"].create({
                "name": "Open2 editorial test",
                "type": "qweb",
                "key": "theme_open2_test.editorial",
                "website_id": self.open2_website.id,
                "arch": "<t t-name='theme_open2_test.editorial'><div id='wrap'/></t>",
            }).id,
        })
        self.theme._theme_unload(self.open2_website)
        self.assertTrue(self.open2_website.exists())
        self.assertTrue(editorial_page.exists())
        self.assertFalse(self.env["website.page"].search([
            ("website_id", "=", self.open2_website.id),
            ("theme_template_id", "!=", False),
        ]))
