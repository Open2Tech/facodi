import { requireEditorAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, HttpError, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient } from "../_shared/v2_supabase.ts";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

interface Payload {
  channel_input?: string;
  channelInput?: string;
  brief?: { maxVideos?: number };
}

function xmlTag(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim();
}

function xmlDecode(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function extractChannelIdFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://www.youtube.com/${trimmed.replace(/^\/+/, "")}`);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "channel" && /^UC[a-zA-Z0-9_-]{22}$/.test(parts[1] ?? "")) {
      return parts[1];
    }
  } catch {
    return null;
  }

  return null;
}

async function resolveChannelId(input: string): Promise<string> {
  const direct = extractChannelIdFromInput(input);
  if (direct) return direct;

  const normalizedUrl = input.trim().startsWith("http")
    ? input.trim()
    : `https://www.youtube.com/${input.trim().replace(/^\/+/, "")}`;
  const response = await fetch(normalizedUrl, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
  });
  if (!response.ok) {
    throw new HttpError(502, "youtube_channel_fetch_failed", "Could not fetch channel page.");
  }

  const html = await response.text();
  const channelId = html.match(/"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/)?.[1];
  if (!channelId) {
    throw new HttpError(404, "youtube_channel_not_found", "Could not resolve YouTube channel id.");
  }
  return channelId;
}

function parseRssEntries(xml: string) {
  const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi));
  return entries
    .map((match, index) => {
      const entry = match[1] ?? "";
      const id = xmlTag(entry, "yt:videoId") ?? "";
      if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;
      const title = xmlDecode(xmlTag(entry, "title") ?? `Video ${index + 1}`);
      const description = xmlDecode(xmlTag(entry, "media:description") ?? "");
      const channelTitle = xmlDecode(xmlTag(entry, "name") ?? "YouTube");
      return {
        id,
        videoId: id,
        title,
        description,
        publishedAt: xmlTag(entry, "published") ?? new Date().toISOString(),
        durationSeconds: 0,
        duration: 0,
        viewCount: 0,
        channelTitle,
        channelName: channelTitle,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        tags: ["facodi", "youtube"],
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    await requireEditorAuth(req, createAdminClient());
    const payload = await readJson<Payload>(req);
    const channelInput = String(payload.channel_input ?? payload.channelInput ?? "").trim();
    if (!channelInput) {
      throw new HttpError(400, "channel_input_required", "Channel input is required.");
    }
    if (channelInput.length > 200) {
      throw new HttpError(400, "channel_input_too_long", "Channel input exceeds max length.");
    }

    const maxVideos = Math.max(1, Math.min(Number(payload.brief?.maxVideos ?? 10), 30));
    const channelId = await resolveChannelId(channelInput);
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const rssResponse = await fetch(rssUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/atom+xml,text/xml" },
    });
    if (!rssResponse.ok) {
      throw new HttpError(502, "youtube_channel_rss_failed", "Could not fetch channel videos.");
    }

    const videos = parseRssEntries(await rssResponse.text()).slice(0, maxVideos);
    if (videos.length === 0) {
      throw new HttpError(404, "youtube_channel_videos_not_found", "No public videos found for channel.");
    }

    return json({ videos });
  })
);
