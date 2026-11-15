-- FACODI / YouTube metadata regression check, 15 November 2026.
-- Read-only; no changes to videos, permissions, learner data or progress.
BEGIN;
SET TRANSACTION READ ONLY;
DO $quality$ BEGIN
 IF EXISTS (SELECT 1 FROM facodi.learning_objects
   WHERE cardinality(coalesce(keywords,'{}'::text[])) = 0)
 THEN RAISE EXCEPTION 'Incomplete keywords in FACODI catalogue';END IF;

 IF (SELECT count(*) FROM facodi.youtube_videos y
   WHERE y.metadata->'source_metadata_check'->>'verification_scope'='title_and_thumbnail_only')<191
 THEN RAISE EXCEPTION 'Historical source verifications lost';END IF;

 IF (SELECT count(*) FROM facodi.youtube_videos y
   WHERE y.metadata->'youtube_platform_policy'->>'individual_video_license'='not_verified')<940
 THEN RAISE EXCEPTION 'Per-video YouTube license ambiguity not preserved';END IF;

 IF EXISTS(SELECT 1 FROM facodi.learning_object_relations r
   LEFT JOIN facodi.learning_objects p ON p.id=r.parent_object_id
   LEFT JOIN facodi.learning_objects c ON c.id=r.child_object_id
   WHERE p.id IS NULL OR c.id IS NULL)
 THEN RAISE EXCEPTION 'Orphan learning-object graph relation';END IF;

 IF EXISTS(SELECT 1 FROM (
    SELECT parent_object_id,child_object_id,relation_type,count(*) n
    FROM facodi.learning_object_relations GROUP BY 1,2,3 HAVING count(*)>1
  ) d)
 THEN RAISE EXCEPTION 'Duplicate learning-object graph relation';END IF;
END $quality$;

SET LOCAL ROLE anon;
DO $public$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects WHERE NOT published)>0
 THEN RAISE EXCEPTION 'Anonymous viewers can see unpublished objects';END IF;
 IF has_table_privilege('anon','facodi.editorial_playlist_progress','SELECT')
 THEN RAISE EXCEPTION 'Anonymous viewers can access private learning progress';END IF;
 IF (SELECT item_count FROM facodi.get_public_editorial_playlist_v2(
   'facodi-odoo19-rh-recrutamento'))<>10
 THEN RAISE EXCEPTION 'Published recruitment sequence broken';END IF;
END $public$;
ROLLBACK;
