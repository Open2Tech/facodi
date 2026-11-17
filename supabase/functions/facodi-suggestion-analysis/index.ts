import { createClient } from "npm:@supabase/supabase-js@2.110.0";
import {
  type AiProvider, type AiProviderName, aiProviders, buildMessages, type Candidate, classifyAiStatus, type Decision,
  type Evidence, InvalidOutput, JobFailure, nextUtcDay, parseMatches, responseSchema, resultPayload,
  retryDelayMinutes, shortlistText, strongUnitIds, type SuggestionInput, timingSafeEqual,
} from "./analysis.ts";
import { buildNotification, type PipelineSettings } from "./notification.ts";

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
};
type DryRunBody = {
  dry_run?: Partial<SuggestionInput> & { curricular_unit_id?: string | null; force_provider?: AiProviderName };
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

async function loadSettings(): Promise<PipelineSettings> {
  const { data, error } = await db.from("suggestion_pipeline_settings").select("*").maybeSingle();
  if (error || !data) console.error(JSON.stringify({ step: "settings", message: error?.message ?? "missing" }));
  return (data as PipelineSettings | null) ?? SAFE_SETTINGS;
}

// With a chosen unit the whole course is the shortlist, so matching does not depend on shared words.
async function shortlist(input: SuggestionInput, evidence: Evidence, include: string | null): Promise<Candidate[]> {
  const { data, error } = await db.rpc("rank_resource_suggestion_units", {
    p_text: shortlistText(input, evidence), p_include: include, p_limit: include ? 80 : 12,
    p_course_only: include !== null,
  });
  if (error) throw error;
  return (data ?? []) as Candidate[];
}

type AiResult = { model: string; provider: AiProviderName; fallbackFrom: string | null; topics: string[];
  matches: ReturnType<typeof parseMatches>["matches"]; usage: { input_tokens: number; output_tokens: number } | null };

// Both providers speak the OpenAI chat completions format with strict JSON schema output.
async function askAi(provider: AiProvider, input: SuggestionInput, evidence: Evidence, candidates: Candidate[]) {
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

async function notify(job: Job, settings: PipelineSettings, args: Parameters<typeof buildNotification>[1]) {
  const message = buildNotification(settings, args);
  const key = Deno.env.get("FACODI_RESEND_API_KEY") || Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("FACODI_EMAIL_FROM") || Deno.env.get("RESEND_FROM_EMAIL");
  if (!message) return;
  let event = "email_sent";
  let detail = message.to;
  if (!key || !from) {
    event = "email_failed";
    detail = "not_configured";
  } else {
    try {
      const res = await fetchWithTimeout("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`, "Content-Type": "application/json",
          // A retried job never emails twice for the same attempt.
          "Idempotency-Key": `facodi-suggestion-${job.job_id}-${job.attempts}`,
        },
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
  // Email is best effort: a failure is recorded but never fails or retries the analysis.
  await db.from("analysis_job_events").insert({ job_id: job.job_id, event_type: event, message: detail });
}

async function processJob(job: Job, dailyLimit: number, settings: PipelineSettings): Promise<string> {
  if (job.suggestion_status !== "pending" && job.suggestion_status !== "duplicate") {
    await finish(job, { ...released, status: "cancelled", current_step: "completed", completed_at: new Date().toISOString() });
    return "cancelled";
  }
  try {
    const evidence = await collectEvidence(job);
    if (!await finish(job, { current_step: "matching" })) return "lease_lost";
    const candidates = await shortlist(job, evidence, job.curricular_unit_id);
    const chosen = candidates.find((c) => c.id === job.curricular_unit_id) ?? null;
    const notice = { title: job.title, url: job.canonical_url, author: evidence.author,
      chosenUnit: chosen && { title: chosen.title, course_title: chosen.course_title } };
    if (candidates.length === 0) {
      const decision: Decision = { outcome: "review", reason: "no_candidates" };
      if (!await finish(job, {
        ...released, status: "succeeded", current_step: "completed", completed_at: new Date().toISOString(),
        result_payload: resultPayload({ evidence, model: null, outcome: "no_candidates", shortlistSize: 0, decision }),
      })) return "lease_lost";
      await notify(job, settings, { ...notice, decision, matches: [], provider: null });
      return "no_candidates";
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

    if (!await finish(job, { current_step: "deciding" })) return "lease_lost";
    const strong = strongUnitIds(ai.matches);
    const { data: decided, error: decideError } = await db.rpc("auto_publish_resource_suggestion", {
      p_job_id: job.job_id, p_lease_token: job.lease_token, p_unit_ids: strong,
      p_reason: ai.matches.find((m) => m.fit === "strong")?.reason ?? "",
    });
    if (decideError) throw decideError;
    const decision = decided as Decision;
    if (decision.outcome === "skipped" && decision.reason === "lease_lost") return "lease_lost";
    if (!await finish(job, {
      ...released, status: "succeeded", current_step: "completed", completed_at: new Date().toISOString(),
      result_payload: resultPayload({
        evidence, model: ai.model, provider: ai.provider, fallbackFrom: ai.fallbackFrom,
        outcome: ai.matches.length ? "matched" : "no_match", shortlistSize: candidates.length,
        topics: ai.topics, matches: ai.matches, usage: ai.usage, decision,
      }),
    })) return "lease_lost";
    await notify(job, settings, { ...notice, decision, matches: ai.matches, provider: `${ai.provider} · ${ai.model}` });
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
  const force = body.force_provider === "gemini" || body.force_provider === "openai" ? body.force_provider : null;
  const evidence = await collectEvidence(input);
  const candidates = await shortlist(input, evidence, include);
  if (candidates.length === 0) {
    return json(200, resultPayload({ evidence, model: null, outcome: "no_candidates", shortlistSize: 0 }));
  }
  try {
    const settings = await loadSettings();
    const ai = await askWithFallback(
      aiProviders((name) => Deno.env.get(name), { fallbackEnabled: settings.ai_fallback_enabled, force }),
      input, evidence, candidates, () => Promise.resolve("reserved"));
    if (typeof ai === "string") return json(500, { error: ai });
    return json(200, {
      ...resultPayload({ evidence, model: ai.model, provider: ai.provider, fallbackFrom: ai.fallbackFrom,
        outcome: ai.matches.length ? "matched" : "no_match", shortlistSize: candidates.length, topics: ai.topics,
        matches: ai.matches, usage: ai.usage }),
      // Units that would be published if the suggestion passes the deterministic rules.
      strong_unit_ids: strongUnitIds(ai.matches),
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
  const jobs = (data ?? []) as Job[];
  const settings = jobs.length ? await loadSettings() : SAFE_SETTINGS;
  const results: string[] = [];
  for (const job of jobs) {
    results.push(await processJob({ ...job, tags: job.tags ?? [] }, dailyLimit, settings));
  }
  return json(200, { processed: results.length, results });
});
