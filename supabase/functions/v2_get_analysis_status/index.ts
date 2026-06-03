import { requireInternalAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, optionalJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient, facodi } from "../_shared/v2_supabase.ts";

interface Payload {
  job_id?: string;
  video_id?: string;
  youtube_video_id?: string;
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, ["GET", "POST"]);
    const admin = createAdminClient();
    const auth = await requireInternalAuth(req, admin);
    const body = (await optionalJson<Payload>(req)) ?? {};
    const url = new URL(req.url);
    const payload: Payload = {
      job_id: body.job_id ?? url.searchParams.get("job_id") ?? undefined,
      video_id: body.video_id ?? url.searchParams.get("video_id") ?? undefined,
      youtube_video_id: body.youtube_video_id ?? url.searchParams.get("youtube_video_id") ??
        undefined,
    };
    const db = facodi(admin);

    let jobQuery = db.from("analysis_jobs").select("*").order("created_at", { ascending: false })
      .limit(1);
    if (payload.job_id) {
      jobQuery = jobQuery.eq("id", payload.job_id);
    } else if (payload.video_id) {
      jobQuery = jobQuery.eq("video_id", payload.video_id);
    } else if (payload.youtube_video_id) {
      jobQuery = jobQuery.eq("youtube_video_id", payload.youtube_video_id);
    } else {
      return json({
        success: false,
        error: "missing_lookup",
        message: "Provide job_id or video id.",
      }, 400);
    }

    const job = await jobQuery.maybeSingle();
    if (job.error) {
      throw job.error;
    }
    if (!job.data) {
      return json({ success: false, error: "job_not_found" }, 404);
    }

    const [video, candidates, classification, artifacts] = await Promise.all([
      job.data.video_id
        ? db.from("youtube_videos").select("*").eq("id", job.data.video_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      db
        .from("classification_candidates")
        .select("*")
        .eq("job_id", job.data.id)
        .order("rank", { ascending: true }),
      db.from("video_classifications").select("*").eq("job_id", job.data.id).maybeSingle(),
      job.data.video_id
        ? db
          .from("video_artifacts")
          .select("id, artifact_type, source, language, content_hash, created_at")
          .eq("video_id", job.data.video_id)
        : Promise.resolve({ data: [], error: null }),
    ]);

    for (const result of [video, candidates, classification, artifacts]) {
      if (result.error) {
        throw result.error;
      }
    }

    return json({
      success: true,
      auth_mode: auth.mode,
      job: job.data,
      video: video.data,
      artifacts: artifacts.data ?? [],
      candidates: candidates.data ?? [],
      classification: classification.data,
    });
  })
);
