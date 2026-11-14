-- FACODI Gestão: 123 original editorial study goals and a searchable topic index.
-- These are NOT officially issued learning outcomes, grading rubrics, or FUC text.
WITH base AS (
 SELECT u.code,u.learning_object_id,u.metadata->'study_topics' topics
 FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
 WHERE c.code='LGEST' AND u.published=true
), topics AS (
 SELECT base.code,base.learning_object_id,t.value topic,t.ordinality::integer pos
 FROM base CROSS JOIN LATERAL jsonb_array_elements_text(base.topics)
  WITH ORDINALITY AS t(value,ordinality)
)
INSERT INTO facodi.learning_outcomes
 (id,learning_object_id,statement,position,metadata)
SELECT md5('facodi:gestao:editorial_outcome:'||x.code||':'||x.pos)::uuid,
 x.learning_object_id,
 CASE x.pos
 WHEN 1 THEN 'Explicar os conceitos fundamentais de '||x.topic||' e reconhecer a sua utilidade em contexto de Gestão.'
 WHEN 2 THEN 'Analisar exemplos relacionados com '||x.topic||' e justificar as principais decisões ou interpretações.'
 ELSE 'Desenvolver um exercício ou estudo de caso introdutório sobre '||x.topic||', apresentando os procedimentos e as conclusões.'
 END,
 x.pos,
 jsonb_build_object(
  'topic',x.topic,'source','facodi.curricular_units.metadata.study_topics',
  'unit_code',x.code,'course_code','LGEST','academic_year','2026/27',
  'version','2026-11-14','teacher_validated',false,
  'editorial_proposal',true,'official_learning_outcome',false,
  'transcribed_from_official_fuc',false)
FROM topics x
ON CONFLICT(id) DO NOTHING;

WITH base AS (
 SELECT u.code,u.learning_object_id,u.metadata->'study_topics' topics
 FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
 WHERE c.code='LGEST' AND u.published=true
), topics AS (
 SELECT base.code,base.learning_object_id,t.value topic
 FROM base CROSS JOIN LATERAL jsonb_array_elements_text(base.topics) t(value)
)
INSERT INTO facodi.keywords
 (id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:gestao:editorial_keyword:'||t.code||':'||md5(lower(t.topic)))::uuid,
 t.learning_object_id,t.topic,lower(trim(t.topic)),'pt',0.7,
 'facodi_editorial_study_topics',
 jsonb_build_object('course_code','LGEST','unit_code',t.code,
  'official_term',false,'source','facodi.curricular_units.metadata.study_topics')
FROM topics t
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;

-- Official course-level information, not UC-level claims.
UPDATE facodi.courses c
SET metadata=coalesce(c.metadata,'{}'::jsonb) ||
 jsonb_build_object(
 'official_programme_objectives_source','https://www.ualg.pt/curso/1418',
 'official_programme_objectives_paraphrased',
 jsonb_build_array(
 'Atuar em contextos de gestão dos setores público, privado e social.',
 'Desenvolver capacidades de análise e intervenção nos domínios de contabilidade, fiscalidade, finanças, recursos humanos, marketing e estratégia.',
 'Utilizar informação económica, métodos quantitativos e sistemas de informação no apoio à decisão.',
 'Estimular pensamento crítico, resolução de problemas, adaptação, inovação e empreendedorismo.',
 'Valorizar a aplicação em contexto profissional por meio do estágio curricular.',
 'Preparar bases técnicas para prosseguimento de estudos e qualificação nas áreas de gestão e contabilidade.'),
 'official_programme_objectives_is_paraphrase',true,
 'facodi_41_original_study_goals_review_status','editorial_proposals_not_official_fuc')
WHERE c.code='LGEST';
