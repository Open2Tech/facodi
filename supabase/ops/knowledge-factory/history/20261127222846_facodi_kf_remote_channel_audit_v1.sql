create table if not exists facodi.kf_mirror_remote_audit (
 audit_day date primary key,
 observed_at timestamptz not null default now(),
 result jsonb not null
);
alter table facodi.kf_mirror_remote_audit enable row level security;
revoke all on facodi.kf_mirror_remote_audit from public,anon,authenticated,service_role;
create or replace function facodi.kf_audit_odoo_mirror_remote_v1()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare k text; db text; hdr extensions.http_header[]; r extensions.http_response; b jsonb; expected jsonb; result jsonb; n integer; received integer; matched integer; wanted_slides integer; actual_slides integer; day date:=(now() at time zone 'UTC')::date;
begin
 if not pg_try_advisory_xact_lock(391726,3) then return jsonb_build_object('ok',true,'reason','mirror_busy'); end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.remote_id,'title',d.title,'count',coalesce(z.n,0)) order by s.remote_id),'[]'::jsonb),count(*),coalesce(sum(z.n),0) into expected,n,wanted_slides
 from facodi.kf_odoo_mirror_channels_v1 d join facodi.kf_odoo_mirror_state s on s.external_id=d.external_id and s.model='slide.channel' and s.active and s.released and s.remote_id is not null
 left join (select channel_key,count(*) n from facodi.kf_odoo_mirror_slides_v1 group by 1) z on z.channel_key=d.external_id;
 if n not between 1 and 100 or (select count(distinct x->>'id') from jsonb_array_elements(expected) x)<>n then
  result:=jsonb_build_object('ok',false,'reason','invalid_channel_scope');
 else
  begin
   select decrypted_secret into k from vault.decrypted_secrets where name='facodi_kf_odoo_read_api_key';
   if k is null then raise exception 'Credential unavailable'; end if;
   hdr:=array[extensions.http_header('Authorization','bearer '||k)];
   select decrypted_secret into db from vault.decrypted_secrets where name='facodi_kf_odoo_database';
   if db is not null and db ~ '^[a-zA-Z0-9_-]{1,100}$' then hdr:=hdr||extensions.http_header('X-Odoo-Database',db); end if;
   select * into r from extensions.http(('POST','https://edu-facodi.odoo.com/json/2/slide.channel/search_read',hdr,'application/json',jsonb_build_object('domain',jsonb_build_array(jsonb_build_array('id','in',(select jsonb_agg((x->>'id')::int) from jsonb_array_elements(expected) x))),'fields',jsonb_build_array('id','name','active','is_published','total_slides'),'limit',100,'context',jsonb_build_object('active_test',false))::text)::extensions.http_request);
   if r.status<>200 then result:=jsonb_build_object('ok',false,'reason','remote_http','http_status',r.status);
   elsif length(r.content)>250000 then result:=jsonb_build_object('ok',false,'reason','oversize_response');
   else
    b:=r.content::jsonb;
    if jsonb_typeof(b) is distinct from 'array' or jsonb_array_length(b)>100 then raise exception 'Invalid response'; end if;
    received:=jsonb_array_length(b);
    if (select count(distinct x->>'id') from jsonb_array_elements(b) x)<>received then raise exception 'Duplicate remote identifiers'; end if;
    select count(*),coalesce(sum((x->>'total_slides')::int),0) into matched,actual_slides from jsonb_array_elements(b) x join jsonb_array_elements(expected) e on x->>'id'=e->>'id' where x->>'name'=e->>'title' and x->>'active'='true' and x->>'is_published'='true' and x->>'total_slides'=e->>'count';
    result:=jsonb_build_object('ok',matched=n and received=n and actual_slides=wanted_slides,'reason',case when matched=n and received=n and actual_slides=wanted_slides then 'matched' else 'remote_mismatch' end,'expected_channels',n,'received_channels',received,'matched_channels',matched,'expected_slides',wanted_slides,'slides_in_matched_channels',actual_slides,'scope','remote_channel_identity_title_publication_and_slide_count');
   end if;
  exception when others then result:=jsonb_build_object('ok',false,'reason','transport_or_response_error'); end;
 end if;
 result:=result||jsonb_build_object('observed_at',clock_timestamp());
 insert into facodi.kf_mirror_remote_audit(audit_day,observed_at,result) values(day,clock_timestamp(),result) on conflict(audit_day) do update set observed_at=excluded.observed_at,result=excluded.result;
 delete from facodi.kf_mirror_remote_audit where audit_day<day-30;
 return result;
end $$;
revoke all on function facodi.kf_audit_odoo_mirror_remote_v1() from public,anon,authenticated,service_role;
