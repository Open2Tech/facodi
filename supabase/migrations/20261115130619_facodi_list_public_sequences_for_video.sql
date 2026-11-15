-- Public FACODI editorial sequences that contain a given video, for the video page.
-- Applies the same visibility rules as get_public_editorial_playlist_v2 and
-- list_public_editorial_sequences_v1, so lesson_position/item_count match the sequence page
-- (lessons ordered by relation position, then YouTube id).
create or replace function facodi.list_public_sequences_for_video_v1(p_video_id uuid)
returns table (
  playlist_id uuid,
  playlist_slug text,
  playlist_title text,
  lesson_position integer,
  item_count integer
)
language sql
stable
security invoker
set search_path = facodi, pg_temp
as $$
  with lessons as (
    select r.parent_object_id playlist_id, r.child_object_id video_id,
      row_number() over (partition by r.parent_object_id order by r.position, y.youtube_video_id)::integer lesson_position,
      count(*) over (partition by r.parent_object_id)::integer item_count
    from facodi.learning_object_relations r
    join facodi.learning_objects v on v.id = r.child_object_id
    join facodi.youtube_videos y on y.learning_object_id = v.id
    where r.relation_type = 'contains'
      and r.metadata->>'review_status' = 'approved'
      and r.metadata->>'review_scope' = 'title_and_channel_only'
      and v.object_type = 'video' and v.published and v.status = 'active'
      and y.status = 'published'
      and r.parent_object_id in (
        select parent_object_id from facodi.learning_object_relations
        where child_object_id = p_video_id and relation_type = 'contains'
      )
  )
  select pl.id, pl.slug, pl.title, l.lesson_position, l.item_count
  from lessons l
  join facodi.learning_objects pl on pl.id = l.playlist_id
  where l.video_id = p_video_id
    and pl.object_type = 'playlist' and pl.published and pl.status = 'active'
    and pl.metadata->>'playlist_type' = 'facodi_owned_editorial_sequence'
  order by pl.title, pl.id
  limit 20;
$$;

revoke all on function facodi.list_public_sequences_for_video_v1(uuid) from public;
grant execute on function facodi.list_public_sequences_for_video_v1(uuid) to anon, authenticated;

comment on function facodi.list_public_sequences_for_video_v1(uuid) is
  'Public FACODI editorial sequences containing a video, with its reviewed lesson position and count. SECURITY INVOKER: catalogue RLS still applies.';
