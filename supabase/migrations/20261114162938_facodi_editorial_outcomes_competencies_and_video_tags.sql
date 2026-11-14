-- Enriquecimento editorial documentado FACODI, 2026-11-14.
-- 84 published UCs, their 3 existing study topics, and approved external videos.
-- These are SUGGESTED learning objectives, not the official UAlg syllabus,
-- no teacher accreditation, no AI model run and no synthetic user activity.
CREATE TEMP TABLE _facodi_study_topics ON COMMIT DROP AS
SELECT u.id unit_id,u.code unit_code,u.title unit_title,u.learning_object_id object_id,
       c.code course_code,topic.value topic,(topic.ordinality)::integer topic_order
FROM facodi.curricular_units u
JOIN facodi.courses c ON c.id=u.course_id
CROSS JOIN LATERAL jsonb_array_elements_text(u.metadata->'study_topics')
 WITH ORDINALITY AS topic(value,ordinality)
WHERE u.published AND u.status='active'
 AND c.published AND c.status='active'
 AND u.learning_object_id IS NOT NULL
 AND jsonb_typeof(u.metadata->'study_topics')='array'
 AND c.code IN ('LESTI','LDCOM');

DO $guard$ BEGIN
 IF (SELECT COUNT(*) FROM _facodi_study_topics)<>252 THEN
  RAISE EXCEPTION 'Expected 252 explicit curricular study topics; review data before applying';
 END IF;
 IF EXISTS(SELECT 1 FROM _facodi_study_topics GROUP BY unit_id HAVING COUNT(*)<>3) THEN
  RAISE EXCEPTION 'Each published UC must have exactly three sourced topics';
 END IF;
END $guard$;

-- 252 skill topics attached to their curricular units, clearly not accreditation.
INSERT INTO facodi.competencies
 (id,learning_object_id,code,title,description,level,metadata)
SELECT md5('facodi:editorial-competency:'||s.unit_id||':'||s.topic_order)::uuid,
 s.object_id,concat('FACODI-',s.unit_code,'-',lpad(s.topic_order::text,2,'0')),
 s.topic,
 concat('Tema de estudo recomendado pela FACODI para a unidade curricular ',s.unit_title,
  '; não constitui competência formal acreditada pela instituição.'),
 'introductory',
 jsonb_build_object('source','facodi.curricular_units.metadata.study_topics',
  'course',s.course_code,'unit_code',s.unit_code,'topic_index',s.topic_order,
  'editorial_proposal',true,'official_curriculum_outcome',false,
  'formal_assessment_completed',false,'version','2026-11-14')
FROM _facodi_study_topics s
ON CONFLICT (id) DO NOTHING;

INSERT INTO facodi.learning_outcomes
 (id,learning_object_id,competency_id,statement,position,metadata)
SELECT md5('facodi:editorial-outcome:'||s.unit_id||':'||s.topic_order)::uuid,
 s.object_id,
 md5('facodi:editorial-competency:'||s.unit_id||':'||s.topic_order)::uuid,
 CASE s.topic_order
  WHEN 1 THEN 'Identificar e explicar os conceitos introdutórios de '||s.topic||'.'
  WHEN 2 THEN 'Relacionar os fundamentos de '||s.topic||' com exemplos de estudo.'
  ELSE 'Explorar aplicações e exercícios práticos sobre '||s.topic||'.'
 END,
 s.topic_order,
 jsonb_build_object('source','facodi.curricular_units.metadata.study_topics',
  'course',s.course_code,'unit_code',s.unit_code,'topic',s.topic,
  'editorial_proposal',true,'official_learning_outcome',false,
  'teacher_validated',false,'version','2026-11-14')
FROM _facodi_study_topics s
ON CONFLICT (id) DO NOTHING;

-- Search keywords originate in real course-topic and source-video titles.
INSERT INTO facodi.keywords
 (id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:keyword:editorial-topic:'||s.unit_id||':'||s.topic_order)::uuid,
 s.object_id,s.topic,lower(btrim(s.topic)),'pt',0.85,
 'facodi_editorial_study_topic',
 jsonb_build_object('course',s.course_code,'unit_code',s.unit_code,
  'source','facodi.curricular_units.metadata.study_topics',
  'official_syllabus_keyword',false)
FROM _facodi_study_topics s
ON CONFLICT (learning_object_id,normalized_keyword,language) DO NOTHING;

INSERT INTO facodi.keywords
 (id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:keyword:video-source-title:'||v.id)::uuid,
 lo.id,btrim(v.title),lower(regexp_replace(btrim(v.title),'\s+',' ','g')),
 'und',0.9,'original_youtube_video_title',
 jsonb_build_object('source','public.videos','source_video_id',v.id,
  'title_as_provided_by_source',true)
FROM facodi.learning_objects lo
JOIN public.videos v ON lo.id=md5('facodi:video:'||v.id)::uuid
WHERE lo.object_type='video' AND lo.published AND lo.status='active'
  AND nullif(btrim(v.title),'') IS NOT NULL
ON CONFLICT (learning_object_id,normalized_keyword,language) DO NOTHING;

-- Per-UC taxonomy, linked to all published course units and approved external videos.
INSERT INTO facodi.tags(id,slug,label,language,metadata)
SELECT md5('facodi:tag:unit:'||s.unit_id)::uuid,
 'uc-'||s.unit_code,s.unit_title,'pt',
 jsonb_build_object('source','facodi.curricular_units',
  'course',s.course_code,'unit_code',s.unit_code)
FROM (SELECT DISTINCT ON (unit_id) * FROM _facodi_study_topics ORDER BY unit_id,topic_order) s
ON CONFLICT(slug) DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT DISTINCT s.object_id,tag.id FROM _facodi_study_topics s
JOIN facodi.tags tag ON tag.slug='uc-'||s.unit_code
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT DISTINCT lo.id,tag.id
FROM facodi.unit_videos uv
JOIN facodi.curricular_units u ON u.id=uv.curricular_unit_id
JOIN facodi.tags tag ON tag.slug='uc-'||u.code
JOIN facodi.learning_objects lo ON lo.id=md5('facodi:video:'||uv.video_id)::uuid
WHERE uv.metadata->>'review_status'='approved'
 AND u.published AND u.status='active'
 AND lo.published AND lo.object_type='video'
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT DISTINCT lo.id,tag.id
FROM facodi.unit_videos uv
JOIN facodi.curricular_units u ON u.id=uv.curricular_unit_id
JOIN facodi.courses c ON c.id=u.course_id
JOIN facodi.tags tag ON tag.slug='curso-'||lower(c.code)
JOIN facodi.learning_objects lo ON lo.id=md5('facodi:video:'||uv.video_id)::uuid
WHERE uv.metadata->>'review_status'='approved'
 AND u.published AND u.status='active'
 AND lo.published AND lo.object_type='video'
ON CONFLICT DO NOTHING;

WITH video_units AS (
 SELECT uv.video_id,array_agg(distinct u.title order by u.title) unit_titles,
        array_agg(distinct c.code order by c.code) course_codes,
        jsonb_agg(distinct jsonb_build_object('code',u.code,'title',u.title,
           'course',c.code)) unit_provenance
 FROM facodi.unit_videos uv
 JOIN facodi.curricular_units u ON u.id=uv.curricular_unit_id
 JOIN facodi.courses c ON c.id=u.course_id
 WHERE uv.metadata->>'review_status'='approved' AND u.published
   AND u.status='active' AND c.published AND c.status='active'
 GROUP BY uv.video_id
)
UPDATE facodi.learning_objects lo
SET tags=ARRAY(
 SELECT DISTINCT x FROM unnest(
  lo.tags||vu.unit_titles||vu.course_codes) AS x
 WHERE nullif(btrim(x),'') IS NOT NULL ORDER BY x),
 metadata=coalesce(lo.metadata,'{}'::jsonb) ||
  jsonb_build_object('curated_unit_references',vu.unit_provenance,
   'tag_enrichment_source','approved_facodi.unit_videos')
FROM public.videos v JOIN video_units vu ON vu.video_id=v.id
WHERE lo.id=md5('facodi:video:'||v.id)::uuid
 AND lo.object_type='video' AND lo.published;

-- Read access to the non-official proposals only when the parent object is published.
GRANT SELECT ON facodi.learning_outcomes TO anon,authenticated;
GRANT SELECT ON facodi.competencies TO anon,authenticated;
DROP POLICY IF EXISTS public_read_facodi_editorial_learning_outcomes ON facodi.learning_outcomes;
CREATE POLICY public_read_facodi_editorial_learning_outcomes
 ON facodi.learning_outcomes FOR SELECT TO anon,authenticated
 USING (
   metadata->>'source'='facodi.curricular_units.metadata.study_topics'
   AND metadata->>'official_learning_outcome'='false'
   AND EXISTS(SELECT 1 FROM facodi.learning_objects lo
      WHERE lo.id=learning_object_id AND lo.published=true
        AND lo.status IN ('active','published'))
 );
DROP POLICY IF EXISTS public_read_facodi_editorial_competencies ON facodi.competencies;
CREATE POLICY public_read_facodi_editorial_competencies
 ON facodi.competencies FOR SELECT TO anon,authenticated
 USING (
   metadata->>'source'='facodi.curricular_units.metadata.study_topics'
   AND metadata->>'official_curriculum_outcome'='false'
   AND EXISTS(SELECT 1 FROM facodi.learning_objects lo
      WHERE lo.id=learning_object_id AND lo.published=true
        AND lo.status IN ('active','published'))
 );

DO $final$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_outcomes
   WHERE metadata->>'version'='2026-11-14')<>252 THEN
  RAISE EXCEPTION 'Incomplete proposed learning outcomes';
 END IF;
 IF (SELECT count(*) FROM facodi.competencies
   WHERE metadata->>'version'='2026-11-14')<>252 THEN
  RAISE EXCEPTION 'Incomplete proposed competencies';
 END IF;
END $final$;