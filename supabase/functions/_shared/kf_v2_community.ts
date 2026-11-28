import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";
type Mode = "submit"|"status"|"review";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET, POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json; charset=utf-8"}});
const fail=(code:string,status:number,extra:Record<string,unknown>={})=>json({success:false,error:code,...extra},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const yt=/^[A-Za-z0-9_-]{11}$/;
function videoId(value:unknown):string|null {
 if(typeof value!=="string"||value.length>2048)return null;
 if(yt.test(value.trim()))return value.trim();
 try{const u=new URL(value.trim());if(!["http:","https:"].includes(u.protocol)||u.username||u.password)return null;const parts=u.pathname.split("/");const id=u.hostname==="youtu.be"?parts[1]:["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","youtube-nocookie.com","www.youtube-nocookie.com"].includes(u.hostname)?u.pathname==="/watch"?u.searchParams.get("v"):["shorts","embed","live"].includes(parts[1])?parts[2]:null:null;return id&&yt.test(id)?id:null;}catch{return null;}
}
export function serveCommunityEndpoint(mode:Mode){
 Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST"&&!(mode==="status"&&req.method==="GET"))return fail("method_not_allowed",405);
  try{
   const token=req.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
   if(!token)return fail("unauthorized",401);
   const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY")??Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
   if(!url||!key)return fail("missing_environment",500);
   const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+token}}});
   const {data,error:authError}=await client.auth.getUser(token);
   if(authError||!data.user)return fail("unauthorized",401);
   if(mode!=="submit"&&!["editor","admin"].includes(data.user.app_metadata?.role))return fail("forbidden",403);
   let input:Record<string,unknown>={};
   if(req.method==="POST"){
    const raw=await req.text();if(raw.length>16000)return fail("payload_too_large",413);
    try{const value=JSON.parse(raw);if(!value||typeof value!=="object"||Array.isArray(value))return fail("invalid_json",400);input=value;}catch{return fail("invalid_json",400);}
   }
   const db=client.schema("facodi");
   if(mode==="submit"){
    const id=videoId(input.video_id??input.url);
    if(!id)return fail("invalid_youtube_url",400);
    if(input.license_declared!==true||input.attribution_declared!==true||typeof input.title!=="string"||input.title.trim().length<1||input.title.length>500)return fail("explicit_declarations_and_title_required",422,{submission_url:"https://facodi.com/suggest"});
    const course=input.course_id??null,unit=input.curricular_unit_id??null;
    if([course,unit].some(v=>v!==null&&(typeof v!=="string"||!uuid.test(v))))return fail("invalid_curricular_identity",400);
    const canonical="https://www.youtube.com/watch?v="+id;
    const optional=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max)||null:null;
    const {data:suggestion,error}=await db.from("resource_suggestions").insert({url:canonical,canonical_url:canonical,title:input.title.trim(),author:optional(input.author,250),license:optional(input.license,250),object_type:"video",language:optional(input.language,20),course_id:course,curricular_unit_id:unit,note:optional(input.note??input.description,2000),license_declared:true,attribution_declared:true}).select("id,status,canonical_url").single();
    if(error||!suggestion)return fail("submission_rejected",422,{submission_url:"https://facodi.com/suggest"});
    return json({success:true,suggestion_id:suggestion.id,status:suggestion.status,youtube_video_id:id,canonical_url:suggestion.canonical_url,processing:"canonical_suggestion_pipeline"},202);
   }
   if(mode==="review"){
    if(typeof input.classification_id!=="string"||!uuid.test(input.classification_id)||!["accept","reject","correct"].includes(String(input.action))||typeof input.notes!=="string"||input.notes.trim().length<10||input.notes.length>2000)return fail("invalid_review",400);
    const unit=input.curricular_unit_id??null,course=input.course_id??null;
    if([unit,course].some(v=>v!==null&&(typeof v!=="string"||!uuid.test(v))))return fail("invalid_curricular_identity",400);
    const {data:review,error}=await db.rpc("kf_review_v2_classification_v1",{p_classification:input.classification_id,p_action:input.action,p_actor:data.user.id,p_unit:unit,p_course:course,p_notes:input.notes});
    if(error||!review)return fail("database_error",500);
    return json(review,review.success?200:review.error==="forbidden"?403:409);
   }
   const search=new URL(req.url).searchParams;
   const jid=input.job_id??search.get("job_id"),vid=input.video_id??search.get("video_id"),ytid=input.youtube_video_id??search.get("youtube_video_id");
   let query=db.from("analysis_jobs").select("id,video_id,youtube_video_id,job_type,status,current_step,request_source,attempts,error_code,error_message,result_payload,created_at,updated_at,completed_at").order("created_at",{ascending:false}).limit(1);
   if(typeof jid==="string"&&uuid.test(jid))query=query.eq("id",jid);
   else if(typeof vid==="string"&&uuid.test(vid))query=query.eq("video_id",vid);
   else if(typeof ytid==="string"&&yt.test(ytid))query=query.eq("youtube_video_id",ytid);
   else return fail("missing_lookup",400);
   const {data:job,error:jobError}=await query.maybeSingle();
   if(jobError)return fail("database_error",500);if(!job)return fail("job_not_found",404);
   const result=job.result_payload??{};
   const classificationId=result.classification?.id??result.classification_id??null;
   const [v,c,e]=await Promise.all([
    job.video_id?db.from("youtube_videos").select("id,youtube_video_id,canonical_url,title,channel_title,status,learning_object_id").eq("id",job.video_id).maybeSingle():Promise.resolve({data:null,error:null}),
    typeof classificationId==="string"&&uuid.test(classificationId)?db.from("video_classifications").select("id,video_id,course_id,curricular_unit_id,status,needs_review,confidence,metadata").eq("id",classificationId).eq("video_id",job.video_id).maybeSingle():Promise.resolve({data:null,error:null}),
    db.from("analysis_job_events").select("id,event_type,message,metadata,created_at").eq("job_id",job.id).order("created_at",{ascending:true}).limit(100)
   ]);
   if(v.error||c.error||e.error)return fail("database_error",500);
   return json({success:true,auth_mode:"editor",job,video:v.data,candidates:result.candidates??result.ranking??[],classification:c.data,artifacts:result.metadata_evidence?[{artifact_type:"metadata",scope:"public_oembed_metadata_only",source:"youtube_oembed",evidence:result.metadata_evidence}]:[],events:e.data??[],publication_authorized:false});
  }catch{return fail("unexpected_error",500);}
 });
}
