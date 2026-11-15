
-- FACODI: educational video links from UNIVESP's verified YouTube channel.
-- Titles may be localized in YouTube search: do not claim exact source transcript.
CREATE TEMP TABLE _ufes_univesp ON COMMIT DROP AS SELECT *
FROM jsonb_to_recordset($univesp_video$[{"id":"DmiLDormnMA","title":"Fundamentos Históricos, Filosóficos e Sociológicos da Educação — O movimento da Escola Nova","track":"historical_education","number":1,"codes":["EPS13106","CSO03274"]},{"id":"iyUuav7SPaw","title":"Fundamentos Históricos, Filosóficos e Sociológicos da Educação — A educação na Era Vargas","track":"historical_education","number":2,"codes":["EPS13106","EPS13687"]},{"id":"tR-Xq-ZUGvw","title":"Fundamentos Históricos, Filosóficos e Sociológicos da Educação — Conflitos sociais e projetos","track":"historical_education","number":3,"codes":["EPS13106","CSO03274"]},{"id":"hiXa0K_P1rM","title":"Fundamentos Históricos, Filosóficos e Sociológicos da Educação — A constituição da profissão docente","track":"historical_education","number":4,"codes":["EPS13106","CSO03274","EPS13133"]},{"id":"rnlLVi2uS5c","title":"Sociology of Education — The Social Function of School","track":"historical_education","number":5,"codes":["CSO03274","EPS13106","EPS13133"]},{"id":"pNyJcO2ExEw","title":"Políticas Educacionais, Estrutura e Organização da Educação Básica — Processos de formulação","track":"education_policy","number":1,"codes":["EPS13687","EPS13133","TEP13129"]},{"id":"Vv6y3WNo3Jo","title":"Políticas Educacionais, Estrutura e Organização da Educação Básica — Revisão Final","track":"education_policy","number":2,"codes":["EPS13687","EPS13133","TEP13129"]},{"id":"bOpRXVNhQiM","title":"Fundamentos da Organização do Currículo Escolar — A contribuição das teorias críticas","track":"education_policy","number":3,"codes":["TEP13129","LCE13705"]},{"id":"uS7fcCJIcH0","title":"Fundamentals of School Curriculum Organization — Contribution of Critical Theories","track":"education_policy","number":4,"codes":["TEP13129","LCE13705"]},{"id":"BHMAKCPMqP8","title":"Metodologias para a Pesquisa em Educação — Pesquisa em Educação","track":"research_methods","number":1,"codes":["LET13952","LET13931","LET13936"]},{"id":"rls5vAu_DcU","title":"Methods for Knowledge Production — The research project: introduction","track":"research_methods","number":2,"codes":["LET13952","LET13932","LET13936"]},{"id":"8VHW9mbL2LE","title":"Monograph I — Scientific research planning","track":"research_methods","number":3,"codes":["LET13952","LET13932","LET13931"]},{"id":"ghAb-jhee0M","title":"Final Project I — Research Project completed","track":"research_methods","number":4,"codes":["LET13932","LET13931"]},{"id":"dDd5l8LGsqA","title":"Monograph II — Types of research for the preparation of scientific articles","track":"research_methods","number":5,"codes":["LET13952","LET13932","LET13936"]},{"id":"R2Bl3y9XaJw","title":"Final Project II — Finalization of the TCC and Preparation of the Presentation","track":"research_methods","number":6,"codes":["LET13932"]},{"id":"7fpnzYf1_AU","title":"Final Course Work II — Planning activities and executing the TCC","track":"research_methods","number":7,"codes":["LET13932","LET13931"]}]$univesp_video$::jsonb)
AS r(id text,title text,track text,number integer,codes jsonb);
DO $verify$ BEGIN
 IF (SELECT count(*) FROM _ufes_univesp)<>16
 OR (SELECT count(distinct id) FROM _ufes_univesp)<>16
 OR EXISTS(SELECT 1 FROM _ufes_univesp WHERE id !~ '^[A-Za-z0-9_-]{11}$' OR title='')
 THEN RAISE EXCEPTION 'Unexpected video source count or id';END IF;
 IF EXISTS(SELECT 1 FROM _ufes_univesp v CROSS JOIN LATERAL jsonb_array_elements_text(v.codes) c(code)
 LEFT JOIN facodi.curricular_units u ON u.code=c.code AND u.course_id=md5('facodi:ufes:83:2019:course')::uuid AND u.published
 WHERE u.id IS NULL) THEN RAISE EXCEPTION 'Bad UFES subject link';END IF;
 IF EXISTS(SELECT 1 FROM _ufes_univesp v JOIN facodi.youtube_videos y ON v.id=y.youtube_video_id
 WHERE y.learning_object_id IS NULL) THEN RAISE EXCEPTION 'Pre-existing orphan YouTube record';END IF;
END $verify$;

INSERT INTO facodi.learning_objects
(id,object_type,title,slug,description,language,status,published,source_type,source_url,source_id,tags,metadata)
SELECT md5('facodi:ufes83:univesp:video:'||v.id)::uuid,'video',v.title,
 'ufes83-univesp-'||v.id,
 'Aula educativa da UNIVESP sobre educação, currículo ou metodologia de pesquisa. Curadoria FACODI por correspondência temática ao curso Letras Inglês UFES. Não corresponde a aula oficial da UFES nem significa aprovação ou reprodução do conteúdo pela universidade.',
 'pt','active',true,'youtube','https://www.youtube.com/watch?v='||v.id,v.id,
 ARRAY['UFES','Letras Inglês','UNIVESP','educação e pesquisa',v.track],
 jsonb_build_object('publisher','UNIVESP','channel_name','UNIVESP',
 'verified_channel_id','UCBL2tfrwhEhX52Dze_aO3zA',
 'youtube_video_id',v.id,'curation_group',v.track,
 'title_source','YouTube discovery - title may be localized',
 'verification_scope','channel_id_video_id_and_subject_title',
 'verified_on','2026-11-15','full_video_review',false,
 'official_ufes_material',false,'copied_media',false,
 'copyright_clearance_verified',false,
 'curation_batch','facodi_ufes83_univesp_20261115')
FROM _ufes_univesp v
WHERE NOT EXISTS(SELECT 1 FROM facodi.youtube_videos y WHERE y.youtube_video_id=v.id)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.youtube_videos
(id,learning_object_id,youtube_video_id,canonical_url,title,channel_id,channel_title,language,metadata,status)
SELECT md5('facodi:ufes83:univesp:youtube:'||v.id)::uuid,
 md5('facodi:ufes83:univesp:video:'||v.id)::uuid,
 v.id,'https://www.youtube.com/watch?v='||v.id,v.title,
 'UCBL2tfrwhEhX52Dze_aO3zA','UNIVESP','pt',
 jsonb_build_object('source','youtube_video_discovery','source_channel','UNIVESP',
 'title_may_be_localized',true,'content_fully_reviewed',false,
 'university_ufes_endorsement',false,
 'curation_batch','facodi_ufes83_univesp_20261115'),'published'
FROM _ufes_univesp v
WHERE NOT EXISTS(SELECT 1 FROM facodi.youtube_videos y WHERE y.youtube_video_id=v.id)
ON CONFLICT(youtube_video_id) DO NOTHING;

INSERT INTO facodi.learning_objects
(id,object_type,title,slug,description,language,status,published,source_type,source_url,source_id,tags,metadata)
SELECT md5('facodi:ufes83:univesp:collection:'||track)::uuid,
 'collection',
 CASE track WHEN 'historical_education' THEN 'Fundamentos históricos e sociais da educação — UNIVESP'
 WHEN 'education_policy' THEN 'Políticas educacionais e currículo escolar — UNIVESP'
 ELSE 'Metodologia de pesquisa e TCC — UNIVESP' END,
 'ufes83-univesp-'||track,
 'Roteiro FACODI com referências audiovisuais externas da UNIVESP, organizado para apoio ao estudo da licenciatura Letras Inglês. Não é um programa ou playlist oficial da UFES.',
 'pt','active',true,'external','https://www.youtube.com/@univesptv',
 'ufes83-univesp-'||track,ARRAY['UFES','UNIVESP','educação e pesquisa'],
 jsonb_build_object('curated_by','FACODI','original_channel','@univesptv',
 'channel_id','UCBL2tfrwhEhX52Dze_aO3zA','collection_is_not_youtube_playlist',true,
 'full_lessons_not_reviewed',true,'ufes_endorsement',false,
 'curation_batch','facodi_ufes83_univesp_20261115')
FROM (SELECT DISTINCT track FROM _ufes_univesp) x
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes83:univesp:collection-link:'||v.id)::uuid,
 md5('facodi:ufes83:univesp:collection:'||v.track)::uuid,
 y.learning_object_id,'contains',v.number,'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','channel_title_educational_reference',
 'curation_batch','facodi_ufes83_univesp_20261115')
FROM _ufes_univesp v JOIN facodi.youtube_videos y ON y.youtube_video_id=v.id
JOIN facodi.learning_objects lo ON lo.id=y.learning_object_id AND lo.published AND lo.status='active'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes83:univesp:course-collection:'||track)::uuid,
 md5('facodi:ufes:83:2019:course-object')::uuid,
 md5('facodi:ufes83:univesp:collection:'||track)::uuid,
 'contains',CASE track WHEN 'historical_education' THEN 93000 WHEN 'education_policy' THEN 93001 ELSE 93002 END,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','ufes_endorsed',false,
 'curation_batch','facodi_ufes83_univesp_20261115')
FROM (SELECT DISTINCT track FROM _ufes_univesp) x
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes83:univesp:uc-video:'||c.code||':'||v.id)::uuid,
 u.learning_object_id,y.learning_object_id,'contains',80000+v.number,
 'ufes_univesp_verified_educational_video_curation',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
 'source_channel','UNIVESP','source_channel_id','UCBL2tfrwhEhX52Dze_aO3zA',
 'reviewed_full_video',false,'title_may_be_localized',true,
 'mapping_by_subject_title',true,'official_ufes_material',false,
 'curation_batch','facodi_ufes83_univesp_20261115')
FROM _ufes_univesp v
CROSS JOIN LATERAL jsonb_array_elements_text(v.codes) c(code)
JOIN facodi.curricular_units u ON u.code=c.code AND u.course_id=md5('facodi:ufes:83:2019:course')::uuid
JOIN facodi.youtube_videos y ON y.youtube_video_id=v.id
JOIN facodi.learning_objects lo ON lo.id=y.learning_object_id AND lo.published AND lo.status='active'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.external_sources
(id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:ufes83:univesp:source:'||v.id)::uuid,
 y.learning_object_id,'youtube',v.id,'https://www.youtube.com/watch?v='||v.id,v.title,
 jsonb_build_object('publisher','UNIVESP','verified_channel_id','UCBL2tfrwhEhX52Dze_aO3zA',
 'verified_on','2026-11-15','full_video_reviewed',false,
 'curation_batch','facodi_ufes83_univesp_20261115')
FROM _ufes_univesp v JOIN facodi.youtube_videos y ON y.youtube_video_id=v.id
ON CONFLICT(id) DO NOTHING;

DO $count$ BEGIN
 IF (SELECT count(*) FROM facodi.youtube_videos y JOIN _ufes_univesp v ON y.youtube_video_id=v.id)<>16
 OR (SELECT count(*) FROM facodi.learning_object_relations WHERE
 created_by_mechanism='ufes_univesp_verified_educational_video_curation'
 AND metadata->>'curation_batch'='facodi_ufes83_univesp_20261115')<>39
 THEN RAISE EXCEPTION 'UNIVESP content enrichment incomplete'; END IF;
END $count$;
