"""Hook Open2 navigation reconciliation into Odoo's theme loader."""

from odoo import models


class IrModuleModule(models.Model):
    _inherit = "ir.module.module"

    def _theme_load(self, website):
        """Reconcile copied default navigation after Open2 is materialised.

        Odoo calls this lifecycle method for both a theme selection and a
        module upgrade.  Unlike the optional post-copy callback, it is also
        reached by Odoo.sh's non-HTTP upgrade flow.
        """
        result = super()._theme_load(website)
        if any(
            module.name == "theme_open2" and website.theme_id == module
            for module in self
        ):
            self.env["theme.utils"].with_context(
                website_id=website.id,
            )._theme_open2_reconcile_website()
        return result
