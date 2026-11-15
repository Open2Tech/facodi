
-- FACODI read-only regression audit for public educational graph and video order.
-- Run in Supabase SQL Editor or through the Supabase SQL connector.
-- Intentional: must fail fast if a review, redirect, ordering or security rule breaks.
BEGIN;
SET TRANSACTION READ ONLY;

DO $catalog_audit$ BEGIN
 IF EXISTS(SELECT 1 FROM(
  SELECT p.id,count(*) n,min(r.position) mn,max(r.position) mx,
  count(distinct r.position) distinct_n
  FROM facodi.learning_objects p
  JOIN facodi.learning_object_relations r ON r.parent_object_id=p.id AND r.relation_type='contains'
  JOIN facodi.learning_objects v ON v.id=r.child_object_id AND v.object_type='video' AND v.published AND v.status='active'
  WHERE p.object_type='playlist' AND p.published AND p.status='active'
    AND p.metadata->>'playlist_type'='facodi_owned_editorial_sequence'
    AND nullif(p.metadata->>'canonical_playlist_slug','') IS NULL
  GROUP BY p.id) z
  WHERE mn<>1 OR mx<>n OR distinct_n<>n)
 THEN RAISE EXCEPTION 'Published sequences have non-dense or duplicate video positions'; END IF;

 IF EXISTS(SELECT 1 FROM(
  SELECT p.id,count(*) n,
  count(*) FILTER(WHERE r.metadata->>'review_status'='approved'
   AND r.metadata->>'review_scope'='title_and_channel_only' AND y.status='published') visible_n,
  p.metadata->>'video_count' meta_n
  FROM facodi.learning_objects p
  JOIN facodi.learning_object_relations r ON r.parent_object_id=p.id AND r.relation_type='contains'
  JOIN facodi.learning_objects v ON v.id=r.child_object_id AND v.object_type='video' AND v.published AND v.status='active'
  LEFT JOIN facodi.youtube_videos y ON y.learning_object_id=v.id
  WHERE p.object_type='playlist' AND p.published AND p.status='active'
   AND p.metadata->>'playlist_type'='facodi_owned_editorial_sequence'
   AND nullif(p.metadata->>'canonical_playlist_slug','') IS NULL
  GROUP BY p.id,p.metadata) z WHERE n<>visible_n OR meta_n IS DISTINCT FROM n::text)
 THEN RAISE EXCEPTION 'Editorial videos, approval metadata and cached counts diverge'; END IF;

 IF EXISTS(SELECT 1 FROM (
  SELECT pl.id,c.object_type,count(*) n,count(distinct r.position) distinct_n
  FROM facodi.learning_objects pl JOIN facodi.learning_object_relations r
  ON r.parent_object_id=pl.id AND r.relation_type='contains'
  JOIN facodi.learning_objects c ON c.id=r.child_object_id AND c.published
  WHERE pl.object_type='module' AND pl.published
  GROUP BY pl.id,c.object_type
 ) z WHERE n<>distinct_n)
 THEN RAISE EXCEPTION 'Published modules have ambiguous same-type positions';END IF;

 IF EXISTS(SELECT 1 FROM (
  SELECT parent_object_id,child_object_id,relation_type,count(*) n
  FROM facodi.learning_object_relations GROUP BY 1,2,3 HAVING count(*)>1) duplicates)
 THEN RAISE EXCEPTION 'Duplicate educational relation'; END IF;

 IF EXISTS(SELECT 1 FROM (
  SELECT youtube_video_id FROM facodi.youtube_videos GROUP BY youtube_video_id HAVING count(*)>1) duplicates)
 THEN RAISE EXCEPTION 'Duplicated canonical YouTube video ID'; END IF;

 IF EXISTS(SELECT 1 FROM facodi.learning_objects alias
  WHERE alias.object_type='playlist' AND alias.published AND
    nullif(alias.metadata->>'canonical_playlist_slug','') IS NOT NULL
    AND (NOT EXISTS(SELECT 1 FROM facodi.learning_objects canonical
     WHERE canonical.slug=alias.metadata->>'canonical_playlist_slug'
     AND canonical.published AND canonical.status='active')
      OR EXISTS(SELECT 1 FROM facodi.editorial_playlist_progress pr
       WHERE pr.playlist_id=alias.id)))
 THEN RAISE EXCEPTION 'Canonical alias target missing or learner progress stranded';END IF;
END $catalog_audit$;

SET LOCAL ROLE anon;

DO $public_audit$ DECLARE first_youtube text; BEGIN
 IF (SELECT count(*) FROM facodi.list_public_editorial_sequences_v1(NULL))<100
 THEN RAISE EXCEPTION 'Expected public curated sequence catalogue unexpectedly shrank';END IF;
 IF (SELECT count(*) FROM facodi.learning_objects WHERE NOT published)>0
 THEN RAISE EXCEPTION 'Anonymous role can see private/draft resources';END IF;
 IF has_table_privilege('anon','facodi.editorial_playlist_progress','SELECT')
 THEN RAISE EXCEPTION 'Anonymous role can read learner playlist progress';END IF;

 IF NOT EXISTS(SELECT 1 FROM facodi.get_public_editorial_playlist_v2(
  'facodi-astro-sequence-astro-luz-ondas-observacao')
  WHERE playlist_slug='facodi-science-fisica-ondas-optica-moderna' AND item_count=4)
 THEN RAISE EXCEPTION 'Historical Astronomy bookmark no longer resolves';END IF;

 IF EXISTS(SELECT 1 FROM jsonb_array_elements((
    facodi.search_public_resources_v4(
      p_search=>'Astronomia — luz, ondas e observação',
      p_object_type=>'playlist', p_page_size=>50))->'items') entry
  WHERE entry->>'slug'='facodi-astro-sequence-astro-luz-ondas-observacao')
 THEN RAISE EXCEPTION 'Merged playlist alias remains in faceted catalogue';END IF;

 SELECT items->0->>'youtube_id' INTO first_youtube
 FROM facodi.get_public_editorial_playlist_v2('facodi-math-algebra-vetores-transformacoes');
 IF first_youtube<>'lAAfjtnc7bI' THEN RAISE EXCEPTION 'Algebra starts with wrong vector video';END IF;
 SELECT items->0->>'youtube_id' INTO first_youtube
 FROM facodi.get_public_editorial_playlist_v2('facodi-playlist-git-fundamentos-colaboracao');
 IF first_youtube<>'xEKo29OWILE' THEN RAISE EXCEPTION 'Git sequence no longer starts with versioning fundamentals';END IF;
 SELECT items->0->>'youtube_id' INTO first_youtube
 FROM facodi.get_public_editorial_playlist_v2('facodi-playlist-python-iniciacao-ambientes');
 IF first_youtube<>'S9uPNppGsGo' THEN RAISE EXCEPTION 'Python sequence no longer starts with fundamentals';END IF;
 SELECT items->0->>'youtube_id' INTO first_youtube
 FROM facodi.get_public_editorial_playlist_v2('facodi-playlist-sql-relacional-fundamentos');
 IF first_youtube<>'Ofktsne-utM' THEN RAISE EXCEPTION 'SQL sequence no longer starts with basic database concepts';END IF;
END $public_audit$;

ROLLBACK;
