create or replace function facodi.kf_claim_private_av_v2()
returns jsonb
language plpgsql security invoker
set search_path = ''
as $$
declare
  candidate record;
  lease_token uuid := gen_random_uuid();
  attempt_date text := (now() at time zone 'UTC')::date::text;
begin
  if not pg_try_advisory_xact_lock(391726, 6) then
    return jsonb_build_object('reason', 'busy');
  end if;

  update facodi.analysis_jobs
  set result_payload = jsonb_set(result_payload, '{kf_av_async}',
    ((result_payload->'kf_av_async') - 'lease_token'::text)
      || jsonb_build_object('outcome', 'expired', 'finished_at', now()), false)
  where request_source = 'kf_private_candidate_review_v1' and status = 'needs_review'
    and result_payload->'kf_av_async'->>'outcome' = 'running'
    and (result_payload->'kf_av_async'->>'expires_at')::timestamptz < now();

  if exists (
    select 1 from facodi.analysis_jobs
    where request_source = 'kf_private_candidate_review_v1'
      and result_payload->'kf_av_async'->>'outcome' = 'running'
  ) then
    return jsonb_build_object('reason', 'running');
  end if;

  if exists (
    select 1 from facodi.analysis_jobs
    where request_source = 'kf_private_candidate_review_v1'
      and result_payload->'kf_av_async'->>'attempt_date' = attempt_date
  ) then
    return jsonb_build_object('reason', 'daily_limit');
  end if;

  if (
    select count(*) from (
      select entry.value->>'outcome' as outcome
      from facodi.analysis_jobs a
      cross join lateral (values (a.result_payload->'kf_av_async'),
                                  (a.result_payload->'kf_av_async_previous')) entry(value)
      where a.request_source = 'kf_private_candidate_review_v1' and entry.value is not null
      order by entry.value->>'started_at' desc nulls last, a.id
      limit 2
    ) recent where outcome in ('request_failed', 'expired', 'transport_or_response_error')
  ) = 2 then
    return jsonb_build_object('reason', 'circuit_open');
  end if;

  select a.id, o.title, o.source_url, u.course_id into candidate
  from facodi.analysis_jobs a
  join facodi.youtube_videos y on y.id = a.video_id and y.learning_object_id = a.learning_object_id
  join facodi.learning_objects o on o.id = y.learning_object_id
  join facodi.curricular_units u on u.id::text = o.metadata->'kf_curricular_candidate_v1'->>'unit_id'
  join facodi.courses c on c.id = u.course_id
  where a.request_source = 'kf_private_candidate_review_v1' and a.status = 'needs_review'
    and a.result_payload->>'outcome' = 'lexical_support'
    and (
      not (a.result_payload ? 'kf_av_async')
      or (
        not (a.result_payload ? 'kf_av_async_previous')
        and a.result_payload->'kf_av_async'->>'outcome' = 'request_failed'
        and a.result_payload->'kf_av_async'->>'http_status' in ('502', '503', '504')
      )
    )
    and (
      not (a.result_payload ? 'kf_av_review')
      or a.result_payload->'kf_av_review'->>'outcome' = 'transport_or_response_error'
      or (
        a.result_payload->'kf_av_review'->>'outcome' = 'request_failed'
        and a.result_payload->'kf_av_review'->>'http_status' ~ '^5[0-9]{2}$'
      )
    )
    and y.status = 'pending' and o.status = 'draft' and not o.published
    and o.metadata->>'editorial_batch' = 'facodi-kf-legacy-studio-20261127'
    and y.youtube_video_id = o.source_id and o.source_id ~ '^[A-Za-z0-9_-]{11}$'
    and o.source_url = 'https://www.youtube.com/watch?v=' || o.source_id
    and u.published and c.published
  order by (a.result_payload ? 'kf_av_async'), (a.result_payload ? 'kf_av_review'), o.slug, a.id
  limit 1 for update of a;

  if not found then
    return jsonb_build_object('reason', 'empty');
  end if;

  update facodi.analysis_jobs
  set result_payload = result_payload
    || case when result_payload ? 'kf_av_async'
            then jsonb_build_object('kf_av_async_previous',
                                     (result_payload->'kf_av_async') - 'lease_token'::text)
            else '{}'::jsonb end
    || jsonb_build_object('kf_av_async', jsonb_build_object(
         'outcome', 'running', 'lease_token', lease_token, 'started_at', now(),
         'expires_at', now() + interval '8 minutes', 'attempt_date', attempt_date,
         'publication_authorized', false))
  where id = candidate.id;

  return jsonb_build_object('reason', 'claimed', 'job_id', candidate.id, 'lease_token', lease_token,
    'title', candidate.title, 'canonical_url', candidate.source_url, 'course_id', candidate.course_id);
end;
$$;

revoke all on function facodi.kf_claim_private_av_v2() from public, anon, authenticated, service_role;
grant execute on function facodi.kf_claim_private_av_v2() to service_role;
