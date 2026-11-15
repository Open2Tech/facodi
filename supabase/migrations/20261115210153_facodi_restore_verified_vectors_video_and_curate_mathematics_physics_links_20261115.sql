
-- Restore an existing source-verified educational vector lesson from draft
-- and reuse it in existing Physics and Linear Algebra sequences.
-- Creator watch page: https://www.youtube.com/watch?v=lAAfjtnc7bI
-- Creator course reference: https://www.professordouglasmaioli.com.br/aulas-alg-lin-e-ga
-- The full lesson was not watched; publication is an external link only.
DO $g$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM facodi.learning_objects lo JOIN facodi.youtube_videos y
  ON y.learning_object_id=lo.id
  WHERE lo.slug='facodi-video-lAAfjtnc7bI'
   AND y.youtube_video_id='lAAfjtnc7bI'
   AND lo.object_type='video' AND lo.status='draft' AND NOT lo.published)
 OR EXISTS(SELECT 1 FROM facodi.learning_object_relations r
    JOIN facodi.learning_objects lo ON lo.id=r.child_object_id
    WHERE lo.slug='facodi-video-lAAfjtnc7bI' AND r.metadata->>'review_status'='approved')
 THEN RAISE EXCEPTION 'Vector lesson not in expected draft state'; END IF;
END $g$;

UPDATE facodi.learning_objects lo SET status='active',published=true,
 description='Introdução aos vetores, módulo, direção, sentido, operações e representação no plano e no espaço. Aula do Professor Douglas Maioli; a FACODI apenas disponibiliza o vídeo original. Verificada a descrição pública do autor, não a execução integral do conteúdo.',
 keywords=ARRAY['Vetores','Soma de vetores','Módulo e direção','Vetores unitários'],
 tags=ARRAY['vetores','física','álgebra-linear','recurso-externo','apoio-ao-estudo'],
 metadata=coalesce(lo.metadata,'{}'::jsonb)||
 jsonb_build_object(
  'source_verified_from_creator_watch_page',true,
  'creator_course_reference','https://www.professordouglasmaioli.com.br/aulas-alg-lin-e-ga',
  'review_scope','creator_title_description_and_syllabus',
  'full_video_reviewed',false,'copyright_rehosting_allowed',false,
  'curation_status','published_as_supplementary_resource',
  'publication_type','external_youtube_link',
  'curation_batch','facodi_audit_restore_verified_vector_basics_20261115')
WHERE lo.slug='facodi-video-lAAfjtnc7bI';

UPDATE facodi.youtube_videos SET status='published',
 metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
  'source_verified_from_creator_watch_page',true,
  'full_video_reviewed',false,
  'curation_batch','facodi_audit_restore_verified_vector_basics_20261115')
WHERE youtube_video_id='lAAfjtnc7bI';

INSERT INTO facodi.learning_object_relations
 (id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:audited-vector:unit:'||u.code)::uuid,u.learning_object_id,
 lo.id,'contains',
 76000+row_number() OVER (PARTITION BY u.id ORDER BY u.code)::int,
 'metadata_based_educational_curation',
 jsonb_build_object('review_status','approved','review_scope','creator_title_description_and_syllabus',
   'full_video_reviewed',false,'teacher_approved',false,
   'supplementary_content_only',true,
   'curation_batch','facodi_audit_restore_verified_vector_basics_20261115')
FROM facodi.curricular_units u
JOIN facodi.courses c ON c.id=u.course_id
CROSS JOIN facodi.learning_objects lo
WHERE lo.slug='facodi-video-lAAfjtnc7bI'
AND u.published AND u.status='active'
AND u.code IN ('19411003','19411004','IFESCAR-ADM26-1-FISICA','18121000')
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations
 (id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:audited-vector:playlist:'||p.slug)::uuid,p.id,lo.id,
 'contains',coalesce((SELECT max(position)+1 FROM facodi.learning_object_relations WHERE parent_object_id=p.id),1),
 'metadata_based_educational_curation',
 jsonb_build_object('review_status','approved','review_scope','creator_title_description_and_syllabus',
  'source_video_fully_reviewed',false,
  'curation_batch','facodi_audit_restore_verified_vector_basics_20261115')
FROM facodi.learning_objects p CROSS JOIN facodi.learning_objects lo
WHERE lo.slug='facodi-video-lAAfjtnc7bI'
 AND p.slug IN ('facodi-math-algebra-vetores-transformacoes',
 'facodi-science-fisica-vetores-cinematica')
 AND p.object_type='playlist' AND p.published
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

UPDATE facodi.learning_objects p SET metadata=coalesce(p.metadata,'{}'::jsonb)||
 jsonb_build_object('video_count',(SELECT count(*) FROM facodi.learning_object_relations r WHERE r.parent_object_id=p.id AND r.relation_type='contains'))
WHERE p.slug IN ('facodi-math-algebra-vetores-transformacoes','facodi-science-fisica-vetores-cinematica')
AND p.object_type='playlist';

DO $v$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects WHERE slug='facodi-video-lAAfjtnc7bI'
   AND published AND status='active')<>1
 OR (SELECT count(*) FROM facodi.learning_object_relations r
   JOIN facodi.learning_objects v ON v.id=r.child_object_id
   WHERE v.slug='facodi-video-lAAfjtnc7bI'
   AND r.metadata->>'curation_batch'='facodi_audit_restore_verified_vector_basics_20261115')<>6
 THEN RAISE EXCEPTION 'Verified vector publication or associations incomplete'; END IF;
END $v$;
