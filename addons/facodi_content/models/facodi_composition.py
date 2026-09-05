import json

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, UserError, ValidationError


class FacodiComposition(models.Model):
    _name = "facodi.composition"
    _description = "FACODI Candidate Learning Composition"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "write_date desc, id desc"

    name = fields.Char(required=True, translate=True, tracking=True)
    description = fields.Html(translate=True, sanitize_overridable=True)
    composition_type = fields.Selection(
        [
            ("playlist", "Playlist"),
            ("module", "Module"),
            ("course", "Course"),
            ("path", "Learning Path"),
        ],
        required=True,
        default="module",
        index=True,
        tracking=True,
    )
    origin = fields.Selection(
        [
            ("manual", "Manual"),
            ("deterministic", "Deterministic"),
            ("ai", "AI Proposal"),
        ],
        required=True,
        default="manual",
        index=True,
    )
    company_id = fields.Many2one(
        "res.company",
        required=True,
        default=lambda self: self.env.company,
        index=True,
    )
    unit_id = fields.Many2one(
        "facodi.course.unit",
        ondelete="set null",
        index=True,
    )
    analysis_run_id = fields.Many2one(
        "facodi.analysis.run",
        ondelete="restrict",
        index=True,
    )
    state = fields.Selection(
        [
            ("candidate", "Candidate"),
            ("review", "In Review"),
            ("approved", "Approved"),
            ("rejected", "Rejected"),
            ("published", "Published"),
        ],
        required=True,
        default="candidate",
        copy=False,
        index=True,
        tracking=True,
    )
    item_ids = fields.One2many(
        "facodi.composition.item",
        "composition_id",
        copy=True,
    )
    submitted_by_id = fields.Many2one(
        "res.users", copy=False, readonly=True, ondelete="set null"
    )
    submitted_at = fields.Datetime(copy=False, readonly=True)
    reviewed_by_id = fields.Many2one(
        "res.users", copy=False, readonly=True, ondelete="set null"
    )
    reviewed_at = fields.Datetime(copy=False, readonly=True)
    publication_ids = fields.One2many(
        "facodi.publication",
        "composition_id",
        copy=False,
    )

    @api.constrains("unit_id", "analysis_run_id", "company_id")
    def _check_company_scope(self):
        for composition in self:
            if composition.unit_id and composition.unit_id.company_id != composition.company_id:
                raise ValidationError(
                    _("The curricular unit must belong to the composition company.")
                )
            if (
                composition.analysis_run_id
                and composition.analysis_run_id.company_id != composition.company_id
            ):
                raise ValidationError(
                    _("The analysis run must belong to the composition company.")
                )

    def _ensure_curator(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can review compositions."))

    def action_submit_review(self):
        self._ensure_curator()
        now = fields.Datetime.now()
        for composition in self:
            if composition.state != "candidate":
                raise UserError(_("Only candidate compositions can enter review."))
            if not composition.item_ids:
                raise UserError(_("A composition needs at least one item."))
            composition.write(
                {
                    "state": "review",
                    "submitted_by_id": self.env.user.id,
                    "submitted_at": now,
                }
            )
        return True

    def action_approve(self, note=None):
        return self._decide("accept", note=note)

    def action_reject(self, note=None):
        return self._decide("reject", note=note)

    def _decide(self, decision, *, note=None):
        self._ensure_curator()
        now = fields.Datetime.now()
        for composition in self:
            if composition.state != "review":
                raise UserError(_("Only compositions in review can receive a decision."))
            original = {
                "state": composition.state,
                "composition_type": composition.composition_type,
                "item_ids": composition.item_ids.ids,
            }
            next_state = "approved" if decision == "accept" else "rejected"
            composition.write(
                {
                    "state": next_state,
                    "reviewed_by_id": self.env.user.id,
                    "reviewed_at": now,
                }
            )
            self.env["facodi.review"].create(
                {
                    "composition_id": composition.id,
                    "decision": decision,
                    "original_value": json.dumps(original, sort_keys=True),
                    "final_value": next_state if decision == "accept" else False,
                    "reviewer_id": self.env.user.id,
                    "reviewed_at": now,
                    "note": note or False,
                }
            )
        return True

    def _leaf_items(self, seen=None):
        self.ensure_one()
        seen = set(seen or ())
        if self.id in seen:
            raise ValidationError(_("A composition hierarchy cannot contain a cycle."))
        seen.add(self.id)
        leaves = self.env["facodi.composition.item"]
        for item in self.item_ids.sorted(key=lambda value: (value.sequence, value.id)):
            if item.resource_id:
                leaves |= item
            else:
                leaves |= item.child_composition_id._leaf_items(seen=seen)
        return leaves


class FacodiCompositionItem(models.Model):
    _name = "facodi.composition.item"
    _description = "FACODI Ordered Composition Item"
    _order = "composition_id, sequence, id"

    composition_id = fields.Many2one(
        "facodi.composition",
        required=True,
        ondelete="cascade",
        index=True,
    )
    company_id = fields.Many2one(
        related="composition_id.company_id",
        store=True,
        index=True,
    )
    sequence = fields.Integer(default=10, index=True)
    resource_id = fields.Many2one(
        "facodi.resource",
        ondelete="restrict",
        index=True,
    )
    snapshot_id = fields.Many2one(
        "facodi.resource.snapshot",
        ondelete="restrict",
        index=True,
    )
    child_composition_id = fields.Many2one(
        "facodi.composition",
        ondelete="restrict",
        index=True,
    )
    required = fields.Boolean(default=True)
    note = fields.Text(translate=True)

    _composition_resource_unique = models.Constraint(
        "UNIQUE(composition_id, resource_id)",
        "A resource can occur only once in a composition.",
    )
    _composition_child_unique = models.Constraint(
        "UNIQUE(composition_id, child_composition_id)",
        "A child composition can occur only once in a composition.",
    )

    @api.model_create_multi
    def create(self, values_list):
        composition_ids = {
            int(values.get("composition_id") or 0) for values in values_list
        }
        compositions = self.env["facodi.composition"].browse(
            [value for value in composition_ids if value]
        )
        if any(
            composition.state not in {"candidate", "review"}
            for composition in compositions
        ):
            raise UserError(_("Approved composition contents are immutable."))
        return super().create(values_list)

    def write(self, values):
        if any(
            composition.state not in {"candidate", "review"}
            for composition in self.composition_id
        ):
            raise UserError(_("Approved composition contents are immutable."))
        return super().write(values)

    def unlink(self):
        if any(
            composition.state not in {"candidate", "review"}
            for composition in self.composition_id
        ):
            raise UserError(_("Approved composition contents are immutable."))
        return super().unlink()

    @api.constrains(
        "composition_id",
        "resource_id",
        "snapshot_id",
        "child_composition_id",
    )
    def _check_target_and_scope(self):
        for item in self:
            if bool(item.resource_id) == bool(item.child_composition_id):
                raise ValidationError(
                    _("A composition item must target exactly one resource or composition.")
                )
            if item.resource_id:
                if not item.snapshot_id:
                    raise ValidationError(
                        _("A resource composition item must pin an exact snapshot.")
                    )
                if item.snapshot_id.resource_id != item.resource_id:
                    raise ValidationError(
                        _("The pinned snapshot must belong to the composition resource.")
                    )
                if item.resource_id.company_id != item.company_id:
                    raise ValidationError(
                        _("The composition resource must belong to its company.")
                    )
            elif item.snapshot_id:
                raise ValidationError(
                    _("A child composition item cannot carry a resource snapshot.")
                )
            if item.child_composition_id:
                if item.child_composition_id.company_id != item.company_id:
                    raise ValidationError(
                        _("Child compositions must belong to the same company.")
                    )
                if item.child_composition_id == item.composition_id or item._creates_cycle():
                    raise ValidationError(
                        _("A composition hierarchy cannot contain a cycle.")
                    )

    def _creates_cycle(self):
        self.ensure_one()
        target_id = self.composition_id.id
        pending = [self.child_composition_id]
        visited = set()
        while pending:
            composition = pending.pop()
            if not composition or composition.id in visited:
                continue
            if composition.id == target_id:
                return True
            visited.add(composition.id)
            pending.extend(
                composition.item_ids.mapped("child_composition_id").exists()
            )
        return False
