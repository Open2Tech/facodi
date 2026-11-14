-- Candidates for editorial UC/video matching, sourced exclusively from existing
-- facodi.unit_videos. Not AI model predictions and not approvals.
-- Preserve provenance to enable human verification of erroneous playlist mappings.
INSERT INTO facodi.video_classifications
 (id,video_id,course_id,curricular_unit_id,model_run_id,
  confidence,confidence_level,status,needs_review,justification,evidence,metadata)
SELECT md5('facodi:classification:unit-video:'||uv.id::text)::uuid,
       y.id,u.course_id,u.id,NULL,
       0,'unassessed','needs_review',true,
       'Associação proposta por uma playlist existente. A pertinência pedagógica ainda não foi confirmada.',
       jsonb_build_array(jsonb_build_object(
         'kind','existing_playlist_mapping',
         'unit_video_id',uv.id,
         'unit_code',u.code,
         'youtube_video_id',v.youtube_id,
         'source_playlist_id',uv.metadata->'source_playlist_id',
         'source_link_id',uv.metadata->'source_link_id')),
       jsonb_build_object(
         'source','facodi.unit_videos',
         'source_course_code',c.code,
         'review_origin','legacy_playlist_mapping',
         'origin_review_status',coalesce(uv.metadata->>'review_status','pending_review'),
         'automated_classification_performed',false)
FROM facodi.unit_videos uv
JOIN facodi.curricular_units u ON u.id=uv.curricular_unit_id
JOIN facodi.courses c ON c.id=u.course_id
JOIN public.videos v ON v.id=uv.video_id
JOIN facodi.youtube_videos y ON y.youtube_video_id=v.youtube_id
WHERE c.code IN ('LESTI','LDCOM')
  AND coalesce(uv.metadata->>'review_status','pending_review')<>'approved'
ON CONFLICT(id) DO NOTHING;