from datetime import date

from odoo.exceptions import ValidationError
from odoo.tests import TransactionCase


class TestEditorialMembership(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.partner = cls.env['res.partner'].create({'name': 'FACODI Test Partner'})
        cls.user = cls.env['res.users'].create({
            'name': 'FACODI Test Creator',
            'login': 'facodi.test.creator',
            'email': 'facodi.creator@example.test',
        })

    def test_membership_stores_role_and_scope(self):
        membership = self.env['facodi.editorial.membership'].create({
            'user_id': self.user.id,
            'partner_id': self.partner.id,
            'role': 'creator',
            'valid_from': date(2026, 1, 1),
            'valid_until': date(2026, 12, 31),
        })
        self.assertEqual(membership.role, 'creator')
        self.assertTrue(membership.active)

    def test_membership_rejects_inverted_dates(self):
        with self.assertRaises(ValidationError):
            self.env['facodi.editorial.membership'].create({
                'user_id': self.user.id,
                'partner_id': self.partner.id,
                'role': 'reviewer',
                'valid_from': date(2026, 12, 31),
                'valid_until': date(2026, 1, 1),
            })
