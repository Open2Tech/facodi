"""Website-scoped lifecycle customizations for the Open2 theme."""

from odoo import api, models


class ThemeOpen2Utils(models.AbstractModel):
    """Keep a newly selected Open2 website independent from default menus."""

    _inherit = "theme.utils"

    @api.model
    def _theme_open2_post_copy(self, module):
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
        if not website or website.theme_id != module:
            return

        default_menu = self.env.ref("website.main_menu", raise_if_not_found=False)
        if not default_menu:
            return

        default_urls = set(default_menu.child_id.mapped("url"))
        inherited_menus = website.menu_id.child_id.filtered(
            lambda menu: not menu.theme_template_id and menu.url in default_urls
        )
        inherited_menus.unlink()
