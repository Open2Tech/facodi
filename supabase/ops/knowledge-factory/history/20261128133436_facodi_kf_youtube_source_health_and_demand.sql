create table facodi.kf_youtube_source_health (
 learning_object_id uuid primary key references facodi.learning_objects(id) on delete cascade,
 youtube_id text not null check(youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
 observed_at timestamptz not null,
 outcome text not null check(outcome in ('available','unavailable_response','unverified')),
 http_status integer,
 consecutive_unavailable_days integer not null default 0 check(consecutive_unavailable_days>=0),
 last_unavailable_day date,
 next_check_at timestamptz not null
);
alter table facodi.kf_youtube_source_health enable row level security;
revoke all on facodi.kf_youtube_source_health from public,anon,authenticated,service_role;
create or replace view facodi.kf_youtube_source_scope_v1 with (security_invoker=true) as
select id learning_object_id,source_id youtube_id,source_url,slug from facodi.learning_objects
where object_type='video' and published and status in ('active','published') and source_id ~ '^[A-Za-z0-9_-]{11}$' and source_url='https://www.youtube.com/watch?v='||source_id;
revoke all on facodi.kf_youtube_source_scope_v1 from public,anon,authenticated,service_role;
create or replace function facodi.kf_audit_youtube_sources_v1(p_limit integer default 5) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v record; r extensions.http_response; info jsonb; status_code int; outcome text; n int:=0; available int:=0; unavailable int:=0; unverified int:=0; ts timestamptz; day date;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('facodi.kf_audit_youtube_sources_v1',0)) then return jsonb_build_object('ok',true,'reason','busy');end if;
 for v in select s.*,h.consecutive_unavailable_days,h.last_unavailable_day,h.youtube_id prior_id
 from facodi.kf_youtube_source_scope_v1 s left join facodi.kf_youtube_source_health h using(learning_object_id)
 where h.learning_object_id is null or h.youtube_id<>s.youtube_id or h.next_check_at<=now()
 order by h.next_check_at nulls first,s.learning_object_id limit greatest(1,least(coalesce(p_limit,5),5))
 loop
  status_code:=null;info:=null;outcome:='unverified';
  begin
   if not extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS','3000') then raise exception 'timeout_not_configured';end if;
   select * into r from extensions.http_get('https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'||v.youtube_id);
   status_code:=r.status;
   if r.status=200 and length(r.content)<=30000 then info:=r.content::jsonb;end if;
   perform extensions.http_reset_curlopt();
   if info->>'type'='video' and length(btrim(coalesce(info->>'title','')))>0 and length(btrim(coalesce(info->>'author_name','')))>0 then outcome:='available';
   elsif status_code in (404,410) then outcome:='unavailable_response';end if;
  exception when others then perform extensions.http_reset_curlopt();outcome:='unverified';end;
  ts:=clock_timestamp();day:=(ts at time zone 'UTC')::date;
  if v.prior_id is distinct from v.youtube_id then v.consecutive_unavailable_days:=0;v.last_unavailable_day:=null;end if;
  if outcome='available' then v.consecutive_unavailable_days:=0;v.last_unavailable_day:=null;available:=available+1;
  elsif outcome='unavailable_response' then
   if v.last_unavailable_day is distinct from day then v.consecutive_unavailable_days:=coalesce(v.consecutive_unavailable_days,0)+1;v.last_unavailable_day:=day;end if;unavailable:=unavailable+1;
  else unverified:=unverified+1;end if;
  insert into facodi.kf_youtube_source_health(learning_object_id,youtube_id,observed_at,outcome,http_status,consecutive_unavailable_days,last_unavailable_day,next_check_at)
  values(v.learning_object_id,v.youtube_id,ts,outcome,status_code,coalesce(v.consecutive_unavailable_days,0),v.last_unavailable_day,ts+case when outcome='available' then interval '7 days' else interval '1 day' end)
  on conflict(learning_object_id) do update set youtube_id=excluded.youtube_id,observed_at=excluded.observed_at,outcome=excluded.outcome,http_status=excluded.http_status,consecutive_unavailable_days=excluded.consecutive_unavailable_days,last_unavailable_day=excluded.last_unavailable_day,next_check_at=excluded.next_check_at;
  n:=n+1;
 end loop;
 return jsonb_build_object('ok',true,'checked',n,'available',available,'unavailable_response',unavailable,'unverified',unverified,'scope','youtube_oembed_availability_not_playback_or_license');
end $$;
revoke all on function facodi.kf_audit_youtube_sources_v1(integer) from public,anon,authenticated,service_role;
create or replace function facodi.kf_youtube_source_health_v1() returns jsonb language sql stable security invoker set search_path='' as $$
select jsonb_build_object('scope','youtube_oembed_availability_not_playback_or_license','desired',count(*),
'available',count(*) filter(where h.outcome='available'),'unavailable_response',count(*) filter(where h.outcome='unavailable_response'),
'unverified',count(*) filter(where h.outcome='unverified'),'not_checked',count(*) filter(where h.learning_object_id is null),
'review_required',count(*) filter(where h.consecutive_unavailable_days>=2),'overdue',count(*) filter(where h.next_check_at<now()))
from facodi.kf_youtube_source_scope_v1 s left join facodi.kf_youtube_source_health h on h.learning_object_id=s.learning_object_id and h.youtube_id=s.youtube_id
$$;
revoke all on function facodi.kf_youtube_source_health_v1() from public,anon,authenticated,service_role;
alter table facodi.kf_production_demands drop constraint kf_production_demands_signal_type_check;
alter table facodi.kf_production_demands add constraint kf_production_demands_signal_type_check check(signal_type in ('curricular_gap','learner_feedback','source_health'));
alter table facodi.kf_production_demands drop constraint kf_production_demands_route_check;
alter table facodi.kf_production_demands add constraint kf_production_demands_route_check check(route in ('resource_discovery','modality_review','manual_review','feedback_review','source_maintenance'));
do $m$ declare s text;begin
select pg_get_functiondef('facodi.kf_refresh_production_demands_v1()'::regprocedure) into s;
if position('), refreshed as (' in s)=0 then raise exception 'Unexpected demand registry';end if;
s:=replace(s,'), refreshed as (',
' union all
 select ''source_health'',v.learning_object_id,''source_maintenance'',jsonb_build_object(''resource_slug'',v.slug,''youtube_id'',v.youtube_id,''last_outcome'',h.outcome,''http_status'',h.http_status,''distinct_unavailable_days'',h.consecutive_unavailable_days,''scope'',''oembed_only_needs_review'')
 from facodi.kf_youtube_source_scope_v1 v join facodi.kf_youtube_source_health h on h.learning_object_id=v.learning_object_id and h.youtube_id=v.youtube_id
 where h.consecutive_unavailable_days>=2
 ), refreshed as (');
execute s;
end $m$;
select cron.schedule('facodi-kf-youtube-source-audit','18 * * * *','select facodi.kf_audit_youtube_sources_v1(5);');
