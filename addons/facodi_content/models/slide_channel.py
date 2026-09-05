from odoo import fields, models


class FacodiSlideChannel(models.Model):
    _inherit = 'slide.channel'

    _facodi_composition_unique = models.Constraint(
        "UNIQUE(facodi_composition_id)",
        "A FACODI composition can own only one native eLearning course.",
    )

    facodi_composition_id = fields.Many2one(
        "facodi.composition",
        string="FACODI Composition",
        copy=False,
        index=True,
        ondelete="set null",
    )

    partner_id = fields.Many2one(
        'res.partner',
        string='Publishing Partner',
        index=True,
        help='Institution or organization curating this collection.',
    )
    collection_type = fields.Selection(
        [
            ('course', 'Course'),
            ('curricular_unit', 'Curricular Unit'),
            ('topic', 'Topic'),
            ('playlist', 'Playlist'),
            ('learning_path', 'Learning Path'),
        ],
        string='Collection Type',
        default='course',
        required=True,
    )
