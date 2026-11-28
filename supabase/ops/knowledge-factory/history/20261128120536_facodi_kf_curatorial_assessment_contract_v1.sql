create or replace function facodi.kf_curation_candidate_snapshot_v1(p_unit uuid,p_resource uuid) returns jsonb language sql stable security invoker set search_path='' as $$
select jsonb_build_object('unit_id',c.unit_id,'course_id',u.course_id,'unit_code',u.code,'unit_title',c.unit_title,'course_slug',c.course_slug,'unit_description',coalesce(ul.description,''),'unit_topics',ul.metadata->'study_topics','resource_id',c.resource_id,'resource_title',c.resource_title,'resource_language',c.resource_language,'resource_description',coalesce(o.description,''),'source_url',c.source_url,'video_id',y.id,'youtube_id',y.youtube_video_id,'heuristic',c.evidence,'donor_course',c.donor_course)
from facodi.kf_resource_candidates_v1 c
join facodi.curricular_units u on u.id=c.unit_id and u.published and u.status='active'
join facodi.courses cr on cr.id=u.course_id and cr.published and cr.status='active'
join facodi.learning_objects ul on ul.id=u.learning_object_id and ul.published and ul.status='active'
join facodi.learning_objects o on o.id=c.resource_id and o.published and o.status in ('active','published')
join facodi.youtube_videos y on y.learning_object_id=o.id and y.canonical_url=c.source_url and y.youtube_video_id ~ '^[A-Za-z0-9_-]{11}$' and y.canonical_url='https://www.youtube.com/watch?v='||y.youtube_video_id
where c.unit_id=p_unit and c.resource_id=p_resource and c.object_type='video' and c.candidate_rank<=5 and exists(select 1 from facodi.kf_production_demands d where d.signal_type='curricular_gap' and d.subject_id=c.unit_id and d.resolved_at is null and d.route='resource_discovery')
$$;
revoke all on function facodi.kf_curation_candidate_snapshot_v1(uuid,uuid) from public,anon,authenticated,service_role;
create or replace function facodi.kf_record_curation_assessment_v1(p_unit uuid,p_resource uuid,p_decision text,p_notes text,p_sources jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s jsonb; d text; j facodi.analysis_jobs%rowtype; r extensions.http_response; info jsonb; state text;
begin
 if p_decision is null or p_decision not in ('exclude_current_candidate','foundational_only','supplementary_candidate') or length(btrim(coalesce(p_notes,''))) not between 40 and 2000 or p_sources is null or jsonb_typeof(p_sources)<>'array' or jsonb_array_length(p_sources) not between 1 and 5 or exists(select 1 from jsonb_array_elements(p_sources)x where jsonb_typeof(x)<>'string' or x#>>'{}' !~ '^https://[^[:space:]<>"]{1,1000}$') then return jsonb_build_object('ok',false,'reason','invalid_assessment');end if;
 perform pg_advisory_xact_lock(hashtextextended('facodi.kf_curation_assessment:'||p_unit::text||':'||p_resource::text,0));
 s:=facodi.kf_curation_candidate_snapshot_v1(p_unit,p_resource);
 if s is null then return jsonb_build_object('ok',false,'reason','candidate_not_eligible');end if;
 d:=encode(sha256(convert_to(s::text,'UTF8')),'hex');
 select * into j from facodi.analysis_jobs where request_source='kf_curation_assessment_v1' and job_type='match_video_to_curriculum' and learning_object_id=p_resource and input_payload->>'unit_id'=p_unit::text and input_payload->>'snapshot_digest'=d and status in ('succeeded','needs_review') order by created_at desc limit 1;
 if found then return jsonb_build_object('ok',true,'reason','already_recorded','job_id',j.id,'decision',j.result_payload->>'decision');end if;
 begin
 if not extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS','4000') then raise exception 'timeout_not_configured';end if;
 select * into r from extensions.http_get('https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'||(s->>'youtube_id'));
 perform extensions.http_reset_curlopt();
 if r.status=200 and length(r.content)<=30000 then info:=r.content::jsonb;end if;
 exception when others then perform extensions.http_reset_curlopt();info:=null;end;
 if info->>'type' is distinct from 'video' or nullif(btrim(info->>'title'),'') is null or nullif(btrim(info->>'author_name'),'') is null then return jsonb_build_object('ok',false,'reason','source_unverified');end if;
 if lower(btrim(info->>'title')) is distinct from lower(btrim(s->>'resource_title')) then return jsonb_build_object('ok',false,'reason','title_changed');end if;
 state:=case when p_decision='exclude_current_candidate' then 'succeeded' else 'needs_review' end;
 j:=facodi.queue_analysis_job('match_video_to_curriculum',p_resource,(s->>'video_id')::uuid,s->>'youtube_id',s->>'source_url',null,'kf_curation_assessment_v1',jsonb_build_object('contract','curation_assessment.v1','unit_id',p_unit,'course_id',s->>'course_id','snapshot_digest',d,'snapshot',s),'catalog_candidate_review');
 update facodi.analysis_jobs set status=state,current_step='candidate_assessed',attempts=1,started_at=now(),completed_at=now(),result_payload=jsonb_build_object('decision',p_decision,'justification',btrim(p_notes),'sources',p_sources,'source_evidence',jsonb_build_object('scope','public_oembed_metadata_only','title',info->>'title','author',info->>'author_name','status',200,'checked_at',now()),'scope','catalog_and_public_source_description_review','current_syllabus_verified',false,'full_content_reviewed',false,'license_verified',false,'publication_authorized',false,'demand_resolved',false) where id=j.id;
 insert into facodi.analysis_job_events(job_id,event_type,message,metadata) values(j.id,'candidate_assessed','Scoped curation assessment; no public association changed.',jsonb_build_object('decision',p_decision,'snapshot_digest',d,'publication_authorized',false));
 return jsonb_build_object('ok',true,'reason','recorded','job_id',j.id,'decision',p_decision);
end $$;
revoke all on function facodi.kf_record_curation_assessment_v1(uuid,uuid,text,text,jsonb) from public,anon,authenticated,service_role;
create or replace function facodi.kf_curation_assurance_v1() returns jsonb language sql stable security invoker set search_path='' as $$
with candidates as materialized(select c.unit_id,c.resource_id,c.unit_title,c.resource_title,facodi.kf_curation_candidate_snapshot_v1(c.unit_id,c.resource_id) snapshot from facodi.kf_resource_candidates_v1 c where candidate_rank<=5), eligible as materialized(select *,encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') digest from candidates where snapshot is not null), reviews as (
select e.unit_id,e.resource_id,e.unit_title,e.resource_title,coalesce(j.result_payload->>'decision','unassessed') decision,j.id job_id from eligible e left join lateral(select id,result_payload from facodi.analysis_jobs j where j.request_source='kf_curation_assessment_v1' and j.learning_object_id=e.resource_id and j.input_payload->>'unit_id'=e.unit_id::text and j.input_payload->>'snapshot_digest'=e.digest and j.status in ('succeeded','needs_review') order by j.created_at desc limit 1) j on true)
select jsonb_build_object('contract','curation_assessment.v1','scope','review_of_existing_candidates_not_curricular_approval','eligible',count(*),'assessed',count(*) filter(where job_id is not null),'excluded',count(*) filter(where decision='exclude_current_candidate'),'foundational',count(*) filter(where decision='foundational_only'),'supplementary',count(*) filter(where decision='supplementary_candidate'),'items',coalesce(jsonb_agg(to_jsonb(reviews) order by unit_id,resource_id),'[]'::jsonb),'publication_authorized',false) from reviews
$$;
revoke all on function facodi.kf_curation_assurance_v1() from public,anon,authenticated,service_role;
