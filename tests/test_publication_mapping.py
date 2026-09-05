import importlib.util
from pathlib import Path
from unittest import TestCase


MODULE_PATH = (
    Path(__file__).parents[1]
    / "addons"
    / "facodi_content"
    / "services"
    / "publication.py"
)


def load_publication():
    assert MODULE_PATH.exists(), "The native publication mapping service is missing"
    spec = importlib.util.spec_from_file_location("facodi_publication", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TestNativePublicationMapping(TestCase):
    def test_maps_video_to_external_native_video(self):
        publication = load_publication()

        values = publication.slide_values_for_resource(
            {
                "name": "Vector spaces",
                "resource_type": "video",
                "source_url": "https://www.youtube.com/watch?v=abcdefghijk",
                "description": "A concise introduction.",
                "author": "Open Professor",
                "institution": "Open University",
            }
        )

        self.assertEqual(values["slide_category"], "video")
        self.assertEqual(values["source_type"], "external")
        self.assertEqual(
            values["url"],
            "https://www.youtube.com/watch?v=abcdefghijk",
        )
        self.assertNotIn("is_published", values)

    def test_maps_metadata_resource_to_attributed_native_article(self):
        publication = load_publication()

        values = publication.slide_values_for_resource(
            {
                "name": "Open textbook",
                "resource_type": "book",
                "source_url": "https://oer.example/books/algebra",
                "description": "A public textbook.",
                "author": "Ada Author",
                "institution": "SEA-EU Press",
            }
        )

        self.assertEqual(values["slide_category"], "article")
        self.assertEqual(values["source_type"], "local_file")
        self.assertIn("Ada Author", values["html_content"])
        self.assertIn("SEA-EU Press", values["html_content"])
        self.assertIn("https://oer.example/books/algebra", values["html_content"])
        self.assertNotIn("is_published", values)

