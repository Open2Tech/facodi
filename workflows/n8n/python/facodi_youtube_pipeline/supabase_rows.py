"""Supabase row builders for the FACODI n8n YouTube workflow."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from .analysis import VideoAnalysis
from .metadata import YouTubeMetadata
from .payloads import WorkflowRequest
from .playlist_assignment import PlaylistAssignment
from .youtube_url import watch_url


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def build_video_upsert_row(
    request: WorkflowRequest,
    metadata: YouTubeMetadata,
) -> dict[str, Any]:
    row: dict[str, Any] = {
        "youtube_id": request.youtube_id,
        "title": metadata.title,
        "description": metadata.description,
        "channel_name": metadata.channel_name,
        "duration_seconds": metadata.duration_seconds,
        "thumbnail_url": metadata.thumbnail_url,
        "language": metadata.language,
        "view_count": 0,
        "is_featured": False,
    }
    if request.user_id:
        row["submitted_by"] = request.user_id
    return row


def build_video_submission_row(
    request: WorkflowRequest,
    *,
    video_id: str | None,
    status: str = "pending",
) -> dict[str, Any]:
    if not request.user_id:
        raise ValueError("user_id is required to create video_submissions rows")
    return {
        "user_id": request.user_id,
        "video_id": video_id,
        "youtube_id": request.youtube_id,
        "youtube_url": watch_url(request.youtube_id),
        "status": status,
        "metadata": {
            "source": request.source,
            "imported_at": now_iso(),
            "force_reprocess": request.force_reprocess,
        },
        "error_message": None,
        "recoverable": False,
    }


def build_ai_enrichment_row(video_id: str, analysis: VideoAnalysis) -> dict[str, Any]:
    return {
        "video_id": video_id,
        "optimized_title": analysis.optimized_title,
        "summary_description": analysis.summary_description,
        "semantic_tags": analysis.semantic_tags,
        "suggested_category_id": analysis.suggested_category_id,
        "language": analysis.language,
        "cultural_relevance": analysis.cultural_relevance,
        "short_summary": analysis.short_summary,
    }


def build_playlist_video_row(
    *,
    playlist_id: str,
    video_id: str,
    added_by: str | None,
    position: int = 0,
    notes: str | None = None,
) -> dict[str, Any]:
    row: dict[str, Any] = {
        "playlist_id": playlist_id,
        "video_id": video_id,
        "position": position,
        "notes": notes,
    }
    if added_by:
        row["added_by"] = added_by
    return row


def build_submission_success_patch(
    *,
    enrichment_id: str | None,
    analysis: VideoAnalysis,
    assignment: PlaylistAssignment,
) -> dict[str, Any]:
    return {
        "status": "success",
        "error_message": None,
        "recoverable": False,
        "completed_at": now_iso(),
        "metadata": {
            "enrichmentId": enrichment_id,
            "detectedLanguage": analysis.language,
            "analysis": {
                "provider": "openai",
                "status": "completed",
                "summary": analysis.summary_description or analysis.short_summary,
                "language": analysis.language,
                "confidence": analysis.classification_confidence,
                "semanticTags": analysis.semantic_tags,
                "optimizedTitle": analysis.optimized_title,
            },
            "assignment": {
                "fallbackUsed": assignment.reliability == "low",
                "reliability": assignment.reliability,
                "reason": assignment.reason,
                "assignedPlaylistId": assignment.assigned_playlist_id,
                "algorithmVersion": assignment.algorithm_version,
                "score": assignment.score,
                "providerConfidence": assignment.provider_confidence,
                "decisionSource": assignment.decision_source,
                "signals": assignment.signals,
                "topCandidates": assignment.top_candidates,
                "rejectedPlaylistId": assignment.rejected_playlist_id,
            },
        },
    }


def build_submission_error_patch(
    *,
    message: str,
    stage: str,
    recoverable: bool = True,
) -> dict[str, Any]:
    return {
        "status": "recoverable_error" if recoverable else "failed",
        "error_message": message[:1000],
        "recoverable": recoverable,
        "completed_at": now_iso(),
        "metadata": {
            "error": {
                "message": message[:1000],
                "stage": stage,
                "recoverable": recoverable,
                "createdAt": now_iso(),
            }
        },
    }
