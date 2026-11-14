
-- Original FACODI study aids drawn from the three editorial topics associated
-- with each of the 75 official UFES subject codes. Never attribute them to UFES.
CREATE TEMP TABLE _ufes2019 AS
SELECT u.id unit_id,u.code,u.title,u.learning_object_id object_id,
 u.metadata->'study_topics' study_topics,
 u.metadata->>'curricular_category' grp,u.position,u.year,u.semester
FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
WHERE c.code='UFES-LETRAS-ING-83-2019' AND u.published AND u.status='active';

DO $check$ BEGIN
 IF (SELECT count(*) FROM _ufes2019)<>75
 OR EXISTS(SELECT 1 FROM _ufes2019 WHERE
 jsonb_typeof(study_topics)<>'array' OR jsonb_array_length(study_topics)<>3)
 THEN RAISE EXCEPTION 'Expected exactly 75 UFES units with three study topics'; END IF;
END $check$;

INSERT INTO facodi.competencies
 (id,learning_object_id,code,title,description,level,metadata)
SELECT md5('facodi:ufes:83:2019:competency:'||u.code||':'||topic.n)::uuid,
 u.object_id,'FACODI-UFES83-'||u.code||'-'||topic.n,
 topic.v,
 'Eixo de competências proposto pela FACODI para estudos complementares de '||u.title||
 '. Não representa resultado de aprendizagem ou competência oficialmente definida pela UFES.',
 'introductory',
 jsonb_build_object('source','facodi.curricular_units.metadata.study_topics',
 'official_curriculum_outcome',false,'teacher_validated',false,'editorial_proposal',true,
 'institution','UFES','course_code','UFES-LETRAS-ING-83-2019',
 'subject_code',u.code,'topic_order',topic.n,'version','2026-11-14')
FROM _ufes2019 u
CROSS JOIN LATERAL jsonb_array_elements_text(u.study_topics)
 WITH ORDINALITY topic(v,n)
ON CONFLICT (id) DO NOTHING;

INSERT INTO facodi.learning_outcomes
 (id,learning_object_id,competency_id,statement,position,metadata)
SELECT md5('facodi:ufes:83:2019:outcome:'||u.code||':'||topic.n)::uuid,
 u.object_id,
 md5('facodi:ufes:83:2019:competency:'||u.code||':'||topic.n)::uuid,
 CASE topic.n WHEN 1 THEN 'Reconhecer e explicar: '||topic.v||'.'
 WHEN 2 THEN 'Relacionar conceitos e exemplos de '||topic.v||'.'
 ELSE 'Explorar atividades e reflexão crítica sobre '||topic.v||'.' END,
 topic.n,
 jsonb_build_object('source','facodi.curricular_units.metadata.study_topics',
 'official_learning_outcome',false,'teacher_validated',false,'editorial_proposal',true,
 'institution','UFES','course_code','UFES-LETRAS-ING-83-2019',
 'subject_code',u.code,'topic',topic.v,'version','2026-11-14')
FROM _ufes2019 u
CROSS JOIN LATERAL jsonb_array_elements_text(u.study_topics)
 WITH ORDINALITY topic(v,n)
ON CONFLICT (id) DO NOTHING;

INSERT INTO facodi.keywords
 (id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:ufes:83:2019:keyword:'||u.code||':'||topic.n)::uuid,
 u.object_id,topic.v,lower(btrim(topic.v)),
 'pt',0.85,'facodi_editorial_study_topic',
 jsonb_build_object('origin','PPC 2019 subject classification, FACODI editorial themes',
 'unit_code',u.code,'official_keyword',false)
FROM _ufes2019 u
CROSS JOIN LATERAL jsonb_array_elements_text(u.study_topics)
 WITH ORDINALITY topic(v,n)
ON CONFLICT (learning_object_id,normalized_keyword,language) DO NOTHING;

INSERT INTO facodi.keywords
 (id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:ufes:83:2019:keyword:official-title:'||u.code)::uuid,
 u.object_id,u.title,lower(btrim(u.title)),'pt',1,
 'ufes_ppc2019_official_title',
 jsonb_build_object('unit_code',u.code,'source_type','UFES official curriculum subject title')
FROM _ufes2019 u
ON CONFLICT (learning_object_id,normalized_keyword,language) DO NOTHING;

INSERT INTO facodi.tags(id,slug,label,language,metadata)
SELECT md5('facodi:ufes:83:2019:tag:'||u.code)::uuid,
 'ufes-ingles-'||lower(u.code),
 u.title,'pt',
 jsonb_build_object('institution','UFES','subject_code',u.code,'course','UFES-LETRAS-ING-83-2019')
FROM _ufes2019 u
ON CONFLICT(slug) DO NOTHING;

INSERT INTO facodi.tags(id,slug,label,language,metadata)
VALUES(
 md5('facodi:ufes:83:2019:tag:course')::uuid,'curso-ufes-letras-ingles',
 'Letras Inglês — UFES','pt',jsonb_build_object('institution','UFES','course','UFES-LETRAS-ING-83-2019')
)
ON CONFLICT(slug) DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT u.object_id,t.id
FROM _ufes2019 u JOIN facodi.tags t ON t.slug='ufes-ingles-'||lower(u.code)
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT u.object_id,t.id
FROM _ufes2019 u JOIN facodi.tags t ON t.slug='curso-ufes-letras-ingles'
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT md5('facodi:ufes:83:2019:course-object')::uuid,t.id
FROM facodi.tags t WHERE t.slug='curso-ufes-letras-ingles'
ON CONFLICT DO NOTHING;

UPDATE facodi.learning_objects lo SET
 keywords=ARRAY(SELECT DISTINCT x FROM unnest(
  ARRAY[u.title]||ARRAY(SELECT jsonb_array_elements_text(u.study_topics))) AS x
  ORDER BY x),
 tags=ARRAY(SELECT DISTINCT x FROM unnest(
  lo.tags||ARRAY['Letras Inglês','UFES',u.grp]) x ORDER BY x),
 metadata=lo.metadata||jsonb_build_object('study_goals_count',3,
   'study_topics_authored_by','FACODI','study_guides_are_official',false)
FROM _ufes2019 u WHERE lo.id=u.object_id;

-- 75 draft internal learning pathways; not content-generation jobs,
-- teacher validation, or formal evaluation.
INSERT INTO facodi.generated_structures(
 id,root_object_id,structure_type,status,prompt,result,generated_by)
SELECT md5('facodi:ufes:83:2019:blueprint:'||u.code)::uuid,
 u.object_id,'module','draft',
 jsonb_build_object('editorial_kind','uc_study_path','source','UFES PPC 2019 codes + FACODI original topics',
 'official_syllabus_reproduced',false,'ai_model_executed',false,
 'teacher_review_required',true,'course','UFES-LETRAS-ING-83-2019'),
 jsonb_build_object('title',u.title,'unit_code',u.code,'curricular_group',u.grp,
 'steps',(SELECT jsonb_agg(jsonb_build_object(
 'position',topic.n,'study_topic',topic.v,
 'activity',CASE topic.n WHEN 1 THEN 'Conceitos e vocabulário'
 WHEN 2 THEN 'Análise de exemplos e textos'
 ELSE 'Aplicações e reflexão pedagógica' END,
 'teacher_reviewed',false) ORDER BY topic.n)
 FROM jsonb_array_elements_text(u.study_topics) WITH ORDINALITY topic(v,n)),
 'official_programme_url','https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf',
 'note','Sugestão editorial; consultar o PPC 2019 para ementa e bibliografia oficiais.'),
 'facodi_deterministic_editorial_blueprint'
FROM _ufes2019 u
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.generated_structures(
 id,root_object_id,structure_type,status,prompt,result,generated_by)
SELECT md5('facodi:ufes:83:2019:course-blueprint')::uuid,
 md5('facodi:ufes:83:2019:course-object')::uuid,
 'curriculum_mapping','draft',
 jsonb_build_object('editorial_kind','course_map','version','2019','ai_model_executed',false,
 'teacher_review_required',true,'official_ppc_2019',true),
 jsonb_build_object(
 'course_code','UFES-LETRAS-ING-83-2019',
 'official_total_hours',3210,
 'compulsory_hours',1890,
 'supervised_internship_hours',400,
 'required_elective_hours',720,
 'complementary_hours',200,
 'elective_choice_groups',(SELECT metadata->'elective_groups' FROM facodi.courses
 WHERE code='UFES-LETRAS-ING-83-2019'),
 'units',(SELECT jsonb_agg(jsonb_build_object('code',u.code,
 'title',u.title,'period',cu.metadata->'official_semester_period',
 'hours',cu.metadata->'official_hours','group',u.grp,'is_optional',u.grp LIKE 'opt_%')
 ORDER BY u.position)
 FROM _ufes2019 u JOIN facodi.curricular_units cu ON cu.id=u.unit_id),
 'warning','A soma de todas as optativas disponíveis não constitui um percurso de integralização.'),
 'facodi_deterministic_editorial_blueprint'
ON CONFLICT(id) DO NOTHING;

UPDATE facodi.courses
SET description_html='<h2>Licenciatura em Letras Inglês (PPC 2019)</h2><p>Curso presencial da UFES, campus Goiabeiras, Vitória, destinado à formação de professores de língua inglesa e literaturas para a Educação Básica e a investigação da linguagem.</p><h3>Organização curricular</h3><ul><li>1.890 horas em disciplinas obrigatórias, incluindo 405 horas de práxis curricular.</li><li>720 horas de optativas escolhidas entre quatro blocos do PPC.</li><li>400 horas de estágio curricular supervisionado.</li><li>200 horas de atividades acadêmico-científico-culturais.</li></ul><p>Total do PPC 2019: 3.210 horas, com duração de oito a doze semestres. A lista da FACODI apresenta as 45 alternativas de optativas, mas o estudante seleciona apenas as horas necessárias em cada bloco. Os códigos de créditos da UFES não são ECTS.</p><p>As orientações e objetivos de estudo da FACODI são complementares e não substituem as ementas oficiais, disponíveis no documento original da universidade.</p>'
WHERE code='UFES-LETRAS-ING-83-2019'
  AND (description_html IS NULL OR description_html='');

DO $validate$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_outcomes
 WHERE metadata->>'course_code'='UFES-LETRAS-ING-83-2019')<>225
 OR (SELECT count(*) FROM facodi.competencies
 WHERE metadata->>'course_code'='UFES-LETRAS-ING-83-2019')<>225
 THEN RAISE EXCEPTION 'Each of 75 UCs must have 3 editorial outcomes and competencies'; END IF;
 IF (SELECT count(*) FROM facodi.generated_structures
 WHERE root_object_id IN (SELECT object_id FROM _ufes2019)
 AND generated_by='facodi_deterministic_editorial_blueprint')<>75
 THEN RAISE EXCEPTION 'Expected 75 private UC draft study paths'; END IF;
END $validate$;
