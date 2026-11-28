import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET, POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json; charset=utf-8"}});
const fail=(error:string,status:number)=>json({success:false,error},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const yt=/^[A-Za-z0-9_-]{11}$/;
function extractId(value:unknown):string|null {
 if(typeof value!=="string"||value.length>2048)return null;
 const t=value.trim();if(yt.test(t))return t;
 try{const u=new URL(t);if(!["https:","http:"].includes(u.protocol)||u.username||u.password)return null;const s=u.pathname.split("/");const id=u.hostname==="youtu.be"?s[1]:["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","youtube-nocookie.com","www.youtube-nocookie.com"].includes(u.hostname)?u.pathname==="/watch"?u.searchParams.get("v"):["shorts","embed","live"].includes(s[1])?s[2]:null:null;return id&&yt.test(id)?id:null;}catch{return null;}
}
export function serveBatchStatus(mode:"channel"|"submission_status"){
 Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST"&&!(mode==="submission_status"&&req.method==="GET"))return fail("method_not_allowed",405);
  try{
   const token=req.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
   if(!token)return fail("unauthorized",401);
   const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY")??Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
   if(!url||!key)return fail("missing_environment",500);
   const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+token}}});
   const {data,error:authError}=await client.auth.getUser(token);
   if(authError||!data.user)return fail("unauthorized",401);
   const editor=["editor","admin"].includes(data.user.app_metadata?.role);
   let input:Record<string,unknown>={};
   if(req.method==="POST"){
    const raw=await req.text();if(raw.length>100000)return fail("payload_too_large",413);
    if(raw.trim()){try{const value=JSON.parse(raw);if(!value||typeof value!=="object"||Array.isArray(value))return fail("invalid_json",400);input=value;}catch{return fail("invalid_json",400);}}
   }
   if(mode==="channel"){
    if(!editor)return fail("forbidden",403);
    if(!Array.isArray(input.videos)||input.videos.length<1||input.videos.length>20)return fail("invalid_batch",400);
    const ids=input.videos.map(item=>item&&typeof item==="object"&&!Array.isArray(item)?extractId((item as Record<string,unknown>).video_id??(item as Record<string,unknown>).url):null);
    if(ids.some(id=>!id))return fail("invalid_youtube_url",400);
    const course=input.course_id??null;
    if(course!==null&&(typeof course!=="string"||!uuid.test(course)))return fail("invalid_course_scope",400);
    if(input.start_processing!==undefined&&typeof input.start_processing!=="boolean")return fail("invalid_processing_flag",400);
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??Deno.env.get("SUPABASE_SECRET_KEY");
    if(!service)return fail("missing_environment",500);
    const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:batch,error}=await admin.schema("facodi").rpc("kf_v2_enqueue_channel_v1",{p_youtube_ids:ids,p_course_id:course,p_actor:data.user.id,p_start:input.start_processing!==false});
    if(error||!batch)return fail("database_error",500);
    return json(batch,batch.success?202:400);
   }
   const query=new URL(req.url).searchParams;
   const suggestionId=input.suggestion_id??query.get("suggestion_id");
   const jobId=input.job_id??query.get("job_id");
   if((suggestionId==null)===(jobId==null))return fail("provide_one_lookup",400);
   const id=suggestionId??jobId;
   if(typeof id!=="string"||!uuid.test(id))return fail("invalid_lookup",400);
   const db=client.schema("facodi");
   if(suggestionId!=null){
    let q=db.from("resource_suggestions").select("id,title,canonical_url,status,learning_object_id,reviewed_at,updated_at").eq("id",id);
    if(!editor)q=q.eq("submitted_by",data.user.id);
    const {data:suggestion,error}=await q.maybeSingle();
    if(error)return fail("database_error",500);if(!suggestion)return fail("not_found",404);
    let jobs=db.from("analysis_jobs").select("id,status,current_step,created_at,updated_at,completed_at").eq("resource_suggestion_id",suggestion.id).order("created_at",{ascending:false}).limit(1);
    if(!editor)jobs=jobs.eq("requested_by",data.user.id);
    const {data:job,error:jobError}=await jobs.maybeSingle();
    if(jobError)return fail("database_error",500);
    return json({success:true,suggestion_id:suggestion.id,status:suggestion.status,suggestion,job,processing:"canonical_suggestion_pipeline"});
   }
   let q=db.from("analysis_jobs").select("id,job_type,status,current_step,resource_suggestion_id,youtube_video_id,created_at,updated_at,completed_at").eq("id",id);
   if(!editor)q=q.eq("requested_by",data.user.id);
   const {data:job,error}=await q.maybeSingle();
   if(error)return fail("database_error",500);if(!job)return fail("not_found",404);
   return json({success:true,job_id:job.id,status:job.status,job});
  }catch{return fail("unexpected_error",500);}
 });
}
