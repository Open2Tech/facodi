"""Website-scoped lifecycle customizations for the Open2 theme."""

from odoo import Command, api, models


class ThemeOpen2Utils(models.AbstractModel):
    """Keep a newly selected Open2 website independent from default menus."""

    _inherit = "theme.utils"

    @api.model
    def _theme_open2_post_copy(self, module):
        """Keep the Website Builder's post-copy path idempotent."""
        self._theme_open2_reconcile_website()

    @api.model
    def _theme_open2_reconcile_website(self):
        """Apply website-scoped Open2 configuration after theme copies exist."""
        self._theme_open2_cleanup_inherited_navigation()
        self._theme_open2_ensure_helpdesk_team()

    @api.model
    def _theme_open2_cleanup_inherited_navigation(self):
        """Remove only menus cloned from Odoo's global default hierarchy.

        Odoo copies ``website.main_menu`` when a website is created.  A website
        may therefore already contain navigation entries belonging to another
        website before its own theme is selected.  Theme templates are added
        afterwards and carry ``theme_template_id``; the inherited entries do
        not.  Removing the latter here uses Odoo's documented theme post-copy
        hook, after the theme has been materialised for the selected website.

        This deliberately runs only while choosing Open2, is scoped through
        ``website_id``, and leaves editor-created menus untouched after the
        theme is in use.
        """
        website_id = self.env.context.get("website_id")
        website = self.env["website"].browse(website_id).exists()
        if not website or website.theme_id.name != "theme_open2":
            return

        default_menu = self.env.ref("website.main_menu", raise_if_not_found=False)
        if not default_menu:
            return

        default_urls = set(default_menu.child_id.mapped("url"))
        inherited_menus = website.menu_id.child_id.filtered(
            lambda menu: not menu.theme_template_id and menu.url in default_urls
        )
        inherited_menus.unlink()

    @api.model
    def _theme_open2_ensure_helpdesk_team(self):
        """Create one native Helpdesk intake team for the selected Open2 site.

        The Website Helpdesk module normally creates a generic ``/helpdesk``
        menu when its website form is enabled.  Open2 uses its own native
        ``website.page`` at ``/contact``, so the generated menu is removed only
        from this website.  The team, stages, assignment, partner creation,
        attachments, CAPTCHA, and ticket creation remain entirely standard.
        """
        website_id = self.env.context.get("website_id")
        website = self.env["website"].browse(website_id).exists()
        if not website or website.theme_id.name != "theme_open2":
            return self.env["helpdesk.team"]

        Team = self.env["helpdesk.team"].with_context(
            default_company_id=website.company_id.id,
            active_test=False,
        )
        team = Team.search([
            ("website_id", "=", website.id),
            ("company_id", "=", website.company_id.id),
        ], order="use_website_helpdesk_form desc, sequence, id", limit=1)

        required_values = {
            "privacy_visibility": "portal",
            "use_website_helpdesk_form": True,
            "is_published": True,
            "active": True,
        }
        if team:
            changed_values = {
                field: value
                for field, value in required_values.items()
                if team[field] != value
            }
            if changed_values:
                team.write(changed_values)
        else:
            admin = self.env.ref("base.user_admin")
            team = Team.create({
                "name": "Open2 Website",
                "description": "Requests submitted through the Open2 Technology website.",
                "company_id": website.company_id.id,
                "website_id": website.id,
                "member_ids": [Command.set(admin.ids)],
                "auto_assignment": True,
                **required_values,
            })

        generated_menu = team.website_menu_id.filtered(
            lambda menu: menu.website_id == website
            and menu.url == "/helpdesk"
            and not menu.theme_template_id
        )
        if generated_menu:
            team.website_menu_id = False
            generated_menu.unlink()

        return team
