import { requireInternalAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient } from "../_shared/v2_supabase.ts";
import { runExtractVideoContent } from "../_shared/v2_video_pipeline_steps.ts";

interface Payload {
  job_id?: string;
  video_id?: string;
  youtube_video_id?: string;
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireInternalAuth(req, admin);
    const payload = await readJson<Payload>(req);
    return json({ ...(await runExtractVideoContent(admin, payload)), auth_mode: auth.mode });
  })
);
