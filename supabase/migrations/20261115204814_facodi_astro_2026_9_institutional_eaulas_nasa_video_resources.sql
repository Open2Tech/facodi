
CREATE TEMP TABLE _astro_ext(slug text PRIMARY KEY,title text,url text,author text,units jsonb,summary text) ON COMMIT DROP;
INSERT INTO _astro_ext SELECT j->>0,j->>1,j->>2,j->>3,j->4,j->>5
 FROM jsonb_array_elements('[["usp-observar","USP e-Aulas — Observar sem ver","https://eaulas.usp.br/portal/video.action?idItem=1200","Enos Picazzio",["FACODI-GACS18-ASTRO01","FACODI-GACS18-ASTRO02"],"Observação astronómica: aula institucional."],["usp-esfera-1","USP e-Aulas — Esfera Celeste, parte 1","https://eaulas.usp.br/portal/video.action?idItem=157","Enos Picazzio",["FACODI-GACS18-ASTRO02"],"Esfera celeste e observação do céu: primeira aula."],["usp-esfera-2","USP e-Aulas — Esfera Celeste, parte 2","https://eaulas.usp.br/portal/video.action?idItem=162","Enos Picazzio",["FACODI-GACS18-ASTRO02"],"Continuação do conteúdo de esfera celeste."],["usp-coordenadas","USP e-Aulas — Sistemas de Coordenadas","https://eaulas.usp.br/portal/video.action?idItem=161","Enos Picazzio",["FACODI-GACS18-ASTRO02"],"Sistemas de coordenadas para descrever o céu."],["usp-tempo","USP e-Aulas — Tempo e Calendário","https://eaulas.usp.br/portal/video.action?idItem=166","Enos Picazzio",["FACODI-GACS18-ASTRO02","FACODI-GACS18-ASTRO03"],"Tempo, calendário e movimentos aparentes no sistema Sol–Terra–Lua."],["usp-ceu","USP e-Aulas — Céu Noturno e Coordenadas","https://eaulas.usp.br/portal/video.action?idItem=172","Dinah Allen",["FACODI-GACS18-ASTRO02"],"Observação do céu noturno e coordenadas celestes."],["usp-exoplanetas","USP e-Aulas — Outros, como o nosso","https://eaulas.usp.br/portal/video.action?idItem=1205","Sylvio Ferraz Mello",["FACODI-GACS18-ASTRO04","FACODI-GACS18-ASTRO09"],"Introdução a outros sistemas planetários e exoplanetas."],["nasa-video","NASA — Launchpad: Astrobiology","https://science.nasa.gov/eclips/videos/astrobiology/","NASA",["FACODI-GACS18-ASTRO09"],"Vídeo NASA sobre a busca de vida e ambientes habitáveis no Sistema Solar."],["nasa-material","NASA Astrobiology — Materiais e vídeos educativos","https://astrobiology.nasa.gov/classroom-materials/","NASA Astrobiology",["FACODI-GACS18-ASTRO09","FACODI-GACS18-ASTRO10"],"Recursos educativos institucionais da NASA sobre astrobiologia."]]'::jsonb) j;
CREATE TEMP TABLE _astro_links ON COMMIT DROP AS SELECT r.slug,unit.value unit_code
 FROM _astro_ext r CROSS JOIN LATERAL jsonb_array_elements_text(r.units) unit(value);

DO $guard$ BEGIN
 IF (SELECT count(*) FROM _astro_ext)<>9
 OR (SELECT count(*) FROM _astro_links)<>13
 OR EXISTS(SELECT 1 FROM _astro_ext r
    JOIN facodi.learning_objects o ON o.slug='facodi-astro-ext-2026-'||r.slug)
 OR EXISTS(SELECT 1 FROM _astro_links l LEFT JOIN facodi.curricular_units u ON u.code=l.unit_code
   LEFT JOIN facodi.courses c ON c.id=u.course_id
   WHERE u.id IS NULL OR NOT u.published OR c.code<>'FACODI-GACS-ASTRO-2018')
 THEN RAISE EXCEPTION 'External astro references: identifiers, units or counts invalid'; END IF;
END $guard$;

INSERT INTO facodi.learning_objects(id,object_type,title,slug,description,objectives,keywords,tags,
language,status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:astro:institutional:2026:'||slug)::uuid,
 'external_resource',title,'facodi-astro-ext-2026-'||slug,
 summary||' Fonte: '||author||'. A FACODI remete para a página original; não copia ou aloja ficheiros de vídeo.',
 '[]'::jsonb,ARRAY['Astronomia',author,'videoaula externa'],
 ARRAY['facodi','astronomia','recurso-externo','videoaula-institucional'],
 CASE WHEN author LIKE 'NASA%' THEN 'en' ELSE 'pt-BR' END,
 'active',true,'external',url,'astro-institutional:'||slug,
 jsonb_build_object('publisher',CASE WHEN author LIKE 'NASA%' THEN 'NASA' ELSE 'USP e-Aulas' END,
 'author',author,'source_official_landing_page',true,
 'review_scope','official_external_landing_page','downloaded_video',false,
 'copyright_rehosting_allowed',false,'official_facodi_material',false,
 'curation_batch','facodi_astro_eaulas_nasa_external_lectures_20261115')
FROM _astro_ext
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro:institutional:link:2026:'||a.slug||':'||a.unit_code)::uuid,
 u.learning_object_id,md5('facodi:astro:institutional:2026:'||a.slug)::uuid,
 'contains',98000+row_number() OVER (PARTITION BY u.id ORDER BY a.slug)::integer,
 'verified_external_reading_curation',
 jsonb_build_object('review_status','approved','review_scope','external_landing_page',
 'source_type','official_usp_or_nasa_link','copyright_rehosting_allowed',false,
 'curation_batch','facodi_astro_eaulas_nasa_external_lectures_20261115')
FROM _astro_links a JOIN facodi.curricular_units u ON u.code=a.unit_code
 JOIN facodi.courses c ON c.id=u.course_id AND c.code='FACODI-GACS-ASTRO-2018'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $verify$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects WHERE object_type='external_resource'
   AND metadata->>'curation_batch'='facodi_astro_eaulas_nasa_external_lectures_20261115')<>9
 OR (SELECT count(*) FROM facodi.learning_object_relations r
   JOIN facodi.learning_objects lo ON lo.id=r.child_object_id
   WHERE lo.metadata->>'curation_batch'='facodi_astro_eaulas_nasa_external_lectures_20261115')<>13
 THEN RAISE EXCEPTION 'Institutional link count failed after insert'; END IF;
END $verify$;
