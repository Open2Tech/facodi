
CREATE TEMP TABLE _ufes83_refs2 ON COMMIT DROP AS
 SELECT * FROM jsonb_to_recordset($ufesrefs2$[{"key":"philosophy-education","title":"Stanford Encyclopedia — Filosofia da Educação","url":"https://plato.stanford.edu/entries/education-philosophy/","publisher":"Stanford Encyclopedia of Philosophy","lang":"en","summary":"Estudo introdutório às correntes filosóficas, finalidades e fundamentos da educação."},{"key":"openlearn-social","title":"OpenLearn — Introdução às Ciências Sociais","url":"https://www.open.edu/openlearn/society-politics-law/you-and-your-world-introducing-the-social-sciences/content-section-0","publisher":"The Open University","lang":"en","summary":"Curso gratuito de consulta sobre práticas sociais, instituições, diversidade e análise crítica."},{"key":"unesco-antiracist","title":"UNESCO — Diretrizes para materiais antirracistas","url":"https://www.unesco.org/en/articles/unmasking-racism-guidelines-educational-materials","publisher":"UNESCO","lang":"en","summary":"Orientações para evitar preconceitos e discriminação em materiais pedagógicos e curriculares."},{"key":"ines-libras","title":"INES — Curso de Língua Brasileira de Sinais","url":"https://www.gov.br/ines/pt-br/assuntos/libras/sobre-o-curso-de-libras","publisher":"Instituto Nacional de Educação de Surdos","lang":"pt","summary":"Informações públicas sobre aprendizagem de Libras e modalidades de formação."},{"key":"british-library-literature","title":"British Library — Discovering Literature","url":"https://www.bl.uk/about/learn/learning-resources/about-discovering-literature","publisher":"British Library","lang":"en","summary":"Apresentação do acervo interpretativo de literatura britânica e inglesa; parte dos recursos foi afetada por indisponibilidade histórica do serviço."},{"key":"openlearn-literature","title":"OpenLearn — Cursos gratuitos de literatura inglesa","url":"https://www.open.edu/openlearn/history-the-arts/explore-our-english-literature-free-courses","publisher":"The Open University","lang":"en","summary":"Seleção de cursos abertos de leitura crítica e análise de textos literários."},{"key":"folger-shakespeare","title":"Folger Shakespeare Library — obras e recursos","url":"https://www.folger.edu/explore/shakespeares-works/","publisher":"Folger Shakespeare Library","lang":"en","summary":"Fontes sobre obras de Shakespeare, contextos, linguagem e atividades pedagógicas."},{"key":"openlearn-english-history","title":"OpenLearn — História e evolução da língua inglesa","url":"https://www.open.edu/openlearn/history-the-arts/english-language/exploring-the-english-language/content-section-0","publisher":"The Open University","lang":"en","summary":"Curso gratuito sobre mudanças históricas, usos e contextos sociopolíticos do inglês."},{"key":"openlearn-machine-translation","title":"OpenLearn — Tradução automática no ensino de línguas","url":"https://www.open.edu/openlearn/languages/machine-translation-language-learning-and-teaching/content-section-overview","publisher":"The Open University","lang":"en","summary":"Curso aberto de exploração crítica de ferramentas de tradução automática em práticas educativas."},{"key":"openlearn-translation","title":"OpenLearn — Tradução como atividade profissional","url":"https://www.open.edu/openlearn/languages/learning-languages/translation-career/content-section-0","publisher":"The Open University","lang":"en","summary":"Introdução às competências, atividades e decisões da profissão de tradução."},{"key":"openlearn-culture","title":"OpenLearn — Línguas e culturas","url":"https://www.open.edu/openlearn/languages/exploring-languages-and-cultures/content-section-0","publisher":"The Open University","lang":"en","summary":"Material sobre interculturalidade, línguas, comunidades e comunicação em contextos pluriculturais."},{"key":"ufes-neples","title":"UFES NEPLES — Acervo de Literatura do Espírito Santo","url":"https://blog.ufes.br/neples/?page_id=326","publisher":"UFES — Núcleo de Estudos e Pesquisas da Literatura do Espírito Santo","lang":"pt","summary":"Inventário de publicações, estudos e coleções relacionadas à literatura capixaba; consultar o núcleo para regras de acesso."},{"key":"ufes-periodicos","title":"UFES Letras — Periódicos e publicações","url":"https://letras.ufes.br/pt-br/periodicos-e-publicacoes","publisher":"UFES — Programa de Pós-Graduação em Letras","lang":"pt","summary":"Informações e referências a periódicos, livros e pesquisas produzidos no âmbito de Letras."},{"key":"openlearn-languages","title":"OpenLearn — Cursos abertos de línguas","url":"https://www.open.edu/openlearn/languages/free-courses","publisher":"The Open University","lang":"en","summary":"Catálogo de cursos de línguas e contextos comunicativos para aprofundamento individual."},{"key":"openlearn-literature-new","title":"OpenLearn — Literatura e escrita criativa","url":"https://www.open.edu/openlearn/course/view.php?id=15295","publisher":"The Open University","lang":"en","summary":"Seleção adicional de cursos de crítica, leitura literária e escrita criativa."}]$ufesrefs2$::jsonb)
 AS x(key text,title text,url text,publisher text,lang text,summary text);
CREATE TEMP TABLE _ufes83_links2 ON COMMIT DROP AS
 SELECT * FROM jsonb_to_recordset($ufeslinks2$[{"key":"philosophy-education","code":"EPS13106"},{"key":"openlearn-social","code":"CSO03274"},{"key":"openlearn-social","code":"PSI00764"},{"key":"openlearn-social","code":"EPS13133"},{"key":"unesco-antiracist","code":"TEP13690"},{"key":"unesco-antiracist","code":"TEP13131"},{"key":"unesco-antiracist","code":"LET13955"},{"key":"unesco-antiracist","code":"LET13947"},{"key":"unesco-antiracist","code":"LET13960"},{"key":"unesco-antiracist","code":"LET13959"},{"key":"ines-libras","code":"LCE13698"},{"key":"british-library-literature","code":"LET13923"},{"key":"british-library-literature","code":"LET13922"},{"key":"british-library-literature","code":"LET13961"},{"key":"british-library-literature","code":"LET13963"},{"key":"british-library-literature","code":"LET13968"},{"key":"british-library-literature","code":"LET13959"},{"key":"british-library-literature","code":"LET13971"},{"key":"british-library-literature","code":"LET13973"},{"key":"british-library-literature","code":"LET13970"},{"key":"british-library-literature","code":"LET13972"},{"key":"openlearn-literature","code":"LET13923"},{"key":"openlearn-literature","code":"LET13930"},{"key":"openlearn-literature","code":"LET13961"},{"key":"openlearn-literature","code":"LET13968"},{"key":"openlearn-literature","code":"LET13963"},{"key":"openlearn-literature","code":"LET13970"},{"key":"openlearn-literature","code":"LET13971"},{"key":"openlearn-literature","code":"LET13972"},{"key":"openlearn-literature","code":"LET13973"},{"key":"folger-shakespeare","code":"LET13925"},{"key":"folger-shakespeare","code":"LET13964"},{"key":"folger-shakespeare","code":"LET13930"},{"key":"folger-shakespeare","code":"LET13969"},{"key":"folger-shakespeare","code":"LET13923"},{"key":"openlearn-english-history","code":"LET13922"},{"key":"openlearn-english-history","code":"LET09456"},{"key":"openlearn-english-history","code":"LET13935"},{"key":"openlearn-english-history","code":"LET13953"},{"key":"openlearn-machine-translation","code":"LET13924"},{"key":"openlearn-machine-translation","code":"LET13929"},{"key":"openlearn-machine-translation","code":"LET13938"},{"key":"openlearn-machine-translation","code":"LET13950"},{"key":"openlearn-translation","code":"LET13924"},{"key":"openlearn-translation","code":"LET13938"},{"key":"openlearn-translation","code":"LET13929"},{"key":"openlearn-culture","code":"LET13947"},{"key":"openlearn-culture","code":"LET13955"},{"key":"openlearn-culture","code":"LET13960"},{"key":"openlearn-culture","code":"LET13959"},{"key":"openlearn-culture","code":"LET13963"},{"key":"openlearn-culture","code":"LET13950"},{"key":"openlearn-culture","code":"LET10553"},{"key":"ufes-neples","code":"LET13974"},{"key":"ufes-neples","code":"LET13971"},{"key":"ufes-periodicos","code":"LET13936"},{"key":"ufes-periodicos","code":"LET13970"},{"key":"ufes-periodicos","code":"LET13968"},{"key":"ufes-periodicos","code":"LET13974"},{"key":"ufes-periodicos","code":"LET13971"},{"key":"ufes-periodicos","code":"LET13959"},{"key":"openlearn-languages","code":"LET10553"},{"key":"openlearn-languages","code":"LET13958"},{"key":"openlearn-literature-new","code":"LET13972"},{"key":"openlearn-literature-new","code":"LET13971"},{"key":"openlearn-literature-new","code":"LET13970"},{"key":"openlearn-literature-new","code":"LET13968"},{"key":"openlearn-literature-new","code":"LET13973"},{"key":"openlearn-literature-new","code":"LET13961"}]$ufeslinks2$::jsonb)
 AS x(key text,code text);

DO $guard$ BEGIN
 IF (SELECT count(*) FROM _ufes83_refs2)<>15
 OR (SELECT count(*) FROM _ufes83_links2)<>69
 OR EXISTS(SELECT 1 FROM _ufes83_refs2 WHERE url NOT LIKE 'https://%')
 THEN RAISE EXCEPTION 'Invalid verified references';END IF;
 IF EXISTS(SELECT 1 FROM _ufes83_links2 z
 LEFT JOIN _ufes83_refs2 r ON r.key=z.key
 LEFT JOIN facodi.curricular_units u ON u.code=z.code
 AND u.course_id=md5('facodi:ufes:83:2019:course')::uuid
 WHERE r.key IS NULL OR u.id IS NULL OR NOT u.published)
 THEN RAISE EXCEPTION 'Nonexistent UFES curricular code';END IF;
END $guard$;

INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,language,status,published,source_type,
 source_url,source_id,tags,metadata)
SELECT md5('facodi:ufes:83:2019:reading:'||r.key)::uuid,
 'external_resource',r.title,'ufes83-reading-'||r.key,
 r.summary||' Referência editorial de consulta: a FACODI não reproduz o conteúdo de terceiros nem a apresenta como bibliografia oficial da UFES.',
 r.lang,'active',true,'external',r.url,r.key,
 ARRAY['UFES','Letras Inglês','leitura complementar'],
 jsonb_build_object('source_publisher',r.publisher,'page_verified_on','2026-11-14',
 'original_url',r.url,'third_party_material_not_copied',true,
 'source_license_verified',false,'official_ufes_bibliography',false,
 'resource_purpose','study_reference','curation_batch','ufes83_ppc2019_readings_round2')
FROM _ufes83_refs2 r
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:ufes:83:2019:reading-source:'||r.key)::uuid,
 md5('facodi:ufes:83:2019:reading:'||r.key)::uuid,'website',r.key,r.url,r.title,
 jsonb_build_object('publisher',r.publisher,'checked_on','2026-11-14',
 'external_reference_only',true)
FROM _ufes83_refs2 r
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes:83:2019:reading-link:'||x.key||':'||x.code)::uuid,
 md5('facodi:ufes:83:2019:uc-object:'||x.code)::uuid,
 md5('facodi:ufes:83:2019:reading:'||x.key)::uuid,
 'contains',51000+row_number() OVER (PARTITION BY x.code ORDER BY x.key)::integer,
 'verified_external_reading_curation',
 jsonb_build_object('review_status','approved','review_scope','external_landing_page',
 'resource_purpose','study_reference',
 'curation_batch','ufes83_ppc2019_readings_round2',
 'ufes_official_recommendation',false,'target_unit_code',x.code)
FROM _ufes83_links2 x
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT DISTINCT md5('facodi:ufes:83:2019:reading:'||x.key)::uuid,t.id
FROM _ufes83_links2 x JOIN facodi.tags t ON t.slug='ufes-ingles-'||lower(x.code)
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT md5('facodi:ufes:83:2019:reading:'||r.key)::uuid,t.id
FROM _ufes83_refs2 r JOIN facodi.tags t ON t.slug='curso-ufes-letras-ingles'
ON CONFLICT DO NOTHING;

INSERT INTO facodi.keywords(
 id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:ufes:83:2019:reading-keyword:'||r.key)::uuid,
 md5('facodi:ufes:83:2019:reading:'||r.key)::uuid,
 r.title,lower(btrim(r.title)),r.lang,0.95,
 'external_reference_title',jsonb_build_object('original_url',r.url)
FROM _ufes83_refs2 r
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;

DO $final$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects
 WHERE slug LIKE 'ufes83-reading-%' AND published)<>35
 THEN RAISE EXCEPTION 'Expected exactly 35 UFES curated external references';END IF;
 IF (SELECT count(*) FROM facodi.learning_object_relations
 WHERE metadata->>'curation_batch'='ufes83_ppc2019_readings_round2')<>69
 THEN RAISE EXCEPTION 'Missing relationships';END IF;
END $final$;