
-- Enriquecimento FACODI independente de Odoo. Referências audiovisuais não
-- indicam vínculo institucional à UFES nem licença para republicar vídeos.
CREATE TEMP TABLE _ufes_cc ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset($cc2026$[{"id":"3yLXNzDUH58","title":"What is Linguistics?: Crash Course Linguistics #1","number":1,"codes":["LET13917","LET13927","LET13937"],"track":"linguistics"},{"id":"93sK4jTGrss","title":"Morphology: Crash Course Linguistics #2","number":2,"codes":["LET13915","LET13918","LET13917"],"track":"linguistics"},{"id":"B1r1grQiLdk","title":"Syntax – Morphosyntax: Crash Course Linguistics #3","number":3,"codes":["LET13915","LET13918","LET13917"],"track":"linguistics"},{"id":"n1zpnN-6pZQ","title":"Syntax – Trees: Crash Course Linguistics #4","number":4,"codes":["LET13915","LET13917"],"track":"linguistics"},{"id":"6geQjY8b7sA","title":"Semantics: Crash Course Linguistics #5","number":5,"codes":["LET05151","LET13915","LET13917"],"track":"linguistics"},{"id":"MPwpk-YgvjQ","title":"Pragmatics: Crash Course Linguistics #6","number":6,"codes":["LET13921","LET13953","LET13947"],"track":"linguistics"},{"id":"of4XzrbkknM","title":"Sociolinguistics: Crash Course Linguistics #7","number":7,"codes":["LET05110","LET13935","LET13955"],"track":"linguistics"},{"id":"vyea8Ph9BOM","title":"Phonetics – Consonants: Crash Course Linguistics #8","number":8,"codes":["LET05805","LET13915"],"track":"linguistics"},{"id":"qPTL5x0QW-Y","title":"Phonetics – Vowels: Crash Course Linguistics #9","number":9,"codes":["LET05805","LET13915"],"track":"linguistics"},{"id":"imH7hdOgxrU","title":"Phonology: Crash Course Linguistics #10","number":10,"codes":["LET05805","LET13915"],"track":"linguistics"},{"id":"A5uNFKEn4_A","title":"Psycholinguistics: Crash Course Linguistics #11","number":11,"codes":["LET13927","PSI00764","LET13953"],"track":"linguistics"},{"id":"Ccsf0yX7ECg","title":"Language Acquisition: Crash Course Linguistics #12","number":12,"codes":["LET13927","LET13919","LET13954"],"track":"linguistics"},{"id":"dNkMC92kFLA","title":"Language Change and Historical Linguistics: Crash Course Linguistics #13","number":13,"codes":["LET13922","LET09456","LET13937"],"track":"linguistics"},{"id":"Nxyo83cQjhI","title":"World Languages: Crash Course Linguistics #14","number":14,"codes":["LET13917","LET13955","LET13947"],"track":"linguistics"},{"id":"3npuPXvA_g8","title":"Computational Linguistics: Crash Course Linguistics #15","number":15,"codes":["LET13950","LET13927","LET13949"],"track":"linguistics"},{"id":"-sUUWyo4RZQ","title":"Writing Systems: Crash Course Linguistics #16","number":16,"codes":["LET13920","LET13949","LET13917"],"track":"linguistics"},{"id":"MSYw502dJNY","title":"How and Why We Read: Crash Course Literature #1","number":1,"codes":["LET13923","LET13968","LET13970"],"track":"literature"},{"id":"I4kz-C7GryY","title":"Of Pentameter & Bear Baiting – Romeo & Juliet Part 1: Crash Course Literature #2","number":2,"codes":["LET13925","LET13964","LET13962"],"track":"literature"},{"id":"9J4hoAatGRQ","title":"Love or Lust? Romeo & Juliet Part 2: Crash Course Literature #3","number":3,"codes":["LET13925","LET13964","LET13930"],"track":"literature"},{"id":"xw9Au9OoN88","title":"Like Pale Gold – The Great Gatsby, Part 1: Crash Course Literature #4","number":4,"codes":["LET13928","LET13965","LET13967"],"track":"literature"},{"id":"cn0WZ8-0Z1Y","title":"Was Gatsby Great? The Great Gatsby Part 2: Crash Course Literature #5","number":5,"codes":["LET13928","LET13965","LET13967"],"track":"literature"},{"id":"R66eQLLOins","title":"Language, Voice, and Holden Caulfield – The Catcher in the Rye, Part 1: Crash Course Literature #6","number":6,"codes":["LET13928","LET13968","LET13965"],"track":"literature"},{"id":"R4WwhOdk_Eg","title":"Before I Got My Eye Put Out – The Poetry of Emily Dickinson: Crash Course Literature #8","number":8,"codes":["LET13925","LET13962","LET13967"],"track":"literature"},{"id":"My14mZa-eq8","title":"Ghosts, Murder, and More Murder – Hamlet, Part 1: Crash Course Literature #203","number":203,"codes":["LET13925","LET13964","LET13962"],"track":"literature"},{"id":"nDCohlKUufs","title":"Ophelia, Gertrude, and Regicide – Hamlet, Part 2: Crash Course Literature #204","number":204,"codes":["LET13925","LET13964","LET13930"],"track":"literature"},{"id":"SyyrwoCec1k","title":"Don’t Reanimate Corpses! Frankenstein, Part 1: Crash Course Literature #205","number":205,"codes":["LET13925","LET13962","LET13967"],"track":"literature"},{"id":"hRDjmyEvmBI","title":"Frankenstein, Part 2: Crash Course Literature #206","number":206,"codes":["LET13925","LET13962","LET13967"],"track":"literature"},{"id":"Z8tqY8fX0Ec","title":"Reader, it’s Jane Eyre: Crash Course Literature #207","number":207,"codes":["LET13925","LET13962","LET13967"],"track":"literature"},{"id":"w1Kw94qjdQA","title":"If One Finger Brought Oil – Things Fall Apart, Part 1: Crash Course Literature #208","number":208,"codes":["LET13928","LET13959","LET13960"],"track":"literature"},{"id":"oyvDYZ6hJNA","title":"Things Fall Apart, Part 2: Crash Course Literature #209","number":209,"codes":["LET13928","LET13959","LET13960"],"track":"literature"},{"id":"6lQyPgaakY4","title":"Slavery, Ghosts, and Beloved: Crash Course Literature #214","number":214,"codes":["LET13928","LET13959","LET13960"],"track":"literature"},{"id":"ir0URpI9nKQ","title":"Langston Hughes & the Harlem Renaissance: Crash Course Literature #215","number":215,"codes":["LET13928","LET13960","LET13955"],"track":"literature"},{"id":"iJn0ZPd6mYo","title":"The Poetry of Sylvia Plath: Crash Course Literature #216","number":216,"codes":["LET13928","LET13968","LET13966"],"track":"literature"},{"id":"4kF0U8kIMp4","title":"Their Eyes Were Watching God: Crash Course Literature #301","number":301,"codes":["LET13928","LET13959","LET13960"],"track":"literature"},{"id":"bDpW1sHrBaU","title":"Shakespeare’s Sonnets: Crash Course Literature #304","number":304,"codes":["LET13925","LET13964","LET13962"],"track":"literature"},{"id":"hvfs4jIYHrI","title":"Invisible Man: Crash Course Literature #308","number":308,"codes":["LET13928","LET13960","LET13963"],"track":"literature"},{"id":"eAHYT5gIPZg","title":"Sula: Crash Course Literature #309","number":309,"codes":["LET13928","LET13960","LET13959"],"track":"literature"},{"id":"H9ipRaLa4Jw","title":"1984 by George Orwell, Part 1: Crash Course Literature #401","number":401,"codes":["LET13928","LET13966","LET13921"],"track":"literature"},{"id":"JBYqV2sK918","title":"George Orwell’s 1984, Part 2: Crash Course Literature #402","number":402,"codes":["LET13928","LET13966","LET13921"],"track":"literature"},{"id":"PubyDwbNqYA","title":"The Handmaid’s Tale, Part 1: Crash Course Literature #403","number":403,"codes":["LET13928","LET13960","LET13968"],"track":"literature"},{"id":"zj05QxebnC4","title":"The Handmaid’s Tale, Part 2: Crash Course Literature #404","number":404,"codes":["LET13928","LET13960","LET13968"],"track":"literature"},{"id":"6iVGuMyKFgA","title":"The Parable of the Sower: Crash Course Literature #406","number":406,"codes":["LET13928","LET13960","LET13959"],"track":"literature"},{"id":"rtepIKeNHPU","title":"The Yellow Wallpaper: Crash Course Literature #407","number":407,"codes":["LET13928","LET13960","LET13962"],"track":"literature"},{"id":"mtHilmUa69M","title":"To the Lighthouse: Crash Course Literature #408","number":408,"codes":["LET13928","LET13966","LET13968"],"track":"literature"},{"id":"VPYOs0EGgJk","title":"Free Will, Witches, Murder, and Macbeth, Part 1: Crash Course Literature #409","number":409,"codes":["LET13925","LET13964","LET13962"],"track":"literature"},{"id":"4zdkun4xzOs","title":"Gender, Guilt, and Fate – Macbeth, Part 2: Crash Course Literature #410","number":410,"codes":["LET13925","LET13964","LET13930"],"track":"literature"},{"id":"5xTh44G6RYs","title":"Pride and Prejudice, Part 1: Crash Course Literature #411","number":411,"codes":["LET13925","LET13967","LET13965"],"track":"literature"},{"id":"dhgEpr87Yac","title":"Liberals, Conservatives, and Pride and Prejudice, Part 2: Crash Course Literature #412","number":412,"codes":["LET13925","LET13967","LET13968"],"track":"literature"}]$cc2026$::jsonb)
AS r(id text,title text,number int,codes jsonb,track text);
DO $check$ BEGIN
 IF (SELECT count(*) FROM _ufes_cc)<>48 OR (SELECT count(DISTINCT id) FROM _ufes_cc)<>48 OR
 (SELECT count(*) FROM _ufes_cc WHERE track='linguistics')<>16 OR
 (SELECT count(*) FROM _ufes_cc WHERE track='literature')<>32
 THEN RAISE EXCEPTION 'Invalid producer-sourced episode inventory'; END IF;
 IF EXISTS(SELECT 1 FROM _ufes_cc v WHERE v.id !~ '^[A-Za-z0-9_-]{11}$' OR v.title='' OR
 jsonb_typeof(v.codes)<>'array' OR jsonb_array_length(v.codes)<1)
 THEN RAISE EXCEPTION 'Invalid video metadata'; END IF;
 IF EXISTS(
 SELECT 1 FROM _ufes_cc v
 CROSS JOIN LATERAL jsonb_array_elements_text(v.codes) code
 LEFT JOIN facodi.curricular_units u ON u.code=code
 AND u.course_id=md5('facodi:ufes:83:2019:course')::uuid AND u.published AND u.status='active'
 WHERE u.id IS NULL)
 THEN RAISE EXCEPTION 'Video relationship references nonexistent course unit'; END IF;
 IF EXISTS(SELECT 1 FROM _ufes_cc v
 JOIN facodi.youtube_videos y ON y.youtube_video_id=v.id
 WHERE y.learning_object_id IS NULL)
 THEN RAISE EXCEPTION 'Existing YouTube entry without learning object; manual reconciliation required'; END IF;
END $check$;

-- Create only objects without a prior YouTube entry (avoid duplicate canonical videos).
INSERT INTO facodi.learning_objects
(id,object_type,title,slug,description,language,status,published,source_type,source_url,source_id,tags,metadata)
SELECT md5('facodi:ufes83:crashcourse:video:'||v.id)::uuid,'video',v.title,
 'ufes83-crashcourse-'||v.id,
 concat('Vídeo educativo externo da série Crash Course ',
 CASE WHEN v.track='linguistics' THEN 'Linguistics' ELSE 'Literature' END,
 '. Seleção temática FACODI pelo título e contexto do produtor; consulte a gravação original no YouTube.'),
 'en','active',true,'youtube','https://www.youtube.com/watch?v='||v.id,v.id,
 ARRAY['UFES','Letras Inglês','vídeo educativo','CrashCourse',v.track],
 jsonb_build_object('publisher','CrashCourse','channel_name','CrashCourse',
 'youtube_video_id',v.id,'source_series',v.track,
 'source_series_episode',v.number,
 'verified_producer_page','https://thecrashcourse.com/topic/'||v.track||'/',
 'verified_on','2026-11-15','verification_scope','producer_episode_title_and_embedded_youtube_id',
 'content_fully_reviewed',false,'official_ufes_material',false,
 'third_party_reupload',false,'license_verified',false,
 'topic_link_is_editorial',true,
 'curation_batch','facodi_ufes83_crashcourse_20261115')
FROM _ufes_cc v
WHERE NOT EXISTS(SELECT 1 FROM facodi.youtube_videos y WHERE y.youtube_video_id=v.id)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.youtube_videos
(id,learning_object_id,youtube_video_id,canonical_url,title,channel_title,language,metadata,status)
SELECT md5('facodi:ufes83:crashcourse:youtube:'||v.id)::uuid,
 md5('facodi:ufes83:crashcourse:video:'||v.id)::uuid,
 v.id,'https://www.youtube.com/watch?v='||v.id,v.title,'CrashCourse','en',
 jsonb_build_object('source','official_crashcourse_episode_page',
 'original_episode_index','https://thecrashcourse.com/topic/'||v.track||'/',
 'confirmed_embed_id',true,'verified_on','2026-11-15',
 'full_episode_reviewed',false,'publication_type','original_external_link',
 'curation_batch','facodi_ufes83_crashcourse_20261115'),'published'
FROM _ufes_cc v
WHERE NOT EXISTS(SELECT 1 FROM facodi.youtube_videos y WHERE y.youtube_video_id=v.id)
ON CONFLICT(youtube_video_id) DO NOTHING;

-- Two FACODI-curated thematic collections, NOT original creator playlists.
INSERT INTO facodi.learning_objects
(id,object_type,title,slug,description,language,status,published,source_type,source_url,source_id,tags,metadata)
SELECT md5('facodi:ufes83:crashcourse:collection:'||v.track)::uuid,
 'collection',
 CASE WHEN v.track='linguistics' THEN 'Linguistics — sequência de vídeos Crash Course'
 ELSE 'Literature — percurso de leitura e análise Crash Course' END,
 'ufes83-crashcourse-'||v.track,
 CASE WHEN v.track='linguistics' THEN 'Sequência FACODI com 16 episódios de introdução à linguística, organizados por temas do currículo da UFES.'
 ELSE 'Sequência FACODI com 32 episódios de análise literária de obras de língua inglesa e seus contextos.' END,
 'en','active',true,'external',
 'https://thecrashcourse.com/topic/'||v.track||'/',
 'ufes83-crashcourse-'||v.track,
 ARRAY['UFES','Letras Inglês','sequência','CrashCourse',v.track],
 jsonb_build_object('created_by','FACODI','selection_basis','official_producer_episode_titles',
 'publisher','CrashCourse','source_index','https://thecrashcourse.com/topic/'||v.track||'/',
 'type','facodi_editorial_collection_not_creator_playlist','publisher_endorsement',false,
 'academic_endorsement',false,'full_video_review',false,'license_verified',false,
 'curation_batch','facodi_ufes83_crashcourse_20261115')
FROM (SELECT DISTINCT track FROM _ufes_cc) v
ON CONFLICT(id) DO NOTHING;

-- Collection membership: all videos in the producer's published series order.
INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes83:crashcourse:collection-link:'||v.track||':'||v.id)::uuid,
 md5('facodi:ufes83:crashcourse:collection:'||v.track)::uuid,
 y.learning_object_id,'contains',v.number,'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','producer_episode_index',
 'publisher','CrashCourse','original_episode_number',v.number,
 'full_video_reviewed',false,'curation_batch','facodi_ufes83_crashcourse_20261115')
FROM _ufes_cc v JOIN facodi.youtube_videos y ON y.youtube_video_id=v.id
JOIN facodi.learning_objects lo ON lo.id=y.learning_object_id
 WHERE lo.object_type='video' AND lo.published AND lo.status IN('active','published')
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Connect the two FACODI playlists to the published UFES course landing page.
INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes83:crashcourse:course-collection:'||v.track)::uuid,
 md5('facodi:ufes:83:2019:course-object')::uuid,
 md5('facodi:ufes83:crashcourse:collection:'||v.track)::uuid,
 'contains',CASE WHEN v.track='linguistics' THEN 91000 ELSE 91001 END,
 'structured_catalog_import',
 jsonb_build_object('review_scope','producer_series_index','publisher','CrashCourse',
 'curation_batch','facodi_ufes83_crashcourse_20261115',
 'official_ufes_curriculum_component',false)
FROM(SELECT DISTINCT track FROM _ufes_cc) v
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Every association is independently reviewed by its title/topic mapping.
INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes83:crashcourse:uc-video:'||u.code||':'||v.id)::uuid,
 u.learning_object_id,y.learning_object_id,'contains',
 60000+CASE WHEN v.track='linguistics' THEN v.number ELSE 1000+v.number END,
 'ufes_verified_producer_video_curation',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
 'original_episode_title',v.title,'verified_publisher','CrashCourse',
 'publisher_series',v.track,'official_embed_id_verified',true,
 'full_video_reviewed',false,'topic_relationship','manually_curated_by_title_and_series',
 'academic_endorsement',false,'original_source_link','https://www.youtube.com/watch?v='||v.id,
 'curation_batch','facodi_ufes83_crashcourse_20261115',
 'unit_code',u.code)
FROM _ufes_cc v
CROSS JOIN LATERAL jsonb_array_elements_text(v.codes) target(unit_code)
JOIN facodi.curricular_units u ON u.code=target.unit_code
 AND u.course_id=md5('facodi:ufes:83:2019:course')::uuid
JOIN facodi.youtube_videos y ON y.youtube_video_id=v.id
JOIN facodi.learning_objects lo ON lo.id=y.learning_object_id AND lo.published AND lo.status IN('active','published')
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Provenance: source of each video reference (with official producer directory).
INSERT INTO facodi.external_sources
(id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:ufes83:crashcourse:source:'||v.id)::uuid,
 y.learning_object_id,'youtube',v.id,
 'https://www.youtube.com/watch?v='||v.id,v.title,
 jsonb_build_object('producer','CrashCourse',
 'verified_index_url','https://thecrashcourse.com/topic/'||v.track||'/',
 'episode_number',v.number,'embed_verified',true,'verified_at','2026-11-15',
 'copyright_clearance_verified',false,
 'official_ufes_material',false)
FROM _ufes_cc v JOIN facodi.youtube_videos y ON y.youtube_video_id=v.id
ON CONFLICT(id) DO NOTHING;

DO $validate$ BEGIN
 IF (SELECT count(*) FROM facodi.youtube_videos y
 JOIN _ufes_cc v ON v.id=y.youtube_video_id) <>48
 THEN RAISE EXCEPTION 'All 48 linked YouTube references must exist'; END IF;
 IF (SELECT count(*) FROM facodi.learning_object_relations r WHERE
 r.metadata->>'curation_batch'='facodi_ufes83_crashcourse_20261115'
 AND r.created_by_mechanism='ufes_verified_producer_video_curation') <> 140
 THEN RAISE EXCEPTION 'Expected 140 subject-video relations'; END IF;
 IF (SELECT count(*) FROM facodi.learning_object_relations r
 WHERE r.metadata->>'curation_batch'='facodi_ufes83_crashcourse_20261115'
 AND r.created_by_mechanism='structured_catalog_import' AND r.position < 10000)<>48
 THEN RAISE EXCEPTION 'Producer-series collection membership incomplete'; END IF;
END $validate$;
