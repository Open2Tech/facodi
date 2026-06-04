import { requireInternalAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient, facodi, unwrap } from "../_shared/v2_supabase.ts";
import { loadJobContext, updateJob } from "../_shared/v2_jobs.ts";
import { fetchYouTubeMetadata } from "../_shared/v2_youtube.ts";
import { normalizeWhitespace, sha256Hex } from "../_shared/v2_text.ts";

interface Payload {
  job_id?: string;
  video_id?: string;
  youtube_video_id?: string;
}

async function upsertArtifact(
  db: ReturnType<typeof facodi>,
  row: Record<string, unknown>,
): Promise<void> {
  const existing = await db
    .from("video_artifacts")
    .select("id")
    .eq("video_id", row.video_id as string)
    .eq("artifact_type", row.artifact_type as string)
    .eq("source", row.source as string)
    .maybeSingle();
  if (existing.error) {
    throw existing.error;
  }
  const result = existing.data
    ? await db.from("video_artifacts").update(row).eq("id", existing.data.id)
    : await db.from("video_artifacts").insert(row);
  if (result.error) {
    throw result.error;
  }
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireInternalAuth(req, admin);
    const payload = await readJson<Payload>(req);
    const { job, video } = await loadJobContext(admin, payload);
    const db = facodi(admin);
    const metadata = await fetchYouTubeMetadata(video.youtube_video_id as string);
    const updateResult = await db
      .from("youtube_videos")
      .update({ ...metadata, status: "metadata_ready" })
      .eq("id", video.id as string);
    if (updateResult.error) {
      throw updateResult.error;
    }

    const text = normalizeWhitespace(
      [metadata.title, metadata.description, metadata.tags.join(" ")].join("\n"),
    );
    await upsertArtifact(db, {
      video_id: video.id,
      artifact_type: "metadata",
      content_json: metadata,
      content_text: metadata.title,
      language: metadata.language,
      source: "youtube_oauth",
      content_hash: await sha256Hex(JSON.stringify(metadata)),
      metadata: { fetched_with_youtube_api: true, youtube_auth_mode: "oauth" },
    });

    if (text.length > 0) {
      await upsertArtifact(db, {
        video_id: video.id,
        artifact_type: "description",
        content_json: {},
        content_text: text,
        language: metadata.language,
        source: "youtube_oauth",
        content_hash: await sha256Hex(text),
        metadata: {},
      });
    }

    await updateJob(admin, job.id as string, {
      status: "running",
      current_step: "metadata_ready",
      result_payload: { metadata_ready: true, fetched_with_youtube_api: true },
    });

    return json({
      success: true,
      auth_mode: auth.mode,
      job_id: job.id,
      video_id: video.id,
      youtube_video_id: metadata.youtube_video_id,
      fetched_with_youtube_api: true,
      youtube_auth_mode: "oauth",
    });
  })
);
