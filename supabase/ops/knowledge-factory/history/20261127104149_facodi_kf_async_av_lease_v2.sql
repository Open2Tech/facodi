create or replace function facodi.kf_claim_private_av_v2() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare j record; token uuid:=gen_random_uuid(); expired record;
begin
 if not pg_try_advisory_xact_lock(391726,6) then return jsonb_build_object('reason','busy'); end if;
 for expired in select id from facodi.analysis_jobs where request_source='kf_private_candidate_review_v1' and status='needs_review' and result_payload->'kf_av_async'->>'outcome'='running' and (result_payload->'kf_av_async'->>'expires_at')::timestamptz<now() for update loop
  update facodi.analysis_jobs set result_payload=jsonb_set(result_payload,'{kf_av_async}',(result_payload->'kf_av_async'-'lease_token')||jsonb_build_object('outcome','expired','finished_at',now()),false) where id=expired.id;
 end loop;
 if exists(select 1 from facodi.analysis_jobs where request_source='kf_private_candidate_review_v1' and result_payload->'kf_av_async'->>'outcome'='running') then return jsonb_build_object('reason','running'); end if;
 if exists(select 1 from facodi.analysis_jobs where request_source='kf_private_candidate_review_v1' and result_payload->'kf_av_async'->>'attempt_date'=(now() at time zone 'UTC')::date::text) then return jsonb_build_object('reason','daily_limit'); end if;
 if (select count(*) from (select result_payload->'kf_av_async'->>'outcome' outcome from facodi.analysis_jobs where request_source='kf_private_candidate_review_v1' and result_payload ? 'kf_av_async' order by result_payload->'kf_av_async'->>'started_at' desc limit 2) z where z.outcome in ('request_failed','expired','transport_or_response_error'))=2 then return jsonb_build_object('reason','circuit_open'); end if;
 select a.id,o.title,o.source_url,u.course_id into j from facodi.analysis_jobs a join facodi.youtube_videos y on y.id=a.video_id and y.learning_object_id=a.learning_object_id join facodi.learning_objects o on o.id=y.learning_object_id join facodi.curricular_units u on u.id::text=o.metadata->'kf_curricular_candidate_v1'->>'unit_id' join facodi.courses c on c.id=u.course_id
 where a.request_source='kf_private_candidate_review_v1' and a.status='needs_review' and a.result_payload->>'outcome'='lexical_support' and not (a.result_payload ? 'kf_av_async') and not (a.result_payload ? 'kf_av_review') and y.status='pending' and o.status='draft' and not o.published and o.metadata->>'editorial_batch'='facodi-kf-legacy-studio-20261127' and y.youtube_video_id=o.source_id and o.source_id ~ '^[A-Za-z0-9_-]{11}$' and o.source_url='https://www.youtube.com/watch?v='||o.source_id and u.published and c.published order by o.slug limit 1 for update of a;
 if not found then return jsonb_build_object('reason','empty'); end if;
 update facodi.analysis_jobs set result_payload=result_payload||jsonb_build_object('kf_av_async',jsonb_build_object('outcome','running','lease_token',token,'started_at',now(),'expires_at',now()+interval '8 minutes','attempt_date',(now() at time zone 'UTC')::date,'publication_authorized',false)) where id=j.id;
 return jsonb_build_object('reason','claimed','job_id',j.id,'lease_token',token,'title',j.title,'canonical_url',j.source_url,'course_id',j.course_id);
end $$;
revoke all on function facodi.kf_claim_private_av_v2() from public,anon,authenticated,service_role;
grant execute on function facodi.kf_claim_private_av_v2() to service_role;
create or replace function facodi.kf_finish_private_av_v2(p_job uuid,p_token uuid,p_status integer,p_result jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare a facodi.analysis_jobs%rowtype; outcome text; evidence jsonb; v jsonb;
begin
 select * into a from facodi.analysis_jobs where id=p_job and request_source='kf_private_candidate_review_v1' and status='needs_review' for update;
 if not found or a.result_payload->'kf_av_async'->>'lease_token' is distinct from p_token::text or a.result_payload->'kf_av_async'->>'outcome' is distinct from 'running' or (a.result_payload->'kf_av_async'->>'expires_at')::timestamptz<now() then return jsonb_build_object('ok',false,'reason','lease_invalid'); end if;
 if not exists(select 1 from facodi.learning_objects o join facodi.youtube_videos y on y.learning_object_id=o.id where o.id=a.learning_object_id and y.id=a.video_id and o.status='draft' and not o.published and y.status='pending' and o.metadata->>'editorial_batch'='facodi-kf-legacy-studio-20261127') then return jsonb_build_object('ok',false,'reason','scope_changed'); end if;
 if p_status=200 and jsonb_typeof(p_result)='object' and length(p_result::text)<=60000 then
 evidence:=p_result->'evidence';
 outcome:=case when evidence->>'level'='content_video' and evidence->'sources' ? 'gemini_video' and length(coalesce(evidence->>'content_summary',''))>=40 then 'partial_av_evidence' else 'metadata_only_or_no_av' end;
 v:=jsonb_build_object('evidence',evidence,'matching',p_result->'matching','confirmation',p_result->'confirmation','usage',p_result->'usage','strong_unit_ids',p_result->'strong_unit_ids');
 else outcome:='request_failed';v:='{}'::jsonb; end if;
 v:=v||jsonb_build_object('outcome',outcome,'http_status',p_status,'finished_at',now(),'scope','provider_reported_first_300_seconds_max','full_content_reviewed',false,'license_verified',false,'publication_authorized',false);
 update facodi.analysis_jobs set result_payload=jsonb_set(result_payload,'{kf_av_async}',(result_payload->'kf_av_async'-'lease_token')||v,false) where id=p_job;
 insert into facodi.analysis_job_events(job_id,event_type,message,metadata) values(p_job,'needs_review','Private asynchronous audiovisual review; no publication.',jsonb_build_object('outcome',outcome));
 return jsonb_build_object('ok',true,'outcome',outcome);
end $$;
revoke all on function facodi.kf_finish_private_av_v2(uuid,uuid,integer,jsonb) from public,anon,authenticated,service_role;
grant execute on function facodi.kf_finish_private_av_v2(uuid,uuid,integer,jsonb) to service_role;
