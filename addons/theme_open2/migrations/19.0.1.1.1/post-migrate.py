from odoo import api, SUPERUSER_ID

from odoo.addons.theme_open2.hooks import restore_default_helpdesk_bootstrap


def migrate(cr, version):
    """Reconcile databases that installed website_helpdesk in 19.0.1.1.0."""
    env = api.Environment(cr, SUPERUSER_ID, {})
    restore_default_helpdesk_bootstrap(env)
