
CREATE TEMP TABLE _ufes83_refs ON COMMIT DROP AS SELECT * FROM jsonb_to_recordset($ufesref$[{"key":"teach-resources","title":"British Council — materiais para ensinar inglês","url":"https://www.teachingenglish.org.uk/teaching-resources","pub":"British Council TeachingEnglish","lang":"en","desc":"Materiais de ensino e atividades para contextos educativos de língua inglesa."},{"key":"teach-cpd","title":"British Council — desenvolvimento profissional docente","url":"https://www.teachingenglish.org.uk/professional-development/teachers","pub":"British Council TeachingEnglish","lang":"en","desc":"Formação contínua e reflexão sobre práticas de ensino de língua inglesa."},{"key":"teach-plans","title":"British Council — planeamento de aulas","url":"https://www.teachingenglish.org.uk/professional-development/teachers/planning-lessons-and-courses/lesson-plans","pub":"British Council TeachingEnglish","lang":"en","desc":"Orientações para elaborar e avaliar planos de aula em ensino de línguas."},{"key":"bc-grammar","title":"British Council — gramática inglesa","url":"https://learnenglish.britishcouncil.org/free-resources/grammar","pub":"British Council LearnEnglish","lang":"en","desc":"Exercícios e explicações de gramática inglesa organizados por níveis de proficiência."},{"key":"bc-listening","title":"British Council — compreensão oral","url":"https://learnenglish.britishcouncil.org/free-resources/listening","pub":"British Council LearnEnglish","lang":"en","desc":"Práticas de escuta e compreensão oral em língua inglesa."},{"key":"bc-reading","title":"British Council — compreensão escrita","url":"https://learnenglish.britishcouncil.org/free-resources/reading","pub":"British Council LearnEnglish","lang":"en","desc":"Atividades graduadas de leitura e interpretação de textos em língua inglesa."},{"key":"bc-writing","title":"British Council — produção escrita","url":"https://learnenglish.britishcouncil.org/free-resources/writing","pub":"British Council LearnEnglish","lang":"en","desc":"Exercícios de produção escrita com propostas de organização textual e revisão."},{"key":"bc-speaking","title":"British Council — comunicação oral","url":"https://learnenglish.britishcouncil.org/free-resources/speaking","pub":"British Council LearnEnglish","lang":"en","desc":"Exercícios e práticas de fala, interação e comunicação em inglês."},{"key":"bc-vocabulary","title":"British Council — vocabulário de inglês","url":"https://learnenglish.britishcouncil.org/free-resources/vocabulary","pub":"British Council LearnEnglish","lang":"en","desc":"Recurso graduado para ampliar léxico e usar palavras em contextos reais."},{"key":"mit-linguistics","title":"MIT OpenCourseWare — introdução à linguística","url":"https://ocw.mit.edu/courses/24-900-introduction-to-linguistics-fall-2012/","pub":"MIT OpenCourseWare","lang":"en","desc":"Materiais introdutórios sobre análise linguística e descrição da linguagem."},{"key":"purdue-writing","title":"Purdue OWL — escrita académica","url":"https://owl.purdue.edu/owl/general_writing/academic_writing/index.html","pub":"Purdue University","lang":"en","desc":"Guias e orientações de escrita académica, argumentação e organização textual."},{"key":"openstax-writing","title":"OpenStax — Writing Guide","url":"https://openstax.org/books/writing-guide/pages/1-introduction","pub":"OpenStax","lang":"en","desc":"Manual de consulta sobre composição escrita, retórica e processos de revisão."},{"key":"gutenberg-romeo","title":"Shakespeare — Romeo and Juliet (Project Gutenberg)","url":"https://www.gutenberg.org/ebooks/1513","pub":"Project Gutenberg","lang":"en","desc":"Texto literário clássico como referência para leituras de teatro e literatura anglófona."},{"key":"gutenberg-austen","title":"Jane Austen — Pride and Prejudice (Project Gutenberg)","url":"https://www.gutenberg.org/ebooks/1342","pub":"Project Gutenberg","lang":"en","desc":"Romance clássico como fonte para leitura e crítica literária em inglês."},{"key":"gutenberg-shelley","title":"Mary Shelley — Frankenstein (Project Gutenberg)","url":"https://www.gutenberg.org/ebooks/84","pub":"Project Gutenberg","lang":"en","desc":"Romance clássico para estudos de períodos literários e diálogo entre literatura e cultura."},{"key":"gutenberg-wells","title":"H. G. Wells — The Time Machine (Project Gutenberg)","url":"https://www.gutenberg.org/ebooks/35","pub":"Project Gutenberg","lang":"en","desc":"Narrativa de ficção científica como referência para literatura moderna e cultura popular."},{"key":"ufes-internships","title":"UFES Letras — Estágio Obrigatório","url":"https://letras.ufes.br/pt-br/estagio-obrigatorio","pub":"Universidade Federal do Espírito Santo","lang":"pt","desc":"Orientações institucionais sobre estágios curriculares obrigatórios de Letras Inglês."},{"key":"ufes-tcc","title":"UFES Letras — Trabalho de Conclusão de Curso","url":"https://letras.ufes.br/pt-br/tcc-trabalho-de-conclusao-de-curso","pub":"Universidade Federal do Espírito Santo","lang":"pt","desc":"Orientações institucionais relacionadas ao trabalho de conclusão de curso."},{"key":"ufes-complementary","title":"UFES Letras — Atividades Complementares","url":"https://letras.ufes.br/pt-br/atividades-complementares","pub":"Universidade Federal do Espírito Santo","lang":"pt","desc":"Informações institucionais sobre atividades complementares da formação de Letras."},{"key":"mec-bncc","title":"MEC — Base Nacional Comum Curricular","url":"https://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf","pub":"Ministério da Educação do Brasil","lang":"pt","desc":"Documento normativo brasileiro para contextualizar currículo escolar e formação docente, sem substituir as diretrizes da UC."}]$ufesref$::jsonb)
 AS r(key text,title text,url text,pub text,lang text,"desc" text);
CREATE TEMP TABLE _ufes83_ref_units ON COMMIT DROP AS SELECT * FROM jsonb_to_recordset($ufeslink$[{"key":"teach-resources","code":"LET13919"},{"key":"teach-resources","code":"LET13943"},{"key":"teach-resources","code":"LET13944"},{"key":"teach-resources","code":"LET13954"},{"key":"teach-resources","code":"LET13956"},{"key":"teach-resources","code":"LET13957"},{"key":"teach-resources","code":"LET15836"},{"key":"teach-resources","code":"LET13942"},{"key":"teach-resources","code":"LET13958"},{"key":"teach-resources","code":"LCE13933"},{"key":"teach-cpd","code":"LET13944"},{"key":"teach-cpd","code":"LET13919"},{"key":"teach-cpd","code":"LET13954"},{"key":"teach-cpd","code":"LCE13933"},{"key":"teach-cpd","code":"LCE13934"},{"key":"teach-cpd","code":"TEP13131"},{"key":"teach-plans","code":"LET13919"},{"key":"teach-plans","code":"LET13943"},{"key":"teach-plans","code":"LET15836"},{"key":"teach-plans","code":"LCE13933"},{"key":"teach-plans","code":"LCE13934"},{"key":"teach-plans","code":"LET13956"},{"key":"teach-plans","code":"LET13957"},{"key":"bc-grammar","code":"LET13915"},{"key":"bc-grammar","code":"LET13918"},{"key":"bc-listening","code":"LET13916"},{"key":"bc-listening","code":"LET13945"},{"key":"bc-listening","code":"LET13946"},{"key":"bc-listening","code":"LET13951"},{"key":"bc-reading","code":"LET13920"},{"key":"bc-reading","code":"LET13949"},{"key":"bc-reading","code":"LET13921"},{"key":"bc-writing","code":"LET13926"},{"key":"bc-writing","code":"LET13939"},{"key":"bc-writing","code":"LET13949"},{"key":"bc-speaking","code":"LET13916"},{"key":"bc-speaking","code":"LET13945"},{"key":"bc-speaking","code":"LET13946"},{"key":"bc-speaking","code":"LET13951"},{"key":"bc-vocabulary","code":"LET13915"},{"key":"bc-vocabulary","code":"LET13918"},{"key":"bc-vocabulary","code":"LET13949"},{"key":"mit-linguistics","code":"LET13917"},{"key":"mit-linguistics","code":"LET13937"},{"key":"mit-linguistics","code":"LET13940"},{"key":"mit-linguistics","code":"LET05805"},{"key":"mit-linguistics","code":"LET05151"},{"key":"mit-linguistics","code":"LET13935"},{"key":"purdue-writing","code":"LET13926"},{"key":"purdue-writing","code":"LET13939"},{"key":"purdue-writing","code":"LET13952"},{"key":"purdue-writing","code":"LET13932"},{"key":"purdue-writing","code":"LET13931"},{"key":"openstax-writing","code":"LET13926"},{"key":"openstax-writing","code":"LET13939"},{"key":"openstax-writing","code":"LET13932"},{"key":"gutenberg-romeo","code":"LET13925"},{"key":"gutenberg-romeo","code":"LET13964"},{"key":"gutenberg-romeo","code":"LET13962"},{"key":"gutenberg-romeo","code":"LET13969"},{"key":"gutenberg-austen","code":"LET13925"},{"key":"gutenberg-austen","code":"LET13962"},{"key":"gutenberg-austen","code":"LET13967"},{"key":"gutenberg-shelley","code":"LET13925"},{"key":"gutenberg-shelley","code":"LET13967"},{"key":"gutenberg-shelley","code":"LET13965"},{"key":"gutenberg-shelley","code":"LET13969"},{"key":"gutenberg-wells","code":"LET13928"},{"key":"gutenberg-wells","code":"LET13965"},{"key":"gutenberg-wells","code":"LET13966"},{"key":"ufes-internships","code":"LCE13933"},{"key":"ufes-internships","code":"LCE13934"},{"key":"ufes-tcc","code":"LET13932"},{"key":"ufes-tcc","code":"LET13931"},{"key":"mec-bncc","code":"EPS13687"},{"key":"mec-bncc","code":"TEP13129"},{"key":"mec-bncc","code":"LET13919"},{"key":"mec-bncc","code":"LET13956"},{"key":"mec-bncc","code":"LCE13705"},{"key":"mec-bncc","code":"TEP13131"}]$ufeslink$::jsonb)
 AS x(key text,code text);
DO $guard$ BEGIN
 IF (SELECT count(*) FROM _ufes83_refs)<>20 OR (SELECT count(*) FROM _ufes83_ref_units)<>80
 THEN RAISE EXCEPTION 'Review count changed'; END IF;
 IF EXISTS(SELECT 1 FROM _ufes83_refs WHERE url NOT LIKE 'https://%' OR url ~ '[[:space:]]')
 THEN RAISE EXCEPTION 'Non-HTTPS source'; END IF;
 IF EXISTS(SELECT 1 FROM _ufes83_ref_units rel
 LEFT JOIN _ufes83_refs r ON r.key=rel.key
 LEFT JOIN facodi.curricular_units u ON u.code=rel.code AND
 u.course_id=md5('facodi:ufes:83:2019:course')::uuid
 WHERE r.key IS NULL OR u.id IS NULL OR NOT u.published)
 THEN RAISE EXCEPTION 'Unknown curricular link'; END IF;
END $guard$;

INSERT INTO facodi.learning_objects(
id,object_type,title,slug,description,language,status,published,source_type,
source_url,source_id,tags,metadata)
SELECT md5('facodi:ufes:83:2019:reading:'||r.key)::uuid,
 'external_resource',r.title,'ufes83-reading-'||r.key,
 r."desc"||' Esta referência complementar liga ao portal original do autor; a FACODI não reproduz o conteúdo nem a considera bibliografia obrigatória oficial da UFES.',
 r.lang,'active',true,'external',r.url,r.key,
 ARRAY['Letras Inglês','UFES','referência externa'],
 jsonb_build_object('source_publisher',r.pub,'original_url',r.url,
 'reference_only',true,'original_content_not_copied',true,
 'content_license_verified',false,'official_course_syllabus',false,
 'page_verified_on','2026-11-14','curation_batch','ufes83_ppc2019_educational_references',
 'is_institutional_source',r.pub='Universidade Federal do Espírito Santo',
 'bibliography_status','facodi_supplementary_not_ufes_mandatory')
FROM _ufes83_refs r ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources(
id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:ufes:83:2019:reading-source:'||r.key)::uuid,
 md5('facodi:ufes:83:2019:reading:'||r.key)::uuid,
 'website',r.key,r.url,r.title,
 jsonb_build_object('publisher',r.pub,'source_verified_on','2026-11-14',
 'source_kind','supplementary_reading_reference','reference_only',true)
FROM _ufes83_refs r
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes:83:2019:reading-link:'||a.key||':'||a.code)::uuid,
 md5('facodi:ufes:83:2019:uc-object:'||a.code)::uuid,
 md5('facodi:ufes:83:2019:reading:'||a.key)::uuid,
 'contains',50000+row_number() OVER(PARTITION BY a.code ORDER BY a.key)::integer,
 'verified_external_reading_curation',
 jsonb_build_object('review_status','approved',
 'review_scope','external_landing_page',
 'resource_purpose','study_reference',
 'curricular_code',a.code,'no_official_ufes_endorsement',true,
 'curation_batch','ufes83_ppc2019_educational_references')
FROM _ufes83_ref_units a
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Complementary activities are official guidance for the course as a whole,
-- not an invented curricular component.
INSERT INTO facodi.learning_object_relations(
id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
VALUES(
 md5('facodi:ufes:83:2019:course-aacc-guidance')::uuid,
 md5('facodi:ufes:83:2019:course-object')::uuid,
 md5('facodi:ufes:83:2019:reading:ufes-complementary')::uuid,
 'contains',90000,'structured_catalog_import',
 jsonb_build_object('review_status','approved','reference_purpose','aacc_official_guidance',
 'credit_hours',200,'does_not_create_curricular_unit',true)
)
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT DISTINCT md5('facodi:ufes:83:2019:reading:'||a.key)::uuid,
 tag.id
FROM _ufes83_ref_units a
JOIN facodi.tags tag ON tag.slug='ufes-ingles-'||lower(a.code)
ON CONFLICT DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT md5('facodi:ufes:83:2019:reading:'||r.key)::uuid,
 tag.id
FROM _ufes83_refs r JOIN facodi.tags tag ON tag.slug='curso-ufes-letras-ingles'
ON CONFLICT DO NOTHING;

INSERT INTO facodi.keywords(
id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:ufes:83:2019:reading-keyword:'||r.key)::uuid,
 md5('facodi:ufes:83:2019:reading:'||r.key)::uuid,r.title,
 lower(btrim(r.title)),r.lang,0.95,'external_reference_title',
 jsonb_build_object('publisher',r.pub,'reference_only',true)
FROM _ufes83_refs r
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;

DO $final$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects
 WHERE slug LIKE 'ufes83-reading-%' AND published)<>20 THEN RAISE EXCEPTION '20 reading objects required';END IF;
 IF (SELECT count(*) FROM facodi.learning_object_relations
 WHERE created_by_mechanism='verified_external_reading_curation'
 AND metadata->>'curation_batch'='ufes83_ppc2019_educational_references')<>80
 THEN RAISE EXCEPTION 'Source relations incomplete';END IF;
END $final$;