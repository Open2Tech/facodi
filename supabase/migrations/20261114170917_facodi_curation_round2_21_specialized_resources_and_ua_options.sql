-- FACODI: second reading reference round, verified source landing pages, 2026-11-14.
-- Academic planning resources for generic option UCs are differentiated from teaching materials.
CREATE TEMP TABLE _facodi_refs_round2 (
 key text PRIMARY KEY,title text NOT NULL,url text NOT NULL,publisher text NOT NULL,
 summary text NOT NULL,purpose text NOT NULL
) ON COMMIT DROP;
INSERT INTO _facodi_refs_round2 VALUES ('design-basics-canva','Fundamentos de design gráfico — Canva Design School','https://www.canva.com/design-school/courses/graphic-design-essentials/','Canva Design School','Curso introdutório sobre composição, cor, tipografia e ferramentas visuais.','study_reference'),
('design-photoshop-adobe','Primeiro projeto de design — Adobe Photoshop','https://www.adobe.com/learn/photoshop/web/graphic-design-basics','Adobe Learn','Tutoriais introdutórios de camadas, máscaras, texto e composição digital.','study_reference'),
('design-software-adobe','Tutoriais criativos — Adobe Learn','https://www.adobe.com/learn','Adobe Learn','Biblioteca de aprendizagem para edição de imagem, layout, vídeo e produção gráfica digital.','study_reference'),
('print-marks-adobe','Marcas e sangrias na impressão — Adobe InDesign','https://helpx.adobe.com/indesign/desktop/print/page-set-up-and-printer-marks/set-printer-marks.html','Adobe HelpX','Referência técnica sobre marcas de corte, sangria e registo na preparação para impressão.','study_reference'),
('print-pdf-adobe','Produção de PDF para impressão — Adobe InDesign','https://helpx.adobe.com/indesign/desktop/print/print-production-and-file-creation/produce-print-ready-pdf-files.html','Adobe HelpX','Orientações sobre exportação PDF, cores, perfis e preparação de ficheiros para impressão.','study_reference'),
('design-double-diamond','Framework for Innovation — Design Council','https://www.designcouncil.org.uk/resources/framework-for-innovation/','Design Council','Metodologia de investigação, definição, desenvolvimento e avaliação de propostas de design.','study_reference'),
('design-openlearn','Design: Introduction — The Open University','https://www.open.edu/openlearn/mod/oucontent/view.php?id=3220&intro=1&section=0','OpenLearn','Curso de consulta sobre pensamento de design, inovação e avaliação de soluções.','study_reference'),
('photo-darktable','Manual de edição fotográfica RAW — darktable','https://www.darktable.org/resources/','darktable','Manual de consulta para organização de fotografias e tratamento digital não destrutivo.','study_reference'),
('photo-ilford','Fotografia analógica: guia de iniciação — Ilford','https://www.ilfordphoto.com/beginners-guide/','Ilford Photo','Introdução ao filme fotográfico, à exposição e ao trabalho em câmara escura.','study_reference'),
('photo-ilford-develop','Revelação de película fotográfica — Ilford','https://www.ilfordphoto.com/beginners-guide-processing-film/','Ilford Photo','Guia técnico de consulta para compreender processos e segurança na revelação de filme.','study_reference'),
('video-adobe-premiere','Edição de vídeo: guia inicial — Adobe Premiere','https://www.adobe.com/learn/premiere-pro/web/create-edit-sequence','Adobe Learn','Tutorial de montagem, sequências, ritmo, som e exportação audiovisual.','study_reference'),
('visual-culture-openlearn','Arte e cultura visual — OpenLearn','https://www.open.edu/openlearn/history-the-arts/art-and-visual-culture-medieval-modern/','OpenLearn','Curso sobre leitura e contextualização da produção artística e da cultura visual.','study_reference'),
('teaching-openlearn','Aprender a ensinar — OpenLearn','https://www.open.edu/openlearn/education-development/learning-teach-making-sense-learning-teach/content-section-0?intro=1','OpenLearn','Introdução a práticas de ensino e aprendizagem e à reflexão pedagógica.','study_reference'),
('english-writing-bc','Exercícios de escrita em inglês — British Council','https://learnenglish.britishcouncil.org/free-resources/writing','British Council','Percursos de escrita académica e profissional com exercícios por níveis de proficiência.','study_reference'),
('english-email-bc','Inglês profissional para emails — British Council','https://learnenglish.britishcouncil.org/free-resources/business/english-emails','British Council','Módulos de escrita e organização de emails em contexto profissional.','study_reference'),
('fpga-amd-vivado','Síntese FPGA e hardware reconfigurável — AMD Vivado','https://docs.amd.com/r/en-US/ug901-vivado-synthesis','AMD Documentation','Manual de síntese RTL, estratégias, restrições e implementação de projetos em FPGA.','study_reference'),
('project-management-openlearn','Introdução à gestão de projetos — OpenLearn','https://www.open.edu/openlearn/money-business/leadership-management/project-management-the-start-the-project-journey','OpenLearn','Curso aberto sobre ciclo de vida, planeamento, riscos e gestão de projetos.','study_reference'),
('design-ethics-icod','Código de Conduta Profissional dos Designers — ICoD','https://www.theicod.org/en/resources/news-archive/icod-code-conduct-translated-portuguese','International Council of Design','Referência internacional de ética e responsabilidade profissional com tradução portuguesa.','study_reference'),
('design-professional-icod','Código profissional e boas práticas — ICoD','https://www.theicod.org/resources/professional-code-of-conduct','International Council of Design','Documentação sobre deontologia, compromisso social e prática profissional de design.','study_reference'),
('design-openlearn-method','Métodos de projeto e inovação — Design Council','https://www.designcouncil.org.uk/resources/the-double-diamond/','Design Council','Descrição das fases de descoberta, definição, desenvolvimento e entrega num projeto criativo.','study_reference'),
('lesti-options-official','Planos e opções de licenciatura LESTI — UAlg','https://ise.ualg.pt/curso/1941/plano','Universidade do Algarve','Plano oficial para consulta da oferta de alternativas dos grupos de opção; não é um manual de conteúdos da UC efetivamente escolhida.','academic_planning');
CREATE TEMP TABLE _facodi_ref_unit_round2(key text NOT NULL,uc_code text NOT NULL,
 PRIMARY KEY(key,uc_code)) ON COMMIT DROP;
INSERT INTO _facodi_ref_unit_round2 VALUES ('design-basics-canva','14541143'),
('design-basics-canva','14541006'),
('design-photoshop-adobe','14541143'),
('design-photoshop-adobe','14541144'),
('design-software-adobe','14541144'),
('design-software-adobe','14541147'),
('design-software-adobe','14541150'),
('print-marks-adobe','14541182'),
('print-marks-adobe','14541195'),
('print-pdf-adobe','14541182'),
('print-pdf-adobe','14541198'),
('print-pdf-adobe','14541195'),
('design-double-diamond','14541006'),
('design-double-diamond','14541158'),
('design-double-diamond','14541028'),
('design-double-diamond','14541152'),
('design-double-diamond','19411030'),
('design-double-diamond','19411034'),
('design-double-diamond','19411036'),
('design-openlearn','14541006'),
('design-openlearn','14541158'),
('design-openlearn','14541028'),
('photo-darktable','14541185'),
('photo-ilford','14541189'),
('photo-ilford-develop','14541189'),
('video-adobe-premiere','14541172'),
('video-adobe-premiere','14541150'),
('visual-culture-openlearn','14541026'),
('teaching-openlearn','14541200'),
('english-writing-bc','14541165'),
('english-writing-bc','19411023'),
('english-email-bc','14541165'),
('english-email-bc','19411023'),
('fpga-amd-vivado','19411028'),
('project-management-openlearn','19411030'),
('project-management-openlearn','19411034'),
('project-management-openlearn','19411036'),
('project-management-openlearn','14541152'),
('design-ethics-icod','14541197'),
('design-professional-icod','14541197'),
('design-professional-icod','14541028'),
('design-openlearn-method','14541006'),
('design-openlearn-method','14541158'),
('lesti-options-official','19411037'),
('lesti-options-official','19411038'),
('lesti-options-official','19411039'),
('lesti-options-official','19411040'),
('lesti-options-official','19411041'),
('lesti-options-official','19411042'),
('lesti-options-official','19411043');
DO $guard$ BEGIN
 IF (SELECT count(*) FROM _facodi_refs_round2) <> 21 THEN
   RAISE EXCEPTION 'Sources list count changed'; END IF;
 IF (SELECT count(*) FROM _facodi_ref_unit_round2) <> 50 THEN
   RAISE EXCEPTION 'UC associations count changed'; END IF;
 IF EXISTS(SELECT 1 FROM _facodi_refs_round2 r WHERE r.url NOT LIKE 'https://%'
 OR r.url ~ '[[:space:]]' OR r.purpose NOT IN ('study_reference','academic_planning'))
 THEN RAISE EXCEPTION 'Unverified source format'; END IF;
 IF EXISTS(SELECT 1 FROM _facodi_ref_unit_round2 m
 LEFT JOIN facodi.curricular_units u ON u.code=m.uc_code
 LEFT JOIN facodi.courses c ON c.id=u.course_id
 WHERE u.id IS NULL OR NOT u.published OR u.status<>'active'
 OR NOT c.published OR c.status<>'active' OR u.learning_object_id IS NULL
 OR c.code NOT IN ('LESTI','LDCOM'))
 THEN RAISE EXCEPTION 'Unknown or unpublished curricular destination';END IF;
 IF EXISTS(SELECT 1 FROM _facodi_ref_unit_round2 m
 JOIN _facodi_refs_round2 r ON r.key=m.key
 JOIN facodi.curricular_units u ON u.code=m.uc_code
 WHERE r.purpose='academic_planning' AND u.title NOT ILIKE 'Opção%')
 THEN RAISE EXCEPTION 'Planning resource linked to non-generic UC';END IF;
END $guard$;
INSERT INTO facodi.learning_objects
 (id,object_type,title,slug,description,language,status,published,
 source_type,source_url,source_id,tags,metadata)
SELECT md5('facodi:oer:'||r.key)::uuid,
 'external_resource',r.title,'facodi-reading-'||r.key,
 r.summary||' Link para a publicação do autor. Não constitui conteúdo programático oficial da UC nem cópia de material.',
 'pt','active',true,'external',r.url,r.key,
 ARRAY['recurso-externo',CASE WHEN r.purpose='academic_planning' THEN 'planeamento-curricular' ELSE 'leitura' END],
 jsonb_build_object(
 'publisher',r.publisher,'resource_purpose',r.purpose,
 'source_landing_page_reviewed_on','2026-11-14',
 'is_official_university_source',r.publisher='Universidade do Algarve',
 'is_official_ualg_course_material',false,
 'no_syllabus_for_generic_option',r.purpose='academic_planning',
 'full_content_reproduced',false,'content_license_verified',false,
 'curation_batch','facodi_readings_2026_11_14_round2')
FROM _facodi_refs_round2 r
ON CONFLICT(id) DO NOTHING;
INSERT INTO facodi.external_sources
 (id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:oer:source:'||r.key)::uuid,md5('facodi:oer:'||r.key)::uuid,
 'website',r.key,r.url,r.title,
 jsonb_build_object('publisher',r.publisher,'source_reviewed_on','2026-11-14',
 'purpose',r.purpose,'curation_batch','facodi_readings_2026_11_14_round2')
FROM _facodi_refs_round2 r
ON CONFLICT(id) DO NOTHING;
INSERT INTO facodi.keywords
 (id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:oer:keyword:'||r.key)::uuid,
 md5('facodi:oer:'||r.key)::uuid,r.title,lower(btrim(r.title)),
 'pt',1,'external_reference_title',jsonb_build_object('url',r.url,'purpose',r.purpose)
FROM _facodi_refs_round2 r
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;
INSERT INTO facodi.learning_object_relations
 (id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:oer:relation:'||m.key||':'||m.uc_code)::uuid,
 u.learning_object_id,md5('facodi:oer:'||m.key)::uuid,
 'contains',60000+row_number() OVER(PARTITION BY u.id ORDER BY m.key)::integer,
 'verified_external_reading_curation',
 jsonb_build_object('review_status','approved','review_scope','external_landing_page',
 'resource_purpose',r.purpose,'uc_code',m.uc_code,
 'no_syllabus_for_generic_option',r.purpose='academic_planning',
 'curation_batch','facodi_readings_2026_11_14_round2')
FROM _facodi_ref_unit_round2 m
JOIN _facodi_refs_round2 r ON r.key=m.key
JOIN facodi.curricular_units u ON u.code=m.uc_code
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;
INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT md5('facodi:oer:'||m.key)::uuid,t.id
FROM _facodi_ref_unit_round2 m
JOIN facodi.tags t ON t.slug='uc-'||m.uc_code
ON CONFLICT DO NOTHING;
DO $final$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects
 WHERE published AND object_type='external_resource')<>55 THEN
 RAISE EXCEPTION 'Reference count mismatch';END IF;
 IF (SELECT count(*) FROM facodi.learning_object_relations
 WHERE created_by_mechanism='verified_external_reading_curation')<>112 THEN
 RAISE EXCEPTION 'Published reference association count mismatch';END IF;
END $final$;