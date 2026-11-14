-- 2026/27 Gestão: normalize the 123 editorial study topics as competencies and
-- link them to their matching FACODI outcomes. Nothing is university-accredited.
WITH topics AS (
 SELECT u.learning_object_id,u.code unit_code,u.title uc_title,
   e.value topic,e.ordinality::integer pos
 FROM facodi.curricular_units u
 JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
 CROSS JOIN LATERAL jsonb_array_elements_text(u.metadata->'study_topics')
 WITH ORDINALITY AS e(value,ordinality)
 WHERE u.status='active' AND u.published AND u.learning_object_id IS NOT NULL
)
INSERT INTO facodi.competencies
 (id,learning_object_id,code,title,description,level,metadata)
SELECT md5('facodi:lg1418:competency:'||t.unit_code||':'||t.pos)::uuid,
 t.learning_object_id,
 'FACODI-GESTAO-'||t.unit_code||'-'||lpad(t.pos::text,2,'0'),
 t.topic,
 'Competência introdutória proposta pela FACODI para apoiar o estudo de '||
 t.uc_title||'. Não corresponde a uma competência oficial acreditada pela Universidade do Algarve.',
 'introductory',
 jsonb_build_object(
  'source','facodi.curricular_units.metadata.study_topics',
  'unit_code',t.unit_code,'topic_order',t.pos,'academic_year','2026/27',
  'university_course_code','1418','course_code','LGEST',
  'editorial_proposal',true,'teacher_validated',false,
  'official_curriculum_outcome',false,'institutional_endorsement',false)
FROM topics t
ON CONFLICT(id) DO NOTHING;

WITH mapped AS (
 SELECT o.id outcome_id,
 md5('facodi:lg1418:competency:'||u.code||':'||o.position)::uuid competency_id
 FROM facodi.learning_outcomes o
 JOIN facodi.curricular_units u ON u.learning_object_id=o.learning_object_id
 JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
 WHERE o.metadata->>'source'='facodi.curricular_units.metadata.study_topics'
 AND o.metadata->>'official_learning_outcome'='false'
 AND o.position BETWEEN 1 AND 3
)
UPDATE facodi.learning_outcomes o
SET competency_id=m.competency_id
FROM mapped m JOIN facodi.competencies comp ON comp.id=m.competency_id
WHERE o.id=m.outcome_id AND o.competency_id IS DISTINCT FROM m.competency_id;

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.competencies cp
 JOIN facodi.curricular_units u ON u.learning_object_id=cp.learning_object_id
 JOIN facodi.courses c ON c.id=u.course_id WHERE c.code='LGEST')<>123
 THEN RAISE EXCEPTION 'Gestão expected 123 competencies'; END IF;
 IF (SELECT count(*) FROM facodi.learning_outcomes o
 JOIN facodi.curricular_units u ON u.learning_object_id=o.learning_object_id
 JOIN facodi.courses c ON c.id=u.course_id WHERE c.code='LGEST'
  AND o.competency_id IS NOT NULL)<>123
 THEN RAISE EXCEPTION 'Gestão outcomes have missing competencies'; END IF;
END $$;