"""YouTube URL parsing helpers for n8n workflow inputs."""

from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse

YOUTUBE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


class YouTubeUrlError(ValueError):
    """Raised when a YouTube URL cannot be normalized to a video id."""


def _valid_video_id(value: str | None) -> str | None:
    if value and YOUTUBE_ID_RE.match(value):
        return value
    return None


def extract_youtube_id(input_url: str) -> str:
    """Extract a canonical 11-character YouTube video id.

    Supports youtube.com/watch, youtu.be, embed, shorts, and live URLs.
    """

    raw = (input_url or "").strip()
    if not raw:
        raise YouTubeUrlError("youtube_url is required")

    if _valid_video_id(raw):
        return raw

    parsed = urlparse(raw if "://" in raw else f"https://{raw}")
    host = parsed.netloc.lower().removeprefix("www.").removeprefix("m.")

    if host in {"youtube.com", "music.youtube.com"}:
        query_id = _valid_video_id(parse_qs(parsed.query).get("v", [None])[0])
        if query_id:
            return query_id

        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) >= 2 and parts[0] in {"embed", "shorts", "live"}:
            path_id = _valid_video_id(parts[1])
            if path_id:
                return path_id

    if host == "youtu.be":
        parts = [part for part in parsed.path.split("/") if part]
        if parts:
            path_id = _valid_video_id(parts[0])
            if path_id:
                return path_id

    # Last-resort support for copied text containing a YouTube URL.
    for pattern in (
        r"(?:youtube\.com/watch\?[^ ]*v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/|youtube\.com/live/)([A-Za-z0-9_-]{11})",
        r"\bv=([A-Za-z0-9_-]{11})\b",
    ):
        match = re.search(pattern, raw)
        if match:
            return match.group(1)

    raise YouTubeUrlError("Invalid YouTube video URL")


def watch_url(youtube_id: str) -> str:
    """Return the canonical YouTube watch URL for a validated id."""

    video_id = extract_youtube_id(youtube_id)
    return f"https://www.youtube.com/watch?v={video_id}"


def thumbnail_url(youtube_id: str) -> str:
    """Return the standard YouTube thumbnail URL for a validated id."""

    video_id = extract_youtube_id(youtube_id)
    return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
