
-- Publish only eight individually located public YouTube watch pages from
-- IAG-USP/UNIVESP and the IAG-USP relativity course. No video rehosting,
-- no synthetic exercise, no credential, private data or Odoo integration.
CREATE TEMP TABLE _astro_new_video ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset('[{"youtube_id":"Mr97PrJZCag","title":"Astronomia: Uma visão Geral I — Pgm 1 — Astronomia antes dos telescópios","channel":"UNIVESP","units":["FACODI-GACS18-ASTRO01","FACODI-GACS18-ASTRO02"],"summary":"Introdução às observações e modelos astronómicos antes da invenção do telescópio.","url":"https://www.youtube.com/watch?v=Mr97PrJZCag"},{"youtube_id":"p-Dvp06QZRQ","title":"Astronomia: Uma visão Geral I — Pgm 2 — Telescópios: um histórico, parte 1","channel":"UNIVESP","units":["FACODI-GACS18-ASTRO05"],"summary":"História de instrumentos refratores e refletores e descobertas ligadas a Galileu.","url":"https://www.youtube.com/watch?v=p-Dvp06QZRQ"},{"youtube_id":"jfVRz6NLZWE","title":"Astronomia: Uma visão Geral I — Pgm 5 — Telescópios no espaço","channel":"UNIVESP","units":["FACODI-GACS18-ASTRO05"],"summary":"Telescópios espaciais, espectro eletromagnético e observações fora da atmosfera.","url":"https://www.youtube.com/watch?v=jfVRz6NLZWE"},{"youtube_id":"BFuXZnNG9PI","title":"Astronomia: Uma visão Geral I — Pgm 6 — Espectrógrafos e Detectores","channel":"UNIVESP","units":["FACODI-GACS18-ASTRO05"],"summary":"Introdução aos espectrógrafos e à análise da luz estelar.","url":"https://www.youtube.com/watch?v=BFuXZnNG9PI"},{"youtube_id":"M0VKMNylSIg","title":"Astronomia: Uma visão Geral I — Pgm 22 — Magnitude, cor e distância das estrelas","channel":"UNIVESP","units":["FACODI-GACS18-ASTRO06","FACODI-GACS18-ASTRO07"],"summary":"Magnitudes aparentes e absolutas, cor estelar e paralaxe trigonométrica.","url":"https://www.youtube.com/watch?v=M0VKMNylSIg"},{"youtube_id":"MNcTFh-1WAM","title":"Astronomia: Uma visão Geral I — Pgm 25 — De onde vem a energia das estrelas?","channel":"UNIVESP","units":["FACODI-GACS18-ASTRO06"],"summary":"Reações de fusão estelar, cadeias próton-próton e CNO e triplo alfa.","url":"https://www.youtube.com/watch?v=MNcTFh-1WAM"},{"youtube_id":"CXXH-5Oa1HI","title":"Astronomia: Uma visão geral I — Pgm 35 — Nebulosas: como as estrelas nascem e morrem","channel":"UNIVESP","units":["FACODI-GACS18-ASTRO06"],"summary":"Nebulosas e formação e evolução estelar.","url":"https://www.youtube.com/watch?v=CXXH-5Oa1HI"},{"youtube_id":"x5XxTuFVBbo","title":"Aula 24 — Ondas gravitacionais | Relatividade geral e aplicações astrofísicas (IAG USP, 2020)","channel":"Rodrigo Nemmen","units":["FACODI-GACS18-ASTRO09"],"summary":"Aula universitária avançada sobre ondas gravitacionais, observação e LIGO.","url":"https://www.youtube.com/watch?v=x5XxTuFVBbo"}]'::jsonb) AS r(
youtube_id text,title text,channel text,units jsonb,summary text,url text);
CREATE TEMP TABLE _astro_new_seq ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset('[{"slug":"facodi-astro-sequence-univesp-instrumentos-observacao","title":"Astronomia — história da observação e instrumentos","level":"introductory","domain":"astronomy","videos":["Mr97PrJZCag","p-Dvp06QZRQ","jfVRz6NLZWE","BFuXZnNG9PI"],"units":["FACODI-GACS18-ASTRO01","FACODI-GACS18-ASTRO05"],"topics":["Observação astronómica antes do telescópio","Instrumentos ópticos e história","Telescópios espaciais","Espectrógrafos e deteção da luz"],"notes":"Vídeos do curso público IAG-USP/UNIVESP, não equivalência curricular com a FACODI nem atividades GACS de 2018."},{"slug":"facodi-astro-sequence-univesp-luz-estrelas","title":"Astrofísica — luz, distâncias e energia das estrelas","level":"intermediate","domain":"astronomy","videos":["5cBSgGjLczc","M0VKMNylSIg","MNcTFh-1WAM","CXXH-5Oa1HI"],"units":["FACODI-GACS18-ASTRO05","FACODI-GACS18-ASTRO06"],"topics":["Propriedades da luz","Magnitudes e paralaxe","Fusão e produção de energia","Nascimento e morte de estrelas"],"notes":"Introdução por vídeos já verificados de UNIVESP, não aborda integralmente todas as fases de evolução estelar."},{"slug":"facodi-astro-sequence-ondas-gravitacionais-usp","title":"Ondas gravitacionais — fundamentos físicos e aula universitária","level":"advanced_optional","domain":"astronomy","videos":["DycQqhlB68g","NnwSeQ5otM4","x5XxTuFVBbo"],"units":["FACODI-GACS18-ASTRO09"],"topics":["Noções de onda","Gravitação","Ondas gravitacionais e observação","LIGO e colisões de objetos compactos"],"notes":"Aula final de relatividade geral de nível avançado; não constitui introdução à astrobiologia."}]'::jsonb) AS r(
slug text,title text,level text,domain text,videos jsonb,units jsonb,topics jsonb,notes text);
CREATE TEMP TABLE _astro_seq_lessons ON COMMIT DROP AS
SELECT s.slug, v.value youtube_id,v.ordinality::integer position FROM _astro_new_seq s
 CROSS JOIN LATERAL jsonb_array_elements_text(s.videos) WITH ORDINALITY v(value,ordinality);
CREATE TEMP TABLE _astro_seq_units ON COMMIT DROP AS
SELECT s.slug, u.value unit_code FROM _astro_new_seq s
 CROSS JOIN LATERAL jsonb_array_elements_text(s.units) u(value);
CREATE TEMP TABLE _astro_direct_units ON COMMIT DROP AS
SELECT v.youtube_id,u.value unit_code FROM _astro_new_video v
 CROSS JOIN LATERAL jsonb_array_elements_text(v.units) u(value);

DO $guard$ BEGIN
 IF (SELECT count(*) FROM _astro_new_video)<>8 OR
    (SELECT count(*) FROM _astro_new_seq)<>3 OR
    (SELECT count(*) FROM _astro_seq_lessons)<>11 OR
    EXISTS(SELECT 1 FROM _astro_new_video WHERE youtube_id !~ '^[A-Za-z0-9_-]{11}$'
      OR url<>'https://www.youtube.com/watch?v='||youtube_id) OR
    EXISTS(SELECT 1 FROM _astro_new_video a
      JOIN facodi.youtube_videos y ON y.youtube_video_id=a.youtube_id) OR
    EXISTS(SELECT 1 FROM _astro_new_seq s JOIN facodi.learning_objects lo ON lo.slug=s.slug) OR
    EXISTS(SELECT 1 FROM _astro_direct_units s
      LEFT JOIN facodi.curricular_units u ON u.code=s.unit_code
      LEFT JOIN facodi.courses c ON c.id=u.course_id
      WHERE u.id IS NULL OR NOT u.published OR c.code<>'FACODI-GACS-ASTRO-2018') OR
    EXISTS(SELECT 1 FROM _astro_seq_units s
      LEFT JOIN facodi.curricular_units u ON u.code=s.unit_code
      LEFT JOIN facodi.courses c ON c.id=u.course_id
      WHERE u.id IS NULL OR NOT u.published OR c.code<>'FACODI-GACS-ASTRO-2018')
 THEN RAISE EXCEPTION 'Video-astronomy import: identities, counts, linked UCs or sources have changed'; END IF;
 IF EXISTS(SELECT 1 FROM _astro_seq_lessons s LEFT JOIN facodi.youtube_videos y
    ON y.youtube_video_id=s.youtube_id
    WHERE y.id IS NULL AND NOT EXISTS(
      SELECT 1 FROM _astro_new_video v WHERE v.youtube_id=s.youtube_id))
 THEN RAISE EXCEPTION 'Sequence points to a missing existing or new YouTube resource'; END IF;
END $guard$;

INSERT INTO facodi.learning_objects
 (id,object_type,title,slug,description,objectives,keywords,tags,language,status,
 published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:astro:official-youtube:'||youtube_id)::uuid,
  'video',title,'facodi-astro-usp-video-'||youtube_id,
  summary||' Recurso audiovisual externo apresentado com ligação ao vídeo original. Seleção editorial por título, canal e descrição pública; não foi revisto integralmente nem reconhecido oficialmente pela FACODI.',
  '[]'::jsonb,ARRAY['astronomia','astrofísica','vídeo aula'],
  ARRAY['facodi','astronomia','recurso-externo','youtube','apoio-ao-estudo'],
  'pt-BR','active',true,'youtube',url,
  'youtube:'||youtube_id,
  jsonb_build_object(
   'youtube_video_id',youtube_id,'channel_name',channel,
   'publication_type','external_youtube_link','original_watch_url',url,
   'source_video_fully_reviewed',false,'full_video_reviewed',false,
   'review_scope','public_title_channel_description',
   'watch_page_identity_verified',true,'content_license_verified',false,
   'copyright_rehosting_allowed',false,'teacher_approved',false,
   'official_facodi_course_material',false,
   'curation_batch','facodi_astro_univesp_and_iag_verified_20261115')
FROM _astro_new_video
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.youtube_videos
 (id,learning_object_id,youtube_video_id,canonical_url,title,channel_title,
  thumbnails,tags,language,metadata,status)
SELECT md5('facodi:astro:youtube-record:'||youtube_id)::uuid,
 md5('facodi:astro:official-youtube:'||youtube_id)::uuid,
 youtube_id,url,title,channel,
 jsonb_build_object('default',jsonb_build_object('url',
    'https://i.ytimg.com/vi/'||youtube_id||'/hqdefault.jpg')),
 ARRAY['astronomia','educacao'],'pt-BR',
 jsonb_build_object('channel_title',channel,
   'metadata_source','public_watch_page_search',
   'metadata_verified_from_youtube_og',false,
   'verified_source_identity',true,'playback_verified',false,
   'curation_batch','facodi_astro_univesp_and_iag_verified_20261115'),
 'published' FROM _astro_new_video
ON CONFLICT(youtube_video_id) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro:official-video-unit:'||v.youtube_id||':'||v.unit_code)::uuid,
 u.learning_object_id,md5('facodi:astro:official-youtube:'||v.youtube_id)::uuid,
 'contains',96000+row_number() OVER(PARTITION BY u.id ORDER BY v.youtube_id)::integer,
 'metadata_based_educational_curation',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
    'institutional_source_video',true,'teacher_approved',false,
    'full_video_reviewed',false,'curation_batch','facodi_astro_univesp_and_iag_verified_20261115')
FROM _astro_direct_units v
JOIN facodi.curricular_units u ON u.code=v.unit_code
JOIN facodi.courses c ON c.id=u.course_id AND c.code='FACODI-GACS-ASTRO-2018'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_objects
(id,object_type,title,slug,description,objectives,keywords,tags,language,status,published,
 source_type,source_id,metadata)
SELECT md5('facodi:astro:youtube-path:'||s.slug)::uuid,
'playlist',s.title,s.slug,
 'Sequência original FACODI criada para reunir e ordenar aulas externas do YouTube. '||s.notes||
 ' Correspondência por título e descrição pública, sem revisão integral do vídeo e sem certificação pelas instituições.',
 jsonb_build_array('Acompanhar os conceitos na ordem proposta.','Consultar as fontes originais.','Distinguir aulas universitárias de divulgação científica.'),
 ARRAY[s.title,'Astronomia','FACODI'],
 ARRAY['facodi','astronomia','sequencia-video','external-youtube',s.level],
 'pt-PT','active',true,'generated','facodi:astro:youtube-path:'||s.slug,
 jsonb_build_object('playlist_type','facodi_owned_editorial_sequence',
 'sequence_domain','astronomy','learning_level',s.level,'topics',s.topics,
 'note',s.notes,'video_count',jsonb_array_length(s.videos),
 'metadata_review_only',true,'teacher_approved',false,
 'full_video_review_completed',false,'playback_verified',false,
 'official_curriculum_status','supplementary_not_homologated',
 'copyright_rehosting_allowed',false,
 'curation_batch','facodi_astro_univesp_and_iag_verified_20261115')
FROM _astro_new_seq s ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro:official-seq-video:'||s.slug||':'||s.youtube_id)::uuid,
 md5('facodi:astro:youtube-path:'||s.slug)::uuid,
 coalesce(newv.id,y.learning_object_id),
 'contains',s.position,'metadata_based_educational_curation',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
  'teacher_approved',false,'full_video_reviewed',false,
  'curation_batch','facodi_astro_univesp_and_iag_verified_20261115')
FROM _astro_seq_lessons s
LEFT JOIN facodi.youtube_videos y ON y.youtube_video_id=s.youtube_id
LEFT JOIN facodi.learning_objects newv ON newv.id=md5('facodi:astro:official-youtube:'||s.youtube_id)::uuid
WHERE coalesce(newv.id,y.learning_object_id) IS NOT NULL
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro:official-seq-unit:'||s.slug||':'||s.unit_code)::uuid,
 u.learning_object_id,md5('facodi:astro:youtube-path:'||s.slug)::uuid,
 'contains',95500+row_number() OVER(PARTITION BY u.id ORDER BY s.slug)::integer,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
  'pedagogical_scope','supplementary_video_sequence','teacher_approved',false,
  'curation_batch','facodi_astro_univesp_and_iag_verified_20261115')
FROM _astro_seq_units s
JOIN facodi.curricular_units u ON u.code=s.unit_code
JOIN facodi.courses c ON c.id=u.course_id AND c.code='FACODI-GACS-ASTRO-2018'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro:official-seq-course:'||s.slug)::uuid,
 c.learning_object_id,md5('facodi:astro:youtube-path:'||s.slug)::uuid,
 'contains',95500+row_number() OVER(ORDER BY s.slug)::integer,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
  'teacher_approved',false,'curation_batch','facodi_astro_univesp_and_iag_verified_20261115')
FROM _astro_new_seq s JOIN facodi.courses c ON c.code='FACODI-GACS-ASTRO-2018'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Enrich the existing Astronomy collection without cloning existing sequences.
INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro:existing-collection:'||s.slug)::uuid,
 (SELECT id FROM facodi.learning_objects WHERE slug='facodi-study-astronomy-gacs-2018'),
 md5('facodi:astro:youtube-path:'||s.slug)::uuid,
 'contains',6+row_number() OVER(ORDER BY s.slug)::integer,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
 'teacher_approved',false,'curation_batch','facodi_astro_univesp_and_iag_verified_20261115')
FROM _astro_new_seq s
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

UPDATE facodi.learning_objects SET metadata=
 metadata||jsonb_build_object('playlist_count',9,
  'extended_video_sequence_batch','facodi_astro_univesp_and_iag_verified_20261115')
WHERE slug='facodi-study-astronomy-gacs-2018';

DO $final$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects
  WHERE object_type='video' AND metadata->>'curation_batch'='facodi_astro_univesp_and_iag_verified_20261115')<>8
 OR (SELECT count(*) FROM facodi.learning_objects
  WHERE object_type='playlist' AND metadata->>'curation_batch'='facodi_astro_univesp_and_iag_verified_20261115')<>3
 OR (SELECT count(*) FROM facodi.learning_object_relations r
  JOIN facodi.learning_objects s ON s.id=r.parent_object_id
  WHERE s.object_type='playlist' AND s.metadata->>'curation_batch'='facodi_astro_univesp_and_iag_verified_20261115')<>11
 THEN RAISE EXCEPTION 'Video/sequence count mismatch after publication'; END IF;
END $final$;
