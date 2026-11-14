-- Curated new YouTube LINKS: external metadata only, not video files.
-- Seven direct URLs were checked for educational title and publisher.
-- Full-video transcript/accuracy/licensing still requires editorial review.
CREATE TEMP TABLE _lg_video (
 youtube_id text PRIMARY KEY,title text,channel text,editorial_summary text,
 uc_codes text,language text,published_date text
) ON COMMIT DROP;
INSERT INTO _lg_video VALUES
('wZxVAbzJRTM','Introdução à Contabilidade Financeira — aula de Miguel Fragoso','CERTFORM - Escola de Formação Prática','Introdução aos elementos patrimoniais, contas, registos e operações contabilísticas.','14181086','pt','2024-06-15'),
('tuQWhZqGm0g','VAL, EVA e ROIC na avaliação de investimentos','CERTFORM - Escola de Formação Prática','Exploração dos indicadores de valorização e desempenho em decisões de investimento.','14181194,14181030','pt','2022-07-16'),
('9cpmyVxk7F8','Matemática Financeira — Juros Simples','Joselias Silva','Exposição de juros simples, montante e conceitos introdutórios de matemática financeira.','14181180','pt','2025-02-01'),
('qojGZ-Q-Kkw','Juros Compostos — Aula 3 de Matemática Financeira','Prof. Elisson de Andrade','Capitalização composta, valor futuro, taxas e exemplos numéricos.','14181180','pt','2012-07-05'),
('vwaffI4SxGo','Juros Compostos — Aula completa passo a passo','Mathematics Manual','Introdução e aplicações práticas do regime de juros compostos.','14181180','pt','2025-07-01'),
('MqyhTSFrguA','Economia — Oferta, procura e elasticidade','Filipe Prado - Professor, Economista e Financista','Estudo de elasticidade da procura e da oferta em contexto microeconómico.','14181186','pt','2025-01-15'),
('fQb-kX6UFlY','Marketing Digital — Introdução ao funil de vendas','Tiago Fonseca','Introdução comercial ao funil de vendas e sua aplicação em marketing digital.','14181188,14181198','pt','2022-01-11');
DO $$ BEGIN
 IF (SELECT count(*) FROM _lg_video)<>7 OR EXISTS(
   SELECT 1 FROM _lg_video WHERE youtube_id !~ '^[A-Za-z0-9_-]{11}$')
 THEN RAISE EXCEPTION 'Video reference validation failed';END IF;
 IF EXISTS(SELECT 1 FROM _lg_video x
 CROSS JOIN LATERAL unnest(string_to_array(x.uc_codes,',')) z(code)
 WHERE NOT EXISTS(SELECT 1 FROM facodi.curricular_units u
  JOIN facodi.courses c ON c.id=u.course_id
  WHERE c.code='LGEST' AND u.code=z.code AND u.published))
 THEN RAISE EXCEPTION 'Video UC code unknown';END IF;
 IF EXISTS(SELECT 1 FROM _lg_video v
 WHERE EXISTS(SELECT 1 FROM facodi.youtube_videos y
 WHERE y.youtube_video_id=v.youtube_id))
 THEN RAISE EXCEPTION 'Video already imported in FACODI: review deduplication';END IF;
END $$;

INSERT INTO facodi.learning_objects (
 id,object_type,title,slug,description,objectives,keywords,tags,language,
 status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:lg1418:youtube:'||v.youtube_id)::uuid,
 'video',v.title,'gestao-video-'||v.youtube_id,v.editorial_summary,
 '[]'::jsonb,'{}'::text[],ARRAY['gestao','video','youtube','apoio-ao-estudo'],
 v.language,'active',true,'youtube','https://www.youtube.com/watch?v='||v.youtube_id,
 'lg1418-youtube-'||v.youtube_id,
 jsonb_build_object('youtube_video_id',v.youtube_id,'channel_name',v.channel,
  'published_date_on_youtube',v.published_date,
  'review_scope','title_description_and_channel',
  'full_video_reviewed',false,'content_license_verified',false,
  'official_course_video',false,'publication_type','external_youtube_link',
  'source','youtube_original_video_page','course_code','LGEST',
  'editorial_summary_is_original',true)
FROM _lg_video v
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.youtube_videos (
 id,learning_object_id,youtube_video_id,canonical_url,title,description,
 channel_title,thumbnails,tags,language,metadata,status)
SELECT md5('facodi:lg1418:youtube_row:'||v.youtube_id)::uuid,
 md5('facodi:lg1418:youtube:'||v.youtube_id)::uuid,
 v.youtube_id,'https://www.youtube.com/watch?v='||v.youtube_id,
 v.title,v.editorial_summary,v.channel,
 jsonb_build_object('default',jsonb_build_object('url',
 'https://i.ytimg.com/vi/'||v.youtube_id||'/hqdefault.jpg')),
 ARRAY['gestao','facodi'],v.language,
 jsonb_build_object('course_code','LGEST',
  'publication_type','external_video_link_only',
  'review_scope','title_description_and_channel',
  'source_video_fully_reviewed',false,
  'original_youtube_upload_claimed',false,'available_region_unverified',true),
 'published'
FROM _lg_video v
ON CONFLICT(youtube_video_id) DO NOTHING;

INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:lg1418:youtube_source:'||v.youtube_id)::uuid,
 md5('facodi:lg1418:youtube:'||v.youtube_id)::uuid,
 'youtube',v.youtube_id,'https://www.youtube.com/watch?v='||v.youtube_id,
 v.title,
 jsonb_build_object('publisher',v.channel,'copyright_mode','external_link_only',
 'review_scope','title_description_and_channel')
FROM _lg_video v
ON CONFLICT(id) DO NOTHING;

-- The public RLS policy supports metadata-based editorial supplementary links.
INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:lg1418:new_youtube_rel:'||v.youtube_id||':'||u.code)::uuid,
 u.learning_object_id,
 md5('facodi:lg1418:youtube:'||v.youtube_id)::uuid,
 'contains',
 11000+row_number() OVER (PARTITION BY u.id ORDER BY v.title)::integer,
 'metadata_based_educational_curation',
 jsonb_build_object('review_status','approved',
  'review_scope','title_and_channel_only',
  'title_description_checked',true,
  'full_video_reviewed',false,'content_license_verified',false,
  'original_youtube_link','https://www.youtube.com/watch?v='||v.youtube_id,
  'official_ualg_teaching_material',false,
  'course_code','LGEST','unit_code',u.code)
FROM _lg_video v
CROSS JOIN LATERAL unnest(string_to_array(v.uc_codes,',')) z(code)
JOIN facodi.curricular_units u ON u.code=z.code
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects
 WHERE object_type='video' AND source_type='youtube' AND source_id LIKE 'lg1418-youtube-%')<>7
 THEN RAISE EXCEPTION 'New Gestão video resources not all inserted'; END IF;
END $$;
