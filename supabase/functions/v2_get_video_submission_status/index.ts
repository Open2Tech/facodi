import { requireUserAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, HttpError, json, optionalJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient, facodi } from "../_shared/v2_supabase.ts";

interface Payload {
  job_id?: string;
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, ["GET", "POST"]);
    const admin = createAdminClient();
    const auth = await requireUserAuth(req, admin);
    const body = (await optionalJson<Payload>(req)) ?? {};
    const url = new URL(req.url);
    const jobId = body.job_id ?? url.searchParams.get("job_id") ?? undefined;
    if (!jobId) {
      throw new HttpError(400, "missing_job_id", "job_id is required.");
    }

    const db = facodi(admin);
    const job = await db.from("analysis_jobs").select("*").eq("id", jobId).maybeSingle();
    if (job.error) throw job.error;
    if (!job.data) {
      return json({ success: false, error: "job_not_found" }, 404);
    }

    const canRead =
      auth.role === "editor" ||
      auth.role === "admin" ||
      (auth.userId && job.data.requested_by === auth.userId);
    if (!canRead) {
      throw new HttpError(403, "forbidden", "You can only read your own video submission jobs.");
    }

    const [video, candidates, classification, artifacts] = await Promise.all([
      job.data.video_id
        ? db.from("youtube_videos").select("*").eq("id", job.data.video_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      db.from("classification_candidates").select("*").eq("job_id", job.data.id).order("rank", { ascending: true }),
      db.from("video_classifications").select("*").eq("job_id", job.data.id).maybeSingle(),
      job.data.video_id
        ? db.from("video_artifacts").select("id, artifact_type, source, language, created_at").eq("video_id", job.data.video_id)
        : Promise.resolve({ data: [], error: null }),
    ]);

    for (const result of [video, candidates, classification, artifacts]) {
      if (result.error) throw result.error;
    }

    return json({
      success: true,
      job: job.data,
      video: video.data,
      artifacts: artifacts.data ?? [],
      candidates: candidates.data ?? [],
      classification: classification.data,
    });
  })
);
