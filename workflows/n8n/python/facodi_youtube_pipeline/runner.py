"""JSON runner for n8n Execute Command / Code node integration.

Usage:
    python -m facodi_youtube_pipeline.runner < input.json
"""

from __future__ import annotations

import json
import sys
from typing import Any

from .analysis import build_fallback_analysis, parse_ai_analysis
from .metadata import normalize_metadata
from .payloads import WorkflowFailure, WorkflowRequest, WorkflowSuccess
from .playlist_assignment import assign_playlist
from .supabase_rows import (
    build_ai_enrichment_row,
    build_playlist_video_row,
    build_submission_error_patch,
    build_submission_success_patch,
    build_video_submission_row,
    build_video_upsert_row,
)


def run(payload: dict[str, Any]) -> dict[str, Any]:
    request = WorkflowRequest.from_dict(payload)
    metadata = normalize_metadata(
        request.youtube_id,
        payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        language=request.language,
    )

    ai_response = payload.get("ai_response") or payload.get("aiResponse")
    if isinstance(ai_response, str) and ai_response.strip():
        analysis = parse_ai_analysis(ai_response, fallback_language=metadata.language)
    else:
        analysis = build_fallback_analysis(
            title=metadata.title,
            description=metadata.description,
            language=metadata.language,
        )

    playlists_payload = payload.get("playlists") if isinstance(payload.get("playlists"), list) else []
    assignment = assign_playlist(
        playlists_payload,
        analysis,
        title=metadata.title,
        description=metadata.description,
    )

    video_id = payload.get("video_id") or payload.get("videoId")
    submission_id = payload.get("submission_id") or payload.get("submissionId")
    enrichment_id = payload.get("enrichment_id") or payload.get("enrichmentId")

    rows: dict[str, Any] = {
        "video_upsert": build_video_upsert_row(request, metadata),
        "ai_enrichment": build_ai_enrichment_row(str(video_id or "{{video_id}}"), analysis),
        "submission_success_patch": build_submission_success_patch(
            enrichment_id=str(enrichment_id) if enrichment_id else None,
            analysis=analysis,
            assignment=assignment,
        ),
    }

    if request.user_id:
        rows["video_submission"] = build_video_submission_row(
            request,
            video_id=str(video_id) if video_id else None,
        )

    if assignment.assigned_playlist_id and video_id:
        rows["playlist_video"] = build_playlist_video_row(
            playlist_id=assignment.assigned_playlist_id,
            video_id=str(video_id),
            added_by=request.user_id,
        )

    response = WorkflowSuccess(
        status="success",
        youtube_id=request.youtube_id,
        video_id=str(video_id) if video_id else None,
        submission_id=str(submission_id) if submission_id else None,
        enrichment_id=str(enrichment_id) if enrichment_id else None,
        assigned_playlist_id=assignment.assigned_playlist_id,
        confidence=analysis.classification_confidence,
        tags=analysis.semantic_tags,
        summary=analysis.short_summary or analysis.summary_description,
    )

    return {
        "request": request.to_dict(),
        "metadata": metadata.to_dict(),
        "analysis": analysis.to_dict(),
        "assignment": assignment.to_dict(),
        "rows": rows,
        "response": response.to_dict(),
    }


def main() -> int:
    try:
        payload = json.load(sys.stdin)
        print(json.dumps(run(payload), ensure_ascii=False, separators=(",", ":")))
        return 0
    except Exception as exc:  # n8n needs structured failure output.
        failure = WorkflowFailure(
            status="recoverable_error",
            stage="python_helper",
            message=str(exc),
        )
        print(
            json.dumps(
                {
                    "error": failure.to_dict(),
                    "submission_error_patch": build_submission_error_patch(
                        message=str(exc),
                        stage="python_helper",
                    ),
                },
                ensure_ascii=False,
                separators=(",", ":"),
            )
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
