create or replace function facodi.kf_curation_planning_v1() returns jsonb language sql stable security invoker set search_path='' as $$
with report as materialized(select facodi.kf_curation_assurance_v1() r),
items as (select x from report cross join lateral jsonb_array_elements(r->'items') x),
by_unit as (
 select x->>'unit_id' unit_id, count(*) candidates, count(*) filter(where x->>'decision'='exclude_current_candidate') excluded, count(*) filter(where x->>'decision'='foundational_only') foundational, count(*) filter(where x->>'decision'='supplementary_candidate') supplementary, count(*) filter(where x->>'decision'='unassessed') unassessed
 from items group by 1
)
select jsonb_build_object('contract','curation_planning.v1','scope','advisory_only_no_publication','units',coalesce(jsonb_agg(to_jsonb(by_unit)||jsonb_build_object('next_action',case when excluded=candidates then 'discover_new_topic_specific_sources' when supplementary>0 then 'review_supplementary_candidate_against_current_curriculum' when foundational>0 then 'discover_specialist_sources_and_confirm_curricular_identity' else 'assess_candidates' end) order by unit_id),'[]'::jsonb)) from by_unit
$$;
revoke all on function facodi.kf_curation_planning_v1() from public,anon,authenticated,service_role;
do $m$ declare s text;begin
select pg_get_functiondef('facodi.kf_demand_plan_v1()'::regprocedure) into s;
if position('''contract'',''curricular_demand_plan.v1''' in s)=0 or position('kf_curation_planning_v1' in s)>0 then raise exception 'Unexpected plan contract';end if;
s:=replace(s,'''contract'',''curricular_demand_plan.v1''','''contract'',''curricular_demand_plan.v1'',''curation_advisory'',facodi.kf_curation_planning_v1()');execute s;
end $m$;
