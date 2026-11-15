
-- Contextualize approved UC -> curated playlist -> video paths without
-- pretending videos are official lectures or changing curricular relationships.
CREATE TEMP TABLE _indirect_curations ON COMMIT DROP AS
SELECT y.id yt_row,lo.id learning_object_id,
 coalesce(ctx.context,'[]'::jsonb) indirect_units,
 coalesce(ctx.labels,'{}'::text[]) unit_labels,
 v.id public_source_id
FROM facodi.youtube_videos y
JOIN facodi.learning_objects lo ON lo.id=y.learning_object_id AND lo.object_type='video'
LEFT JOIN public.videos v ON v.youtube_id=y.youtube_video_id
LEFT JOIN LATERAL (
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'course_code',paths.course_code,
  'unit_code',paths.unit_code,
  'unit_title',paths.unit_title,
  'via_sequence_slug',paths.sequence_slug,
  'relationship','indirect_approved_learning_path')
  ORDER BY paths.course_code,paths.unit_code,paths.sequence_slug),'[]'::jsonb) context,
 coalesce(array_agg(distinct paths.unit_title),'{}'::text[]) labels
 FROM (
  SELECT DISTINCT c.code course_code,u.code unit_code,u.title unit_title,
     playlist.slug sequence_slug
  FROM facodi.learning_object_relations r_video
  JOIN facodi.learning_objects playlist ON playlist.id=r_video.parent_object_id
    AND playlist.object_type='playlist' AND playlist.published AND playlist.status='active'
  JOIN facodi.learning_object_relations r_unit
    ON r_unit.child_object_id=playlist.id AND r_unit.relation_type='contains'
    AND r_unit.metadata->>'review_status'='approved'
    AND r_unit.metadata->>'review_scope'='title_and_channel_only'
  JOIN facodi.curricular_units u ON u.learning_object_id=r_unit.parent_object_id AND u.published
  JOIN facodi.courses c ON c.id=u.course_id AND c.published
  WHERE r_video.child_object_id=lo.id AND r_video.relation_type='contains'
    AND r_video.metadata->>'review_status'='approved'
    AND r_video.metadata->>'review_scope'='title_and_channel_only'
  ORDER BY c.code,u.code,playlist.slug LIMIT 12
 ) paths
) ctx ON TRUE;

DO $guard$ BEGIN
 IF (SELECT count(*) FROM _indirect_curations)<>940
 OR (SELECT count(*) FROM _indirect_curations WHERE jsonb_array_length(indirect_units)>0)<>516
 OR (SELECT count(*) FROM _indirect_curations WHERE public_source_id IS NOT NULL)<>657
 THEN RAISE EXCEPTION 'Indirect curriculum/source inventory changed';END IF;
END $guard$;

UPDATE facodi.learning_objects lo SET
keywords=CASE WHEN cardinality(lo.keywords)>=12 THEN lo.keywords
ELSE (
 SELECT coalesce(array_agg(z.word ORDER BY z.ord),'{}'::text[])
 FROM (
  SELECT t.word,min(t.ordinality) ord
  FROM unnest(
   coalesce(lo.keywords,'{}'::text[]) ||
   coalesce(q.unit_labels,'{}'::text[]) ||
   ARRAY(SELECT val FROM jsonb_array_elements_text(
     coalesce(lo.metadata->'ai_suggested_topics_unreviewed','[]'::jsonb)) val)
  ) WITH ORDINALITY t(word,ordinality)
  WHERE nullif(btrim(t.word),'') IS NOT NULL AND length(t.word)<=120
  GROUP BY t.word ORDER BY min(t.ordinality) LIMIT 12
 ) z
) END,
metadata=coalesce(lo.metadata,'{}'::jsonb)||
jsonb_build_object(
 'curricular_context_indirect_via_approved_sequences',q.indirect_units,
 'indirect_context_is_academic_equivalence',false,
 'curricular_linkage_method','approved_facodi_unit_to_sequence_to_video',
 'metadata_quality_relationship_batch','facodi_20261115_indirect_curricular_links')
||CASE WHEN q.public_source_id IS NOT NULL
THEN jsonb_build_object('public_videos_source_record_id',q.public_source_id,
 'public_source_traceability','youtube_id_exact_match')
ELSE '{}'::jsonb END
FROM _indirect_curations q WHERE lo.id=q.learning_object_id;

UPDATE facodi.youtube_videos y SET metadata=coalesce(y.metadata,'{}'::jsonb)||
 jsonb_build_object(
 'indirect_curricular_paths',jsonb_array_length(q.indirect_units),
 'indirect_curricular_paths_are_supplementary',true,
 'metadata_quality_relationship_batch','facodi_20261115_indirect_curricular_links')
 ||CASE WHEN q.public_source_id IS NOT NULL
 THEN jsonb_build_object('public_source_video_id',q.public_source_id,
   'public_source_match_method','youtube_id')
 ELSE '{}'::jsonb END
FROM _indirect_curations q WHERE y.id=q.yt_row;

DO $verify$ BEGIN
IF (SELECT count(*) FROM facodi.learning_objects WHERE object_type='video'
AND metadata->>'metadata_quality_relationship_batch'='facodi_20261115_indirect_curricular_links')<>940
OR (SELECT count(*) FROM facodi.learning_objects WHERE object_type='video'
AND jsonb_array_length(coalesce(metadata->'curricular_context_indirect_via_approved_sequences','[]'::jsonb))>0)<>516
THEN RAISE EXCEPTION 'Indirect curriculum metadata incomplete';END IF;
END $verify$;
