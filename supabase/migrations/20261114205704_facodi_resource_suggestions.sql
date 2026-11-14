-- Learner resource suggestions with automated server-side recognition.
-- A BEFORE INSERT trigger canonicalises the URL, recognises the provider, classifies the declared
-- licence and flags resources already in the readable catalogue; the client cannot forge any of
-- those fields. Editors review through facodi.review_resource_suggestion, which turns an approved
-- suggestion into a draft learning object (never published automatically) linked to the chosen unit.

create function facodi.normalize_resource_url(p_url text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_url text := btrim(p_url);
  v_host text;
  v_rest text;
  v_path text;
  v_query text;
  v_video text;
begin
  if v_url is null or v_url !~* '^https?://[^/?#[:space:]]+' then
    return null;
  end if;
  v_url := regexp_replace(v_url, '#.*$', '');
  v_host := regexp_replace(lower(substring(v_url from '^[A-Za-z]+://([^/?#]+)')), '^(www|m)\.', '');
  v_host := regexp_replace(v_host, ':443$', '');
  v_rest := coalesce(substring(v_url from '^[A-Za-z]+://[^/?#]+(.*)$'), '');

  -- One canonical watch URL per YouTube video, whatever the share format.
  if v_host in ('youtube.com', 'youtu.be', 'music.youtube.com', 'youtube-nocookie.com') then
    v_video := coalesce(
      substring(v_rest from '[?&]v=([A-Za-z0-9_-]{11})'),
      substring(v_rest from '^/(?:shorts|embed|live|v)/([A-Za-z0-9_-]{11})'),
      case when v_host = 'youtu.be' then substring(v_rest from '^/([A-Za-z0-9_-]{11})') end
    );
    if v_video is not null then
      return 'https://www.youtube.com/watch?v=' || v_video;
    end if;
  end if;

  v_path := regexp_replace(substring(v_rest from '^[^?]*'), '/+$', '');
  v_query := coalesce(substring(v_rest from '\?.*$'), '');
  if v_host = 'github.com' then
    v_path := lower(regexp_replace(v_path, '\.git$', ''));
  end if;
  v_query := regexp_replace(v_query, '([?&])(utm_[a-z_]+|fbclid|gclid|mc_cid|mc_eid|si|ref_src)=[^&]*&?', '\1', 'gi');
  v_query := regexp_replace(v_query, '[?&]+$', '');
  return 'https://' || v_host || v_path || v_query;
end
$$;

comment on function facodi.normalize_resource_url(text) is
  'Canonical https URL used to recognise the same resource across share formats (YouTube ids, tracking params, www).';

create function facodi.classify_resource_license(p_license text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_license is null or btrim(p_license) = '' then 'unknown'
    when p_license ~* '(\m(nc|nd)\M|non-?commercial|no-?deriv|all rights reserved)' then 'restricted'
    when p_license ~* '(cc[ -]?(by|0)|creative commons|public domain|domínio público|\m(mit|apache|gpl|lgpl|agpl|bsd|mpl|unlicense|ofl)\M)' then 'open'
    else 'unknown'
  end;
$$;

create table facodi.resource_suggestions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  url text not null check (char_length(url) between 10 and 2048 and url ~* '^https?://'),
  canonical_url text not null,
  provider text not null default 'web'
    check (provider in ('youtube', 'github', 'zenodo', 'openstax', 'doaj', 'arxiv', 'web')),
  title text not null check (char_length(btrim(title)) between 3 and 200),
  author text check (char_length(author) <= 160),
  thumbnail_url text,
  license text check (char_length(license) <= 80),
  object_type text not null default 'external_resource'
    check (object_type in ('video', 'document', 'book', 'external_resource')),
  language text check (language is null or language ~ '^[a-z]{2}$'),
  tags text[] not null default '{}'
    check (cardinality(tags) <= 8 and char_length(array_to_string(tags, ' ')) <= 240),
  curricular_unit_id uuid references facodi.curricular_units (id) on delete set null,
  note text check (char_length(note) <= 500),
  license_declared boolean not null check (license_declared),
  attribution_declared boolean not null check (attribution_declared),
  status text not null default 'pending' check (status in ('pending', 'duplicate', 'approved', 'rejected')),
  screening jsonb not null default '{}',
  learning_object_id uuid references facodi.learning_objects (id) on delete set null,
  review_note text check (char_length(review_note) <= 500),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table facodi.resource_suggestions is
  'Open educational resources suggested by learners, screened on insert and reviewed by editors.';

create unique index resource_suggestions_submitter_url_key on facodi.resource_suggestions (submitted_by, canonical_url);
create index resource_suggestions_status_created_idx on facodi.resource_suggestions (status, created_at desc);
create index resource_suggestions_unit_idx on facodi.resource_suggestions (curricular_unit_id);
create index resource_suggestions_learning_object_idx on facodi.resource_suggestions (learning_object_id);
create index resource_suggestions_reviewed_by_idx on facodi.resource_suggestions (reviewed_by);

create function facodi.screen_resource_suggestion()
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

  -- RLS applies: learners are matched against the public catalogue, editors against everything.
  select lo.id, lo.slug, lo.object_type
  into v_duplicate_id, v_duplicate_slug, v_duplicate_type
  from facodi.learning_objects lo
  where lo.source_url is not null
    and (facodi.normalize_resource_url(lo.source_url) = v_canonical
      or (v_video is not null and lo.metadata ->> 'youtube_video_id' = v_video))
  order by lo.published desc, lo.created_at
  limit 1;

  new.status := case when v_duplicate_id is null then 'pending' else 'duplicate' end;
  new.learning_object_id := null;
  new.review_note := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.screening := jsonb_build_object(
    'version', 1,
    'checked_at', now(),
    'provider_recognized', new.provider <> 'web',
    'secure_source', new.url ~* '^https://',
    'license', v_license,
    'unit_selected', new.curricular_unit_id is not null,
    'duplicate', case when v_duplicate_id is null then null else jsonb_build_object(
      'learning_object_id', v_duplicate_id, 'slug', v_duplicate_slug, 'object_type', v_duplicate_type) end,
    'recommendation', case
      when v_duplicate_id is not null or v_license = 'restricted' then 'reject'
      when new.provider <> 'web' and v_license = 'open' and new.curricular_unit_id is not null then 'fast_track'
      else 'review'
    end
  );
  return new;
end
$$;

create trigger resource_suggestions_screen
  before insert on facodi.resource_suggestions
  for each row execute function facodi.screen_resource_suggestion();

create trigger resource_suggestions_set_updated_at
  before update on facodi.resource_suggestions
  for each row execute function facodi.set_updated_at();

alter table facodi.resource_suggestions enable row level security;

create policy "Learners and editors read suggestions" on facodi.resource_suggestions
  for select to authenticated
  using ((select auth.uid()) = submitted_by or (select facodi.is_facodi_editor()));

create policy "Learners suggest resources for public units" on facodi.resource_suggestions
  for insert to authenticated
  with check (
    (select auth.uid()) = submitted_by
    and status in ('pending', 'duplicate')
    and learning_object_id is null and reviewed_by is null and reviewed_at is null and review_note is null
    and (curricular_unit_id is null or exists (
      select 1 from facodi.curricular_units u join facodi.courses c on c.id = u.course_id
      where u.id = resource_suggestions.curricular_unit_id
        and u.status = 'active' and c.published and c.status = 'active'))
  );

create policy "Editors review suggestions" on facodi.resource_suggestions
  for update to authenticated
  using ((select facodi.is_facodi_editor()))
  with check ((select facodi.is_facodi_editor()));

revoke all on facodi.resource_suggestions from public, anon, authenticated;
grant select, insert on facodi.resource_suggestions to authenticated;
grant update (status, review_note, reviewed_by, reviewed_at, learning_object_id) on facodi.resource_suggestions to authenticated;

create function facodi.review_resource_suggestion(
  p_suggestion_id uuid,
  p_decision text,
  p_review_note text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_suggestion facodi.resource_suggestions%rowtype;
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

    if v_suggestion.curricular_unit_id is not null then
      select u.learning_object_id into v_unit_object
      from facodi.curricular_units u where u.id = v_suggestion.curricular_unit_id;
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
    review_note = nullif(btrim(p_review_note), ''),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    learning_object_id = v_object
  where id = p_suggestion_id;
  return coalesce(v_object, p_suggestion_id);
end
$$;

comment on function facodi.review_resource_suggestion(uuid, text, text) is
  'Editor decision on a learner suggestion. Approval creates or reuses a draft learning object; publishing stays manual.';

-- Once an editor publishes the draft, the reviewed link to its unit becomes public like other curated links.
create policy facodi_public_read_reviewed_suggestion_links on facodi.learning_object_relations
  for select to anon, authenticated
  using (
    relation_type = 'contains'
    and created_by_mechanism = 'resource_suggestion_review'
    and metadata ->> 'review_status' = 'approved'
    and exists (select 1 from facodi.learning_objects p
      where p.id = learning_object_relations.parent_object_id and p.object_type = 'curricular_unit'
        and p.published and p.status in ('active', 'published'))
    and exists (select 1 from facodi.learning_objects ch
      where ch.id = learning_object_relations.child_object_id
        and ch.published and ch.status in ('active', 'published'))
  );

revoke all on function facodi.normalize_resource_url(text) from public, anon;
revoke all on function facodi.classify_resource_license(text) from public, anon;
revoke all on function facodi.screen_resource_suggestion() from public, anon, authenticated;
revoke all on function facodi.review_resource_suggestion(uuid, text, text) from public, anon;
grant execute on function facodi.normalize_resource_url(text) to authenticated;
grant execute on function facodi.classify_resource_license(text) to authenticated;
grant execute on function facodi.review_resource_suggestion(uuid, text, text) to authenticated;
