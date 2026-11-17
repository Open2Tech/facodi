-- Autonomous publication of learner resource suggestions (docs/suggest-ai-analysis-plan.md).
-- The AI only proposes units; facodi.auto_publish_resource_suggestion applies deterministic rules:
-- a YouTube video, a unit chosen by the learner (the course context), an open screening and a
-- "strong" match inside that course. Anything else stays pending for editors. Every automatic
-- publication can be unpublished or archived later in /editor.

-- One-row settings, edited in Supabase Studio; read only by the worker (service role).
create table facodi.suggestion_pipeline_settings (
  id boolean primary key default true check (id),
  auto_publish_enabled boolean not null default true,
  ai_fallback_enabled boolean not null default true,
  notification_email_enabled boolean not null default true,
  notify_on_auto_publish boolean not null default true,
  notify_on_review boolean not null default true,
  notification_recipient text not null default 'hello@facodi.com'
    check (notification_recipient ~ '^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$'),
  updated_at timestamptz not null default now()
);
comment on table facodi.suggestion_pipeline_settings is
  'Switches of the suggestion analysis pipeline. Edit the single row in Studio; no redeploy needed.';
comment on column facodi.suggestion_pipeline_settings.auto_publish_enabled is
  'false: analyses still run, but nothing is published or linked automatically.';
comment on column facodi.suggestion_pipeline_settings.ai_fallback_enabled is
  'Try OpenAI when Gemini is unavailable, out of quota or returns invalid output.';
comment on column facodi.suggestion_pipeline_settings.notification_recipient is
  'Receives automatic publication and review-needed emails.';

alter table facodi.suggestion_pipeline_settings enable row level security;
revoke all on facodi.suggestion_pipeline_settings from public, anon, authenticated;
grant select on facodi.suggestion_pipeline_settings to service_role;
insert into facodi.suggestion_pipeline_settings default values;

create trigger suggestion_pipeline_settings_set_updated_at
  before update on facodi.suggestion_pipeline_settings
  for each row execute function facodi.set_updated_at();

-- Duplicates with a chosen unit are analysed too: the existing resource may gain a new unit.
create or replace function facodi.enqueue_resource_suggestion_analysis()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending' or (new.status = 'duplicate' and new.curricular_unit_id is not null) then
    insert into facodi.analysis_jobs
      (job_type, resource_suggestion_id, requested_by, request_source, input_url, youtube_video_id, input_payload)
    values ('analyze_resource_suggestion', new.id, new.submitted_by, 'resource_suggestion', new.canonical_url,
      substring(new.canonical_url from '^https://www\.youtube\.com/watch\?v=([A-Za-z0-9_-]{11})$'),
      jsonb_build_object('analysis_version', 2))
    on conflict do nothing;
  end if;
  return null;
end
$$;

-- With p_course_only, every public unit of the learner's course is a candidate, so the AI matches
-- across languages instead of depending on Portuguese word prefixes.
drop function facodi.rank_resource_suggestion_units(text, uuid, integer);
create function facodi.rank_resource_suggestion_units(
  p_text text, p_include uuid default null, p_limit integer default 12, p_course_only boolean default false)
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
    select to_tsquery('simple', string_agg(
      case when char_length(w) >= 7 then left(w, 6) when char_length(w) = 6 then left(w, 5) else w end
        || ':*', ' | ')) q
    from (select w from words limit 40) limited
  ), scope as (
    select u.course_id from facodi.curricular_units u where p_course_only and u.id = p_include
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
  from units u cross join query
  where case when exists (select 1 from scope) then u.course_id = (select course_id from scope)
    else u.id = p_include or (query.q is not null and u.doc @@ query.q) end
  order by 9 desc, u.title
  limit least(greatest(p_limit, 1), case when exists (select 1 from scope) then 80 else 20 end);
$$;

-- The worker records automatic decisions on the suggestion; nothing else is writable.
grant update (status, curricular_unit_id, learning_object_id, reviewed_at) on facodi.resource_suggestions to service_role;

-- Publishes the suggestion and links it to the first eligible unit proposed as a strong match.
-- Returns {outcome: published, ...} or {outcome: review, reason}; review leaves everything untouched.
create function facodi.auto_publish_resource_suggestion(
  p_job_id uuid, p_lease_token uuid, p_unit_ids uuid[], p_reason text)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_suggestion facodi.resource_suggestions%rowtype;
  v_unit uuid;
  v_unit_object uuid;
  v_object uuid;
  v_slug text;
  v_public boolean;
  v_reused boolean := false;
  v_video text;
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
  if v_suggestion.curricular_unit_id is null then
    return jsonb_build_object('outcome', 'review', 'reason', 'no_course');
  end if;
  -- Screening rejects every duplicate; only a restricted licence blocks reuse of a public resource.
  if v_suggestion.screening ->> 'license' = 'restricted'
    or (v_suggestion.screening ->> 'recommendation' = 'reject' and v_suggestion.status <> 'duplicate') then
    return jsonb_build_object('outcome', 'review', 'reason', 'screening');
  end if;

  -- First proposal, in the AI's order, that is a public unit of the learner's course.
  select u.id, u.learning_object_id into v_unit, v_unit_object
  from unnest(p_unit_ids) with ordinality proposal (id, position)
  join facodi.curricular_units u on u.id = proposal.id
  join facodi.courses c on c.id = u.course_id
  join facodi.learning_objects unit_object on unit_object.id = u.learning_object_id
  where u.status = 'active' and c.published and c.status = 'active'
    and unit_object.published and unit_object.status in ('active', 'published')
    and u.course_id = (select course_id from facodi.curricular_units where id = v_suggestion.curricular_unit_id)
  order by proposal.position
  limit 1;
  if v_unit is null then
    return jsonb_build_object('outcome', 'review', 'reason', 'no_strong_match_in_course');
  end if;

  select lo.id, lo.published and lo.status in ('active', 'published') into v_object, v_public
  from facodi.learning_objects lo
  where lo.source_url is not null
    and (facodi.normalize_resource_url(lo.source_url) = v_suggestion.canonical_url
      or lo.metadata ->> 'youtube_video_id' = v_video)
  order by lo.published desc, lo.created_at
  limit 1;
  -- An existing draft or archive is an editorial decision the pipeline must not override.
  if v_object is not null and not v_public then
    return jsonb_build_object('outcome', 'review', 'reason', 'existing_not_public');
  end if;
  v_reused := v_object is not null;

  if v_object is null then
    v_slug := left(btrim(regexp_replace(lower(extensions.unaccent('extensions.unaccent'::regdictionary,
      v_suggestion.title)), '[^a-z0-9]+', '-', 'g'), '-'), 60);
    v_slug := coalesce(nullif(btrim(v_slug, '-'), ''), 'recurso') || '-' || left(v_suggestion.id::text, 8);
    insert into facodi.learning_objects
      (object_type, title, slug, tags, keywords, language, status, published, source_type, source_url, metadata)
    values ('video', v_suggestion.title, v_slug, v_suggestion.tags, v_suggestion.tags,
      coalesce(v_suggestion.language, 'und'), 'active', true, 'youtube', v_suggestion.canonical_url,
      jsonb_strip_nulls(jsonb_build_object(
        'origin', 'resource_suggestion',
        'resource_suggestion_id', v_suggestion.id,
        'analysis_job_id', p_job_id,
        'published_by', 'automatic_analysis',
        'provider', v_suggestion.provider,
        'author', v_suggestion.author,
        'channel_name', v_suggestion.author,
        'youtube_video_id', v_video,
        'license_label', v_suggestion.license,
        'license_declared_by_submitter', true,
        'content_license_verified', false,
        'publication_type', 'external_reference_link_only',
        'copyright_redistribution_assumed', false)))
    returning id, slug into v_object, v_slug;
  else
    select slug into v_slug from facodi.learning_objects where id = v_object;
  end if;

  insert into facodi.learning_object_relations
    (parent_object_id, child_object_id, relation_type, created_by_mechanism, metadata)
  values (v_unit_object, v_object, 'contains', 'resource_suggestion_review',
    jsonb_build_object('review_status', 'approved', 'review_scope', 'resource_suggestion',
      'resource_suggestion_id', v_suggestion.id, 'decided_by', 'automatic_analysis',
      'analysis_job_id', p_job_id, 'reason', left(p_reason, 280)))
  on conflict (parent_object_id, child_object_id, relation_type) do nothing;

  update facodi.resource_suggestions set
    status = 'approved', curricular_unit_id = v_unit, learning_object_id = v_object, reviewed_at = now()
  where id = v_suggestion.id;

  return jsonb_build_object('outcome', 'published', 'object_id', v_object, 'object_slug', v_slug,
    'unit_id', v_unit, 'reused', v_reused);
end
$$;

revoke all on function facodi.rank_resource_suggestion_units(text, uuid, integer, boolean) from public, anon, authenticated;
revoke all on function facodi.auto_publish_resource_suggestion(uuid, uuid, uuid[], text) from public, anon, authenticated;
grant execute on function facodi.rank_resource_suggestion_units(text, uuid, integer, boolean) to service_role;
grant execute on function facodi.auto_publish_resource_suggestion(uuid, uuid, uuid[], text) to service_role;
grant execute on function facodi.normalize_resource_url(text) to service_role;
