-- Automatic analysis of learner resource suggestions (docs/suggest-ai-analysis-plan.md).
-- The existing facodi.analysis_jobs table is the durable queue: one job per pending suggestion,
-- enqueued in the same transaction as the insert. The facodi-suggestion-analysis Edge Function
-- claims jobs with a lease, ranks public units textually and asks the AI to pick at most three.
-- Results stay advisory: nothing is approved, linked or published without an editor.
-- facodi.analysis_results is not used: it requires a learning object, which a suggestion lacks.

create extension if not exists pg_net with schema extensions;

alter table facodi.analysis_jobs
  add column resource_suggestion_id uuid references facodi.resource_suggestions (id) on delete cascade,
  add column lease_token uuid,
  add column lease_expires_at timestamptz,
  add column next_attempt_at timestamptz not null default now();

alter table facodi.analysis_jobs drop constraint analysis_jobs_job_type_check;
alter table facodi.analysis_jobs add constraint analysis_jobs_job_type_check check (job_type = any (array[
  'classify_youtube_video', 'sync_course_catalog', 'generate_embeddings', 'import_youtube_video',
  'import_youtube_channel', 'analyze_video', 'match_video_to_curriculum', 'generate_playlist',
  'generate_module', 'generate_course_structure', 'sync_object_to_odoo', 'pull_odoo_records',
  'push_odoo_learning_object', 'analyze_resource_suggestion']));

comment on column facodi.analysis_jobs.resource_suggestion_id is
  'Suggestion analysed by an analyze_resource_suggestion job; requested_by is its submitter so RLS lets them follow it.';

create unique index analysis_jobs_resource_suggestion_key on facodi.analysis_jobs (resource_suggestion_id)
  where job_type = 'analyze_resource_suggestion';
create index analysis_jobs_suggestion_due_idx on facodi.analysis_jobs (next_attempt_at)
  where job_type = 'analyze_resource_suggestion' and status in ('queued', 'retrying', 'running');

create function facodi.enqueue_resource_suggestion_analysis()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Duplicates already exist in the catalogue; analysing them would only spend budget.
  if new.status = 'pending' then
    insert into facodi.analysis_jobs
      (job_type, resource_suggestion_id, requested_by, request_source, input_url, youtube_video_id, input_payload)
    values ('analyze_resource_suggestion', new.id, new.submitted_by, 'resource_suggestion', new.canonical_url,
      substring(new.canonical_url from '^https://www\.youtube\.com/watch\?v=([A-Za-z0-9_-]{11})$'),
      jsonb_build_object('analysis_version', 1))
    on conflict do nothing;
  end if;
  return null;
end
$$;

create trigger resource_suggestions_enqueue_analysis
  after insert on facodi.resource_suggestions
  for each row execute function facodi.enqueue_resource_suggestion_analysis();

-- Claims due jobs for the worker. Expired leases are reclaimed; jobs out of attempts are failed.
create function facodi.claim_resource_suggestion_analyses(p_limit integer default 3, p_lease_seconds integer default 120)
returns table (
  job_id uuid, lease_token uuid, attempts integer, current_step text, result_payload jsonb,
  suggestion_id uuid, suggestion_status text, canonical_url text, provider text, title text,
  object_type text, language text, tags text[], curricular_unit_id uuid
)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
begin
  update facodi.analysis_jobs j set
    status = 'failed', error_code = coalesce(j.error_code, 'attempts_exhausted'),
    lease_token = null, lease_expires_at = null, completed_at = now()
  where j.job_type = 'analyze_resource_suggestion' and j.attempts >= 3
    and (j.status in ('queued', 'retrying') or (j.status = 'running' and j.lease_expires_at < now()));

  return query
  with due as (
    select j.id from facodi.analysis_jobs j
    where j.job_type = 'analyze_resource_suggestion' and j.next_attempt_at <= now()
      and (j.status in ('queued', 'retrying') or (j.status = 'running' and j.lease_expires_at < now()))
    order by j.next_attempt_at
    limit least(greatest(p_limit, 1), 10)
    for update skip locked
  ), claimed as (
    update facodi.analysis_jobs j set
      status = 'running', attempts = j.attempts + 1, lease_token = gen_random_uuid(),
      lease_expires_at = now() + make_interval(secs => least(greatest(p_lease_seconds, 30), 600)),
      started_at = coalesce(j.started_at, now()), error_code = null, error_message = null
    from due where j.id = due.id
    returning j.id, j.lease_token, j.attempts, j.current_step, j.result_payload, j.resource_suggestion_id
  )
  select c.id, c.lease_token, c.attempts, c.current_step, c.result_payload,
    s.id, s.status, s.canonical_url, s.provider, s.title, s.object_type, s.language, s.tags, s.curricular_unit_id
  from claimed c join facodi.resource_suggestions s on s.id = c.resource_suggestion_id;
end
$$;

-- Reserves one paid AI call within the daily limit, atomically across concurrent workers.
create function facodi.reserve_resource_suggestion_ai_call(p_job_id uuid, p_lease_token uuid, p_daily_limit integer)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_used integer;
begin
  perform pg_advisory_xact_lock(hashtext('facodi.resource_suggestion_ai_budget'));
  if not exists (select 1 from facodi.analysis_jobs
    where id = p_job_id and lease_token = p_lease_token and status = 'running' and lease_expires_at > now()) then
    return 'lease_lost';
  end if;
  select count(*) into v_used from facodi.analysis_job_events e
  join facodi.analysis_jobs j on j.id = e.job_id
  where j.job_type = 'analyze_resource_suggestion' and e.event_type = 'ai_call'
    and e.created_at >= date_trunc('day', now());
  if v_used >= greatest(coalesce(p_daily_limit, 0), 0) then
    return 'budget_exhausted';
  end if;
  insert into facodi.analysis_job_events (job_id, event_type, message) values (p_job_id, 'ai_call', 'reserved');
  return 'reserved';
end
$$;

-- Text shortlist of public units; the learner's own choice is always included.
create function facodi.rank_resource_suggestion_units(p_text text, p_include uuid default null, p_limit integer default 12)
returns table (
  id uuid, code text, title text, summary text, slug text,
  course_code text, course_slug text, course_title text, rank real
)
language sql
stable
set search_path = ''
as $$
  with words as (
    select distinct w from regexp_split_to_table(
      lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(left(p_text, 2000), ''))), '[^a-z0-9]+') w
    where char_length(w) >= 3 and w not in (
      'the', 'and', 'for', 'with', 'from', 'que', 'com', 'para', 'por', 'dos', 'das', 'uma', 'del', 'los', 'las',
      'les', 'des', 'une', 'pour', 'avec', 'sur', 'sobre', 'como', 'aula', 'video', 'curso', 'course', 'parte',
      'part', 'introducao', 'introduction', 'introduccion', 'lecture', 'class', 'tutorial', 'www', 'http',
      'https', 'youtube')
  ), query as (
    -- Short prefixes absorb endings across languages (derivadas ~ derivada, programming ~ programacao)
    -- without a stemmer; the AI step discards the looser matches.
    select to_tsquery('simple', string_agg(
      case when char_length(w) >= 7 then left(w, 6) when char_length(w) = 6 then left(w, 5) else w end
        || ':*', ' | ')) q
    from (select w from words limit 40) limited
  ), units as (
    select u.id, u.code, u.title, u.summary, u.slug, c.code course_code, c.slug course_slug, c.title course_title,
      setweight(to_tsvector('simple', extensions.unaccent('extensions.unaccent'::regdictionary, u.title)), 'A')
        || setweight(to_tsvector('simple', extensions.unaccent('extensions.unaccent'::regdictionary,
          concat_ws(' ', u.summary, c.title))), 'C') doc
    from facodi.curricular_units u join facodi.courses c on c.id = u.course_id
    where u.status = 'active' and c.published and c.status = 'active'
  )
  select u.id, u.code, u.title, left(u.summary, 400), u.slug, u.course_code, u.course_slug, u.course_title,
    case when u.id = p_include then 1000000::real else ts_rank(u.doc, query.q) end
  from units u cross join query
  where u.id = p_include or (query.q is not null and u.doc @@ query.q)
  order by 9 desc, u.title
  limit least(greatest(p_limit, 1), 20);
$$;

-- Called every minute by pg_cron; only reaches the worker when a job is due.
create function facodi.dispatch_resource_suggestion_analysis()
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists (select 1 from facodi.analysis_jobs j
    where j.job_type = 'analyze_resource_suggestion' and j.next_attempt_at <= now()
      and (j.status in ('queued', 'retrying') or (j.status = 'running' and j.lease_expires_at < now()))) then
    return null;
  end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'facodi_project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'facodi_suggestion_worker_secret';
  if v_url is null or v_secret is null then
    raise warning 'FACODI suggestion analysis worker is not configured in Vault';
    return null;
  end if;
  return net.http_post(
    url := v_url || '/functions/v1/facodi-suggestion-analysis',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-facodi-worker-secret', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000);
end
$$;

-- Editors can queue a fresh analysis, e.g. after a failure or for a suggestion made before this feature.
create function facodi.retry_resource_suggestion_analysis(p_suggestion_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or not (select facodi.is_facodi_editor()) then
    raise exception 'FACODI editor permission required' using errcode = '42501';
  end if;
  insert into facodi.analysis_jobs
    (job_type, resource_suggestion_id, requested_by, request_source, input_url, youtube_video_id, input_payload)
  select 'analyze_resource_suggestion', s.id, s.submitted_by, 'resource_suggestion', s.canonical_url,
    substring(s.canonical_url from '^https://www\.youtube\.com/watch\?v=([A-Za-z0-9_-]{11})$'),
    jsonb_build_object('analysis_version', 1)
  from facodi.resource_suggestions s
  where s.id = p_suggestion_id and s.status in ('pending', 'duplicate')
  on conflict (resource_suggestion_id) where job_type = 'analyze_resource_suggestion' do update set
    status = 'queued', current_step = 'created', attempts = 0, next_attempt_at = now(),
    lease_token = null, lease_expires_at = null, error_code = null, error_message = null,
    result_payload = '{}', started_at = null, completed_at = null
  where facodi.analysis_jobs.status in ('succeeded', 'failed', 'needs_review', 'cancelled');
  if not found then
    raise exception 'Suggestion missing, reviewed or already being analysed' using errcode = '22023';
  end if;
end
$$;

-- The worker only reads suggestions; editors may now choose the unit when approving.
grant select on facodi.resource_suggestions to service_role;
grant update (curricular_unit_id) on facodi.resource_suggestions to authenticated;

drop function facodi.review_resource_suggestion(uuid, text, text);

create function facodi.review_resource_suggestion(
  p_suggestion_id uuid,
  p_decision text,
  p_review_note text default null,
  p_curricular_unit_id uuid default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_suggestion facodi.resource_suggestions%rowtype;
  v_unit uuid;
  v_object uuid;
  v_unit_object uuid;
  v_video text;
  v_slug text;
begin
  if auth.uid() is null or not (select facodi.is_facodi_editor()) then
    raise exception 'FACODI editor permission required' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected' using errcode = '22023';
  end if;
  if char_length(p_review_note) > 500 then
    raise exception 'Review note is too long' using errcode = '22023';
  end if;

  select * into v_suggestion from facodi.resource_suggestions where id = p_suggestion_id for update;
  if not found or v_suggestion.status not in ('pending', 'duplicate') then
    raise exception 'Suggestion missing or already reviewed' using errcode = '22023';
  end if;

  if p_curricular_unit_id is not null and not exists (
    select 1 from facodi.curricular_units u join facodi.courses c on c.id = u.course_id
    where u.id = p_curricular_unit_id and u.status = 'active' and c.published and c.status = 'active') then
    raise exception 'Unit must be active in a public course' using errcode = '22023';
  end if;
  v_unit := coalesce(p_curricular_unit_id, v_suggestion.curricular_unit_id);

  if p_decision = 'approved' then
    v_video := substring(v_suggestion.canonical_url from '^https://www\.youtube\.com/watch\?v=([A-Za-z0-9_-]{11})$');
    select lo.id into v_object from facodi.learning_objects lo
    where lo.source_url is not null
      and (facodi.normalize_resource_url(lo.source_url) = v_suggestion.canonical_url
        or (v_video is not null and lo.metadata ->> 'youtube_video_id' = v_video))
    order by lo.published desc, lo.created_at
    limit 1;

    if v_object is null then
      v_slug := left(btrim(regexp_replace(lower(extensions.unaccent('extensions.unaccent'::regdictionary,
        v_suggestion.title)), '[^a-z0-9]+', '-', 'g'), '-'), 60);
      v_slug := coalesce(nullif(btrim(v_slug, '-'), ''), 'recurso') || '-' || left(v_suggestion.id::text, 8);
      insert into facodi.learning_objects
        (object_type, title, slug, tags, keywords, language, status, published,
         source_type, source_url, metadata, created_by)
      values (
        v_suggestion.object_type, v_suggestion.title, v_slug, v_suggestion.tags, v_suggestion.tags,
        coalesce(v_suggestion.language, 'und'), 'draft', false,
        case when v_video is null then 'external' else 'youtube' end, v_suggestion.canonical_url,
        jsonb_strip_nulls(jsonb_build_object(
          'origin', 'resource_suggestion',
          'resource_suggestion_id', v_suggestion.id,
          'provider', v_suggestion.provider,
          'author', v_suggestion.author,
          'channel_name', case when v_video is not null then v_suggestion.author end,
          'youtube_video_id', v_video,
          'license_label', v_suggestion.license,
          'license_declared_by_submitter', true,
          'content_license_verified', false,
          'publication_type', 'external_reference_link_only',
          'copyright_redistribution_assumed', false)),
        auth.uid())
      returning id into v_object;
    end if;

    if v_unit is not null then
      select u.learning_object_id into v_unit_object from facodi.curricular_units u where u.id = v_unit;
      if v_unit_object is not null and v_unit_object <> v_object then
        insert into facodi.learning_object_relations
          (parent_object_id, child_object_id, relation_type, created_by_mechanism, metadata, created_by)
        values (v_unit_object, v_object, 'contains', 'resource_suggestion_review',
          jsonb_build_object('review_status', 'approved', 'review_scope', 'resource_suggestion',
            'resource_suggestion_id', v_suggestion.id, 'reviewed_by', auth.uid()),
          auth.uid())
        on conflict (parent_object_id, child_object_id, relation_type) do nothing;
      end if;
    end if;
  end if;

  update facodi.resource_suggestions set
    status = p_decision,
    curricular_unit_id = v_unit,
    review_note = nullif(btrim(p_review_note), ''),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    learning_object_id = v_object
  where id = p_suggestion_id;
  return coalesce(v_object, p_suggestion_id);
end
$$;

comment on function facodi.review_resource_suggestion(uuid, text, text, uuid) is
  'Editor decision on a learner suggestion, optionally choosing the unit. Approval creates or reuses a draft learning object; publishing stays manual.';

revoke all on function facodi.enqueue_resource_suggestion_analysis() from public, anon, authenticated, service_role;
revoke all on function facodi.dispatch_resource_suggestion_analysis() from public, anon, authenticated, service_role;
revoke all on function facodi.claim_resource_suggestion_analyses(integer, integer) from public, anon, authenticated;
revoke all on function facodi.reserve_resource_suggestion_ai_call(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function facodi.rank_resource_suggestion_units(text, uuid, integer) from public, anon, authenticated;
revoke all on function facodi.retry_resource_suggestion_analysis(uuid) from public, anon;
revoke all on function facodi.review_resource_suggestion(uuid, text, text, uuid) from public, anon;
grant execute on function facodi.claim_resource_suggestion_analyses(integer, integer) to service_role;
grant execute on function facodi.reserve_resource_suggestion_ai_call(uuid, uuid, integer) to service_role;
grant execute on function facodi.rank_resource_suggestion_units(text, uuid, integer) to service_role;
grant execute on function facodi.retry_resource_suggestion_analysis(uuid) to authenticated;
grant execute on function facodi.review_resource_suggestion(uuid, text, text, uuid) to authenticated;

select cron.schedule('facodi-suggestion-analysis', '* * * * *',
  'select facodi.dispatch_resource_suggestion_analysis()');
