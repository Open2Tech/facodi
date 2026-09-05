import json

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, UserError, ValidationError


class FacodiResourceUpdate(models.Model):
    _name = "facodi.resource.update"
    _description = "FACODI Reviewable Resource Update"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "create_date desc, id desc"

    resource_id = fields.Many2one(
        "facodi.resource",
        required=True,
        ondelete="cascade",
        index=True,
        tracking=True,
    )
    company_id = fields.Many2one(
        related="resource_id.company_id",
        store=True,
        index=True,
    )
    previous_snapshot_id = fields.Many2one(
        "facodi.resource.snapshot",
        required=True,
        ondelete="restrict",
        index=True,
    )
    proposed_snapshot_id = fields.Many2one(
        "facodi.resource.snapshot",
        required=True,
        ondelete="restrict",
        index=True,
    )
    published_impact = fields.Boolean(default=False, copy=False)
    state = fields.Selection(
        [
            ("proposed", "Proposed"),
            ("accepted", "Accepted"),
            ("rejected", "Rejected"),
        ],
        required=True,
        default="proposed",
        copy=False,
        index=True,
        tracking=True,
    )
    decided_by_id = fields.Many2one(
        "res.users", copy=False, readonly=True, ondelete="set null"
    )
    decided_at = fields.Datetime(copy=False, readonly=True)
    publication_ids = fields.Many2many(
        "facodi.publication",
        "facodi_update_publication_rel",
        "update_id",
        "publication_id",
        copy=False,
        readonly=True,
    )

    _resource_snapshots_unique = models.Constraint(
        "UNIQUE(resource_id, previous_snapshot_id, proposed_snapshot_id)",
        "The same resource snapshot transition can be proposed only once.",
    )

    @api.constrains(
        "resource_id",
        "previous_snapshot_id",
        "proposed_snapshot_id",
    )
    def _check_snapshots(self):
        for update in self:
            if update.previous_snapshot_id == update.proposed_snapshot_id:
                raise ValidationError(_("An update must point to a different snapshot."))
            if (
                update.previous_snapshot_id.resource_id != update.resource_id
                or update.proposed_snapshot_id.resource_id != update.resource_id
            ):
                raise ValidationError(
                    _("Both update snapshots must belong to the resource.")
                )

    def _ensure_manager(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_manager"
        ):
            raise AccessError(_("Only FACODI managers can decide resource updates."))

    def action_accept(self, note=None):
        self._ensure_manager()
        now = fields.Datetime.now()
        for update in self:
            if update.state != "proposed":
                raise UserError(_("This resource update already has a decision."))
            if update.resource_id.current_snapshot_id != update.proposed_snapshot_id:
                raise UserError(_("The proposed snapshot is no longer current."))
            publications = self.env["facodi.publication"].revise_for_update(update)
            update.resource_id.state = "published" if publications else "approved"
            update.write(
                {
                    "state": "accepted",
                    "decided_by_id": self.env.user.id,
                    "decided_at": now,
                    "publication_ids": [(6, 0, publications.ids)],
                }
            )
            self.env["facodi.review"].create(
                {
                    "update_id": update.id,
                    "decision": "accept",
                    "original_value": json.dumps(
                        {"snapshot": update.previous_snapshot_id.checksum},
                        sort_keys=True,
                    ),
                    "final_value": json.dumps(
                        {"snapshot": update.proposed_snapshot_id.checksum},
                        sort_keys=True,
                    ),
                    "reviewer_id": self.env.user.id,
                    "reviewed_at": now,
                    "note": note or False,
                }
            )
        return True

    def action_reject(self, note=None):
        self._ensure_manager()
        now = fields.Datetime.now()
        for update in self:
            if update.state != "proposed":
                raise UserError(_("This resource update already has a decision."))
            update.resource_id.write(
                {
                    "current_snapshot_id": update.previous_snapshot_id.id,
                    "state": "published" if update.published_impact else "approved",
                }
            )
            update.write(
                {
                    "state": "rejected",
                    "decided_by_id": self.env.user.id,
                    "decided_at": now,
                }
            )
            self.env["facodi.review"].create(
                {
                    "update_id": update.id,
                    "decision": "reject",
                    "original_value": json.dumps(
                        {"snapshot": update.proposed_snapshot_id.checksum},
                        sort_keys=True,
                    ),
                    "reviewer_id": self.env.user.id,
                    "reviewed_at": now,
                    "note": note or False,
                }
            )
        return True
