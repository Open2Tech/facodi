from odoo import models


class ThemeUtils(models.AbstractModel):
    _inherit = 'theme.utils'

    def _theme_facodi_post_copy(self, mod):
        # Ensure the default Odoo header layout is active so all header
        # option templates (search, language selector, CTA...) work.
        self.enable_view('website.template_header_default')