import { requireUserAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, HttpError, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient, env, facodi, unwrap } from "../_shared/v2_supabase.ts";
import { failJob } from "../_shared/v2_jobs.ts";
import { canonicalYouTubeUrl, extractYouTubeVideoId } from "../_shared/v2_youtube.ts";

declare const EdgeRuntime: { waitUntil?: (promise: Promise<unknown>) => void } | undefined;

interface Payload {
  url?: string;
  video_id?: string;
  description?: string;
  language?: string;
}

async function invokeStage(functionName: string, jobId: string): Promise<Record<string, unknown>> {
  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  const secret = env("FACODI_WEBHOOK_SECRET");
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": anonKey,
      "x-facodi-webhook-secret": secret,
    },
    body: JSON.stringify({
      job_id: jobId,
      ...(functionName === "v2_generate_embeddings" ? { target: "video" } : {}),
    }),
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || data.success === false) {
    throw new HttpError(
      response.status || 500,
      String(data.error ?? `${functionName}_failed`),
      String(data.message ?? `${functionName} failed.`),
      data,
    );
  }
  return data;
}

async function processJob(jobId: string): Promise<void> {
  const admin = createAdminClient();
  try {
    for (const functionName of [
      "v2_fetch_youtube_metadata",
      "v2_extract_video_content",
      "v2_generate_embeddings",
      "v2_match_video_candidates",
      "v2_classify_video",
    ]) {
      await invokeStage(functionName, jobId);
    }
  } catch (error) {
    await failJob(admin, jobId, error);
    throw error;
  }
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireUserAuth(req, admin);
    const payload = await readJson<Payload>(req);
    const youtubeVideoId = extractYouTubeVideoId(payload.video_id ?? payload.url ?? "");
    const canonicalUrl = canonicalYouTubeUrl(youtubeVideoId);
    const db = facodi(admin);

    const video = unwrap<{ id: string; youtube_video_id: string }>(
      await db
        .from("youtube_videos")
        .upsert(
          {
            youtube_video_id: youtubeVideoId,
            canonical_url: canonicalUrl,
            description: payload.description ?? null,
            language: payload.language ?? null,
            metadata: { source: "facodi_v2_user_submission" },
            status: "pending",
          },
          { onConflict: "youtube_video_id" },
        )
        .select("id, youtube_video_id")
        .single(),
    );

    const job = unwrap<{ id: string }>(
      await db
        .from("analysis_jobs")
        .insert({
          video_id: video.id,
          youtube_video_id: youtubeVideoId,
          input_url: payload.url ?? canonicalUrl,
          status: "queued",
          current_step: "submitted",
          requested_by: auth.userId,
          request_source: "facodi_video_submit",
          input_payload: {
            url: payload.url ?? canonicalUrl,
            language: payload.language ?? null,
            description_provided: Boolean(payload.description),
          },
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single(),
    );

    const promise = processJob(job.id);
    if (typeof EdgeRuntime?.waitUntil === "function") {
      EdgeRuntime.waitUntil(promise);
    } else {
      promise.catch((error) => console.error(error));
    }

    return json({
      success: true,
      job_id: job.id,
      video_id: video.id,
      youtube_video_id: video.youtube_video_id,
      canonical_url: canonicalUrl,
      status: "queued",
    }, 202);
  })
);
