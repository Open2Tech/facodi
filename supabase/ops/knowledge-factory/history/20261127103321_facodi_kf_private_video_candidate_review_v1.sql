create or replace function facodi.kf_review_video_candidate_v1(p_video_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v record; job facodi.analysis_jobs%rowtype; ranking jsonb; top_id text; top_rank numeric; outcome text; cid uuid; n integer;
begin
 if not pg_try_advisory_xact_lock(391726,5) then return jsonb_build_object('ok',true,'reason','busy'); end if;
 select y.id,y.learning_object_id,y.youtube_video_id,y.canonical_url,o.title,o.description,o.metadata,u.id unit_id,u.course_id into v
 from facodi.youtube_videos y join facodi.learning_objects o on o.id=y.learning_object_id
 join facodi.curricular_units u on u.id::text=o.metadata->'kf_curricular_candidate_v1'->>'unit_id'
 join facodi.courses c on c.id=u.course_id
 where y.id=p_video_id and y.status='pending' and o.object_type='video' and o.status='draft' and not o.published and u.published and c.published
 and y.youtube_video_id=o.source_id and y.canonical_url=o.source_url and o.metadata->>'editorial_batch'='facodi-kf-legacy-studio-20261127'
 and o.metadata->'kf_source_evidence_v1'->>'title_match'='true' and o.metadata->'kf_source_evidence_v1'->>'status'='200'
 and o.metadata->'kf_curricular_candidate_v1'->>'review_status'='pending'
 and exists(select 1 from facodi.kf_bridge_receipts r where r.source_task_id=125 and r.status='received' and r.payload->>'contract'='resource_curation_candidate.v1' and exists(select 1 from jsonb_array_elements(r.payload->'items') x where x->>'object_id'=o.id::text and x->>'video_id'=o.source_id and x->'candidate'=o.metadata->'kf_curricular_candidate_v1'))
 for update of y,o;
 if not found then return jsonb_build_object('ok',false,'reason','scope_or_identity'); end if;
 select count(*) into n from facodi.video_classifications where video_id=v.id and curricular_unit_id=v.unit_id and status='needs_review' and needs_review and metadata->>'contract'='resource_curation_candidate.v1';
 if n<>1 then return jsonb_build_object('ok',false,'reason','candidate_cardinality'); end if;
 select id into cid from facodi.video_classifications where video_id=v.id and curricular_unit_id=v.unit_id and status='needs_review' and needs_review and metadata->>'contract'='resource_curation_candidate.v1' for update;
 select * into job from facodi.analysis_jobs where video_id=v.id and request_source='kf_private_candidate_review_v1' and job_type='match_video_to_curriculum' order by created_at limit 1;
 if found then return jsonb_build_object('ok',true,'reason','already_recorded','job_id',job.id,'status',job.status); end if;
 select coalesce(jsonb_agg(jsonb_build_object('unit_id',r.id,'title',r.title,'rank',r.rank) order by r.rank desc,r.title,r.id),'[]'::jsonb)
 into ranking from facodi.rank_resource_suggestion_units(concat_ws(' ',v.title,v.description),v.course_id,null,5) r;
 top_id:=ranking->0->>'unit_id';top_rank:=coalesce((ranking->0->>'rank')::numeric,0);
 outcome:=case when top_id=v.unit_id::text and top_rank>0 and top_rank>coalesce((ranking->1->>'rank')::numeric,0) then 'lexical_support' else 'ambiguous_or_no_match' end;
 job:=facodi.queue_analysis_job('match_video_to_curriculum',v.learning_object_id,v.id,v.youtube_video_id,v.canonical_url,null,'kf_private_candidate_review_v1',jsonb_build_object('contract','resource_curation_candidate.v1','method','existing_rank_resource_suggestion_units','unit_id',v.unit_id,'course_id',v.course_id,'input_scope','verified_title_and_legacy_summary','publication_authorized',false),'queued');
 update facodi.analysis_jobs set status='needs_review',current_step='candidate_review_required',attempts=1,started_at=now(),completed_at=now(),result_payload=jsonb_build_object('outcome',outcome,'ranking',ranking,'scope','lexical_only','content_reviewed',false,'license_verified',false,'publication_authorized',false) where id=job.id;
 insert into facodi.analysis_job_events(job_id,event_type,message,metadata) values(job.id,'needs_review','Lexical candidate comparison completed; editorial review remains required.',jsonb_build_object('outcome',outcome,'scope','lexical_only'));
 update facodi.video_classifications set metadata=metadata||jsonb_build_object('kf_lexical_job_id',job.id,'kf_lexical_outcome',outcome,'confidence_unscored',true),evidence=evidence||jsonb_build_array(jsonb_build_object('kind','lexical_ranking','job_id',job.id,'ranking',ranking,'scope','title_and_legacy_summary','not_a_probability',true)) where id=cid;
 return jsonb_build_object('ok',true,'reason','review_required','job_id',job.id,'outcome',outcome,'top_unit',ranking->0->>'title','rank',top_rank);
end $$;
revoke all on function facodi.kf_review_video_candidate_v1(uuid) from public,anon,authenticated,service_role;
