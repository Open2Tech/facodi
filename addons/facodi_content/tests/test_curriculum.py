import json

from psycopg2 import IntegrityError

from odoo.exceptions import UserError, ValidationError
from odoo.tests import tagged

from .common import FacodiCase


@tagged("post_install", "-at_install")
class TestFacodiCurriculum(FacodiCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.institution = cls.env["res.partner"].create(
            {"name": "SEA-EU Open University", "is_company": True}
        )
        cls.curriculum_source = cls.env["facodi.source"].create(
            {
                "name": "University curricula",
                "code": "university-curricula",
                "source_type": "curriculum",
                "company_id": cls.company.id,
            }
        )

    def _program(self):
        return self.env["facodi.program"].create(
            {
                "institution_partner_id": self.institution.id,
                "code": "LEI",
                "name": "Computer Engineering",
                "degree_level": "bachelor",
                "company_id": self.company.id,
            }
        )

    def test_hierarchy_and_constraints_keep_versions_and_units_unambiguous(self):
        program = self._program()
        plan = self.env["facodi.curriculum"].create(
            {"program_id": program.id, "version": "2026", "name": "LEI 2026"}
        )
        period = self.env["facodi.curriculum.period"].create(
            {
                "curriculum_id": plan.id,
                "name": "Year 1 / Semester 1",
                "year_number": 1,
                "semester_number": 1,
            }
        )
        unit = self.env["facodi.course.unit"].create(
            {
                "period_id": period.id,
                "code": "MATH101",
                "name": "Linear Algebra",
                "ects": 6,
            }
        )

        self.assertEqual(unit.curriculum_id, plan)
        self.assertEqual(unit.program_id, program)
        self.assertEqual(unit.year_number, 1)
        self.assertEqual(unit.semester_number, 1)
        self.assertEqual(period.sequence, 101)

        with self.assertRaises(IntegrityError), self.env.cr.savepoint():
            self.env["facodi.course.unit"].create(
                {
                    "period_id": period.id,
                    "code": "MATH101",
                    "name": "Duplicate",
                    "ects": 5,
                }
            )
        with self.assertRaises(ValidationError):
            unit.ects = -1

    def test_unit_relates_topics_outcomes_skills_prerequisites_and_bibliography(self):
        program = self._program()
        plan = self.env["facodi.curriculum"].create(
            {"program_id": program.id, "version": "2026", "name": "LEI 2026"}
        )
        period = self.env["facodi.curriculum.period"].create(
            {
                "curriculum_id": plan.id,
                "name": "Semester 1",
                "year_number": 1,
                "semester_number": 1,
            }
        )
        unit = self.env["facodi.course.unit"].create(
            {
                "period_id": period.id,
                "code": "MATH101",
                "name": "Linear Algebra",
                "ects": 6,
            }
        )
        concept = self.env["facodi.concept"].create(
            {
                "code": "concept:vectors",
                "name": "Vectors",
                "concept_type": "topic",
                "company_id": self.company.id,
            }
        )
        relation = self.env["facodi.unit.concept"].create(
            {
                "unit_id": unit.id,
                "concept_id": concept.id,
                "role": "topic",
                "weight": 0.8,
            }
        )
        book = self.create_resource(
            external_key="book:open-linear-algebra",
            resource_type="book",
        )
        unit.bibliography_resource_ids = book

        self.assertEqual(relation.concept_id, concept)
        self.assertEqual(unit.topic_relation_ids, relation)
        self.assertEqual(unit.bibliography_resource_ids, book)
        with self.assertRaises(ValidationError):
            relation.weight = 1.5

    def test_json_import_is_idempotent_traceable_and_draft_only(self):
        first_payload = {
            "program": {
                "code": "LEI",
                "name": "Computer Engineering",
                "degree_level": "bachelor",
            },
            "curriculum": {"version": "2026", "name": "LEI 2026"},
            "periods": [
                {
                    "year": 1,
                    "semester": 1,
                    "name": "Semester 1",
                    "units": [
                        {
                            "code": "MATH101",
                            "name": "Linear Algebra",
                            "ects": 6,
                            "topics": ["Vectors"],
                        }
                    ],
                }
            ],
        }

        plan, source_resource, first_snapshot = self.env[
            "facodi.curriculum"
        ].import_payload(
            source=self.curriculum_source,
            institution=self.institution,
            payload=json.dumps(first_payload).encode(),
            filename="lei-2026.json",
        )
        repeated_plan, repeated_resource, repeated_snapshot = self.env[
            "facodi.curriculum"
        ].import_payload(
            source=self.curriculum_source,
            institution=self.institution,
            payload=json.dumps(first_payload).encode(),
            filename="lei-2026.json",
        )

        self.assertEqual(plan, repeated_plan)
        self.assertEqual(source_resource, repeated_resource)
        self.assertEqual(first_snapshot, repeated_snapshot)
        self.assertEqual(plan.state, "draft")
        self.assertEqual(len(plan.period_ids), 1)
        self.assertEqual(len(plan.unit_ids), 1)
        self.assertEqual(plan.source_resource_id, source_resource)
        self.assertEqual(plan.source_snapshot_id, first_snapshot)
        self.assertEqual(first_snapshot.payload_json["provider"], "curriculum_import")
        self.assertEqual(plan.unit_ids.topic_relation_ids.concept_id.name, "Vectors")

        plan.action_submit_review()
        plan.action_activate()
        self.assertEqual(plan.state, "active")
        with self.assertRaises(UserError):
            self.env["facodi.curriculum"].import_payload(
                source=self.curriculum_source,
                institution=self.institution,
                payload=json.dumps(first_payload).encode(),
                filename="lei-2026.json",
            )

