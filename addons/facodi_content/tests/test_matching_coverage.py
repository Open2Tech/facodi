from odoo.tests import tagged

from .common import FacodiCase


@tagged("post_install", "-at_install")
class TestFacodiMatchingCoverage(FacodiCase):
    def setUp(self):
        super().setUp()
        institution = self.env["res.partner"].create(
            {"name": "Open University", "is_company": True}
        )
        program = self.env["facodi.program"].create(
            {
                "institution_partner_id": institution.id,
                "code": "LEI",
                "name": "Computer Engineering",
                "degree_level": "bachelor",
                "company_id": self.company.id,
            }
        )
        curriculum = self.env["facodi.curriculum"].create(
            {"program_id": program.id, "version": "2026", "name": "LEI 2026"}
        )
        period = self.env["facodi.curriculum.period"].create(
            {
                "curriculum_id": curriculum.id,
                "name": "Semester 1",
                "year_number": 1,
                "semester_number": 1,
            }
        )
        self.unit = self.env["facodi.course.unit"].create(
            {
                "period_id": period.id,
                "code": "MATH101",
                "name": "Linear Algebra",
                "ects": 6,
                "difficulty_level": "beginner",
            }
        )
        self.vectors = self.env["facodi.concept"].create(
            {
                "code": "topic:vectors",
                "name": "Vectors",
                "concept_type": "topic",
                "company_id": self.company.id,
            }
        )
        self.matrices = self.env["facodi.concept"].create(
            {
                "code": "topic:matrices",
                "name": "Matrices",
                "concept_type": "topic",
                "company_id": self.company.id,
            }
        )
        self.env["facodi.unit.concept"].create(
            {
                "unit_id": self.unit.id,
                "concept_id": self.vectors.id,
                "role": "topic",
                "weight": 0.6,
            }
        )
        self.env["facodi.unit.concept"].create(
            {
                "unit_id": self.unit.id,
                "concept_id": self.matrices.id,
                "role": "topic",
                "weight": 0.4,
            }
        )

    def _resource_with_concept(self, suffix, concept, confidence=0.9):
        resource = self.create_resource(
            external_key=f"resource:{suffix}",
            name=f"Resource {suffix}",
            difficulty_level="beginner",
        )
        snapshot = resource.record_snapshot({"title": resource.name})
        relation = self.env["facodi.resource.concept"].create(
            {
                "resource_id": resource.id,
                "concept_id": concept.id,
                "relation_type": concept.concept_type,
                "snapshot_id": snapshot.id,
                "confidence": confidence,
                "justification": "Validated source evidence",
                "validation_state": "accepted",
                "reviewer_id": self.env.user.id,
                "reviewed_at": "2026-09-04 12:00:00",
            }
        )
        return resource, relation

    def test_matching_uses_only_canonical_accepted_semantics(self):
        resource, _relation = self._resource_with_concept("vectors", self.vectors)

        matches = self.env["facodi.resource.unit.match"].generate_for_unit(self.unit)

        match = matches.filtered(lambda item: item.resource_id == resource)
        self.assertEqual(len(match), 1)
        self.assertEqual(match.state, "proposed")
        self.assertEqual(match.origin, "deterministic")
        self.assertAlmostEqual(match.relevance_score, 0.6)
        self.assertAlmostEqual(match.coverage_score, 0.54)
        self.assertAlmostEqual(match.confidence, 0.9)
        self.assertEqual(match.level_score, 1.0)
        self.assertIn("1/2", match.justification)

        match.action_accept(note="Validated by curriculum curator.")
        self.assertEqual(match.state, "accepted")
        review = self.env["facodi.review"].search([("match_id", "=", match.id)])
        self.assertEqual(review.decision, "accept")
        self.assertEqual(review.reviewer_id, self.env.user)

    def test_shared_concept_identity_supports_cross_language_matching(self):
        resource, relation = self._resource_with_concept("english", self.vectors)
        self.vectors.with_context(lang="pt_PT").name = "Vetores"
        resource.source_language_code = "en"

        match = self.env["facodi.resource.unit.match"].generate_for_unit(
            self.unit
        ).filtered(lambda item: item.resource_id == resource)

        self.assertEqual(match.matched_concept_ids, self.vectors)
        self.assertEqual(relation.concept_id, self.vectors)
        self.assertEqual(
            self.env["facodi.concept"].search_count(
                [("code", "=", "topic:vectors"), ("company_id", "=", self.company.id)]
            ),
            1,
        )

    def test_coverage_ignores_proposals_and_versions_accepted_inputs(self):
        resources = [
            self._resource_with_concept(str(index), self.vectors)[0]
            for index in range(3)
        ]
        matches = self.env["facodi.resource.unit.match"].generate_for_unit(self.unit)
        first_gap = self.env["facodi.coverage"].compute_for_unit(self.unit)

        self.assertEqual(first_gap.version, 1)
        self.assertEqual(
            first_gap.line_ids.filtered(
                lambda line: line.unit_concept_id.concept_id == self.vectors
            ).status,
            "gap",
        )

        for match in matches.filtered(lambda item: item.resource_id in resources):
            match.action_accept()
        covered = self.env["facodi.coverage"].compute_for_unit(self.unit)
        repeated = self.env["facodi.coverage"].compute_for_unit(self.unit)

        vectors_line = covered.line_ids.filtered(
            lambda line: line.unit_concept_id.concept_id == self.vectors
        )
        matrices_line = covered.line_ids.filtered(
            lambda line: line.unit_concept_id.concept_id == self.matrices
        )
        self.assertEqual(covered.version, 2)
        self.assertEqual(repeated, covered)
        self.assertEqual(vectors_line.status, "redundant")
        self.assertEqual(vectors_line.resource_count, 3)
        self.assertAlmostEqual(vectors_line.score, 0.54)
        self.assertEqual(matrices_line.status, "gap")
        self.assertEqual(matrices_line.resource_count, 0)
        self.assertAlmostEqual(covered.overall_score, 0.324)
        self.assertEqual(covered.resource_count, 3)
        self.assertTrue(covered.input_fingerprint)

