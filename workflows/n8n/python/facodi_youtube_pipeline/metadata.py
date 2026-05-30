"""Metadata normalization helpers for YouTube video ingestion."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from .youtube_url import thumbnail_url


@dataclass(frozen=True)
class YouTubeMetadata:
    youtube_id: str
    title: str
    description: str | None
    channel_name: str
    thumbnail_url: str
    duration_seconds: int | None
    language: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def normalize_language(value: Any, default: str = "pt") -> str:
    text = str(value or "").strip().lower()
    if len(text) < 2:
        return default
    return text[:12]


def clean_text(value: Any, *, limit: int, fallback: str = "") -> str:
    text = " ".join(str(value or "").split())
    if not text:
        return fallback
    return text[:limit]


def parse_duration_seconds(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        parsed = int(float(value))
    except (TypeError, ValueError):
        return None
    return parsed if parsed >= 0 else None


def build_fallback_metadata(youtube_id: str, language: str = "pt") -> YouTubeMetadata:
    return YouTubeMetadata(
        youtube_id=youtube_id,
        title=youtube_id,
        description=None,
        channel_name="YouTube",
        thumbnail_url=thumbnail_url(youtube_id),
        duration_seconds=None,
        language=normalize_language(language),
    )


def normalize_metadata(
    youtube_id: str,
    payload: dict[str, Any] | None,
    *,
    language: str = "pt",
) -> YouTubeMetadata:
    """Normalize oEmbed/API metadata into the Supabase video shape."""

    payload = payload or {}
    fallback = build_fallback_metadata(youtube_id, language)

    title = clean_text(
        payload.get("title") or payload.get("name"),
        limit=300,
        fallback=fallback.title,
    )
    channel_name = clean_text(
        payload.get("author_name") or payload.get("channelName") or payload.get("channel_name"),
        limit=200,
        fallback=fallback.channel_name,
    )
    description = clean_text(
        payload.get("description"),
        limit=5000,
        fallback="",
    ) or None
    thumb = clean_text(
        payload.get("thumbnail_url") or payload.get("thumbnailUrl"),
        limit=1000,
        fallback=fallback.thumbnail_url,
    )

    return YouTubeMetadata(
        youtube_id=youtube_id,
        title=title,
        description=description,
        channel_name=channel_name,
        thumbnail_url=thumb,
        duration_seconds=parse_duration_seconds(
            payload.get("duration_seconds") or payload.get("durationSeconds")
        ),
        language=normalize_language(payload.get("language") or language),
    )
