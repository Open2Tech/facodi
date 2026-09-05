import hashlib
import json

from odoo import _, api, fields, models
from odoo.exceptions import AccessError, UserError, ValidationError

from ..services.publication import slide_values_for_resource


class FacodiPublication(models.Model):
    _name = "facodi.publication"
    _description = "FACODI Native eLearning Publication"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "composition_id, revision desc, id desc"

    composition_id = fields.Many2one(
        "facodi.composition",
        required=True,
        ondelete="restrict",
        index=True,
        tracking=True,
    )
    company_id = fields.Many2one(
        related="composition_id.company_id",
        store=True,
        index=True,
    )
    revision = fields.Integer(required=True, default=1, copy=False, index=True)
    input_fingerprint = fields.Char(required=True, copy=False, index=True)
    channel_id = fields.Many2one(
        "slide.channel",
        required=True,
        ondelete="restrict",
        index=True,
    )
    state = fields.Selection(
        [
            ("prepared", "Prepared Draft"),
            ("published", "Published"),
            ("superseded", "Superseded"),
            ("failed", "Failed"),
        ],
        required=True,
        default="prepared",
        copy=False,
        index=True,
        tracking=True,
    )
    prepared_by_id = fields.Many2one(
        "res.users", required=True, copy=False, readonly=True, ondelete="restrict"
    )
    prepared_at = fields.Datetime(required=True, copy=False, readonly=True)
    published_by_id = fields.Many2one(
        "res.users", copy=False, readonly=True, ondelete="set null"
    )
    published_at = fields.Datetime(copy=False, readonly=True)
    item_ids = fields.One2many(
        "facodi.publication.item",
        "publication_id",
        copy=False,
    )

    _composition_revision_unique = models.Constraint(
        "UNIQUE(composition_id, revision)",
        "A publication revision must be unique for its composition.",
    )
    _composition_fingerprint_unique = models.Constraint(
        "UNIQUE(composition_id, input_fingerprint)",
        "Identical composition inputs must reuse their publication receipt.",
    )

    @api.model
    def _native_slide_values(self, resource, snapshot):
        values = slide_values_for_resource(
            {
                "name": resource.name,
                "resource_type": resource.resource_type,
                "source_url": resource.source_url,
                "description": resource.description,
                "author": resource.author_partner_id.name
                or resource.source_author_name,
                "institution": resource.institution_partner_id.name
                or resource.source_institution_name,
            }
        )
        if (
            resource.resource_type == "document"
            and snapshot.attachment_id
            and resource.usage_mode == "redistribute"
        ):
            values.update(
                {
                    "slide_category": "document",
                    "source_type": "local_file",
                    "html_content": False,
                    "binary_content": snapshot.attachment_id.datas,
                }
            )
        return values

    @api.model
    def prepare_for_composition(self, composition):
        composition.ensure_one()
        self._ensure_curator()
        if composition.state not in {"approved", "published"}:
            raise UserError(_("Only an approved composition can be prepared."))
        entries = self._publication_entries(composition)
        leaves = self.env["facodi.composition.item"]
        for kind, value in entries:
            if kind == "resource":
                leaves |= value
        if not leaves:
            raise UserError(_("The composition contains no publishable resources."))
        for item in leaves:
            resource = item.resource_id
            if resource.state not in {"approved", "published"}:
                raise UserError(_("Every resource must be approved before preparation."))
            if not resource.publication_eligible:
                raise UserError(_("Every resource needs an eligible reviewed rights policy."))
            if item.snapshot_id != resource.current_snapshot_id:
                raise UserError(_("Every item must pin the currently approved snapshot."))
        for nested in self._nested_compositions(composition):
            if nested != composition and nested.state not in {"approved", "published"}:
                raise UserError(_("Every nested composition must be approved."))

        fingerprint_payload = {
            "composition_id": composition.id,
            "composition_state": composition.state,
            "entries": [
                (
                    kind,
                    value.id,
                    value.name if kind == "section" else value.resource_id.id,
                    "" if kind == "section" else value.snapshot_id.checksum,
                    0 if kind == "section" else value.sequence,
                )
                for kind, value in entries
            ],
        }
        canonical = json.dumps(
            fingerprint_payload,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        fingerprint = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        existing = self.search(
            [
                ("composition_id", "=", composition.id),
                ("input_fingerprint", "=", fingerprint),
            ],
            limit=1,
        )
        if existing:
            return existing
        previous = self.search(
            [("composition_id", "=", composition.id)],
            order="revision desc",
            limit=1,
        )
        channel = previous.channel_id or self.env["slide.channel"].create(
            {
                "name": composition.name,
                "description": composition.description or False,
                "channel_type": "training",
                "visibility": "public",
                "is_published": False,
                "facodi_composition_id": composition.id,
            }
        )
        publication = self.create(
            {
                "composition_id": composition.id,
                "revision": (previous.revision or 0) + 1,
                "input_fingerprint": fingerprint,
                "channel_id": channel.id,
                "prepared_by_id": self.env.user.id,
                "prepared_at": fields.Datetime.now(),
            }
        )
        sequence = 10
        for kind, item in entries:
            if kind == "section":
                self.env["slide.slide"].create(
                    {
                        "name": item.name,
                        "channel_id": channel.id,
                        "sequence": sequence,
                        "is_category": True,
                    }
                )
                sequence += 10
                continue
            resource = item.resource_id
            values = self._native_slide_values(resource, item.snapshot_id)
            values.update(
                {
                    "channel_id": channel.id,
                    "sequence": sequence,
                    "is_published": False,
                    "facodi_resource_id": resource.id,
                    "facodi_snapshot_id": item.snapshot_id.id,
                }
            )
            slide = self.env["slide.slide"].with_context(
                website_slides_skip_fetch_metadata=True
            ).create(values)
            receipt = self.env["facodi.publication.item"].create(
                {
                    "publication_id": publication.id,
                    "composition_item_id": item.id,
                    "resource_id": resource.id,
                    "snapshot_id": item.snapshot_id.id,
                    "slide_id": slide.id,
                }
            )
            slide.facodi_publication_item_id = receipt
            sequence += 10
        return publication

    @api.model
    def revise_for_update(self, update):
        """Apply an accepted snapshot only to native slides that used its predecessor."""

        update.ensure_one()
        receipts = self.env["facodi.publication.item"].search(
            [
                ("resource_id", "=", update.resource_id.id),
                ("snapshot_id", "=", update.previous_snapshot_id.id),
                ("publication_id.state", "=", "published"),
            ]
        )
        revised = self.browse()
        for previous in receipts.mapped("publication_id"):
            fingerprint = hashlib.sha256(
                (
                    f"update:{previous.input_fingerprint}:"
                    f"{update.proposed_snapshot_id.checksum}"
                ).encode("utf-8")
            ).hexdigest()
            existing = self.search(
                [
                    ("composition_id", "=", previous.composition_id.id),
                    ("input_fingerprint", "=", fingerprint),
                ],
                limit=1,
            )
            if existing:
                revised |= existing
                continue
            now = fields.Datetime.now()
            publication = self.create(
                {
                    "composition_id": previous.composition_id.id,
                    "revision": previous.revision + 1,
                    "input_fingerprint": fingerprint,
                    "channel_id": previous.channel_id.id,
                    "state": "published",
                    "prepared_by_id": self.env.user.id,
                    "prepared_at": now,
                    "published_by_id": self.env.user.id,
                    "published_at": now,
                }
            )
            for prior_receipt in previous.item_ids:
                is_target = (
                    prior_receipt.resource_id == update.resource_id
                    and prior_receipt.snapshot_id == update.previous_snapshot_id
                )
                snapshot = (
                    update.proposed_snapshot_id
                    if is_target
                    else prior_receipt.snapshot_id
                )
                if is_target:
                    values = self._native_slide_values(update.resource_id, snapshot)
                    values["facodi_snapshot_id"] = snapshot.id
                    prior_receipt.slide_id.with_context(
                        website_slides_skip_fetch_metadata=True
                    ).write(values)
                new_receipt = self.env["facodi.publication.item"].create(
                    {
                        "publication_id": publication.id,
                        "composition_item_id": prior_receipt.composition_item_id.id,
                        "resource_id": prior_receipt.resource_id.id,
                        "snapshot_id": snapshot.id,
                        "slide_id": prior_receipt.slide_id.id,
                        "source_update_id": update.id if is_target else False,
                        "published_at": now,
                    }
                )
                prior_receipt.slide_id.facodi_publication_item_id = new_receipt
            previous.state = "superseded"
            revised |= publication
        return revised

    @api.model
    def _publication_entries(self, composition, seen=None):
        composition.ensure_one()
        seen = set(seen or ())
        if composition.id in seen:
            raise ValidationError(_("A composition hierarchy cannot contain a cycle."))
        seen.add(composition.id)
        entries = []
        for item in composition.item_ids.sorted(
            key=lambda value: (value.sequence, value.id)
        ):
            if item.resource_id:
                entries.append(("resource", item))
                continue
            child = item.child_composition_id
            entries.append(("section", child))
            entries.extend(self._publication_entries(child, seen=seen))
        return entries

    @api.model
    def _nested_compositions(self, root):
        pending = [root]
        found = self.env["facodi.composition"]
        while pending:
            composition = pending.pop()
            if composition in found:
                continue
            found |= composition
            pending.extend(
                composition.item_ids.mapped("child_composition_id").exists()
            )
        return found

    @api.model
    def _ensure_curator(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_curator"
        ):
            raise AccessError(_("Only FACODI curators can prepare publications."))

    def _ensure_manager(self):
        if not self.env.is_superuser() and not self.env.user.has_group(
            "facodi_content.group_facodi_manager"
        ):
            raise AccessError(_("Only FACODI managers can publish eLearning content."))

    def action_publish(self):
        self._ensure_manager()
        now = fields.Datetime.now()
        for publication in self:
            if publication.state == "published":
                continue
            if publication.state != "prepared":
                raise UserError(_("Only a prepared publication can be published."))
            if publication.composition_id.state != "approved":
                raise UserError(_("The composition approval is no longer valid."))
            for receipt in publication.item_ids:
                if not receipt.resource_id.publication_eligible:
                    raise UserError(_("A resource rights decision is no longer eligible."))
                if receipt.snapshot_id != receipt.resource_id.current_snapshot_id:
                    raise UserError(_("A prepared resource snapshot is no longer current."))
            publication.item_ids.mapped("slide_id").write({"is_published": True})
            publication.channel_id.write({"is_published": True})
            publication.item_ids.write({"published_at": now})
            publication.item_ids.mapped("resource_id").write({"state": "published"})
            publication.composition_id.write({"state": "published"})
            publication.write(
                {
                    "state": "published",
                    "published_by_id": self.env.user.id,
                    "published_at": now,
                }
            )
        return True


class FacodiPublicationItem(models.Model):
    _name = "facodi.publication.item"
    _description = "FACODI Exact Publication Receipt"
    _order = "publication_id, composition_item_id, id"

    publication_id = fields.Many2one(
        "facodi.publication",
        required=True,
        ondelete="cascade",
        index=True,
    )
    company_id = fields.Many2one(
        related="publication_id.company_id",
        store=True,
        index=True,
    )
    composition_item_id = fields.Many2one(
        "facodi.composition.item",
        required=True,
        ondelete="restrict",
        index=True,
    )
    resource_id = fields.Many2one(
        "facodi.resource",
        required=True,
        ondelete="restrict",
        index=True,
    )
    snapshot_id = fields.Many2one(
        "facodi.resource.snapshot",
        required=True,
        ondelete="restrict",
        index=True,
    )
    channel_id = fields.Many2one(
        related="publication_id.channel_id",
        store=True,
        index=True,
    )
    slide_id = fields.Many2one(
        "slide.slide",
        required=True,
        ondelete="restrict",
        index=True,
    )
    published_at = fields.Datetime(copy=False, readonly=True)
    source_update_id = fields.Many2one(
        "facodi.resource.update",
        ondelete="restrict",
        index=True,
    )

    _publication_item_unique = models.Constraint(
        "UNIQUE(publication_id, composition_item_id)",
        "A composition item can receive only one receipt per publication revision.",
    )
    @api.constrains(
        "publication_id",
        "composition_item_id",
        "resource_id",
        "snapshot_id",
        "slide_id",
    )
    def _check_receipt(self):
        for receipt in self:
            item = receipt.composition_item_id
            if item.resource_id != receipt.resource_id:
                raise ValidationError(_("The receipt resource must match its composition item."))
            if not receipt.source_update_id and item.snapshot_id != receipt.snapshot_id:
                raise ValidationError(_("The receipt snapshot must match its composition item."))
            if receipt.source_update_id and (
                receipt.source_update_id.resource_id != receipt.resource_id
                or receipt.source_update_id.proposed_snapshot_id != receipt.snapshot_id
            ):
                raise ValidationError(
                    _("An update receipt must use its proposed resource snapshot.")
                )
            if receipt.snapshot_id.resource_id != receipt.resource_id:
                raise ValidationError(_("The receipt snapshot must belong to its resource."))
            if receipt.slide_id.channel_id != receipt.publication_id.channel_id:
                raise ValidationError(_("The receipt slide must belong to its native course."))
            if receipt.slide_id.facodi_resource_id != receipt.resource_id:
                raise ValidationError(_("The native slide must reference the receipt resource."))
