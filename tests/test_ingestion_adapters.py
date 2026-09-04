import hashlib
import importlib.util
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

