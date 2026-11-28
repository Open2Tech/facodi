create or replace function facodi.kf_curation_manufacturing_manifest_v1() returns jsonb
language sql stable security invoker set search_path='' as $$
with candidates as materialized (
 select c.unit_id,c.resource_id,c.candidate_rank,facodi.kf_curation_candidate_snapshot_v1(c.unit_id,c.resource_id) snapshot
 from facodi.kf_resource_candidates_v1 c where c.candidate_rank<=5
), eligible as materialized (
 select c.*,encode(sha256(convert_to(c.snapshot::text,'UTF8')),'hex') digest
 from candidates c where c.snapshot is not null
), evidence as materialized (
 select e.*,j.id job_id,j.result_payload result
 from eligible e join lateral (
  select j.id,j.result_payload from facodi.analysis_jobs j
  where j.request_source='kf_curation_assessment_v1' and j.job_type='match_video_to_curriculum'
    and j.learning_object_id=e.resource_id and j.video_id::text=e.snapshot->>'video_id'
    and j.input_payload->>'contract'='curation_assessment.v1'
    and j.input_payload->>'unit_id'=e.unit_id::text and j.input_payload->>'snapshot_digest'=e.digest
    and j.input_payload->'snapshot'=e.snapshot
    and j.result_payload->>'scope'='catalog_and_public_source_description_review'
    and j.result_payload->'publication_authorized'='false'::jsonb
    and j.result_payload->'demand_resolved'='false'::jsonb
    and j.result_payload->'full_content_reviewed'='false'::jsonb
    and j.result_payload->'source_evidence'->>'scope'='public_oembed_metadata_only'
    and j.result_payload->'source_evidence'->>'status'='200'
    and lower(btrim(j.result_payload->'source_evidence'->>'title'))=lower(btrim(e.snapshot->>'resource_title'))
    and length(btrim(coalesce(j.result_payload->'source_evidence'->>'author','')))>0
    and ((j.status='succeeded' and j.result_payload->>'decision'='exclude_current_candidate') or
         (j.status='needs_review' and j.result_payload->>'decision' in ('foundational_only','supplementary_candidate')))
    and length(btrim(coalesce(j.result_payload->>'justification',''))) between 40 and 2000
  order by j.created_at desc,j.id limit 1
 ) j on true
), packets as (
 select e.unit_id, min(e.snapshot->>'unit_title') unit_title,min(e.snapshot->>'unit_code') unit_code,
 min(e.snapshot->>'course_slug') course_slug,count(*) assessed,
 count(*) filter(where result->>'decision'='exclude_current_candidate') excluded,
 count(*) filter(where result->>'decision'='foundational_only') foundational,
 count(*) filter(where result->>'decision'='supplementary_candidate') supplementary,
 jsonb_agg(jsonb_build_object('resource_id',e.resource_id,'job_id',e.job_id,'snapshot_digest',e.digest,
 'title',e.snapshot->>'resource_title','url',e.snapshot->>'source_url','language',e.snapshot->>'resource_language',
 'decision',e.result->>'decision','justification',e.result->>'justification',
 'source_evidence',e.result->'source_evidence','sources',e.result->'sources') order by e.resource_id) assessments
 from evidence e group by e.unit_id
 having count(*)=(select count(*) from candidates c where c.unit_id=e.unit_id)
 and count(*)=count(distinct e.resource_id) and count(*) between 1 and 5
), deliverables as (
 select jsonb_build_object('contract','curation_manufacturing.v1','unit_id',p.unit_id,'unit_title',p.unit_title,'unit_code',p.unit_code,'course_slug',p.course_slug,
 'product_code','KF-CURATION','recipe_code','KF-BOM-CURATION','quantity',1,'assessed',p.assessed,
 'excluded',p.excluded,'foundational',p.foundational,'supplementary',p.supplementary,'assessments',p.assessments,
 'next_action',case when p.excluded=p.assessed then 'discover_new_topic_specific_sources' when p.supplementary>0 then 'review_supplementary_candidate_against_current_curriculum' else 'discover_specialist_sources_and_confirm_curricular_identity' end,
 'scope','curation_report_only','publication_authorized',false,'curricular_approval',false,'demand_resolved',false) payload
 from packets p
 where exists(select 1 from facodi.kf_production_demands d where d.signal_type='curricular_gap' and d.subject_id=p.unit_id and d.resolved_at is null and d.route='resource_discovery' and d.last_seen_at>now()-interval '2 hours')
)
select coalesce(jsonb_agg(payload||jsonb_build_object('digest',encode(sha256(convert_to(payload::text,'UTF8')),'hex')) order by payload->>'unit_id'),'[]'::jsonb) from deliverables
$$;
revoke all on function facodi.kf_curation_manufacturing_manifest_v1() from public,anon,authenticated,service_role;
