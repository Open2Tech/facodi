
CREATE TEMP TABLE _british_council ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset($bcvid$[{"id":"PALSWcoF0D8","title":"An introduction to lesson planning (Part 1/6)","track":"lesson_planning","ordinal":1,"codes":["LET13919","LET13943","LET13944","LCE13933","LET15836"]},{"id":"I9oNy5Ehuv8","title":"How to create considered lesson plans (Part 2/6)","track":"lesson_planning","ordinal":2,"codes":["LET13919","LET13943","LET13944","LCE13933","LET13957"]},{"id":"NkhK5O3EseQ","title":"How to use lesson planning to provide teaching rationale (Part 3/6)","track":"lesson_planning","ordinal":3,"codes":["LET13919","LET13943","LET13944","LCE13933","LET13957"]},{"id":"XcygGHROynM","title":"How to create structured yet flexible lesson plans (Part 4/6)","track":"lesson_planning","ordinal":4,"codes":["LET13919","LET13943","LET13944","LCE13933","LCE13934"]},{"id":"WWA-YluaYKo","title":"How to ensure lesson plans are relevant to learners (Part 5/6)","track":"lesson_planning","ordinal":5,"codes":["LET13919","LET13943","LET13944","LET13954","LET13955"]},{"id":"y8C2L9HVDOg","title":"Lesson planning for teachers' professional development (Part 6/6)","track":"lesson_planning","ordinal":6,"codes":["LET13919","LET13944","LCE13934","LET13931","LET13954"]},{"id":"KMPhtVUBM4A","title":"Teaching tips: Using songs in the classroom","track":"language_teaching","ordinal":1,"codes":["LET13919","LET13943","LET13949","LET13951","LET13942"]},{"id":"k42Hp6rl2rs","title":"Teaching tips: Using chants, rhymes and rounds","track":"language_teaching","ordinal":2,"codes":["LET13919","LET13943","LET13949","LET13942","LET13945"]},{"id":"d_ecZqJ5AgY","title":"Michael Swan: Am I teaching enough grammar? (Part 1/6)","track":"language_teaching","ordinal":3,"codes":["LET13915","LET13918","LET13919","LET13943"]},{"id":"GXeC9GH9Ft0","title":"Michael Swan: What you can say without grammar (Part 2/6)","track":"language_teaching","ordinal":4,"codes":["LET13915","LET13918","LET13919","LET13944"]},{"id":"KLR0rkdVulQ","title":"Michael Swan: How to include grammar in all teaching (Part 6/6)","track":"language_teaching","ordinal":5,"codes":["LET13915","LET13918","LET13919","LET13944"]},{"id":"bz7-rLkYp9g","title":"How to teach English pronunciation","track":"language_teaching","ordinal":6,"codes":["LET13916","LET13919","LET13944","LET05805","LET13945"]},{"id":"tuHQ6DaZnoQ","title":"How to prioritise pronunciation work in a multilingual class (English as a lingua franca part 2/6)","track":"language_teaching","ordinal":7,"codes":["LET13916","LET13919","LET13955","LET05805","LET13944"]},{"id":"rCSsMRKhl2c","title":"Practical pronunciation: Proprioception activities for diphthongs and consonants","track":"language_teaching","ordinal":8,"codes":["LET05805","LET13945","LET13946","LET13951","LET13944"]},{"id":"bRrGDbNCGTQ","title":"How to find authentic materials (English as a lingua franca part 4/6)","track":"language_teaching","ordinal":9,"codes":["LET13943","LET13949","LET13947","LET13956","LET13944"]},{"id":"hOpf5XkXLKY","title":"Why is differentiation in learning important? (Understanding Differentiation Part 1/6)","track":"inclusive_practice","ordinal":1,"codes":["LCE13705","LET13919","TEP13131","LET13943","LET13944"]},{"id":"iGtSwx_t9Uk","title":"How differentiation creates positive learning experiences (Understanding Differentiation Part 2/6)","track":"inclusive_practice","ordinal":2,"codes":["LCE13705","LET13919","TEP13131","LET13943","LET13944"]},{"id":"5UIjsSBwsLc","title":"How can group work support differentiation (Understanding Differentiation Part 3/6)","track":"inclusive_practice","ordinal":3,"codes":["LCE13705","LET13919","TEP13131","LET13944","LCE13933"]},{"id":"pUU_0eGGP6c","title":"Differentiation when teaching the whole class (Understanding Differentiation Part 4/6)","track":"inclusive_practice","ordinal":4,"codes":["LCE13705","LET13919","TEP13131","LET13944","LCE13933"]},{"id":"-XsL2rkNojM","title":"Differentiation for reading and listening activities (Understanding Differentiation Part 5/6)","track":"inclusive_practice","ordinal":5,"codes":["LET13919","LET13920","LET13949","TEP13131","LET13943"]},{"id":"lOOE1dS73l8","title":"Differentiation for speaking and writing activities (Understanding Differentiation Part 6/6)","track":"inclusive_practice","ordinal":6,"codes":["LET13919","LET13926","LET13939","TEP13131","LET13943"]},{"id":"ewvThEyCKZ0","title":"What makes an inclusive teacher (Part 2/6)","track":"inclusive_practice","ordinal":7,"codes":["LCE13705","TEP13131","LET13919","LET13944","LET13942"]},{"id":"Kd7F_LGcwzE","title":"How to use inclusive teaching methods (Part 5/6)","track":"inclusive_practice","ordinal":8,"codes":["LCE13705","TEP13131","LET13919","LET13944","LET13942"]}]$bcvid$::jsonb)
AS r(id text,title text,track text,ordinal int,codes jsonb);

DO $check$ BEGIN
 IF (SELECT count(*) FROM _british_council)<>23
 OR (SELECT count(distinct id) FROM _british_council)<>23
 OR EXISTS(SELECT 1 FROM _british_council WHERE id !~ '^[A-Za-z0-9_-]{11}$'
    OR title='' OR jsonb_array_length(codes)<2)
 THEN RAISE EXCEPTION 'Invalid British Council educational video references';END IF;
 IF EXISTS(SELECT 1 FROM _british_council a
 CROSS JOIN LATERAL jsonb_array_elements_text(a.codes) uc(code)
 LEFT JOIN facodi.curricular_units u ON u.code=uc.code
 AND u.course_id=md5('facodi:ufes:83:2019:course')::uuid
 AND u.published AND u.status='active'
 WHERE u.id IS NULL)
 THEN RAISE EXCEPTION 'One or more educational video unit mappings are incorrect';END IF;
 IF EXISTS(SELECT 1 FROM _british_council a JOIN facodi.youtube_videos y ON y.youtube_video_id=a.id
 WHERE y.learning_object_id IS NULL)
 THEN RAISE EXCEPTION 'Existing unlinked Youtube record requires reconciliation';END IF;
END $check$;

INSERT INTO facodi.learning_objects
(id,object_type,title,slug,description,language,status,published,source_type,
source_url,source_id,tags,metadata)
SELECT md5('facodi:ufes83:britishcouncil:video:'||v.id)::uuid,
'video',v.title,'ufes83-bc-teaching-'||v.id,
'Vídeo de formação e prática docente publicado pelo British Council TeachingEnglish. Seleção complementar da FACODI com base no título e na identificação do canal. O conteúdo não foi reproduzido nem homologado pela UFES.',
'en','active',true,'youtube','https://www.youtube.com/watch?v='||v.id,v.id,
ARRAY['UFES','Letras Inglês','British Council','TeachingEnglish','docência',v.track],
jsonb_build_object(
'channel_name','British Council | TeachingEnglish',
'verified_channel_id','UCpGyg_swrp18MdGhFkZIPpA',
'youtube_video_id',v.id,'publisher','British Council',
'original_video_title',v.title,'original_canonical_url','https://www.youtube.com/watch?v='||v.id,
'curation_group',v.track,'source_video_verified_on','2026-11-15',
'verification_scope','youtube_search_video_id_title_and_channel',
'video_content_fully_reviewed',false,'copyright_license_verified',false,
'is_official_ufes_content',false,'uploaded_media_copied',false,
'curation_batch','facodi_ufes83_britishcouncil_20261115')
FROM _british_council v
WHERE NOT EXISTS(SELECT 1 FROM facodi.youtube_videos y WHERE y.youtube_video_id=v.id)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.youtube_videos
(id,learning_object_id,youtube_video_id,canonical_url,title,
channel_id,channel_title,language,metadata,status)
SELECT md5('facodi:ufes83:britishcouncil:youtube:'||v.id)::uuid,
md5('facodi:ufes83:britishcouncil:video:'||v.id)::uuid,
v.id,'https://www.youtube.com/watch?v='||v.id,v.title,
'UCpGyg_swrp18MdGhFkZIPpA','British Council | TeachingEnglish','en',
jsonb_build_object('source','verified_youtube_search',
'verified_on','2026-11-15',
'canonical_channel_id','UCpGyg_swrp18MdGhFkZIPpA',
'curation_group',v.track,'video_fully_reviewed',false,
'publisher_is_not_ufes',true,
'curation_batch','facodi_ufes83_britishcouncil_20261115'),'published'
FROM _british_council v WHERE NOT EXISTS(
SELECT 1 FROM facodi.youtube_videos y WHERE y.youtube_video_id=v.id)
ON CONFLICT(youtube_video_id) DO NOTHING;

INSERT INTO facodi.learning_objects
(id,object_type,title,slug,description,language,status,published,source_type,source_url,source_id,tags,metadata)
SELECT md5('facodi:ufes83:britishcouncil:collection:'||r.track)::uuid,
'collection',
CASE r.track WHEN 'lesson_planning' THEN 'Planeamento de aulas — British Council'
WHEN 'language_teaching' THEN 'Ensino de línguas: gramática, pronúncia e materiais'
ELSE 'Diferenciação e inclusão no ensino de inglês' END,
'ufes83-bc-'||r.track,
'Sequência editorial FACODI de vídeos educativos externos para formação docente. Não é uma playlist oficialmente publicada ou aprovada pela UFES.',
'pt','active',true,'external',
'https://www.youtube.com/@BritishCouncilTeachingEnglish',
'ufes83-bc-'||r.track,ARRAY['UFES','British Council','TeachingEnglish','formação de professores'],
jsonb_build_object('curated_by','FACODI','editorial_collection_not_official_youtube_playlist',true,
'creator','British Council | TeachingEnglish','publisher_endorsement',false,
'lesson_review_complete',false,'curation_group',r.track,
'curation_batch','facodi_ufes83_britishcouncil_20261115')
FROM (SELECT DISTINCT track FROM _british_council) r
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes83:britishcouncil:collection-link:'||v.track||':'||v.id)::uuid,
md5('facodi:ufes83:britishcouncil:collection:'||v.track)::uuid,
y.learning_object_id,'contains',v.ordinal,'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','channel_and_title_only',
'verified_channel','British Council | TeachingEnglish','topic_group',v.track,
'full_video_reviewed',false,'curation_batch','facodi_ufes83_britishcouncil_20261115')
FROM _british_council v
JOIN facodi.youtube_videos y ON y.youtube_video_id=v.id
JOIN facodi.learning_objects lo ON lo.id=y.learning_object_id AND lo.published AND lo.status='active'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes83:britishcouncil:course-link:'||r.track)::uuid,
md5('facodi:ufes:83:2019:course-object')::uuid,
md5('facodi:ufes83:britishcouncil:collection:'||r.track)::uuid,
'contains',
CASE r.track WHEN 'lesson_planning' THEN 92000 WHEN 'language_teaching' THEN 92001 ELSE 92002 END,
'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','external_source_index',
'not_university_course_programme',true,'curation_batch','facodi_ufes83_britishcouncil_20261115')
FROM (SELECT DISTINCT track FROM _british_council) r
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes83:britishcouncil:uc-video:'||u.code||':'||v.id)::uuid,
u.learning_object_id,y.learning_object_id,
'contains',70000+CASE v.track WHEN 'lesson_planning' THEN v.ordinal
 WHEN 'language_teaching' THEN 100+v.ordinal ELSE 200+v.ordinal END,
'ufes_verified_english_teaching_video_curation',
jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
'verified_channel','British Council | TeachingEnglish',
'verified_channel_id','UCpGyg_swrp18MdGhFkZIPpA',
'curation_group',v.track,'full_video_reviewed',false,
'official_ufes_material',false,
'mapping_basis','topic_of_publisher_video_title',
'curation_batch','facodi_ufes83_britishcouncil_20261115',
'unit_code',u.code)
FROM _british_council v
CROSS JOIN LATERAL jsonb_array_elements_text(v.codes) mapping(code)
JOIN facodi.curricular_units u ON u.code=mapping.code AND u.course_id=md5('facodi:ufes:83:2019:course')::uuid
JOIN facodi.youtube_videos y ON y.youtube_video_id=v.id
JOIN facodi.learning_objects lo ON lo.id=y.learning_object_id AND lo.published AND lo.status='active'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.external_sources
(id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:ufes83:britishcouncil:source:'||v.id)::uuid,
y.learning_object_id,'youtube',v.id,
'https://www.youtube.com/watch?v='||v.id,v.title,
jsonb_build_object('publisher','British Council | TeachingEnglish',
'original_channel_id','UCpGyg_swrp18MdGhFkZIPpA',
'video_title_source','YouTube discovery','verified_on','2026-11-15',
'full_video_reviewed',false,
'curation_batch','facodi_ufes83_britishcouncil_20261115')
FROM _british_council v JOIN facodi.youtube_videos y ON y.youtube_video_id=v.id
ON CONFLICT(id) DO NOTHING;

DO $verify$ BEGIN
IF (SELECT count(*) FROM facodi.youtube_videos y JOIN _british_council v ON y.youtube_video_id=v.id)<>23
THEN RAISE EXCEPTION 'Missing British Council videos'; END IF;
IF (SELECT count(*) FROM facodi.learning_object_relations WHERE
 created_by_mechanism='ufes_verified_english_teaching_video_curation'
 AND metadata->>'curation_batch'='facodi_ufes83_britishcouncil_20261115')<>112
THEN RAISE EXCEPTION 'Missing British Council curricular associations'; END IF;
END $verify$;
