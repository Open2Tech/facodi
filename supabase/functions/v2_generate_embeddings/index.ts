import { requireInternalAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient, facodi } from "../_shared/v2_supabase.ts";
import { generateEmbedding } from "../_shared/v2_ai.ts";
import { loadJobContext, updateJob } from "../_shared/v2_jobs.ts";

interface Payload {
  job_id?: string;
  video_id?: string;
  youtube_video_id?: string;
  target?: "video" | "knowledge" | "all";
  max_items?: number;
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireInternalAuth(req, admin);
    const payload = await readJson<Payload>(req);
    const target = payload.target ?? "all";
    const maxItems = Math.max(1, Math.min(Number(payload.max_items ?? 20), 100));
    const db = facodi(admin);
    let jobId: string | null = null;
    let videoId: string | null = null;

    if (payload.job_id || payload.video_id || payload.youtube_video_id) {
      const context = await loadJobContext(admin, payload);
      jobId = context.job.id as string;
      videoId = context.video.id as string;
    }

    let videoArtifactsEmbedded = 0;
    let knowledgeChunksEmbedded = 0;

    if ((target === "video" || target === "all") && videoId) {
      const artifacts = await db
        .from("video_artifacts")
        .select("id, content_text")
        .eq("video_id", videoId)
        .in("artifact_type", ["clean_text", "description", "transcript", "captions"])
        .is("embedding", null)
        .limit(maxItems);
      if (artifacts.error) {
        throw artifacts.error;
      }

      for (const artifact of artifacts.data ?? []) {
        if (!artifact.content_text) {
          continue;
        }
        const embedding = await generateEmbedding(artifact.content_text);
        const result = await db
          .from("video_artifacts")
          .update({
            embedding: embedding.embedding,
            metadata: { embedding_model: embedding.model },
          })
          .eq("id", artifact.id);
        if (result.error) {
          throw result.error;
        }
        videoArtifactsEmbedded += 1;
      }

      if (videoArtifactsEmbedded > 0) {
        const result = await db.from("youtube_videos").update({ status: "embedded" }).eq(
          "id",
          videoId,
        );
        if (result.error) {
          throw result.error;
        }
      }
    }

    if (target === "knowledge" || target === "all") {
      const chunks = await db
        .from("knowledge_chunks")
        .select("id, content_text")
        .is("embedding", null)
        .limit(maxItems);
      if (chunks.error) {
        throw chunks.error;
      }

      for (const chunk of chunks.data ?? []) {
        const embedding = await generateEmbedding(chunk.content_text);
        const result = await db
          .from("knowledge_chunks")
          .update({
            embedding: embedding.embedding,
            metadata: { embedding_model: embedding.model },
          })
          .eq("id", chunk.id);
        if (result.error) {
          throw result.error;
        }
        knowledgeChunksEmbedded += 1;
      }
    }

    if (jobId) {
      await updateJob(admin, jobId, {
        status: "running",
        current_step: "embeddings_ready",
        result_payload: {
          video_artifacts_embedded: videoArtifactsEmbedded,
          knowledge_chunks_embedded: knowledgeChunksEmbedded,
        },
      });
    }

    return json({
      success: true,
      auth_mode: auth.mode,
      job_id: jobId,
      video_artifacts_embedded: videoArtifactsEmbedded,
      knowledge_chunks_embedded: knowledgeChunksEmbedded,
    });
  })
);
