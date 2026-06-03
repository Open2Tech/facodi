import { requireInternalAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { type CourseSyncPayload, syncCoursePayload } from "../_shared/v2_catalog.ts";
import { createAdminClient } from "../_shared/v2_supabase.ts";

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireInternalAuth(req, admin);
    const payload = await readJson<CourseSyncPayload>(req);
    const result = await syncCoursePayload(admin, payload);

    return json({
      success: true,
      auth_mode: auth.mode,
      result,
    });
  })
);
