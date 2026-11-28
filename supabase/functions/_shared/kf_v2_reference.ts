import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-facodi-webhook-secret","Access-Control-Allow-Methods":"POST, OPTIONS"};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ytId = /^[A-Za-z0-9_-]{11}$/;
const stages = ["v2_fetch_youtube_metadata","v2_extract_video_content","v2_match_video_candidates","v2_classify_video","v2_generate_embeddings"] as const;
type Stage = typeof stages[number];
type Mode = "ingest" | "pipeline" | Stage;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json; charset=utf-8"}});
const error = (code: string, status: number) => json({success:false,error:code},status);

function extractId(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  const text = value.trim();
  if (ytId.test(text)) return text;
  try {
    const url = new URL(text);
    if (!["https:","http:"].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.split("/")[1];
    else if (["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","www.youtube-nocookie.com","youtube-nocookie.com"].includes(host)) {
      const parts = url.pathname.split("/");
      id = url.pathname === "/watch" ? url.searchParams.get("v") : ["shorts","embed","live"].includes(parts[1]) ? parts[2] : null;
    }
    return id && ytId.test(id) ? id : null;
  } catch { return null; }
}
function equalSecret(a: string,b: string): boolean {
  if (a.length!==b.length) return false;
  let diff=0;
  for (let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
function rpcStatus(code: string): number {
  if (code==="job_not_found_or_out_of_scope") return 404;
  if (code==="source_unverified") return 502;
  if (["ambiguous_catalog_identity","existing_identity_conflict","video_identity_conflict","job_state_or_retry_limit","metadata_required","extraction_required","candidates_required"].includes(code)) return 409;
  return 400;
}

export function serveReferenceEndpoint(mode: Mode) {
  Deno.serve(async (req: Request) => {
    if (req.method==="OPTIONS") return new Response("ok",{headers:cors});
    if (req.method!=="POST") return error("method_not_allowed",405);
    try {
      const url=Deno.env.get("SUPABASE_URL");
      const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??Deno.env.get("SUPABASE_SECRET_KEY");
      if (!url||!key) return error("missing_environment",500);
      const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
      let actor: string|null=null;
      let authMode="editor";
      // Only the historical orchestrator accepted the internal worker secret.
      const configured=mode==="pipeline" ? Deno.env.get("FACODI_WEBHOOK_SECRET")?.trim() : undefined;
      const provided=req.headers.get("x-facodi-webhook-secret")?.trim();
      if (configured && provided && equalSecret(configured,provided)) authMode="secret";
      else {
        const token=req.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
        if (!token) return error("unauthorized",401);
        const {data,error:authError}=await admin.auth.getUser(token);
        if (authError||!data.user) return error("unauthorized",401);
        // Match facodi.is_facodi_editor(): only server-managed app_metadata.role.
        if (!["editor","admin"].includes(data.user.app_metadata?.role)) return error("forbidden",403);
        actor=data.user.id;
      }
      const raw=await req.text();
      if (raw.length>16000) return error("payload_too_large",413);
      let payload: Record<string,unknown>;
      try { const parsed=JSON.parse(raw); if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)) return error("invalid_json",400); payload=parsed; } catch { return error("invalid_json",400); }
      const db=admin.schema("facodi");
      if (mode==="ingest") {
        const id=extractId(payload.video_id??payload.url);
        if (!id) return error("invalid_youtube_url",400);
        const metadata=payload.metadata&&typeof payload.metadata==="object"&&!Array.isArray(payload.metadata) ? payload.metadata as Record<string,unknown> : {};
        const course=payload.course_id??metadata.course_id??null;
        if (course!==null&&(typeof course!=="string"||!uuid.test(course))) return error("invalid_course_scope",400);
        const {data,error:dbError}=await db.rpc("kf_v2_ingest_reference_v1",{p_youtube_id:id,p_course_id:course,p_actor:actor});
        if(dbError||!data) return error("database_error",500);
        return json({...data,auth_mode:authMode},data.success===true?200:rpcStatus(data.error));
      }
      let jobId=payload.job_id;
      if (jobId!==undefined&&jobId!==null&&(typeof jobId!=="string"||!uuid.test(jobId))) return error("invalid_job_id",400);
      if (!jobId&&mode!=="pipeline") {
        let query=db.from("analysis_jobs").select("id").eq("request_source","facodi_editor_pipeline").eq("job_type","classify_youtube_video").eq("input_payload->>contract","v2_reference_review.v1").neq("status","cancelled");
        if (typeof payload.video_id==="string"&&uuid.test(payload.video_id)) query=query.eq("video_id",payload.video_id);
        else if (typeof payload.youtube_video_id==="string"&&ytId.test(payload.youtube_video_id)) query=query.eq("youtube_video_id",payload.youtube_video_id);
        else return error("missing_job_id",400);
        const {data,error:lookupError}=await query.limit(2);
        if(lookupError) return error("database_error",500);
        if(data?.length!==1) return error(data?.length?"ambiguous_job_id":"job_not_found_or_out_of_scope",data?.length?409:404);
        jobId=data[0].id;
      }
      if(typeof jobId!=="string"||!uuid.test(jobId)) return error("missing_job_id",400);
      const requested=mode==="pipeline" ? (payload.stages??stages.slice(0,4)) : [mode];
      if(!Array.isArray(requested)||requested.length<1||requested.length>5||requested.some(s=>typeof s!=="string"||!stages.includes(s as Stage))) return error("invalid_pipeline_stage",400);
      const {data,error:dbError}=await db.rpc("kf_v2_process_reference_v1",{p_job:jobId,p_stages:requested,p_retry:payload.retry_failed===true});
      if(dbError||!data) return error("database_error",500);
      return json({...data,auth_mode:authMode,request_id:crypto.randomUUID(),scope:"metadata_only",events:[]},data.success===true?200:rpcStatus(data.error));
    } catch { return error("unexpected_error",500); }
  });
}
