-- FACODI catalog-derived study route blueprints, editor-only drafts, no AI.
-- Type choices respect the table check: module / curriculum_mapping.
INSERT INTO facodi.generated_structures
 (id,root_object_id,structure_type,status,prompt,result,generated_by)
SELECT md5('facodi:editorial-path:'||u.id::text)::uuid,
 u.learning_object_id,'module','draft',
 jsonb_build_object('editorial_kind','uc_study_path','version','2026-11-14',
  'source','facodi.curricular_units.metadata.study_topics',
  'unit_id',u.id,'mode','deterministic', 'ai_model_executed',false,
  'teacher_review_required',true),
 jsonb_build_object('editorial_kind','uc_study_path','unit_code',u.code,
  'unit_title',u.title,'course_code',c.code,
  'steps',(SELECT coalesce(jsonb_agg(jsonb_build_object(
    'order',t.ord,'topic',t.topic,
    'activity',CASE t.ord WHEN 1 THEN 'Estudar conceitos e vocabulário'
      WHEN 2 THEN 'Relacionar conceitos com exemplos'
      ELSE 'Aplicar em exercícios' END,
    'teacher_reviewed',false) ORDER BY t.ord),'[]'::jsonb)
    FROM jsonb_array_elements_text(u.metadata->'study_topics')
      WITH ORDINALITY t(topic,ord)),
  'available_video_links',(SELECT count(*) FROM facodi.unit_videos uv
   WHERE uv.curricular_unit_id=u.id
   AND uv.metadata->>'review_status'='approved'),
  'available_reading_links',(SELECT count(*) FROM facodi.learning_object_relations r
    WHERE r.parent_object_id=u.learning_object_id
    AND r.created_by_mechanism='verified_external_reading_curation'),
  'references',(SELECT coalesce(jsonb_agg(r.source_url ORDER BY r.position),'[]'::jsonb)
    FROM (SELECT lo.source_url,rel.position FROM facodi.learning_object_relations rel
     JOIN facodi.learning_objects lo ON lo.id=rel.child_object_id
     WHERE rel.parent_object_id=u.learning_object_id
       AND rel.created_by_mechanism='verified_external_reading_curation'
       AND lo.published AND lo.object_type='external_resource'
     ORDER BY rel.position LIMIT 12) r),
  'disclaimer','Roteiro editorial interno não homologado ou avaliado por docentes.'),
 'facodi_deterministic_editorial_blueprint'
FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
WHERE u.status='active' AND u.published AND c.status='active' AND c.published
 AND c.code IN ('LESTI','LDCOM') AND u.learning_object_id IS NOT NULL
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.generated_structures
 (id,root_object_id,structure_type,status,prompt,result,generated_by)
SELECT md5('facodi:course-map:'||c.id::text)::uuid,
 c.learning_object_id,'curriculum_mapping','draft',
 jsonb_build_object('editorial_kind','course_map','version','2026-11-14',
  'mode','deterministic','ai_model_executed',false,
  'teacher_review_required',true),
 jsonb_build_object('editorial_kind','course_map','code',c.code,
 'title',c.title,'official_plan',c.plan_url,'ects_total',c.ects_total,
 'units',(SELECT coalesce(jsonb_agg(jsonb_build_object(
   'code',u.code,'title',u.title,'year',u.year,'semester',u.semester,
   'ects',u.ects,'generic_option',u.title ILIKE 'Opção%')
   ORDER BY u.year,u.semester,u.position,u.title),'[]'::jsonb)
 FROM facodi.curricular_units u WHERE u.course_id=c.id
  AND u.status='active' AND u.published),
 'disclaimer','Opções são alternativas e não créditos cumulativos.'),
 'facodi_deterministic_editorial_blueprint'
FROM facodi.courses c WHERE c.code IN('LESTI','LDCOM')
AND c.status='active' AND c.published AND c.learning_object_id IS NOT NULL
ON CONFLICT(id) DO NOTHING;
DO $g$ BEGIN
 IF (SELECT count(*) FROM facodi.generated_structures WHERE generated_by=
  'facodi_deterministic_editorial_blueprint' AND structure_type='module')<>84
 THEN RAISE EXCEPTION 'Expected 84 draft study routes'; END IF;
 IF (SELECT count(*) FROM facodi.generated_structures WHERE generated_by=
  'facodi_deterministic_editorial_blueprint' AND structure_type='curriculum_mapping')<>2
 THEN RAISE EXCEPTION 'Expected 2 course mapping drafts'; END IF;
END $g$;