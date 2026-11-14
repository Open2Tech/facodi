
-- FACODI: UAlg Licenciatura em Gestão (Faro, ESGHT) 2026/27.
-- Official: https://www.ualg.pt/curso/1418/plano (course 1418, not Gestão de Empresas 1439).
-- Fiscalidade I (14181193) appears in TWO second-year semesters on the source page.
-- One canonical unit with a source anomaly flag is intentionally preserved.
-- 41 distinct available UCs include three groups of ALTERNATIVE electives.
-- Student credit path: 60 + 60 + (45 mandatory + 3 * 5 elective) = 180.
CREATE TEMP TABLE _gestao_1418 (
 uc_code text PRIMARY KEY, uc_title text NOT NULL, year int NOT NULL, sem int NOT NULL,
 ects numeric NOT NULL, elective_group text, topics text NOT NULL, ordering int NOT NULL
) ON COMMIT DROP;
INSERT INTO _gestao_1418 VALUES
('14181086','Contabilidade Financeira I',1,1,7,NULL,'Património e equação contabilística|Registos contabilísticos|Demonstrações financeiras',1),
('14181177','Informática para Gestão',1,1,6,NULL,'Folhas de cálculo|Organização de dados|Apoio digital à decisão',2),
('14181179','Introdução à Gestão',1,1,6,NULL,'Organizações|Planeamento e organização|Funções da gestão',3),
('14181176','Introdução ao Direito',1,1,5,NULL,'Fontes do direito|Relações jurídicas|Enquadramento das organizações',4),
('14181178','Matemática I',1,1,6,NULL,'Funções|Derivadas|Aplicações quantitativas em gestão',5),
('14181183','Comportamento Organizacional',1,2,6,NULL,'Motivação|Equipas e liderança|Cultura organizacional',6),
('14181088','Contabilidade Financeira II',1,2,7,NULL,'Operações de fim de período|Apuramento de resultados|Relato financeiro',7),
('14181182','Inglês para Gestão',1,2,5,NULL,'Vocabulário de negócios|Comunicação profissional|Apresentações',8),
('14181180','Matemática Financeira',1,2,6,NULL,'Juros|Capitalização e desconto|Rendas e equivalência de capitais',9),
('14181181','Matemática II',1,2,6,NULL,'Modelação matemática|Otimização|Aplicações económicas',10),
('14181184','Análise Económica e Financeira',2,1,6,NULL,'Indicadores de desempenho|Leitura de demonstrações|Diagnóstico financeiro',11),
('14181185','Contabilidade de Gestão I',2,1,6,NULL,'Classificação de custos|Métodos de custeio|Apoio à decisão',12),
('14181192','Direito Comercial e do Trabalho',2,1,6,NULL,'Atividade empresarial|Sociedades|Relações laborais',13),
('14181186','Economia I',2,1,6,NULL,'Oferta e procura|Mercados|Decisões económicas',14),
('14181187','Estatística I',2,1,6,NULL,'Estatística descritiva|Amostragem|Probabilidades',15),
('14181193','Fiscalidade I',2,1,6,NULL,'Sistema fiscal|Obrigações tributárias|Tributos nas organizações',16),
('14181188','Marketing',2,1,6,NULL,'Segmentação e posicionamento|Proposta de valor|Marketing-mix',17),
('14181189','Contabilidade de Gestão II',2,2,6,NULL,'Orçamentação|Análise de desvios|Controlo de gestão',18),
('14181190','Economia II',2,2,6,NULL,'Agregados macroeconómicos|Política económica|Ciclos económicos',19),
('14181191','Estatística II',2,2,6,NULL,'Inferência|Testes de hipóteses|Regressão e análise aplicada',20),
('14181094','Gestão de Recursos Humanos',3,1,5,NULL,'Recrutamento e seleção|Desenvolvimento de pessoas|Avaliação de desempenho',21),
('14181194','Projeto de Investimento',3,1,5,NULL,'Fluxos de caixa|Viabilidade|Análise de risco',22),
('14181196','Sistemas de Informação para Gestão I',3,1,5,NULL,'Sistemas empresariais|Dados e processos|Informação para decidir',23),
('15161110','Gestão e Publicidade em Redes Sociais',3,1,5,'I (CE)','Estratégia em redes sociais|Campanhas|Indicadores de desempenho',24),
('15161102','Gestão e Técnica de Vendas',3,1,5,'I (CE)','Processo comercial|Relacionamento com clientes|Negociação',25),
('15161047','Marketing de Serviços',3,1,5,'I (CE)','Experiência do cliente|Qualidade percebida|Marketing de serviços',26),
('14181199','Negócios Internacionais',3,1,5,'I (CE)','Mercados internacionais|Internacionalização|Risco internacional',27),
('14191202','Sistemas de Controlo de Gestão',3,1,5,'I (CE)','Indicadores de gestão|Orçamentação|Controlo de desempenho',28),
('14191111','Contabilidade Pública',3,1,5,'II (QAC)','Contabilidade pública|Relato orçamental|Prestação de contas',29),
('15161098','Gestão e Negociação',3,1,5,'II (QAC)','Preparação de negociação|Condução de acordos|Resolução de conflitos',30),
('14181198','Marketing e Branding Digital',3,1,5,'II (QAC)','Identidade digital|Posicionamento de marca|Canais digitais',31),
('14181095','Produtos Financeiros',3,1,5,'II (QAC)','Instrumentos financeiros|Risco e rendibilidade|Escolha de produtos',32),
('14181031','Estágio',3,2,10,NULL,'Plano de atividades|Prática em organização|Reflexão e relatório',33),
('14181195','Fiscalidade II',3,2,5,NULL,'Aplicação do sistema fiscal|Cumprimento fiscal|Situações empresariais',34),
('14181093','Gestão Estratégica',3,2,5,NULL,'Diagnóstico estratégico|Formulação de estratégia|Execução e avaliação',35),
('14181030','Gestão Financeira',3,2,5,NULL,'Financiamento|Gestão de tesouraria|Decisões de investimento',36),
('14181197','Sistemas de Informação para Gestão II',3,2,5,NULL,'Integração de sistemas|Análise de informação|Suporte à decisão',37),
('14181168','Empreendedorismo e Inovação',3,2,5,'III (QAC)','Modelos de negócio|Validação de ideias|Inovação',38),
('15161109','Escrita para a Web e Storytelling',3,2,5,'III (QAC)','Escrita digital|Narrativa de marca|Comunicação online',39),
('14181200','Inteligência Artificial Generativa Aplicada',3,2,5,'III (QAC)','IA generativa|Aplicações nas organizações|Limitações e avaliação',40),
('14181164','Projeto de Simulação Empresarial',3,2,5,'III (QAC)','Decisões empresariais|Simulação|Avaliação de resultados',41);

DO $$ BEGIN
 IF (SELECT count(*) FROM _gestao_1418) <> 41 THEN
  RAISE EXCEPTION 'Expected 41 distinct official UC codes'; END IF;
 IF (SELECT sum(ects) FROM _gestao_1418 WHERE year=1 AND elective_group IS NULL)<>60
 OR (SELECT sum(ects) FROM _gestao_1418 WHERE year=2 AND elective_group IS NULL)<>60
 OR (SELECT sum(ects) FROM _gestao_1418 WHERE year=3 AND elective_group IS NULL)<>45
 THEN RAISE EXCEPTION 'Unexpected compulsory annual credits'; END IF;
 IF (SELECT count(distinct elective_group) FROM _gestao_1418 WHERE elective_group IS NOT NULL)<>3 THEN
  RAISE EXCEPTION 'Expected three elective groups'; END IF;
 IF EXISTS (SELECT 1 FROM facodi.courses WHERE code='LGEST' OR slug='gestao' OR external_id='1418')
 THEN RAISE EXCEPTION 'Course 1418 already exists, reconcile before seeding'; END IF;
END $$;

INSERT INTO facodi.learning_objects
 (id,object_type,title,slug,description,objectives,keywords,tags,language,
  status,published,source_type,source_url,source_id,metadata)
VALUES (
 md5('facodi:ualg:1418:course_object')::uuid,
 'course','Licenciatura em Gestão','facodi-gestao-1418',
 'Licenciatura em Gestão, ensino politécnico diurno, Escola Superior de Gestão, Hotelaria e Turismo, Universidade do Algarve. Formação abrangente em gestão organizacional, contabilidade, finanças, marketing, economia e apoio à decisão, com estágio curricular.',
 '[]'::jsonb, ARRAY['Gestão','ESGHT','UAlg','Licenciatura'],
 ARRAY['gestao','ualg','curso-oficial'], 'pt','active',true,'import',
 'https://www.ualg.pt/curso/1418','1418',
 jsonb_build_object(
 'academic_year','2026/27','official_plan_url','https://www.ualg.pt/curso/1418/plano',
 'official_course_id','1418','course_location','Faro',
 'programme_type','ensino_politecnico_diurno_presencial',
 'language','pt','degree_ects',180,'duration_years',3,
 'a3es_registration','R/A-Ef 2279/2011',
 'a3es_accreditation_valid_until','2031-07-31',
 'accreditation_reference_url','https://www.ualg.pt/curso/1418/avaliacao',
 'review_scope','official_programme_identity_and_study_plan',
 'official_syllabus_claimed',false,
 'fiscalidade_i_double_listing_flag',true,
 'studies_contain_elective_alternatives',true,
 'source_type','universidade_do_algarve'
 ))
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.courses (
 id,learning_object_id,code,external_source,external_id,slug,title,normalized_title,
 summary,description_html,degree_type,language,school,institution,source_url,plan_url,
 ects_total,duration_semesters,status,published,metadata)
VALUES (
 md5('facodi:ualg:1418:course')::uuid,
 md5('facodi:ualg:1418:course_object')::uuid,
 'LGEST','ualg_official','1418','gestao','Licenciatura em Gestão',
 'Gestão',
 'Licenciatura em Gestão da Universidade do Algarve, lecionada na ESGHT (Faro), ensino politécnico diurno, com formação em gestão, economia, contabilidade, finanças, marketing e experiência profissional. Plano de estudos oficial 2026/27.',
 '<h2>Licenciatura em Gestão — Universidade do Algarve</h2><p>Formação politécnica diurna em Faro, orientada para o contexto das organizações, integrando gestão, economia, contabilidade, finanças, marketing e tomada de decisão. O programa inclui estágio curricular e três grupos de opções no terceiro ano.</p><p>Explore as unidades por ano, consulte os roteiros de estudo originais FACODI e os materiais externos selecionados. O roteiro de cada UC não substitui a respetiva ficha oficial.</p><p><strong>Nota curricular:</strong> Fiscalidade I surge duas vezes no plano de 2026/27 com o mesmo código; foi registada apenas uma vez e a divergência está assinalada nos metadados. As UCs de opção são alternativas, não créditos cumulativos.</p><p><a href="https://www.ualg.pt/curso/1418/plano" target="_blank" rel="noopener noreferrer">Plano oficial UAlg 2026/27</a></p>',
 'Licenciatura','pt','Escola Superior de Gestão, Hotelaria e Turismo',
 'Universidade do Algarve','https://www.ualg.pt/curso/1418','https://www.ualg.pt/curso/1418/plano',
 180,6,'active',true,
 jsonb_build_object('official_course_id','1418','academic_year','2026/27',
  'course_type','ensino_politecnico','campus','Penha - Faro',
  'study_mode','diurno_presencial',
  'a3es_registration','R/A-Ef 2279/2011',
  'accreditation_status','acreditado',
  'accreditation_valid_until','2031-07-31',
  'accreditation_url','https://www.ualg.pt/curso/1418/avaliacao',
  'course_director','Celísia Isabel Domingues Baptista',
  'official_plan_url','https://www.ualg.pt/curso/1418/plano',
  'official_academic_year','2026/27',
  'official_program_verified',true,
  'official_ects_total',180,
  'unique_uc_codes',41,'official_study_plan_credits_check','60+60+60_with_three_elective_choices',
  'contains_alternative_electives',true,
  'elective_choice_groups',jsonb_build_array('I (CE)','II (QAC)','III (QAC)'),
  'plan_anomalies',jsonb_build_array(jsonb_build_object(
     'uc_code','14181193','title','Fiscalidade I',
     'listed_in_year',2,'listed_semesters',jsonb_build_array(1,2),
     'action','imported_once_semester_1_pending_institutional_clarification')),
  'study_guides_author','FACODI',
  'study_guides_are_official_fuc',false,
  'publication_basis','official_programme_study_plan_2026_27',
  'source_quality','ualg_verified_catalogue'
 ))
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_objects
 (id,object_type,title,slug,description,objectives,keywords,tags,language,
 status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:ualg:1418:uc_object:'||s.uc_code)::uuid,
 'curricular_unit',s.uc_title,'facodi-gestao-uc-'||s.uc_code,
 concat('Roteiro de estudo FACODI. Temas introdutórios sugeridos: ',
 replace(s.topics,'|','; '),
 '. O título, o código, o ano e os ECTS foram cotejados com o plano oficial da UAlg; estes temas não constituem a ficha de unidade curricular.'),
 '[]'::jsonb,string_to_array(s.topics,'|'),
 ARRAY['gestao','ualg','uc'], 'pt','active',true,'import',
 'https://www.ualg.pt/curso/1418/plano',s.uc_code,
 jsonb_build_object('official_course_id','1418','academic_year','2026/27',
  'official_unit_code',s.uc_code,'course_code','LGEST',
  'year',s.year,'semester',s.sem,'ects',s.ects,'elective_group',s.elective_group,
  'is_elective_option',(s.elective_group IS NOT NULL),
  'study_topics',to_jsonb(string_to_array(s.topics,'|')),
  'study_topics_are_facodi_editorial',true,'official_fuc_checked',false,
  'official_plan_url','https://www.ualg.pt/curso/1418/plano',
  'official_structure_verified',true,
  'curriculum_review_status','approved_official_plan',
  'official_duplicate_listing',s.uc_code='14181193',
  'official_duplicate_semesters',CASE WHEN s.uc_code='14181193'
     THEN jsonb_build_array(1,2) ELSE '[]'::jsonb END)
FROM _gestao_1418 s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.curricular_units(
 id,learning_object_id,course_id,code,external_source,external_id,slug,title,normalized_title,
 summary,description_html,year,semester,ects,position,language,source_url,plan_url,
 status,published,metadata)
SELECT md5('facodi:ualg:1418:uc:'||s.uc_code)::uuid,
 md5('facodi:ualg:1418:uc_object:'||s.uc_code)::uuid,
 md5('facodi:ualg:1418:course')::uuid,
 s.uc_code,'ualg_official',s.uc_code,'gestao-1418-uc-'||s.uc_code,
 s.uc_title,s.uc_title,
 concat('Introdução FACODI aos temas: ',replace(s.topics,'|',', '),
 '. Consulte a ficha oficial da UC para programa e avaliação.'),
 concat('<h2>Roteiro de estudo FACODI</h2><p>Temas sugeridos: ',
 replace(s.topics,'|','; '),
 '.</p><p>Este texto é uma introdução original, não é o programa detalhado nem os resultados de aprendizagem oficiais da UAlg.</p>',
 CASE WHEN s.elective_group IS NULL THEN '' ELSE
  concat('<p>UC alternativa da Opção ',s.elective_group,
  '. A escolha de uma opção não implica cursar todas as alternativas.</p>') END,
 CASE WHEN s.uc_code='14181193' THEN
  '<p><strong>Nota:</strong> Fiscalidade I aparece nos dois semestres do segundo ano no plano oficial. A FACODI apresenta-a uma vez, no primeiro semestre, até esclarecimento da UAlg.</p>'
 ELSE '' END),
 s.year,s.sem,s.ects,s.ordering,'pt','https://www.ualg.pt/curso/1418/plano','https://www.ualg.pt/curso/1418/plano',
 'active',true,
 jsonb_build_object(
  'course_code','LGEST','academic_year','2026/27','official_course_id','1418',
  'official_code_checked',true,'official_ects_checked',true,
  'official_semester_checked',CASE WHEN s.uc_code='14181193' THEN false ELSE true END,
  'source_quality','ualg_official_structure',
  'official_plan_url','https://www.ualg.pt/curso/1418/plano',
  'is_elective_option',s.elective_group IS NOT NULL,
  'official_option_group',s.elective_group,
  'study_topics',to_jsonb(string_to_array(s.topics,'|')),
  'editorial_summary_basis','official_unit_title_and_general_subject',
  'study_guide_is_official_syllabus',false,
  'detailed_fuc_checked',false,
  'curriculum_review_status','approved_official_plan',
  'duplicate_semester_listing_on_official_page',s.uc_code='14181193',
  'listed_semesters',CASE WHEN s.uc_code='14181193' THEN jsonb_build_array(1,2) ELSE jsonb_build_array(s.sem) END
 )
FROM _gestao_1418 s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations (
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ualg:1418:course_relation:'||s.uc_code)::uuid,
 md5('facodi:ualg:1418:course_object')::uuid,
 md5('facodi:ualg:1418:uc_object:'||s.uc_code)::uuid,
 'contains',s.ordering,'structured_catalog_import',
 jsonb_build_object('official_year','2026/27','source_url','https://www.ualg.pt/curso/1418/plano',
 'review_status','approved','is_elective_option',s.elective_group IS NOT NULL,
 'option_group',s.elective_group,'source','official_ualg_2026_27')
FROM _gestao_1418 s
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.external_sources (
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:ualg:1418:uc_source:'||s.uc_code)::uuid,
 md5('facodi:ualg:1418:uc_object:'||s.uc_code)::uuid,
 'website',s.uc_code,'https://www.ualg.pt/curso/1418/plano',
 concat('Plano oficial UAlg 2026/27 — ',s.uc_title),
 jsonb_build_object('academic_year','2026/27','course_code','1418',
 'official_unit_code',s.uc_code,
 'source_scope','official_study_plan_listing',
 'not_detailed_fuc',true)
FROM _gestao_1418 s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources
 (id,learning_object_id,source_type,external_id,source_url,title,metadata)
VALUES
 (md5('facodi:ualg:1418:official_programme_source')::uuid,
  md5('facodi:ualg:1418:course_object')::uuid,
  'website','1418','https://www.ualg.pt/curso/1418',
  'Licenciatura em Gestão — Apresentação UAlg',
  '{"source":"universidade_do_algarve","academic_year":"2026/27","reference_type":"programme_identity"}'::jsonb),
 (md5('facodi:ualg:1418:accreditation_source')::uuid,
  md5('facodi:ualg:1418:course_object')::uuid,
  'website','R/A-Ef 2279/2011','https://www.ualg.pt/curso/1418/avaliacao',
  'Gestão — Acreditação A3ES',
  '{"source":"universidade_do_algarve","accredited_through":"2031-07-31","reference_type":"official_accreditation"}'::jsonb)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.keywords (
 id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:ualg:1418:keyword:'||s.uc_code)::uuid,
 md5('facodi:ualg:1418:uc_object:'||s.uc_code)::uuid,
 s.uc_title,lower(btrim(s.uc_title)),'pt',1,
 'official_unit_title',jsonb_build_object('plan_url','https://www.ualg.pt/curso/1418/plano')
FROM _gestao_1418 s
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.curricular_units
  WHERE course_id=md5('facodi:ualg:1418:course')::uuid)<>41
 OR (SELECT count(*) FROM facodi.learning_objects
  WHERE id=md5('facodi:ualg:1418:course_object')::uuid
   AND object_type='course' AND published)<>1
 OR (SELECT count(*) FROM facodi.learning_object_relations
  WHERE parent_object_id=md5('facodi:ualg:1418:course_object')::uuid
   AND relation_type='contains')<>41
 THEN RAISE EXCEPTION 'Gestão curriculum relationships incomplete'; END IF;
END $$;
