import { createClient } from "npm:@supabase/supabase-js@2.110.0";
import { buildMail, deliveryFailure, isSuperseded, sameSecret, type MailEvent } from "./mail.ts";

// Only server-generated events. Requests never supply a recipient, HTML or template.
// Browser calls validate the session and playlist ownership. Cron uses the existing
// FACODI worker secret, independently of shared Supabase Auth email settings.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED = new Set(["https://facodi.com", "https://facodi.marcelo-0d6.workers.dev", "https://facodi.vercel.app"]);
const allowedOrigin = (value: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (ALLOWED.has(url.origin)) return url.origin;
    if (url.protocol === "https:" && url.hostname.endsWith(".facodi.com")) return url.origin;
    if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)
      && ["3000", "5173", "8080", "4173"].includes(url.port)) return url.origin;
  } catch { /* invalid Origin */ }
  return null;
};
const corsHeaders = (req: Request) => {
  const origin = allowedOrigin(req.headers.get("Origin"));
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8",
  };
};
const response = (req: Request, status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders(req) });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return response(req, 405, { error: "method_not_allowed" });
  if (req.headers.get("Origin") && !allowedOrigin(req.headers.get("Origin"))) {
    return response(req, 403, { error: "origin_not_allowed" });
  }
  const apiUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiUrl || !anonKey || !serviceKey) return response(req, 503, { error: "db_not_configured" });

  const workerHeader = req.headers.get("x-facodi-worker-secret");
  const worker = sameSecret(workerHeader ?? "", Deno.env.get("FACODI_SUGGESTION_WORKER_SECRET") ?? "");
  if (workerHeader !== null && !worker) return response(req, 401, { error: "unauthorized" });
  let userId: string | null = null;
  let isEditor = false;
  if (!worker) {
    const bearer = req.headers.get("Authorization") || "";
    if (!/^Bearer \S+$/i.test(bearer)) return response(req, 401, { error: "sign_in_required" });
    const client = createClient(apiUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.getUser(bearer.replace(/^Bearer /i, ""));
    if (error || !data.user) return response(req, 401, { error: "invalid_session" });
    userId = data.user.id;
    isEditor = ["editor", "admin"].includes(String(data.user.app_metadata?.role || ""));
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 2000) return response(req, 413, { error: "request_too_large" });
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid_json");
  } catch { return response(req, 400, { error: "invalid_json" }); }

  const admin = createClient(apiUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const db = admin.schema("facodi");
  const playlistId = body.playlist_id;
  // Preserve the existing browser contract; only cron can drain the entire queue.
  if (!worker) {
    if (typeof playlistId !== "string" || !UUID.test(playlistId)) {
      return response(req, 400, { error: "invalid_playlist_id" });
    }
    const { data: playlist, error } = await db.from("playlists").select("submitted_by").eq("id", playlistId).maybeSingle();
    if (error) return response(req, 500, { error: "playlist_lookup_failed" });
    if (!playlist || (!isEditor && playlist.submitted_by !== userId)) return response(req, 404, { error: "not_found" });
  }

  const resendKey = Deno.env.get("FACODI_RESEND_API_KEY");
  const sender = Deno.env.get("FACODI_EMAIL_FROM");
  const configured = !!resendKey && !!sender && /^[^<>\r\n]*<[^<>\s@]+@[^<>\s@]+>$/.test(sender);
  // Worker-only diagnostics do not send or mutate any event.
  if (worker && body.dry_run === true) return response(req, 200, { transport_configured: configured });
  if (!configured) return response(req, 503, { error: "facodi_email_transport_not_configured" });

  const now = new Date().toISOString();
  let recover = db.from("email_outbox").update({ state: "retry", locked_at: null, next_attempt_at: now,
    failure_code: "stale_email_worker", updated_at: now }).eq("state", "processing")
    .lt("locked_at", new Date(Date.now() - 15 * 60_000).toISOString());
  if (!worker) recover = recover.eq("playlist_id", playlistId);
  const { error: recoveryError } = await recover;
  let exhausted = db.from("email_outbox").update({ state: "failed", locked_at: null,
    failure_code: "retry_limit_reached", updated_at: now }).in("state", ["pending", "retry"]).gte("attempts", 5);
  if (!worker) exhausted = exhausted.eq("playlist_id", playlistId);
  const { error: exhaustedError } = await exhausted;
  if (exhaustedError) return response(req, 500, { error: "queue_recovery_failed" });
  if (recoveryError) return response(req, 500, { error: "queue_recovery_failed" });

  let query = db.from("email_outbox")
    .select("id,event_key,recipient_user_id,playlist_id,suggestion_id,template_name,event_payload,attempts,created_at,first_attempt_at")
    .in("state", ["pending", "retry"]).lt("attempts", 5).lte("next_attempt_at", now)
    .order("created_at", { ascending: true }).order("id").limit(worker ? 10 : 4);
  if (!worker) query = query.eq("playlist_id", playlistId);
  const { data: queued, error: queueError } = await query;
  if (queueError) return response(req, 500, { error: "queue_unavailable" });

  let sent = 0, skipped = 0, failed = 0;
  for (const event of (queued ?? []) as MailEvent[]) {
    const suggestion = !!event.suggestion_id;

    // Atomic compare-and-set prevents browser/cron workers claiming the same event.
    const timestamp = new Date().toISOString();
    const { data: claimed, error: claimError } = await db.from("email_outbox")
      .update({ state: "processing", attempts: event.attempts + 1, locked_at: timestamp, updated_at: timestamp })
      .eq("id", event.id).eq("attempts", event.attempts).in("state", ["pending", "retry"])
      .select("id").maybeSingle();
    if (claimError) return response(req, 500, { error: "claim_failed", sent, skipped, failed });
    if (!claimed) continue;
    const save = async (values: Record<string, unknown>) => {
      const { error } = await db.from("email_outbox").update({ ...values, locked_at: null, updated_at: new Date().toISOString() })
        .eq("id", event.id).eq("state", "processing").eq("attempts", event.attempts + 1);
      if (error) throw new Error("queue_update_failed");
    };
    try {
      let providerBody: string;
      if (event.first_attempt_at) {
        // Resend retains keys for 24h. Only a recorded provider request starts
        // this window; queue claims and failed lookups do not start it.
        if (Date.now() - Date.parse(event.first_attempt_at) >= 23 * 60 * 60_000) {
          await save({ state: "failed", failure_code: "idempotency_window_expired" });
          failed++;
          continue;
        }
        const original = event.event_payload._delivery_request;
        if (typeof original !== "string" || !original) {
          // Legacy ambiguous attempts cannot be reconstructed safely with a new body.
          await save({ state: "failed", failure_code: "delivery_snapshot_missing" });
          failed++;
          continue;
        }
        // Reconcile the original operation, even if locale, email, review or
        // publication changed. Access to a now-private resource remains RLS-protected.
        providerBody = original;
      } else {
        const { data: submission, error: sourceError } = suggestion
          ? await db.from("resource_suggestions").select("submitted_by,status,learning_object_id")
            .eq("id", event.suggestion_id!).maybeSingle()
          : await db.from("playlists").select("submitted_by,status")
            .eq("id", event.playlist_id!).maybeSingle();
        if (sourceError) {
          await save({ state: "retry", next_attempt_at: new Date(Date.now() + 60_000).toISOString(), failure_code: "submission_lookup_failed" });
          failed++;
          continue;
        }

        if (isSuperseded(event, submission)) {
          await save({ state: "skipped", failure_code: "superseded" });
          skipped++;
          continue;
        }
        const { data: target, error: userError } = await admin.auth.admin.getUserById(event.recipient_user_id);
        if (userError) {
          if (userError.status !== 404) {
            await save({ state: "retry", next_attempt_at: new Date(Date.now() + 60_000).toISOString(), failure_code: "recipient_lookup_failed" });
            failed++;
            continue;
          }
        }
        if (!target?.user?.email || userError) {
          await save({ state: "failed", failure_code: "recipient_not_found" });
          failed++;
          continue;
        }
        let publicSlug: string | undefined;
        const objectId = submission && "learning_object_id" in submission ? submission.learning_object_id : null;
        if (suggestion && event.template_name === "suggestion_approved" && objectId) {
          const { data: resource } = await db.from("learning_objects").select("slug")
            .eq("id", objectId).eq("published", true).in("status", ["active", "published"]).maybeSingle();
          publicSlug = resource?.slug;
        }
        const metadata = target.user.user_metadata;
        const mail = buildMail(event, metadata?.locale ?? metadata?.language ?? "pt", publicSlug);
        providerBody = JSON.stringify({ from: sender, to: [target.user.email], subject: mail.subject, html: mail.html, text: mail.text });
        // Write ahead immediately before the first provider request. Keep the exact
        // serialized body in the private outbox; jsonb must not reorder its fields.
        const preparedAt = new Date().toISOString();
        const { data: prepared, error: prepareError } = await db.from("email_outbox")
          .update({ event_payload: { ...event.event_payload, _delivery_request: providerBody },
            first_attempt_at: preparedAt, updated_at: preparedAt })
          .eq("id", event.id).eq("state", "processing").eq("attempts", event.attempts + 1)
          .select("id").maybeSingle();
        if (prepareError) throw new Error("queue_update_failed");
        if (!prepared) continue; // The lease was lost; do not contact the provider.
      }
      let httpStatus = 0;
      let providerMessageId: string | null = null;
      let providerError: string | undefined;
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", "Idempotency-Key": event.event_key },
          body: providerBody,
          signal: AbortSignal.timeout(12_000),
        });
        httpStatus = res.status;
        if (res.ok) {
          const payload = await res.json().catch(() => ({})) as { id?: unknown };
          if (typeof payload.id === "string" && payload.id) providerMessageId = payload.id;
          else httpStatus = 0; // An ambiguous response is retried with the same key.
        } else if (httpStatus === 409) {
          const payload = await res.json().catch(() => ({})) as { name?: unknown } | null;
          if (typeof payload?.name === "string") providerError = payload.name;
        }
      } catch { httpStatus = 0; }
      if (providerMessageId) {
        await save({ state: "sent", provider_message_id: providerMessageId, sent_at: new Date().toISOString(), failure_code: null });
        sent++;
      } else {
        const failure = deliveryFailure(httpStatus, event.attempts, providerError);
        await save({ state: failure.retry ? "retry" : "failed", failure_code: failure.code,
          next_attempt_at: new Date(Date.now() + failure.delaySeconds * 1000).toISOString() });
        failed++;
      }
    } catch {
      // A failed persistence operation leaves its lease recoverable by the next cron.
      return response(req, 500, { error: "queue_update_failed", sent, skipped, failed });
    }
  }
  return response(req, 200, { sent, skipped, failed });
});
