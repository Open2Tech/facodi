from odoo import Command
from odoo.tests import TransactionCase


class FacodiCase(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = cls.env.company
        cls.youtube_source = cls.env["facodi.source"].create(
            {
                "name": "YouTube Education",
                "code": "youtube-education",
                "source_type": "youtube",
                "company_id": cls.company.id,
            }
        )

    @classmethod
    def create_user(cls, login, *groups, company=None):
        company = company or cls.company
        return cls.env["res.users"].with_context(no_reset_password=True).create(
            {
                "name": login,
                "login": login,
                "email": f"{login}@example.test",
                "company_id": company.id,
                "company_ids": [Command.set([company.id])],
                "group_ids": [
                    Command.set(
                        [cls.env.ref("base.group_user").id]
                        + [group.id for group in groups]
                    )
                ],
            }
        )

    def create_resource(self, **values):
        defaults = {
            "name": "Linear Algebra — vectors",
            "source_id": self.youtube_source.id,
            "external_key": "yt:linear-algebra-vectors",
            "source_url": "https://www.youtube.com/watch?v=abcdefghijk",
            "resource_type": "video",
            "source_language_code": "en",
            "company_id": self.company.id,
        }
        defaults.update(values)
        return self.env["facodi.resource"].create(defaults)
