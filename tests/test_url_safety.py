import importlib.util
from pathlib import Path
from unittest import TestCase

MODULE_PATH = (
    Path(__file__).parents[1]
    / "addons"
    / "facodi_content"
    / "services"
    / "url_safety.py"
)


def load_url_safety():
    assert MODULE_PATH.exists(), "The outbound URL safety boundary is missing"
    spec = importlib.util.spec_from_file_location("facodi_url_safety", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def public_dns(*_args, **_kwargs):
    return [(2, 1, 6, "", ("93.184.216.34", 443))]


def private_dns(*_args, **_kwargs):
    return [(2, 1, 6, "", ("10.20.30.40", 443))]


class FakeResponse:
    def __init__(self, *, status_code=200, headers=None, chunks=None, url=""):
        self.status_code = status_code
        self.headers = headers or {}
        self._chunks = chunks or []
        self.url = url
        self.closed = False

    def iter_content(self, chunk_size):
        del chunk_size
        yield from self._chunks

    def close(self):
        self.closed = True


class FakeSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append((url, kwargs))
        return self.responses.pop(0)


class TestOutboundUrlSafety(TestCase):
    def test_accepts_https_url_resolving_only_to_public_addresses(self):
        safety = load_url_safety()

        result = safety.validate_outbound_url(
            "https://Example.COM/lesson?id=7#chapter",
            resolver=public_dns,
        )

        self.assertEqual(result, "https://example.com/lesson?id=7")

    def test_rejects_unsafe_scheme_credentials_and_loopback(self):
        safety = load_url_safety()
        unsafe_urls = [
            "http://example.com/lesson",
            "file:///etc/passwd",
            "https://user:secret@example.com/lesson",
            "https://127.0.0.1/lesson",
            "https://[::1]/lesson",
            "https://localhost/lesson",
        ]

        for url in unsafe_urls:
            with self.subTest(url=url), self.assertRaises(safety.UnsafeUrl):
                safety.validate_outbound_url(url, resolver=public_dns)

    def test_rejects_hostname_resolving_to_private_address(self):
        safety = load_url_safety()

        with self.assertRaises(safety.UnsafeUrl):
            safety.validate_outbound_url(
                "https://metadata.example.test/latest",
                resolver=private_dns,
            )

    def test_redaction_removes_credentials_query_and_fragment(self):
        safety = load_url_safety()

        redacted = safety.redact_url(
            "https://api-user:api-secret@example.com/path?token=secret#result"
        )

        self.assertEqual(redacted, "https://example.com/path")

    def test_fetch_revalidates_redirect_targets_before_following(self):
        safety = load_url_safety()
        response = FakeResponse(
            status_code=302,
            headers={"Location": "https://127.0.0.1/admin"},
            url="https://example.com/start",
        )
        session = FakeSession([response])

        with self.assertRaises(safety.UnsafeUrl):
            safety.fetch_url(
                "https://example.com/start",
                session=session,
                resolver=public_dns,
            )

        self.assertEqual(len(session.calls), 1)
        self.assertTrue(response.closed)

    def test_fetch_caps_streamed_response_body(self):
        safety = load_url_safety()
        response = FakeResponse(
            chunks=[b"1234", b"5678"],
            url="https://example.com/data",
        )
        session = FakeSession([response])

        with self.assertRaises(safety.ResponseTooLarge):
            safety.fetch_url(
                "https://example.com/data",
                session=session,
                resolver=public_dns,
                max_bytes=7,
            )

        self.assertTrue(response.closed)

    def test_fetch_returns_public_redirect_body_with_bounded_transport(self):
        safety = load_url_safety()
        redirect = FakeResponse(
            status_code=301,
            headers={"Location": "/final"},
            url="https://example.com/start",
        )
        final = FakeResponse(
            status_code=200,
            headers={"Content-Type": "application/json"},
            chunks=[b'{"ok": true}'],
            url="https://example.com/final",
        )
        session = FakeSession([redirect, final])

        fetched = safety.fetch_url(
            "https://example.com/start",
            session=session,
            resolver=public_dns,
            timeout=9,
        )

        self.assertEqual(fetched.url, "https://example.com/final")
        self.assertEqual(fetched.status_code, 200)
        self.assertEqual(fetched.body, b'{"ok": true}')
        self.assertEqual(fetched.content_type, "application/json")
        self.assertEqual(
            session.calls,
            [
                (
                    "https://example.com/start",
                    {"allow_redirects": False, "stream": True, "timeout": 9},
                ),
                (
                    "https://example.com/final",
                    {"allow_redirects": False, "stream": True, "timeout": 9},
                ),
            ],
        )
        self.assertTrue(redirect.closed)
        self.assertTrue(final.closed)
