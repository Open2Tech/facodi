import { requireInternalAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient, facodi, unwrap } from "../_shared/v2_supabase.ts";
import { canonicalYouTubeUrl, extractYouTubeVideoId } from "../_shared/v2_youtube.ts";

interface Payload {
  url?: string;
  video_id?: string;
  title?: string;
  description?: string;
  channel_id?: string;
  channel_title?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireInternalAuth(req, admin);
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
            title: payload.title ?? null,
            description: payload.description ?? null,
            channel_id: payload.channel_id ?? null,
            channel_title: payload.channel_title ?? null,
            language: payload.language ?? null,
            metadata: payload.metadata ?? {},
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
          current_step: "ingested",
          input_payload: { ...payload, video_id: undefined },
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single(),
    );

    return json({
      success: true,
      auth_mode: auth.mode,
      job_id: job.id,
      video_id: video.id,
      youtube_video_id: video.youtube_video_id,
      canonical_url: canonicalUrl,
    });
  })
);
