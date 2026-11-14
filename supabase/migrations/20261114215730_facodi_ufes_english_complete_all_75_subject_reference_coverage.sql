
-- Last three PPC subjects: tightly matched open university applied-linguistics
-- supplementary reference, not official UFES required bibliography.
DO $check$ BEGIN
 IF EXISTS(SELECT code FROM (VALUES ('LET13927'),('LET13941'),('LET05110')) t(code)
 WHERE NOT EXISTS (SELECT 1 FROM facodi.curricular_units u
 WHERE u.code=t.code AND u.course_id=md5('facodi:ufes:83:2019:course')::uuid AND u.published))
 THEN RAISE EXCEPTION 'UFES curricular code missing'; END IF;
END $check$;
INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,language,status,published,source_type,
 source_url,source_id,tags,metadata)
VALUES(
 md5('facodi:ufes:83:2019:reading:openlearn-applied')::uuid,
 'external_resource','OpenLearn — Língua e Linguística Aplicada no Mundo Real',
 'ufes83-reading-openlearn-applied',
 'Curso aberto de introdução à linguística aplicada e à relação entre linguagem, identidade, sociedade e processos comunicativos. Referência FACODI complementar; não é bibliografia obrigatória aprovada pela UFES.',
 'en','active',true,'external',
 'https://www.open.edu/openlearn/languages/english-language/language-the-real-world/content-section-0',
 'openlearn-applied',ARRAY['Letras Inglês','UFES','linguística aplicada'],
 jsonb_build_object('source_publisher','The Open University',
 'source_verified_on','2026-11-14','reference_only',true,
 'license_verified',false,'official_ufes_bibliography',false,
 'curation_batch','ufes83_ppc2019_applied_linguistics')
)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
VALUES(
 md5('facodi:ufes:83:2019:reading-source:openlearn-applied')::uuid,
 md5('facodi:ufes:83:2019:reading:openlearn-applied')::uuid,
 'website','openlearn-applied',
 'https://www.open.edu/openlearn/languages/english-language/language-the-real-world/content-section-0',
 'OpenLearn — Language in the real world',
 jsonb_build_object('source_verified_on','2026-11-14','external_reference_only',true))
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:ufes:83:2019:reading-link:openlearn-applied:'||u.code)::uuid,
 u.learning_object_id,md5('facodi:ufes:83:2019:reading:openlearn-applied')::uuid,
 'contains',52001,'verified_external_reading_curation',
 jsonb_build_object('review_status','approved','review_scope','external_landing_page',
 'resource_purpose','study_reference','target_unit_code',u.code,
 'ufes_official_recommendation',false,
 'curation_batch','ufes83_ppc2019_applied_linguistics')
FROM facodi.curricular_units u
WHERE u.course_id=md5('facodi:ufes:83:2019:course')::uuid
AND u.code IN ('LET13927','LET13941','LET05110')
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT md5('facodi:ufes:83:2019:reading:openlearn-applied')::uuid,t.id
FROM facodi.tags t WHERE t.slug IN (
 'curso-ufes-letras-ingles','ufes-ingles-let13927',
 'ufes-ingles-let13941','ufes-ingles-let05110')
ON CONFLICT DO NOTHING;

DO $check$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_object_relations
 WHERE metadata->>'curation_batch'='ufes83_ppc2019_applied_linguistics')<>3
 THEN RAISE EXCEPTION 'Exactly three new study-reference relations expected'; END IF;
END $check$;
