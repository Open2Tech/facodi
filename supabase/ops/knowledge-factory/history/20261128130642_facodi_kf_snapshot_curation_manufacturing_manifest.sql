do $m$ declare s text;begin
select pg_get_functiondef('facodi.kf_push_operational_snapshot()'::regprocedure) into s;
if position('''kf_demand_plan'',facodi.kf_demand_plan_v1()' in s)=0 or position('''kf_curation_manifest''' in s)>0 then raise exception 'Unexpected snapshot contract';end if;
s:=replace(s,'''kf_demand_plan'',facodi.kf_demand_plan_v1()','''kf_demand_plan'',facodi.kf_demand_plan_v1(), ''kf_curation_manifest'',facodi.kf_curation_manufacturing_manifest_v1()');
execute s;
end $m$;
revoke all on function facodi.kf_push_operational_snapshot() from public,anon,authenticated,service_role;
