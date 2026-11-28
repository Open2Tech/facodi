create or replace function facodi.kf_pull_diagnosis_delivery_v1() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare k text; db text; headers extensions.http_header[]; resp extensions.http_response; tasks jsonb; t jsonb; notes jsonb; n jsonb; parts text[]; tid int; uid uuid; digest text; source_id int; mo_id int; plan_item jsonb; rid uuid; receipt_status text;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('facodi.kf_pull_diagnosis_delivery_v1',0)) then return jsonb_build_object('ok',true,'reason','busy'); end if;
 select decrypted_secret into k from vault.decrypted_secrets where name='facodi_kf_odoo_read_api_key';
 if k is null or length(k)<20 then return jsonb_build_object('ok',false,'reason','credential_unavailable'); end if;
 headers:=array[extensions.http_header('Authorization','bearer '||k)];
 select decrypted_secret into db from vault.decrypted_secrets where name='facodi_kf_odoo_database';
 if db is not null and db ~ '^[a-zA-Z0-9_-]{1,100}$' then headers:=headers||extensions.http_header('X-Odoo-Database',db); end if;
 select * into resp from extensions.http(('POST','https://edu-facodi.odoo.com/json/2/project.task/search_read',headers,'application/json',jsonb_build_object('domain',jsonb_build_array(jsonb_build_array('project_id','=',1),jsonb_build_array('company_id','=',1),jsonb_build_array('stage_id','=',19),jsonb_build_array('name','=like','KF · Produção v1 · Diagnóstico · %'),jsonb_build_array('id','not in',coalesce((select jsonb_agg(source_task_id) from facodi.kf_bridge_receipts where payload->>'contract'='diagnosis_delivery.v1'),'[]'::jsonb))),'fields',jsonb_build_array('id','name','description','stage_id'),'limit',20,'order','id asc')::text)::extensions.http_request);
 if resp.status<>200 then return jsonb_build_object('ok',false,'reason','task_http','status',resp.status); end if;
 if length(resp.content)>200000 then return jsonb_build_object('ok',false,'reason','oversize_response'); end if;
 tasks:=resp.content::jsonb;
 if jsonb_typeof(tasks) is distinct from 'array' or jsonb_array_length(tasks)>20 then return jsonb_build_object('ok',false,'reason','invalid_response'); end if;
 for t in select value from jsonb_array_elements(tasks) loop
  if coalesce(t->>'id','') !~ '^[1-9][0-9]{0,8}$' or t->'stage_id'->>0 is distinct from '19' or t->>'name' not like 'KF · Produção v1 · Diagnóstico · %' then continue; end if;
  tid:=(t->>'id')::int;
  select * into resp from extensions.http(('POST','https://edu-facodi.odoo.com/json/2/mail.message/search_read',headers,'application/json',jsonb_build_object('domain',jsonb_build_array(jsonb_build_array('model','=','project.task'),jsonb_build_array('res_id','=',tid),jsonb_build_array('subject','=','KF-DIAGNOSIS-RECEIPT-v1')),'fields',jsonb_build_array('id','subject','body','res_id'),'limit',2)::text)::extensions.http_request);
  if resp.status<>200 then return jsonb_build_object('ok',false,'reason','note_http','status',resp.status); end if;
  if length(resp.content)>10000 then return jsonb_build_object('ok',false,'reason','oversize_note'); end if;
  notes:=resp.content::jsonb;
  if jsonb_typeof(notes) is distinct from 'array' or jsonb_array_length(notes)<>1 then continue; end if;
  n:=notes->0;
  if n->>'res_id' is distinct from tid::text or n->>'subject' is distinct from 'KF-DIAGNOSIS-RECEIPT-v1' then continue; end if;
  parts:=regexp_match(n->>'body','^<p>KF-DIAGNOSIS-v1[|]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})[|]([0-9a-f]{64})[|]([1-9][0-9]{0,8})[|]([1-9][0-9]{0,8})[|]5[|]5[|]done</p>$');
  if parts is null then continue; end if;
  uid:=parts[1]::uuid;digest:=parts[2];source_id:=parts[3]::int;mo_id:=parts[4]::int;
  if position('KF-DEMAND-v1: '||uid::text||'</p>' in coalesce(t->>'description',''))=0 or position('KF-DEMAND-DIGEST: '||digest||'</p>' in coalesce(t->>'description',''))=0 or position('KF-TRIAGE-TASK: '||source_id::text||'</p>' in coalesce(t->>'description',''))=0 or position('KF-MRP: KF-DIAGNOSIS</p>' in coalesce(t->>'description',''))=0 then continue; end if;
  if not exists(select 1 from facodi.kf_production_demands where signal_type='curricular_gap' and subject_id=uid) then continue; end if;
  select x into plan_item from jsonb_array_elements(facodi.kf_demand_plan_v1()->'items') x where x->>'unit_id'=uid::text and x->>'digest'=digest and t->>'name'='KF · Produção v1 · Diagnóstico · '||(x->>'title');
  receipt_status:=case when plan_item is not null then 'applied' else 'received' end;
  insert into facodi.kf_bridge_receipts(source_task_id,event_key,payload,status) values(tid,'odoo:edu-facodi:diagnosis-delivery-v1:'||tid,jsonb_build_object('contract','diagnosis_delivery.v1','source','odoo_json2_read','scope','catalog_observation_only','unit_id',uid,'demand_digest',digest,'triage_task_id',source_id,'manufacturing_order_id',mo_id,'reported_operations_done',5,'reported_quality_pass',5,'reported_order_state','done','odoo_note_id',n->>'id','current_plan_matches',plan_item is not null,'plan_item',plan_item,'publication_authorized',false,'demand_resolved',false),receipt_status) on conflict(event_key) do nothing returning id into rid;
  return jsonb_build_object('ok',true,'reason','receipt_reconciled','receipt_id',rid,'task_id',tid,'status',receipt_status);
 end loop;
 return jsonb_build_object('ok',true,'reason','empty');
exception when others then return jsonb_build_object('ok',false,'reason','diagnosis_outbox_error','sqlstate',SQLSTATE);
end $$;
revoke all on function facodi.kf_pull_diagnosis_delivery_v1() from public,anon,authenticated,service_role;
