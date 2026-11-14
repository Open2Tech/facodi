-- Curated migration from 409 historic FACODI unit-video records.
-- Review scope: source title + channel only. No video file downloaded and
-- no claim of full-video/author/license review. Public links go to YouTube.
CREATE TEMP TABLE _fc_source ON COMMIT DROP AS
WITH rules(uc_code,first_pos,last_pos,target_code) AS (VALUES ('19411002',0,3,'19411008'),
('19411002',4,63,'19411002'),
('19411002',64,119,'19411008'),
('19411002',120,120,'19411002'),
('19411002',121,123,'19411008'),
('19411002',124,124,'19411020'),
('19411002',125,154,'19411002'),
('19411002',155,156,'19411018'),
('19411002',157,215,'19411008'),
('19411002',216,238,'19411018'),
('19411002',239,240,NULL),
('19411002',241,243,'19411013'),
('19411008',0,15,'19411008'),
('19411008',16,16,'19411002'),
('19411008',17,24,'19411008'),
('19411008',25,25,'19411002'),
('19411008',26,27,'19411008'),
('19411011',0,0,'19411012'),
('19411011',1,1,'19411020'),
('19411018',0,2,'19411018'),
('19411018',3,3,'19411008'),
('19411012',0,70,'19411012'),
('19411012',71,71,'19411020'),
('19411012',72,72,'19411012'),
('19411012',73,73,'19411017'),
('14541153',0,15,'14541153'),
('14541153',16,16,NULL),
('14541153',17,20,'14541153'),
('14541196',0,21,'14541196'),
('14541196',22,24,NULL),
('14541026',0,1,NULL),
('14541161',0,0,'14541025'),
('19411049',0,0,'19411049'),
('19411049',1,1,NULL))
SELECT uv.id origin_id,uv.video_id, uv.position,orig.id origin_unit_id,
       orig.code origin_code,
       CASE WHEN rules.uc_code IS NOT NULL THEN rules.target_code ELSE orig.code END target_code,
       v.youtube_id,v.title,v.channel_name
FROM facodi.unit_videos uv
JOIN facodi.curricular_units orig ON orig.id=uv.curricular_unit_id
JOIN facodi.courses c ON c.id=orig.course_id
JOIN public.videos v ON v.id=uv.video_id
LEFT JOIN rules ON rules.uc_code=orig.code AND uv.position BETWEEN rules.first_pos AND rules.last_pos
WHERE c.code IN ('LESTI','LDCOM') AND uv.metadata->>'source'='public.playlist_videos'
 AND uv.metadata->>'review_status'='pending_review';

DO $$ BEGIN
 IF (SELECT count(*) FROM _fc_source)<>409 THEN RAISE EXCEPTION 'Curation source changed'; END IF;
 IF (SELECT count(distinct video_id) FROM _fc_source WHERE target_code IS NOT NULL)<>373
 THEN RAISE EXCEPTION 'Accepted video count changed'; END IF;
 IF EXISTS(SELECT 1 FROM _fc_source s WHERE s.target_code IS NOT NULL
    AND NOT EXISTS(SELECT 1 FROM facodi.curricular_units u
      JOIN facodi.courses c ON c.id=u.course_id
      WHERE u.code=s.target_code AND c.code IN ('LESTI','LDCOM')
        AND u.published AND u.status='active'))
 THEN RAISE EXCEPTION 'Inactive destination'; END IF;
END $$;

CREATE TEMP TABLE _fc_relocated ON COMMIT DROP AS
SELECT DISTINCT ON (dest.id,s.video_id)
  s.*,dest.id target_unit_id,dest.learning_object_id target_object_id,
  dest.course_id target_course_id
FROM _fc_source s
JOIN facodi.curricular_units dest ON dest.code=s.target_code
WHERE s.target_code IS NOT NULL AND s.target_code<>s.origin_code
ORDER BY dest.id,s.video_id,s.origin_id;

-- Original assignments that were already academically aligned.
UPDATE facodi.unit_videos uv SET metadata=coalesce(uv.metadata,'{}'::jsonb)
 || jsonb_build_object('review_status','approved',
   'curation_batch','facodi_title_curation_2026_11_14',
   'review_scope','title_and_channel_only',
   'full_video_reviewed',false,
   'publication_type','external_youtube_link')
FROM _fc_source s
WHERE uv.id=s.origin_id AND s.target_code=s.origin_code;

-- Original mismatches stay invisible; their recommended new UC is traceable.
UPDATE facodi.unit_videos uv SET metadata=coalesce(uv.metadata,'{}'::jsonb)
 || jsonb_build_object(
   'review_status',CASE WHEN s.target_code IS NULL THEN 'needs_review'
                      ELSE 'reassigned' END,
   'suggested_unit_code',s.target_code,
   'curation_batch','facodi_title_curation_2026_11_14',
   'review_scope','title_and_channel_only',
   'full_video_reviewed',false)
FROM _fc_source s
WHERE uv.id=s.origin_id AND s.target_code IS DISTINCT FROM s.origin_code;

-- New reviewed associations; duplicates from historic playlists are collapsed.
INSERT INTO facodi.unit_videos(id,curricular_unit_id,video_id,position,metadata)
SELECT md5('facodi:curated-unit-video:'||s.origin_id::text)::uuid,
       s.target_unit_id,s.video_id,
       10000+row_number() OVER (PARTITION BY s.target_unit_id
                               ORDER BY s.position,s.origin_id)::int,
       jsonb_build_object('review_status','approved',
        'source','facodi_historic_curated',
        'original_unit_video_id',s.origin_id,
        'original_uc_code',s.origin_code,'target_uc_code',s.target_code,
        'curation_batch','facodi_title_curation_2026_11_14',
        'review_scope','title_and_channel_only',
        'full_video_reviewed',false,
        'publication_type','external_youtube_link')
FROM _fc_relocated s
ON CONFLICT(curricular_unit_id,video_id) DO UPDATE
 SET metadata=coalesce(facodi.unit_videos.metadata,'{}'::jsonb)||EXCLUDED.metadata;

-- Original classification proposals: approve aligned, preserve mismatches as review.
UPDATE facodi.video_classifications vc SET
 status=CASE WHEN s.target_code=s.origin_code THEN 'approved' ELSE 'needs_review' END,
 needs_review=(s.target_code IS DISTINCT FROM s.origin_code),
 confidence=CASE WHEN s.target_code=s.origin_code THEN 0.85 ELSE 0 END,
 confidence_level=CASE WHEN s.target_code=s.origin_code THEN 'title_based' ELSE 'unassessed' END,
 justification=CASE WHEN s.target_code=s.origin_code
  THEN 'Concordância entre o título/canal e a área da UC. Revisão integral da aula não realizada.'
  ELSE 'Associação da playlist antiga não é adequada ou não foi confirmada; consultar proposta de realocação.' END,
 metadata=coalesce(vc.metadata,'{}'::jsonb)||
  jsonb_build_object('curation_batch','facodi_title_curation_2026_11_14',
   'suggested_unit_code',s.target_code,
   'review_scope','title_and_channel_only',
   'full_video_reviewed',false,'ai_model_used',false)
FROM _fc_source s
WHERE vc.id=md5('facodi:classification:unit-video:'||s.origin_id::text)::uuid;

INSERT INTO facodi.video_classifications
(id,video_id,course_id,curricular_unit_id,confidence,confidence_level,
 status,needs_review,justification,evidence,metadata)
SELECT md5('facodi:curated-classification:'||s.origin_id::text)::uuid,
       y.id,s.target_course_id,s.target_unit_id,0.85,'title_based',
       'approved',false,'Associação da aula à UC por título e canal. Conteúdo integral não auditado.',
       jsonb_build_array(jsonb_build_object('origin_uc',s.origin_code,
        'target_uc',s.target_code,'youtube_id',s.youtube_id,
        'origin_unit_video_id',s.origin_id)),
       jsonb_build_object('source','historic_curated_playlist',
         'review_scope','title_and_channel_only',
         'full_video_reviewed',false,'ai_model_used',false)
FROM _fc_relocated s
JOIN facodi.youtube_videos y ON y.youtube_video_id=s.youtube_id
ON CONFLICT(id) DO NOTHING;

UPDATE facodi.learning_object_relations r
SET metadata=coalesce(r.metadata,'{}'::jsonb)||
 jsonb_build_object('review_status','approved',
  'curation_batch','facodi_title_curation_2026_11_14',
  'review_scope','title_and_channel_only',
  'full_video_reviewed',false)
FROM _fc_source s
WHERE s.target_code=s.origin_code
 AND r.id=md5('facodi:relation:unit-video:'||s.origin_id::text)::uuid;

UPDATE facodi.learning_object_relations r
SET metadata=coalesce(r.metadata,'{}'::jsonb)||
 jsonb_build_object('review_status','pending_review',
  'suggested_unit_code',s.target_code,
  'curation_batch','facodi_title_curation_2026_11_14')
FROM _fc_source s
WHERE s.target_code IS DISTINCT FROM s.origin_code
 AND r.id=md5('facodi:relation:unit-video:'||s.origin_id::text)::uuid;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:curated-relation:'||s.origin_id::text)::uuid,
       s.target_object_id,md5('facodi:video:'||s.video_id::text)::uuid,
       'contains',10000+s.position,'title_based_educational_curation',
       jsonb_build_object('review_status','approved',
        'origin_uc_code',s.origin_code,'target_uc_code',s.target_code,
        'source_link_id',s.origin_id,
        'curation_batch','facodi_title_curation_2026_11_14',
        'review_scope','title_and_channel_only',
        'full_video_reviewed',false)
FROM _fc_relocated s WHERE s.target_object_id IS NOT NULL
ON CONFLICT(parent_object_id,child_object_id,relation_type)
 DO UPDATE SET metadata=coalesce(facodi.learning_object_relations.metadata,'{}'::jsonb)
   ||EXCLUDED.metadata;

-- Publish 373 distinct external-video learning objects, not full video content.
WITH accepted AS (SELECT DISTINCT video_id FROM _fc_source WHERE target_code IS NOT NULL)
UPDATE facodi.learning_objects lo SET status='active',published=true,
 description=concat('Recurso audiovisual do canal ',
  coalesce(nullif(v.channel_name,''),'YouTube'),
  '. Tema do vídeo: ',v.title,
  '. Selecionado como apoio ao estudo pelo título e canal; consulte a aula original no YouTube.'),
 tags=ARRAY['video','recurso-externo','youtube','apoio-ao-estudo']::text[],
 metadata=coalesce(lo.metadata,'{}'::jsonb)||
  jsonb_build_object('curation_status','published_as_supplementary_resource',
   'review_scope','title_and_channel_only',
   'full_video_reviewed',false,
   'content_license_verified',false,
   'publication_type','external_youtube_link')
FROM public.videos v JOIN accepted a ON a.video_id=v.id
WHERE lo.id=md5('facodi:video:'||v.id::text)::uuid
  AND lo.object_type='video' AND v.youtube_id ~ '^[A-Za-z0-9_-]{11}$';

WITH accepted AS (SELECT DISTINCT video_id FROM _fc_source WHERE target_code IS NOT NULL)
UPDATE facodi.youtube_videos y SET status='published',
 metadata=coalesce(y.metadata,'{}'::jsonb)||
  jsonb_build_object('publication_type','external_youtube_link',
   'review_scope','title_and_channel_only',
   'full_video_reviewed',false,
   'content_license_verified',false)
FROM public.videos v JOIN accepted a ON a.video_id=v.id
WHERE y.youtube_video_id=v.youtube_id
  AND v.youtube_id ~ '^[A-Za-z0-9_-]{11}$';

-- Corresponding published UAlg program/unit objects, excluding 5 legacy options.
UPDATE facodi.learning_objects lo SET status='active',published=true,
 tags=ARRAY['curso','facodi','ualg']::text[],
 metadata=coalesce(lo.metadata,'{}'::jsonb)||
  jsonb_build_object('publication_type','official_academic_programme')
FROM facodi.courses c
WHERE c.learning_object_id=lo.id AND c.published AND c.status='active'
 AND c.metadata->>'catalog_review_status'='approved';

UPDATE facodi.learning_objects lo SET status='active',published=true,
 tags=ARRAY['unidade-curricular','facodi','ualg']::text[],
 metadata=coalesce(lo.metadata,'{}'::jsonb)||
  jsonb_build_object('publication_type','official_curricular_unit')
FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
WHERE u.learning_object_id=lo.id AND u.published AND u.status='active'
 AND c.published AND c.status='active'
 AND u.metadata->>'curriculum_review_status'='approved';

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects
  WHERE object_type='video' AND published)<>373 THEN
    RAISE EXCEPTION 'Mismatch after publishing external videos'; END IF;
END $$;