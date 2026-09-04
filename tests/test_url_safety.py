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
