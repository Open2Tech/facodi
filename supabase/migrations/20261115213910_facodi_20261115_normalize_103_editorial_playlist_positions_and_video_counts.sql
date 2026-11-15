
-- Normalize published, editorial FACODI playlist positions, preserving the
-- canonical video identities and all editorial learner progress.
-- Add the newly validated introductory vector lesson before lessons 05–11.
CREATE TEMP TABLE _facodi_order_before ON COMMIT DROP AS
SELECT p.id playlist_id,p.slug,r.id relation_id,r.child_object_id video_id,
       r.position old_position,
       row_number() OVER (
         PARTITION BY p.id ORDER BY
           CASE WHEN p.slug='facodi-math-algebra-vetores-transformacoes'
                     AND v.slug='facodi-video-lAAfjtnc7bI' THEN 0 ELSE 1 END,
           r.position NULLS LAST,r.created_at,r.id
       )::int new_position
FROM facodi.learning_objects p
JOIN facodi.learning_object_relations r ON r.parent_object_id=p.id
JOIN facodi.learning_objects v ON v.id=r.child_object_id AND v.object_type='video'
WHERE p.object_type='playlist' AND p.published AND p.status='active'
AND r.relation_type='contains' AND v.published AND v.status='active'
AND p.source_type='generated';

DO $preflight$ DECLARE play_count int; total_links int; BEGIN
 SELECT count(distinct playlist_id),count(*) INTO play_count,total_links FROM _facodi_order_before;
 IF play_count<>103 OR total_links<600 OR
    (SELECT count(*) FROM _facodi_order_before WHERE
       playlist_id=(SELECT id FROM facodi.learning_objects WHERE slug='facodi-math-algebra-vetores-transformacoes'))<>7
 OR NOT EXISTS(SELECT 1 FROM _facodi_order_before b JOIN facodi.learning_objects v
     ON v.id=b.video_id WHERE v.slug='facodi-video-lAAfjtnc7bI'
       AND b.new_position=1)
 OR EXISTS(SELECT 1 FROM _facodi_order_before GROUP BY playlist_id,new_position HAVING count(*)>1)
 THEN RAISE EXCEPTION 'Unexpected video population or vector-sequence order'; END IF;
END $preflight$;

UPDATE facodi.learning_object_relations r SET
 position=b.new_position,
 metadata=coalesce(r.metadata,'{}'::jsonb)||
   jsonb_build_object('previous_position_before_20261115',b.old_position,
   'order_normalization','dense_ascending_editorial_order',
   'reordering_reason', CASE WHEN b.playlist_id=(SELECT id FROM facodi.learning_objects
   WHERE slug='facodi-math-algebra-vetores-transformacoes')
   THEN 'original creator lesson order; vector introduction moved before lesson 05'
   ELSE 'remove noncontiguous positions without altering video membership' END)
FROM _facodi_order_before b
WHERE r.id=b.relation_id AND r.position IS DISTINCT FROM b.new_position;

UPDATE facodi.learning_objects p
SET metadata=coalesce(p.metadata,'{}'::jsonb)||
 jsonb_build_object('video_count',v.n,
 'ordering_policy',CASE WHEN p.slug='facodi-math-algebra-vetores-transformacoes'
    THEN 'introductory_vectors_then_original_lecture_number' ELSE 'existing_editorial_progression' END,
 'ordering_audited_at','2026-11-15',
 'ordering_audit_batch','facodi_sequence_order_reconcile_20261115')
FROM (SELECT playlist_id,count(*) n FROM _facodi_order_before GROUP BY playlist_id) v
WHERE p.id=v.playlist_id
 AND (p.metadata->>'video_count' IS DISTINCT FROM v.n::text
   OR p.slug='facodi-math-algebra-vetores-transformacoes');

DO $verify$ BEGIN
IF EXISTS(
 SELECT 1 FROM _facodi_order_before b JOIN facodi.learning_object_relations r ON r.id=b.relation_id
 WHERE r.position IS DISTINCT FROM b.new_position
) OR EXISTS(
 SELECT 1 FROM (
  SELECT playlist_id,count(*) n,min(r.position) mn,max(r.position) mx,
   count(distinct r.position) uniq
  FROM _facodi_order_before b JOIN facodi.learning_object_relations r ON r.id=b.relation_id
  GROUP BY playlist_id
 ) a WHERE mn<>1 OR mx<>n OR uniq<>n
) OR EXISTS (
 SELECT 1 FROM (
 SELECT b.playlist_id,count(*) n,coalesce(p.metadata->>'video_count','') meta
 FROM _facodi_order_before b JOIN facodi.learning_objects p ON p.id=b.playlist_id
 GROUP BY b.playlist_id,p.metadata
 ) z WHERE z.meta<>z.n::text)
THEN RAISE EXCEPTION 'Playlist order or cached video counts inconsistent';END IF;
END $verify$;
