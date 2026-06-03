import { requireEditorAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient, facodi, unwrap } from "../_shared/v2_supabase.ts";
import { updateJob } from "../_shared/v2_jobs.ts";

interface Payload {
  classification_id: string;
  action: "accept" | "reject" | "correct";
  course_id?: string | null;
  curricular_unit_id?: string | null;
  notes?: string;
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireEditorAuth(req, admin);
    const payload = await readJson<Payload>(req);
    const db = facodi(admin);

    if (!payload.classification_id) {
      return json({ success: false, error: "missing_classification_id" }, 400);
    }
    if (!["accept", "reject", "correct"].includes(payload.action)) {
      return json({ success: false, error: "invalid_action" }, 400);
    }

    const existing = unwrap<Record<string, unknown>>(
      await db
        .from("video_classifications")
        .select("*")
        .eq("id", payload.classification_id)
        .maybeSingle(),
    );

    const status = payload.action === "accept"
      ? "accepted"
      : payload.action === "reject"
      ? "rejected"
      : "corrected";
    const patch: Record<string, unknown> = {
      status,
      needs_review: false,
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
      metadata: {
        ...((existing.metadata as Record<string, unknown>) ?? {}),
        review_notes: payload.notes ?? null,
        review_action: payload.action,
      },
    };

    if (payload.action === "correct") {
      patch.course_id = payload.course_id ?? existing.course_id ?? null;
      patch.curricular_unit_id = payload.curricular_unit_id ?? existing.curricular_unit_id ?? null;
    }

    const updated = unwrap<{ id: string; job_id: string | null }>(
      await db
        .from("video_classifications")
        .update(patch)
        .eq("id", payload.classification_id)
        .select("id, job_id")
        .single(),
    );

    if (updated.job_id) {
      await updateJob(admin, updated.job_id, {
        status: payload.action === "reject" ? "needs_review" : "succeeded",
        current_step: `review_${payload.action}`,
        completed_at: new Date().toISOString(),
      });
    }

    return json({
      success: true,
      auth_mode: auth.mode,
      classification_id: updated.id,
      status,
    });
  })
);
