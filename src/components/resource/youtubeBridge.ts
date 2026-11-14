/**
 * Minimal bridge to the YouTube embed's postMessage protocol (the one the IFrame API uses),
 * so the page can read the playback position and seek without loading YouTube's script.
 */
export const YOUTUBE_EMBED_ORIGIN = 'https://www.youtube-nocookie.com';
const ORIGINS = new Set([YOUTUBE_EMBED_ORIGIN, 'https://www.youtube.com']);

export const isYouTubeOrigin = (origin: string) => ORIGINS.has(origin);

export const listeningMessage = () => JSON.stringify({ event: 'listening', id: 1, channel: 'widget' });

export const commandMessage = (func: 'seekTo' | 'playVideo', args: unknown[] = []) =>
  JSON.stringify({ event: 'command', func, args, id: 1, channel: 'widget' });

/** Playback position in seconds from an `infoDelivery` message, or null for anything else. */
export function readCurrentTime(data: unknown): number | null {
  if (typeof data !== 'string') return null;
  try {
    const message: unknown = JSON.parse(data);
    if (!message || typeof message !== 'object' || !('info' in message)) return null;
    const info = (message as { info: unknown }).info;
    if (!info || typeof info !== 'object' || !('currentTime' in info)) return null;
    const time = (info as { currentTime: unknown }).currentTime;
    return typeof time === 'number' && Number.isFinite(time) && time >= 0 ? time : null;
  } catch {
    return null;
  }
}

export function embedUrl(videoId: string, origin: string, start: number | null) {
  const params = new URLSearchParams({ autoplay: '1', rel: '0', enablejsapi: '1', origin });
  if (start) params.set('start', String(start));
  return `${YOUTUBE_EMBED_ORIGIN}/embed/${videoId}?${params}`;
}
