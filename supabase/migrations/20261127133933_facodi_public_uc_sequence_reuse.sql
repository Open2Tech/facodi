-- Recognize approved reuse of public sequences in both directions of the UC journey.
-- Lesson eligibility and public object filters are unchanged.

CREATE OR REPLACE FUNCTION facodi.list_public_editorial_sequences_v1(p_unit_code text DEFAULT NULL::text)
 RETURNS TABLE(playlist_id uuid, playlist_slug text, playlist_title text, playlist_description text, language text, item_count integer, unit_codes text[], cover_youtube_id text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'facodi', 'pg_temp'
AS $function$
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
      and (
      rel.metadata->>'review_scope' = 'title_and_channel_only'
      or rel.created_by_mechanism = 'existing_public_playlist_mapping'
    )
      and u.published and u.status = 'active' and c.published and c.status = 'active'
  ) uc on true
  where pl.object_type = 'playlist' and pl.published and pl.status = 'active'
    and pl.metadata->>'playlist_type' = 'facodi_owned_editorial_sequence'
    and nullif(pl.metadata->>'canonical_playlist_slug','') IS NULL
    and (p_unit_code is null or p_unit_code = any(uc.codes))
  order by pl.title, pl.id
  limit 500;
$function$;

CREATE OR REPLACE FUNCTION facodi.get_public_editorial_playlist_v2(p_slug text)
 RETURNS TABLE(playlist_id uuid, playlist_slug text, playlist_title text, playlist_description text, language text, item_count integer, verified_metadata_count integer, items jsonb, curricular_units jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'facodi', 'pg_temp'
AS $function$
 SELECT pl.id,pl.slug,pl.title,pl.description,pl.language,
  coalesce(vi.item_count,0),coalesce(vi.verified_metadata_count,0),
  coalesce(vi.items,'[]'::jsonb),coalesce(uc.units,'[]'::jsonb)
 FROM facodi.learning_objects pl
 LEFT JOIN LATERAL (
  SELECT count(*)::integer item_count,
   count(*) FILTER (WHERE y.metadata->>'metadata_verified_from_youtube_og'='true')::integer verified_metadata_count,
   jsonb_agg(jsonb_build_object(
    'position',r.position,
    'video_id',v.id,
    'youtube_id',y.youtube_video_id,
    'title',v.title,
    'channel',y.channel_title,
    'language',v.language,
    'youtube_url',y.canonical_url,
    'thumbnail_url',y.thumbnails->'default'->>'url',
    'metadata_verified',coalesce(y.metadata->>'metadata_verified_from_youtube_og','false')='true'
   ) ORDER BY r.position,y.youtube_video_id) items
  FROM facodi.learning_object_relations r
  JOIN facodi.learning_objects v ON v.id=r.child_object_id
  JOIN facodi.youtube_videos y ON y.learning_object_id=v.id
  WHERE r.parent_object_id=pl.id
  AND r.relation_type='contains'
  AND r.metadata->>'review_status'='approved'
  AND r.metadata->>'review_scope'='title_and_channel_only'
  AND v.object_type='video' AND v.published AND v.status='active'
  AND y.status='published'
 ) vi ON true
 LEFT JOIN LATERAL (
  SELECT jsonb_agg(jsonb_build_object(
   'unit_code',u.code,'unit_title',u.title,
   'unit_slug',u.slug,'course_code',c.code,'course_slug',c.slug
  ) ORDER BY c.code,u.code) units
  FROM facodi.learning_object_relations rel
  JOIN facodi.curricular_units u ON u.learning_object_id=rel.parent_object_id
  JOIN facodi.courses c ON c.id=u.course_id
  WHERE rel.child_object_id=pl.id AND rel.relation_type='contains'
    AND rel.metadata->>'review_status'='approved'
    and (
      rel.metadata->>'review_scope' = 'title_and_channel_only'
      or rel.created_by_mechanism = 'existing_public_playlist_mapping'
    )
    AND u.published AND u.status='active' AND c.published AND c.status='active'
 ) uc ON true
 WHERE pl.slug=coalesce((
 SELECT alias.metadata->>'canonical_playlist_slug'
 FROM facodi.learning_objects alias WHERE alias.slug=p_slug AND alias.object_type='playlist'
 AND alias.published AND alias.status='active'
 AND nullif(alias.metadata->>'canonical_playlist_slug','') IS NOT NULL
 LIMIT 1
),p_slug) AND pl.object_type='playlist'
   AND pl.published AND pl.status='active'
   AND pl.metadata->>'playlist_type'='facodi_owned_editorial_sequence'
 LIMIT 1;
$function$;
