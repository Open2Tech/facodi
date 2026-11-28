create or replace function facodi.kf_demand_plan_v1() returns jsonb language sql stable security invoker set search_path='' as $$
with live as materialized (
 select d.subject_id::text unit_id,t.unit_title title,t.course_slug,u.code unit_code,t.route,t.public_direct_relations direct_count,
 (select count(*) from facodi.kf_resource_candidates_v1 r where r.unit_id=t.unit_id and r.candidate_rank<=5) reuse_count
 from facodi.kf_production_demands d join facodi.kf_curricular_triage_v1 t on t.unit_id=d.subject_id and t.route=d.route
 join facodi.curricular_units u on u.id=t.unit_id and u.status='active'
 join facodi.courses c on c.id=u.course_id and c.status='active'
 where d.signal_type='curricular_gap' and d.resolved_at is null and d.last_seen_at>now()-interval '2 hours'
), eligible as (
 select to_jsonb(l)||jsonb_build_object('digest',encode(sha256(convert_to(to_jsonb(l)::text,'UTF8')),'hex')) item,route,reuse_count,direct_count,unit_id from live l
 where length(title) between 1 and 250 and course_slug ~ '^[a-zA-Z0-9_-]{1,120}$' and unit_code ~ '^[a-zA-Z0-9_.-]{1,40}$'
 order by case when route='resource_discovery' then 0 when route='modality_review' then 1 else 2 end,reuse_count desc,direct_count asc,unit_id limit 200
)
select jsonb_build_object('contract','curricular_demand_plan.v1','scope','catalog_observation_only','total',(select count(*) from live),
'feedback_review',(select count(*) from facodi.kf_production_demands where signal_type='learner_feedback' and resolved_at is null and last_seen_at>now()-interval '2 hours'),
'items',coalesce((select jsonb_agg(item order by case when route='resource_discovery' then 0 when route='modality_review' then 1 else 2 end,reuse_count desc,direct_count,unit_id) from eligible),'[]'::jsonb))
$$;
revoke all on function facodi.kf_demand_plan_v1() from public,anon,authenticated,service_role;
