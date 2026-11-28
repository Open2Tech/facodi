do $m$ declare s text; begin
select pg_get_functiondef('facodi.kf_demand_plan_v1()'::regprocedure) into s;
if position('''curation_advisory'',facodi.kf_curation_planning_v1()' in s)=0 or position('''source_maintenance''' in s)>0 then raise exception 'Unexpected demand plan';end if;
s:=replace(s,'''curation_advisory'',facodi.kf_curation_planning_v1()','''curation_advisory'',facodi.kf_curation_planning_v1(),''source_health'',facodi.kf_youtube_source_health_v1(),''source_maintenance'',coalesce((select jsonb_agg(to_jsonb(m) order by m.subject_id) from (select subject_id,evidence,first_seen_at,last_seen_at from facodi.kf_production_demands where signal_type=''source_health'' and route=''source_maintenance'' and resolved_at is null order by first_seen_at,subject_id limit 100)m),''[]''::jsonb)');
execute s;
end $m$;
revoke all on function facodi.kf_demand_plan_v1() from public,anon,authenticated,service_role;
