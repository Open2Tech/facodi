-- Portuguese institutional lecture and finance learning portals.
-- Referencing only the original link; no media downloads or transcripts.
CREATE TEMP TABLE _g_lectures(k text PRIMARY KEY,title text,url text,
 brief text,codes text) ON COMMIT DROP;
INSERT INTO _g_lectures VALUES
('fccn-snc-video','Educast FCCN — Demonstrações financeiras no SNC','https://educast.fccn.pt/vod/clips/1sg1c20ovi/link_box','Videoaula de Tomás Castro Tavares sobre demonstrações financeiras no SNC, alojada no Educast FCCN.','14181086,14181088,14181184'),
('usp-finance-math','USP e-Aulas — Juros compostos e matemática financeira','https://eaulas.usp.br/portal/video?idItem=2361','Recurso audiovisual universitário brasileiro sobre juros compostos e fundamentos de matemática financeira.','14181180'),
('usp-investment','USP e-Aulas — Análise de Investimentos','https://eaulas.usp.br/portal/home.action/video?idItem=14040','Aula universitária externa sobre VAL/VPL e TIR, com exemplos do contexto brasileiro.','14181194,14181030,14181180'),
('ipv-literacy','IPV — Portal de literacia financeira','https://www1.estgv.ipv.pt/fin/','Vídeos didáticos de literacia financeira, incluindo valor temporal do dinheiro e noções básicas para tomada de decisão.','14181180,14181030,14181095');
INSERT INTO facodi.learning_objects
(id,object_type,title,slug,description,objectives,keywords,tags,language,
status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:lg1418:eduportal:'||x.k)::uuid,
 'external_resource',x.title,'gestao-eduportal-'||x.k,
 x.brief,'[]'::jsonb,'{}'::text[],
 ARRAY['gestao','videoaula-externa','instituicao-de-ensino'],
 'pt','active',true,'external',x.url,'lg1418-eduportal-'||x.k,
 jsonb_build_object('source_type','institutional_educational_video_portal',
 'country_scope','Portugal_or_Brazil_as_indicated',
 'copyright_mode','external_link_only','media_copied',false,
 'review_scope','institutional_landing_page',
 'official_ualg_content',false)
FROM _g_lectures x
WHERE NOT EXISTS(SELECT 1 FROM facodi.learning_objects lo
 WHERE lo.source_url=x.url AND lo.object_type='external_resource' AND lo.published)
ON CONFLICT(id) DO NOTHING;
CREATE TEMP TABLE _g_lecture_map ON COMMIT DROP AS
SELECT x.*, (SELECT lo.id FROM facodi.learning_objects lo
 WHERE lo.source_url=x.url AND lo.object_type='external_resource' AND lo.published
 ORDER BY lo.created_at LIMIT 1) obj_id FROM _g_lectures x;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM _g_lecture_map WHERE obj_id IS NULL)
 THEN RAISE EXCEPTION 'Eduportal resource missing'; END IF;
END $$;
INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:lg1418:eduportal-source:'||x.k)::uuid,
 x.obj_id,'website','lg1418-eduportal-'||x.k,x.url,x.title,
 jsonb_build_object('source_type','institutional_educational_video_portal',
 'rehosting_authorized',false)
FROM _g_lecture_map x ON CONFLICT(id) DO NOTHING;
INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,
created_by_mechanism,metadata)
SELECT md5('facodi:lg1418:eduportal-rel:'||x.k||':'||u.code)::uuid,
 u.learning_object_id,x.obj_id,'contains',
 9000+row_number() OVER(PARTITION BY u.id ORDER BY x.k)::int,
 'verified_external_reading_curation',
 jsonb_build_object('review_status','approved',
 'review_scope','external_landing_page','source_key',x.k,
 'copyright_mode','external_link_only','official_ualg_content',false)
FROM _g_lecture_map x
JOIN facodi.curricular_units u ON u.code=ANY(string_to_array(x.codes,','))
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
WHERE u.published AND u.status='active'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;
