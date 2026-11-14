
-- FACODI CTeSP UAlg 1812: reuse existing real references and published video metadata.
-- Every video is an external YouTube link, selected by title/channel only.
-- All 10 fresh resource URLs are official providers or the official university plan.
CREATE TEMP TABLE _ctesp1812_fresh_source(
 source_key text PRIMARY KEY,title text,url text,publisher text,summary text,purpose text
) ON COMMIT DROP;
INSERT INTO _ctesp1812_fresh_source VALUES ('ctesp1812-libreoffice','Guias oficiais do LibreOffice','https://documentation.libreoffice.org/en/english-documentation/','LibreOffice Documentation','Guias de documentos, folhas de cálculo e apresentações, para estudo de produtividade digital.','study_reference'),
('ctesp1812-powerbi','Power BI — introdução e documentação','https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview','Microsoft Learn','Introdução à análise de dados, dashboards e visualização no Power BI; estudo de ferramenta de fornecedor.','study_reference'),
('ctesp1812-powerautomate','Power Automate — fluxos e automação','https://learn.microsoft.com/en-us/power-automate/','Microsoft Learn','Documentação de automação de fluxos, aprovações e integração de aplicações; exemplo de tecnologia comercial.','study_reference'),
('ctesp1812-sharepoint','SharePoint — organização e gestão documental','https://learn.microsoft.com/en-us/sharepoint','Microsoft Learn','Guias oficiais sobre organização documental, bibliotecas, permissões e colaboração.','study_reference'),
('ctesp1812-communication','Comunicação eficaz no local de trabalho — OpenLearn','https://www.open.edu/openlearn/money-business/effective-communication-the-workplace','The Open University','Curso aberto sobre comunicação oral, escrita, colaboração e feedback em contexto profissional.','study_reference'),
('ctesp1812-google-seo','Google Search — guia inicial de SEO','https://developers.google.com/search/docs/fundamentals/seo-starter-guide','Google Search Central','Guia de boas práticas para visibilidade, estrutura e compreensão de conteúdos pelos motores de pesquisa.','study_reference'),
('ctesp1812-analytics','Google Analytics — documentação para aprendizagem','https://developers.google.com/analytics','Google for Developers','Referência para medição e análise de utilização de websites; exemplo de plataforma comercial.','study_reference'),
('ctesp1812-postgresperf','PostgreSQL — otimização e análise de desempenho','https://www.postgresql.org/docs/current/performance-tips.html','PostgreSQL','Documentação sobre planos de execução, EXPLAIN e fatores de desempenho de consultas SQL.','study_reference'),
('ctesp1812-cisco-network','Cisco Networking Academy — conceitos básicos de redes','https://www.netacad.com/pt/catalogs/learn','Cisco Networking Academy','Catálogo formativo sobre redes, protocolos IP, dispositivos, endereçamento e laboratório prático.','study_reference'),
('ctesp1812-ualg-plan','Plano oficial CTeSP Sistemas e Tecnologias de Informação — UAlg','https://www.ualg.pt/curso/1812/plano','Universidade do Algarve','Plano de estudos 2026/27 para consulta de códigos, ECTS, anos e semestres. Não equivale à ficha detalhada de Estágio.','academic_planning');
CREATE TEMP TABLE _ctesp1812_reading_map(
 unit_code text NOT NULL,source_key text NOT NULL,priority int NOT NULL,
 PRIMARY KEY(unit_code,source_key)
) ON COMMIT DROP;
INSERT INTO _ctesp1812_reading_map VALUES ('18121019','postgres-tutorial',1),
('18121019','mit-algorithms',2),
('18121007','pandas-start',3),
('18121007','openstax-stats',4),
('18121007','ctesp1812-powerbi',5),
('18121003','ctesp1812-libreoffice',6),
('18121003','ctesp1812-sharepoint',7),
('18121000','openstax-calc-one',8),
('18121000','mit-linear',9),
('18121000','openstax-stats',10),
('18121001','python-tutorial',11),
('18121001','mit-intro-code',12),
('18121006','python-tutorial',13),
('18121006','typescript-handbook',14),
('18121006','mit-algorithms',15),
('18121009','ctesp1812-sharepoint',16),
('18121009','ctesp1812-powerautomate',17),
('18121012','openstax-management',18),
('18121012','project-management-openlearn',19),
('18121012','design-double-diamond',20),
('18121008','ostep-os',21),
('18121008','docker-getstart',22),
('18121005','ctesp1812-communication',23),
('18121005','english-writing-bc',24),
('18121018','mdn-web',25),
('18121018','w3c-accessibility',26),
('18121018','react-learn',27),
('18121017','pro-git',28),
('18121017','github-actions',29),
('18121017','docker-getstart',30),
('18121020','postgres-tutorial',31),
('18121020','ctesp1812-postgresperf',32),
('18121015','pandas-start',33),
('18121015','ctesp1812-powerbi',34),
('18121015','openstax-stats',35),
('18121014','ctesp1812-cisco-network',36),
('18121014','owasp-topten',37),
('18121011','openstax-marketing',38),
('18121011','ctesp1812-google-seo',39),
('18121011','ctesp1812-analytics',40),
('18121016','project-management-openlearn',41),
('18121016','ctesp1812-ualg-plan',42),
('18121016','ctesp1812-communication',43);
CREATE TEMP TABLE _ctesp1812_video_map(
 unit_code text NOT NULL,youtube_id text NOT NULL,priority int NOT NULL,
 PRIMARY KEY(unit_code,youtube_id)
) ON COMMIT DROP;
INSERT INTO _ctesp1812_video_map VALUES ('18121019','N_0ujgVRrdI',1),
('18121019','SLY_ZcNYjIY',2),
('18121019','Yvw60m0E9D8',3),
('18121019','GeaIMnCbRPQ',4),
('18121019','zgNQrW6OhMU',5),
('18121019','HmFUrlQcCJ0',6),
('18121019','tBJsOkGe4fE',7),
('18121007','MiMO4f6b1BY',8),
('18121007','qQ51wuIgM7E',9),
('18121007','GhKVR72eJmA',10),
('18121001','rfscVS0vtbw',11),
('18121006','oQPYxhqoH1o',12),
('18121006','eXVlK2PzE1k',13),
('18121006','fkjjqyfN51c',14),
('18121008','MtxP2pyCvYA',15),
('18121008','gBuTIrEG87s',16),
('18121009','T-Cjbx3Ie3g',17),
('18121018','dU7GwCOgvNY',18),
('18121018','5gpLQa_N2iA',19),
('18121017','Ala6PHlYjmw',20),
('18121017','K5Ux_m0ccuo',21),
('18121017','InKNIvky2KE',22),
('18121020','_C6vXSCazts',23),
('18121020','N3gvsXPyFt4',24),
('18121020','1SOk2p1peLo',25),
('18121015','qQ51wuIgM7E',26),
('18121015','MiMO4f6b1BY',27),
('18121015','GhKVR72eJmA',28),
('18121014','UIcCwuYzxcE',29),
('18121012','T-Cjbx3Ie3g',30);
DO $guard$ BEGIN
 IF (SELECT count(*) FROM _ctesp1812_fresh_source)<>10
 OR (SELECT count(*) FROM _ctesp1812_reading_map)<>43
 OR (SELECT count(*) FROM _ctesp1812_video_map)<>30
 THEN RAISE EXCEPTION 'The reference manifest changed'; END IF;
 IF EXISTS(SELECT 1 FROM _ctesp1812_reading_map m
  LEFT JOIN facodi.curricular_units u ON u.code=m.unit_code AND u.course_id=md5('facodi:ualg:1812:course:record')::uuid
  WHERE u.id IS NULL OR NOT u.published) THEN
   RAISE EXCEPTION 'Unknown curricular mapping';
 END IF;
 IF EXISTS(SELECT 1 FROM _ctesp1812_reading_map m
  LEFT JOIN _ctesp1812_fresh_source f ON f.source_key=m.source_key
  LEFT JOIN facodi.learning_objects e ON e.source_type='external' AND e.source_id=m.source_key
  WHERE f.source_key IS NULL AND (e.id IS NULL OR NOT e.published OR e.object_type<>'external_resource'))
 THEN RAISE EXCEPTION 'Missing or unpublished existing external reference'; END IF;
 IF EXISTS(SELECT 1 FROM _ctesp1812_video_map m
  LEFT JOIN public.videos v ON v.youtube_id=m.youtube_id
  LEFT JOIN facodi.learning_objects lo ON lo.id=md5('facodi:video:'||v.id::text)::uuid
  WHERE v.id IS NULL OR lo.id IS NULL OR NOT lo.published
  OR lo.object_type<>'video') THEN RAISE EXCEPTION 'Video not in published real shared catalogue';END IF;
END $guard$;

INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,language,status,published,
 source_type,source_url,source_id,tags,metadata)
SELECT md5('facodi:oer:'||f.source_key)::uuid,
 'external_resource',f.title,'facodi-reading-'||f.source_key,
 f.summary||' Conteúdo externo de apoio; consulte os direitos de utilização na origem. Não é material letivo oficialmente aprovado pela UAlg.',
 'pt','active',true,'external',f.url,f.source_key,
 ARRAY['leitura','recurso-externo','ctesp-sti'],
 jsonb_build_object('publisher',f.publisher,'resource_purpose',f.purpose,
 'content_license_verified',false,
 'source_material_copied',false,
 'curation_scope','official_external_landing_page',
 'official_ualg_course_material',false,
 'is_official_study_plan',f.source_key='ctesp1812-ualg-plan',
 'academic_year','2026/27','source_quality','verified_external_reference',
 'curation_batch','facodi_ctesp1812_external_sources_2026_11_14')
FROM _ctesp1812_fresh_source f
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:oer:source:'||f.source_key)::uuid,
 md5('facodi:oer:'||f.source_key)::uuid,
 'website',f.source_key,f.url,f.title,
 jsonb_build_object('publisher',f.publisher,
 'course','CTESP-STI','academic_year','2026/27',
 'external_content_not_reproduced',true)
FROM _ctesp1812_fresh_source f ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.keywords(id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:oer:keyword:'||f.source_key)::uuid,
 md5('facodi:oer:'||f.source_key)::uuid,
 f.title,lower(btrim(f.title)),'pt',1,'external_reference_title',
 jsonb_build_object('source_url',f.url)
FROM _ctesp1812_fresh_source f
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:ctesp1812:reading:'||m.unit_code||':'||m.source_key)::uuid,
 u.learning_object_id,
 e.id,'contains',50000+m.priority,
 'verified_external_reading_curation',
 jsonb_build_object('review_status','approved','review_scope','external_landing_page',
 'academic_year','2026/27','university_course_code','1812',
 'resource_purpose',coalesce(e.metadata->>'resource_purpose','study_reference'),
 'source_object_id',e.id,'is_official_ualg_course_material',false,
 'source_material_copied',false,'curation_batch','ctesp1812_topic_level_reuse')
FROM _ctesp1812_reading_map m
JOIN facodi.curricular_units u ON u.code=m.unit_code
 AND u.course_id=md5('facodi:ualg:1812:course:record')::uuid
JOIN facodi.learning_objects e ON e.source_type='external' AND e.source_id=m.source_key
WHERE e.published AND e.object_type='external_resource'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT DISTINCT e.id, tag.id FROM _ctesp1812_reading_map m
JOIN facodi.learning_objects e ON e.source_type='external' AND e.source_id=m.source_key
JOIN facodi.tags tag ON tag.slug='uc-'||m.unit_code
ON CONFLICT DO NOTHING;

-- Reuse videos via their canonical public.videos rows: no copies or new uploads.
INSERT INTO facodi.unit_videos(
 id,curricular_unit_id,video_id,position,metadata)
SELECT md5('facodi:ctesp1812:unit-video:'||m.unit_code||':'||m.youtube_id)::uuid,
 u.id,v.id,10000+m.priority,
 jsonb_build_object('review_status','approved',
 'source','already_published_facodi_video',
 'source_video_id',v.id,'youtube_id',v.youtube_id,
 'review_scope','title_and_channel_only','full_video_reviewed',false,
 'content_license_verified',false,
 'curation_batch','ctesp1812_cross_course_topic_reuse',
 'is_official_ualg_course_material',false)
FROM _ctesp1812_video_map m
JOIN facodi.curricular_units u ON u.code=m.unit_code
 AND u.course_id=md5('facodi:ualg:1812:course:record')::uuid
JOIN public.videos v ON v.youtube_id=m.youtube_id
ON CONFLICT(curricular_unit_id,video_id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,
 created_by_mechanism,metadata)
SELECT md5('facodi:ctesp1812:video-relation:'||m.unit_code||':'||m.youtube_id)::uuid,
 u.learning_object_id,lo.id,
 'contains',10000+m.priority,
 'metadata_based_educational_curation',
 jsonb_build_object('review_status','approved',
 'review_scope','title_and_channel_only',
 'full_video_reviewed',false,
 'content_license_verified',false,
 'source_object_id',lo.id,'youtube_id',v.youtube_id,
 'is_official_ualg_course_material',false,
 'curation_batch','ctesp1812_cross_course_topic_reuse')
FROM _ctesp1812_video_map m
JOIN facodi.curricular_units u ON u.code=m.unit_code
 AND u.course_id=md5('facodi:ualg:1812:course:record')::uuid
JOIN public.videos v ON v.youtube_id=m.youtube_id
JOIN facodi.learning_objects lo ON lo.id=md5('facodi:video:'||v.id::text)::uuid
 AND lo.published AND lo.status='active'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT DISTINCT lo.id,tag.id FROM _ctesp1812_video_map m
JOIN public.videos v ON v.youtube_id=m.youtube_id
JOIN facodi.learning_objects lo ON lo.id=md5('facodi:video:'||v.id::text)::uuid
JOIN facodi.tags tag ON tag.slug='uc-'||m.unit_code
ON CONFLICT DO NOTHING;

DO $check$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_object_relations r
  JOIN facodi.curricular_units u ON u.learning_object_id=r.parent_object_id
  WHERE u.course_id=md5('facodi:ualg:1812:course:record')::uuid
   AND r.created_by_mechanism='verified_external_reading_curation')<>43
 THEN RAISE EXCEPTION 'Incomplete external reference associations';END IF;
 IF (SELECT count(*) FROM facodi.unit_videos uv
  JOIN facodi.curricular_units u ON u.id=uv.curricular_unit_id
  WHERE u.course_id=md5('facodi:ualg:1812:course:record')::uuid
   AND uv.metadata->>'review_status'='approved')<>30
 THEN RAISE EXCEPTION 'Incomplete approved video associations'; END IF;
END $check$;