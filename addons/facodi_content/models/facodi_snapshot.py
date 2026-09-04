from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError


class FacodiResourceSnapshot(models.Model):
    _name = "facodi.resource.snapshot"
    _description = "FACODI Resource Snapshot"
    _rec_name = "checksum"
    _order = "captured_at desc, id desc"

    resource_id = fields.Many2one(
        "facodi.resource",
        required=True,
        ondelete="cascade",
        index=True,
    )
    company_id = fields.Many2one(
        related="resource_id.company_id",
        store=True,
        index=True,
    )
    checksum = fields.Char(required=True, copy=False, index=True)
    source_version = fields.Char(copy=False)
    payload_json = fields.Json(required=True, copy=False)
    attachment_id = fields.Many2one(
        "ir.attachment",
        copy=False,
        ondelete="restrict",
    )
    captured_at = fields.Datetime(
        required=True,
        default=fields.Datetime.now,
        copy=False,
        index=True,
    )
    captured_by_id = fields.Many2one(
        "res.users",
        required=True,
        default=lambda self: self.env.user,
        copy=False,
        ondelete="restrict",
    )

    _resource_checksum_unique = models.Constraint(
        "UNIQUE(resource_id, checksum)",
        "The same snapshot cannot be recorded twice for one resource.",
    )

    @api.constrains("checksum")
    def _check_checksum(self):
        for snapshot in self:
            if len(snapshot.checksum or "") != 64:
                raise ValidationError(_("Snapshot checksum must be a SHA-256 digest."))

    def write(self, values):
        raise UserError(_("Resource snapshots are immutable."))

    def unlink(self):
        raise UserError(_("Resource snapshots are immutable."))
