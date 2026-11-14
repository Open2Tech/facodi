-- One row per public FACODI editorial sequence, for the /sequences index and unit pages.
-- list_public_editorial_playlists_v1 returns one row per linked unit and is capped at 100 rows,
-- so it starts dropping sequences as the catalogue grows. This keeps the same visibility rules as
-- get_public_editorial_playlist_v2 (approved title_and_channel_only relations, published videos)
-- so the counts shown in lists match the lessons shown on the sequence page.
create or replace function facodi.list_public_editorial_sequences_v1(p_unit_code text default null)
returns table (
  playlist_id uuid,
  playlist_slug text,
  playlist_title text,
  playlist_description text,
  language text,
  item_count integer,
  unit_codes text[],
  cover_youtube_id text
)
language sql
stable
security invoker
set search_path = facodi, pg_temp
as $$
  select pl.id, pl.slug, pl.title, pl.description, pl.language,
    coalesce(vi.item_count, 0), coalesce(uc.codes, '{}'::text[]), vi.cover_youtube_id
  from facodi.learning_objects pl
  left join lateral (
    select count(*)::integer item_count,
      (array_agg(y.youtube_video_id order by r.position, y.youtube_video_id))[1] cover_youtube_id
    from facodi.learning_object_relations r
    join facodi.learning_objects v on v.id = r.child_object_id
    join facodi.youtube_videos y on y.learning_object_id = v.id
    where r.parent_object_id = pl.id
      and r.relation_type = 'contains'
      and r.metadata->>'review_status' = 'approved'
      and r.metadata->>'review_scope' = 'title_and_channel_only'
      and v.object_type = 'video' and v.published and v.status = 'active'
      and y.status = 'published'
  ) vi on true
  left join lateral (
    select array_agg(distinct u.code order by u.code) codes
    from facodi.learning_object_relations rel
    join facodi.curricular_units u on u.learning_object_id = rel.parent_object_id
    join facodi.courses c on c.id = u.course_id
    where rel.child_object_id = pl.id and rel.relation_type = 'contains'
      and rel.metadata->>'review_status' = 'approved'
      and rel.metadata->>'review_scope' = 'title_and_channel_only'
      and u.published and u.status = 'active' and c.published and c.status = 'active'
  ) uc on true
  where pl.object_type = 'playlist' and pl.published and pl.status = 'active'
    and pl.metadata->>'playlist_type' = 'facodi_owned_editorial_sequence'
    and (p_unit_code is null or p_unit_code = any(uc.codes))
  order by pl.title, pl.id
  limit 500;
$$;

revoke all on function facodi.list_public_editorial_sequences_v1(text) from public;
grant execute on function facodi.list_public_editorial_sequences_v1(text) to anon, authenticated;

comment on function facodi.list_public_editorial_sequences_v1(text) is
  'Public FACODI editorial sequences, one row each, with reviewed lesson count, linked unit codes and first lesson as cover. SECURITY INVOKER: catalogue RLS still applies.';
