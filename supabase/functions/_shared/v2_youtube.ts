import { HttpError } from "./v2_http.ts";
import { optionalEnv } from "./v2_supabase.ts";

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

export interface YouTubeChannel {
  channelId: string;
  id: string;
  title: string;
  name: string;
  username: string;
  description: string;
  customUrl: string | null;
  thumbnailUrl: string;
  uploadsPlaylistId: string | null;
}

export interface YouTubeChannelVideo {
  id: string;
  videoId: string;
  title: string;
  description: string;
  durationSeconds: number;
  duration: number;
  viewCount: number;
  publishedAt: string;
  thumbnailUrl: string;
  thumbnail: string;
  channelTitle: string;
  channelName: string;
  tags: string[];
}

interface YouTubeApiOptions {
  fetcher?: typeof fetch;
}

const YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

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

export function hasYouTubeOAuthConfig(): boolean {
  return Boolean(
    optionalEnv("YOUTUBE_OAUTH_CLIENT_ID") &&
      optionalEnv("YOUTUBE_OAUTH_CLIENT_SECRET") &&
      optionalEnv("YOUTUBE_OAUTH_REFRESH_TOKEN"),
  );
}

async function refreshYouTubeAccessToken(
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const clientId = optionalEnv("YOUTUBE_OAUTH_CLIENT_ID");
  const clientSecret = optionalEnv("YOUTUBE_OAUTH_CLIENT_SECRET");
  const refreshToken = optionalEnv("YOUTUBE_OAUTH_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refreshToken) {
    throw new HttpError(
      424,
      "missing_youtube_oauth",
      "YouTube OAuth is not configured. Set YOUTUBE_OAUTH_CLIENT_ID, YOUTUBE_OAUTH_CLIENT_SECRET, and YOUTUBE_OAUTH_REFRESH_TOKEN.",
    );
  }

  const response = await fetcher(YOUTUBE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || typeof body.access_token !== "string") {
    throw new HttpError(
      502,
      "youtube_oauth_refresh_failed",
      "Could not refresh YouTube OAuth access token.",
      body,
    );
  }
  return body.access_token;
}

export async function youtubeApiGet<T>(
  path: string,
  params: Record<string, string | number | boolean | null | undefined>,
  options: YouTubeApiOptions = {},
): Promise<T> {
  const fetcher = options.fetcher ?? fetch;
  const accessToken = await refreshYouTubeAccessToken(fetcher);
  const url = new URL(`${YOUTUBE_API_BASE}/${path.replace(/^\/+/, "")}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetcher(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new HttpError(
      response.status || 502,
      "youtube_api_error",
      "YouTube API request failed.",
      body,
    );
  }
  return body as T;
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
  options: YouTubeApiOptions = {},
): Promise<YouTubeMetadata> {
  const body = await youtubeApiGet<{
    items?: Array<{
      id: string;
      snippet?: Record<string, unknown>;
      contentDetails?: Record<string, unknown>;
      statistics?: Record<string, unknown>;
    }>;
  }>("videos", {
    part: "snippet,contentDetails,statistics",
    id: videoId,
  }, options);
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
      youtube_auth_mode: "oauth",
    },
  };
}

export function normalizeYouTubeChannelInput(input: string): {
  id?: string;
  forHandle?: string;
  forUsername?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new HttpError(400, "channel_input_required", "Channel input is required.");
  }
  if (trimmed.length > 200) {
    throw new HttpError(400, "channel_input_too_long", "Channel input exceeds max length.");
  }
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return { id: trimmed };
  }

  try {
    const url = new URL(
      trimmed.startsWith("http")
        ? trimmed
        : `https://www.youtube.com/${trimmed.replace(/^\/+/, "")}`,
    );
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "channel" && /^UC[a-zA-Z0-9_-]{22}$/.test(parts[1] ?? "")) {
      return { id: parts[1] };
    }
    if (parts[0]?.startsWith("@")) {
      return { forHandle: parts[0] };
    }
    if (parts[0] === "user" && parts[1]) {
      return { forUsername: parts[1] };
    }
  } catch {
    // Fall through to handle parsing.
  }

  if (trimmed.startsWith("@")) {
    return { forHandle: trimmed };
  }
  if (/^[a-zA-Z0-9_.-]{3,64}$/.test(trimmed)) {
    return { forHandle: `@${trimmed}` };
  }

  throw new HttpError(
    400,
    "unsupported_channel_input",
    "Provide a YouTube channel id, @handle, /@handle URL, or /user URL.",
  );
}

export async function fetchYouTubeChannel(
  input: string,
  options: YouTubeApiOptions = {},
): Promise<YouTubeChannel> {
  const lookup = normalizeYouTubeChannelInput(input);
  const body = await youtubeApiGet<{
    items?: Array<{
      id: string;
      snippet?: Record<string, unknown>;
      contentDetails?: Record<string, unknown>;
    }>;
  }>("channels", {
    part: "snippet,contentDetails",
    id: lookup.id,
    forHandle: lookup.forHandle,
    forUsername: lookup.forUsername,
  }, options);
  const item = body.items?.[0];
  if (!item) {
    throw new HttpError(404, "youtube_channel_not_found", "YouTube channel was not found.");
  }
  const snippet = item.snippet ?? {};
  const thumbnails = (snippet.thumbnails ?? {}) as Record<string, { url?: string }>;
  const contentDetails = item.contentDetails as
    | { relatedPlaylists?: { uploads?: string } }
    | undefined;
  const title = typeof snippet.title === "string" ? snippet.title : item.id;
  const customUrl = typeof snippet.customUrl === "string" ? snippet.customUrl : null;
  return {
    channelId: item.id,
    id: item.id,
    title,
    name: title,
    username: customUrl ?? lookup.forHandle ?? item.id,
    description: typeof snippet.description === "string" ? snippet.description : "",
    customUrl,
    thumbnailUrl: thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ?? "",
    uploadsPlaylistId: contentDetails?.relatedPlaylists?.uploads ?? null,
  };
}

export async function listYouTubeChannelVideos(
  input: string,
  maxVideos = 10,
  options: YouTubeApiOptions = {},
): Promise<YouTubeChannelVideo[]> {
  const channel = await fetchYouTubeChannel(input, options);
  if (!channel.uploadsPlaylistId) {
    throw new HttpError(
      404,
      "youtube_uploads_playlist_not_found",
      "Could not find the channel uploads playlist.",
    );
  }
  const limit = Math.max(1, Math.min(Math.trunc(maxVideos), 20));
  const playlist = await youtubeApiGet<{
    items?: Array<{
      snippet?: {
        resourceId?: { videoId?: string };
        title?: string;
        description?: string;
        publishedAt?: string;
        thumbnails?: Record<string, { url?: string }>;
        channelTitle?: string;
      };
    }>;
  }>("playlistItems", {
    part: "snippet,contentDetails",
    playlistId: channel.uploadsPlaylistId,
    maxResults: limit,
  }, options);
  const videoIds = (playlist.items ?? [])
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter((id): id is string => typeof id === "string" && /^[a-zA-Z0-9_-]{11}$/.test(id));
  if (videoIds.length === 0) {
    throw new HttpError(
      404,
      "youtube_channel_videos_not_found",
      "No public videos found for channel.",
    );
  }
  const videos = await youtubeApiGet<{
    items?: Array<{
      id: string;
      snippet?: Record<string, unknown>;
      contentDetails?: Record<string, unknown>;
      statistics?: Record<string, unknown>;
    }>;
  }>("videos", {
    part: "snippet,contentDetails,statistics",
    id: videoIds.join(","),
    maxResults: limit,
  }, options);

  return (videos.items ?? []).map((item) => {
    const snippet = item.snippet ?? {};
    const details = item.contentDetails ?? {};
    const stats = item.statistics ?? {};
    const thumbnails = (snippet.thumbnails ?? {}) as Record<string, { url?: string }>;
    const thumbnail = thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ??
      "";
    const title = typeof snippet.title === "string" ? snippet.title : item.id;
    const channelTitle = typeof snippet.channelTitle === "string"
      ? snippet.channelTitle
      : channel.title;
    const durationSeconds = parseIsoDuration(
      typeof details.duration === "string" ? details.duration : null,
    ) ?? 0;
    return {
      id: item.id,
      videoId: item.id,
      title,
      description: typeof snippet.description === "string" ? snippet.description : "",
      durationSeconds,
      duration: durationSeconds,
      viewCount: typeof stats.viewCount === "string" ? Number(stats.viewCount) || 0 : 0,
      publishedAt: typeof snippet.publishedAt === "string"
        ? snippet.publishedAt
        : new Date().toISOString(),
      thumbnailUrl: thumbnail,
      thumbnail,
      channelTitle,
      channelName: channelTitle,
      tags: Array.isArray(snippet.tags)
        ? snippet.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
    };
  });
}
