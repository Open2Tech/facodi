import { requireEditorAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, HttpError, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient } from "../_shared/v2_supabase.ts";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

interface Payload {
  channel_input?: string;
  channelInput?: string;
}

function normalizeChannelInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new HttpError(400, "channel_input_required", "Channel input is required.");
  if (trimmed.length > 200) {
    throw new HttpError(400, "channel_input_too_long", "Channel input exceeds max length.");
  }
  return trimmed;
}

async function resolveChannel(input: string) {
  const directId = input.match(/^UC[a-zA-Z0-9_-]{22}$/)?.[0] ?? null;
  const normalizedUrl = input.startsWith("http")
    ? input
    : directId
    ? `https://www.youtube.com/channel/${directId}`
    : `https://www.youtube.com/${input.replace(/^\/+/, "")}`;

  const response = await fetch(normalizedUrl, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
  });
  if (!response.ok) {
    throw new HttpError(502, "youtube_channel_fetch_failed", "Could not fetch channel page.");
  }

  const html = await response.text();
  const channelId = html.match(/"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/)?.[1] ?? directId;
  if (!channelId) {
    throw new HttpError(404, "youtube_channel_not_found", "Could not resolve YouTube channel id.");
  }

  const title =
    html.match(/<meta property="og:title" content="([^"]+)"\s*\/?/i)?.[1] ??
    html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*-\s*YouTube\s*$/i) ??
    input;
  const thumbnailUrl =
    html.match(/<meta property="og:image" content="([^"]+)"\s*\/?/i)?.[1] ?? "";

  return {
    channelId,
    id: channelId,
    title,
    name: title,
    username: title.toLowerCase().replace(/\s+/g, "-"),
    description: "Canal validado com metadados publicos do YouTube.",
    customUrl: normalizedUrl,
    thumbnailUrl,
  };
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    await requireEditorAuth(req, createAdminClient());
    const payload = await readJson<Payload>(req);
    const channelInput = normalizeChannelInput(String(payload.channel_input ?? payload.channelInput ?? ""));
    return json(await resolveChannel(channelInput));
  })
);
