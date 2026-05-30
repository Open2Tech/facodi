"""Input/output contracts for the FACODI n8n YouTube workflow."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from .youtube_url import extract_youtube_id, watch_url


@dataclass(frozen=True)
class WorkflowRequest:
    youtube_url: str
    youtube_id: str
    language: str = "pt"
    user_id: str | None = None
    source: str = "n8n_youtube_url_import"
    force_reprocess: bool = False

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "WorkflowRequest":
        youtube_url = str(payload.get("youtube_url") or payload.get("youtubeUrl") or "").strip()
        youtube_id = extract_youtube_id(youtube_url)
        language = str(payload.get("language") or "pt").strip().lower()[:12] or "pt"
        user_id = payload.get("user_id") or payload.get("userId")
        return cls(
            youtube_url=watch_url(youtube_id),
            youtube_id=youtube_id,
            language=language,
            user_id=str(user_id) if user_id else None,
            source=str(payload.get("source") or "n8n_youtube_url_import"),
            force_reprocess=bool(payload.get("force_reprocess") or payload.get("forceReprocess")),
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class WorkflowSuccess:
    status: str
    youtube_id: str
    video_id: str | None
    submission_id: str | None
    enrichment_id: str | None
    assigned_playlist_id: str | None
    confidence: float
    tags: list[str]
    summary: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class WorkflowFailure:
    status: str
    stage: str
    message: str
    submission_id: str | None = None
    recoverable: bool = True

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
