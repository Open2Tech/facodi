-- Hardening of the autonomous suggestion pipeline (docs/suggest-ai-analysis-plan.md §8.2):
-- * learners may name only a course; the AI then finds the unit inside that course;
-- * publication is serialised per YouTube id and reuses every existing record of the video;
-- * the catalogue graph stays coherent (object, YouTube record, external source, tags, legacy unit_videos);
-- * finished jobs without a structured decision are reprocessed once;
-- * failed decision emails are retried without republishing.

-- 1. Course context ---------------------------------------------------------------------------
alter table facodi.resource_suggestions
  add column course_id uuid references facodi.courses (id) on delete set null;
create index resource_suggestions_course_id_idx on facodi.resource_suggestions (course_id);
comment on column facodi.resource_suggestions.course_id is
  'Course named by the learner, or the course of the chosen unit. Scopes automatic matching.';
grant insert (course_id), select (course_id) on facodi.resource_suggestions to authenticated;
grant select (course_id) on facodi.resource_suggestions to service_role;

drop policy "Learners suggest resources for public units" on facodi.resource_suggestions;
create policy "Learners suggest resources for public units" on facodi.resource_suggestions
  for insert to authenticated
  with check (
    (select auth.uid()) = submitted_by
    and status in ('pending', 'duplicate')
    and learning_object_id is null and reviewed_by is null and reviewed_at is null and review_note is null
    and (curricular_unit_id is null or exists (
      select 1 from facodi.curricular_units u join facodi.courses c on c.id = u.course_id
      where u.id = resource_suggestions.curricular_unit_id and u.status = 'active' and c.published and c.status = 'active'))
    and (course_id is null or exists (
      select 1 from facodi.courses c
      where c.id = resource_suggestions.course_id and c.published and c.status = 'active'))
  );

-- Same screening as before, plus: the course follows the chosen unit, and YouTube records count as duplicates.
create or replace function facodi.screen_resource_suggestion()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_canonical text := facodi.normalize_resource_url(new.url);
  v_host text;
  v_video text;
  v_license text;
  v_recent integer;
  v_duplicate_id uuid;
  v_duplicate_slug text;
  v_duplicate_type text;
begin
  if v_canonical is null then
    raise exception 'Resource URL must use http or https' using errcode = '22023';
  end if;

  select count(*) into v_recent from facodi.resource_suggestions
  where submitted_by = new.submitted_by and created_at > now() - interval '1 day';
  if v_recent >= 20 then
    raise exception 'Daily suggestion limit reached' using errcode = '54000';
  end if;

  v_host := substring(v_canonical from '^https://([^/?#]+)');
  v_video := substring(v_canonical from '^https://www\.youtube\.com/watch\?v=([A-Za-z0-9_-]{11})$');
  v_license := facodi.classify_resource_license(new.license);

  new.canonical_url := v_canonical;
  new.provider := case
    when v_video is not null or v_host in ('www.youtube.com', 'youtube.com') then 'youtube'
    when v_host = 'github.com' then 'github'
    when v_host = 'zenodo.org' then 'zenodo'
    when v_host = 'openstax.org' then 'openstax'
    when v_host = 'doaj.org' then 'doaj'
    when v_host = 'arxiv.org' then 'arxiv'
    else 'web'
  end;
  if v_video is not null then
    new.object_type := 'video';
  end if;
  -- Previews only come from hosts the catalogue already renders, never arbitrary tracking pixels.
  new.thumbnail_url := case
    when v_video is not null then 'https://i.ytimg.com/vi/' || v_video || '/hqdefault.jpg'
    when char_length(new.thumbnail_url) <= 500
      and new.thumbnail_url ~ '^https://(avatars\.githubusercontent\.com|opengraph\.githubassets\.com)/[^[:space:]]+$'
      then new.thumbnail_url
  end;
  new.title := btrim(new.title);
  new.author := nullif(btrim(new.author), '');
  new.license := nullif(btrim(new.license), '');
  new.note := nullif(btrim(new.note), '');
  if new.curricular_unit_id is not null then
    new.course_id := (select u.course_id from facodi.curricular_units u where u.id = new.curricular_unit_id);
  end if;

  -- RLS applies: learners are matched against the public catalogue, editors against everything.
  select lo.id, lo.slug, lo.object_type
  into v_duplicate_id, v_duplicate_slug, v_duplicate_type
  from facodi.learning_objects lo
  where (lo.source_url is not null
      and (facodi.normalize_resource_url(lo.source_url) = v_canonical
        or (v_video is not null and lo.metadata ->> 'youtube_video_id' = v_video)))
    or (v_video is not null and lo.id in (
      select yv.learning_object_id from facodi.youtube_videos yv where yv.youtube_video_id = v_video))
  order by lo.published desc, lo.created_at
  limit 1;

  new.status := case when v_duplicate_id is null then 'pending' else 'duplicate' end;
  new.learning_object_id := null;
  new.review_note := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.screening := jsonb_build_object(
    'version', 2,
    'checked_at', now(),
    'provider_recognized', new.provider <> 'web',
    'secure_source', new.url ~* '^https://',
    'license', v_license,
    'unit_selected', new.curricular_unit_id is not null,
    'course_selected', new.course_id is not null,
    'duplicate', case when v_duplicate_id is null then null else jsonb_build_object(
      'learning_object_id', v_duplicate_id, 'slug', v_duplicate_slug, 'object_type', v_duplicate_type) end,
    'recommendation', case
      when v_duplicate_id is not null or v_license = 'restricted' then 'reject'
      when new.provider <> 'web' and v_license = 'open' and new.course_id is not null then 'fast_track'
      else 'review'
    end
  );
  return new;
end
$$;

-- Duplicates with a course are analysed too: the existing resource may gain a new unit.
create or replace function facodi.enqueue_resource_suggestion_analysis()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending' or (new.status = 'duplicate' and new.course_id is not null) then
    insert into facodi.analysis_jobs
      (job_type, resource_suggestion_id, requested_by, request_source, input_url, youtube_video_id, input_payload)
    values ('analyze_resource_suggestion', new.id, new.submitted_by, 'resource_suggestion', new.canonical_url,
      substring(new.canonical_url from '^https://www\.youtube\.com/watch\?v=([A-Za-z0-9_-]{11})$'),
      jsonb_build_object('analysis_version', 3))
    on conflict do nothing;
  end if;
  return null;
end
$$;

-- 2. Matching scope ---------------------------------------------------------------------------
-- With a course (named directly or through a unit) every public unit of that course is a candidate,
-- so the AI matches across languages instead of depending on shared word prefixes.
drop function facodi.rank_resource_suggestion_units(text, uuid, integer, boolean);
create function facodi.rank_resource_suggestion_units(
  p_text text, p_course_id uuid default null, p_include uuid default null, p_limit integer default 12)
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
      lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(left(p_text, 4000), ''))), '[^a-z0-9]+') w
    where char_length(w) >= 3 and w not in (
      'the', 'and', 'for', 'with', 'from', 'que', 'com', 'para', 'por', 'dos', 'das', 'uma', 'del', 'los', 'las',
      'les', 'des', 'une', 'pour', 'avec', 'sur', 'sobre', 'como', 'aula', 'video', 'curso', 'course', 'parte',
      'part', 'introducao', 'introduction', 'introduccion', 'lecture', 'class', 'tutorial', 'www', 'http',
      'https', 'youtube')
  ), query as (
    select to_tsquery('simple', string_agg(
      case when char_length(w) >= 7 then left(w, 6) when char_length(w) = 6 then left(w, 5) else w end
        || ':*', ' | ')) q
    from (select w from words limit 60) limited
  ), scope as (
    select coalesce(p_course_id, (select u.course_id from facodi.curricular_units u where u.id = p_include)) course_id
  ), units as (
    select u.id, u.course_id, u.code, u.title, u.summary, u.slug, c.code course_code, c.slug course_slug,
      c.title course_title,
      setweight(to_tsvector('simple', extensions.unaccent('extensions.unaccent'::regdictionary, u.title)), 'A')
        || setweight(to_tsvector('simple', extensions.unaccent('extensions.unaccent'::regdictionary,
          concat_ws(' ', u.summary, c.title))), 'C') doc
    from facodi.curricular_units u join facodi.courses c on c.id = u.course_id
    where u.status = 'active' and c.published and c.status = 'active'
  )
  select u.id, u.code, u.title, left(u.summary, 400), u.slug, u.course_code, u.course_slug, u.course_title,
    case when u.id = p_include then 1000000::real else coalesce(ts_rank(u.doc, query.q), 0) end
  from units u cross join query cross join scope
  where case when scope.course_id is not null then u.course_id = scope.course_id
    else u.id = p_include or (query.q is not null and u.doc @@ query.q) end
  order by 9 desc, u.title
  limit least(greatest(p_limit, 1), case when (select course_id from scope) is not null then 80 else 20 end);
$$;

-- 3. Claim returns the course ------------------------------------------------------------------
drop function facodi.claim_resource_suggestion_analyses(integer, integer);
create function facodi.claim_resource_suggestion_analyses(p_limit integer default 3, p_lease_seconds integer default 120)
returns table (
  job_id uuid, lease_token uuid, attempts integer, current_step text, result_payload jsonb, suggestion_id uuid,
  suggestion_status text, canonical_url text, provider text, title text, object_type text, language text,
  tags text[], curricular_unit_id uuid, course_id uuid
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
    s.id, s.status, s.canonical_url, s.provider, s.title, s.object_type, s.language, s.tags, s.curricular_unit_id,
    s.course_id
  from claimed c join facodi.resource_suggestions s on s.id = c.resource_suggestion_id;
end
$$;

-- 4. Publication ------------------------------------------------------------------------------
drop function facodi.auto_publish_resource_suggestion(uuid, uuid, uuid[], text);
-- Publishes the suggestion and links it to the first eligible unit proposed as a strong match.
-- p_evidence carries platform metadata gathered by the worker (description, channel, duration...).
-- Returns {outcome: published, ...} or {outcome: review, reason}; review leaves everything untouched.
create function facodi.auto_publish_resource_suggestion(
  p_job_id uuid, p_lease_token uuid, p_unit_ids uuid[], p_reason text, p_evidence jsonb default '{}')
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_suggestion facodi.resource_suggestions%rowtype;
  v_course uuid;
  v_unit uuid;
  v_unit_title text;
  v_unit_object uuid;
  v_object uuid;
  v_slug text;
  v_public boolean;
  v_reused boolean := false;
  v_video text;
  v_legacy uuid;
  v_channel text;
  v_duration integer;
  v_published_at timestamptz;
begin
  if not exists (select 1 from facodi.analysis_jobs where id = p_job_id and lease_token = p_lease_token
    and status = 'running' and lease_expires_at > now()) then
    return jsonb_build_object('outcome', 'skipped', 'reason', 'lease_lost');
  end if;
  if not coalesce((select auto_publish_enabled from facodi.suggestion_pipeline_settings where id), false) then
    return jsonb_build_object('outcome', 'review', 'reason', 'auto_publish_disabled');
  end if;

  select s.* into v_suggestion from facodi.resource_suggestions s
  join facodi.analysis_jobs j on j.resource_suggestion_id = s.id
  where j.id = p_job_id for update of s;
  if not found or v_suggestion.status not in ('pending', 'duplicate') then
    return jsonb_build_object('outcome', 'skipped', 'reason', 'already_reviewed');
  end if;

  v_video := substring(v_suggestion.canonical_url from '^https://www\.youtube\.com/watch\?v=([A-Za-z0-9_-]{11})$');
  if v_video is null then
    return jsonb_build_object('outcome', 'review', 'reason', 'not_a_video');
  end if;
  v_course := coalesce(v_suggestion.course_id,
    (select course_id from facodi.curricular_units where id = v_suggestion.curricular_unit_id));
  if v_course is null then
    return jsonb_build_object('outcome', 'review', 'reason', 'no_course');
  end if;
  -- Screening rejects every duplicate; only a restricted licence blocks reuse of a public resource.
  if v_suggestion.screening ->> 'license' = 'restricted'
    or (v_suggestion.screening ->> 'recommendation' = 'reject' and v_suggestion.status <> 'duplicate') then
    return jsonb_build_object('outcome', 'review', 'reason', 'screening');
  end if;

  -- First proposal, in the AI's order, that is a public unit of the learner's course.
  select u.id, u.title, u.learning_object_id into v_unit, v_unit_title, v_unit_object
  from unnest(p_unit_ids) with ordinality proposal (id, position)
  join facodi.curricular_units u on u.id = proposal.id
  join facodi.courses c on c.id = u.course_id
  join facodi.learning_objects unit_object on unit_object.id = u.learning_object_id
  where u.status = 'active' and c.published and c.status = 'active' and u.course_id = v_course
    and unit_object.published and unit_object.status in ('active', 'published')
  order by proposal.position
  limit 1;
  if v_unit is null then
    return jsonb_build_object('outcome', 'review', 'reason', 'no_strong_match_in_course');
  end if;

  -- Concurrent suggestions of the same video wait here, then find the object created first.
  perform pg_advisory_xact_lock(hashtextextended('facodi:youtube:' || v_video, 0));

  select lo.id, lo.published and lo.status in ('active', 'published') into v_object, v_public
  from facodi.learning_objects lo
  where lo.id in (select yv.learning_object_id from facodi.youtube_videos yv where yv.youtube_video_id = v_video)
    or (lo.source_type = 'youtube' and lo.source_id = v_video)
    or lo.metadata ->> 'youtube_video_id' = v_video
    or (lo.source_url is not null and facodi.normalize_resource_url(lo.source_url) = v_suggestion.canonical_url)
  order by lo.published desc, lo.created_at
  limit 1;
  -- An existing draft or archive is an editorial decision the pipeline must not override.
  if v_object is not null and not v_public then
    return jsonb_build_object('outcome', 'review', 'reason', 'existing_not_public');
  end if;
  v_reused := v_object is not null;

  -- The legacy Tube archive is reused, never duplicated: its id keeps the playlist publication convention.
  select v.id into v_legacy from public.videos v where v.youtube_id = v_video order by v.created_at limit 1;
  v_channel := coalesce(nullif(left(btrim(p_evidence ->> 'channel_title'), 120), ''), v_suggestion.author);
  v_duration := case when jsonb_typeof(p_evidence -> 'duration_seconds') = 'number'
    and (p_evidence ->> 'duration_seconds')::numeric between 0 and 86400
    then (p_evidence ->> 'duration_seconds')::numeric::integer end;
  v_published_at := case when p_evidence ->> 'published_at' ~ '^\d{4}-\d{2}-\d{2}'
    then (p_evidence ->> 'published_at')::timestamptz end;

  if v_object is null then
    v_slug := left(btrim(regexp_replace(lower(extensions.unaccent('extensions.unaccent'::regdictionary,
      v_suggestion.title)), '[^a-z0-9]+', '-', 'g'), '-'), 60);
    v_slug := coalesce(nullif(btrim(v_slug, '-'), ''), 'recurso') || '-' || left(v_suggestion.id::text, 8);
    insert into facodi.learning_objects
      (id, object_type, title, slug, description, tags, keywords, language, status, published,
       source_type, source_id, source_url, metadata)
    values (
      case when v_legacy is null then gen_random_uuid() else md5('facodi:video:' || v_legacy)::uuid end,
      'video', v_suggestion.title, v_slug,
      concat('Vídeo educativo', ' do canal ' || v_channel, ', publicado no YouTube. Sugerido pela comunidade FACODI ',
        'e associado a «', v_unit_title, '». Consulte a gravação original na plataforma do autor.'),
      v_suggestion.tags, v_suggestion.tags, coalesce(v_suggestion.language, 'und'), 'active', true,
      case when v_legacy is null then 'youtube' else 'tube' end,
      coalesce(v_legacy::text, v_video), v_suggestion.canonical_url,
      jsonb_strip_nulls(jsonb_build_object(
        'origin', 'resource_suggestion',
        'resource_suggestion_id', v_suggestion.id,
        'analysis_job_id', p_job_id,
        'published_by', 'automatic_analysis',
        'evidence_level', p_evidence ->> 'level',
        'provider', v_suggestion.provider,
        'author', v_channel,
        'channel_name', v_channel,
        'youtube_video_id', v_video,
        'duration_seconds', v_duration,
        'thumbnail_url', v_suggestion.thumbnail_url,
        'import_source', case when v_legacy is not null then 'public.videos' end,
        'license_label', v_suggestion.license,
        'license_declared_by_submitter', true,
        'content_license_verified', false,
        'video_fully_reviewed', false,
        'publication_type', 'external_reference_link_only',
        'copyright_redistribution_assumed', false)))
    returning id, slug into v_object, v_slug;
  else
    select slug into v_slug from facodi.learning_objects where id = v_object;
  end if;

  -- One YouTube record per video id; an existing record keeps its object and curated fields.
  insert into facodi.youtube_videos
    (learning_object_id, youtube_video_id, canonical_url, title, description, channel_id, channel_title,
     duration_seconds, published_at, thumbnails, tags, language, metadata, status)
  values (v_object, v_video, v_suggestion.canonical_url, v_suggestion.title,
    nullif(left(btrim(p_evidence ->> 'description'), 3000), ''),
    case when p_evidence ->> 'channel_id' ~ '^UC[A-Za-z0-9_-]{22}$' then p_evidence ->> 'channel_id' end,
    v_channel, v_duration, v_published_at,
    jsonb_build_object('high', jsonb_build_object('url', 'https://i.ytimg.com/vi/' || v_video || '/hqdefault.jpg')),
    coalesce(v_suggestion.tags, '{}'), coalesce(v_suggestion.language, 'und'),
    jsonb_build_object('source', 'resource_suggestion', 'resource_suggestion_id', v_suggestion.id,
      'analysis_job_id', p_job_id, 'video_fully_reviewed', false, 'content_license_verified', false),
    'published')
  on conflict (youtube_video_id) do update set
    learning_object_id = coalesce(facodi.youtube_videos.learning_object_id, excluded.learning_object_id),
    description = coalesce(facodi.youtube_videos.description, excluded.description),
    channel_id = coalesce(facodi.youtube_videos.channel_id, excluded.channel_id),
    channel_title = coalesce(facodi.youtube_videos.channel_title, excluded.channel_title),
    duration_seconds = coalesce(facodi.youtube_videos.duration_seconds, excluded.duration_seconds),
    published_at = coalesce(facodi.youtube_videos.published_at, excluded.published_at),
    status = 'published';

  insert into facodi.external_sources (learning_object_id, source_type, external_id, source_url, title, metadata)
  values (v_object, 'youtube', v_video, v_suggestion.canonical_url, v_suggestion.title,
    jsonb_build_object('source', 'resource_suggestion', 'resource_suggestion_id', v_suggestion.id))
  on conflict do nothing;

  insert into facodi.learning_object_relations
    (parent_object_id, child_object_id, relation_type, created_by_mechanism, metadata)
  values (v_unit_object, v_object, 'contains', 'resource_suggestion_review',
    jsonb_build_object('review_status', 'approved', 'review_scope', 'resource_suggestion',
      'resource_suggestion_id', v_suggestion.id, 'decided_by', 'automatic_analysis',
      'analysis_job_id', p_job_id, 'evidence_level', p_evidence ->> 'level', 'reason', left(p_reason, 280)))
  on conflict (parent_object_id, child_object_id, relation_type) do nothing;

  insert into facodi.learning_object_tags (learning_object_id, tag_id)
  select v_object, t.id
  from facodi.curricular_units u join facodi.courses c on c.id = u.course_id
  join facodi.tags t on t.slug in ('uc-' || u.code, 'curso-' || lower(c.code))
  where u.id = v_unit
  on conflict do nothing;

  if v_legacy is not null then
    insert into facodi.unit_videos (curricular_unit_id, video_id, metadata)
    values (v_unit, v_legacy, jsonb_build_object('review_status', 'approved', 'source', 'resource_suggestion',
      'resource_suggestion_id', v_suggestion.id, 'analysis_job_id', p_job_id))
    on conflict do nothing;
  end if;

  update facodi.resource_suggestions set
    status = 'approved', curricular_unit_id = v_unit, learning_object_id = v_object, reviewed_at = now()
  where id = v_suggestion.id;

  return jsonb_build_object('outcome', 'published', 'object_id', v_object, 'object_slug', v_slug,
    'unit_id', v_unit, 'reused', v_reused);
end
$$;

-- 5. Recovery and email retries ---------------------------------------------------------------
-- Decision emails still owed: never attempted (worker stopped after deciding) or failed fewer than 3 times.
-- Only analyses completed in the last two days, so an outage never floods the inbox with old news.
create function facodi.suggestion_notifications_due(p_limit integer default 5)
returns table (job_id uuid, completed_at timestamptz, result_payload jsonb, failures integer)
language sql
stable
set search_path = ''
as $$
  select j.id, j.completed_at, j.result_payload, e.failures
  from facodi.analysis_jobs j
  cross join lateral (
    select count(*) filter (where ev.event_type = 'email_failed')::integer failures,
      (array_agg(ev.event_type order by ev.created_at desc))[1] last_event,
      max(ev.created_at) last_at
    from facodi.analysis_job_events ev
    where ev.job_id = j.id and ev.event_type in ('email_sent', 'email_failed', 'email_skipped', 'email_retry')
  ) e
  where j.job_type = 'analyze_resource_suggestion' and j.status = 'succeeded'
    and j.completed_at between now() - interval '2 days' and now() - interval '2 minutes'
    and j.result_payload ->> 'version' = '3' and j.result_payload ? 'notice'
    and e.failures < 3
    and (e.last_event is null or e.last_event = 'email_failed'
      or (e.last_event = 'email_retry' and e.last_at < now() - interval '10 minutes'))
  order by j.completed_at
  limit least(greatest(p_limit, 1), 10);
$$;

-- Marks the due emails as being retried so overlapping worker runs never send them twice.
create function facodi.claim_suggestion_notifications(p_limit integer default 5)
returns table (job_id uuid, completed_at timestamptz, result_payload jsonb, failures integer)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not pg_try_advisory_xact_lock(hashtextextended('facodi:suggestion-notifications', 0)) then
    return;
  end if;
  return query
  with due as (select * from facodi.suggestion_notifications_due(p_limit)),
  marked as (
    insert into facodi.analysis_job_events (job_id, event_type, message)
    select due.job_id, 'email_retry', due.failures::text from due
  )
  select due.job_id, due.completed_at, due.result_payload, due.failures from due;
end
$$;

-- Requeues, once, finished analyses that never reached a structured decision (versions 1 and 2)
-- while their suggestion still waits; then wakes the worker for due jobs or owed emails.
create or replace function facodi.dispatch_resource_suggestion_analysis()
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  update facodi.analysis_jobs j set
    status = 'queued', attempts = 0, next_attempt_at = now(), completed_at = null, current_step = 'queued',
    error_code = null, error_message = null,
    input_payload = j.input_payload || jsonb_build_object('analysis_version', 3, 'recovered_at', now())
  from facodi.resource_suggestions s
  where s.id = j.resource_suggestion_id and s.status in ('pending', 'duplicate')
    and j.job_type = 'analyze_resource_suggestion' and j.status = 'succeeded'
    and coalesce(j.result_payload ->> 'version', '0') in ('0', '1', '2')
    and not j.input_payload ? 'recovered_at';

  if not exists (select 1 from facodi.analysis_jobs j
    where j.job_type = 'analyze_resource_suggestion' and j.next_attempt_at <= now()
      and (j.status in ('queued', 'retrying') or (j.status = 'running' and j.lease_expires_at < now())))
    and not exists (select 1 from facodi.suggestion_notifications_due(1)) then
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

revoke all on function facodi.rank_resource_suggestion_units(text, uuid, uuid, integer) from public, anon, authenticated;
revoke all on function facodi.claim_resource_suggestion_analyses(integer, integer) from public, anon, authenticated;
revoke all on function facodi.auto_publish_resource_suggestion(uuid, uuid, uuid[], text, jsonb) from public, anon, authenticated;
revoke all on function facodi.suggestion_notifications_due(integer) from public, anon, authenticated;
revoke all on function facodi.claim_suggestion_notifications(integer) from public, anon, authenticated;
revoke all on function facodi.dispatch_resource_suggestion_analysis() from public, anon, authenticated;
grant execute on function facodi.rank_resource_suggestion_units(text, uuid, uuid, integer) to service_role;
grant execute on function facodi.claim_resource_suggestion_analyses(integer, integer) to service_role;
grant execute on function facodi.auto_publish_resource_suggestion(uuid, uuid, uuid[], text, jsonb) to service_role;
grant execute on function facodi.claim_suggestion_notifications(integer) to service_role;
