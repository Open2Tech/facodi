-- Editorial enrichment of automatically published videos.
-- The worker already asks Gemini to watch the first minutes of each video (content_summary,
-- content_topics, content_language). Until now that evidence stayed in analysis_jobs.result_payload
-- and the public page only showed a generic description. This fills the public fields once, from
-- the analysis, and labels the text as AI-generated with its real coverage. Editorial changes win:
-- only the pipeline's own generic description, empty tags and an undetermined language are filled.

-- 1. Enrichment ---------------------------------------------------------------------------------
-- Idempotent: runs once per object (metadata.ai_enrichment marks it) and only for objects the
-- pipeline itself published. p_evidence.content_seconds is how much of the video the model saw.
create function facodi.enrich_auto_published_object(p_object uuid, p_job_id uuid, p_evidence jsonb)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_object facodi.learning_objects%rowtype;
  v_summary text := nullif(left(btrim(regexp_replace(p_evidence ->> 'content_summary', '\s+', ' ', 'g')), 1200), '');
  v_language text := split_part(lower(btrim(p_evidence ->> 'content_language')), '-', 1);
  v_seconds integer := case when jsonb_typeof(p_evidence -> 'content_seconds') = 'number'
    and (p_evidence ->> 'content_seconds')::numeric between 1 and 86400
    then (p_evidence ->> 'content_seconds')::numeric::integer else 300 end;
  v_topics text[];
  v_duration integer;
  v_full boolean;
  v_description text;
  v_fields text[] := '{}';
begin
  if p_evidence ->> 'level' is distinct from 'content_video' then
    return false;
  end if;
  select * into v_object from facodi.learning_objects
  where id = p_object and metadata ->> 'published_by' = 'automatic_analysis' and metadata -> 'ai_enrichment' is null
  for update;
  if not found then
    return false;
  end if;

  -- Up to eight distinct topics, in the model's order.
  select coalesce(array_agg(topic order by position), '{}') into v_topics
  from (
    select distinct on (lower(topic)) topic, position
    from jsonb_array_elements_text(case when jsonb_typeof(p_evidence -> 'content_topics') = 'array'
      then p_evidence -> 'content_topics' else '[]' end) with ordinality raw (value, position),
      lateral (select nullif(left(btrim(raw.value), 60), '') as topic) clean
    where topic is not null
    order by lower(topic), position
  ) distinct_topics;
  v_topics := v_topics[1:8];
  if v_language !~ '^[a-z]{2,3}$' then
    v_language := null;
  end if;

  v_duration := coalesce(
    case when jsonb_typeof(v_object.metadata -> 'duration_seconds') = 'number'
      then (v_object.metadata ->> 'duration_seconds')::numeric::integer end,
    (select duration_seconds from facodi.youtube_videos where learning_object_id = p_object
      order by duration_seconds nulls last limit 1));
  v_full := v_duration is not null and v_duration <= v_seconds;

  v_description := v_object.description;
  -- Only the generic text written by auto_publish is replaced; it is kept as the closing paragraph.
  if v_summary is not null and (v_object.description is null or v_object.description
    ~ '^Vídeo educativo.*Consulte a gravação original na plataforma do autor\.$') then
    v_description := concat(
      '<p>', replace(replace(replace(v_summary, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '</p>',
      '<p><em>', case when v_full
        then 'Resumo gerado automaticamente por IA a partir do vídeo completo. Pode conter imprecisões; confirme na gravação original.'
        else format('Resumo gerado automaticamente por IA a partir dos primeiros %s minutos do vídeo, sem revisão integral. Pode conter imprecisões; confirme na gravação original.', v_seconds / 60)
      end, '</em></p>',
      '<p>' || replace(replace(replace(v_object.description, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>');
    v_fields := v_fields || 'description'::text;
  end if;
  if cardinality(coalesce(v_object.tags, '{}')) = 0 and cardinality(v_topics) > 0 then
    v_fields := v_fields || 'tags'::text;
  end if;
  if coalesce(v_object.language, 'und') = 'und' and v_language is not null then
    v_fields := v_fields || 'language'::text;
  end if;

  update facodi.learning_objects set
    description = v_description,
    tags = case when 'tags' = any(v_fields) then v_topics else tags end,
    language = case when 'language' = any(v_fields) then v_language else language end,
    metadata = metadata || jsonb_build_object('ai_enrichment', jsonb_strip_nulls(jsonb_build_object(
      'generated_by', 'ai',
      'source', 'resource_suggestion_analysis',
      'analysis_job_id', p_job_id,
      'evidence_level', 'content_video',
      'coverage', case when v_full then 'full_video' else 'first_minutes' end,
      'analysed_seconds', case when not v_full then v_seconds end,
      'topics', to_jsonb(v_topics),
      'language', v_language,
      'fields', to_jsonb(v_fields),
      'enriched_at', now())))
  where id = p_object;

  if 'language' = any(v_fields) then
    update facodi.youtube_videos set language = v_language
    where learning_object_id = p_object and coalesce(language, 'und') = 'und';
  end if;
  return true;
end
$$;

revoke all on function facodi.enrich_auto_published_object(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function facodi.enrich_auto_published_object(uuid, uuid, jsonb) to service_role;

-- 2. Publication: unchanged except for the enrichment call before the suggestion is closed ------
-- p_evidence also carries content_summary, content_topics, content_language and content_seconds.
create or replace function facodi.auto_publish_resource_suggestion(
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

  perform facodi.enrich_auto_published_object(v_object, p_job_id, p_evidence);

  update facodi.resource_suggestions set
    status = 'approved', curricular_unit_id = v_unit, learning_object_id = v_object, reviewed_at = now()
  where id = v_suggestion.id;

  return jsonb_build_object('outcome', 'published', 'object_id', v_object, 'object_slug', v_slug,
    'unit_id', v_unit, 'reused', v_reused);
end
$$;

-- 3. Backfill the videos published before this migration, from their stored analysis -----------
select facodi.enrich_auto_published_object(
  (j.result_payload -> 'decision' ->> 'object_id')::uuid, j.id, j.result_payload -> 'evidence')
from facodi.analysis_jobs j
where j.status = 'succeeded' and j.result_payload -> 'decision' ->> 'outcome' = 'published'
  and j.result_payload -> 'decision' ->> 'object_id' ~ '^[0-9a-f-]{36}$'
order by j.completed_at;
