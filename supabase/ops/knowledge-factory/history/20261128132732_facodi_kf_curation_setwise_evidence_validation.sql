do $m$ declare s text; body text; begin
select pg_get_functiondef('facodi.kf_curation_candidate_snapshot_v1(uuid,uuid)'::regprocedure) into s;
body:=split_part(split_part(s,'AS $function$',2),'$function$',1);
if position('where c.unit_id=p_unit and c.resource_id=p_resource and' in body)=0 or position('select jsonb_build_object(' in body)=0 then raise exception 'Unexpected snapshot definition';end if;
body:=replace(body,'select jsonb_build_object(','select c.unit_id,c.resource_id,c.candidate_rank,jsonb_build_object(');
body:=replace(body,'from facodi.kf_resource_candidates_v1 c', 'from facodi.kf_resource_candidates_v1 c');
body:=replace(body,'where c.unit_id=p_unit and c.resource_id=p_resource and','where');
body:=replace(body,'''donor_course'',c.donor_course)', '''donor_course'',c.donor_course) snapshot');
execute 'create view facodi.kf_curation_candidate_snapshots_v1 with (security_invoker=true) as '||body;
execute 'create or replace function facodi.kf_curation_candidate_snapshot_v1(p_unit uuid,p_resource uuid) returns jsonb language sql stable security invoker set search_path='''' as $f$ select snapshot from facodi.kf_curation_candidate_snapshots_v1 where unit_id=p_unit and resource_id=p_resource $f$';
end $m$;
revoke all on facodi.kf_curation_candidate_snapshots_v1 from public,anon,authenticated,service_role;
create or replace function facodi.kf_curation_assessment_valid_v1(s jsonb,j facodi.analysis_jobs) returns boolean language sql stable security invoker set search_path='' as $$
select coalesce(
 j.request_source='kf_curation_assessment_v1' and j.job_type='match_video_to_curriculum'
 and j.learning_object_id::text=s->>'resource_id' and j.video_id::text=s->>'video_id'
 and j.input_payload->>'contract'='curation_assessment.v1'
 and j.input_payload->>'unit_id'=s->>'unit_id'
 and j.input_payload->>'snapshot_digest'=encode(sha256(convert_to(s::text,'UTF8')),'hex')
 and j.input_payload->'snapshot'=s
 and j.result_payload->>'scope'='catalog_and_public_source_description_review'
 and j.result_payload->'publication_authorized'='false'::jsonb
 and j.result_payload->'demand_resolved'='false'::jsonb
 and j.result_payload->'full_content_reviewed'='false'::jsonb
 and j.result_payload->'source_evidence'->>'scope'='public_oembed_metadata_only'
 and j.result_payload->'source_evidence'->>'status'='200'
 and lower(btrim(j.result_payload->'source_evidence'->>'title'))=lower(btrim(s->>'resource_title'))
 and length(btrim(coalesce(j.result_payload->'source_evidence'->>'author','')))>0
 and ((j.status='succeeded' and j.result_payload->>'decision'='exclude_current_candidate') or
 (j.status='needs_review' and j.result_payload->>'decision' in ('foundational_only','supplementary_candidate')))
 and length(btrim(coalesce(j.result_payload->>'justification',''))) between 40 and 2000,false)
$$;
revoke all on function facodi.kf_curation_assessment_valid_v1(jsonb,facodi.analysis_jobs) from public,anon,authenticated,service_role;
do $m$ declare s text; begin
select pg_get_functiondef('facodi.kf_curation_assurance_v1()'::regprocedure) into s;
if position('facodi.kf_curation_candidate_snapshot_v1(c.unit_id,c.resource_id) snapshot' in s)=0 then raise exception 'Unexpected assurance';end if;
s:=replace(s,'select c.unit_id,c.resource_id,c.unit_title,c.resource_title,facodi.kf_curation_candidate_snapshot_v1(c.unit_id,c.resource_id) snapshot from facodi.kf_resource_candidates_v1 c where candidate_rank<=5','select c.unit_id,c.resource_id,c.snapshot->>''unit_title'' unit_title,c.snapshot->>''resource_title'' resource_title,c.snapshot from facodi.kf_curation_candidate_snapshots_v1 c');
s:=replace(s,'and j.status in (''succeeded'',''needs_review'') order by','and facodi.kf_curation_assessment_valid_v1(e.snapshot,j) order by');
execute s;
select pg_get_functiondef('facodi.kf_curation_manufacturing_manifest_v1()'::regprocedure) into s;
if position('facodi.kf_curation_candidate_snapshot_v1(c.unit_id,c.resource_id) snapshot' in s)=0 then raise exception 'Unexpected manifest';end if;
s:=replace(s,'facodi.kf_curation_candidate_snapshot_v1(c.unit_id,c.resource_id) snapshot','v.snapshot');
s:=replace(s,'from facodi.kf_resource_candidates_v1 c where c.candidate_rank<=5','from facodi.kf_resource_candidates_v1 c left join facodi.kf_curation_candidate_snapshots_v1 v on v.unit_id=c.unit_id and v.resource_id=c.resource_id where c.candidate_rank<=5');
s:=replace(s,'and j.input_payload->''snapshot''=e.snapshot','and j.input_payload->''snapshot''=e.snapshot and facodi.kf_curation_assessment_valid_v1(e.snapshot,j)');
execute s;
select pg_get_functiondef('facodi.kf_record_curation_assessment_v1(uuid,uuid,text,text,jsonb)'::regprocedure) into s;
if position('if found then return jsonb_build_object(''ok'',true,''reason'',''already_recorded''' in s)=0 then raise exception 'Unexpected recorder';end if;
s:=replace(s,'if found then return jsonb_build_object(''ok'',true,''reason'',''already_recorded''','if found then if not facodi.kf_curation_assessment_valid_v1(s,j) then return jsonb_build_object(''ok'',false,''reason'',''invalid_existing_assessment'',''job_id'',j.id);end if; return jsonb_build_object(''ok'',true,''reason'',''already_recorded''');
execute s;
end $m$;
