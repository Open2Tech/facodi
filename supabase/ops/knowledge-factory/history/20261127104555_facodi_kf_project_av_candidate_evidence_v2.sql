create or replace function facodi.kf_project_private_av_evidence_v2() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 with eligible as (
 select a.id job_id,v.id classification_id,a.result_payload->'kf_av_async' av
 from facodi.analysis_jobs a
 join facodi.youtube_videos y on y.id=a.video_id and y.learning_object_id=a.learning_object_id
 join facodi.learning_objects o on o.id=y.learning_object_id
 join facodi.video_classifications v on v.video_id=y.id and v.metadata->>'kf_lexical_job_id'=a.id::text
 join facodi.curricular_units u on u.id=v.curricular_unit_id and u.id::text=o.metadata->'kf_curricular_candidate_v1'->>'unit_id' and u.published
 where a.request_source='kf_private_candidate_review_v1' and a.status='needs_review'
 and a.result_payload->'kf_av_async'->>'outcome'='partial_av_evidence'
 and a.result_payload->'kf_av_async'->>'publication_authorized'='false'
 and a.result_payload->'kf_av_async'->'evidence'->>'level'='content_video'
 and a.result_payload->'kf_av_async'->'confirmation'->'agreed_unit_ids' ? u.id::text
 and a.result_payload->'kf_av_async'->'matching'->>'provider' in ('gemini','openai')
 and a.result_payload->'kf_av_async'->'confirmation'->>'provider' in ('gemini','openai')
 and a.result_payload->'kf_av_async'->'matching'->>'provider'<>a.result_payload->'kf_av_async'->'confirmation'->>'provider'
 and exists(select 1 from jsonb_array_elements(a.result_payload->'kf_av_async'->'matching'->'matches') m where m->>'unit_id'=u.id::text and m->>'fit'='strong' and m->>'grounded'='true')
 and exists(select 1 from jsonb_array_elements(a.result_payload->'kf_av_async'->'confirmation'->'matches') m where m->>'unit_id'=u.id::text and m->>'fit'='strong' and m->>'grounded'='true')
 and y.status='pending' and o.status='draft' and not o.published
 and o.metadata->>'editorial_batch'='facodi-kf-legacy-studio-20261127'
 and v.status='needs_review' and v.needs_review and not (v.metadata ? 'kf_av_evidence_job_id')
 )
 update facodi.video_classifications v set metadata=v.metadata||jsonb_build_object('kf_av_evidence_job_id',e.job_id,'kf_av_outcome','partial_av_evidence','kf_av_consensus','cross_provider_strong_match','publication_authorized',false),
 evidence=v.evidence||jsonb_build_array(jsonb_build_object('kind','partial_audiovisual_review','job_id',e.job_id,'scope',e.av->>'scope','evidence',e.av->'evidence','matching',e.av->'matching','confirmation',e.av->'confirmation','full_content_reviewed',false,'license_verified',false,'publication_authorized',false))
 from eligible e where v.id=e.classification_id;
 get diagnostics n=row_count;
 return jsonb_build_object('ok',true,'projected',n);
end $$;
revoke all on function facodi.kf_project_private_av_evidence_v2() from public,anon,authenticated,service_role;
