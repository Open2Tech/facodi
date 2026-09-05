"""Pure mappings from canonical FACODI resources to native eLearning values."""

from __future__ import annotations

from html import escape


def _text(value: object) -> str:
    return str(value or "").strip()


def _article_html(resource: dict) -> str:
    description = _text(resource.get("description"))
    author = _text(resource.get("author"))
    institution = _text(resource.get("institution"))
    source_url = _text(resource.get("source_url"))
    fragments = []
    if description:
        fragments.append(f"<p>{escape(description)}</p>")
    attribution = " · ".join(part for part in (author, institution) if part)
    if attribution:
        fragments.append(f"<p><strong>Attribution:</strong> {escape(attribution)}</p>")
    if source_url:
        safe_url = escape(source_url, quote=True)
        fragments.append(
            f'<p><a href="{safe_url}" target="_blank" rel="noopener noreferrer">'
            "Open the original educational resource</a></p>"
        )
    return "".join(fragments) or "<p>FACODI educational resource.</p>"


def slide_values_for_resource(resource: dict) -> dict:
    """Return draft-only values accepted by Odoo 19 ``slide.slide``.

    Publication state is intentionally absent: preparing a native record and
    making it public are separate human-controlled operations.
    """

    name = _text(resource.get("name"))
    if not name:
        raise ValueError("A resource title is required for native publication.")
    resource_type = _text(resource.get("resource_type")) or "external"
    source_url = _text(resource.get("source_url"))
    description = _text(resource.get("description"))
    if resource_type == "video" and source_url:
        return {
            "name": name,
            "slide_category": "video",
            "source_type": "external",
            "url": source_url,
            "description": description,
        }
    if resource_type == "quiz":
        return {
            "name": name,
            "slide_category": "quiz",
            "source_type": "local_file",
            "description": description,
        }
    return {
        "name": name,
        "slide_category": "article",
        "source_type": "local_file",
        "html_content": _article_html(resource),
        "description": description,
    }
