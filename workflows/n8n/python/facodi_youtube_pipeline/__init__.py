"""Pure helpers for the FACODI n8n YouTube curation workflow."""

from .analysis import VideoAnalysis, build_fallback_analysis, parse_ai_analysis
from .metadata import YouTubeMetadata, build_fallback_metadata, normalize_metadata
from .playlist_assignment import assign_playlist
from .youtube_url import YouTubeUrlError, extract_youtube_id

__all__ = [
    "VideoAnalysis",
    "YouTubeMetadata",
    "YouTubeUrlError",
    "assign_playlist",
    "build_fallback_analysis",
    "build_fallback_metadata",
    "extract_youtube_id",
    "normalize_metadata",
    "parse_ai_analysis",
]
