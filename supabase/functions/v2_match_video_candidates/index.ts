import { requireInternalAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient, facodi, unwrapMaybe } from "../_shared/v2_supabase.ts";
import { loadJobContext, updateJob } from "../_shared/v2_jobs.ts";

interface Payload {
  job_id?: string;
  video_id?: string;
  youtube_video_id?: string;
  match_count?: number;
}

interface MatchRow {
  chunk_id: string;
  course_id: string;
  curricular_unit_id: string | null;
  content_text: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

async function upsertCandidate(
  db: ReturnType<typeof facodi>,
  row: Record<string, unknown>,
): Promise<void> {
  let existingQuery = db
    .from("classification_candidates")
    .select("id")
    .eq("job_id", row.job_id as string)
    .eq("candidate_type", row.candidate_type as string)
    .eq("course_id", row.course_id as string);

  if (row.curricular_unit_id) {
    existingQuery = existingQuery.eq("curricular_unit_id", row.curricular_unit_id as string);
  } else {
    existingQuery = existingQuery.is("curricular_unit_id", null);
  }

  const existing = unwrapMaybe<{ id: string }>(await existingQuery.maybeSingle());
  const result = existing
    ? await db.from("classification_candidates").update(row).eq("id", existing.id)
    : await db.from("classification_candidates").insert(row);
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
    const matchCount = Math.max(1, Math.min(Number(payload.match_count ?? 20), 100));

    const artifact = unwrapMaybe<{ id: string; embedding: unknown }>(
      await db
        .from("video_artifacts")
        .select("id, embedding")
        .eq("video_id", video.id as string)
        .in("artifact_type", ["clean_text", "description", "transcript", "captions"])
        .not("embedding", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    );

    if (!artifact?.embedding) {
      return json({
        success: false,
        error: "missing_video_embedding",
        message: "Generate video embeddings before matching candidates.",
        job_id: job.id,
      }, 424);
    }

    const matches = await db.rpc("match_knowledge_chunks", {
      query_embedding: artifact.embedding,
      match_count: matchCount,
      course_filter: null,
    });
    if (matches.error) {
      throw matches.error;
    }

    const courseScores = new Map<string, { score: number; evidence: MatchRow[] }>();
    const unitScores = new Map<
      string,
      { course_id: string; score: number; evidence: MatchRow[] }
    >();
    for (const row of (matches.data ?? []) as MatchRow[]) {
      const course = courseScores.get(row.course_id) ?? { score: 0, evidence: [] };
      course.score = Math.max(course.score, row.similarity);
      course.evidence.push(row);
      courseScores.set(row.course_id, course);

      if (row.curricular_unit_id) {
        const unit = unitScores.get(row.curricular_unit_id) ?? {
          course_id: row.course_id,
          score: 0,
          evidence: [],
        };
        unit.score = Math.max(unit.score, row.similarity);
        unit.evidence.push(row);
        unitScores.set(row.curricular_unit_id, unit);
      }
    }

    const courseCandidates = [...courseScores.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 10);
    const unitCandidates = [...unitScores.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 20);

    let rank = 1;
    for (const [courseId, value] of courseCandidates) {
      await upsertCandidate(db, {
        job_id: job.id,
        video_id: video.id,
        course_id: courseId,
        curricular_unit_id: null,
        candidate_type: "course",
        rank: rank++,
        vector_score: value.score,
        combined_score: value.score,
        confidence: value.score,
        evidence: value.evidence.slice(0, 5),
        metadata: { source_artifact_id: artifact.id },
      });
    }

    rank = 1;
    for (const [unitId, value] of unitCandidates) {
      await upsertCandidate(db, {
        job_id: job.id,
        video_id: video.id,
        course_id: value.course_id,
        curricular_unit_id: unitId,
        candidate_type: "curricular_unit",
        rank: rank++,
        vector_score: value.score,
        combined_score: value.score,
        confidence: value.score,
        evidence: value.evidence.slice(0, 5),
        metadata: { source_artifact_id: artifact.id },
      });
    }

    await updateJob(admin, job.id as string, {
      status: "running",
      current_step: "candidates_ready",
      result_payload: {
        course_candidates: courseCandidates.length,
        curricular_unit_candidates: unitCandidates.length,
      },
    });

    return json({
      success: true,
      auth_mode: auth.mode,
      job_id: job.id,
      course_candidates: courseCandidates.length,
      curricular_unit_candidates: unitCandidates.length,
    });
  })
);
