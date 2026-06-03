import { requireInternalAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient, facodi, unwrapMaybe } from "../_shared/v2_supabase.ts";
import { loadJobContext, updateJob } from "../_shared/v2_jobs.ts";
import { normalizeWhitespace, sha256Hex } from "../_shared/v2_text.ts";

interface Payload {
  job_id?: string;
  video_id?: string;
  youtube_video_id?: string;
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireInternalAuth(req, admin);
    const payload = await readJson<Payload>(req);
    const { job, video } = await loadJobContext(admin, payload);
    const db = facodi(admin);

    const artifactRows = await db
      .from("video_artifacts")
      .select("artifact_type, content_text")
      .eq("video_id", video.id as string)
      .in("artifact_type", ["description", "transcript", "captions", "chapters"]);
    if (artifactRows.error) {
      throw artifactRows.error;
    }

    const text = normalizeWhitespace(
      [
        video.title,
        video.description,
        Array.isArray(video.tags) ? (video.tags as string[]).join(" ") : "",
        ...(artifactRows.data ?? []).map((artifact) => artifact.content_text ?? ""),
      ].join("\n\n"),
    );

    if (text.length < 20) {
      await updateJob(admin, job.id as string, {
        status: "needs_review",
        current_step: "content_missing",
        error_code: "insufficient_video_text",
        error_message: "No transcript or usable description was available.",
      });
      return json({
        success: false,
        error: "insufficient_video_text",
        job_id: job.id,
        video_id: video.id,
      }, 424);
    }

    const contentHash = await sha256Hex(text);
    const existing = unwrapMaybe<{ id: string }>(
      await db
        .from("video_artifacts")
        .select("id")
        .eq("video_id", video.id as string)
        .eq("artifact_type", "clean_text")
        .eq("source", "system")
        .maybeSingle(),
    );
    const row = {
      video_id: video.id,
      artifact_type: "clean_text",
      content_text: text,
      content_json: {},
      language: video.language ?? "pt",
      source: "system",
      content_hash: contentHash,
      metadata: {
        generated_from: ["metadata", "description", "transcript", "captions", "chapters"],
      },
    };
    const result = existing
      ? await db.from("video_artifacts").update(row).eq("id", existing.id)
      : await db.from("video_artifacts").insert(row);
    if (result.error) {
      throw result.error;
    }

    const videoUpdate = await db
      .from("youtube_videos")
      .update({ status: "content_ready" })
      .eq("id", video.id as string);
    if (videoUpdate.error) {
      throw videoUpdate.error;
    }

    await updateJob(admin, job.id as string, {
      status: "running",
      current_step: "content_ready",
      result_payload: { clean_text_chars: text.length },
    });

    return json({
      success: true,
      auth_mode: auth.mode,
      job_id: job.id,
      video_id: video.id,
      clean_text_chars: text.length,
    });
  })
);
