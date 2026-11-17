import { createClient } from "npm:@supabase/supabase-js@2.110.0";
import {
  agreedUnitIds, type AiProvider, type AiProviderName, aiProviders, buildMessages, type Confirmation, type Candidate,
  chaptersFromDescription, classifyAiStatus, type Decision, type Evidence, evidenceLevel, groundMatches, InvalidOutput,
  JobFailure, LIMITS, listedUnitIds,
  type Match, nextUtcDay, type Notice, parseMatches, parseVideoSummary, resourceText, responseSchema, resultPayload,
  retryDelayMinutes, shortlistText, strongUnitIds, type SuggestionInput, timingSafeEqual, VIDEO_PROMPT, VIDEO_SECONDS,
  videoSummarySchema,
} from "./analysis.ts";
import { buildNotification, type NotificationInput, type PipelineSettings } from "./notification.ts";

// Autonomous analysis of learner resource suggestions (docs/suggest-ai-analysis-plan.md).
// Called by pg_cron through pg_net with a shared secret; never by browsers.
// The AI only proposes units; facodi.auto_publish_resource_suggestion decides deterministically whether
// to publish. Switches live in facodi.suggestion_pipeline_settings.

type Job = SuggestionInput & {
  job_id: string;
  lease_token: string;
  attempts: number;
  suggestion_status: string;
  curricular_unit_id: string | null;
  course_id: string | null;
};
type DryRunBody = {
  dry_run?: Partial<SuggestionInput> & {
    curricular_unit_id?: string | null; course_id?: string | null; force_provider?: AiProviderName;
  };
};

const VIDEO = /^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AI_TIMEOUT_MS = 25_000;
// Fail safe: without readable settings nothing is published or emailed.
const SAFE_SETTINGS: PipelineSettings = {
  auto_publish_enabled: false, ai_fallback_enabled: true, notification_email_enabled: false,
  notify_on_auto_publish: false, notify_on_review: false, notification_recipient: "hello@facodi.com",
};

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "facodi" },
});

function json(status: number, data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Only YouTube oEmbed, Gemini and the catalogue are queried: submitted URLs are never fetched server-side,
// and YouTube blocks page scraping from cloud IPs. Every source is optional; the evidence level records
// what was actually read.
const VIDEO_TIMEOUT_MS = 45_000;

async function fetchOembed(url: string) {
  try {
    const res = await fetchWithTimeout("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(url),
      {}, 5_000);
    if (!res.ok) return null;
    const data = await res.json() as { title?: unknown; author_name?: unknown };
    return {
      title: typeof data.title === "string" ? data.title.trim().slice(0, 200) || null : null,
      author: typeof data.author_name === "string" ? data.author_name.trim().slice(0, 120) || null : null,
    };
  } catch {
    return null;
  }
}

// Gemini watches the start of a public YouTube video (low resolution keeps it near 100 tokens per second).
// Private, unlisted, very new or failing videos simply leave the analysis on metadata.
async function watchVideo(url: string) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return null;
  const model = Deno.env.get("FACODI_SUGGESTION_AI_MODEL") || "gemini-2.5-flash";
  try {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { file_data: { file_uri: url }, video_metadata: { start_offset: "0s", end_offset: `${VIDEO_SECONDS}s` } },
              { text: VIDEO_PROMPT },
            ],
          }],
          generationConfig: {
            responseMimeType: "application/json", responseSchema: videoSummarySchema,
            mediaResolution: "MEDIA_RESOLUTION_LOW", thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 1024,
          },
        }),
      }, VIDEO_TIMEOUT_MS);
    const body = await res.json().catch(() => null) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      error?: { status?: string };
    } | null;
    console.log(JSON.stringify({ step: "watch_video", status: res.status, error: body?.error?.status ?? null,
      input_tokens: body?.usageMetadata?.promptTokenCount ?? null }));
    return res.ok ? parseVideoSummary(body?.candidates?.[0]?.content?.parts?.[0]?.text ?? null) : null;
  } catch {
    console.log(JSON.stringify({ step: "watch_video", status: "timeout" }));
    return null;
  }
}

// What FACODI and the Tube archive already know about the video, including the units it is linked to.
async function catalogHistory(video: string) {
  const [{ data: record }, { data: archived }] = await Promise.all([
    db.from("youtube_videos").select("description, tags, learning_object_id").eq("youtube_video_id", video)
      .maybeSingle(),
    db.schema("public").from("videos").select("id, description").eq("youtube_id", video).limit(1).maybeSingle(),
  ]);
  // Older objects have no youtube_videos row: find them the way auto_publish does.
  let objectId = record?.learning_object_id as string | null | undefined;
  if (!objectId) {
    const sourceIds = [video, archived?.id].filter(Boolean).map((id) => `"${id}"`).join(",");
    const { data: object } = await db.from("learning_objects").select("id")
      .or(`slug.eq.facodi-video-${video},source_id.in.(${sourceIds})`).limit(1).maybeSingle();
    objectId = object?.id as string | undefined;
  }
  let linked: Array<{ id: string; title: string }> = [];
  if (objectId) {
    const { data: relations } = await db.from("learning_object_relations").select("parent_object_id")
      .eq("child_object_id", objectId).eq("relation_type", "contains");
    const parents = (relations ?? []).map((r) => r.parent_object_id as string);
    if (parents.length) {
      const { data: units } = await db.from("curricular_units").select("id, title").in("learning_object_id", parents)
        .limit(10);
      linked = (units ?? []).map((u) => ({ id: String(u.id), title: String(u.title) }));
    }
  }
  const description = [record?.description, archived?.description]
    .find((d): d is string => typeof d === "string" && d.trim().length > 0) ?? null;
  return {
    description,
    keywords: Array.isArray(record?.tags) ? (record.tags as string[]).slice(0, LIMITS.keywords) : [],
    linked_units: linked,
    found: Boolean(record || archived || objectId),
    archive: Boolean(archived),
  };
}

async function collectEvidence(input: SuggestionInput): Promise<{ evidence: Evidence; linkedUnitIds: string[] }> {
  const evidence: Evidence = { level: "metadata_only", sources: ["submission"], title: input.title, author: null };
  const video = input.canonical_url.match(VIDEO)?.[1];
  if (!video) return { evidence, linkedUnitIds: [] };
  const [oembed, watched, history] = await Promise.all([
    fetchOembed(input.canonical_url),
    watchVideo(input.canonical_url),
    catalogHistory(video).catch(() => null),
  ]);
  if (oembed?.title) evidence.sources.push("youtube_oembed");
  if (watched) evidence.sources.push("gemini_video");
  if (history?.found) evidence.sources.push(history.archive ? "tube_archive" : "facodi_catalog");
  evidence.title = oembed?.title ?? input.title;
  evidence.author = oembed?.author ?? null;
  evidence.description = history?.description?.slice(0, LIMITS.description) ?? null;
  evidence.chapters = chaptersFromDescription(history?.description);
  evidence.keywords = history?.keywords ?? [];
  evidence.linked_units = history?.linked_units.map((u) => u.title) ?? [];
  evidence.content_summary = watched?.summary ?? null;
  evidence.content_topics = watched?.topics ?? [];
  evidence.content_language = watched?.language ?? null;
  evidence.level = evidenceLevel(evidence);
  return { evidence, linkedUnitIds: history?.linked_units.map((u) => u.id) ?? [] };
}

async function loadSettings(): Promise<PipelineSettings> {
  const { data, error } = await db.from("suggestion_pipeline_settings").select("*").maybeSingle();
  if (error || !data) console.error(JSON.stringify({ step: "settings", message: error?.message ?? "missing" }));
  return (data as PipelineSettings | null) ?? SAFE_SETTINGS;
}

// With a course (named or through the unit) the whole course is the shortlist, so matching does not
// depend on shared words.
async function shortlist(
  input: SuggestionInput, evidence: Evidence, course: string | null, include: string | null,
): Promise<Candidate[]> {
  const { data, error } = await db.rpc("rank_resource_suggestion_units", {
    p_text: shortlistText(input, evidence), p_course_id: course, p_include: include,
    p_limit: course || include ? 80 : 12,
  });
  if (error) throw error;
  return (data ?? []) as Candidate[];
}

type AiResult = { model: string; provider: AiProviderName; fallbackFrom: string | null; topics: string[];
  matches: ReturnType<typeof parseMatches>["matches"]; usage: { input_tokens: number; output_tokens: number } | null };

// Both providers speak the OpenAI chat completions format with strict JSON schema output.
async function askAi(provider: AiProvider, input: SuggestionInput, evidence: Evidence, candidates: Candidate[]) {
  const text = resourceText(evidence);
  const model = provider.model;
  let res: Response;
  try {
    res = await fetchWithTimeout(provider.url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${provider.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: buildMessages(input, evidence, candidates),
        response_format: {
          type: "json_schema",
          json_schema: { name: "facodi_unit_matches", strict: true, schema: responseSchema(candidates) },
        },
        reasoning_effort: provider.reasoningEffort,
        max_completion_tokens: 4000,
      }),
    }, AI_TIMEOUT_MS);
  } catch {
    throw new JobFailure("ai_timeout", "AI request failed or timed out", true);
  }
  if (!res.ok) {
    const failure = await res.json().catch(() => null) as { error?: { code?: unknown } } | null;
    throw classifyAiStatus(res.status, failure?.error?.code);
  }
  const body = await res.json() as {
    model?: string;
    choices?: Array<{ finish_reason?: string; message?: { content?: string | null } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  try {
    const parsed = parseMatches(body.choices?.[0]?.message?.content ?? null, candidates);
    return {
      model: body.model ?? model,
      provider: provider.name,
      fallbackFrom: null as string | null,
      topics: parsed.topics,
      matches: groundMatches(parsed.matches, text),
      usage: body.usage
        ? { input_tokens: body.usage.prompt_tokens ?? 0, output_tokens: body.usage.completion_tokens ?? 0 }
        : null,
    };
  } catch (e) {
    if (e instanceof InvalidOutput) {
      throw new JobFailure("invalid_output",
        `AI output rejected: ${e.message} (${body.choices?.[0]?.finish_reason ?? "no finish reason"})`, true);
    }
    throw e;
  }
}

// The other configured provider re-rates the same evidence; null when there is no other provider.
async function secondOpinion(
  ai: AiResult, input: SuggestionInput, evidence: Evidence, candidates: Candidate[],
  reserve: () => Promise<"reserved" | "budget_exhausted" | "lease_lost">,
): Promise<Confirmation | null | "budget_exhausted" | "lease_lost"> {
  const second = aiProviders((name) => Deno.env.get(name), { fallbackEnabled: true }).find((p) => p.name !== ai.provider);
  if (!second) return null;
  const reservation = await reserve();
  if (reservation !== "reserved") return reservation;
  try {
    const check = await askAi(second, input, evidence, candidates);
    return { provider: check.provider, model: check.model, matches: check.matches,
      agreed_unit_ids: agreedUnitIds(ai.matches, check.matches), error: null };
  } catch (e) {
    if (!(e instanceof JobFailure)) throw e;
    return { provider: second.name, model: second.model, matches: [], agreed_unit_ids: [], error: e.code };
  }
}

// Every write is fenced by the lease so a stale worker cannot overwrite a reclaimed job.
async function finish(job: Job, patch: Record<string, unknown>) {
  const { data, error } = await db.from("analysis_jobs").update(patch)
    .eq("id", job.job_id).eq("lease_token", job.lease_token).eq("status", "running").select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

const released = { lease_token: null, lease_expires_at: null };

// Waiting for budget or provider credit is not a failed attempt.
async function waitForBudget(job: Job, code: string) {
  await finish(job, {
    ...released, status: "queued", attempts: Math.max(job.attempts - 1, 0),
    next_attempt_at: nextUtcDay(new Date()).toISOString(), error_code: code, error_message: null,
  });
  return code;
}

// Tries each provider in order; every paid call is reserved against the shared daily budget first.
async function askWithFallback(
  providers: AiProvider[], input: SuggestionInput, evidence: Evidence, candidates: Candidate[],
  reserve: () => Promise<"reserved" | "budget_exhausted" | "lease_lost">,
): Promise<AiResult | "budget_exhausted" | "lease_lost"> {
  if (providers.length === 0) throw new JobFailure("not_configured", "No AI provider key is configured", false);
  let failure: JobFailure | null = null;
  for (const provider of providers) {
    const reservation = await reserve();
    if (reservation !== "reserved") return reservation;
    try {
      const result: AiResult = await askAi(provider, input, evidence, candidates);
      return { ...result, fallbackFrom: failure?.code ?? null };
    } catch (e) {
      if (!(e instanceof JobFailure)) throw e;
      console.error(JSON.stringify({ provider: provider.name, code: e.code }));
      failure = e;
    }
  }
  throw failure!;
}

// Same key for the first send and every retry of one decision: Resend delivers it at most once.
const emailKey = (jobId: string, completedAt: string) => `facodi-suggestion-${jobId}-${Date.parse(completedAt)}`;

async function notify(jobId: string, key: string, settings: PipelineSettings, input: NotificationInput) {
  const message = buildNotification(settings, input);
  const apiKey = Deno.env.get("FACODI_RESEND_API_KEY") || Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("FACODI_EMAIL_FROM") || Deno.env.get("RESEND_FROM_EMAIL");
  let event = "email_sent";
  let detail = message?.to ?? "disabled_by_settings";
  if (!message) {
    event = "email_skipped";
  } else if (!apiKey || !from) {
    event = "email_failed";
    detail = "not_configured";
  } else {
    try {
      const res = await fetchWithTimeout("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
      }, 10_000);
      if (!res.ok) {
        event = "email_failed";
        detail = `HTTP ${res.status}`;
      }
    } catch {
      event = "email_failed";
      detail = "timeout";
    }
  }
  // Email never fails the analysis: failures are recorded and retried by retryNotifications.
  await db.from("analysis_job_events").insert({ job_id: jobId, event_type: event, message: detail });
  return event;
}

// Resends decision emails that failed (or were never attempted) using the stored notice; never reanalyses.
async function retryNotifications(settings: PipelineSettings) {
  const { data, error } = await db.rpc("claim_suggestion_notifications", { p_limit: 5 });
  if (error) {
    console.error(JSON.stringify({ step: "notifications", message: error.message }));
    return [];
  }
  const results: string[] = [];
  for (const row of (data ?? []) as Array<{ job_id: string; completed_at: string; result_payload: Payload }>) {
    const p = row.result_payload;
    if (!p.notice || !p.decision) continue;
    results.push(await notify(row.job_id, emailKey(row.job_id, row.completed_at), settings,
      { ...p.notice, decision: p.decision, matches: p.matching?.matches ?? [] }));
  }
  return results;
}

type Payload = { notice?: Notice | null; decision?: Decision | null; matching?: { matches?: Match[] } };

async function processJob(job: Job, dailyLimit: number, settings: PipelineSettings): Promise<string> {
  if (job.suggestion_status !== "pending" && job.suggestion_status !== "duplicate") {
    await finish(job, { ...released, status: "cancelled", current_step: "completed", completed_at: new Date().toISOString() });
    return "cancelled";
  }
  try {
    const { evidence, linkedUnitIds } = await collectEvidence(job);
    if (!await finish(job, { current_step: "matching" })) return "lease_lost";
    const candidates = await shortlist(job, evidence, job.course_id, job.curricular_unit_id);
    const course = job.course_id ? candidates[0] ?? null : null;
    const unit = candidates.find((c) => c.id === job.curricular_unit_id) ?? null;
    const notice: Notice = {
      title: job.title, url: job.canonical_url, author: evidence.author, provider: null,
      evidence_level: evidence.level,
      chosen: course && { unit_title: unit?.title ?? null, course_title: course.course_title },
    };
    const complete = async (payload: ReturnType<typeof resultPayload>, decision: Decision, matches: Match[]) => {
      const completedAt = new Date().toISOString();
      if (!await finish(job, {
        ...released, status: "succeeded", current_step: "completed", completed_at: completedAt, result_payload: payload,
      })) return false;
      await notify(job.job_id, emailKey(job.job_id, completedAt), settings,
        { ...(payload.notice as Notice), decision, matches });
      return true;
    };
    const decide = async (unitIds: string[], reason: string) => {
      if (!await finish(job, { current_step: "deciding" })) return "lease_lost" as const;
      const { data, error } = await db.rpc("auto_publish_resource_suggestion", {
        p_job_id: job.job_id, p_lease_token: job.lease_token, p_unit_ids: unitIds, p_reason: reason,
        p_evidence: {
          level: evidence.level, description: evidence.description ?? null, channel_title: evidence.author,
          content_summary: evidence.content_summary ?? null, content_topics: evidence.content_topics ?? [],
          content_language: evidence.content_language ?? null, content_seconds: VIDEO_SECONDS,
        },
      });
      if (error) throw error;
      const decision = data as Decision;
      return decision.outcome === "skipped" && decision.reason === "lease_lost" ? "lease_lost" as const : decision;
    };
    const listed = course ? listedUnitIds(linkedUnitIds, candidates, job.curricular_unit_id) : [];
    if (listed.length) {
      const decision = await decide(listed, "Já associado a esta unidade curricular no catálogo FACODI.");
      if (decision === "lease_lost") return "lease_lost";
      const payload = resultPayload({ evidence, model: null, outcome: "catalog_listed", shortlistSize: candidates.length,
        decision, notice: { ...notice, provider: "catálogo FACODI" } });
      if (!await complete(payload, decision, [])) return "lease_lost";
      return decision.outcome === "published" ? "published" : "succeeded";
    }
    if (candidates.length === 0) {
      const decision: Decision = { outcome: "review", reason: "no_candidates" };
      const payload = resultPayload({ evidence, model: null, outcome: "no_candidates", shortlistSize: 0, decision, notice });
      return await complete(payload, decision, []) ? "no_candidates" : "lease_lost";
    }
    const reserve = async () => {
      const { data, error } = await db.rpc("reserve_resource_suggestion_ai_call", {
        p_job_id: job.job_id, p_lease_token: job.lease_token, p_daily_limit: dailyLimit,
      });
      if (error) throw error;
      return data as "reserved" | "budget_exhausted" | "lease_lost";
    };
    let ai: AiResult | "budget_exhausted" | "lease_lost";
    try {
      ai = await askWithFallback(
        aiProviders((name) => Deno.env.get(name), { fallbackEnabled: settings.ai_fallback_enabled }),
        job, evidence, candidates, reserve);
    } catch (e) {
      if (e instanceof JobFailure && e.code === "ai_quota") return await waitForBudget(job, "ai_quota");
      throw e;
    }
    if (ai === "lease_lost") return "lease_lost";
    if (ai === "budget_exhausted") return await waitForBudget(job, "budget_exhausted");

    const proposed = strongUnitIds(ai.matches);
    let confirmation: Confirmation | null = null;
    if (proposed.length && settings.auto_publish_enabled && course) {
      if (!await finish(job, { current_step: "confirming" })) return "lease_lost";
      const checked = await secondOpinion(ai, job, evidence, candidates, reserve);
      if (checked === "lease_lost") return "lease_lost";
      if (checked === "budget_exhausted") return await waitForBudget(job, "budget_exhausted");
      confirmation = checked;
    }
    // Without a second opinion (no other provider, or it failed), nothing is published automatically.
    const strong = confirmation?.agreed_unit_ids ?? [];

    const decided = await decide(strong, ai.matches.find((m) => m.unit_id === strong[0])?.reason ?? "");
    if (decided === "lease_lost") return "lease_lost";
    let decision = decided;
    if (decision.outcome === "review" && decision.reason === "no_strong_match_in_course" && proposed.length) {
      decision = { ...decision, reason: "not_confirmed" };
    }
    const models = [`${ai.provider} · ${ai.model}`,
      confirmation && `confirmação ${confirmation.provider} · ${confirmation.model}${confirmation.error ? " (falhou)" : ""}`];
    const payload = resultPayload({
      evidence, model: ai.model, provider: ai.provider, fallbackFrom: ai.fallbackFrom,
      outcome: ai.matches.length ? "matched" : "no_match", shortlistSize: candidates.length,
      topics: ai.topics, matches: ai.matches, usage: ai.usage, decision, confirmation,
      notice: { ...notice, provider: models.filter(Boolean).join(" + ") },
    });
    if (!await complete(payload, decision, ai.matches)) return "lease_lost";
    return decision.outcome === "published" ? "published" : "succeeded";
  } catch (e) {
    const failure = e instanceof JobFailure
      ? e
      : new JobFailure("internal_error", e instanceof Error ? e.message : "Unexpected error", true);
    const delay = failure.transient ? retryDelayMinutes(job.attempts) : null;
    await finish(job, delay === null
      ? { ...released, status: "failed", error_code: failure.code, error_message: failure.message.slice(0, 300),
        completed_at: new Date().toISOString() }
      : { ...released, status: "retrying", error_code: failure.code, error_message: failure.message.slice(0, 300),
        next_attempt_at: new Date(Date.now() + delay * 60_000).toISOString() });
    console.error(JSON.stringify({ job: job.job_id, code: failure.code, transient: failure.transient }));
    return failure.code;
  }
}

// Authenticated rehearsal with synthetic metadata: ranking, AI and validation without any writes or budget use.
// force_provider tests one provider (for example the OpenAI fallback) in isolation.
async function dryRun(body: NonNullable<DryRunBody["dry_run"]>) {
  const input: SuggestionInput = {
    title: typeof body.title === "string" ? body.title.slice(0, 200) : "",
    canonical_url: typeof body.canonical_url === "string" ? body.canonical_url : "",
    provider: typeof body.provider === "string" ? body.provider : "web",
    object_type: typeof body.object_type === "string" ? body.object_type : "external_resource",
    language: typeof body.language === "string" ? body.language : null,
    tags: Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string").slice(0, 8) : [],
  };
  if (input.title.trim().length < 3) return json(400, { error: "title_required" });
  const include = typeof body.curricular_unit_id === "string" && UUID.test(body.curricular_unit_id)
    ? body.curricular_unit_id : null;
  const course = typeof body.course_id === "string" && UUID.test(body.course_id) ? body.course_id : null;
  const force = body.force_provider === "gemini" || body.force_provider === "openai" ? body.force_provider : null;
  const { evidence, linkedUnitIds } = await collectEvidence(input);
  const candidates = await shortlist(input, evidence, course, include);
  const listed = course || include ? listedUnitIds(linkedUnitIds, candidates, include) : [];
  if (listed.length) {
    return json(200, { ...resultPayload({ evidence, model: null, outcome: "catalog_listed",
      shortlistSize: candidates.length }), strong_unit_ids: listed });
  }
  if (candidates.length === 0) {
    return json(200, resultPayload({ evidence, model: null, outcome: "no_candidates", shortlistSize: 0 }));
  }
  try {
    const settings = await loadSettings();
    const ai = await askWithFallback(
      aiProviders((name) => Deno.env.get(name), { fallbackEnabled: settings.ai_fallback_enabled, force }),
      input, evidence, candidates, () => Promise.resolve("reserved"));
    if (typeof ai === "string") return json(500, { error: ai });
    const checked = strongUnitIds(ai.matches).length
      ? await secondOpinion(ai, input, evidence, candidates, () => Promise.resolve("reserved"))
      : null;
    const confirmation = typeof checked === "string" ? null : checked;
    return json(200, {
      ...resultPayload({ evidence, model: ai.model, provider: ai.provider, fallbackFrom: ai.fallbackFrom,
        outcome: ai.matches.length ? "matched" : "no_match", shortlistSize: candidates.length, topics: ai.topics,
        matches: ai.matches, usage: ai.usage, confirmation }),
      // Units that would be published if the suggestion passes the deterministic rules.
      strong_unit_ids: confirmation?.agreed_unit_ids ?? [],
      shortlist: candidates.map((c) => c.title),
    });
  } catch (e) {
    return json(502, e instanceof JobFailure ? { error: e.code, message: e.message } : { error: "internal_error" });
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  const secret = Deno.env.get("FACODI_SUGGESTION_WORKER_SECRET") ?? "";
  if (secret.length < 32 || !timingSafeEqual(req.headers.get("x-facodi-worker-secret") ?? "", secret)) {
    return json(401, { error: "unauthorized" });
  }
  const body = await req.json().catch(() => ({})) as DryRunBody;
  if (body && typeof body === "object" && body.dry_run && typeof body.dry_run === "object") {
    return dryRun(body.dry_run);
  }

  const dailyLimit = Math.max(Number.parseInt(Deno.env.get("FACODI_SUGGESTION_AI_DAILY_LIMIT") ?? "0", 10) || 0, 0);
  const { data, error } = await db.rpc("claim_resource_suggestion_analyses", { p_limit: 1, p_lease_seconds: 180 });
  if (error) {
    console.error(JSON.stringify({ step: "claim", message: error.message }));
    return json(500, { error: "claim_failed" });
  }
  const jobs = (data ?? []) as Job[];
  const settings = await loadSettings();
  const results: string[] = [];
  for (const job of jobs) {
    results.push(await processJob({ ...job, tags: job.tags ?? [] }, dailyLimit, settings));
  }
  const emails = await retryNotifications(settings);
  return json(200, { processed: results.length, results, emails });
});
