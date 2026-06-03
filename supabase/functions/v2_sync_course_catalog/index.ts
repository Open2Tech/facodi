import { requireInternalAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { type CourseSyncPayload, syncCatalogPayload } from "../_shared/v2_catalog.ts";
import { createAdminClient } from "../_shared/v2_supabase.ts";

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireInternalAuth(req, admin);
    const payload = await readJson<{ courses?: CourseSyncPayload[] } | CourseSyncPayload[]>(req);
    const result = await syncCatalogPayload(admin, payload);

    return json({
      success: result.errors.length === 0,
      auth_mode: auth.mode,
      ...result,
    });
  })
);
