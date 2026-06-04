import { requireEditorAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient } from "../_shared/v2_supabase.ts";
import { listYouTubeChannelVideos } from "../_shared/v2_youtube.ts";

interface Payload {
  channel_input?: string;
  channelInput?: string;
  brief?: { maxVideos?: number };
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    await requireEditorAuth(req, createAdminClient());
    const payload = await readJson<Payload>(req);
    const channelInput = String(payload.channel_input ?? payload.channelInput ?? "");
    const maxVideos = Math.max(1, Math.min(Number(payload.brief?.maxVideos ?? 10), 20));
    const videos = await listYouTubeChannelVideos(channelInput, maxVideos);

    return json({ videos });
  })
);
