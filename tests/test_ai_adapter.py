import importlib.util
import json
import sys
from pathlib import Path
from unittest import TestCase


SERVICES_DIR = Path(__file__).parents[1] / "addons" / "facodi_content" / "services"
MODULE_PATH = SERVICES_DIR / "ai.py"


def load_ai():
    assert MODULE_PATH.exists(), "The AI adapter boundary is missing"
    services_path = str(SERVICES_DIR)
    if services_path not in sys.path:
        sys.path.insert(0, services_path)
    spec = importlib.util.spec_from_file_location("facodi_ai", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def public_dns(*_args, **_kwargs):
    return [(2, 1, 6, "", ("93.184.216.34", 443))]


class FakeResponse:
    def __init__(self, payload, *, url="https://ai.example/v1/chat/completions"):
        self.status_code = 200
        self.url = url
        self.headers = {"Content-Type": "application/json"}
        self.body = json.dumps(payload).encode()
        self.closed = False

    def iter_content(self, chunk_size):
        del chunk_size
        yield self.body

    def close(self):
        self.closed = True


class FakeSession:
    def __init__(self, response):
        self.response = response
        self.calls = []

    def post(self, url, **kwargs):
        self.calls.append((url, kwargs))
        return self.response


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
        "learning_outcomes": [
            {
                "value": "Represent vectors in a basis",
                "confidence": 0.88,
                "justification": "Worked examples use coordinates.",
            }
        ],
        "competencies": [],
        "prerequisites": [],
    }


class TestAiAdapter(TestCase):
    def test_normalises_supported_inferences_without_losing_evidence(self):
        ai = load_ai()

        assertions = ai.normalise_ai_document(ai_document())

        self.assertEqual(
            [item["assertion_type"] for item in assertions],
            ["summary", "difficulty", "concept", "learning_outcome"],
        )
        self.assertEqual(assertions[0]["value_text"], "An introduction to vector spaces.")
        self.assertEqual(assertions[2]["confidence"], 0.93)
        self.assertEqual(
            assertions[2]["justification"],
            "Vectors are explained throughout.",
        )

    def test_rejects_malformed_confidence_with_a_contract_path(self):
        ai = load_ai()
        document = ai_document()
        document["concepts"][0]["confidence"] = 4

        with self.assertRaisesRegex(
            ai.AIContractError,
            r"concepts\[0\]\.confidence",
        ):
            ai.normalise_ai_document(document)

    def test_openai_compatible_client_uses_safe_https_and_returns_json_contract(self):
        ai = load_ai()
        response = FakeResponse(
            {
                "model": "facodi-test-model",
                "choices": [
                    {"message": {"content": json.dumps(ai_document())}}
                ],
            }
        )
        session = FakeSession(response)
        client = ai.OpenAICompatibleClient(
            session=session,
            resolver=public_dns,
            timeout=11,
            max_bytes=100_000,
        )

        result = client.analyse(
            endpoint="https://ai.example/v1/chat/completions",
            api_key="very-secret",
            model="facodi-test-model",
            system_prompt="Return the FACODI JSON contract.",
            input_payload={"title": "Vectors", "text": "Vector spaces and bases"},
        )

        self.assertEqual(result["document"], ai_document())
        self.assertEqual(result["provider_model"], "facodi-test-model")
        self.assertNotIn("very-secret", json.dumps(result))
        self.assertEqual(session.calls[0][0], "https://ai.example/v1/chat/completions")
        self.assertEqual(session.calls[0][1]["timeout"], 11)
        self.assertFalse(session.calls[0][1]["allow_redirects"])
        self.assertTrue(response.closed)

