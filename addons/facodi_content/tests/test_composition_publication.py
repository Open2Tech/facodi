from psycopg2 import IntegrityError

from odoo.exceptions import AccessError, UserError, ValidationError
from odoo.tests import tagged

from .common import FacodiCase


@tagged("post_install", "-at_install")
class TestFacodiCompositionPublication(FacodiCase):
    def _approved_resource(self, suffix="video", resource_type="video"):
        resource = self.create_resource(
            name=f"Resource {suffix}",
            external_key=f"publication:{suffix}",
            resource_type=resource_type,
            rights_status="open",
            usage_mode="embed" if resource_type == "video" else "link",
            rights_reviewed_by_id=self.env.user.id,
            rights_reviewed_at="2026-09-05 10:00:00",
            state="approved",
        )
        snapshot = resource.record_snapshot(
            {"title": resource.name, "version": suffix},
            source_version=suffix,
        )
        return resource, snapshot

    def _composition(self, name="Linear Algebra", **values):
        defaults = {
            "name": name,
            "composition_type": "course",
            "origin": "manual",
            "company_id": self.company.id,
        }
        defaults.update(values)
        return self.env["facodi.composition"].create(defaults)

    def test_items_are_exclusive_ordered_and_compositions_cannot_cycle(self):
        resource, snapshot = self._approved_resource()
        module = self._composition("Vectors module", composition_type="module")
        course = self._composition()
        first = self.env["facodi.composition.item"].create(
            {
                "composition_id": course.id,
                "sequence": 10,
                "child_composition_id": module.id,
            }
        )
        second = self.env["facodi.composition.item"].create(
            {
                "composition_id": course.id,
                "sequence": 20,
                "resource_id": resource.id,
                "snapshot_id": snapshot.id,
            }
        )

        self.assertEqual(course.item_ids, first | second)
        with self.assertRaises(ValidationError):
            self.env["facodi.composition.item"].create(
                {
                    "composition_id": course.id,
                    "resource_id": resource.id,
                    "snapshot_id": snapshot.id,
                    "child_composition_id": module.id,
                }
            )
        with self.assertRaises(ValidationError):
            self.env["facodi.composition.item"].create(
                {
                    "composition_id": module.id,
                    "child_composition_id": course.id,
                }
            )
        with self.assertRaises(IntegrityError), self.env.cr.savepoint():
            self.env["facodi.composition.item"].create(
                {
                    "composition_id": course.id,
                    "resource_id": resource.id,
                    "snapshot_id": snapshot.id,
                    "sequence": 30,
                }
            )

    def test_candidate_and_rights_gates_prevent_automatic_publication(self):
        resource, snapshot = self._approved_resource()
        composition = self._composition(origin="ai")
        self.env["facodi.composition.item"].create(
            {
                "composition_id": composition.id,
                "resource_id": resource.id,
                "snapshot_id": snapshot.id,
            }
        )

        with self.assertRaises(UserError):
            self.env["facodi.publication"].prepare_for_composition(composition)

        composition.action_submit_review()
        composition.action_approve(note="Pedagogical order validated.")
        resource.write({"rights_status": "not_eligible", "usage_mode": "forbidden"})
        with self.assertRaises(UserError):
            self.env["facodi.publication"].prepare_for_composition(composition)

        self.assertEqual(composition.state, "approved")
        review = self.env["facodi.review"].search(
            [("composition_id", "=", composition.id)]
        )
        self.assertEqual(review.decision, "accept")
        self.assertFalse(
            self.env["slide.channel"].search(
                [("facodi_composition_id", "=", composition.id)]
            )
        )

    def test_prepare_is_idempotent_and_records_exact_snapshot_in_native_draft(self):
        resource, snapshot = self._approved_resource()
        composition = self._composition()
        self.env["facodi.composition.item"].create(
            {
                "composition_id": composition.id,
                "resource_id": resource.id,
                "snapshot_id": snapshot.id,
            }
        )
        composition.action_submit_review()
        composition.action_approve()

        publication = self.env["facodi.publication"].prepare_for_composition(
            composition
        )
        repeated = self.env["facodi.publication"].prepare_for_composition(composition)

        self.assertEqual(repeated, publication)
        self.assertEqual(publication.state, "prepared")
        self.assertEqual(publication.channel_id.facodi_composition_id, composition)
        self.assertFalse(publication.channel_id.is_published)
        self.assertEqual(len(publication.item_ids), 1)
        receipt = publication.item_ids
        self.assertEqual(receipt.resource_id, resource)
        self.assertEqual(receipt.snapshot_id, snapshot)
        self.assertEqual(receipt.slide_id.facodi_resource_id, resource)
        self.assertEqual(receipt.slide_id.facodi_snapshot_id, snapshot)
        self.assertFalse(receipt.slide_id.is_published)

    def test_same_resource_can_be_reused_in_distinct_native_courses(self):
        resource, snapshot = self._approved_resource()
        publications = self.env["facodi.publication"]
        for name in ("Course A", "Course B"):
            composition = self._composition(name)
            self.env["facodi.composition.item"].create(
                {
                    "composition_id": composition.id,
                    "resource_id": resource.id,
                    "snapshot_id": snapshot.id,
                }
            )
            composition.action_submit_review()
            composition.action_approve()
            publications |= self.env["facodi.publication"].prepare_for_composition(
                composition
            )

        slides = publications.mapped("item_ids.slide_id")
        self.assertEqual(len(slides), 2)
        self.assertNotEqual(slides[0].channel_id, slides[1].channel_id)
        self.assertEqual(slides.mapped("facodi_resource_id"), resource)

    def test_approved_module_becomes_native_section_with_ordered_content(self):
        resource, snapshot = self._approved_resource()
        module = self._composition("Vectors module", composition_type="module")
        self.env["facodi.composition.item"].create(
            {
                "composition_id": module.id,
                "resource_id": resource.id,
                "snapshot_id": snapshot.id,
            }
        )
        module.action_submit_review()
        module.action_approve()
        course = self._composition()
        self.env["facodi.composition.item"].create(
            {
                "composition_id": course.id,
                "child_composition_id": module.id,
            }
        )
        course.action_submit_review()
        course.action_approve()

        publication = self.env["facodi.publication"].prepare_for_composition(course)

        section = publication.channel_id.slide_ids.filtered("is_category")
        content = publication.item_ids.slide_id
        self.assertEqual(section.name, "Vectors module")
        self.assertLess(section.sequence, content.sequence)
        self.assertEqual(content.facodi_resource_id, resource)
        self.assertFalse(publication.channel_id.is_published)

    def test_only_manager_can_publish_prepared_native_records(self):
        resource, snapshot = self._approved_resource()
        composition = self._composition()
        self.env["facodi.composition.item"].create(
            {
                "composition_id": composition.id,
                "resource_id": resource.id,
                "snapshot_id": snapshot.id,
            }
        )
        composition.action_submit_review()
        composition.action_approve()
        publication = self.env["facodi.publication"].prepare_for_composition(
            composition
        )
        curator = self.create_user(
            "composition-curator",
            self.env.ref("facodi_content.group_facodi_curator"),
        )
        manager = self.create_user(
            "publication-manager",
            self.env.ref("facodi_content.group_facodi_manager"),
        )

        with self.assertRaises(AccessError):
            publication.with_user(curator).action_publish()
        publication.with_user(manager).action_publish()

        self.assertEqual(publication.state, "published")
        self.assertEqual(publication.published_by_id, manager)
        self.assertTrue(publication.published_at)
        self.assertTrue(publication.channel_id.is_published)
        self.assertTrue(all(publication.item_ids.mapped("slide_id.is_published")))
        self.assertTrue(all(publication.item_ids.mapped("published_at")))
