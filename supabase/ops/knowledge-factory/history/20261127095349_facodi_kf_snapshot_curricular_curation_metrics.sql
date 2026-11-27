do $m$ declare s text; begin select pg_get_functiondef('facodi.kf_push_operational_snapshot()'::regprocedure) into s;
s:=replace(s,'''schema_version'',1,','''schema_version'',1,
 ''curation_modality'',(select count(*) from facodi.kf_curricular_triage_v1 where route=''modality_review''),
 ''curation_discovery'',(select count(*) from facodi.kf_curricular_triage_v1 where route=''resource_discovery''),
 ''curation_existing_relations'',(select count(*) from facodi.kf_curricular_triage_v1 where public_direct_relations>0),
 ''curation_units_with_candidates'',(select count(distinct unit_id) from facodi.kf_resource_candidates_v1 where candidate_rank<=5),
 ''curation_candidates'',(select count(*) from facodi.kf_resource_candidates_v1 where candidate_rank<=5),');
if position('curation_modality' in s)=0 then raise exception 'Unexpected snapshot'; end if; execute s; end $m$;
revoke all on function facodi.kf_push_operational_snapshot() from public,anon,authenticated,service_role;
