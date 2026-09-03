from odoo.tests import TransactionCase, tagged


@tagged("post_install", "-at_install")
class TestFacodiAddonSmoke(TransactionCase):
    def test_canonical_resource_model_is_registered(self):
        """Catches a build where the canonical FACODI catalogue is absent."""
        resource_model = self.env["facodi.resource"]

        self.assertEqual(resource_model._name, "facodi.resource")
