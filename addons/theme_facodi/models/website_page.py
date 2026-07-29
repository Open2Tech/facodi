"""website.page mixin — injects published courses into the FACODI homepage render.

Override ``_get_response_raw`` on ``website.page`` so that when the homepage
(url="/") is rendered, the ``facodi_channels`` variable is available in the
QWeb context.  This works with both cached and uncached responses because the
variable is injected at the raw render level before the result is cached.
"""

from odoo import models
from odoo.http import request


class FacodiWebsitePage(models.Model):
    _inherit = 'website.page'

    def _get_response_raw(self, http_request):
        """Add FACODI-specific context variables before rendering."""
        response = super()._get_response_raw(http_request)

        # Only enrich the homepage response
        if (
            response is not None
            and request.website.sudo().theme_id.name == 'theme_facodi'
            and http_request.httprequest.path == '/'
            and hasattr(response, 'qcontext')
        ):
            channels = request.env['slide.channel'].search(
                [('website_published', '=', True)],
                order='sequence, id',
                limit=6,
            )
            response.qcontext['facodi_channels'] = channels

        return response
