create or replace function facodi.kf_v2_ingest_reference_v1(p_youtube_id text,p_course_id uuid default null,p_actor uuid default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v facodi.youtube_videos%rowtype; j facodi.analysis_jobs%rowtype; obj uuid; n int; url text;
begin
 if p_youtube_id is null or p_youtube_id !~ '^[A-Za-z0-9_-]{11}$' then return jsonb_build_object('success',false,'error','invalid_youtube_id'); end if;
 if p_course_id is not null and not exists(select 1 from facodi.courses where id=p_course_id and published and status='active') then return jsonb_build_object('success',false,'error','invalid_course_scope'); end if;
 perform pg_advisory_xact_lock(hashtextextended('facodi.kf_v2_reference:'||p_youtube_id,0));
 url:='https://www.youtube.com/watch?v='||p_youtube_id;
 select count(*) into n from facodi.learning_objects where object_type='video' and (source_id=p_youtube_id or source_url=url);
 if n>1 then return jsonb_build_object('success',false,'error','ambiguous_catalog_identity'); end if;
 select id into obj from facodi.learning_objects where object_type='video' and (source_id=p_youtube_id or source_url=url);
 select * into v from facodi.youtube_videos where youtube_video_id=p_youtube_id for update;
 if found then
  if v.canonical_url is distinct from url or (v.learning_object_id is not null and v.learning_object_id is distinct from obj) or v.status='archived' then return jsonb_build_object('success',false,'error','existing_identity_conflict'); end if;
 else
  insert into facodi.youtube_videos(youtube_video_id,canonical_url,learning_object_id,status,metadata) values(p_youtube_id,url,obj,'pending',jsonb_build_object('ingest_contract','v2_reference_review.v1','publication_authorized',false)) returning * into v;
 end if;
 select * into j from facodi.analysis_jobs where video_id=v.id and request_source='facodi_editor_pipeline' and job_type='classify_youtube_video' and input_payload->>'contract'='v2_reference_review.v1' and input_payload->>'course_id' is not distinct from p_course_id::text and status<>'cancelled' order by created_at limit 1;
 if found then return jsonb_build_object('success',true,'reused',true,'job_id',j.id,'video_id',v.id,'youtube_video_id',p_youtube_id,'canonical_url',url,'status',j.status); end if;
 j:=facodi.queue_analysis_job('classify_youtube_video',coalesce(v.learning_object_id,obj),v.id,p_youtube_id,url,p_actor,'facodi_editor_pipeline',jsonb_build_object('contract','v2_reference_review.v1','course_id',p_course_id,'publication_authorized',false),'ingested');
 return jsonb_build_object('success',true,'reused',false,'job_id',j.id,'video_id',v.id,'youtube_video_id',p_youtube_id,'canonical_url',url,'status',j.status);
end $$;
revoke all on function facodi.kf_v2_ingest_reference_v1(text,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function facodi.kf_v2_ingest_reference_v1(text,uuid,uuid) to service_role;

create or replace function facodi.kf_v2_process_reference_v1(p_job uuid,p_stages text[] default array['v2_fetch_youtube_metadata','v2_extract_video_content','v2_match_video_candidates','v2_classify_video'],p_retry boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare j facodi.analysis_jobs%rowtype; v facodi.youtube_videos%rowtype; payload jsonb; step text; r extensions.http_response; info jsonb; ranks jsonb; course uuid; best uuid; cid uuid; err text; event_count int:=0;
begin
 if p_job is null or p_stages is null or cardinality(p_stages) not between 1 and 5 or exists(select 1 from unnest(p_stages) s where s is null or s not in ('v2_fetch_youtube_metadata','v2_extract_video_content','v2_match_video_candidates','v2_classify_video','v2_generate_embeddings')) or (select count(distinct s) from unnest(p_stages) s)<>cardinality(p_stages) then return jsonb_build_object('success',false,'error','invalid_pipeline_stage'); end if;
 select * into j from facodi.analysis_jobs where id=p_job and request_source='facodi_editor_pipeline' and job_type='classify_youtube_video' and input_payload->>'contract'='v2_reference_review.v1' for update;
 if not found then return jsonb_build_object('success',false,'error','job_not_found_or_out_of_scope'); end if;
 select * into v from facodi.youtube_videos where id=j.video_id and youtube_video_id=j.youtube_video_id and canonical_url='https://www.youtube.com/watch?v='||j.youtube_video_id and status<>'archived';
 if not found then return jsonb_build_object('success',false,'error','video_identity_conflict'); end if;
 if j.status='needs_review' and j.result_payload ? 'classification' then return jsonb_build_object('success',true,'reused',true,'job_id',j.id,'video_id',v.id,'status',j.status,'current_step',j.current_step,'classification_id',j.result_payload->'classification'->'id','result',j.result_payload); end if;
 if j.status not in ('queued','running','retrying','failed') or (j.status='failed' and (not coalesce(p_retry,false) or j.attempts>=3)) then return jsonb_build_object('success',false,'error','job_state_or_retry_limit'); end if;
 payload:=j.result_payload||jsonb_build_object('contract','v2_reference_review.v1','publication_authorized',false,'full_content_reviewed',false,'license_verified',false);
 course:=(j.input_payload->>'course_id')::uuid;
 if course is not null and not exists(select 1 from facodi.courses where id=course and published and status='active') then return jsonb_build_object('success',false,'error','invalid_course_scope'); end if;
 -- Validate the complete requested stage sequence before doing network work.
 declare available jsonb:=payload; begin
 foreach step in array p_stages loop
  if step='v2_fetch_youtube_metadata' then available:=available||'{"metadata_evidence":true}'::jsonb;
  elsif step='v2_extract_video_content' then if not (available ? 'metadata_evidence') then return jsonb_build_object('success',false,'error','metadata_required'); end if; available:=available||'{"extraction":true}'::jsonb;
  elsif step='v2_match_video_candidates' then if not (available ? 'extraction') then return jsonb_build_object('success',false,'error','extraction_required'); end if; available:=available||'{"candidates":true}'::jsonb;
  elsif step='v2_classify_video' then if not (available ? 'candidates') then return jsonb_build_object('success',false,'error','candidates_required'); end if;
  end if;
 end loop; end;
 update facodi.analysis_jobs set status='running',attempts=attempts+case when j.status in ('queued','failed','retrying') then 1 else 0 end,started_at=coalesce(started_at,now()),error_code=null,error_message=null where id=j.id;
 foreach step in array p_stages loop
  if step='v2_fetch_youtube_metadata' and not (payload ? 'metadata_evidence') then
   info:=null;
   begin
    if not extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS','4000') then raise exception 'timeout_not_configured'; end if;
    select * into r from extensions.http_get('https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'||j.youtube_video_id);
    if r.status=200 and length(r.content)<=30000 then info:=r.content::jsonb; end if;
    perform extensions.http_reset_curlopt();
   exception when others then perform extensions.http_reset_curlopt(); info:=null; end;
   if info->>'type' is distinct from 'video' or nullif(btrim(info->>'title'),'') is null or nullif(btrim(info->>'author_name'),'') is null then err:='source_unverified'; exit; end if;
   payload:=payload||jsonb_build_object('metadata_evidence',jsonb_build_object('scope','public_oembed_metadata_only','title',left(info->>'title',500),'author',left(info->>'author_name',250),'youtube_video_id',j.youtube_video_id,'checked_at',now(),'http_status',200));
   -- Only fill previously empty fields on a private record created by this contract.
   update facodi.youtube_videos set title=coalesce(title,left(info->>'title',500)),channel_title=coalesce(channel_title,left(info->>'author_name',250)) where id=v.id and status='pending' and metadata->>'ingest_contract'='v2_reference_review.v1';
  elsif step='v2_extract_video_content' and not (payload ? 'extraction') then
   payload:=payload||jsonb_build_object('extraction',jsonb_build_object('scope','verified_title_only','text',payload->'metadata_evidence'->>'title','transcript_available',false,'content_reviewed',false));
  elsif step='v2_match_video_candidates' and not (payload ? 'candidates') then
   select coalesce(jsonb_agg(jsonb_build_object('unit_id',x.id,'course_id',u.course_id,'title',x.title,'rank',x.rank) order by x.rank desc,x.title,x.id),'[]'::jsonb) into ranks
   from facodi.rank_resource_suggestion_units(payload->'extraction'->>'text',course,null,10) x join facodi.curricular_units u on u.id=x.id and u.published and u.status='active' where x.rank>0;
   payload:=payload||jsonb_build_object('candidates',ranks,'ranking_scope','lexical_heuristic_not_confidence');
  elsif step='v2_classify_video' and not (payload ? 'classification') then
   ranks:=payload->'candidates'; cid:=null; best:=null;
   if course is not null and jsonb_array_length(ranks)>0 and (ranks->0->>'rank')::numeric>coalesce((ranks->1->>'rank')::numeric,0) then
    best:=(ranks->0->>'unit_id')::uuid;
    perform pg_advisory_xact_lock(hashtextextended('facodi.kf_v2_classification:'||v.id::text||':'||best::text,0));
    select id into cid from facodi.video_classifications where video_id=v.id and curricular_unit_id=best order by created_at limit 1;
    if not found then
     insert into facodi.video_classifications(video_id,course_id,curricular_unit_id,confidence,status,needs_review,justification,evidence,metadata) values(v.id,course,best,0,'needs_review',true,'Correspondência lexical preliminar; requer revisão pedagógica.',jsonb_build_array(jsonb_build_object('kind','lexical_ranking','job_id',j.id,'ranking',ranks,'scope','verified_title_only')),jsonb_build_object('contract','v2_reference_review.v1','confidence_unscored',true,'job_id',j.id,'publication_authorized',false)) returning id into cid;
    end if;
   end if;
   payload:=payload||jsonb_build_object('classification',jsonb_build_object('id',cid,'candidate_unit_id',best,'needs_review',true,'confidence_unscored',true,'publication_authorized',false));
  elsif step='v2_generate_embeddings' then
   payload:=payload||jsonb_build_object('embeddings',jsonb_build_object('status','not_generated','reason','metadata_only_contract'));
  end if;
  insert into facodi.analysis_job_events(job_id,event_type,message,metadata) values(j.id,'stage_succeeded','V2 reference review stage completed',jsonb_build_object('step',step,'scope','metadata_only'));
  event_count:=event_count+1;
 end loop;
 if err is not null then
  update facodi.analysis_jobs set status='failed',current_step=step,error_code=err,error_message='Source metadata unavailable or not verified',completed_at=now(),result_payload=payload where id=j.id;
  insert into facodi.analysis_job_events(job_id,event_type,message,metadata) values(j.id,'stage_failed','Source metadata unavailable or not verified',jsonb_build_object('step',step,'error_code',err));
  return jsonb_build_object('success',false,'error',err,'job_id',j.id,'status','failed');
 end if;
 update facodi.analysis_jobs set status=case when payload ? 'classification' then 'needs_review' else 'running' end,current_step=p_stages[cardinality(p_stages)],completed_at=case when payload ? 'classification' then now() else null end,result_payload=payload where id=j.id returning * into j;
 return jsonb_build_object('success',true,'job_id',j.id,'video_id',v.id,'youtube_video_id',v.youtube_video_id,'status',j.status,'current_step',j.current_step,'classification_id',payload->'classification'->'id','result',payload,'events_written',event_count);
end $$;
revoke all on function facodi.kf_v2_process_reference_v1(uuid,text[],boolean) from public,anon,authenticated,service_role;
grant execute on function facodi.kf_v2_process_reference_v1(uuid,text[],boolean) to service_role;
