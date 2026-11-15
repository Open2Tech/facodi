
-- Match the public editorial RPC's documented review scope while preserving
-- a separate, honest semantic label for supplementary/introductory study paths.
UPDATE facodi.learning_object_relations r
SET metadata=coalesce(r.metadata,'{}'::jsonb) ||
 jsonb_build_object('review_scope','title_and_channel_only',
  'pedagogical_scope', r.metadata->>'review_scope',
  'editorial_basis','existing_video_titles_and_channels',
  'teacher_approved',false)
WHERE r.relation_type='contains'
  AND r.created_by_mechanism='structured_catalog_import'
  AND r.metadata->>'curation_batch'='facodi_astro_sequence_existing_videos_20261115'
  AND r.metadata->>'review_scope' IN ('supplementary_study_path','supplementary_foundation_only')
  AND EXISTS(
     SELECT 1 FROM facodi.curricular_units u
     JOIN facodi.courses c ON c.id=u.course_id
     WHERE u.learning_object_id=r.parent_object_id
       AND c.code='FACODI-GACS-ASTRO-2018');
