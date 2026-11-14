const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;
const PLAYLIST_ID = /^[a-zA-Z0-9_-]{10,120}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com',
  'music.youtube.com', 'youtu.be',
]);

export function isYoutubeVideoId(value: string): boolean {
  return YOUTUBE_ID.test(value);
}

/** Exact hostname checks prevent lookalike domains and unsafe URL schemes. */
export function isYoutubePlaylistUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' &&
      YOUTUBE_HOSTS.has(url.hostname.toLowerCase()) &&
      PLAYLIST_ID.test(url.searchParams.get('list') ?? '');
  } catch {
    return false;
  }
}

/** Optional fallback when YouTube page extraction is unavailable.
 * These IDs are unverified assertions until a FACODI editor approves them. */
export function parsePlaylistVideoIds(raw: string): string[] {
  const ids = raw.trim().split(/[\s,;]+/).filter(Boolean);
  if (ids.length > 100 || ids.some(id => !YOUTUBE_ID.test(id))) {
    throw new Error('invalid_youtube_video_ids');
  }
  return [...new Set(ids)];
}
