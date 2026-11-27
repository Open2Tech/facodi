create or replace function facodi.kf_pull_odoo_outbox_v1()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare api_key text; response extensions.http_response; records jsonb; t jsonb; notes jsonb; draft jsonb; qa jsonb; tid integer; kind text; event text; rid uuid; db_name text; headers extensions.http_header[];
begin
 if not pg_try_advisory_xact_lock(391726,2) then return jsonb_build_object('ok',true,'reason','busy'); end if;
 select decrypted_secret into api_key from vault.decrypted_secrets where name='facodi_kf_odoo_read_api_key';
 if api_key is null or length(api_key)<20 then return jsonb_build_object('ok',false,'reason','read_credential_not_configured'); end if;
 headers:=array[extensions.http_header('Authorization','bearer '||api_key)];
 select decrypted_secret into db_name from vault.decrypted_secrets where name='facodi_kf_odoo_database';
 if db_name is not null and db_name ~ '^[a-zA-Z0-9_-]{1,100}$' then headers:=headers||extensions.http_header('X-Odoo-Database',db_name); end if;
 select * into response from extensions.http(('POST','https://edu-facodi.odoo.com/json/2/project.task/search_read',headers,'application/json',jsonb_build_object('domain',jsonb_build_array(jsonb_build_array('project_id','=',1),jsonb_build_array('company_id','=',1),jsonb_build_array('parent_id','in',jsonb_build_array(111,120)),jsonb_build_array('stage_id','in',jsonb_build_array(18,19,20,21)),'|',jsonb_build_array('name','=like','KF · Checkpoint v1 · %'),jsonb_build_array('name','=like','KF · Course lesson v1 · %')),'fields',jsonb_build_array('id','name','parent_id','stage_id'),'limit',40,'order','id asc')::text)::extensions.http_request);
 if response.status<>200 then return jsonb_build_object('ok',false,'reason','odoo_task_http','status',response.status); end if;
 records:=response.content::jsonb;
 if jsonb_typeof(records) is distinct from 'array' then return jsonb_build_object('ok',false,'reason','invalid_odoo_response'); end if;
 for t in select x from jsonb_array_elements(records) x loop
   if coalesce(t->>'id','') !~ '^[0-9]{1,9}$' then continue; end if;
   tid:=(t->>'id')::integer;
   if exists(select 1 from facodi.kf_bridge_receipts where source_task_id=tid) then continue; end if;
   if t->'parent_id'->>0='111' and t->>'name' like 'KF · Checkpoint v1 · %' then kind:='checkpoint_question.v1';
   elsif t->'parent_id'->>0='120' and t->>'name' like 'KF · Course lesson v1 · %' then kind:='community_course_generation.v1';
   else continue; end if;
   select * into response from extensions.http(('POST','https://edu-facodi.odoo.com/json/2/mail.message/search_read',headers,'application/json',jsonb_build_object('domain',jsonb_build_array(jsonb_build_array('model','=','project.task'),jsonb_build_array('res_id','=',tid),jsonb_build_array('subject','in',case when kind='checkpoint_question.v1' then jsonb_build_array('KF-CHECKPOINT-DRAFT-v1','KF-CHECKPOINT-QA-v1','KF-CHECKPOINT-EXCEPTION-v1') else jsonb_build_array('KF-COURSE-LESSON-DRAFT-v1','KF-COURSE-LESSON-QA-v1','KF-COURSE-LESSON-EXCEPTION-v1') end)),'fields',jsonb_build_array('id','subject','body','res_id','date'),'limit',6,'order','id asc')::text)::extensions.http_request);
   if response.status<>200 then return jsonb_build_object('ok',false,'reason','odoo_note_http','status',response.status); end if;
   notes:=response.content::jsonb;
   if jsonb_typeof(notes) is distinct from 'array' or length(notes::text)>40000 then return jsonb_build_object('ok',false,'reason','invalid_notes'); end if;
   if exists(select 1 from jsonb_array_elements(notes) x where x->>'res_id' is distinct from tid::text) then return jsonb_build_object('ok',false,'reason','note_scope_mismatch'); end if;
   if jsonb_array_length(notes)=0 then continue; end if;
   event:='odoo:edu-facodi:outbox-v1:'||tid;
   insert into facodi.kf_bridge_receipts(source_task_id,event_key,payload,status) values(tid,event,jsonb_build_object('contract',kind,'task_name',t->>'name','parent_id',t->'parent_id'->>0,'odoo_stage',t->'stage_id'->>0,'notes',notes,'source','odoo_json2_read','editorial_decision','pending'),'received') on conflict(event_key) do nothing returning id into rid;
   return jsonb_build_object('ok',true,'reason','received','receipt_id',rid,'task_id',tid);
 end loop;
 return jsonb_build_object('ok',true,'reason','empty');
exception when others then return jsonb_build_object('ok',false,'reason','outbox_transport_error');
end $$;
revoke all on function facodi.kf_pull_odoo_outbox_v1() from public,anon,authenticated,service_role;
