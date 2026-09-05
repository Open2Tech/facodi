import logging
from urllib.parse import urlparse

import requests
from markupsafe import Markup, escape

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, UserError
from odoo.tools import html2plaintext

_logger = logging.getLogger(__name__)

PIPELINE_STATES = {'queued', 'processing', 'ready', 'failed'}


class FacodiSlideSlide(models.Model):
    _inherit = 'slide.slide'

    _facodi_source_key_unique = models.Constraint(
        'UNIQUE(facodi_source_key)',
        'The FACODI source key must be unique.',
    )

    facodi_resource_id = fields.Many2one(
        "facodi.resource",
        string="FACODI Resource",
        copy=False,
        index=True,
        ondelete="set null",
    )
    facodi_snapshot_id = fields.Many2one(
        "facodi.resource.snapshot",
        string="FACODI Published Snapshot",
        copy=False,
        index=True,
        ondelete="set null",
    )
    facodi_publication_item_id = fields.Many2one(
        "facodi.publication.item",
        string="FACODI Publication Receipt",
        copy=False,
        index=True,
        ondelete="set null",
    )

    facodi_source_key = fields.Char(
        string='FACODI Source Key',
        copy=False,
        index=True,
        help='Stable source identity used by the FACODI content importer.',
    )
    enrichment_state = fields.Selection(
        [
            ('new', 'New'),
            ('queued', 'Queued'),
            ('processing', 'Processing'),
            ('ready', 'Ready for Review'),
            ('failed', 'Failed'),
            ('applied', 'Applied'),
        ],
        string='Enrichment State',
        default='new',
        required=True,
        copy=False,
        index=True,
    )
    enrichment_job_ref = fields.Char(
        string='Enrichment Job Reference',
        copy=False,
        readonly=True,
        index=True,
    )
    enrichment_summary = fields.Html(
        string='Suggested Summary',
        copy=False,
        sanitize_overridable=True,
    )
    enrichment_error = fields.Text(
        string='Enrichment Error',
        copy=False,
        readonly=True,
    )
    enrichment_updated_at = fields.Datetime(
        string='Enrichment Updated At',
        copy=False,
        readonly=True,
    )

    def action_queue_enrichment(self):
        self._ensure_enrichment_editor()
        for slide in self:
            if slide.slide_category != 'video' or not slide.url:
                raise UserError(_('Only videos with a source URL can be enriched.'))
            payload = slide._pipeline_request('POST', '/v1/videos/enrich', {'source_url': slide.url})
            slide._apply_enrichment_payload(payload)
        return True

    def action_refresh_enrichment(self):
        self._ensure_enrichment_editor()
        for slide in self:
            slide._refresh_enrichment_job()
        return True

    def action_apply_enrichment(self):
        self._ensure_enrichment_editor()
        for slide in self:
            if slide.enrichment_state != 'ready' or not slide.enrichment_summary:
                raise UserError(_('The enrichment job must be ready before its suggestion can be applied.'))
            slide.write({
                'description': slide.enrichment_summary,
                'enrichment_state': 'applied',
                'enrichment_updated_at': fields.Datetime.now(),
            })
        return True

    def action_sync_facodi_resource(self):
        self.ensure_one()
        self._ensure_enrichment_editor()
        company = self.env.company
        source = self.env["facodi.source"].search(
            [("code", "=", "odoo-elearning"), ("company_id", "=", company.id)],
            limit=1,
        )
        if not source:
            source = self.env["facodi.source"].create(
                {
                    "name": "Odoo eLearning",
                    "code": "odoo-elearning",
                    "source_type": "odoo",
                    "company_id": company.id,
                }
            )
        resource_type = {
            "video": "video",
            "document": "document",
            "article": "article",
            "quiz": "quiz",
            "infographic": "document",
        }.get(self.slide_category, "external")
        result = {
            "external_key": f"slide:{self.id}",
            "source_url": self.url or "",
            "resource_type": resource_type,
            "name": self.name,
            "description": str(self.description or self.html_content or ""),
            "content_text": html2plaintext(
                str(self.html_content or self.description or "")
            ),
            "mime_type": "text/html",
            "source_version": fields.Datetime.to_string(self.write_date),
            "snapshot_payload": {
                "schema_version": 1,
                "provider": "odoo",
                "model": self._name,
                "record_id": self.id,
                "facts": {
                    "name": self.name,
                    "slide_category": self.slide_category,
                    "url": self.url or "",
                    "html_content": str(self.html_content or ""),
                    "channel_id": self.channel_id.id,
                },
            },
        }
        resource, _snapshot, _changed = self.env["facodi.resource"].ingest_result(
            source,
            result,
        )
        if self.facodi_resource_id != resource:
            self.facodi_resource_id = resource
        return resource

    @api.model
    def _cron_refresh_enrichment(self):
        if not self._pipeline_is_configured():
            return
        slides = self.search(
            [
                ('enrichment_state', 'in', ['queued', 'processing']),
                ('enrichment_job_ref', '!=', False),
            ],
            limit=50,
        )
        for slide in slides:
            try:
                slide._refresh_enrichment_job()
            except UserError as exc:
                _logger.warning('FACODI enrichment refresh failed for slide %s: %s', slide.id, exc)

    def _refresh_enrichment_job(self):
        self.ensure_one()
        if not self.enrichment_job_ref:
            raise UserError(_('This content has no enrichment job to refresh.'))
        payload = self._pipeline_request('GET', f'/v1/jobs/{self.enrichment_job_ref}')
        self._apply_enrichment_payload(payload)

    def _apply_enrichment_payload(self, payload):
        self.ensure_one()
        state = payload.get('state')
        if state not in PIPELINE_STATES:
            raise UserError(_('The enrichment service returned an invalid state.'))
        values = {
            'enrichment_state': state,
            'enrichment_job_ref': payload.get('id') or self.enrichment_job_ref,
            'enrichment_updated_at': fields.Datetime.now(),
            'enrichment_error': False,
        }
        if state == 'ready':
            summary = str(payload.get('summary') or '').strip()
            if not summary:
                raise UserError(_('The enrichment service returned no summary.'))
            values['enrichment_summary'] = Markup('<p>%s</p>') % escape(summary)
        elif state == 'failed':
            values['enrichment_error'] = str(payload.get('error') or _('Unknown enrichment error.'))[:2000]
        self.write(values)

    def _pipeline_request(self, method, path, payload=None):
        base_url, token, timeout = self._pipeline_parameters()
        try:
            response = requests.request(
                method,
                f'{base_url}{path}',
                headers={'Authorization': f'Bearer {token}'},
                json=payload,
                timeout=timeout,
            )
            response.raise_for_status()
            result = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise UserError(_('The FACODI enrichment service is unavailable.')) from exc
        if not isinstance(result, dict):
            raise UserError(_('The FACODI enrichment service returned an invalid response.'))
        return result

    @api.model
    def _pipeline_parameters(self):
        parameters = self.env['ir.config_parameter'].sudo()
        base_url = (parameters.get_param('facodi.pipeline.base_url') or '').rstrip('/')
        token = parameters.get_param('facodi.pipeline.token') or ''
        try:
            timeout = max(1, min(int(parameters.get_param('facodi.pipeline.timeout') or 15), 60))
        except ValueError:
            timeout = 15
        parsed_url = urlparse(base_url)
        if parsed_url.scheme != 'https' or not parsed_url.netloc or not token:
            raise UserError(_('Configure a valid HTTPS FACODI pipeline URL and token first.'))
        return base_url, token, timeout

    @api.model
    def _pipeline_is_configured(self):
        parameters = self.env['ir.config_parameter'].sudo()
        return bool(
            parameters.get_param('facodi.pipeline.base_url')
            and parameters.get_param('facodi.pipeline.token')
        )

    def _ensure_enrichment_editor(self):
        if not self.env.user.has_group('website_slides.group_website_slides_officer'):
            raise AccessError(_('Only eLearning officers can manage FACODI enrichment.'))
