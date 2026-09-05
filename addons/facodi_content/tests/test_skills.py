from datetime import timedelta

from odoo import Command, fields
from odoo.exceptions import AccessError
from odoo.tests import tagged

from .common import FacodiCase


@tagged("post_install", "-at_install")
class TestFacodiSkills(FacodiCase):
    def _curricular_unit(self):
        institution = self.env["res.partner"].create({"name": "SEA-EU University"})
        program = self.env["facodi.program"].create(
            {
                "institution_partner_id": institution.id,
                "code": "BSC-CS",
                "name": "Computer Science",
                "degree_level": "bachelor",
                "company_id": self.company.id,
            }
        )
        curriculum = self.env["facodi.curriculum"].create(
            {
                "program_id": program.id,
                "version": "2026",
                "name": "Computer Science 2026",
                "state": "active",
            }
        )
        period = self.env["facodi.curriculum.period"].create(
            {
                "curriculum_id": curriculum.id,
                "name": "Year 1 · Semester 1",
                "year_number": 1,
                "semester_number": 1,
            }
        )
        unit = self.env["facodi.course.unit"].create(
            {
                "period_id": period.id,
                "code": "ALG101",
                "name": "Algorithms",
                "ects": 6,
            }
        )
        competency = self.env["facodi.concept"].create(
            {
                "code": "competency:algorithm-design",
                "name": "Algorithm design",
                "concept_type": "competency",
                "company_id": self.company.id,
            }
        )
        prerequisite = self.env["facodi.concept"].create(
            {
                "code": "prerequisite:programming-basics",
                "name": "Programming basics",
                "concept_type": "prerequisite",
                "company_id": self.company.id,
            }
        )
        self.env["facodi.unit.concept"].create(
            [
                {
                    "unit_id": unit.id,
                    "concept_id": competency.id,
                    "role": "competency",
                },
                {
                    "unit_id": unit.id,
                    "concept_id": prerequisite.id,
                    "role": "prerequisite",
                },
            ]
        )
        return unit, competency, prerequisite

    def _resource_with_semantics(
        self,
        suffix,
        *,
        competency,
        prerequisite=None,
        language="en",
    ):
        resource = self.create_resource(
            name=f"Lesson {suffix}",
            external_key=f"skill:{suffix}",
            source_url=f"https://example.org/{suffix}",
            resource_type="article",
            source_language_code=language,
            rights_status="open",
            usage_mode="link",
            rights_reviewed_by_id=self.env.user.id,
            rights_reviewed_at="2026-09-05 10:00:00",
            state="approved",
        )
        snapshot = resource.record_snapshot(
            {"title": resource.name, "version": "v1"},
            source_version="v1",
        )
        concepts = [(competency, "competency")]
        if prerequisite:
            concepts.append((prerequisite, "prerequisite"))
        for concept, relation_type in concepts:
            self.env["facodi.resource.concept"].create(
                {
                    "resource_id": resource.id,
                    "concept_id": concept.id,
                    "relation_type": relation_type,
                    "snapshot_id": snapshot.id,
                    "confidence": 1.0,
                    "justification": "Human-validated curriculum alignment.",
                    "validation_state": "accepted",
                    "reviewer_id": self.env.user.id,
                    "reviewed_at": fields.Datetime.now(),
                }
            )
        return resource, snapshot

    def _completed_publication(self, unit, resource, snapshot, learner):
        composition = self.env["facodi.composition"].create(
            {
                "name": "Algorithms course",
                "composition_type": "course",
                "origin": "manual",
                "company_id": self.company.id,
                "unit_id": unit.id,
            }
        )
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
        publication.action_publish()
        membership = self.env["slide.channel.partner"].create(
            {
                "channel_id": publication.channel_id.id,
                "partner_id": learner.id,
                "member_status": "joined",
            }
        )
        completion = self.env["slide.slide.partner"].create(
            {
                "slide_id": publication.item_ids.slide_id.id,
                "partner_id": learner.id,
                "completed": True,
            }
        )
        return composition, publication, membership, completion

    def test_native_completion_proposes_advisory_skill_evidence_idempotently(self):
        unit, competency, prerequisite = self._curricular_unit()
        resource, snapshot = self._resource_with_semantics(
            "completion",
            competency=competency,
            prerequisite=prerequisite,
        )
        learner = self.env["res.partner"].create(
            {"name": "Learner", "lang": "en_US"}
        )
        _composition, publication, _membership, completion = (
            self._completed_publication(unit, resource, snapshot, learner)
        )

        first = self.env["facodi.skill.evidence"].propose_from_completion(completion)
        second = self.env["facodi.skill.evidence"].propose_from_completion(completion)

        self.assertEqual(first, second)
        self.assertEqual(len(first), 1)
        self.assertEqual(first.partner_id, learner)
        self.assertEqual(first.concept_id, competency)
        self.assertEqual(first.unit_id, unit)
        self.assertEqual(first.source_slide_partner_id, completion)
        self.assertEqual(first.source_slide_id, completion.slide_id)
        self.assertEqual(first.source_channel_id, publication.channel_id)
        self.assertEqual(first.state, "proposed")
        self.assertEqual(first.scope, "advisory")
        self.assertTrue(first.completion_observed_at)
        self.assertTrue(completion.completed)

    def test_only_curator_validates_evidence_and_review_is_immutable(self):
        unit, competency, _prerequisite = self._curricular_unit()
        resource, snapshot = self._resource_with_semantics(
            "validation",
            competency=competency,
        )
        learner = self.env["res.partner"].create({"name": "Learner"})
        _composition, _publication, _membership, completion = (
            self._completed_publication(unit, resource, snapshot, learner)
        )
        evidence = self.env["facodi.skill.evidence"].propose_from_completion(
            completion
        )
        viewer = self.create_user(
            "skills-viewer", self.env.ref("facodi_content.group_facodi_viewer")
        )
        curator = self.create_user(
            "skills-curator", self.env.ref("facodi_content.group_facodi_curator")
        )

        with self.assertRaises(AccessError):
            evidence.with_user(viewer).action_validate()
        evidence.with_user(curator).action_validate(
            note="Completion and curriculum competency checked."
        )

        self.assertEqual(evidence.state, "validated")
        self.assertEqual(evidence.validated_by_id, curator)
        review = self.env["facodi.review"].search(
            [("skill_evidence_id", "=", evidence.id)]
        )
        self.assertEqual(review.decision, "accept")
        self.assertEqual(review.reviewer_id, curator)
        self.assertEqual(evidence.scope, "advisory")

    def test_recommendations_rank_gap_prerequisites_language_and_history(self):
        unit, competency, prerequisite = self._curricular_unit()
        learner = self.env["res.partner"].create(
            {"name": "Learner", "lang": "en_US"}
        )
        self.env["facodi.skill.evidence"].create(
            {
                "partner_id": learner.id,
                "concept_id": prerequisite.id,
                "unit_id": unit.id,
                "origin": "manual",
                "scope": "advisory",
                "state": "validated",
                "confidence": 1.0,
                "justification": "Previously validated prerequisite.",
                "proposed_by_id": self.env.user.id,
                "proposed_at": fields.Datetime.now(),
                "validated_by_id": self.env.user.id,
                "validated_at": fields.Datetime.now(),
                "fingerprint": "manual:prerequisite",
            }
        )
        best, best_snapshot = self._resource_with_semantics(
            "best",
            competency=competency,
            prerequisite=prerequisite,
            language="en",
        )
        mismatch, _mismatch_snapshot = self._resource_with_semantics(
            "mismatch",
            competency=competency,
            language="pt",
        )
        completed, completed_snapshot = self._resource_with_semantics(
            "completed",
            competency=competency,
            language="en",
        )
        self._completed_publication(
            unit, completed, completed_snapshot, learner
        )
        candidate = self.env["facodi.composition"].create(
            {
                "name": "Algorithms learning path",
                "composition_type": "path",
                "origin": "manual",
                "company_id": self.company.id,
                "unit_id": unit.id,
            }
        )
        self.env["facodi.composition.item"].create(
            {
                "composition_id": candidate.id,
                "resource_id": best.id,
                "snapshot_id": best_snapshot.id,
            }
        )
        candidate.action_submit_review()
        candidate.action_approve()
        membership_count = self.env["slide.channel.partner"].search_count(
            [("partner_id", "=", learner.id)]
        )

        recommendations = self.env[
            "facodi.learning.recommendation"
        ].generate_for_partner(learner, target_concepts=competency)

        resource_recommendations = recommendations.filtered("resource_id")
        self.assertEqual(resource_recommendations[0].resource_id, best)
        self.assertGreater(
            resource_recommendations.filtered(lambda item: item.resource_id == best).score,
            resource_recommendations.filtered(
                lambda item: item.resource_id == mismatch
            ).score,
        )
        self.assertGreater(
            resource_recommendations.filtered(
                lambda item: item.resource_id == mismatch
            ).score,
            resource_recommendations.filtered(
                lambda item: item.resource_id == completed
            ).score,
        )
        best_recommendation = resource_recommendations.filtered(
            lambda item: item.resource_id == best
        )
        self.assertEqual(best_recommendation.target_concept_id, competency)
        self.assertEqual(best_recommendation.state, "proposed")
        self.assertGreater(best_recommendation.expires_at, fields.Datetime.now())
        self.assertIn("Algorithm design", best_recommendation.explanation)
        self.assertEqual(best_recommendation.factors_json["prerequisite_score"], 1.0)
        self.assertEqual(best_recommendation.factors_json["language_score"], 1.0)
        self.assertTrue(
            recommendations.filtered(lambda item: item.composition_id == candidate)
        )
        self.assertEqual(candidate.state, "approved")
        self.assertFalse(candidate.publication_ids)
        self.assertEqual(
            self.env["slide.channel.partner"].search_count(
                [("partner_id", "=", learner.id)]
            ),
            membership_count,
        )

    def test_learner_can_read_and_dismiss_only_own_time_bounded_recommendation(self):
        _unit, competency, _prerequisite = self._curricular_unit()
        resource, snapshot = self._resource_with_semantics(
            "portal",
            competency=competency,
        )
        portal = self.env["res.users"].with_context(no_reset_password=True).create(
            {
                "name": "Skills Portal",
                "login": "skills-portal",
                "email": "skills-portal@example.test",
                "group_ids": [Command.set([self.env.ref("base.group_portal").id])],
            }
        )
        other = self.env["res.partner"].create({"name": "Other learner"})
        model = self.env["facodi.learning.recommendation"]
        own = model.create(
            {
                "partner_id": portal.partner_id.id,
                "target_concept_id": competency.id,
                "resource_id": resource.id,
                "snapshot_id": snapshot.id,
                "score": 0.8,
                "explanation": "Addresses an uncovered competency.",
                "factors_json": {"gap": 1.0},
                "generated_at": fields.Datetime.now(),
                "expires_at": fields.Datetime.now() + timedelta(days=30),
                "fingerprint": "portal:own",
            }
        )
        other_recommendation = model.create(
            {
                "partner_id": other.id,
                "target_concept_id": competency.id,
                "resource_id": resource.id,
                "snapshot_id": snapshot.id,
                "score": 0.8,
                "explanation": "Other learner recommendation.",
                "factors_json": {"gap": 1.0},
                "generated_at": fields.Datetime.now(),
                "expires_at": fields.Datetime.now() + timedelta(days=30),
                "fingerprint": "portal:other",
            }
        )

        visible = model.with_user(portal).search([])
        self.assertIn(own, visible)
        self.assertNotIn(other_recommendation, visible)
        own.with_user(portal).action_dismiss()
        self.assertEqual(own.state, "dismissed")
        with self.assertRaises(AccessError):
            other_recommendation.with_user(portal).action_dismiss()

        expired = model.create(
            {
                "partner_id": portal.partner_id.id,
                "target_concept_id": competency.id,
                "resource_id": resource.id,
                "snapshot_id": snapshot.id,
                "score": 0.7,
                "explanation": "Expired recommendation.",
                "factors_json": {"gap": 1.0},
                "generated_at": fields.Datetime.now() - timedelta(days=31),
                "expires_at": fields.Datetime.now() - timedelta(days=1),
                "fingerprint": "portal:expired",
            }
        )
        model._expire_due()
        self.assertEqual(expired.state, "expired")
