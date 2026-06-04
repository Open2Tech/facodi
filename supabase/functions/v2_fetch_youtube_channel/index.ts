import { requireEditorAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient } from "../_shared/v2_supabase.ts";
import { fetchYouTubeChannel } from "../_shared/v2_youtube.ts";

interface Payload {
  channel_input?: string;
  channelInput?: string;
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    await requireEditorAuth(req, createAdminClient());
    const payload = await readJson<Payload>(req);
    const channelInput = String(payload.channel_input ?? payload.channelInput ?? "");
    return json(await fetchYouTubeChannel(channelInput));
  })
);
