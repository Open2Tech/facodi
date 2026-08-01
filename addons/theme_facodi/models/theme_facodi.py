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
        self._facodi_setup_forums(website)
        self._facodi_setup_helpdesk(website)
        self._facodi_setup_mailing_list(website)

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

    def _facodi_setup_forums(self, website):
        """Scope FACODI forums to the active website."""
        forums = self.env['ir.model.data'].search([
            ('module', '=', 'theme_facodi'),
            ('model', '=', 'forum.forum'),
        ]).mapped('res_id')
        if forums:
            self.env['forum.forum'].browse(forums).sudo().write({'website_id': website.id})

    def _facodi_setup_helpdesk(self, website):
        """Scope FACODI helpdesk teams to the active website."""
        teams = self.env['ir.model.data'].search([
            ('module', '=', 'theme_facodi'),
            ('model', '=', 'helpdesk.team'),
        ]).mapped('res_id')
        if teams:
            self.env['helpdesk.team'].browse(teams).sudo().write({'website_id': website.id})

    def _facodi_setup_mailing_list(self, website):
        """Scope FACODI newsletter mailing list to the active website."""
        lists = self.env['ir.model.data'].search([
            ('module', '=', 'theme_facodi'),
            ('model', '=', 'mailing.list'),
        ]).mapped('res_id')
        if lists:
            self.env['mailing.list'].browse(lists).sudo().write({'website_id': website.id})