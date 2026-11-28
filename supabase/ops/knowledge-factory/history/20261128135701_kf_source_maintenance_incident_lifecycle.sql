-- Applied on 2026-11-28; incident lifecycle v2, no public grants or publication changes.
CREATE OR REPLACE FUNCTION facodi.kf_refresh_production_demands_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  report jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('facodi.kf_production_demands', 0));

  with candidate_counts as (
    select unit_id, count(*) as candidates
    from facodi.kf_resource_candidates_v1
    where candidate_rank <= 5
    group by unit_id
  ), observed as materialized (
    select 'curricular_gap'::text as signal_type, t.unit_id as subject_id, t.route,
      jsonb_build_object(
        'unit_title', t.unit_title, 'course_slug', t.course_slug, 'language', t.language,
        'public_direct_relations', t.public_direct_relations,
        'reuse_candidates', coalesce(c.candidates, 0),
        'coverage', case when t.public_direct_relations = 0 then 'no_public_assets' else 'no_video_or_sequence' end
      ) as evidence
    from facodi.kf_curricular_triage_v1 t
    join facodi.curricular_units u on u.id = t.unit_id and u.status = 'active'
    join facodi.courses course on course.id = u.course_id and course.status = 'active'
    left join candidate_counts c on c.unit_id = t.unit_id

    union all

    select 'learner_feedback', f.learning_object_id, 'feedback_review',
      jsonb_build_object('resource_slug', o.slug, 'votes', count(*),
        'unhelpful_votes', count(*) filter (where not f.helpful), 'window_days', 90)
    from facodi.resource_feedback f
    join facodi.learning_objects o on o.id = f.learning_object_id
    where f.updated_at >= now() - interval '90 days'
      and o.published and o.status in ('active', 'published')
    group by f.learning_object_id, o.slug
    having count(distinct f.owner_id) >= 5
      and count(*) filter (where not f.helpful) * 2 > count(*)
   union all
 select 'source_health',v.learning_object_id,'source_maintenance',jsonb_build_object('resource_slug',v.slug,'youtube_id',v.youtube_id,'last_outcome',h.outcome,'http_status',h.http_status,'distinct_unavailable_days',h.consecutive_unavailable_days,'scope','oembed_only_needs_review')
 from facodi.kf_youtube_source_scope_v1 v join facodi.kf_youtube_source_health h on h.learning_object_id=v.learning_object_id and h.youtube_id=v.youtube_id
 where h.consecutive_unavailable_days>=2
 ), refreshed as (
    insert into facodi.kf_production_demands(signal_type, subject_id, route, evidence)
    select signal_type, subject_id, route, evidence from observed
    on conflict (signal_type, subject_id) do update
      set route = excluded.route, evidence = excluded.evidence, last_seen_at = now(), resolved_at = null,
      first_seen_at = case when excluded.signal_type='source_health' and (kf_production_demands.resolved_at is not null or kf_production_demands.evidence->>'youtube_id' is distinct from excluded.evidence->>'youtube_id') then now() else kf_production_demands.first_seen_at end
    returning route
  ), resolved as (
    update facodi.kf_production_demands d
    set resolved_at = now()
    where d.resolved_at is null and not exists (
      select 1 from observed o where o.signal_type = d.signal_type and o.subject_id = d.subject_id
    )
    returning 1
  )
  select jsonb_build_object(
    'open', (select count(*) from refreshed),
    'resolved', (select count(*) from resolved),
    'by_route', coalesce(
      (select jsonb_object_agg(route, total) from (select route, count(*) total from refreshed group by route) totals),
      '{}'::jsonb
    )
  ) into report;

  return report;
end;
$function$
;
CREATE OR REPLACE FUNCTION facodi.kf_demand_plan_v1()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
with live as materialized (
 select d.subject_id::text unit_id,t.unit_title title,t.course_slug,u.code unit_code,t.route,t.public_direct_relations direct_count,
 (select count(*) from facodi.kf_resource_candidates_v1 r where r.unit_id=t.unit_id and r.candidate_rank<=5) reuse_count
 from facodi.kf_production_demands d join facodi.kf_curricular_triage_v1 t on t.unit_id=d.subject_id and t.route=d.route
 join facodi.curricular_units u on u.id=t.unit_id and u.status='active'
 join facodi.courses c on c.id=u.course_id and c.status='active'
 where d.signal_type='curricular_gap' and d.resolved_at is null and d.last_seen_at>now()-interval '2 hours'
), eligible as (
 select to_jsonb(l)||jsonb_build_object('digest',encode(sha256(convert_to(to_jsonb(l)::text,'UTF8')),'hex')) item,route,reuse_count,direct_count,unit_id from live l
 where length(title) between 1 and 250 and title !~ '[<>]' and course_slug ~ '^[a-zA-Z0-9_-]{1,120}$' and unit_code ~ '^[a-zA-Z0-9_.-]{1,40}$'
 order by case when route='resource_discovery' then 0 when route='modality_review' then 1 else 2 end,reuse_count desc,direct_count asc,unit_id limit 200
)
select jsonb_build_object('contract','curricular_demand_plan.v1','curation_advisory',facodi.kf_curation_planning_v1(),'source_health',facodi.kf_youtube_source_health_v1(),'source_maintenance',coalesce((select jsonb_agg(to_jsonb(m) order by m.subject_id) from (select d.subject_id,d.evidence,d.first_seen_at,d.last_seen_at,encode(sha256(convert_to(d.subject_id::text||'|'||(d.evidence->>'youtube_id')||'|'||extract(epoch from d.first_seen_at)::text,'UTF8')),'hex') incident_key from facodi.kf_production_demands d where d.signal_type='source_health' and d.route='source_maintenance' and d.resolved_at is null and d.last_seen_at>now()-interval '2 hours' order by d.first_seen_at,d.subject_id limit 100)m),'[]'::jsonb),'source_recoveries',coalesce((select jsonb_agg(to_jsonb(m) order by m.subject_id) from (select d.subject_id,d.evidence->>'youtube_id' youtube_id,encode(sha256(convert_to(d.subject_id::text||'|'||(d.evidence->>'youtube_id')||'|'||extract(epoch from d.first_seen_at)::text,'UTF8')),'hex') incident_key,h.observed_at from facodi.kf_production_demands d join facodi.kf_youtube_source_scope_v1 v on v.learning_object_id=d.subject_id and v.youtube_id=d.evidence->>'youtube_id' join facodi.kf_youtube_source_health h on h.learning_object_id=v.learning_object_id and h.youtube_id=v.youtube_id where d.signal_type='source_health' and d.route='source_maintenance' and d.resolved_at is not null and d.resolved_at>now()-interval '30 days' and h.outcome='available' and h.http_status=200 and h.consecutive_unavailable_days=0 and h.observed_at>d.first_seen_at order by d.resolved_at desc,d.subject_id limit 100)m),'[]'::jsonb),'scope','catalog_observation_only','total',(select count(*) from live),
'feedback_review',(select count(*) from facodi.kf_production_demands where signal_type='learner_feedback' and resolved_at is null and last_seen_at>now()-interval '2 hours'),
'items',coalesce((select jsonb_agg(item order by case when route='resource_discovery' then 0 when route='modality_review' then 1 else 2 end,reuse_count desc,direct_count,unit_id) from eligible),'[]'::jsonb))
$function$
;
