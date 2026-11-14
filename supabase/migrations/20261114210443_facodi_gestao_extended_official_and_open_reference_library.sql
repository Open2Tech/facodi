-- Enrich Gestão with 15 verified publisher/institution landing pages.
-- Preserve copyrighted content by storing links, not text or PDFs.
CREATE TEMP TABLE _g_sources(k text PRIMARY KEY,title text,url text,brief text,
 lang text,kind text,codes text) ON COMMIT DROP;
INSERT INTO _g_sources VALUES
('ualg-plan','Plano de estudos oficial 2026/27 — Gestão UAlg','https://www.ualg.pt/curso/1418/plano','Plano com códigos, créditos, semestres e alternativas de opção.','pt','university','ALL'),
('ualg-course','Apresentação e objetivos — Gestão UAlg','https://www.ualg.pt/curso/1418','Objetivos gerais institucionais e enquadramento profissional; não é a ficha de uma UC.','pt','university','14181179,14181031,14181093,14181168,14181164'),
('finance','Principles of Finance — OpenStax','https://openstax.org/books/principles-finance/pages/preface','Manual externo em inglês sobre finanças, capital e risco. Exemplos com enquadramento internacional.','en','open_book','14181180,14181184,14181194,14181030,14181095,14191202'),
('financial-accounting','Financial Accounting — OpenStax','https://openstax.org/books/principles-financial-accounting/pages/preface','Conceitos introdutórios de contabilidade e demonstrações; não substitui as normas SNC portuguesas.','en','open_book','14181086,14181088,14181184'),
('managerial-accounting','Managerial Accounting — OpenStax','https://openstax.org/books/principles-managerial-accounting/pages/preface','Custos, orçamentação, desvios e contabilidade orientada à gestão, em inglês.','en','open_book','14181185,14181189,14191202,14181164'),
('org-behavior','Organizational Behavior — OpenStax','https://openstax.org/books/organizational-behavior/pages/1-introduction','Conceitos de liderança, motivação, equipas e estruturas organizacionais.','en','open_book','14181183,14181094,15161098,14181093'),
('entrepreneurship','Entrepreneurship — OpenStax','https://openstax.org/books/entrepreneurship/pages/1-introduction','Introdução a oportunidades, modelos de negócio, inovação e novos empreendimentos.','en','open_book','14181168,14181199,14181164,14181093'),
('eurostat','Eurostat — Base de dados da União Europeia','https://ec.europa.eu/eurostat/data/database','Indicadores estatísticos europeus para economia e análise comparada.','en','statistics','14181186,14181190,14181187,14181191,14181184,14181199'),
('pordata','Pordata — Estatísticas de Portugal','https://www.pordata.pt/','Séries e indicadores portugueses sobre empresas, emprego e economia.','pt','statistics','14181186,14181190,14181187,14181191,14181184,14181188,14181199,14181094'),
('ecb','Banco Central Europeu — Estatísticas','https://www.ecb.europa.eu/stats/html/index.en.html','Taxas de juro, condições monetárias e estatísticas financeiras.','en','statistics','14181190,14181030,14181180,14181095,14181194'),
('occ','OCC — Catálogo de Formação Profissional','https://www.occ.pt/pt-pt/catalogo-formacao','Catálogo sobre contabilidade, fiscalidade, gestão e reporte; alguns cursos podem exigir pagamento.','pt','professional','14181086,14181088,14181185,14181189,14181193,14181195,14181030,14191111,14181200,14181164'),
('sociedades','Código das Sociedades Comerciais — Diário da República','https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/1986-34443975-74094732','Legislação portuguesa para empresas. Consultar sempre alterações e textos em vigor.','pt','law','14181176,14181192,14181179,14181093'),
('iapmei','IAPMEI — Apoio à atividade empresarial','https://www.iapmei.pt/','Portal institucional com programas, empreendedorismo e informação para PME.','pt','institutional','14181168,14181199,14181194,14181093,15161098,14181164'),
('eu-ai','Regulamento Europeu de IA — EUR-Lex','https://eur-lex.europa.eu/eli/reg/2024/1689/oj','Legislação europeia relativa a sistemas de inteligência artificial; consultar âmbito e entrada em aplicação.','pt','law','14181200,14181197,14181196'),
('bpstat-employment','BPstat — Série oficial de emprego','https://bpstat.bportugal.pt/serie/12711768','Indicadores de emprego para análise estatística e de recursos humanos.','pt','statistics','14181094,14181183,14181187');
DO $$ BEGIN IF (SELECT count(*) FROM _g_sources)<>15 THEN RAISE EXCEPTION 'Source count mismatch'; END IF; END $$;

INSERT INTO facodi.learning_objects
(id,object_type,title,slug,description,objectives,keywords,tags,language,
status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:lg1418:ref:'||s.k)::uuid,'external_resource',s.title,
'lg1418-ref-'||s.k,s.brief,'[]'::jsonb,'{}'::text[],
ARRAY['gestao','leitura-complementar','recurso-externo'],
s.lang,'active',true,'external',s.url,'lg1418-'||s.k,
jsonb_build_object('source_kind',s.kind,'review_scope','external_landing_page',
'publication_type','external_link_only','source_content_copied',false,
'official_uc_material',false,'copyright_redistribution_assumed',false)
FROM _g_sources s
WHERE NOT EXISTS(SELECT 1 FROM facodi.learning_objects lo
WHERE lo.source_url=s.url AND lo.object_type='external_resource' AND lo.published)
ON CONFLICT(id) DO NOTHING;

CREATE TEMP TABLE _g_map ON COMMIT DROP AS
SELECT s.*, (SELECT lo.id FROM facodi.learning_objects lo
 WHERE lo.source_url=s.url AND lo.object_type='external_resource'
 AND lo.status='active' AND lo.published ORDER BY lo.created_at LIMIT 1) resource_id
FROM _g_sources s;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM _g_map WHERE resource_id IS NULL)
THEN RAISE EXCEPTION 'Missing resource after deduplication'; END IF; END $$;

INSERT INTO facodi.external_sources
(id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:lg1418:source:'||s.k)::uuid,s.resource_id,'website',
'lg1418-'||s.k,s.url,s.title,
jsonb_build_object('kind',s.kind,'review_scope','external_landing_page',
'copyright_mode','external_link_only')
FROM _g_map s ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,
created_by_mechanism,metadata)
SELECT md5('facodi:lg1418:reading:'||s.k||':'||u.code)::uuid,
u.learning_object_id,s.resource_id,'contains',
6000+row_number() OVER(PARTITION BY u.id ORDER BY s.k)::int,
'verified_external_reading_curation',
jsonb_build_object('review_status','approved','review_scope','external_landing_page',
'kind',s.kind,'resource_key',s.k,'official_uc_approval_claimed',false,
'copyright_mode','external_link_only')
FROM _g_map s
JOIN facodi.curricular_units u ON s.codes='ALL' OR u.code=ANY(string_to_array(s.codes,','))
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
WHERE u.published AND u.status='active'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_object_relations r
 JOIN facodi.curricular_units u ON u.learning_object_id=r.parent_object_id
 JOIN facodi.courses c ON c.id=u.course_id
 WHERE c.code='LGEST' AND r.created_by_mechanism='verified_external_reading_curation')<76
 THEN RAISE EXCEPTION 'Official references must be available for all 41 units'; END IF;
END $$;