import type { Json } from '@/integrations/supabase/types';

const YOUTUBE_ID = /^[\w-]{11}$/;

export interface VideoInfo {
  youtubeId: string | null;
  thumbnail: string | null;
  durationSeconds: number | null;
  channel: string | null;
  reviewScope: string | null;
  fullReviewed: boolean;
  licenseVerified: boolean;
}

function record(value: Json | null | undefined): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function text(value: Json | undefined) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Extracts a YouTube id from watch, short, embed or youtu.be links; anything else is rejected. */
export function youtubeIdFromUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^(www|m)\./, '');
    const id = host === 'youtu.be'
      ? parsed.pathname.slice(1)
      : host === 'youtube.com' || host === 'youtube-nocookie.com'
        ? parsed.searchParams.get('v') ?? parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]
        : null;
    return id && YOUTUBE_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Reads the video facts the curation pipeline stores in learning_objects.metadata. */
export function videoInfo(metadata: Json | null | undefined, sourceUrl?: string | null): VideoInfo {
  const meta = record(metadata);
  const stored = text(meta.youtube_video_id);
  const youtubeId = stored && YOUTUBE_ID.test(stored) ? stored : youtubeIdFromUrl(sourceUrl);
  const duration = meta.duration_seconds;
  return {
    youtubeId,
    // Built from the validated id instead of trusting a stored URL.
    thumbnail: youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null,
    durationSeconds: typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null,
    // Source publishers use different metadata keys across legacy imports.
    // Preserve the creator name when channel_name has not yet been backfilled.
    channel: text(meta.channel_name) ?? text(meta.publisher_channel) ?? text(meta.source_creator) ?? text(meta.publisher),
    reviewScope: text(meta.review_scope),
    fullReviewed: meta.full_video_reviewed === true,
    licenseVerified: meta.content_license_verified === true,
  };
}

/** 867 → "14:27", 3723 → "1:02:03". */
export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

/** ISO 8601 duration for the `dateTime` attribute of <time>. */
export function isoDuration(seconds: number) {
  return `PT${Math.floor(seconds / 3600)}H${Math.floor((seconds % 3600) / 60)}M${seconds % 60}S`;
}
