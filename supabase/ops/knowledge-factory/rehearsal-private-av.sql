-- Run with psql against an empty scratch PostgreSQL database.
\set ON_ERROR_STOP on
begin;
create schema facodi;
create role anon;
create role authenticated;
create role service_role;

create table facodi.courses (id uuid primary key, published boolean not null);
create table facodi.curricular_units (id uuid primary key, course_id uuid, published boolean);
create table facodi.learning_objects (
  id uuid primary key, slug text, title text, source_id text, source_url text,
  status text, published boolean, metadata jsonb
);
create table facodi.youtube_videos (id uuid primary key, learning_object_id uuid, youtube_video_id text, status text);
create table facodi.analysis_jobs (
  id uuid primary key, video_id uuid, learning_object_id uuid,
  request_source text, status text, result_payload jsonb not null
);
create table facodi.analysis_job_events (job_id uuid, event_type text, message text, metadata jsonb);

\ir history/20261127104149_facodi_kf_async_av_lease_v2.sql
\ir history/20261127104424_facodi_kf_av_json_operator_fix.sql
\ir history/20261127124213_facodi_kf_retry_transient_async_av.sql

do $rehearsal$
declare
  course uuid := gen_random_uuid();
  unit uuid := gen_random_uuid();
  failed_job uuid := gen_random_uuid();
  fresh_job uuid := gen_random_uuid();
  stale_token uuid := gen_random_uuid();
  now_utc date := (now() at time zone 'UTC')::date;
  response jsonb;
  row_data jsonb;
begin
  if has_function_privilege('anon', 'facodi.kf_claim_private_av_v2()', 'EXECUTE')
    or has_function_privilege('authenticated', 'facodi.kf_claim_private_av_v2()', 'EXECUTE')
    or not has_function_privilege('service_role', 'facodi.kf_claim_private_av_v2()', 'EXECUTE') then
    raise exception 'Unexpected claim grants';
  end if;

  insert into facodi.courses values (course, true);
  insert into facodi.curricular_units values (unit, course, true);
  insert into facodi.learning_objects
    select id, slug, slug, source, 'https://www.youtube.com/watch?v=' || source, 'draft', false,
      jsonb_build_object('editorial_batch', 'facodi-kf-legacy-studio-20261127',
                        'kf_curricular_candidate_v1', jsonb_build_object('unit_id', unit))
    from (values (failed_job, 'a-failed', 'fixture0001'), (fresh_job, 'b-fresh', 'fixture0002')) seed(id, slug, source);
  insert into facodi.youtube_videos select id, id, source_id, 'pending' from facodi.learning_objects;
  insert into facodi.analysis_jobs values
    (failed_job, failed_job, failed_job, 'kf_private_candidate_review_v1', 'needs_review',
      jsonb_build_object('outcome', 'lexical_support', 'kf_av_async', jsonb_build_object(
        'outcome', 'request_failed', 'http_status', 502, 'lease_token', stale_token,
        'started_at', now() - interval '2 days', 'attempt_date', now_utc - 2))),
    (fresh_job, fresh_job, fresh_job, 'kf_private_candidate_review_v1', 'needs_review',
      '{"outcome":"lexical_support"}');

  response := facodi.kf_claim_private_av_v2();
  if response->>'job_id' is distinct from fresh_job::text then
    raise exception 'First attempts must precede retries';
  end if;
  if (facodi.kf_claim_private_av_v2()->>'reason') is distinct from 'running' then
    raise exception 'A running lease must block another claim';
  end if;
  response := facodi.kf_finish_private_av_v2(fresh_job, (response->>'lease_token')::uuid, 200, '{}');
  if response->>'outcome' is distinct from 'metadata_only_or_no_av'
    or (facodi.kf_claim_private_av_v2()->>'reason') is distinct from 'daily_limit' then
    raise exception 'Finishing a job must leave the daily cap in place';
  end if;
  update facodi.analysis_jobs set result_payload = jsonb_set(result_payload, '{kf_av_async}',
    (result_payload->'kf_av_async') || jsonb_build_object('started_at', now() - interval '1 day', 'attempt_date', now_utc - 1))
    where id = fresh_job;

  response := facodi.kf_claim_private_av_v2();
  if response->>'job_id' is distinct from failed_job::text then
    raise exception 'A previous gateway error should be eligible for one retry';
  end if;
  select result_payload into row_data from facodi.analysis_jobs where id = failed_job;
  if row_data->'kf_av_async_previous'->>'http_status' is distinct from '502'
    or row_data->'kf_av_async_previous' ? 'lease_token'
    or row_data->'kf_av_async'->>'publication_authorized' is distinct from 'false' then
    raise exception 'Previous attempt history, lease redaction, or publication state changed unexpectedly';
  end if;
  if (facodi.kf_finish_private_av_v2(failed_job, stale_token, 200, '{}')->>'reason') is distinct from 'lease_invalid' then
    raise exception 'A previous lease must not complete the retry';
  end if;
  response := facodi.kf_finish_private_av_v2(failed_job, (response->>'lease_token')::uuid, 503, '{}');
  if response->>'outcome' is distinct from 'request_failed'
    or (facodi.kf_claim_private_av_v2()->>'reason') is distinct from 'daily_limit' then
    raise exception 'The retry must count against the daily cap';
  end if;
  update facodi.analysis_jobs set result_payload = jsonb_set(result_payload, '{kf_av_async,attempt_date}', to_jsonb(now_utc - 1))
    where id = failed_job;
  if (facodi.kf_claim_private_av_v2()->>'reason') is distinct from 'empty' then
    raise exception 'A repeated failure must not re-enter the queue';
  end if;
  update facodi.analysis_jobs set result_payload = jsonb_set(result_payload, '{kf_av_async,started_at}', to_jsonb(now() - interval '3 days'))
    where id = fresh_job;
  if (facodi.kf_claim_private_av_v2()->>'reason') is distinct from 'circuit_open' then
    raise exception 'Two consecutive failures must open the circuit, including a previous attempt on the same job';
  end if;
  update facodi.analysis_jobs set result_payload = jsonb_set(result_payload - 'kf_av_async_previous',
    '{kf_av_async,http_status}', '401') where id = failed_job;
  if (facodi.kf_claim_private_av_v2()->>'reason') is distinct from 'empty' then
    raise exception 'An authentication error must not be retried';
  end if;
  if exists (select 1 from facodi.learning_objects where published or status <> 'draft') then
    raise exception 'Private AV analysis changed draft publication';
  end if;
end
$rehearsal$;
rollback;
select 'private AV recovery rehearsal passed' as result;
