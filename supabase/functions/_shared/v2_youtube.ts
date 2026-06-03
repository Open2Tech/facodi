import { HttpError } from "./v2_http.ts";

export interface YouTubeMetadata {
  youtube_video_id: string;
  canonical_url: string;
  title: string | null;
  description: string | null;
  channel_id: string | null;
  channel_title: string | null;
  duration_seconds: number | null;
  published_at: string | null;
  thumbnails: Record<string, unknown>;
  tags: string[];
  language: string | null;
  metadata: Record<string, unknown>;
}

export function extractYouTubeVideoId(input: string): string {
  const value = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch (_error) {
    throw new HttpError(
      400,
      "invalid_youtube_url",
      "Input is not a valid YouTube URL or video id.",
    );
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return id;
    }
  }

  if (host.endsWith("youtube.com")) {
    const fromQuery = url.searchParams.get("v");
    if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) {
      return fromQuery;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));
    if (marker >= 0) {
      const id = parts[marker + 1];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }
  }

  throw new HttpError(400, "invalid_youtube_url", "Could not extract a YouTube video id.");
}

export function canonicalYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function parseIsoDuration(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const match = value.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) {
    return null;
  }
  const [, days, hours, minutes, seconds] = match;
  return (
    Number(days ?? 0) * 86400 +
    Number(hours ?? 0) * 3600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0)
  );
}

export async function fetchYouTubeMetadata(
  videoId: string,
  apiKey: string,
): Promise<YouTubeMetadata> {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    const message = await response.text();
    throw new HttpError(502, "youtube_api_error", "YouTube API request failed.", message);
  }

  const body = await response.json() as {
    items?: Array<{
      id: string;
      snippet?: Record<string, unknown>;
      contentDetails?: Record<string, unknown>;
      statistics?: Record<string, unknown>;
    }>;
  };
  const item = body.items?.[0];
  if (!item) {
    throw new HttpError(404, "youtube_video_not_found", "YouTube video was not found.");
  }

  const snippet = item.snippet ?? {};
  const contentDetails = item.contentDetails ?? {};
  return {
    youtube_video_id: item.id,
    canonical_url: canonicalYouTubeUrl(item.id),
    title: typeof snippet.title === "string" ? snippet.title : null,
    description: typeof snippet.description === "string" ? snippet.description : null,
    channel_id: typeof snippet.channelId === "string" ? snippet.channelId : null,
    channel_title: typeof snippet.channelTitle === "string" ? snippet.channelTitle : null,
    duration_seconds: parseIsoDuration(
      typeof contentDetails.duration === "string" ? contentDetails.duration : null,
    ),
    published_at: typeof snippet.publishedAt === "string" ? snippet.publishedAt : null,
    thumbnails: (snippet.thumbnails ?? {}) as Record<string, unknown>,
    tags: Array.isArray(snippet.tags) ? snippet.tags.filter((tag) => typeof tag === "string") : [],
    language: typeof snippet.defaultAudioLanguage === "string"
      ? snippet.defaultAudioLanguage
      : typeof snippet.defaultLanguage === "string"
      ? snippet.defaultLanguage
      : null,
    metadata: {
      youtube_statistics: item.statistics ?? {},
      youtube_content_details: contentDetails,
    },
  };
}
