import {createClient} from "npm:@supabase/supabase-js@2.45.4";
const respond=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
Deno.serve(async req=>{
 if(req.method!=="POST") return respond(405,{ok:false});
 const token=new URL(req.url).searchParams.get("cap");
 if(!token||!/^[0-9a-f]{64}$/.test(token)) return respond(401,{ok:false});
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,"0")).join("");
 let body;try{const raw=await req.text();if(raw.length>24000)return respond(413,{ok:false});body=JSON.parse(raw);if(!body||typeof body!=="object"||Array.isArray(body))return respond(400,{ok:false});}catch{return respond(400,{ok:false});}
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!key)return respond(503,{ok:false});
 const supabase=createClient(url,key,{auth:{persistSession:false}});
 const {data,error}=await supabase.schema("facodi").rpc("kf_receive_editorial_receipt",{p_hash:hash,p_payload:body});
 if(error)return respond(503,{ok:false});if(!data?.ok)return respond(data?.reason==="unauthorized"?401:400,{ok:false});
 return respond(data.inserted?201:200,{ok:true,receipt_id:data.receipt_id,inserted:data.inserted});
});