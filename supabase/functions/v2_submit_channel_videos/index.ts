import { requireEditorAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, HttpError, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { processVideoPipeline } from "../_shared/v2_pipeline.ts";
import { createAdminClient, facodi, unwrap } from "../_shared/v2_supabase.ts";
import { canonicalYouTubeUrl, extractYouTubeVideoId } from "../_shared/v2_youtube.ts";

declare const EdgeRuntime: { waitUntil?: (promise: Promise<unknown>) => void } | undefined;

interface ChannelVideoPayload {
  video_id?: string;
  url?: string;
  title?: string;
  description?: string;
  channel_id?: string;
  channel_title?: string;
  thumbnail_url?: string;
  published_at?: string;
  language?: string;
  tags?: string[];
}

interface Payload {
  channel_input?: string;
  videos?: ChannelVideoPayload[];
  start_processing?: boolean;
}

const MAX_CHANNEL_VIDEOS = 20;

async function processJobsInSequence(jobIds: string[]): Promise<void> {
  const admin = createAdminClient();
  for (const jobId of jobIds) {
    await processVideoPipeline(admin, { job_id: jobId });
  }
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireEditorAuth(req, admin);
    const payload = await readJson<Payload>(req);
    const videos = payload.videos ?? [];
    if (!Array.isArray(videos) || videos.length === 0) {
      throw new HttpError(400, "empty_video_batch", "Provide at least one video.");
    }
    if (videos.length > MAX_CHANNEL_VIDEOS) {
      throw new HttpError(
        400,
        "video_batch_too_large",
        `Submit at most ${MAX_CHANNEL_VIDEOS} videos per request.`,
      );
    }

    const db = facodi(admin);
    const jobs: Array<{
      video_id: string;
      youtube_video_id: string;
      job_id: string;
      status: string;
    }> = [];

    for (const item of videos) {
      const youtubeVideoId = extractYouTubeVideoId(item.video_id ?? item.url ?? "");
      if (!youtubeVideoId) {
        throw new HttpError(400, "invalid_youtube_url", "Informe uma URL ou ID de vídeo do YouTube válido.");
      }
      const canonicalUrl = canonicalYouTubeUrl(youtubeVideoId);
      const video = unwrap<{ id: string; youtube_video_id: string }>(
        await db
          .from("youtube_videos")
          .upsert(
            {
              youtube_video_id: youtubeVideoId,
              canonical_url: item.url ?? canonicalUrl,
              title: item.title ?? null,
              description: item.description ?? null,
              channel_id: item.channel_id ?? null,
              channel_title: item.channel_title ?? payload.channel_input ?? null,
              published_at: item.published_at ?? null,
              thumbnails: item.thumbnail_url ? { default: item.thumbnail_url, high: item.thumbnail_url } : {},
              tags: Array.isArray(item.tags) ? item.tags : [],
              language: item.language ?? null,
              metadata: {
                source: "facodi_v2_channel_pipeline",
                channel_input: payload.channel_input ?? null,
              },
              status: "pending",
            },
            { onConflict: "youtube_video_id" },
          )
          .select("id, youtube_video_id")
          .single(),
      );

      const job = unwrap<{ id: string; status: string }>(
        await db
          .from("analysis_jobs")
          .insert({
            video_id: video.id,
            youtube_video_id: youtubeVideoId,
            input_url: item.url ?? canonicalUrl,
            status: "queued",
            current_step: "submitted",
            requested_by: auth.userId,
            request_source: "facodi_channel_pipeline",
            input_payload: {
              channel_input: payload.channel_input ?? null,
              title: item.title ?? null,
              language: item.language ?? null,
              thumbnail_url: item.thumbnail_url ?? null,
            },
            started_at: new Date().toISOString(),
          })
          .select("id, status")
          .single(),
      );

      jobs.push({
        video_id: video.id,
        youtube_video_id: video.youtube_video_id,
        job_id: job.id,
        status: job.status,
      });
    }

    if (payload.start_processing !== false) {
      const promise = processJobsInSequence(jobs.map((job) => job.job_id));
      if (typeof EdgeRuntime?.waitUntil === "function") {
        EdgeRuntime.waitUntil(promise);
      } else {
        promise.catch((error) => console.error(error));
      }
    }

    return json({
      success: true,
      auth_mode: auth.mode,
      jobs,
    }, 202);
  })
);
