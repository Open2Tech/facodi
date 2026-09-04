import hashlib
import importlib.util
import json
import sys
from pathlib import Path
from unittest import TestCase


SERVICES_DIR = (
    Path(__file__).parents[1] / "addons" / "facodi_content" / "services"
)
MODULE_PATH = SERVICES_DIR / "ingestion.py"


def load_ingestion():
    assert MODULE_PATH.exists(), "The ingestion adapter boundary is missing"
    services_path = str(SERVICES_DIR)
    if services_path not in sys.path:
        sys.path.insert(0, services_path)
    spec = importlib.util.spec_from_file_location("facodi_ingestion", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FakePage:
    def __init__(self, text):
        self.text = text

    def extract_text(self):
        return self.text


class FakePdfReader:
    def __init__(self, _stream):
        self.pages = [FakePage("First page"), FakePage("Second page")]


class FakeHttpResponse:
    def __init__(self, body, *, url, content_type="application/json", status_code=200):
        self.status_code = status_code
        self.headers = {"Content-Type": content_type}
        self.url = url
        self._body = body
        self.closed = False

    def iter_content(self, chunk_size):
        del chunk_size
        yield self._body

    def close(self):
        self.closed = True


class FakeHttpSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.urls = []

    def get(self, url, **_kwargs):
        self.urls.append(url)
        return self.responses.pop(0)


def public_dns(*_args, **_kwargs):
    return [(2, 1, 6, "", ("93.184.216.34", 443))]


class TestIngestionAdapters(TestCase):
    def test_normalises_youtube_oembed_without_network_access(self):
        ingestion = load_ingestion()
        payload = {
            "title": "Vectors in ten minutes",
            "author_name": "Open Lecturer",
            "author_url": "https://www.youtube.com/@openlecturer",
            "provider_name": "YouTube",
            "thumbnail_url": "https://i.ytimg.com/vi/abc123DEF45/hqdefault.jpg",
            "type": "video",
            "version": "1.0",
        }

        result = ingestion.normalise_youtube_oembed(
            "https://youtu.be/abc123DEF45?t=12",
            payload,
            language_code="en",
        )

        self.assertEqual(result["external_key"], "youtube:abc123DEF45")
        self.assertEqual(
            result["source_url"],
            "https://www.youtube.com/watch?v=abc123DEF45",
        )
        self.assertEqual(result["resource_type"], "video")
        self.assertEqual(result["name"], "Vectors in ten minutes")
        self.assertEqual(result["author_name"], "Open Lecturer")
        self.assertEqual(result["source_language_code"], "en")
        self.assertEqual(result["snapshot_payload"]["provider"], "youtube_oembed")
        self.assertEqual(result["snapshot_payload"]["facts"], payload)

    def test_normalises_html_opengraph_and_json_ld(self):
        ingestion = load_ingestion()
        html = b"""
            <html lang="pt-PT"><head>
              <title>Fallback title</title>
              <meta property="og:title" content="Open Algebra"/>
              <meta property="og:description" content="A public lesson"/>
              <meta property="og:type" content="article"/>
              <script type="application/ld+json">
                {"@type":"Article","author":{"name":"Ana Educadora"},
                 "datePublished":"2026-01-02","inLanguage":"pt-PT"}
              </script>
            </head><body><main>Vectors and matrices</main></body></html>
        """

        result = ingestion.normalise_html(
            "https://Example.org/lessons/algebra?utm_source=newsletter#intro",
            html,
            headers={"ETag": '"lesson-v1"', "Content-Type": "text/html; charset=utf-8"},
        )

        expected_url = "https://example.org/lessons/algebra"
        expected_key = "url:" + hashlib.sha256(expected_url.encode()).hexdigest()
        self.assertEqual(result["external_key"], expected_key)
        self.assertEqual(result["source_url"], expected_url)
        self.assertEqual(result["resource_type"], "article")
        self.assertEqual(result["name"], "Open Algebra")
        self.assertEqual(result["description"], "A public lesson")
        self.assertEqual(result["author_name"], "Ana Educadora")
        self.assertEqual(result["source_language_code"], "pt-PT")
        self.assertEqual(result["publication_date"], "2026-01-02")
        self.assertEqual(result["source_version"], '"lesson-v1"')

    def test_normalises_youtube_playlist_page_and_cursor(self):
        ingestion = load_ingestion()
        payload = {
            "nextPageToken": "NEXT",
            "items": [
                {
                    "snippet": {
                        "title": "Lesson one",
                        "description": "Intro",
                        "channelTitle": "Open Faculty",
                        "resourceId": {"videoId": "aaa111BBB22"},
                    }
                },
                {
                    "snippet": {
                        "title": "Lesson two",
                        "description": "Advanced",
                        "channelTitle": "Open Faculty",
                    },
                    "contentDetails": {"videoId": "ccc333DDD44"},
                },
            ],
        }

        items, cursor = ingestion.normalise_youtube_listing_page(payload)

        self.assertEqual(cursor, "NEXT")
        self.assertEqual(
            [item["external_key"] for item in items],
            ["youtube:aaa111BBB22", "youtube:ccc333DDD44"],
        )
        self.assertEqual(items[0]["institution_name"], "Open Faculty")
        self.assertEqual(items[1]["resource_type"], "video")

    def test_normalises_pdf_and_extracts_text_through_reader_boundary(self):
        ingestion = load_ingestion()
        payload = b"%PDF educational bytes"

        result = ingestion.normalise_pdf(
            "Linear Algebra Notes.pdf",
            payload,
            reader_factory=FakePdfReader,
        )

        digest = hashlib.sha256(payload).hexdigest()
        self.assertEqual(result["external_key"], f"sha256:{digest}")
        self.assertEqual(result["resource_type"], "document")
        self.assertEqual(result["name"], "Linear Algebra Notes")
        self.assertEqual(result["mime_type"], "application/pdf")
        self.assertEqual(result["content_text"], "First page\n\nSecond page")
        self.assertEqual(result["snapshot_payload"]["sha256"], digest)
        self.assertEqual(result["snapshot_payload"]["byte_size"], len(payload))

    def test_client_dispatches_youtube_to_oembed_through_safe_fetch(self):
        ingestion = load_ingestion()
        response_url = (
            "https://www.youtube.com/oembed?"
            "url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabc123DEF45&format=json"
        )
        response = FakeHttpResponse(
            b'{"title":"Vectors","author_name":"Open Lecturer","version":"1.0"}',
            url=response_url,
        )
        session = FakeHttpSession([response])
        client = ingestion.IngestionClient(session=session, resolver=public_dns)

        result = client.ingest_url("https://youtu.be/abc123DEF45")

        self.assertEqual(result["external_key"], "youtube:abc123DEF45")
        self.assertEqual(result["name"], "Vectors")
        self.assertEqual(session.urls, [response_url])
        self.assertTrue(response.closed)

    def test_client_dispatches_html_and_pdf_by_verified_content_type(self):
        ingestion = load_ingestion()
        html_url = "https://example.org/open-lesson"
        pdf_url = "https://example.org/notes.pdf"
        html_response = FakeHttpResponse(
            b"<html><head><title>Open lesson</title></head><body>Vectors</body></html>",
            url=html_url,
            content_type="text/html; charset=utf-8",
        )
        pdf_response = FakeHttpResponse(
            b"%PDF educational bytes",
            url=pdf_url,
            content_type="application/pdf",
        )
        session = FakeHttpSession([html_response, pdf_response])
        client = ingestion.IngestionClient(
            session=session,
            resolver=public_dns,
            pdf_reader_factory=FakePdfReader,
        )

        html_result = client.ingest_url(html_url)
        pdf_result = client.ingest_url(pdf_url)

        self.assertEqual(html_result["resource_type"], "article")
        self.assertEqual(html_result["name"], "Open lesson")
        self.assertEqual(pdf_result["resource_type"], "document")
        self.assertEqual(pdf_result["content_text"], "First page\n\nSecond page")
        self.assertEqual(session.urls, [html_url, pdf_url])

    def test_client_discovers_one_youtube_page_without_returning_api_key(self):
        ingestion = load_ingestion()
        api_url = (
            "https://www.googleapis.com/youtube/v3/playlistItems?"
            "part=snippet%2CcontentDetails&maxResults=50&playlistId=PL_OPEN&"
            "key=very-secret&pageToken=CURSOR"
        )
        payload = {
            "nextPageToken": "NEXT",
            "items": [
                {
                    "snippet": {
                        "title": "Lesson",
                        "resourceId": {"videoId": "aaa111BBB22"},
                    }
                }
            ],
        }
        response = FakeHttpResponse(
            json.dumps(payload).encode(),
            url=api_url,
        )
        session = FakeHttpSession([response])
        client = ingestion.IngestionClient(session=session, resolver=public_dns)

        items, cursor = client.discover_youtube_page(
            listing_type="playlist",
            listing_id="PL_OPEN",
            api_key="very-secret",
            page_token="CURSOR",
        )

        self.assertEqual(cursor, "NEXT")
        self.assertEqual(items[0]["external_key"], "youtube:aaa111BBB22")
        self.assertNotIn("very-secret", json.dumps({"items": items, "cursor": cursor}))
        self.assertEqual(session.urls, [api_url])
