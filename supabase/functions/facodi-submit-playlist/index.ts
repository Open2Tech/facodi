import { createClient } from "npm:@supabase/supabase-js@2.110.0";

// FACODI-specific playlist submission: never writes public.playlists or public.playlist_videos.
type Body = {
  course_id?: unknown;
  curricular_unit_id?: unknown;
  playlist_url?: unknown;
  title?: unknown;
  description?: unknown;
  language?: unknown;
  max_videos?: unknown;
  youtube_video_ids?: unknown;
};
type Meta = { youtubeId: string; title: string; channel: string; thumbnail: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const LIST_ID = /^[A-Za-z0-9_-]{10,120}$/;

function permittedOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    const h = u.hostname.toLowerCase();
    if (u.protocol === "http:" && (h === "localhost" || h === "127.0.0.1") &&
        ["3000", "8080", "4173"].includes(u.port)) return value;
    if (u.protocol !== "https:") return null;
    if (["facodi.vercel.app", "facodi.com", "tube.open2.tech", "open2.tech", "marcelo-m7.com",
         "marcelo-m7.me"].includes(h) || [".facodi.com", ".open2.tech",
         ".marcelo-m7.com", ".marcelo-m7.me", ".marcelo-0d6.workers.dev"]
         .some((suffix) => h.endsWith(suffix))) return value;
  } catch { /* invalid origin */ }
  return null;
}
function headers(req: Request): Record<string, string> {
  const origin = permittedOrigin(req.headers.get("Origin"));
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
}
function respond(req: Request, status: number, data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), { status, headers: headers(req) });
}
function youtubePlaylist(raw: unknown): { id: string; url: string } | null {
  if (typeof raw !== "string" || raw.length > 500) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" ||
        !["youtube.com", "www.youtube.com", "m.youtube.com",
          "music.youtube.com", "youtu.be"].includes(u.hostname.toLowerCase())) return null;
    const id = u.searchParams.get("list");
    return id && LIST_ID.test(id)
      ? { id, url: "https://www.youtube.com/playlist?list=" + encodeURIComponent(id) } : null;
  } catch { return null; }
}
function getVideoIds(html: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const patterns = [
    /"playlistVideoRenderer"\s*:\s*\{[\s\S]{0,1200}?"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"/g,
    /"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"/g,
    /\/watch\?v=([A-Za-z0-9_-]{11})/g,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      if (!seen.has(m[1])) { seen.add(m[1]); ids.push(m[1]); }
    }
  }
  return ids;
}
function extractTitle(html: string) {
  const m = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
            html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/\s*-\s*YouTube$/i, "").trim().slice(0, 200) : null;
}
async function loadPlaylist(url: string): Promise<{ html: string; error?: string }> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FACODIPlaylistImporter/1.0)" },
    });
    if (!r.ok) return { html: "", error: "youtube_http_" + r.status };
    const size = Number(r.headers.get("content-length") || 0);
    if (size > 10_000_000) return { html: "", error: "youtube_page_too_large" };
    const html = await r.text();
    return html.length <= 10_000_000 ? { html }
      : { html: "", error: "youtube_page_too_large" };
  } catch { return { html: "", error: "youtube_unreachable" }; }
}
async function metadata(youtubeId: string): Promise<Meta | null> {
  try {
    const watch = "https://www.youtube.com/watch?v=" + youtubeId;
    const res = await fetch(
      "https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(watch),
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const json = await res.json() as Record<string, unknown>;
    if (typeof json.title !== "string" || !json.title.trim()) return null;
    return {
      youtubeId,
      title: json.title.trim().slice(0, 300),
      channel: typeof json.author_name === "string" && json.author_name.trim()
        ? json.author_name.trim().slice(0, 200) : "YouTube",
      thumbnail: typeof json.thumbnail_url === "string" &&
        /^https:\/\/(i\.ytimg\.com|img\.youtube\.com)\//.test(json.thumbnail_url)
        ? json.thumbnail_url : "https://i.ytimg.com/vi/" + youtubeId + "/hqdefault.jpg",
    };
  } catch { return null; }
}
async function mapConcurrent<T, R>(
  items: T[], workers: number, fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const result: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(workers, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      result[i] = await fn(items[i]);
    }
  }));
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(req) });
  if (req.method !== "POST") return respond(req, 405, { error: "method_not_allowed" });
  if (req.headers.get("Origin") && !permittedOrigin(req.headers.get("Origin"))) {
    return respond(req, 403, { error: "origin_not_allowed" });
  }
  if (Number(req.headers.get("content-length") || 0) > 32000) {
    return respond(req, 413, { error: "request_too_large" });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !secret) return respond(req, 503, { error: "missing_supabase_configuration" });

  const bearer = req.headers.get("Authorization") || "";
  if (!/^Bearer \S+$/i.test(bearer)) return respond(req, 401, { error: "sign_in_required" });
  const api = createClient(url, anon, {
    global: { headers: { Authorization: bearer } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await api.auth.getUser(bearer.replace(/^Bearer /i, ""));
  if (authError || !auth.user) return respond(req, 401, { error: "invalid_session" });
  const user = auth.user;

  let body: Body;
  try { body = await req.json() as Body; }
  catch { return respond(req, 400, { error: "invalid_json" }); }

  const playlist = youtubePlaylist(body.playlist_url);
  if (!playlist || typeof body.course_id !== "string" || !UUID.test(body.course_id) ||
      typeof body.curricular_unit_id !== "string" || !UUID.test(body.curricular_unit_id)) {
    return respond(req, 400, { error: "invalid_course_unit_or_youtube_playlist" });
  }
  const description = typeof body.description === "string" ? body.description.trim() : null;
  if (description && description.length > 2000) {
    return respond(req, 400, { error: "description_too_long" });
  }
  const language = typeof body.language === "string" ? body.language.trim().toLowerCase() : "pt";
  if (!/^[a-z]{2,3}(-[a-z]{2})?$/.test(language)) {
    return respond(req, 400, { error: "invalid_language" });
  }
  const limit = typeof body.max_videos === "number" && Number.isFinite(body.max_videos)
    ? Math.max(1, Math.min(100, Math.floor(body.max_videos))) : 50;

  // Validate the actual course/UC relation with user RLS before fetching YouTube.
  const { data: unit, error: unitError } = await api.schema("facodi")
    .from("curricular_units").select("id,course_id")
    .eq("id", body.curricular_unit_id).eq("course_id", body.course_id).maybeSingle();
  if (unitError || !unit) return respond(req, 403, { error: "unit_not_accessible" });

  const editor = ["editor", "admin"].includes(String(user.app_metadata?.role ?? ""));
  if (!editor) {
    const since = new Date(Date.now() - 3600000).toISOString();
    const { count, error } = await api.schema("facodi").from("playlists")
      .select("id", { count: "exact", head: true })
      .eq("submitted_by", user.id).gte("submitted_at", since);
    if (error) return respond(req, 500, { error: "rate_limit_check_failed" });
    if ((count ?? 0) >= 3) return respond(req, 429, { error: "too_many_submissions" });
  }

  let ids: string[] = [];
  let inferredTitle: string | null = null;
  if (Array.isArray(body.youtube_video_ids) && body.youtube_video_ids.length) {
    if (body.youtube_video_ids.length > 100 ||
        body.youtube_video_ids.some((id) => typeof id !== "string" || !VIDEO_ID.test(id))) {
      return respond(req, 400, { error: "invalid_youtube_video_ids" });
    }
    ids = [...new Set(body.youtube_video_ids as string[])].slice(0, limit);
  } else {
    const source = await loadPlaylist(playlist.url);
    if (source.error) return respond(req, 502, { error: source.error });
    ids = getVideoIds(source.html).slice(0, limit);
    inferredTitle = extractTitle(source.html);
  }
  if (!ids.length) return respond(req, 422, { error: "playlist_videos_not_detected" });

  const title = typeof body.title === "string" && body.title.trim()
    ? body.title.trim().slice(0, 200)
    : inferredTitle || ("YouTube playlist " + playlist.id);
  if (title.length < 3) return respond(req, 400, { error: "title_too_short" });

  const { data: known, error: lookupError } = await api.from("videos")
    .select("id,youtube_id").in("youtube_id", ids);
  if (lookupError) return respond(req, 500, { error: "video_lookup_failed" });
  const knownIds = new Set((known || []).map((r) => r.youtube_id));
  const missing = ids.filter((id) => !knownIds.has(id));
  let importedCount = 0;

  // Only shared write: insert newly discovered videos into public.videos.
  // Never create any Tube/public playlist or Tube submission rows.
  if (missing.length) {
    const admin = createClient(url, secret, { auth: { persistSession: false } });
    const { data: profile } = await admin.from("profiles")
      .select("id").eq("id", user.id).maybeSingle();
    const found = await mapConcurrent(missing, 5, metadata);
    const valid = found.filter((row): row is Meta => row !== null);
    for (let i = 0; i < valid.length; i += 25) {
      const values = valid.slice(i, i + 25).map((v) => ({
        youtube_id: v.youtubeId, title: v.title, description: null,
        channel_name: v.channel, thumbnail_url: v.thumbnail,
        duration_seconds: null, language,
        submitted_by: profile ? user.id : null, view_count: 0, is_featured: false,
      }));
      const { error } = await admin.from("videos").upsert(values, {
        onConflict: "youtube_id", ignoreDuplicates: true,
      });
      if (error) {
        console.error("facodi_video_catalog_insert", error.code);
        break; // Unresolved items remain queued in facodi.playlist_items.
      }
      importedCount += values.length;
    }
  }

  // Runs under the caller's JWT and applies FACODI RLS.
  const { data: playlistId, error: createError } = await api.schema("facodi")
    .rpc("submit_playlist", {
      p_course_id: body.course_id,
      p_curricular_unit_id: body.curricular_unit_id,
      p_youtube_playlist_id: playlist.id,
      p_title: title,
      p_description: description,
      p_language: language,
      p_youtube_video_ids: ids,
    });
  if (createError || !playlistId) {
    console.error("facodi_playlist_submit", createError?.code);
    const limited = createError?.message?.includes("rate limit") || false;
    return respond(req, limited ? 429 : 400, {
      error: limited ? "too_many_submissions" : "playlist_submission_failed",
      detail: createError?.code || null,
    });
  }

  // Repeated submissions may link items which have since entered public.videos.
  const { error: reconciliationError } = await api.schema("facodi")
    .rpc("reconcile_playlist_items", { p_playlist_id: playlistId });
  if (reconciliationError) {
    console.warn("facodi_playlist_reconciliation_skipped", reconciliationError.code);
  }

  const { data: record } = await api.schema("facodi").from("playlists")
    .select("id,title,status,import_status").eq("id", playlistId).maybeSingle();
  const { data: items } = await api.schema("facodi").from("playlist_items")
    .select("youtube_video_id,video_id").eq("playlist_id", playlistId);

  return respond(req, 201, {
    playlist_id: playlistId,
    course_id: body.course_id,
    curricular_unit_id: body.curricular_unit_id,
    title: record?.title ?? title,
    review_status: record?.status ?? "pending",
    import_status: record?.import_status ?? "pending",
    playlist_video_count: items?.length ?? ids.length,
    linked_video_count: (items || []).filter((item) => !!item.video_id).length,
    missing_video_count: (items || []).filter((item) => !item.video_id).length,
    reused_video_count: knownIds.size,
    new_video_import_attempts: importedCount,
    youtube_playlist_url: playlist.url,
  });
});
