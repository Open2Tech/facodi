import importlib.util
from pathlib import Path
from unittest import TestCase


MODULE_PATH = (
    Path(__file__).parents[1]
    / "addons"
    / "facodi_content"
    / "services"
    / "matching.py"
)


def load_matching():
    assert MODULE_PATH.exists(), "The deterministic matching service is missing"
    spec = importlib.util.spec_from_file_location("facodi_matching", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TestDeterministicMatching(TestCase):
    def test_scores_weighted_overlap_and_evidence_confidence(self):
        matching = load_matching()

        score = matching.score_candidate(
            requirements=[
                {"concept_id": 10, "weight": 0.6},
                {"concept_id": 20, "weight": 0.4},
            ],
            evidence=[{"concept_id": 10, "confidence": 0.9}],
            resource_level="beginner",
            unit_level="beginner",
        )

        self.assertEqual(score["matched_count"], 1)
        self.assertEqual(score["required_count"], 2)
        self.assertAlmostEqual(score["relevance_score"], 0.6)
        self.assertAlmostEqual(score["coverage_score"], 0.54)
        self.assertAlmostEqual(score["confidence"], 0.9)
        self.assertEqual(score["level_score"], 1.0)

    def test_classifies_gap_partial_good_and_redundant(self):
        matching = load_matching()

        self.assertEqual(
            matching.classify_coverage(0.0, strong_resource_count=0),
            "gap",
        )
        self.assertEqual(
            matching.classify_coverage(0.3, strong_resource_count=1),
            "partial",
        )
        self.assertEqual(
            matching.classify_coverage(0.8, strong_resource_count=1),
            "good",
        )
        self.assertEqual(
            matching.classify_coverage(0.85, strong_resource_count=3),
            "redundant",
        )

