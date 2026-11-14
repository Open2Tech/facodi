import { createClient } from "npm:@supabase/supabase-js@2.110.0";

/**
 * FACODI transaction notifications (never Supabase Auth).
 *
 * Authorization: signed-in contributor owning the playlist or FACODI editor.
 * Data: server-generated facodi.email_outbox only, no arbitrary recipients,
 * templates, HTML, or message body from the request.
 *
 * Requires FACODI_RESEND_API_KEY and FACODI_EMAIL_FROM from a verified sending domain.
 * Without both, returns 503 and keeps events pending. Does NOT borrow the
 * shared Tube/Monynha sender address.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED = new Set(["https://facodi.vercel.app", "https://facodi.com"]);
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
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  };
};
const response = (req: Request, status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders(req) });

const escape = (text: unknown) => String(text ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");
const plain = (text: unknown) => String(text ?? "").slice(0, 2000);

type MailKind = "playlist_received" | "playlist_approved" | "playlist_rejected";
type Event = {
  id: string; event_key: string; recipient_user_id: string;
  template_name: MailKind; event_payload: Record<string, unknown>;
  attempts: number;
};
type Playlist = { id: string; title: string; submitted_by: string; status: string };

function buildMail(event: Event) {
  const kind = event.template_name;
  const title = plain(event.event_payload.playlist_title).slice(0, 200);
  const note = plain(event.event_payload.review_note);
  const heading = kind === "playlist_received" ? "Recebemos a sua playlist"
    : kind === "playlist_approved" ? "A sua playlist foi aprovada"
    : "Atualização da sua playlist";
  const detail = kind === "playlist_received"
    ? "A sugestão entrou na fila de revisão editorial da FACODI. A submissão não implica publicação automática."
    : kind === "playlist_approved"
    ? "A revisão editorial foi concluída e a sua playlist foi aprovada."
    : "A playlist não foi aprovada nesta revisão. Pode consultar o estado da submissão na FACODI.";
  const noteMarkup = note && kind !== "playlist_received"
    ? `<p style="line-height:1.65;margin:18px 0 0;color:#31435d"><strong>Observação da revisão:</strong> ${escape(note)}</p>`
    : "";
  const content = `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#faf9f2;font-family:Arial,Helvetica,sans-serif;color:#142846">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #d5dfe7;background:#ffffff">
<tr><td style="background:#142846;padding:26px 32px;border-bottom:4px solid #efff00">
<strong style="color:#ffffff;font-size:25px;letter-spacing:1px">FACODI</strong>
<div style="font-size:12px;color:#efff00;margin-top:5px">Faculdade Comunitária Digital</div></td></tr>
<tr><td style="padding:30px 32px"><h1 style="font-size:24px;line-height:1.3;margin:0 0 18px">${heading}</h1>
<p style="font-size:15px;line-height:1.65">${detail}</p>
<p style="font-size:15px;line-height:1.65"><strong>Playlist:</strong> ${escape(title)}</p>
${noteMarkup}
<p style="margin:26px 0 12px"><a href="https://facodi.vercel.app/playlists/submit" style="display:inline-block;padding:13px 19px;background:#efff00;color:#142846;font-weight:700;text-decoration:none">Consultar as minhas submissões</a></p>
<p style="font-size:12px;color:#526173;line-height:1.6">Mensagem transacional associada a uma submissão feita na FACODI. Não partilhe códigos ou palavras-passe por email.</p>
</td></tr></table></td></tr></table></body></html>`;
  return {
    subject: `FACODI · ${heading}`,
    html: content,
    text: `${heading}\n\n${detail}\n\nPlaylist: ${title}${note && kind !== "playlist_received" ? `\nObservação: ${note}` : ""}\n\nhttps://facodi.vercel.app/playlists/submit`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (req.method !== "POST") return response(req, 405, { error: "method_not_allowed" });
  if (req.headers.get("Origin") && !allowedOrigin(req.headers.get("Origin"))) {
    return response(req, 403, { error: "origin_not_allowed" });
  }
  if (Number(req.headers.get("content-length") || 0) > 2000) {
    return response(req, 413, { error: "request_too_large" });
  }

  const apiUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiUrl || !anonKey || !serviceKey) return response(req, 503, { error: "db_not_configured" });

  const bearer = req.headers.get("Authorization") || "";
  if (!/^Bearer \S+$/i.test(bearer)) return response(req, 401, { error: "sign_in_required" });
  const jwt = bearer.replace(/^Bearer /i, "");
  const client = createClient(apiUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: bearer } },
  });
  const { data: auth, error: authError } = await client.auth.getUser(jwt);
  if (authError || !auth.user) return response(req, 401, { error: "invalid_session" });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return response(req, 400, { error: "invalid_json" }); }
  const playlistId = body?.playlist_id;
  if (typeof playlistId !== "string" || !UUID.test(playlistId)) {
    return response(req, 400, { error: "invalid_playlist_id" });
  }

  const admin = createClient(apiUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: playlist, error: playlistError } = await admin.schema("facodi")
    .from("playlists").select("id,title,submitted_by,status")
    .eq("id", playlistId).maybeSingle();
  if (playlistError) return response(req, 500, { error: "playlist_lookup_failed" });
  if (!playlist) return response(req, 404, { error: "not_found" });

  const isEditor = ["editor", "admin"].includes(String(auth.user.app_metadata?.role || ""));
  if (playlist.submitted_by !== auth.user.id && !isEditor) {
    return response(req, 404, { error: "not_found" });
  }

  const resendKey = Deno.env.get("FACODI_RESEND_API_KEY");
  const sender = Deno.env.get("FACODI_EMAIL_FROM");
  if (!resendKey || !sender || !/^[^<>\r\n]*<[^<>\s@]+@[^<>\s@]+>$/.test(sender)) {
    // Never fall back to another product's sending identity.
    return response(req, 503, { error: "facodi_email_transport_not_configured" });
  }

  const { data: queued, error: queueError } = await admin.schema("facodi")
    .from("email_outbox")
    .select("id,event_key,recipient_user_id,template_name,event_payload,attempts,state,created_at")
    .eq("playlist_id", playlistId)
    .in("state", ["pending", "retry"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true }).limit(4);
  if (queueError) return response(req, 500, { error: "queue_unavailable" });

  let sent = 0, skipped = 0, failed = 0;
  for (const queuedEvent of queued || []) {
    const event = queuedEvent as Event;
    if ((event.template_name === "playlist_received" && playlist.status !== "pending") ||
        (event.template_name === "playlist_approved" && playlist.status !== "approved") ||
        (event.template_name === "playlist_rejected" && playlist.status !== "rejected")) {
      await admin.schema("facodi").from("email_outbox")
        .update({ state: "skipped", failure_code: "superseded", updated_at: new Date().toISOString() })
        .eq("id", event.id).in("state", ["pending", "retry"]);
      skipped++;
      continue;
    }

    const now = new Date().toISOString();
    const { data: claimed, error: claimError } = await admin.schema("facodi")
      .from("email_outbox")
      .update({ state: "processing", attempts: event.attempts + 1, locked_at: now, updated_at: now })
      .eq("id", event.id).eq("attempts", event.attempts)
      .in("state", ["pending", "retry"]).select("id").maybeSingle();
    if (claimError || !claimed) continue;

    const { data: target, error: userError } = await admin.auth.admin.getUserById(event.recipient_user_id);
    if (userError || !target?.user?.email) {
      await admin.schema("facodi").from("email_outbox")
        .update({ state: "failed", failure_code: "recipient_not_found", updated_at: new Date().toISOString() })
        .eq("id", event.id);
      failed++;
      continue;
    }

    const mail = buildMail(event);
    let success = false;
    let providerMessageId: string | null = null;
    let httpStatus = 0;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": event.event_key.slice(0, 200),
        },
        body: JSON.stringify({
          from: sender, to: [target.user.email],
          subject: mail.subject, html: mail.html, text: mail.text,
        }),
        signal: AbortSignal.timeout(12000),
      });
      httpStatus = res.status;
      if (res.ok) {
        const data = await res.json().catch(() => ({})) as { id?: string };
        success = true;
        providerMessageId = data.id ?? null;
      }
    } catch {
      httpStatus = 0;
    }

    if (success) {
      await admin.schema("facodi").from("email_outbox")
        .update({ state: "sent", provider_message_id: providerMessageId,
          sent_at: new Date().toISOString(), failure_code: null, locked_at: null,
          updated_at: new Date().toISOString() }).eq("id", event.id);
      sent++;
    } else {
      const transient = httpStatus === 0 || httpStatus === 429 || httpStatus >= 500;
      const retry = transient && event.attempts < 4;
      const delay = Math.min(3600, 60 * Math.pow(2, event.attempts));
      await admin.schema("facodi").from("email_outbox")
        .update({
          state: retry ? "retry" : "failed",
          failure_code: httpStatus ? "email_provider_http_" + httpStatus : "email_provider_timeout",
          locked_at: null,
          next_attempt_at: new Date(Date.now() + delay * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      failed++;
    }
  }
  return response(req, 200, { processed: sent + skipped + failed, sent, skipped, failed });
});
