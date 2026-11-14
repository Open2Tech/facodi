
-- CTeSP Sistemas e Tecnologias de Informação (Faro), UAlg institutional course 1812.
-- Verified against https://www.ualg.pt/curso/1812/plano, academic year 2026/27.
-- 17 curricular units, 120 ECTS, 4 semesters; different from TI/1932 and Portimão/1970.
-- Editorial topic suggestions are NOT the university's official UC descriptions.
CREATE TEMP TABLE _ctesp1812(
 code text PRIMARY KEY,title text NOT NULL,ects numeric NOT NULL,yr integer NOT NULL,
 sem integer NOT NULL,editorial_summary text NOT NULL,topics text NOT NULL,position integer NOT NULL
) ON COMMIT DROP;
INSERT INTO _ctesp1812 VALUES ('18121019','Bases de Dados I',6,1,1,'Introdução à modelação de dados relacionais, criação de tabelas e consultas SQL, integridade e organização da informação.','Modelação entidade-relação|SQL e consultas básicas|Integridade e normalização',1),
('18121007','Ferramentas de Apoio à Decisão',5,1,1,'Introdução à análise de informação para apoiar decisões, articulando indicadores, folhas de cálculo e interpretação de resultados.','Indicadores de apoio à decisão|Análise de cenários|Relatórios e visualização',2),
('18121003','Ferramentas de Produtividade',6,1,1,'Uso organizado de ferramentas de produtividade digital para elaborar documentos, folhas de cálculo, apresentações e colaborar em equipa.','Documentos digitais|Folhas de cálculo|Colaboração e apresentações',3),
('18121000','Matemática Aplicada',6,1,1,'Revisão e aplicação de ferramentas matemáticas úteis a problemas quantitativos, modelação e interpretação de resultados em tecnologias de informação.','Raciocínio algébrico|Funções e modelos|Aplicações quantitativas',4),
('18121001','Programação',6,1,1,'Fundamentos de programação e resolução de problemas com algoritmos, variáveis, estruturas de controlo e funções.','Algoritmos e lógica|Variáveis e controlo de fluxo|Funções e resolução de problemas',5),
('18121006','Complementos de Programação',5,1,2,'Aprofundamento da programação com modularização, estruturas de dados, depuração e boas práticas de construção de aplicações.','Modularização|Estruturas de dados|Depuração e testes',6),
('18121009','Gestão Documental e de Processos de Negócio',5,1,2,'Estudo de práticas de organização documental e representação de processos de negócio, com exemplos de fluxos digitais e colaboração.','Organização de documentos|Modelação de processos|Fluxos e automação',7),
('18121012','Gestão e Empreendedorismo',6,1,2,'Fundamentos de gestão e empreendedorismo para compreender organizações, avaliar iniciativas e organizar projetos de negócio.','Modelos de negócio|Planeamento e gestão|Inovação e empreendedorismo',8),
('18121008','Sistemas Operativos',5,1,2,'Conceitos essenciais de sistemas operativos, processos, memória, ficheiros, utilizadores e administração de sistemas.','Processos e memória|Sistemas de ficheiros|Administração e segurança',9),
('18121005','Técnicas de Comunicação',5,1,2,'Desenvolvimento de competências de comunicação escrita, oral e visual em projetos técnicos e equipas multidisciplinares.','Comunicação técnica|Apresentações|Colaboração em equipa',10),
('18121018','Tecnologias Web',5,1,2,'Fundamentos de aplicações Web, documentos HTML, estilos CSS, interatividade e comunicação cliente-servidor.','HTML e CSS|JavaScript e interatividade|Web e acessibilidade',11),
('18121017','Ambientes de Desenvolvimento Colaborativo',6,2,3,'Práticas de colaboração no desenvolvimento de software com controlo de versões, fluxos de revisão e automação básica.','Git e controlo de versões|Colaboração e revisão de código|Integração contínua',12),
('18121020','Bases de Dados II',6,2,3,'Aprofundamento da utilização de bases de dados, transações, consultas avançadas, desempenho e administração de SGBD.','SQL avançado|Transações e integridade|Otimização e administração',13),
('18121015','Business Intelligence',6,2,3,'Introdução à utilização de dados e indicadores para apoiar decisões organizacionais, incluindo preparação, análise e visualização.','Modelação analítica|Indicadores e dashboards|Tomada de decisão baseada em dados',14),
('18121014','Redes e Protocolos Internet',6,2,3,'Fundamentos de comunicação em rede, endereçamento, encaminhamento, protocolos Internet e diagnóstico de conectividade.','Camadas e protocolos|IP e encaminhamento|Serviços e diagnóstico',15),
('18121011','Web Marketing',6,2,3,'Introdução a estratégias de comunicação e marketing digital, presença na Web e avaliação de campanhas com indicadores.','Marketing digital|Conteúdos e canais|Métricas e avaliação',16),
('18121016','Estágio',30,2,4,'Componente de prática profissional supervisionada, com definição de objetivos, integração numa organização e comunicação dos resultados do trabalho.','Objetivos e planeamento do estágio|Prática em contexto profissional|Relatório e reflexão',17);

DO $guard$ BEGIN
 IF (SELECT count(*) FROM _ctesp1812)<>17 OR
    (SELECT sum(ects) FROM _ctesp1812)<>120 THEN
   RAISE EXCEPTION 'Official 2026/27 CTeSP curriculum count or ECTS mismatch';
 END IF;
 IF EXISTS(SELECT 1 FROM (
  SELECT sem, sum(ects) n FROM _ctesp1812 GROUP BY sem) s
  WHERE (s.sem=1 AND s.n<>29) OR (s.sem=2 AND s.n<>31)
     OR (s.sem=3 AND s.n<>30) OR (s.sem=4 AND s.n<>30))
 THEN RAISE EXCEPTION 'Semester ECTS did not match 2026/27 official programme'; END IF;
 IF EXISTS (SELECT 1 FROM facodi.courses WHERE code='CTESP-STI'
  AND (source_url<>'https://www.ualg.pt/curso/1812' OR ects_total<>120))
 THEN RAISE EXCEPTION 'Existing CTeSP-STI requires reconciliation before overwrite'; END IF;
END $guard$;

INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,objectives,keywords,tags,
 language,status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:ualg:1812:course')::uuid,
 'course','CTeSP em Sistemas e Tecnologias de Informação',
 'facodi-course-ctesp-sti',
 'Curso Técnico Superior Profissional de 120 ECTS da Universidade do Algarve (Faro). Percurso técnico que articula sistemas e tecnologias de informação, programação, dados, Web, gestão e business intelligence. O currículo e a identidade foram cotejados com a UAlg; as propostas de estudo complementares são editoriais da FACODI.',
 '[]'::jsonb, ARRAY['Sistemas e Tecnologias de Informação','CTeSP'],
 ARRAY['ctesp','ualg','faro','tecnologias-informacao'],'pt',
 'active',true,'import','https://www.ualg.pt/curso/1812',
 'ualg:ctesp:1812:course',
 jsonb_build_object('university_course_code','1812',
 'official_academic_year','2026/27','source_quality','ualg_official_programme',
 'official_plan_url','https://www.ualg.pt/curso/1812/plano',
 'campus','Faro','mode','presencial','schedule','diurno',
 'academic_institutions',jsonb_build_array('Instituto Superior de Engenharia','Escola Superior de Gestão, Hotelaria e Turismo'),
 'editorial_syllabus_not_official',true,
 'publication_type','official_course_identity_plus_editorial_support')
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.courses(
 id,learning_object_id,code,external_source,external_id,slug,title,normalized_title,
 summary,description_html,degree_type,language,school,source_url,plan_url,
 status,published,metadata,institution,ects_total,duration_semesters)
VALUES(
 md5('facodi:ualg:1812:course:record')::uuid,
 md5('facodi:ualg:1812:course')::uuid,
 'CTESP-STI','ualg_official','1812','ctesp-sti',
 'CTeSP em Sistemas e Tecnologias de Informação',
 'Sistemas e Tecnologias de Informação',
 'Curso Técnico Superior Profissional de 120 ECTS, em Faro, com formação prática em programação, sistemas de informação, tecnologias Web, gestão de dados e business intelligence, concluído com estágio curricular de 30 ECTS.',
 '<h2>Apresentação</h2><p>Formação de técnico superior profissional da Universidade do Algarve com 4 semestres (120 ECTS), no Instituto Superior de Engenharia e na Escola Superior de Gestão, Hotelaria e Turismo.</p><h2>Áreas de formação</h2><p>Programação, bases de dados, ferramentas de apoio à decisão, produtividade, sistemas operativos, tecnologias Web, gestão, redes, business intelligence e marketing digital.</p><h2>Utilização FACODI</h2><p>Explore as unidades curriculares oficiais de 2026/27 e os recursos complementares selecionados pela FACODI. As descrições e os roteiros de estudo editoriais não substituem as fichas oficiais das UCs. O curso inclui estágio curricular de 30 ECTS.</p>',
 'CTeSP','pt',
 'Instituto Superior de Engenharia / Escola Superior de Gestão, Hotelaria e Turismo',
 'https://www.ualg.pt/curso/1812','https://www.ualg.pt/curso/1812/plano',
 'active',true,
 jsonb_build_object('official_course_id','1812','official_academic_year','2026/27',
 'official_program_verified',true,'official_ects_total',120,'official_unit_count',17,
 'official_semester_count',4,'curriculum_review_status','approved_official_codes_and_ects',
 'official_source','https://www.ualg.pt/curso/1812/plano','campus','Faro',
 'curriculum_is_ctesp_not_licenciatura',true,
 'separate_offerings',jsonb_build_array('1932 Tecnologias Informáticas','1970 Sistemas e Tecnologias de Informação - Portimão'),
 'study_guide_is_official_syllabus',false,
 'course_publication_source','official_ualg_and_facodi_editorial_support'),
 'Universidade do Algarve',120,4
)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,objectives,keywords,tags,
 language,status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:ualg:1812:uc:'||u.code)::uuid,
 'curricular_unit',u.title,'facodi-uc-ctesp-sti-'||u.code,
 u.editorial_summary||' Roteiro de apoio elaborado pela FACODI, não uma ficha oficial de UC.',
 '[]'::jsonb,string_to_array(u.topics,'|'),
 ARRAY['ctesp','ualg','uc-'||u.code],'pt','active',true,
 'import','https://www.ualg.pt/curso/1812/plano',
 'ualg:ctesp:1812:uc:'||u.code,
 jsonb_build_object('university_course_code','1812','unit_code',u.code,
 'official_academic_year','2026/27','official_code_ects_and_term_checked',true,
 'academic_plan','https://www.ualg.pt/curso/1812/plano',
 'official_fuc_content_verified',false,'study_topics',to_jsonb(string_to_array(u.topics,'|')),
 'editorial_summary_basis','official_uc_title_and_general_subject',
 'study_guide_is_official_syllabus',false)
FROM _ctesp1812 u
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.curricular_units(
 id,learning_object_id,course_id,code,external_source,external_id,slug,
 title,normalized_title,summary,description_html,year,semester,ects,
 position,language,source_url,plan_url,status,published,metadata)
SELECT md5('facodi:ualg:1812:uc:record:'||u.code)::uuid,
 md5('facodi:ualg:1812:uc:'||u.code)::uuid,
 md5('facodi:ualg:1812:course:record')::uuid,
 u.code,'ualg_official','1812:'||u.code,u.code,u.title,u.title,
 u.editorial_summary,
 '<h2>Orientação de estudo FACODI</h2><p>'||u.editorial_summary||
 '</p><p><strong>Temas sugeridos:</strong> '||replace(u.topics,'|','; ')||
 '.</p><p>Os códigos, ECTS e semestres são do plano oficial UAlg 2026/27. Este roteiro é um apoio pedagógico independente, não a ficha oficial da UC. Verifique fontes e indicações dos docentes.</p>',
 u.yr,u.sem,u.ects,u.position,'pt',
 'https://www.ualg.pt/curso/1812/plano',
 'https://www.ualg.pt/curso/1812/plano','active',true,
 jsonb_build_object('official_academic_year','2026/27',
 'official_code_checked',true,'official_ects_checked',true,
 'official_semester_checked',true,'official_plan_url','https://www.ualg.pt/curso/1812/plano',
 'course_code','CTESP-STI','local_semester',CASE WHEN u.sem%2=1 THEN 1 ELSE 2 END,
 'study_topics',to_jsonb(string_to_array(u.topics,'|')),
 'source_quality','ualg_official_structure',
 'curriculum_review_status','approved',
 'study_guide_is_official_syllabus',false,
 'editorial_summary_basis','official_uc_title_and_general_subject',
 'official_detailed_fuc_checked',false)
FROM _ctesp1812 u
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:ualg:1812:course-uc-link:'||u.code)::uuid,
 md5('facodi:ualg:1812:course')::uuid,
 md5('facodi:ualg:1812:uc:'||u.code)::uuid,
 'contains',u.position,'structured_catalog_import',
 jsonb_build_object('relation_origin','ualg_1812_official_2026_27_plan',
 'official_code',u.code,'official_ects',u.ects,'official_global_semester',u.sem,
 'official_plan_url','https://www.ualg.pt/curso/1812/plano')
FROM _ctesp1812 u ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:ualg:1812:source:course')::uuid,
 md5('facodi:ualg:1812:course')::uuid,
 'website','ualg:1812:course',
 'https://www.ualg.pt/curso/1812','CTeSP em Sistemas e Tecnologias de Informação',
 jsonb_build_object('publisher','Universidade do Algarve',
 'academic_year','2026/27','official_plan_url','https://www.ualg.pt/curso/1812/plano')
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:ualg:1812:source:uc:'||u.code)::uuid,
 md5('facodi:ualg:1812:uc:'||u.code)::uuid,
 'website','ualg:1812:uc:'||u.code,
 'https://www.ualg.pt/curso/1812/plano',u.title,
 jsonb_build_object('publisher','Universidade do Algarve',
 'academic_year','2026/27','official_code',u.code,'official_ects',u.ects,
 'official_term',u.sem,'no_official_detailed_fuc_content_claimed',true)
FROM _ctesp1812 u ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.tags(id,slug,label,language,metadata) VALUES
(md5('facodi:tag:course:ctesp-sti')::uuid,
 'curso-ctesp-sti','CTeSP Sistemas e Tecnologias de Informação','pt',
 jsonb_build_object('source','ualg_course_1812','academic_year','2026/27'))
ON CONFLICT(slug) DO NOTHING;
INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT md5('facodi:ualg:1812:course')::uuid,t.id FROM facodi.tags t
WHERE t.slug='curso-ctesp-sti' ON CONFLICT DO NOTHING;

INSERT INTO facodi.tags(id,slug,label,language,metadata)
SELECT md5('facodi:tag:uc:'||u.code)::uuid,
 'uc-'||u.code,u.title,'pt',jsonb_build_object('source','ualg_course_1812',
 'official_code',u.code,'academic_year','2026/27')
FROM _ctesp1812 u ON CONFLICT(slug) DO NOTHING;
INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT md5('facodi:ualg:1812:uc:'||u.code)::uuid,t.id
FROM _ctesp1812 u JOIN facodi.tags t ON t.slug IN ('uc-'||u.code,'curso-ctesp-sti')
ON CONFLICT DO NOTHING;

INSERT INTO facodi.keywords(
 id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:keyword:ctesp:1812:'||u.code)::uuid,
 md5('facodi:ualg:1812:uc:'||u.code)::uuid,u.title,lower(btrim(u.title)),
 'pt',1,'official_ualg_2026_27_uc_title',
 jsonb_build_object('unit_code',u.code,'source','https://www.ualg.pt/curso/1812/plano')
FROM _ctesp1812 u ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;

INSERT INTO facodi.competencies(
 id,learning_object_id,code,title,description,level,metadata)
SELECT md5('facodi:ctesp:1812:competency:'||u.code||':'||topics.ord)::uuid,
 md5('facodi:ualg:1812:uc:'||u.code)::uuid,
 'FACODI-CTESP-'||u.code||'-'||lpad(topics.ord::text,2,'0'),
 topics.topic,
 'Tema sugerido pela FACODI para apoiar estudo de '||u.title||
 '. Não é uma competência formal oficialmente acreditada pela UAlg.',
 'introductory',
 jsonb_build_object('source','facodi.curricular_units.metadata.study_topics',
 'official_curriculum_outcome',false,'editorial_proposal',true,
 'academic_year','2026/27','university_course_code','1812',
 'unit_code',u.code,'topic_order',topics.ord)
FROM _ctesp1812 u
CROSS JOIN LATERAL unnest(string_to_array(u.topics,'|'))
 WITH ORDINALITY topics(topic,ord)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_outcomes(
 id,learning_object_id,competency_id,statement,position,metadata)
SELECT md5('facodi:ctesp:1812:outcome:'||u.code||':'||topics.ord)::uuid,
 md5('facodi:ualg:1812:uc:'||u.code)::uuid,
 md5('facodi:ctesp:1812:competency:'||u.code||':'||topics.ord)::uuid,
 CASE topics.ord WHEN 1 THEN 'Identificar os conceitos essenciais de '||topics.topic||'.'
 WHEN 2 THEN 'Relacionar os princípios de '||topics.topic||' com exemplos de aplicação.'
 ELSE 'Explorar exercícios e casos práticos sobre '||topics.topic||'.' END,
 topics.ord,
 jsonb_build_object('source','facodi.curricular_units.metadata.study_topics',
 'official_learning_outcome',false,'teacher_validated',false,
 'editorial_proposal',true,'academic_year','2026/27','unit_code',u.code)
FROM _ctesp1812 u
CROSS JOIN LATERAL unnest(string_to_array(u.topics,'|'))
 WITH ORDINALITY topics(topic,ord)
ON CONFLICT(id) DO NOTHING;

DO $verify$ BEGIN
 IF (SELECT count(*) FROM facodi.curricular_units
  WHERE course_id=md5('facodi:ualg:1812:course:record')::uuid)<>17
 OR (SELECT sum(ects) FROM facodi.curricular_units
  WHERE course_id=md5('facodi:ualg:1812:course:record')::uuid)<>120
 THEN RAISE EXCEPTION 'Incomplete new official course'; END IF;
 IF (SELECT count(*) FROM facodi.learning_outcomes o
  WHERE o.learning_object_id IN
  (SELECT learning_object_id FROM facodi.curricular_units
   WHERE course_id=md5('facodi:ualg:1812:course:record')::uuid))<>51
 THEN RAISE EXCEPTION 'Expected 51 editorial study outcomes'; END IF;
END $verify$;