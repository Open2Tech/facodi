import { createClient } from "npm:@supabase/supabase-js@2.110.0";
import {
  buildMessages, type Candidate, classifyAiStatus, type Evidence, InvalidOutput, JobFailure, nextUtcDay,
  parseMatches, responseSchema, resultPayload, retryDelayMinutes, shortlistText, type SuggestionInput,
  timingSafeEqual,
} from "./analysis.ts";

// Advisory analysis of learner resource suggestions (docs/suggest-ai-analysis-plan.md).
// Called by pg_cron through pg_net with a shared secret; never by browsers.
// It only writes facodi.analysis_jobs (and budget events): nothing is approved, linked or published.

type Job = SuggestionInput & {
  job_id: string;
  lease_token: string;
  attempts: number;
  suggestion_status: string;
  curricular_unit_id: string | null;
};
type DryRunBody = { dry_run?: Partial<SuggestionInput> & { curricular_unit_id?: string | null } };

const VIDEO = /^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AI_TIMEOUT_MS = 25_000;
// Gemini through its OpenAI-compatible API; the model can be changed without redeploying.
const AI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_AI_MODEL = "gemini-2.5-flash";

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

// Only YouTube oEmbed is fetched: arbitrary submitted URLs are never requested server-side.
async function collectEvidence(input: SuggestionInput): Promise<Evidence> {
  const evidence: Evidence = { level: "metadata_only", sources: ["submission"], title: input.title, author: null };
  if (!VIDEO.test(input.canonical_url)) return evidence;
  try {
    const res = await fetchWithTimeout("https://www.youtube.com/oembed?format=json&url=" +
      encodeURIComponent(input.canonical_url), {}, 5_000);
    if (!res.ok) return evidence;
    const data = await res.json() as { title?: unknown; author_name?: unknown };
    if (typeof data.title === "string" && data.title.trim()) {
      evidence.title = data.title.trim().slice(0, 200);
      evidence.sources.push("youtube_oembed");
    }
    if (typeof data.author_name === "string") evidence.author = data.author_name.trim().slice(0, 120) || null;
  } catch { /* oEmbed is optional evidence */ }
  return evidence;
}

async function shortlist(input: SuggestionInput, evidence: Evidence, include: string | null): Promise<Candidate[]> {
  const { data, error } = await db.rpc("rank_resource_suggestion_units", {
    p_text: shortlistText(input, evidence), p_include: include, p_limit: 12,
  });
  if (error) throw error;
  return (data ?? []) as Candidate[];
}

type AiResult = { model: string; topics: string[]; matches: ReturnType<typeof parseMatches>["matches"];
  usage: { input_tokens: number; output_tokens: number } | null };

async function askAi(input: SuggestionInput, evidence: Evidence, candidates: Candidate[]): Promise<AiResult> {
  const key = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("FACODI_SUGGESTION_AI_MODEL") || DEFAULT_AI_MODEL;
  if (!key) throw new JobFailure("not_configured", "GEMINI_API_KEY is not configured", false);
  let res: Response;
  try {
    res = await fetchWithTimeout(AI_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: buildMessages(input, evidence, candidates),
        response_format: {
          type: "json_schema",
          json_schema: { name: "facodi_unit_matches", strict: true, schema: responseSchema(candidates) },
        },
        // Matching needs little reasoning; "low" is accepted by every current Gemini model.
        reasoning_effort: "low",
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
      ...parsed,
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

async function processJob(job: Job, dailyLimit: number): Promise<string> {
  if (job.suggestion_status !== "pending") {
    await finish(job, { ...released, status: "cancelled", current_step: "completed", completed_at: new Date().toISOString() });
    return "cancelled";
  }
  try {
    const evidence = await collectEvidence(job);
    if (!await finish(job, { current_step: "matching" })) return "lease_lost";
    const candidates = await shortlist(job, evidence, job.curricular_unit_id);
    if (candidates.length === 0) {
      await finish(job, {
        ...released, status: "succeeded", current_step: "completed", completed_at: new Date().toISOString(),
        result_payload: resultPayload({ evidence, model: null, outcome: "no_candidates", shortlistSize: 0 }),
      });
      return "no_candidates";
    }
    const { data: reservation, error } = await db.rpc("reserve_resource_suggestion_ai_call", {
      p_job_id: job.job_id, p_lease_token: job.lease_token, p_daily_limit: dailyLimit,
    });
    if (error) throw error;
    if (reservation === "lease_lost") return "lease_lost";
    if (reservation === "budget_exhausted") return await waitForBudget(job, "budget_exhausted");
    let ai: AiResult;
    try {
      ai = await askAi(job, evidence, candidates);
    } catch (e) {
      if (e instanceof JobFailure && e.code === "ai_quota") return await waitForBudget(job, "ai_quota");
      throw e;
    }
    await finish(job, {
      ...released, status: "succeeded", current_step: "completed", completed_at: new Date().toISOString(),
      result_payload: resultPayload({
        evidence, model: ai.model, outcome: ai.matches.length ? "matched" : "no_match",
        shortlistSize: candidates.length, topics: ai.topics, matches: ai.matches, usage: ai.usage,
      }),
    });
    return "succeeded";
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
  const evidence = await collectEvidence(input);
  const candidates = await shortlist(input, evidence, include);
  if (candidates.length === 0) {
    return json(200, resultPayload({ evidence, model: null, outcome: "no_candidates", shortlistSize: 0 }));
  }
  try {
    const ai = await askAi(input, evidence, candidates);
    return json(200, {
      ...resultPayload({ evidence, model: ai.model, outcome: ai.matches.length ? "matched" : "no_match",
        shortlistSize: candidates.length, topics: ai.topics, matches: ai.matches, usage: ai.usage }),
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
  const { data, error } = await db.rpc("claim_resource_suggestion_analyses", { p_limit: 3, p_lease_seconds: 180 });
  if (error) {
    console.error(JSON.stringify({ step: "claim", message: error.message }));
    return json(500, { error: "claim_failed" });
  }
  const results: string[] = [];
  for (const job of (data ?? []) as Job[]) {
    results.push(await processJob({ ...job, tags: job.tags ?? [] }, dailyLimit));
  }
  return json(200, { processed: results.length, results });
});
