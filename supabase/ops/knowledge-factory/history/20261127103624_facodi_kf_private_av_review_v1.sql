create or replace function facodi.kf_run_private_av_review_v1()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare j record; key text; r extensions.http_response; b jsonb; safe_result jsonb; outcome text;
begin
 if not pg_try_advisory_xact_lock(391726,6) then return jsonb_build_object('ok',true,'reason','busy'); end if;
 if exists(select 1 from facodi.analysis_jobs where request_source='kf_private_candidate_review_v1' and result_payload->'kf_av_review'->>'attempt_date'=current_date::text) then return jsonb_build_object('ok',true,'reason','daily_limit'); end if;
 select a.id,a.video_id,a.learning_object_id,o.title,o.source_url,u.id unit_id,u.course_id into j
 from facodi.analysis_jobs a join facodi.youtube_videos y on y.id=a.video_id and y.learning_object_id=a.learning_object_id
 join facodi.learning_objects o on o.id=y.learning_object_id
 join facodi.curricular_units u on u.id::text=o.metadata->'kf_curricular_candidate_v1'->>'unit_id'
 where a.request_source='kf_private_candidate_review_v1' and a.status='needs_review' and a.result_payload->>'outcome'='lexical_support' and not (a.result_payload ? 'kf_av_review')
 and y.status='pending' and o.status='draft' and not o.published and o.metadata->>'editorial_batch'='facodi-kf-legacy-studio-20261127'
 and y.youtube_video_id=o.source_id and o.source_id ~ '^[A-Za-z0-9_-]{11}$' and o.source_url='https://www.youtube.com/watch?v='||o.source_id and u.published
 order by o.slug limit 1 for update of a;
 if not found then return jsonb_build_object('ok',true,'reason','empty'); end if;
 select decrypted_secret into key from vault.decrypted_secrets where name='facodi_suggestion_worker_secret';
 if key is null or length(key)<32 then return jsonb_build_object('ok',false,'reason','credential_unavailable'); end if;
 begin
 perform set_config('http.curlopt_timeout_msec','25000',true);
 select * into r from extensions.http(('POST','https://wvkjainfwsyiyfcmbtid.supabase.co/functions/v1/facodi-suggestion-analysis',array[extensions.http_header('x-facodi-worker-secret',key)],'application/json',jsonb_build_object('dry_run',jsonb_build_object('title',j.title,'canonical_url',j.source_url,'provider','youtube','object_type','video','language','pt','course_id',j.course_id))::text)::extensions.http_request);
 if r.status=200 and length(r.content)<=60000 then
 b:=r.content::jsonb;
 outcome:=case when b->'evidence'->>'level'='content_video' and b->'evidence'->'sources' ? 'gemini_video' and length(coalesce(b->'evidence'->>'content_summary',''))>=40 then 'partial_av_evidence' else 'metadata_only_or_no_av' end;
 safe_result:=jsonb_build_object('outcome',outcome,'http_status',r.status,'evidence',b->'evidence','matching',b->'matching','confirmation',b->'confirmation','usage',b->'usage','strong_unit_ids',b->'strong_unit_ids','scope','provider_reported_first_300_seconds_max','full_content_reviewed',false,'license_verified',false,'publication_authorized',false);
 else
 safe_result:=jsonb_build_object('outcome','request_failed','http_status',r.status);
 end if;
 exception when others then
 safe_result:=jsonb_build_object('outcome','transport_or_response_error');
 end;
 safe_result:=safe_result||jsonb_build_object('attempt_date',current_date,'checked_at',now());
 update facodi.analysis_jobs set result_payload=result_payload||jsonb_build_object('kf_av_review',safe_result) where id=j.id;
 insert into facodi.analysis_job_events(job_id,event_type,message,metadata) values(j.id,'needs_review','Bounded private audiovisual dry run; no publication.',jsonb_build_object('outcome',safe_result->>'outcome'));
 return jsonb_build_object('ok',true,'job_id',j.id,'outcome',safe_result->>'outcome','http_status',safe_result->'http_status');
end $$;
revoke all on function facodi.kf_run_private_av_review_v1() from public,anon,authenticated,service_role;
