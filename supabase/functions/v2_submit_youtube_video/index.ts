import { requireUserAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, HttpError, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { processVideoPipeline } from "../_shared/v2_pipeline.ts";
import { createAdminClient, facodi, unwrap } from "../_shared/v2_supabase.ts";
import { canonicalYouTubeUrl, extractYouTubeVideoId } from "../_shared/v2_youtube.ts";

declare const EdgeRuntime: { waitUntil?: (promise: Promise<unknown>) => void } | undefined;

interface Payload {
  url?: string;
  video_id?: string;
  description?: string;
  language?: string;
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireUserAuth(req, admin);
    const payload = await readJson<Payload>(req);
    const youtubeVideoId = extractYouTubeVideoId(payload.video_id ?? payload.url ?? "");
    if (!youtubeVideoId) {
      throw new HttpError(400, "invalid_youtube_url", "Informe uma URL ou ID de vídeo do YouTube válido.");
    }
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

    const promise = processVideoPipeline(createAdminClient(), { job_id: job.id });
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
