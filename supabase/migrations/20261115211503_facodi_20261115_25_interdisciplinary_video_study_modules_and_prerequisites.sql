
-- FACODI editorial learning modules, sourced from already published objects.
-- The academic course/UC records remain untouched, as do original Tube videos.
CREATE TEMP TABLE _facodi_module_manifest ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset('[{"key":"physics-motion","title":"Física — grandezas, vetores e movimento","area":"physics","level":"foundation","units":["19411004","IFESCAR-ADM26-1-FISICA"],"playlists":["facodi-science-fisica-vetores-cinematica","facodi-science-fisica-dinamica-newton","facodi-science-fisica-trabalho-energia"],"docs":["facodi-reading-openstax-physics"],"note":"Grandezas, movimento, forças e energia; aprofundamento introdutório para Engenharia e ensino secundário."},{"key":"physics-thermal","title":"Física — calor, gases e termodinâmica","area":"physics","level":"foundation","units":["19411004","IFESCAR-ADM26-2-FISICA"],"playlists":["facodi-science-fisica-calor-termodinamica","facodi-playlist-ifes-mesalva-fisica"],"docs":["facodi-reading-openstax-physics"],"note":"Temperatura, calor, gases e conservação da energia."},{"key":"physics-waves","title":"Física — eletricidade, magnetismo e ondas","area":"physics","level":"intermediate","units":["19411004"],"playlists":["facodi-science-fisica-eletricidade-magnetismo","facodi-science-fisica-ondas-optica-moderna"],"docs":["facodi-reading-openstax-physics"],"note":"Circuitos, fenómenos elétricos e magnéticos, ondas e propriedades da luz."},{"key":"astro-observation","title":"Astronomia — instrumentos, luz e observação","area":"astronomy","level":"foundation","units":["FACODI-GACS18-ASTRO05"],"playlists":["facodi-astro-sequence-univesp-instrumentos-observacao","facodi-astro-sequence-astro-luz-ondas-observacao"],"docs":["facodi-astro-referencia-univesp-usp-visao-geral-i"],"note":"Telescópios, espectrografia e fundamentos de observação."},{"key":"astro-waves-life","title":"Astrofísica — ondas gravitacionais e busca de vida","area":"astronomy","level":"advanced_optional","units":["FACODI-GACS18-ASTRO09"],"playlists":["facodi-astro-sequence-ondas-gravitacionais-usp","facodi-astro-sequence-astro-fisica-espacial-ondas"],"docs":["facodi-astro-ext-2026-nasa-video","facodi-astro-ext-2026-nasa-material"],"note":"Distinguir ondas gravitacionais e astrobiologia como dois temas complementares; inclui fontes NASA para vida no Universo."},{"key":"algebra-matrices","title":"Álgebra Linear — matrizes e sistemas","area":"mathematics","level":"foundation","units":["19411003"],"playlists":["facodi-math-algebra-matrizes-sistemas"],"docs":["facodi-math-guide-algebra-matrizes-sistemas","facodi-reading-mit-linear"],"note":"Matrizes, determinantes, sistemas de equações e aplicações."},{"key":"algebra-vectors","title":"Álgebra Linear — espaços e transformações","area":"mathematics","level":"intermediate","units":["19411003"],"playlists":["facodi-math-algebra-vetores-transformacoes"],"docs":["facodi-math-guide-algebra-vetores-transformacoes"],"note":"Vetores, bases, transformações lineares e autovalores."},{"key":"analysis1-functions","title":"Análise I — funções, limites e continuidade","area":"mathematics","level":"foundation","units":["19411002"],"playlists":["facodi-math-funcoes-graficos","facodi-math-limites-continuidade"],"docs":["facodi-math-guide-funcoes-graficos","facodi-math-guide-limites-continuidade"],"note":"Domínio, interpretação de gráficos, limites e continuidade."},{"key":"analysis1-calculus","title":"Análise I — derivadas e integração","area":"mathematics","level":"intermediate","units":["19411002"],"playlists":["facodi-math-derivadas-regras","facodi-math-integracao-tecnicas"],"docs":["facodi-math-guide-derivadas-regras","facodi-math-guide-integracao-tecnicas"],"note":"Taxas de variação, regras de derivação e técnicas de integração."},{"key":"analysis2-multi","title":"Análise II — funções multivariáveis e gradiente","area":"mathematics","level":"intermediate","units":["19411008"],"playlists":["facodi-math-multivariaveis-introducao","facodi-math-multivariaveis-gradiente"],"docs":["facodi-math-guide-multivariaveis-introducao","facodi-math-guide-multivariaveis-gradiente"],"note":"Limites, derivadas parciais, gradiente e interpretação geométrica."},{"key":"analysis2-integrals","title":"Análise II — integrais duplas e aplicações","area":"mathematics","level":"advanced_optional","units":["19411008"],"playlists":["facodi-math-multivariaveis-integrais-duplas","facodi-math-integracao-geometrica"],"docs":["facodi-math-guide-multivariaveis-integrais-duplas"],"note":"Cálculo integral em mais de uma variável e aplicações geométricas."},{"key":"statistics-basics","title":"Estatística — dados, probabilidade e distribuições","area":"statistics","level":"foundation","units":["19411018"],"playlists":["facodi-math-estatistica-descritiva","facodi-math-probabilidade-bayes","facodi-math-probabilidade-distribuicoes"],"docs":["facodi-reading-openstax-stats"],"note":"Descrição de dados, probabilidade condicional e distribuições."},{"key":"statistics-inference","title":"Estatística — inferência e regressão","area":"statistics","level":"intermediate","units":["19411018"],"playlists":["facodi-math-estatistica-intervalos","facodi-math-estatistica-testes","facodi-math-estatistica-regressao"],"docs":["facodi-math-guide-estatistica-testes"],"note":"Intervalos de confiança, testes de hipóteses e regressão."},{"key":"db-relational","title":"Bases de Dados I — modelo relacional e SQL","area":"databases","level":"foundation","units":["19411012","18121019"],"playlists":["facodi-playlist-sql-relacional-fundamentos","facodi-db-sql-consultas-funcoes-2026"],"docs":["facodi-reading-postgres-tutorial"],"note":"Modelação relacional e consultas SQL; comparar comandos SQL Server e PostgreSQL."},{"key":"db-transactions","title":"Bases de Dados II — transações e objetos","area":"databases","level":"intermediate","units":["19411017","18121020"],"playlists":["facodi-db-sql-transacoes-objetos-2026","facodi-playlist-sql-avancado-e-migracoes"],"docs":["facodi-reading-postgres-tutorial"],"note":"Transações, atualização de esquemas, integridade e procedimentos."},{"key":"db-maintenance","title":"Bases de Dados II — operação, índices e backups","area":"databases","level":"intermediate","units":["19411017","18121020"],"playlists":["facodi-db-sql-funcoes-manutencao-2026","facodi-db-sql-casos-praticos-2026"],"docs":["facodi-reading-ctesp1812-postgresperf"],"note":"Operação de SGBD, desempenho, relatórios e manutenção; sem equivalência entre T-SQL e PostgreSQL."},{"key":"collab-git","title":"Desenvolvimento colaborativo — Git e revisão","area":"software","level":"foundation","units":["19411001","18121017"],"playlists":["facodi-playlist-git-fundamentos-colaboracao","facodi-playlist-python-moderno-ambientes-e-dependencias"],"docs":["facodi-reading-pro-git"],"note":"Versionamento, histórico, branches, revisão e gestão de dependências."},{"key":"collab-cicd","title":"Desenvolvimento colaborativo — testes e CI/CD","area":"software","level":"intermediate","units":["19411001","18121017"],"playlists":["facodi-playlist-ci-cd-ambientes-colaborativos","facodi-playlist-qualidade-testes-software"],"docs":["facodi-reading-github-actions"],"note":"Testes, integração contínua, automatização e critérios de qualidade."},{"key":"typography-basics","title":"Tipografia I — legibilidade e composição","area":"design","level":"foundation","units":["14541153"],"playlists":["facodi-playlist-tipografia-fundamentos-ldcom"],"docs":["facodi-reading-google-fonts"],"note":"Seleção tipográfica, hierarquia, espaçamento e legibilidade."},{"key":"typography-editorial","title":"Tipografia II — sistemas editoriais e produção","area":"design","level":"intermediate","units":["14541155"],"playlists":["facodi-playlist-tipografia-editorial-ldcom"],"docs":["facodi-reading-google-fonts"],"note":"Composição editorial, alinhamento, grelhas e preparação tipográfica."},{"key":"chemistry-bonds","title":"Química — ligações e interações intermoleculares","area":"chemistry","level":"foundation","units":["IFESCAR-ADM26-1-QUIMICA"],"playlists":["facodi-playlist-ifes-mesalva-ligacoes-quimicas"],"docs":["facodi-guide-ifes-mesalva-ligacoes-quimicas"],"note":"Ligações químicas e interações em materiais."},{"key":"chemistry-thermo","title":"Química — gases e termoquímica","area":"chemistry","level":"intermediate","units":["IFESCAR-ADM26-2-QUIMICA"],"playlists":["facodi-science-quimica-termoquimica-gases"],"docs":["ifes-admin2026-resource-ifes-admin2026-phet"],"note":"Estados gasosos, transferência de energia e termoquímica; referências de simulação."},{"key":"chemistry-kinetics","title":"Química — cinética e equilíbrio","area":"chemistry","level":"intermediate","units":["IFESCAR-ADM26-3-QUIMICA"],"playlists":["facodi-science-quimica-cinetica-equilibrio-eletro"],"docs":["ifes-admin2026-resource-ifes-admin2026-phet"],"note":"Velocidade de reações, equilíbrio e introdução à eletroquímica."},{"key":"biology-genetics","title":"Biologia — genética e hereditariedade","area":"biology","level":"foundation","units":["IFESCAR-ADM26-2-BIOLOGIA","IFESCAR-ADM26-3-BIOLOGIA"],"playlists":["facodi-playlist-ifes-mesalva-genetica","facodi-science-biologia-genetica-hereditariedade"],"docs":["facodi-guide-ifes-mesalva-genetica"],"note":"DNA, RNA, expressão genética e noções de hereditariedade."},{"key":"biology-ecology","title":"Biologia — biodiversidade e ecologia","area":"biology","level":"intermediate","units":["IFESCAR-ADM26-3-BIOLOGIA"],"playlists":["facodi-science-biologia-evolucao-ecologia","facodi-playlist-ifes-kurzgesagt-biosfera"],"docs":["facodi-guide-ifes-kurzgesagt-biosfera"],"note":"Evolução, relações ecológicas, biodiversidade e sustentabilidade."}]'::jsonb)
 AS x(key text,title text,area text,level text,units jsonb,playlists jsonb,docs jsonb,note text);
CREATE TEMP TABLE _facodi_module_uc ON COMMIT DROP AS
SELECT m.key,u.value code FROM _facodi_module_manifest m
CROSS JOIN LATERAL jsonb_array_elements_text(m.units) u(value);
CREATE TEMP TABLE _facodi_module_playlist ON COMMIT DROP AS
SELECT m.key,p.value slug,p.ordinality::integer seq FROM _facodi_module_manifest m
CROSS JOIN LATERAL jsonb_array_elements_text(m.playlists) WITH ORDINALITY p(value,ordinality);
CREATE TEMP TABLE _facodi_module_reference ON COMMIT DROP AS
SELECT m.key,d.value slug,d.ordinality::integer seq FROM _facodi_module_manifest m
CROSS JOIN LATERAL jsonb_array_elements_text(m.docs) WITH ORDINALITY d(value,ordinality);
CREATE TEMP TABLE _facodi_module_progression ON COMMIT DROP AS
SELECT j.value->>0 from_key,j.value->>1 to_key
FROM jsonb_array_elements('[["physics-motion","physics-thermal"],["physics-motion","physics-waves"],["algebra-matrices","algebra-vectors"],["analysis1-functions","analysis1-calculus"],["analysis1-calculus","analysis2-multi"],["analysis2-multi","analysis2-integrals"],["statistics-basics","statistics-inference"],["db-relational","db-transactions"],["db-transactions","db-maintenance"],["collab-git","collab-cicd"],["typography-basics","typography-editorial"],["chemistry-bonds","chemistry-thermo"],["chemistry-bonds","chemistry-kinetics"]]'::jsonb) j(value);

DO $validate$ DECLARE missing text; BEGIN
IF (SELECT count(*) FROM _facodi_module_manifest)<>25 OR
   (SELECT count(*) FROM _facodi_module_progression)<>13 OR
   EXISTS(SELECT 1 FROM _facodi_module_manifest GROUP BY key HAVING count(*)>1)
THEN RAISE EXCEPTION 'Module manifest size or duplicate mismatch'; END IF;
IF EXISTS(SELECT 1 FROM _facodi_module_uc u LEFT JOIN facodi.curricular_units cu ON cu.code=u.code
 LEFT JOIN facodi.courses c ON c.id=cu.course_id
 WHERE cu.id IS NULL OR cu.status<>'active' OR NOT cu.published OR NOT c.published)
THEN RAISE EXCEPTION 'Unpublished or unavailable curriculum unit'; END IF;
IF EXISTS(SELECT 1 FROM _facodi_module_playlist p LEFT JOIN facodi.learning_objects obj ON obj.slug=p.slug
 WHERE obj.id IS NULL OR NOT obj.published OR obj.status<>'active' OR obj.object_type<>'playlist'
 OR NOT EXISTS(SELECT 1 FROM facodi.learning_object_relations r JOIN facodi.learning_objects video
 ON video.id=r.child_object_id
 WHERE r.parent_object_id=obj.id AND r.relation_type='contains' AND video.object_type='video'
 AND video.published))
THEN RAISE EXCEPTION 'Missing or empty published video sequence'; END IF;
IF EXISTS(SELECT 1 FROM _facodi_module_reference d LEFT JOIN facodi.learning_objects obj ON obj.slug=d.slug
 WHERE obj.id IS NULL OR NOT obj.published OR obj.status<>'active'
 OR obj.object_type NOT IN ('external_resource','document','book'))
THEN RAISE EXCEPTION 'Module reference missing or unpublished'; END IF;
IF EXISTS(SELECT 1 FROM _facodi_module_progression pr
 LEFT JOIN _facodi_module_manifest a ON a.key=pr.from_key
 LEFT JOIN _facodi_module_manifest b ON b.key=pr.to_key
 WHERE a.key IS NULL OR b.key IS NULL OR a.key=b.key)
THEN RAISE EXCEPTION 'Invalid module progression'; END IF;
IF EXISTS(SELECT 1 FROM _facodi_module_manifest m
 JOIN facodi.learning_objects existing ON existing.slug='facodi-modulo-20261115-'||m.key)
THEN RAISE EXCEPTION 'Modules already exist; do not blindly reimport'; END IF;
END $validate$;

INSERT INTO facodi.learning_objects (
 id,object_type,title,slug,description,objectives,keywords,tags,language,status,
 published,source_type,source_id,metadata)
SELECT md5('facodi:module:learning-path:20261115:'||m.key)::uuid,
'module',m.title,'facodi-modulo-20261115-'||m.key,
'Percurso editorial de estudo FACODI com sequências de vídeo e referências externas já catalogadas. '||
m.note||' A ordem é sugestão didática, não conteúdo homologado pela instituição.',
jsonb_build_array('Percorrer as sequências de vídeo na ordem proposta.',
'Consultar os materiais complementares nas suas fontes originais.',
'Relacionar os conceitos com as UCs do plano e as dependências conceituais, sem avaliação ou certificação automática.'),
ARRAY[m.title,'FACODI','percurso educativo',m.area],
ARRAY['facodi','modulo-de-estudo','curadoria',m.area,m.level,'sem-exercicios'],
'pt-PT','active',true,'generated','facodi:module:20261115:'||m.key,
jsonb_build_object(
 'module_kind','curated_existing_learning_objects',
 'domain',m.area,'learning_level',m.level,'module_version',1,
 'path_order','editorial_progression',
 'curation_method','review_of_existing_video_playlist_titles_and_official_external_links',
 'source_playlists',m.playlists,'source_documents',m.docs,
 'source_units',m.units,
 'curation_note',m.note,
 'review_scope','existing_published_catalog_metadata',
 'full_video_review_completed',false,'copyright_rehosting_allowed',false,
 'teacher_approved',false,'official_curriculum_status','independent_supplement_not_homologated',
 'generated_exercises',false,
 'curation_batch','facodi_interdisciplinary_module_graph_20261115')
FROM _facodi_module_manifest m
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:module:belongs:20261115:'||m.key||':'||u.code)::uuid,
 cu.learning_object_id,md5('facodi:module:learning-path:20261115:'||m.key)::uuid,
 'contains',77500+row_number() OVER(PARTITION BY cu.id ORDER BY m.key)::integer,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
 'curation_scope','UC_contains_supplementary_module','teacher_approved',false,
 'curation_batch','facodi_interdisciplinary_module_graph_20261115')
FROM _facodi_module_uc u JOIN _facodi_module_manifest m ON m.key=u.key
JOIN facodi.curricular_units cu ON cu.code=u.code
JOIN facodi.courses c ON c.id=cu.course_id AND c.published
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:module:video-seq:20261115:'||p.key||':'||p.slug)::uuid,
 md5('facodi:module:learning-path:20261115:'||p.key)::uuid,
 obj.id,'contains',p.seq,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
 'material_role','primary_video_sequence','teacher_approved',false,
 'curation_batch','facodi_interdisciplinary_module_graph_20261115')
FROM _facodi_module_playlist p JOIN facodi.learning_objects obj ON obj.slug=p.slug
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:module:reference:20261115:'||d.key||':'||d.slug)::uuid,
 md5('facodi:module:learning-path:20261115:'||d.key)::uuid,
 obj.id,'contains',500+d.seq,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
 'material_role','supplementary_reference','teacher_approved',false,
 'curation_batch','facodi_interdisciplinary_module_graph_20261115')
FROM _facodi_module_reference d JOIN facodi.learning_objects obj ON obj.slug=d.slug
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Direction: foundational module prerequisite_of follow-up module.
INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:module:prerequisite:20261115:'||pr.from_key||':'||pr.to_key)::uuid,
 md5('facodi:module:learning-path:20261115:'||pr.from_key)::uuid,
 md5('facodi:module:learning-path:20261115:'||pr.to_key)::uuid,
 'prerequisite_of',1,'editorial_module_graph_20261115',
 jsonb_build_object('review_status','approved','review_scope','module_content_progression',
 'prerequisite_kind','suggested_conceptual_foundation_not_university_requirement',
 'teacher_approved',false,'curation_batch','facodi_interdisciplinary_module_graph_20261115')
FROM _facodi_module_progression pr
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $check$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects
 WHERE object_type='module' AND metadata->>'curation_batch'='facodi_interdisciplinary_module_graph_20261115')<>25
 OR (SELECT count(*) FROM facodi.learning_object_relations
 WHERE created_by_mechanism='editorial_module_graph_20261115' AND relation_type='prerequisite_of')<>13
 THEN RAISE EXCEPTION 'New module count or progression count mismatch'; END IF;
END $check$;
