from odoo import models


class ThemeUtils(models.AbstractModel):
    _inherit = 'theme.utils'

    def _theme_facodi_post_copy(self, mod):
        # Ensure the default Odoo header layout is active so all header
        # option templates (search, language selector, CTA...) work.
        self.enable_view('website.template_header_default')

        website = self.env['website'].get_current_website()
        if not website:
            return

        self._facodi_setup_menus(website)

    def _facodi_setup_menus(self, website):
        """Remove inherited default menus and scope FACODI menus to this website."""
        Menu = self.env['website.menu'].with_context(website_id=website.id)
        default_menus = self.env.ref('website.menu_homepage', raise_if_not_found=False)
        if default_menus:
            default_menus.sudo().write({'website_id': False})

        facodi_menus = self.env['ir.model.data'].search([
            ('module', '=', 'theme_facodi'),
            ('model', '=', 'website.menu'),
        ]).mapped('res_id')
        if facodi_menus:
            Menu.browse(facodi_menus).sudo().write({'website_id': website.id})