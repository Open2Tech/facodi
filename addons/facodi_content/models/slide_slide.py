from odoo import fields, models


class FacodiSlideSlide(models.Model):
    _inherit = 'slide.slide'

    _facodi_source_key_unique = models.Constraint(
        'UNIQUE(facodi_source_key)',
        'The FACODI source key must be unique.',
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