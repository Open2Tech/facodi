import { requireInternalAuth } from "../_shared/v2_auth.ts";
import { ensureMethod, json, readJson, withHttp } from "../_shared/v2_http.ts";
import { createAdminClient, facodi, unwrap, unwrapMaybe } from "../_shared/v2_supabase.ts";
import { classifyWithFallback, confidenceLevel } from "../_shared/v2_ai.ts";
import { loadJobContext, updateJob } from "../_shared/v2_jobs.ts";

interface Payload {
  job_id?: string;
  video_id?: string;
  youtube_video_id?: string;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 1)) : fallback;
}

Deno.serve((req) =>
  withHttp(req, async () => {
    ensureMethod(req, "POST");
    const admin = createAdminClient();
    const auth = await requireInternalAuth(req, admin);
    const payload = await readJson<Payload>(req);
    const { job, video } = await loadJobContext(admin, payload);
    const db = facodi(admin);

    const artifacts = await db
      .from("video_artifacts")
      .select("artifact_type, content_text, content_json")
      .eq("video_id", video.id as string)
      .in("artifact_type", ["metadata", "clean_text", "description", "transcript", "captions"])
      .limit(10);
    if (artifacts.error) {
      throw artifacts.error;
    }

    const candidates = await db
      .from("classification_candidates")
      .select("*")
      .eq("job_id", job.id as string)
      .order("rank", { ascending: true })
      .limit(30);
    if (candidates.error) {
      throw candidates.error;
    }

    const courseIds = Array.from(
      new Set((candidates.data ?? []).map((candidate) => candidate.course_id).filter(Boolean)),
    );
    const unitIds = Array.from(
      new Set(
        (candidates.data ?? []).map((candidate) => candidate.curricular_unit_id).filter(Boolean),
      ),
    );

    const courses = courseIds.length
      ? await db.from("courses").select("id, title, degree_type, school").in("id", courseIds)
      : { data: [], error: null };
    if (courses.error) {
      throw courses.error;
    }
    const units = unitIds.length
      ? await db.from("curricular_units").select("id, course_id, code, title, summary").in(
        "id",
        unitIds,
      )
      : { data: [], error: null };
    if (units.error) {
      throw units.error;
    }

    const courseMap = new Map((courses.data ?? []).map((course) => [course.id, course]));
    const unitMap = new Map((units.data ?? []).map((unit) => [unit.id, unit]));
    const enrichedCandidates = (candidates.data ?? []).map((candidate) => ({
      ...candidate,
      course: courseMap.get(candidate.course_id),
      curricular_unit: candidate.curricular_unit_id
        ? unitMap.get(candidate.curricular_unit_id)
        : null,
    }));

    const llm = await classifyWithFallback({
      video: {
        id: video.id,
        youtube_video_id: video.youtube_video_id,
        title: video.title,
        description: video.description,
        channel_title: video.channel_title,
      },
      artifacts: (artifacts.data ?? []).map((artifact) => ({
        artifact_type: artifact.artifact_type,
        text: typeof artifact.content_text === "string" ? artifact.content_text.slice(0, 4000) : "",
        json: artifact.content_json,
      })),
      candidates: enrichedCandidates,
    });

    const modelRun = unwrap<{ id: string }>(
      await db
        .from("model_runs")
        .insert({
          job_id: job.id,
          provider: llm.provider,
          model: llm.model,
          purpose: "video_classification",
          prompt_version: llm.prompt_version,
          input_hash: llm.input_hash,
          input_summary: `video=${video.youtube_video_id}; candidates=${enrichedCandidates.length}`,
          output_json: llm.output_json,
          usage_json: llm.usage_json,
          latency_ms: llm.latency_ms,
          status: "succeeded",
        })
        .select("id")
        .single(),
    );

    const firstCourseCandidate = enrichedCandidates.find((candidate) =>
      candidate.candidate_type === "course"
    );
    const firstUnitCandidate = enrichedCandidates.find((candidate) =>
      candidate.candidate_type === "curricular_unit"
    );
    const courseId = typeof llm.output_json.recommended_course_id === "string"
      ? llm.output_json.recommended_course_id
      : firstCourseCandidate?.course_id ?? firstUnitCandidate?.course_id ?? null;
    const unitId = typeof llm.output_json.recommended_curricular_unit_id === "string"
      ? llm.output_json.recommended_curricular_unit_id
      : firstUnitCandidate?.curricular_unit_id ?? null;
    const confidence = asNumber(
      llm.output_json.confidence,
      firstUnitCandidate?.combined_score ?? 0.3,
    );
    const needsReview = Boolean(llm.output_json.needs_review ?? confidence < 0.8);
    const classificationRow = {
      job_id: job.id,
      video_id: video.id,
      course_id: courseId,
      curricular_unit_id: unitId,
      model_run_id: modelRun.id,
      confidence,
      confidence_level: confidenceLevel(confidence),
      status: needsReview ? "needs_review" : "draft",
      needs_review: needsReview,
      justification: typeof llm.output_json.justification === "string"
        ? llm.output_json.justification
        : null,
      evidence: Array.isArray(llm.output_json.evidence)
        ? llm.output_json.evidence
        : enrichedCandidates.slice(0, 5),
      metadata: { llm_output: llm.output_json },
    };

    const existing = unwrapMaybe<{ id: string }>(
      await db
        .from("video_classifications")
        .select("id")
        .eq("job_id", job.id as string)
        .maybeSingle(),
    );
    const classification = unwrap<{ id: string }>(
      existing
        ? await db
          .from("video_classifications")
          .update(classificationRow)
          .eq("id", existing.id)
          .select("id")
          .single()
        : await db.from("video_classifications").insert(classificationRow).select("id").single(),
    );

    const videoUpdate = await db
      .from("youtube_videos")
      .update({ status: "classified" })
      .eq("id", video.id as string);
    if (videoUpdate.error) {
      throw videoUpdate.error;
    }
    await updateJob(admin, job.id as string, {
      status: needsReview ? "needs_review" : "succeeded",
      current_step: "classified",
      completed_at: new Date().toISOString(),
      result_payload: {
        classification_id: classification.id,
        course_id: courseId,
        curricular_unit_id: unitId,
        confidence,
        needs_review: needsReview,
      },
    });

    return json({
      success: true,
      auth_mode: auth.mode,
      job_id: job.id,
      classification_id: classification.id,
      course_id: courseId,
      curricular_unit_id: unitId,
      confidence,
      needs_review: needsReview,
    });
  })
);
