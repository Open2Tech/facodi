
CREATE TEMP TABLE _gestao_external (
 source_key text primary key,title text,url text,summary text,lang text,source_kind text,uc_codes text
) ON COMMIT DROP;
INSERT INTO _gestao_external VALUES ('cnc-snc','SNC — Comissão de Normalização Contabilística','https://www.cnc.min-financas.pt/snc2016.html','Normas e modelos de relato financeiro para consulta.','pt','institutional','14181086,14181088,14181184'),
('cnc-instrumentos','Instrumentos contabilísticos do SNC','https://www.cnc.min-financas.pt/Instrumentos_snc_geral.html','Normas e documentos contabilísticos oficiais.','pt','institutional','14181086,14181088'),
('ine','Base de Dados de Indicadores — INE','https://ine.pt/xportal/xmain?xpgid=ine_base_dados&xpid=INE','Indicadores estatísticos oficiais para exercícios de análise.','pt','institutional','14181187,14181191,14181184,14181186,14181190'),
('dr-trabalho','Código do Trabalho — Diário da República','https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475','Texto legal consolidado de referência.','pt','institutional','14181192,14181094'),
('at-codigos','Códigos Tributários — Portal das Finanças','https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/Pages/default-com-pdf.aspx','Consulta da legislação tributária, sujeita a atualização.','pt','institutional','14181193,14181195'),
('at-civa','Código do IVA — Autoridade Tributária','https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/civa_rep/pages/codigo-do-iva-indice.aspx','Índice de consulta ao Código do IVA.','pt','institutional','14181193,14181195,14181086'),
('bportugal-sim','Simulador de Crédito — Banco de Portugal','https://clientebancario.bportugal.pt/pt-pt/creditos-consumidores','Simulação educativa de juros, prazos e prestações; não é aconselhamento financeiro.','pt','institutional','14181180,14181030,14181095'),
('openstax-mgmt','Principles of Management — OpenStax','https://openstax.org/books/principles-management/pages/1-introduction','Manual complementar externo de gestão e comportamento organizacional.','en','open_textbook','14181179,14181183,14181094,14181093,15161098'),
('openstax-marketing','Principles of Marketing — OpenStax','https://openstax.org/books/principles-marketing/pages/1-unit-introduction','Manual complementar externo de marketing.','en','open_textbook','14181188,15161047,14181198,15161110,15161102'),
('openstax-stats-business','Introductory Business Statistics 2e — OpenStax','https://openstax.org/books/introductory-business-statistics-2e/pages/1-introduction','Manual externo de estatística aplicada a negócios.','en','open_textbook','14181187,14181191'),
('openstax-economics','Principles of Economics 3e — OpenStax','https://openstax.org/books/principles-economics-3e/pages/1-introduction','Manual externo de fundamentos económicos.','en','open_textbook','14181186,14181190,14181184');
DO $$ BEGIN
 IF (SELECT count(*) FROM _gestao_external)<>11 THEN RAISE EXCEPTION '11 sources expected';END IF;
 IF EXISTS (SELECT 1 FROM _gestao_external s
  CROSS JOIN LATERAL unnest(string_to_array(s.uc_codes,',')) code(x)
  WHERE NOT EXISTS(SELECT 1 FROM facodi.curricular_units u
   JOIN facodi.courses c ON c.id=u.course_id
   WHERE c.code='LGEST' AND u.code=code.x)) THEN
  RAISE EXCEPTION 'Source UC not found';END IF;
END $$;

-- Reuse any existing shared reference to the SAME verified URL.
-- New resources use a prefixed source_id to avoid cross-course unique-index collisions.
INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,objectives,keywords,tags,language,
 status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:gestao:source:'||s.source_key)::uuid,
 'external_resource',s.title,'gestao-source-'||s.source_key,
 s.summary,'[]'::jsonb,'{}'::text[],
 ARRAY['gestao','leitura-complementar','referencia-externa'],
 s.lang,'active',true,'external',s.url,'gestao-1418-'||s.source_key,
 jsonb_build_object('source_kind',s.source_kind,
 'publication_type','external_reference_link_only',
 'copied_full_text',false,'copyright_redistribution_assumed',false,
 'source_verified_from_landing_page',true,
 'curation_scope','official_source_or_publisher_landing_page')
FROM _gestao_external s
WHERE NOT EXISTS(SELECT 1 FROM facodi.learning_objects lo
 WHERE lo.source_url=s.url AND lo.object_type='external_resource'
 AND lo.status='active' AND lo.published)
ON CONFLICT(id) DO NOTHING;

CREATE TEMP TABLE _gestao_source_mapping ON COMMIT DROP AS
SELECT s.*, (
 SELECT lo.id FROM facodi.learning_objects lo
 WHERE lo.source_url=s.url AND lo.object_type='external_resource'
   AND lo.published AND lo.status='active'
 ORDER BY lo.created_at,lo.id LIMIT 1
) resource_id
FROM _gestao_external s;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM _gestao_source_mapping WHERE resource_id IS NULL)
 THEN RAISE EXCEPTION 'Missing a verified external source resource'; END IF;
END $$;

INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:gestao:external-source:'||s.source_key)::uuid,
 s.resource_id,'website','gestao-1418-'||s.source_key,s.url,s.title,
 jsonb_build_object('course_code','LGEST','external_link_only',true,
  'source_kind',s.source_kind)
FROM _gestao_source_mapping s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:gestao:reading:'||s.source_key||':'||uc.code)::uuid,
 u.learning_object_id,s.resource_id,'contains',
 5000+row_number() over(partition by u.id order by s.source_key),
 'verified_external_reading_curation',
 jsonb_build_object('review_status','approved',
 'review_scope','external_landing_page','course_code','LGEST',
 'source_kind',s.source_kind,'external_link_only',true,
 'institutional_endorsement_claimed',false)
FROM _gestao_source_mapping s
CROSS JOIN LATERAL unnest(string_to_array(s.uc_codes,',')) uc(code)
JOIN facodi.curricular_units u ON u.code=uc.code
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
WHERE u.learning_object_id IS NOT NULL AND u.published
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_object_relations r
  JOIN facodi.curricular_units u ON u.learning_object_id=r.parent_object_id
  JOIN facodi.courses c ON c.id=u.course_id WHERE c.code='LGEST'
  AND r.created_by_mechanism='verified_external_reading_curation')<>35
 THEN RAISE EXCEPTION 'Expected 35 curated reference relations'; END IF;
END $$;