-- Adds 146 previously unlinked, on-topic resources from the historical
-- Tube public video catalogue. All references are external YouTube links;
-- no Odoo integration, no downloaded media, no synthetic AI run.
CREATE TEMP TABLE _facodi_extra_2026 ON COMMIT DROP AS
SELECT v.id public_video_id,v.youtube_id,v.title,v.description,v.channel_name,
       v.language,v.duration_seconds,v.thumbnail_url,
       chosen.target_code,u.id unit_id,u.learning_object_id unit_object_id,u.course_id
FROM public.videos v
CROSS JOIN LATERAL (SELECT CASE
 WHEN v.channel_name='Educacional THM' AND v.title NOT ILIKE 'Conclusão do Curso%' AND v.title NOT ILIKE 'Linha de Chegada%' THEN '19411018'
 WHEN v.channel_name='Professor Douglas Maioli' AND v.title NOT ILIKE 'O Problema que só%' THEN '19411018'
 WHEN v.channel_name='Matemateca - Ester Velasquez' THEN '19411008'
 WHEN v.channel_name='Apoena Stack - Iury Rosal' THEN '19411013'
 WHEN v.channel_name='Prof. MURAKAMI - MATEMÁTICA RAPIDOLA' THEN
   CASE WHEN v.title ILIKE '%LAGRANGE%' THEN '19411008' ELSE '19411018' END
 WHEN v.channel_name='Real Python' THEN '19411000'
 WHEN v.channel_name='Otávio Miranda' THEN CASE
   WHEN v.title ILIKE '%Ambiente Python%' OR v.title ILIKE '%Chaves SSH%' THEN '19411001'
   WHEN v.title ILIKE '%Classes em TypeScript%' OR v.title ILIKE '%Generic Types%' THEN '19411006'
   WHEN v.title ILIKE '%Padrões de Projeto%' THEN '19411016' END
 WHEN v.channel_name='Eduardo Mendes' THEN CASE
   WHEN v.title ILIKE '%pyproject%' OR v.title ILIKE '%Poetry%' THEN '19411001'
   WHEN v.title ILIKE '%Flet%' THEN '19411019'
   WHEN v.title ILIKE '%FastUI%' THEN '19411021'
   WHEN v.title ILIKE '%Pandas%' THEN '19411020'
   WHEN v.title ILIKE '%Concorrência estruturada%' THEN '19411000' END
 WHEN v.channel_name='freeCodeCamp.org' THEN CASE
   WHEN v.title ILIKE '%Scikit-Learn%' THEN '19411013'
   WHEN v.title ILIKE '%Rails%' OR v.title ILIKE '%Supabase%' THEN '19411021'
   WHEN v.title ILIKE '%Python%' THEN '19411000' END
 WHEN v.channel_name='Airoflare' THEN '19411029'
 WHEN v.channel_name='Fabio Akita' THEN CASE
   WHEN v.title ILIKE '%12 Fatores%' THEN '19411016'
   WHEN v.title ILIKE '%Ruby on Rails%' OR v.title ILIKE '%Mais Rápida%' THEN '19411021' END
 WHEN v.channel_name='Fireship' THEN CASE
   WHEN v.title ILIKE '%Cloud Build%' THEN '19411001'
   WHEN v.title ILIKE '%operating system concept%' THEN '19411009' END
 WHEN v.channel_name='Supabase' THEN '19411029'
 WHEN v.channel_name='Tecnologia e Classe (TeClas)' AND v.title ILIKE '%COPYFAIL%' THEN '19411049'
 END target_code) chosen
JOIN facodi.curricular_units u ON u.code=chosen.target_code
JOIN facodi.courses c ON c.id=u.course_id
WHERE c.code IN ('LESTI','LDCOM') AND u.status='active' AND u.published
AND c.status='active' AND c.published
AND v.youtube_id ~ '^[A-Za-z0-9_-]{11}$'
AND NOT EXISTS(SELECT 1 FROM facodi.youtube_videos y WHERE y.youtube_video_id=v.youtube_id);

DO $$ BEGIN
 IF (SELECT count(*) FROM _facodi_extra_2026)<>146 THEN
 RAISE EXCEPTION 'The 146 verified historical extra video candidates have changed';END IF;
 IF (SELECT count(distinct public_video_id) FROM _facodi_extra_2026)<>146 THEN
 RAISE EXCEPTION 'Duplicate source videos detected'; END IF;
END $$;

INSERT INTO facodi.learning_objects
 (id,object_type,title,slug,description,objectives,keywords,tags,language,
  status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:video:'||s.public_video_id::text)::uuid,
       'video',s.title,'facodi-video-'||s.youtube_id,
       concat('Aula complementar disponibilizada no canal ',
         coalesce(nullif(s.channel_name,''),'YouTube'),'. Tema indicado: ',s.title,
         '. Selecionada por correspondência de título e canal com a disciplina. Consulte o original no YouTube.'),
       '[]'::jsonb,'{}'::text[],
       ARRAY['video','recurso-externo','youtube','apoio-ao-estudo'],
       coalesce(nullif(s.language,''),'und'),'active',true,'tube',
       'https://www.youtube.com/watch?v='||s.youtube_id,
       s.public_video_id::text,
       jsonb_build_object('import_source','public.videos',
         'tube_video_id',s.public_video_id,'youtube_video_id',s.youtube_id,
         'channel_name',s.channel_name,'duration_seconds',s.duration_seconds,
         'thumbnail_url',s.thumbnail_url,'curated_unit_code',s.target_code,
         'curation_batch','facodi_historic_library_2026_11_14',
         'publication_type','external_youtube_link',
         'review_scope','title_and_channel_only',
         'full_video_reviewed',false,'content_license_verified',false,
         'curation_status','published_as_supplementary_resource')
FROM _facodi_extra_2026 s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.youtube_videos
 (id,learning_object_id,youtube_video_id,canonical_url,title,description,
  channel_title,duration_seconds,thumbnails,tags,language,metadata,status)
SELECT md5('facodi:youtube-video:'||s.public_video_id::text)::uuid,
       md5('facodi:video:'||s.public_video_id::text)::uuid,
       s.youtube_id,'https://www.youtube.com/watch?v='||s.youtube_id,
       s.title,nullif(btrim(left(s.description,3000)),''),
       s.channel_name,s.duration_seconds,
       CASE WHEN nullif(s.thumbnail_url,'') IS NOT NULL THEN
         jsonb_build_object('default',jsonb_build_object('url',s.thumbnail_url))
         ELSE '{}'::jsonb END,
       '{}'::text[],s.language,
       jsonb_build_object('import_source','public.videos',
         'source_video_id',s.public_video_id,
         'review_scope','title_and_channel_only',
         'full_video_reviewed',false,
         'content_license_verified',false,
         'curation_batch','facodi_historic_library_2026_11_14'),
       'published'
FROM _facodi_extra_2026 s
ON CONFLICT(youtube_video_id) DO NOTHING;

INSERT INTO facodi.unit_videos
 (id,curricular_unit_id,video_id,position,metadata)
SELECT md5('facodi:extra-unit-video:'||s.public_video_id::text||':'||s.unit_id::text)::uuid,
       s.unit_id,s.public_video_id,
       20000+row_number() OVER (PARTITION BY s.unit_id ORDER BY s.title,s.youtube_id)::int,
       jsonb_build_object(
        'source','public.videos_historical_library',
        'review_status','approved',
        'curated_unit_code',s.target_code,
        'curation_batch','facodi_historic_library_2026_11_14',
        'review_scope','title_and_channel_only',
        'full_video_reviewed',false,
        'publication_type','external_youtube_link')
FROM _facodi_extra_2026 s
ON CONFLICT(curricular_unit_id,video_id) DO NOTHING;

INSERT INTO facodi.learning_object_relations
 (id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:extra-video-relation:'||s.public_video_id::text||':'||s.unit_id::text)::uuid,
       s.unit_object_id,
       md5('facodi:video:'||s.public_video_id::text)::uuid,
       'contains',
       20000+row_number() OVER (PARTITION BY s.unit_id ORDER BY s.title,s.youtube_id)::int,
       'metadata_based_educational_curation',
       jsonb_build_object('review_status','approved',
         'target_unit_code',s.target_code,'youtube_id',s.youtube_id,
         'origin','public.videos_historical_library',
         'curation_batch','facodi_historic_library_2026_11_14',
         'review_scope','title_and_channel_only',
         'full_video_reviewed',false)
FROM _facodi_extra_2026 s
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.video_classifications
 (id,video_id,course_id,curricular_unit_id,confidence,confidence_level,
  status,needs_review,justification,evidence,metadata)
SELECT md5('facodi:extra-video-classification:'||s.public_video_id::text||':'||s.unit_id::text)::uuid,
       md5('facodi:youtube-video:'||s.public_video_id::text)::uuid,
       s.course_id,s.unit_id,0.85,'title_based','approved',false,
       'Pertinência avaliada com base no título e no canal do vídeo. Aula completa não auditada.',
       jsonb_build_array(jsonb_build_object('youtube_id',s.youtube_id,
         'unit_code',s.target_code,'channel',s.channel_name)),
       jsonb_build_object('source','public.videos_historical_library',
         'curation_batch','facodi_historic_library_2026_11_14',
         'review_scope','title_and_channel_only',
         'full_video_reviewed',false,'ai_model_used',false)
FROM _facodi_extra_2026 s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources
 (id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:source:youtube:'||s.public_video_id::text)::uuid,
       md5('facodi:video:'||s.public_video_id::text)::uuid,
       'youtube',s.youtube_id,
       'https://www.youtube.com/watch?v='||s.youtube_id,
       s.title,
       jsonb_build_object('source_table','public.videos',
         'video_id',s.public_video_id,
         'curation_batch','facodi_historic_library_2026_11_14',
         'review_scope','title_and_channel_only')
FROM _facodi_extra_2026 s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.legacy_object_links
 (id,learning_object_id,legacy_schema,legacy_table,legacy_id,metadata)
SELECT md5('facodi:lineage:video:'||s.public_video_id::text)::uuid,
       md5('facodi:video:'||s.public_video_id::text)::uuid,
       'public','videos',s.public_video_id::text,
       jsonb_build_object('youtube_id',s.youtube_id,
         'curation_batch','facodi_historic_library_2026_11_14')
FROM _facodi_extra_2026 s
ON CONFLICT DO NOTHING;

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects WHERE object_type='video'
 AND published AND status='active')<>519 THEN
 RAISE EXCEPTION 'Expected 519 published video references; rollback';END IF;
END $$;