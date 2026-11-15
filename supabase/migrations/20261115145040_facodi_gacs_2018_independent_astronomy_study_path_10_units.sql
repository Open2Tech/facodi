
CREATE TEMP TABLE _astro_units ON COMMIT DROP AS SELECT * FROM jsonb_to_recordset($astro_topics$[{"code":"ASTRO01","title":"Astronomia, investigação científica e GACS","focus":"Ciência, observação do céu e extensão no Ifes Cariacica.","topics":["Evidências e observações","História das atividades do GACS","Divulgação científica"],"activity":"Preparar mapa de perguntas sobre o céu com fontes consultadas.","questions":["Como avaliar uma afirmação astronómica?","O que distingue extensão universitária de disciplina? "],"sources":["gacs","inpe_material"],"videos":["aGBvv4DPXK8"]},{"code":"ASTRO02","title":"Esfera celeste e orientação astronómica","focus":"Constelações, horizonte, movimentos aparentes e localização de astros.","topics":["Horizonte e pontos cardeais","Movimento diurno aparente","Coordenadas do céu"],"activity":"Criar registo noturno de orientação sem apontar instrumentos para o Sol.","questions":["Por que as estrelas parecem mover-se?","Como a latitude altera a observação?"],"sources":["inpe_book","inpe_material"],"videos":[]},{"code":"ASTRO03","title":"Sistema Sol–Terra–Lua","focus":"Fases lunares, estações do ano, eclipses e marés.","topics":["Inclinação do eixo terrestre","Fases da Lua","Eclipses e marés"],"activity":"Representar em esquema a geometria do Sol, Terra e Lua.","questions":["Qual é a causa das fases da Lua?","Por que não há eclipse em todas as luas novas?"],"sources":["inpe_book","inpe_material","ifes_ementa"],"videos":["NnwSeQ5otM4"]},{"code":"ASTRO04","title":"Sistema Solar e exploração espacial","focus":"Planetas, corpos menores, órbitas e missões.","topics":["Planetas e asteroides","Órbitas e gravitação","Exploração espacial"],"activity":"Organizar linha do tempo de descobertas ou missões com referências.","questions":["O que distingue planeta e planeta anão?","Como uma nave mantém uma órbita?"],"sources":["inpe_book","inpe_material"],"videos":["lNB8x2k0YNg","1fT1nVfbW-4","NnwSeQ5otM4"]},{"code":"ASTRO05","title":"Luz, espectro e telescópios","focus":"Luz como fonte de informação na astrofísica observacional.","topics":["Espectro eletromagnético","Telescópios e detectores","Análise da radiação"],"activity":"Comparar imagens astronómicas da mesma região em faixas distintas.","questions":["Por que observar em diferentes comprimentos de onda?","Como estimar a temperatura estelar pela cor?"],"sources":["inpe_book","inpe_material"],"videos":["5cBSgGjLczc","VNTBHXDarb4"]},{"code":"ASTRO06","title":"O Sol e a evolução das estrelas","focus":"Atividade solar, formação de estrelas, fusão e estágios finais.","topics":["Fusão e energia solar","Nascimento de estrelas","Anãs brancas, estrelas de neutrões e buracos negros"],"activity":"Criar diagrama conceptual de ciclos de vida estelares.","questions":["Todas as estrelas se tornam buracos negros?","O que sustenta uma estrela estável?"],"sources":["inpe_book","inpe_material"],"videos":["SraCw6iqu3E","aGBvv4DPXK8"]},{"code":"ASTRO07","title":"Via Láctea e outras galáxias","focus":"Escalas cósmicas, galáxias, distâncias e estruturas.","topics":["Via Láctea","Distâncias astronómicas","Galáxias e sua evolução"],"activity":"Produzir uma escala comentada de distâncias cósmicas.","questions":["Como sabemos que há outras galáxias?","Por que ver longe é observar o passado?"],"sources":["inpe_book","inpe_material"],"videos":["rXt6H-WypYM"]},{"code":"ASTRO08","title":"Cosmologia e expansão do Universo","focus":"Desvio para o vermelho, expansão, radiação de fundo e modelos.","topics":["Lei de Hubble–Lemaître","Radiação cósmica de fundo","Modelos cosmológicos"],"activity":"Explicar um gráfico qualitativo entre distância e afastamento de galáxias.","questions":["Que observações sustentam a expansão do Universo?","O Big Bang descreve uma explosão no espaço?"],"sources":["inpe_book","inpe_material"],"videos":["rXt6H-WypYM","aGBvv4DPXK8"]},{"code":"ASTRO09","title":"Ondas gravitacionais e astrobiologia","focus":"Ciência contemporânea, detecção e busca de condições de vida.","topics":["Ondas gravitacionais","Detecção astronómica","Habitabilidade e astrobiologia"],"activity":"Analisar uma notícia científica e distinguir evidências e hipóteses.","questions":["Como uma onda gravitacional é detectada?","Habitabilidade significa vida confirmada?"],"sources":["inpe_book","inpe_material"],"videos":["mbykpkwPSws"]},{"code":"ASTRO10","title":"Oficinas e divulgação científica do GACS","focus":"Práticas de observação segura, escalas e comunicação pública.","topics":["Observação segura do céu","Oficinas de escalas","Comunicação científica acessível"],"activity":"Planear uma oficina com segurança, referências e adaptação a diferentes públicos; não observar o Sol diretamente sem filtros certificados.","questions":["Quais são os riscos da observação solar?","Como adaptar uma oficina a públicos diferentes?"],"sources":["gacs","inpe_material","inpe_book"],"videos":["lNB8x2k0YNg"]}]$astro_topics$::jsonb)
 AS x(code text,title text,focus text,topics jsonb,activity text,questions jsonb,sources jsonb,videos jsonb);
CREATE TEMP TABLE _astro_sources ON COMMIT DROP AS SELECT * FROM jsonb_to_recordset($astro_sources$[{"key":"gacs","name":"GACS — Grupo Astronômico Carl Sagan no Ifes Cariacica","url":"https://cariacica.ifes.edu.br/extensao-pesquisa-e-pos-graduacao/extensao?showall=1","kind":"website"},{"key":"inpe_book","name":"INPE — Introdução à Astronomia e Astrofísica, apostila de 2018","url":"https://www.inpe.br/ciaa2018/arquivos/pdfs/apostila_completa_2018.pdf","kind":"document"},{"key":"inpe_material","name":"INPE — materiais, oficinas e apresentações da edição de 2018","url":"https://antigo.inpe.br/ciaa2018/material-curso.php","kind":"website"},{"key":"inpe_event","name":"INPE — Curso de Introdução à Astronomia e Astrofísica 2018","url":"https://www.inpe.br/ciaa2018/","kind":"website"},{"key":"ifes_grade","name":"Ifes — grade curricular 2018 da Licenciatura em Física","url":"https://cariacica.ifes.edu.br/images/stories/Artigos/2020/Grade_Curricular_Licenciatura_NOVA_2020.pdf","kind":"document"},{"key":"ifes_ementa","name":"Ifes — ementário da Licenciatura em Física","url":"https://cariacica.ifes.edu.br/images/stories/Artigos/2020/Ap%C3%AAndice_I_-_Ement%C3%A1rio_Licenciatura_F%C3%ADsica.pdf","kind":"document"}]$astro_sources$::jsonb)
 AS x(key text,name text,url text,kind text);
DO $pre$ BEGIN
 IF (SELECT count(*) FROM _astro_units)<>10 OR (SELECT count(DISTINCT code) FROM _astro_units)<>10
 OR (SELECT count(*) FROM _astro_sources)<>6 THEN RAISE EXCEPTION 'GACS inventory mismatch';END IF;
 IF EXISTS(SELECT 1 FROM _astro_units x CROSS JOIN LATERAL jsonb_array_elements_text(x.sources) m(k)
 LEFT JOIN _astro_sources s ON s.key=m.k WHERE s.key IS NULL) THEN RAISE EXCEPTION 'Unknown source';END IF;
 IF EXISTS(SELECT 1 FROM _astro_units x CROSS JOIN LATERAL jsonb_array_elements_text(x.videos) m(id)
 LEFT JOIN facodi.youtube_videos yt ON yt.youtube_video_id=m.id
 LEFT JOIN facodi.learning_objects lo ON lo.id=yt.learning_object_id AND lo.published AND lo.status IN('active','published')
 WHERE lo.id IS NULL) THEN RAISE EXCEPTION 'Unavailable source video';END IF;
 IF EXISTS(SELECT 1 FROM facodi.courses WHERE code='FACODI-GACS-ASTRO-2018'
 AND metadata->>'facodi_independent_reconstruction' IS DISTINCT FROM 'true')
 THEN RAISE EXCEPTION 'Existing course code collision';END IF;
END $pre$;

INSERT INTO facodi.learning_objects (id,object_type,title,slug,description,objectives,keywords,tags,language,status,published,source_type,source_url,source_id,metadata)
VALUES(md5('facodi:gacs2018:course')::uuid,'course',
'Introdução à Astronomia e Astrofísica — percurso FACODI inspirado no GACS (2018)',
'astronomia-astrofisica-gacs-2018',
'Roteiro de estudo FACODI criado em 2026, inspirado num relato de participação nas atividades de astronomia do GACS/Ifes Cariacica em 2018. Não reproduz um programa curricular institucional verificado nem atribui horas, matrícula, créditos ou certificado.',
'["Desenvolver cultura científica e observação segura do céu","Conhecer conceitos introdutórios de astronomia e astrofísica","Estudar com fontes oficiais do Ifes e INPE sem confundir instituições","Praticar divulgação científica responsável"]'::jsonb,
ARRAY['GACS','Ifes Cariacica','astronomia','astrofísica','INPE 2018'],
ARRAY['FACODI','astronomia','astrofísica','GACS','curso livre'],
'pt-BR','active',true,'manual','https://cariacica.ifes.edu.br/extensao-pesquisa-e-pos-graduacao/extensao?showall=1',
'facodi:gacs:2018:community-recollection',
jsonb_build_object('facodi_independent_reconstruction',true,'historical_context_year',2018,'editorial_publication_year',2026,'official_ifes_course',false,'official_syllabus_not_verified',true,'community_recollection_no_named_participant',true,'certification_unverified',true,'official_course_hours',NULL,'official_credits',NULL,'ects_not_applicable',true,'not_equivalent_to_ifes_licenciatura_fisica_60h_course',true,'not_equivalent_to_inpe_2018_offering',true,'publisher','FACODI editorial','batch','facodi_gacs_astronomy_2018_editorial_20261115'))
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.courses (id,learning_object_id,code,external_source,external_id,slug,title,normalized_title,summary,description_html,degree_type,language,school,source_url,plan_url,status,published,metadata,institution,ects_total,duration_semesters)
VALUES(md5('facodi:gacs2018:course')::uuid,md5('facodi:gacs2018:course')::uuid,
'FACODI-GACS-ASTRO-2018','facodi_editorial','facodi:historical:gacs:2018',
'astronomia-astrofisica-gacs-2018','Introdução à Astronomia e Astrofísica — percurso FACODI inspirado no GACS (2018)',
'Introdução à Astronomia e Astrofísica',
'Percurso independente com dez temas e recursos sobre astronomia e astrofísica, inspirado em experiências do GACS/Ifes Cariacica de 2018 e apoiado em material científico de 2018 do INPE. Não constitui curso oficial ou certificado.',
'<p><strong>Reconstituição editorial FACODI (2026).</strong> Este percurso de estudo foi motivado por um relato de participação num curso introdutório de astronomia/astrofísica ligado à experiência do Grupo Astronômico Carl Sagan (GACS), Ifes Campus Cariacica, em 2018.</p>'||
'<p>O GACS é oficialmente documentado como programa de extensão e divulgação científica. As dez etapas deste percurso são uma organização <strong>independente</strong> da FACODI e não um programa original de 2018 comprovado por documentos.</p>'||
'<p><strong>Distinção de fontes:</strong> a disciplina formal de 60 horas e 4 créditos de Introdução à Astronomia e Astrofísica pertence à Licenciatura em Física do Ifes. O curso de 2018 do INPE foi realizado noutra instituição, em São José dos Campos. Nenhuma destas cargas horárias, matrículas ou certificações foi atribuída a este percurso.</p>'||
'<p>Os materiais de 2018 do INPE constituem bibliografia de apoio externa; os vídeos pertencem aos produtores e não são gravações verificadas da atividade do GACS. O percurso não concede certificados, ECTS ou créditos académicos.</p>',
'Curso livre — curadoria independente FACODI','pt-BR','Ifes Cariacica (referência histórica; percurso independente)',
'https://cariacica.ifes.edu.br/extensao-pesquisa-e-pos-graduacao/extensao?showall=1',
'https://antigo.inpe.br/ciaa2018/material-curso.php','active',true,
jsonb_build_object('facodi_independent_reconstruction',true,'historical_context_year',2018,'editorial_publication_year',2026,'official_ifes_course',false,'original_2018_activities_not_transcribed',true,'official_course_hours',NULL,'official_credits',NULL,'ects_not_applicable',true,'study_topics_count',10,'curriculum_editorial_not_official',true,'original_student_participation_not_verified_by_ifes',true,'personal_attribution_public',false,'not_ifes_60h_physics_discipline',true,'not_inpe_2018_course',true,'source_inpe','https://antigo.inpe.br/ciaa2018/material-curso.php','source_gacs','https://cariacica.ifes.edu.br/extensao-pesquisa-e-pos-graduacao/extensao?showall=1','batch','facodi_gacs_astronomy_2018_editorial_20261115'),
'FACODI — referência histórica: Ifes Campus Cariacica / GACS',NULL,NULL)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_objects (id,object_type,title,slug,description,objectives,keywords,tags,language,status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:gacs2018:unit:'||x.code)::uuid,'curricular_unit',x.title,
'gacs-astro-2018-'||lower(x.code),x.focus,
to_jsonb(ARRAY[x.focus,x.activity]),ARRAY[x.title,'GACS','astrofísica'],
ARRAY['FACODI','astrofísica','astronomia','percurso de estudo'],'pt-BR','active',true,'manual',
'https://antigo.inpe.br/ciaa2018/material-curso.php','facodi:gacs:study-topic:'||x.code,
jsonb_build_object('official_ifes_curricular_unit',false,'topics',x.topics,'practice_activity',x.activity,'review_questions',x.questions,'study_position',right(x.code,2)::int,'batch','facodi_gacs_astronomy_2018_editorial_20261115')
FROM _astro_units x ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.curricular_units (id,learning_object_id,course_id,code,external_source,external_id,slug,title,normalized_title,summary,description_html,year,semester,ects,position,language,source_url,plan_url,status,published,metadata)
SELECT md5('facodi:gacs2018:unit:'||x.code)::uuid,md5('facodi:gacs2018:unit:'||x.code)::uuid,
md5('facodi:gacs2018:course')::uuid,'FACODI-GACS18-'||x.code,'facodi_editorial',
'facodi:gacs:study:'||x.code,'gacs-astro-2018-'||lower(x.code),x.title,x.title,x.focus,
'<section><p><strong>Objetivo de estudo:</strong> '||x.focus||'</p>'||
'<p>Unidade temática criada pela FACODI em 2026 a partir de referências históricas do GACS e bibliografia do INPE, não uma aula comprovada do curso de 2018.</p>'||
'<h3>Temas</h3><ul>'||(SELECT string_agg('<li>'||v.t||'</li>','' ORDER BY v.n) FROM jsonb_array_elements_text(x.topics) WITH ORDINALITY v(t,n))||'</ul>'||
'<h3>Atividade proposta</h3><p>'||x.activity||'</p><h3>Perguntas de revisão</h3><ul>'||
(SELECT string_agg('<li>'||v.t||'</li>','' ORDER BY v.n) FROM jsonb_array_elements_text(x.questions) WITH ORDINALITY v(t,n))||
'</ul><p>Bibliografia e vídeos externos são referências complementares sem vínculo institucional ou certificação.</p></section>',
NULL,NULL,NULL,right(x.code,2)::int,'pt-BR',
'https://antigo.inpe.br/ciaa2018/material-curso.php',
'https://www.inpe.br/ciaa2018/arquivos/pdfs/apostila_completa_2018.pdf','active',true,
jsonb_build_object('facodi_independent_study_topic',true,'official_ifes_uc',false,'source_context_year',2018,'editorial_version',2026,'official_hours',NULL,'ects_not_applicable',true,'year_and_semester_not_applicable',true,'editorial_sequence_number',right(x.code,2)::int,'study_topics',x.topics,'study_questions',x.questions,'activity',x.activity,'batch','facodi_gacs_astronomy_2018_editorial_20261115')
FROM _astro_units x ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_objects (id,object_type,title,slug,description,objectives,keywords,tags,language,status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:gacs2018:source:'||s.key)::uuid,'external_resource',s.name,
'gacs-astro-2018-fonte-'||s.key,
'Referência oficial externa de '||CASE WHEN s.key LIKE 'inpe%' THEN 'INPE' ELSE 'Ifes' END||
'. Os materiais não foram reproduzidos pela FACODI e não demonstram que o percurso editorial foi ministrado com esta estrutura no GACS.',
'[]'::jsonb,ARRAY['GACS','astrofísica',s.key],
ARRAY['FACODI','referência externa',s.kind],'pt-BR','active',true,'external',s.url,
'facodi:gacs:source:'||s.key,
jsonb_build_object('source_institution',CASE WHEN s.key LIKE 'inpe%' THEN 'INPE' ELSE 'Ifes' END,'external_source_only',true,'not_2018_course_attendance_evidence',true,'publisher_license_not_assumed',true,'batch','facodi_gacs_astronomy_2018_editorial_20261115')
FROM _astro_sources s ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources(id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:gacs2018:external-source:'||s.key)::uuid,
md5('facodi:gacs2018:source:'||s.key)::uuid,
CASE WHEN s.kind='document' THEN 'document' ELSE 'website' END,
'facodi-gacs-2018-'||s.key,s.url,s.name,
jsonb_build_object('external_official_reference',true,'source_owner',CASE WHEN s.key LIKE 'inpe%' THEN 'INPE' ELSE 'Ifes' END,'batch','facodi_gacs_astronomy_2018_editorial_20261115')
FROM _astro_sources s ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_relations (id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:gacs2018:course-unit:'||x.code)::uuid,md5('facodi:gacs2018:course')::uuid,
md5('facodi:gacs2018:unit:'||x.code)::uuid,'contains',right(x.code,2)::int,
'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','original_facodi_editorial_study_topic','official_course_curriculum',false,'batch','facodi_gacs_astronomy_2018_editorial_20261115')
FROM _astro_units x ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_relations (id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:gacs2018:unit-source:'||x.code||':'||r.ref)::uuid,
md5('facodi:gacs2018:unit:'||x.code)::uuid,
md5('facodi:gacs2018:source:'||r.ref)::uuid,'contains',1000+r.ord::int,
'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','official_external_source_link','external_document_only',true,'batch','facodi_gacs_astronomy_2018_editorial_20261115')
FROM _astro_units x CROSS JOIN LATERAL jsonb_array_elements_text(x.sources) WITH ORDINALITY r(ref,ord)
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_relations (id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:gacs2018:unit-video:'||x.code||':'||v.id)::uuid,
md5('facodi:gacs2018:unit:'||x.code)::uuid,yt.learning_object_id,
'contains',2000+v.ord::int,'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','title_and_channel_only','original_gacs_2018_recording',false,'content_reviewed_in_full',false,'supplementary_material',true,'batch','facodi_gacs_astronomy_2018_editorial_20261115')
FROM _astro_units x CROSS JOIN LATERAL jsonb_array_elements_text(x.videos) WITH ORDINALITY v(id,ord)
JOIN facodi.youtube_videos yt ON yt.youtube_video_id=v.id ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_relations (id,parent_object_id,child_object_id,relation_type,created_by_mechanism,metadata)
SELECT md5('facodi:gacs2018:related-ifes-administration')::uuid,
md5('facodi:gacs2018:course')::uuid,c.learning_object_id,
'correlates_with','structured_catalog_import',
jsonb_build_object('relationship','historical_participation_2018_in_GACS_context','not_administration_course_curriculum',true,'no_credential_equivalence',true)
FROM facodi.courses c WHERE c.code='IFES-CAR-ADM-INT-2026'
ON CONFLICT DO NOTHING;

DO $post$ BEGIN
IF (SELECT count(*) FROM facodi.courses WHERE code='FACODI-GACS-ASTRO-2018' AND published AND status='active' AND metadata->>'facodi_independent_reconstruction'='true')<>1
OR (SELECT count(*) FROM facodi.curricular_units WHERE course_id=md5('facodi:gacs2018:course')::uuid AND published AND status='active' AND ects IS NULL)<>10
OR (SELECT count(*) FROM facodi.learning_objects WHERE object_type='external_resource' AND metadata->>'batch'='facodi_gacs_astronomy_2018_editorial_20261115')<>6
OR (SELECT count(*) FROM facodi.learning_object_relations WHERE metadata->>'batch'='facodi_gacs_astronomy_2018_editorial_20261115' AND metadata->>'review_scope'='official_external_source_link')<>22
OR (SELECT count(*) FROM facodi.learning_object_relations WHERE metadata->>'batch'='facodi_gacs_astronomy_2018_editorial_20261115' AND metadata->>'review_scope'='title_and_channel_only')<>14
THEN RAISE EXCEPTION 'Astronomy pathway integrity check failed';END IF;
END $post$;
