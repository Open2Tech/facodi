from unittest.mock import patch

from odoo.exceptions import AccessError, UserError
from odoo.tests import tagged
from odoo.tools import html2plaintext

from .common import FacodiCase


def ai_document():
    return {
        "summary": {
            "value": "An introduction to vector spaces.",
            "confidence": 0.96,
            "justification": "The transcript defines vectors and bases.",
        },
        "difficulty": {
            "value": "beginner",
            "confidence": 0.82,
            "justification": "No university prerequisites are assumed.",
        },
        "concepts": [
            {
                "value": "Vectors",
                "confidence": 0.93,
                "justification": "Vectors are explained throughout.",
            }
        ],
        "learning_outcomes": [],
        "competencies": [],
        "prerequisites": [],
    }


@tagged("post_install", "-at_install")
class TestFacodiAiCuration(FacodiCase):
    def setUp(self):
        super().setUp()
        self.resource = self.create_resource()
        self.snapshot = self.resource.record_snapshot(
            {"title": "Vectors", "transcript": "Vector spaces and bases"}
        )

    def _run(self, **overrides):
        values = {
            "resource": self.resource,
            "snapshot": self.snapshot,
            "provider": "openai_compatible",
            "model_name": "facodi-test-model",
            "prompt_version": "facodi-v1",
            "source_language_code": "en",
            "requested_language_code": "pt",
            "input_payload": {"title": "Vectors", "text": "Vector spaces"},
        }
        values.update(overrides)
        return self.env["facodi.analysis.run"].get_or_create(**values)

    def test_analysis_identity_is_reused_only_for_the_same_versioned_input(self):
        first = self._run()
        repeated = self._run()
        new_prompt = self._run(prompt_version="facodi-v2")

        self.assertEqual(first, repeated)
        self.assertNotEqual(first, new_prompt)
        self.assertEqual(len(first.input_hash), 64)
        self.assertEqual(first.snapshot_id, self.snapshot)
        self.assertEqual(first.model_name, "facodi-test-model")
        self.assertEqual(first.prompt_version, "facodi-v1")

    def test_result_creates_proposals_without_mutating_or_approving_resource(self):
        run = self._run()
        original_description = self.resource.description

        run.record_result(
            ai_document(),
            raw_result={"provider_request_id": "req-1"},
        )

        self.assertEqual(run.state, "succeeded")
        self.assertEqual(len(run.assertion_ids), 3)
        self.assertTrue(all(item.state == "proposed" for item in run.assertion_ids))
        self.assertEqual(self.resource.description, original_description)
        self.assertNotIn(self.resource.state, {"approved", "published"})

    def test_human_accept_correct_reject_materialises_decisions_and_audit(self):
        run = self._run()
        run.record_result(ai_document(), raw_result={"provider_request_id": "req-1"})
        summary = run.assertion_ids.filtered(lambda item: item.assertion_type == "summary")
        concept = run.assertion_ids.filtered(lambda item: item.assertion_type == "concept")
        difficulty = run.assertion_ids.filtered(
            lambda item: item.assertion_type == "difficulty"
        )

        summary.action_accept()
        concept.action_correct("Vector spaces", note="Use the canonical academic term.")
        difficulty.action_reject(note="Level needs subject review.")

        self.assertEqual(summary.state, "accepted")
        self.assertIn("vector spaces", html2plaintext(self.resource.description).lower())
        self.assertEqual(concept.state, "corrected")
        self.assertEqual(concept.value_text, "Vectors")
        self.assertEqual(concept.decision_value_text, "Vector spaces")
        relation = self.env["facodi.resource.concept"].search(
            [("resource_id", "=", self.resource.id)]
        )
        self.assertEqual(relation.concept_id.name, "Vector spaces")
        self.assertEqual(relation.assertion_id, concept)
        self.assertEqual(relation.validation_state, "accepted")
        self.assertEqual(difficulty.state, "rejected")
        self.assertFalse(self.resource.difficulty_level)
        reviews = self.env["facodi.review"].search(
            [("analysis_run_id", "=", run.id)], order="id"
        )
        self.assertEqual(reviews.mapped("decision"), ["accept", "correct", "reject"])
        self.assertEqual(reviews[1].original_value, "Vectors")
        self.assertEqual(reviews[1].final_value, "Vector spaces")
        self.assertEqual(reviews[1].reviewer_id, self.env.user)
        self.assertTrue(reviews[1].reviewed_at)
        self.assertNotIn(self.resource.state, {"approved", "published"})
        with self.assertRaises(UserError):
            reviews[0].write({"note": "Rewrite history"})

    def test_ordinary_internal_user_cannot_decide_ai_assertion(self):
        run = self._run()
        run.record_result(ai_document(), raw_result={})
        assertion = run.assertion_ids[0]
        ordinary = self.create_user("ordinary-ai-reviewer")

        with self.assertRaises(AccessError):
            assertion.with_user(ordinary).action_accept()

    def test_enrichment_job_executes_configured_adapter_without_storing_secret(self):
        parameters = self.env["ir.config_parameter"].sudo()
        parameters.set_param(
            "facodi.ai.endpoint",
            "https://ai.example/v1/chat/completions",
        )
        parameters.set_param("facodi.ai.api_key", "very-secret")
        parameters.set_param("facodi.ai.model", "facodi-test-model")
        parameters.set_param("facodi.ai.prompt_version", "facodi-v1")
        run, job = self.resource.queue_enrichment(requested_language_code="pt")

        class FakeClient:
            def analyse(self, **values):
                self.values = values
                return {
                    "document": ai_document(),
                    "raw_result": {"provider_request_id": "req-1"},
                    "provider_model": "facodi-test-model",
                }

        fake_client = FakeClient()
        with patch.object(type(run), "_ai_client", return_value=fake_client):
            outcome = job._dispatch()

        self.assertEqual(outcome["analysis_run_id"], run.id)
        self.assertEqual(run.state, "succeeded")
        self.assertEqual(len(run.assertion_ids), 3)
        self.assertEqual(fake_client.values["api_key"], "very-secret")
        self.assertNotIn("very-secret", str(job.payload_json))
        self.assertNotIn("very-secret", str(job.result_json))
        self.assertNotIn(self.resource.state, {"approved", "published"})
