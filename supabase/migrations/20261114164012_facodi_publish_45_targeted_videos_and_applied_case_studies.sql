-- 45 editorially selected external lessons and clearly-labelled vendor case studies.
-- Every ID exists in public.videos; no course/video UUIDs are invented.
CREATE TEMP TABLE _facodi_optional_videos ON COMMIT DROP AS
WITH decisions(youtube_id,unit_code,vendor_case_study) AS (VALUES
('Pu3tyDPf0pg','19411050',true),
('jsS5FyfEv3o','19411050',true),
('gWOy7S6lz8U','19411049',false),
('mwP4sdp7gW0','19411022',false),
('InKNIvky2KE','19411001',false),
('WSW1urIXsfA','19411029',false),
('p_r-zSz8PAA','19411029',false),
('A7lGxqCuFN4','19411000',false),
('sKyvsdEv6rk','19411013',false),
('EcbgbKtOELY','14541025',false),
('gKM6b2EnW1k','14541025',false),
('Ala6PHlYjmw','19411001',false),
('UIcCwuYzxcE','19411014',false),
('Q8NUW3CZRvw','19411049',false),
('K5Ux_m0ccuo','19411001',false),
('gBuTIrEG87s','19411009',false),
('xrYDlx8evR0','19411021',false),
('7IaAAqRy7U4','19411021',false),
('jDY1_7fz3BM','19411000',false),
('hhy6EDDjy-o','19411029',false),
('tB_HcKjW8fQ','19411021',false),
('CJOzgEC__7U','19411021',false),
('vivSXNiUkYs','14541194',false),
('KqSfLLXcxtU','14541181',false),
('I2wqSXcTKIQ','19411021',true),
('SIMlBFy-Erk','19411021',true),
('uBmVnipuECk','19411021',true),
('KlHtzXSlz5w','19411021',true),
('BbafuaHdjDs','19411021',true),
('hnpkTjDOx_o','19411021',true),
('NyxAXxEYkfA','19411015',true),
('QijVl0VJ2Ik','19411021',true),
('dQtIKmNdVgA','19411029',true),
('DI8wHiZlRgQ','19411016',true),
('aMDwueq9_sY','19411001',true),
('AYNgg-KycQc','19411001',true),
('VMgFWtZpYCw','19411010',true),
('GewHZ9JKQHQ','19411010',true),
('T-Cjbx3Ie3g','19411010',true),
('uzwSxfGEK8Q','19411010',true),
('PV2nsCeWVCs','19411010',true),
('63oKGbVtJZY','19411050',true),
('Xn9_LuE9Hio','19411010',true),
('bVbR3tqTHpQ','19411010',true),
('HFo5C43aA1c','19411010',true)
)
SELECT v.id video_id,v.youtube_id,v.title,v.description,v.channel_name,
       v.language,v.duration_seconds,v.thumbnail_url,
       u.id unit_id,u.course_id,u.learning_object_id unit_object_id,
       c.code course_code,u.code unit_code,u.title unit_title,
       d.vendor_case_study
FROM decisions d
JOIN public.videos v ON v.youtube_id=d.youtube_id
JOIN facodi.curricular_units u ON u.code=d.unit_code
JOIN facodi.courses c ON c.id=u.course_id
WHERE u.status='active' AND u.published AND c.status='active' AND c.published
 AND c.code IN ('LESTI','LDCOM')
 AND v.youtube_id ~ '^[A-Za-z0-9_-]{11}$'
 AND NOT EXISTS(SELECT 1 FROM facodi.youtube_videos y WHERE y.youtube_video_id=v.youtube_id);

DO $guard$ BEGIN
 IF (SELECT count(*) FROM _facodi_optional_videos)<>45 THEN
  RAISE EXCEPTION 'Expected exactly 45 independently inspected YouTube IDs, the source changed';
 END IF;
 IF (SELECT count(distinct video_id) FROM _facodi_optional_videos)<>45 THEN
  RAISE EXCEPTION 'Duplicate source video';
 END IF;
END $guard$;

INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,objectives,keywords,tags,language,
 status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:video:'||s.video_id::text)::uuid,
 'video',s.title,'facodi-video-'||s.youtube_id,
 CASE WHEN s.vendor_case_study THEN
  concat('Estudo de caso complementar com software de um fornecedor externo, apresentado por ',
   coalesce(nullif(s.channel_name,''),'um criador no YouTube'),'. Tema do vídeo: ',
   s.title,'. A FACODI não recomenda uma marca nem substitui os conteúdos oficiais da UC.')
 ELSE
  concat('Recurso audiovisual complementar do canal ',
   coalesce(nullif(s.channel_name,''),'YouTube'),'. Tema indicado no vídeo: ',
   s.title,'. Selecionado pela pertinência do título e canal; veja a fonte original.')
 END,
 '[]'::jsonb,'{}'::text[],
 ARRAY['video','recurso-externo','youtube','apoio-ao-estudo',s.unit_title,s.course_code]::text[]
 ||CASE WHEN s.vendor_case_study THEN ARRAY['estudo-de-caso-empresarial']::text[] ELSE '{}'::text[] END,
 coalesce(nullif(s.language,''),'und'),'active',true,'tube',
 'https://www.youtube.com/watch?v='||s.youtube_id,s.video_id::text,
 jsonb_build_object('import_source','public.videos','youtube_video_id',s.youtube_id,
  'source_video_id',s.video_id,'channel_name',s.channel_name,
  'duration_seconds',s.duration_seconds,'thumbnail_url',s.thumbnail_url,
  'curated_unit_references',jsonb_build_array(jsonb_build_object(
    'code',s.unit_code,'course',s.course_code,'title',s.unit_title)),
  'curation_batch','facodi_additional_45_subject_and_vendor_cases',
  'review_scope','title_and_channel_only','full_video_reviewed',false,
  'vendor_case_study',s.vendor_case_study,'content_license_verified',false,
  'curation_status','published_as_supplementary_resource')
FROM _facodi_optional_videos s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.youtube_videos(
 id,learning_object_id,youtube_video_id,canonical_url,title,description,
 channel_title,duration_seconds,thumbnails,tags,language,metadata,status)
SELECT md5('facodi:youtube-video:'||s.video_id::text)::uuid,
 md5('facodi:video:'||s.video_id::text)::uuid,
 s.youtube_id,'https://www.youtube.com/watch?v='||s.youtube_id,
 s.title,nullif(btrim(left(s.description,2500)),''),
 s.channel_name,s.duration_seconds,
 CASE WHEN nullif(s.thumbnail_url,'') IS NOT NULL THEN
  jsonb_build_object('default',jsonb_build_object('url',s.thumbnail_url))
  ELSE '{}'::jsonb END,
 '{}'::text[],coalesce(nullif(s.language,''),'und'),
 jsonb_build_object('import_source','public.videos',
  'curation_batch','facodi_additional_45_subject_and_vendor_cases',
  'review_scope','title_and_channel_only','full_video_reviewed',false,
  'vendor_case_study',s.vendor_case_study,'content_license_verified',false),
 'published'
FROM _facodi_optional_videos s
ON CONFLICT(youtube_video_id) DO NOTHING;

INSERT INTO facodi.unit_videos(
 id,curricular_unit_id,video_id,position,metadata)
SELECT md5('facodi:optional-video:'||s.video_id||':'||s.unit_id)::uuid,
 s.unit_id,s.video_id,
 30000+row_number() OVER(PARTITION BY s.unit_id ORDER BY s.title,s.youtube_id)::int,
 jsonb_build_object('review_status','approved','source','historic_catalogue_title_review',
 'unit_code',s.unit_code,'vendor_case_study',s.vendor_case_study,
 'curation_batch','facodi_additional_45_subject_and_vendor_cases',
 'review_scope','title_and_channel_only','full_video_reviewed',false)
FROM _facodi_optional_videos s
ON CONFLICT(curricular_unit_id,video_id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:optional-relation:'||s.video_id||':'||s.unit_id)::uuid,
 s.unit_object_id,md5('facodi:video:'||s.video_id)::uuid,
 'contains',
 30000+row_number() OVER(PARTITION BY s.unit_id ORDER BY s.title,s.youtube_id)::int,
 'metadata_based_educational_curation',
 jsonb_build_object('review_status','approved',
 'curation_batch','facodi_additional_45_subject_and_vendor_cases',
 'vendor_case_study',s.vendor_case_study,
 'review_scope','title_and_channel_only','full_video_reviewed',false,
 'source_youtube_id',s.youtube_id,'target_uc_code',s.unit_code)
FROM _facodi_optional_videos s
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.video_classifications(
 id,video_id,course_id,curricular_unit_id,confidence,confidence_level,
 status,needs_review,justification,evidence,metadata)
SELECT md5('facodi:optional-video-classification:'||s.video_id||':'||s.unit_id)::uuid,
 md5('facodi:youtube-video:'||s.video_id)::uuid,s.course_id,s.unit_id,
 0,'not_model_scored','approved',false,
 CASE WHEN s.vendor_case_study THEN
  'Estudo de caso específico de fornecedor, seleccionado por tópico declarado no título/canal; não é currículo oficial.'
 ELSE
  'Seleção de recurso complementar por título e canal; conteúdo integral não revisto.'
 END,
 jsonb_build_array(jsonb_build_object('youtube_id',s.youtube_id,
  'target_uc_code',s.unit_code,'source_channel',s.channel_name)),
 jsonb_build_object('review_scope','title_and_channel_only',
 'curation_batch','facodi_additional_45_subject_and_vendor_cases',
 'vendor_case_study',s.vendor_case_study,'ai_model_used',false,
 'full_video_reviewed',false,'confidence_is_model_prediction',false)
FROM _facodi_optional_videos s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:source:youtube:'||s.video_id)::uuid,
 md5('facodi:video:'||s.video_id)::uuid,'youtube',
 s.youtube_id,'https://www.youtube.com/watch?v='||s.youtube_id,s.title,
 jsonb_build_object('origin','public.videos','source_video_id',s.video_id,
 'curation_batch','facodi_additional_45_subject_and_vendor_cases')
FROM _facodi_optional_videos s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.legacy_object_links(
 id,learning_object_id,legacy_schema,legacy_table,legacy_id,metadata)
SELECT md5('facodi:lineage:video:'||s.video_id)::uuid,
 md5('facodi:video:'||s.video_id)::uuid,
 'public','videos',s.video_id::text,
 jsonb_build_object('youtube_id',s.youtube_id,
 'curation_batch','facodi_additional_45_subject_and_vendor_cases')
FROM _facodi_optional_videos s
ON CONFLICT DO NOTHING;

INSERT INTO facodi.keywords(
 id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:keyword:video-source-title:'||s.video_id)::uuid,
 md5('facodi:video:'||s.video_id)::uuid,s.title,
 lower(regexp_replace(btrim(s.title),'\s+',' ','g')),
 'und',0.9,'original_youtube_video_title',
 jsonb_build_object('origin','public.videos',
 'curation_batch','facodi_additional_45_subject_and_vendor_cases')
FROM _facodi_optional_videos s
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT md5('facodi:video:'||s.video_id)::uuid,tag.id
FROM _facodi_optional_videos s
JOIN facodi.tags tag ON tag.slug IN('uc-'||s.unit_code,'curso-'||lower(s.course_code))
ON CONFLICT DO NOTHING;

DO $final$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects WHERE object_type='video'
  AND published AND status='active') <> 564 THEN
  RAISE EXCEPTION 'Unexpected public videos after batch; abort';
 END IF;
END $final$;