
create or replace function facodi.kf_odoo_mirror_load_v1(p_model text,p_fields jsonb,p_data jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare key text; db text; hdr extensions.http_header[]; r extensions.http_response; b jsonb;
begin
 if p_model not in ('slide.channel','slide.slide') or jsonb_typeof(p_data) is distinct from 'array' or jsonb_array_length(p_data) not between 1 and 50 then raise exception 'Invalid mirror batch'; end if;
 if exists(select 1 from jsonb_array_elements(p_data) x where x->>0 not like '__import__.facodi_mirror_%') then raise exception 'Invalid mirror identifier'; end if;
 select decrypted_secret into key from vault.decrypted_secrets where name='facodi_kf_odoo_read_api_key';
 if key is null then raise exception 'Mirror credential not configured'; end if;
 hdr:=array[extensions.http_header('Authorization','bearer '||key)];
 select decrypted_secret into db from vault.decrypted_secrets where name='facodi_kf_odoo_database';
 if db is not null and db ~ '^[a-zA-Z0-9_-]{1,100}$' then hdr:=hdr||extensions.http_header('X-Odoo-Database',db); end if;
 select * into r from extensions.http(('POST','https://edu-facodi.odoo.com/json/2/'||p_model||'/load',hdr,'application/json',jsonb_build_object('fields',p_fields,'data',p_data,'context',jsonb_build_object('tracking_disable',true,'mail_create_nosubscribe',true,'active_test',false))::text)::extensions.http_request);
 if r.status<>200 then return jsonb_build_object('ok',false,'reason','remote_http','status',r.status); end if;
 b:=r.content::jsonb;
 if jsonb_typeof(b->'ids') is distinct from 'array' or jsonb_array_length(b->'ids')<>jsonb_array_length(p_data) or exists(select 1 from jsonb_array_elements(coalesce(b->'messages','[]'::jsonb)) m where m->>'type'='error') then return jsonb_build_object('ok',false,'reason','remote_import_failed','messages', (select jsonb_agg(jsonb_build_object('type',m->>'type','message',left(m->>'message',240))) from jsonb_array_elements(coalesce(b->'messages','[]'::jsonb)) m)); end if;
 return jsonb_build_object('ok',true,'ids',b->'ids');
exception when others then return jsonb_build_object('ok',false,'reason','transport_exception');
end $$;
revoke all on function facodi.kf_odoo_mirror_load_v1(text,jsonb,jsonb) from public,anon,authenticated,service_role;
create or replace function facodi.kf_odoo_elearning_sync_v1(p_limit integer default 30) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare batch jsonb; fields jsonb; rows_data jsonb; result jsonb; item jsonb; i integer; model text; phase text; lim integer:=greatest(1,least(coalesce(p_limit,30),50));
begin
 if not pg_try_advisory_xact_lock(391726,3) then return jsonb_build_object('ok',true,'phase','busy'); end if;
 -- Withdraw obsolete managed slides and channels, never touch unrelated external IDs.
 select jsonb_agg(to_jsonb(x) order by x.external_id) into batch from (select s.external_id,s.channel_key,s.model from facodi.kf_odoo_mirror_state s where s.active and s.model='slide.slide' and not exists(select 1 from facodi.kf_odoo_mirror_slides_v1 d where d.external_id=s.external_id) order by s.external_id limit lim) x;
 if batch is null then
 select jsonb_agg(to_jsonb(x) order by x.external_id) into batch from (select s.external_id,s.channel_key,s.model from facodi.kf_odoo_mirror_state s where s.active and s.model='slide.channel' and not exists(select 1 from facodi.kf_odoo_mirror_channels_v1 d where d.external_id=s.external_id) order by s.external_id limit lim) x;
 end if;
 if batch is not null then
 phase:='retire';model:=batch->0->>'model';fields:='["id","active","is_published"]'::jsonb;
 select jsonb_agg(jsonb_build_array(x->>'external_id','False','False') order by ord) into rows_data from jsonb_array_elements(batch) with ordinality t(x,ord);
 else
 -- Create / update native courses before their content.
 select jsonb_agg(to_jsonb(x) order by x.priority,x.external_id) into batch from (
 select d.*,encode(sha256(convert_to(jsonb_build_array(d.title,d.description)::text,'UTF8')),'hex') hash,coalesce(s.released and s.active,false) released
 from facodi.kf_odoo_mirror_channels_v1 d left join facodi.kf_odoo_mirror_state s on s.external_id=d.external_id
 where s.external_id is null or not s.active or s.content_hash is distinct from encode(sha256(convert_to(jsonb_build_array(d.title,d.description)::text,'UTF8')),'hex')
 order by d.priority,d.external_id limit lim) x;
 if batch is not null then
 phase:='channels';model:='slide.channel';fields:='["id","name","description","channel_type","visibility","enroll","is_published","active"]'::jsonb;
 select jsonb_agg(jsonb_build_array(x->>'external_id',x->>'title',x->>'description','documentation','public','public',case when x->>'released'='true' then 'True' else 'False' end,'True') order by ord) into rows_data from jsonb_array_elements(batch) with ordinality t(x,ord);
 else
 -- Release complete courses before proceeding with the next batches.
 select jsonb_agg(to_jsonb(x) order by x.external_id) into batch from (
 select s.external_id,s.channel_key,s.content_hash hash from facodi.kf_odoo_mirror_state s where s.model='slide.channel' and s.active and not s.released
 and exists(select 1 from facodi.kf_odoo_mirror_slides_v1 d where d.channel_key=s.external_id)
 and not exists(select 1 from facodi.kf_odoo_mirror_slides_v1 d left join facodi.kf_odoo_mirror_state ss on ss.external_id=d.external_id where d.channel_key=s.external_id and (ss.external_id is null or not ss.active or ss.content_hash is distinct from encode(sha256(convert_to(jsonb_build_array(d.channel_key,d.title,d.seq,d.html_content)::text,'UTF8')),'hex')))
 order by s.external_id limit lim) x;
 if batch is not null then
 phase:='publish_channels';model:='slide.channel';fields:='["id","is_published"]'::jsonb;
 select jsonb_agg(jsonb_build_array(x->>'external_id','True') order by ord) into rows_data from jsonb_array_elements(batch) with ordinality t(x,ord);
 else
 select jsonb_agg(to_jsonb(x) order by x.priority,x.channel_key,x.seq,x.external_id) into batch from (
 select d.*,encode(sha256(convert_to(jsonb_build_array(d.channel_key,d.title,d.seq,d.html_content)::text,'UTF8')),'hex') hash
 from facodi.kf_odoo_mirror_slides_v1 d join facodi.kf_odoo_mirror_state parent on parent.external_id=d.channel_key and parent.active
 left join facodi.kf_odoo_mirror_state s on s.external_id=d.external_id
 where s.external_id is null or not s.active or s.content_hash is distinct from encode(sha256(convert_to(jsonb_build_array(d.channel_key,d.title,d.seq,d.html_content)::text,'UTF8')),'hex')
 order by d.priority,d.channel_key,d.seq,d.external_id limit lim) x;
 if batch is null then return jsonb_build_object('ok',true,'phase','idle'); end if;
 phase:='slides';model:='slide.slide';fields:='["id","channel_id/id","name","sequence","slide_category","html_content","is_published","active"]'::jsonb;
 select jsonb_agg(jsonb_build_array(x->>'external_id',x->>'channel_key',x->>'title',x->>'seq','article',x->>'html_content','True','True') order by ord) into rows_data from jsonb_array_elements(batch) with ordinality t(x,ord);
 end if;
 end if;
 end if;
 result:=facodi.kf_odoo_mirror_load_v1(model,fields,rows_data);
 if result->>'ok' is distinct from 'true' then return result||jsonb_build_object('phase',phase); end if;
 i:=0;
 for item in select x from jsonb_array_elements(batch) x loop
 if phase='retire' then update facodi.kf_odoo_mirror_state set active=false,released=false,synced_at=now() where external_id=item->>'external_id';
 elsif phase='publish_channels' then update facodi.kf_odoo_mirror_state set released=true,synced_at=now() where external_id=item->>'external_id';
 else
 insert into facodi.kf_odoo_mirror_state(external_id,model,channel_key,remote_id,content_hash,active,released)
 values(item->>'external_id',model,item->>'channel_key',(result->'ids'->>i)::integer,item->>'hash',true,case when phase='slides' then true else coalesce((item->>'released')::boolean,false) end)
 on conflict(external_id) do update set remote_id=excluded.remote_id,channel_key=excluded.channel_key,content_hash=excluded.content_hash,active=true,released=excluded.released,synced_at=now();
 end if;
 i:=i+1;
 end loop;
 return jsonb_build_object('ok',true,'phase',phase,'processed',i);
end $$;
revoke all on function facodi.kf_odoo_elearning_sync_v1(integer) from public,anon,authenticated,service_role;
create or replace function facodi.kf_run_odoo_elearning_sync_v1() returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb;
begin
 r:=facodi.kf_odoo_elearning_sync_v1(30);
 if r->>'ok' is distinct from 'true' then raise exception 'Mirror sync failed in phase %: %',r->>'phase',r->>'reason'; end if;
 return r;
end $$;
revoke all on function facodi.kf_run_odoo_elearning_sync_v1() from public,anon,authenticated,service_role;

