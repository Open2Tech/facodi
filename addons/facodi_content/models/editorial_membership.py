from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class FacodiEditorialMembership(models.Model):
    _name = 'facodi.editorial.membership'
    _description = 'FACODI Editorial Membership'
    _rec_name = 'user_id'

    _user_partner_role_unique = models.Constraint(
        'UNIQUE(user_id, partner_id, role)',
        'A user can have only one active editorial role per partner.',
    )

    user_id = fields.Many2one(
        'res.users',
        string='User',
        required=True,
        index=True,
        ondelete='cascade',
    )
    partner_id = fields.Many2one(
        'res.partner',
        string='Publishing Partner',
        required=True,
        index=True,
        ondelete='cascade',
    )
    role = fields.Selection(
        [
            ('coordinator', 'Partner Coordinator'),
            ('creator', 'Course Creator'),
            ('reviewer', 'Editorial Reviewer'),
            ('publisher', 'Publisher'),
            ('pipeline_operator', 'Pipeline Operator'),
            ('auditor', 'Auditor'),
        ],
        string='Editorial Role',
        required=True,
        index=True,
    )
    active = fields.Boolean(default=True, index=True)
    valid_from = fields.Date(string='Valid From')
    valid_until = fields.Date(string='Valid Until')

    @api.constrains('valid_from', 'valid_until')
    def _check_validity_period(self):
        for membership in self:
            if membership.valid_from and membership.valid_until and membership.valid_until < membership.valid_from:
                raise ValidationError(_('The validity end date must be on or after the start date.'))
