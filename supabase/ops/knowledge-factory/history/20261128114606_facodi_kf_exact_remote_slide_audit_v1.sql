create table facodi.kf_mirror_slide_audit (
 external_id text primary key,
 remote_id integer not null,
 expected_hash text not null,
 observed_at timestamptz not null default now(),
 outcome text not null check(outcome in ('matched','missing','mismatch')),
 differences text[] not null default '{}'
);
alter table facodi.kf_mirror_slide_audit enable row level security;
revoke all on facodi.kf_mirror_slide_audit from public,anon,authenticated,service_role;
create or replace function facodi.kf_audit_odoo_slides_v1(p_limit integer default 100)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare k text; db text; hdr extensions.http_header[]; r extensions.http_response; expected jsonb; actual jsonb; e jsonb; x jsonb; diff text[]; v_outcome text; n int; v_matched int:=0; v_missing int:=0; v_mismatch int:=0; lim int:=greatest(1,least(coalesce(p_limit,100),100));
begin
 if not pg_try_advisory_xact_lock(391726,3) then return jsonb_build_object('ok',true,'reason','mirror_busy'); end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.external_id),'[]'::jsonb) into expected from (
 select d.external_id,s.remote_id,d.title,d.seq,d.html_content,c.remote_id channel_id,s.content_hash expected_hash
 from facodi.kf_odoo_mirror_slides_v1 d
 join facodi.kf_odoo_mirror_state s on s.external_id=d.external_id and s.model='slide.slide' and s.active and s.released and s.remote_id>0
 join facodi.kf_odoo_mirror_state c on c.external_id=d.channel_key and c.model='slide.channel' and c.active and c.released and c.remote_id>0
 left join facodi.kf_mirror_slide_audit a on a.external_id=d.external_id
 where s.content_hash=encode(sha256(convert_to(jsonb_build_array(d.channel_key,d.title,d.seq,d.html_content,'public-preview-v1')::text,'UTF8')),'hex')
 and (a.external_id is null or a.remote_id is distinct from s.remote_id or a.expected_hash is distinct from s.content_hash or a.observed_at<now()-interval '7 days')
 order by case when a.external_id is null or a.remote_id is distinct from s.remote_id or a.expected_hash is distinct from s.content_hash then 0 else 1 end,a.observed_at nulls first,d.priority,d.external_id limit lim
 ) q;
 n:=jsonb_array_length(expected);
 if n=0 then return jsonb_build_object('ok',true,'reason','idle'); end if;
 if (select count(distinct y->>'remote_id') from jsonb_array_elements(expected)y)<>n then return jsonb_build_object('ok',false,'reason','duplicate_ledger_id'); end if;
 select decrypted_secret into k from vault.decrypted_secrets where name='facodi_kf_odoo_read_api_key';
 if k is null then return jsonb_build_object('ok',false,'reason','credential_unavailable'); end if;
 hdr:=array[extensions.http_header('Authorization','bearer '||k)];
 select decrypted_secret into db from vault.decrypted_secrets where name='facodi_kf_odoo_database';
 if db is not null and db ~ '^[a-zA-Z0-9_-]{1,100}$' then hdr:=hdr||extensions.http_header('X-Odoo-Database',db); end if;
 begin
 if not extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS','15000') then raise exception 'timeout_not_configured'; end if;
 select * into r from extensions.http(('POST','https://edu-facodi.odoo.com/json/2/slide.slide/search_read',hdr,'application/json',jsonb_build_object('domain',jsonb_build_array(jsonb_build_array('id','in',(select jsonb_agg((y->>'remote_id')::int) from jsonb_array_elements(expected)y))),'fields',jsonb_build_array('id','name','channel_id','sequence','html_content','active','is_published','is_preview','slide_category'),'context',jsonb_build_object('active_test',false),'limit',n)::text)::extensions.http_request);
 perform extensions.http_reset_curlopt();
 exception when others then perform extensions.http_reset_curlopt(); return jsonb_build_object('ok',false,'reason','transport_error'); end;
 if r.status<>200 then return jsonb_build_object('ok',false,'reason','remote_http','http_status',r.status); end if;
 if length(r.content)>3000000 then return jsonb_build_object('ok',false,'reason','oversize_response'); end if;
 actual:=r.content::jsonb;
 if jsonb_typeof(actual) is distinct from 'array' or jsonb_array_length(actual)>n or (select count(distinct y->>'id') from jsonb_array_elements(actual)y)<>jsonb_array_length(actual) or exists(select 1 from jsonb_array_elements(actual)y where not exists(select 1 from jsonb_array_elements(expected)z where z->>'remote_id'=y->>'id')) then return jsonb_build_object('ok',false,'reason','invalid_response'); end if;
 for e in select value from jsonb_array_elements(expected) loop
  select y into x from jsonb_array_elements(actual)y where y->>'id'=e->>'remote_id';
  diff:='{}';
  if x is null then v_outcome:='missing';v_missing:=v_missing+1;
  else
   if x->>'name' is distinct from e->>'title' then diff:=array_append(diff,'title');end if;
   if x->'channel_id'->>0 is distinct from e->>'channel_id' then diff:=array_append(diff,'channel');end if;
   if x->>'sequence' is distinct from e->>'seq' then diff:=array_append(diff,'sequence');end if;
   if x->>'html_content' is distinct from e->>'html_content' then diff:=array_append(diff,'html');end if;
   if x->>'active' is distinct from 'true' then diff:=array_append(diff,'active');end if;
   if x->>'is_published' is distinct from 'true' then diff:=array_append(diff,'published');end if;
   if x->>'is_preview' is distinct from 'true' then diff:=array_append(diff,'preview');end if;
   if x->>'slide_category' is distinct from 'article' then diff:=array_append(diff,'category');end if;
   if cardinality(diff)=0 then v_outcome:='matched';v_matched:=v_matched+1;else v_outcome:='mismatch';v_mismatch:=v_mismatch+1;end if;
  end if;
  insert into facodi.kf_mirror_slide_audit(external_id,remote_id,expected_hash,observed_at,outcome,differences)
  values(e->>'external_id',(e->>'remote_id')::int,e->>'expected_hash',clock_timestamp(),v_outcome,diff)
  on conflict(external_id) do update set remote_id=excluded.remote_id,expected_hash=excluded.expected_hash,observed_at=excluded.observed_at,outcome=excluded.outcome,differences=excluded.differences;
 end loop;
 return jsonb_build_object('ok',true,'reason','audited','checked',n,'matched',v_matched,'missing',v_missing,'mismatch',v_mismatch,'scope','exact_remote_article_fields');
exception when others then return jsonb_build_object('ok',false,'reason','audit_error','sqlstate',SQLSTATE);
end $$;
revoke all on function facodi.kf_audit_odoo_slides_v1(integer) from public,anon,authenticated,service_role;
create or replace function facodi.kf_mirror_slide_audit_health_v1() returns jsonb language sql stable security invoker set search_path='' as $$
with desired as materialized(select d.external_id,s.remote_id,s.content_hash,
case when s.external_id is null or not s.active or not s.released or s.content_hash is distinct from encode(sha256(convert_to(jsonb_build_array(d.channel_key,d.title,d.seq,d.html_content,'public-preview-v1')::text,'UTF8')),'hex') then 'ledger_pending'
when a.external_id is null or a.remote_id is distinct from s.remote_id or a.expected_hash is distinct from s.content_hash then 'not_checked'
when a.observed_at<now()-interval '7 days' then 'stale'
else a.outcome end state
from facodi.kf_odoo_mirror_slides_v1 d left join facodi.kf_odoo_mirror_state s on s.external_id=d.external_id left join facodi.kf_mirror_slide_audit a on a.external_id=d.external_id)
select jsonb_build_object('scope','exact_remote_article_fields','desired',count(*),'matched',count(*) filter(where state='matched'),'missing',count(*) filter(where state='missing'),'mismatch',count(*) filter(where state='mismatch'),'stale',count(*) filter(where state='stale'),'not_checked',count(*) filter(where state='not_checked'),'ledger_pending',count(*) filter(where state='ledger_pending'),'observed_at',now()) from desired
$$;
revoke all on function facodi.kf_mirror_slide_audit_health_v1() from public,anon,authenticated,service_role;
create or replace function facodi.kf_run_slide_audit_v1() returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb; begin r:=facodi.kf_audit_odoo_slides_v1(100);if r->>'ok' is distinct from 'true' then raise exception 'KF slide audit: %',coalesce(r->>'reason','unknown');end if;return r;end $$;
revoke all on function facodi.kf_run_slide_audit_v1() from public,anon,authenticated,service_role;
create or replace function facodi.kf_run_remote_channel_audit_v2() returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb; begin
 if exists(select 1 from facodi.kf_mirror_remote_audit where audit_day=(now() at time zone 'UTC')::date and result->>'ok'='true') then return jsonb_build_object('ok',true,'reason','already_audited');end if;
 r:=facodi.kf_audit_odoo_mirror_remote_v1();
 if r->>'reason'='mirror_busy' then raise exception 'KF channel audit deferred: mirror busy';end if;
 return r;
end $$;
revoke all on function facodi.kf_run_remote_channel_audit_v2() from public,anon,authenticated,service_role;
