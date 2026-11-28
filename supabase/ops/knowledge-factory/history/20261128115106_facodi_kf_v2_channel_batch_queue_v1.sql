create or replace function facodi.kf_v2_enqueue_channel_v1(p_youtube_ids text[],p_course_id uuid default null,p_actor uuid default null,p_start boolean default true) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_id text; r jsonb; jobs jsonb:='[]'::jsonb; jid uuid;
begin
 if p_actor is null or p_youtube_ids is null or cardinality(p_youtube_ids) not between 1 and 20 or exists(select 1 from unnest(p_youtube_ids) x where x is null or x !~ '^[A-Za-z0-9_-]{11}$') then return jsonb_build_object('success',false,'error','invalid_batch');end if;
 if p_course_id is not null and not exists(select 1 from facodi.courses where id=p_course_id and published and status='active') then return jsonb_build_object('success',false,'error','invalid_course_scope');end if;
 for v_id in select distinct x from unnest(p_youtube_ids) x order by x loop
  r:=facodi.kf_v2_ingest_reference_v1(v_id,p_course_id,p_actor);
  if r->>'success'='true' and coalesce(p_start,true) then
   jid:=(r->>'job_id')::uuid;
   update facodi.analysis_jobs set input_payload=input_payload||jsonb_build_object('auto_process',true)
   where id=jid and status in ('queued','retrying') and request_source='facodi_editor_pipeline' and input_payload->>'contract'='v2_reference_review.v1';
  end if;
  jobs:=jobs||jsonb_build_array(r);
 end loop;
 return jsonb_build_object('success',true,'jobs',jobs,'submitted',jsonb_array_length(jobs),'accepted',(select count(*) from jsonb_array_elements(jobs)x where x->>'success'='true'),'processing',case when coalesce(p_start,true) then 'scheduled_metadata_review' else 'manual' end);
end $$;
revoke all on function facodi.kf_v2_enqueue_channel_v1(text[],uuid,uuid,boolean) from public,anon,authenticated,service_role;
grant execute on function facodi.kf_v2_enqueue_channel_v1(text[],uuid,uuid,boolean) to service_role;
create or replace function facodi.kf_run_v2_reference_queue_v1() returns jsonb language plpgsql security invoker set search_path='' as $$
declare j facodi.analysis_jobs%rowtype; r jsonb;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('facodi.kf_run_v2_reference_queue_v1',0)) then return jsonb_build_object('ok',true,'reason','busy');end if;
 select * into j from facodi.analysis_jobs where request_source='facodi_editor_pipeline' and job_type='classify_youtube_video' and input_payload->>'contract'='v2_reference_review.v1' and input_payload->>'auto_process'='true' and status in ('queued','retrying') and next_attempt_at<=now() and attempts<3 order by created_at,id limit 1 for update skip locked;
 if not found then return jsonb_build_object('ok',true,'reason','idle');end if;
 r:=facodi.kf_v2_process_reference_v1(j.id);
 if r->>'success' is distinct from 'true' then
  -- Source unavailability is an explicit failed job, not a successful review.
  update facodi.analysis_jobs set status='failed',error_code=left(coalesce(r->>'error','pipeline_failed'),120),error_message='Scheduled reference review did not complete; review the source or job contract.',completed_at=now() where id=j.id and status in ('queued','running','retrying');
  return jsonb_build_object('ok',false,'reason',coalesce(r->>'error','pipeline_failed'),'job_id',j.id);
 end if;
 return jsonb_build_object('ok',true,'reason','processed','job_id',j.id,'status',r->>'status');
end $$;
revoke all on function facodi.kf_run_v2_reference_queue_v1() from public,anon,authenticated,service_role;
select cron.schedule('facodi-kf-v2-reference-queue','6,21,36,51 * * * *','select facodi.kf_run_v2_reference_queue_v1();');
