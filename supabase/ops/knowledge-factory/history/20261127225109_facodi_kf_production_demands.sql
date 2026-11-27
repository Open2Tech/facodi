create table facodi.kf_production_demands (
  signal_type text not null check (signal_type in ('curricular_gap', 'learner_feedback')),
  subject_id uuid not null,
  route text not null check (route in ('resource_discovery', 'modality_review', 'manual_review', 'feedback_review')),
  evidence jsonb not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  primary key (signal_type, subject_id)
);

alter table facodi.kf_production_demands enable row level security;
revoke all on facodi.kf_production_demands from public, anon, authenticated, service_role;
grant select on facodi.kf_production_demands to service_role;

create function facodi.kf_refresh_production_demands_v1()
returns jsonb
language plpgsql
set search_path = ''
as $$
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
  ), refreshed as (
    insert into facodi.kf_production_demands(signal_type, subject_id, route, evidence)
    select signal_type, subject_id, route, evidence from observed
    on conflict (signal_type, subject_id) do update
      set route = excluded.route, evidence = excluded.evidence, last_seen_at = now(), resolved_at = null
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
$$;

revoke all on function facodi.kf_refresh_production_demands_v1() from public, anon, authenticated, service_role;

select cron.schedule('facodi-kf-production-demands', '23 * * * *',
  'select facodi.kf_refresh_production_demands_v1();');
