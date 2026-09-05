import importlib.util
import sys
from pathlib import Path
from unittest import TestCase


SERVICES_DIR = Path(__file__).parents[1] / "addons" / "facodi_content" / "services"
MODULE_PATH = SERVICES_DIR / "ingestion.py"


def load_ingestion():
    services_path = str(SERVICES_DIR)
    if services_path not in sys.path:
        sys.path.insert(0, services_path)
    spec = importlib.util.spec_from_file_location("facodi_refresh_ingestion", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def public_dns(*_args, **_kwargs):
    return [(2, 1, 6, "", ("93.184.216.34", 443))]


class FakeResponse:
    def __init__(self, status_code, *, url, headers=None, body=b""):
        self.status_code = status_code
        self.url = url
        self.headers = headers or {}
        self.body = body
        self.closed = False

    def iter_content(self, chunk_size):
        del chunk_size
        if self.body:
            yield self.body

    def close(self):
        self.closed = True


class FakeSession:
    def __init__(self, response):
        self.response = response
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append((url, kwargs))
        return self.response


class TestConditionalRefresh(TestCase):
    def test_uses_etag_and_last_modified_and_accepts_not_modified(self):
        ingestion = load_ingestion()
        response = FakeResponse(
            304,
            url="https://example.org/lesson",
            headers={"ETag": '"v1"', "Last-Modified": "Fri, 04 Sep 2026 12:00:00 GMT"},
        )
        session = FakeSession(response)
        client = ingestion.IngestionClient(session=session, resolver=public_dns)

        result = client.refresh_url(
            "https://example.org/lesson",
            etag='"v1"',
            last_modified="Fri, 04 Sep 2026 12:00:00 GMT",
        )

        self.assertEqual(result["status"], "not_modified")
        self.assertEqual(result["etag"], '"v1"')
        self.assertEqual(
            session.calls[0][1]["headers"],
            {
                "If-None-Match": '"v1"',
                "If-Modified-Since": "Fri, 04 Sep 2026 12:00:00 GMT",
            },
        )
        self.assertTrue(response.closed)

    def test_returns_normalised_changed_document_with_new_validators(self):
        ingestion = load_ingestion()
        response = FakeResponse(
            200,
            url="https://example.org/lesson",
            headers={"Content-Type": "text/html", "ETag": '"v2"'},
            body=b"<html><head><title>Revised lesson</title></head><body>New</body></html>",
        )
        client = ingestion.IngestionClient(
            session=FakeSession(response),
            resolver=public_dns,
        )

        result = client.refresh_url("https://example.org/lesson", etag='"v1"')

        self.assertEqual(result["status"], "changed")
        self.assertEqual(result["etag"], '"v2"')
        self.assertEqual(result["result"]["name"], "Revised lesson")
        self.assertEqual(result["result"]["source_version"], '"v2"')

