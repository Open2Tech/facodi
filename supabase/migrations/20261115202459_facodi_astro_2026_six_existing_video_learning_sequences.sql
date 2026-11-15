
-- 2026-11 FACODI: educational astronomy pathways reuse already-published videos.
-- No YouTube copies, no exercises, no claim of accreditation or viewing every video.
CREATE TEMP TABLE _astro_new (
 slug text PRIMARY KEY,title text NOT NULL,level text NOT NULL,
 videos jsonb NOT NULL,units jsonb NOT NULL,topics jsonb NOT NULL,
 after jsonb NOT NULL,note text NOT NULL
) ON COMMIT DROP;
INSERT INTO _astro_new SELECT * FROM jsonb_to_recordset('[{"slug":"astro-gravitacao-orbitas","title":"Astronomia — gravitação, movimento e órbitas","level":"introductory","videos":["5rXU-Z_ojfM","1fT1nVfbW-4","NnwSeQ5otM4","knhR38J1kOc","lNB8x2k0YNg"],"units":["FACODI-GACS18-ASTRO03","FACODI-GACS18-ASTRO04"],"topics":["Grandezas e vetores","Movimento e leis de Newton","Gravitação como fundamento de órbitas","Contexto histórico de missões espaciais"],"after":["facodi-science-fisica-vetores-cinematica"],"note":"O material explica fundamentos físicos usados em astronomia, mas não constitui um curso completo de mecânica orbital."},{"slug":"astro-luz-ondas-observacao","title":"Astronomia — luz, ondas e observação","level":"introductory","videos":["DycQqhlB68g","5cBSgGjLczc","VNTBHXDarb4","H_s5gDeSLq8"],"units":["FACODI-GACS18-ASTRO05"],"topics":["Ondas mecânicas e eletromagnéticas","Natureza da luz","Fótons e espectro eletromagnético","Fundamentos físicos de observação astronómica"],"after":["facodi-science-fisica-ondas-optica-moderna"],"note":"São fundamentos físicos: não há neste conjunto uma aula específica sobre montagem ou utilização de telescópios."},{"slug":"astro-estrelas-energia","title":"Astrofísica — energia e princípios físicos das estrelas","level":"introductory","videos":["SuNABtcEjCw","SraCw6iqu3E","5cBSgGjLczc","VNTBHXDarb4"],"units":["FACODI-GACS18-ASTRO06"],"topics":["Energia e conversões","Radiação e luz","Relação entre energia e observação de estrelas","Questões de aprofundamento"],"after":["facodi-astro-sequence-astro-luz-ondas-observacao"],"note":"Percurso de fundamentos. Os vídeos não cobrem por completo evolução estelar ou nucleossíntese."},{"slug":"astro-galaxias-cosmologia-divulgacao","title":"Universo e cosmologia — conversas de divulgação científica","level":"contextual","videos":["rXt6H-WypYM","aGBvv4DPXK8","mbykpkwPSws"],"units":["FACODI-GACS18-ASTRO07","FACODI-GACS18-ASTRO08"],"topics":["Questões sobre o Universo","Distinguir divulgação e aula formal","Como interpretar afirmações sobre galáxias e cosmologia","Perguntas para estudo posterior"],"after":["facodi-astro-sequence-astro-estrelas-energia"],"note":"Conversas de divulgação e entrevistas, não aulas curriculares sobre expansão do Universo nem prova de cobertura integral."},{"slug":"astro-missoes-ciencia-comunicacao","title":"Astronomia — missões espaciais e comunicação científica","level":"contextual","videos":["lNB8x2k0YNg","NnwSeQ5otM4","aGBvv4DPXK8","mbykpkwPSws"],"units":["FACODI-GACS18-ASTRO01","FACODI-GACS18-ASTRO04","FACODI-GACS18-ASTRO10"],"topics":["Missão Apollo 13 e comunicação pública","Gravitação no contexto da exploração espacial","Diálogo com divulgadores científicos","Investigar a fiabilidade de fontes"],"after":["facodi-astro-sequence-astro-gravitacao-orbitas"],"note":"Tem entrevistas e vídeos de divulgação; não representa registo histórico das atividades GACS de 2018."},{"slug":"astro-fisica-espacial-ondas","title":"Física do espaço — ondas e tópicos avançados","level":"advanced_optional","videos":["DycQqhlB68g","VNTBHXDarb4","H_s5gDeSLq8","mbykpkwPSws"],"units":["FACODI-GACS18-ASTRO09"],"topics":["Ondas mecânicas e eletromagnéticas","Comportamento ondulatório da matéria","Física espacial: conversa de divulgação","Limites do conjunto face a ondas gravitacionais e astrobiologia"],"after":["facodi-astro-sequence-astro-luz-ondas-observacao"],"note":"Introdução conceitual. Não há neste conjunto aulas específicas de deteção de ondas gravitacionais ou astrobiologia."}]'::jsonb)
 AS x(slug text,title text,level text,videos jsonb,units jsonb,topics jsonb,after jsonb,note text);
CREATE TEMP TABLE _astro_video ON COMMIT DROP AS
SELECT s.slug,j.value youtube_id,j.ordinality::int position
FROM _astro_new s CROSS JOIN LATERAL jsonb_array_elements_text(s.videos)
WITH ORDINALITY j(value,ordinality);
CREATE TEMP TABLE _astro_units ON COMMIT DROP AS
SELECT s.slug,u.value unit_code FROM _astro_new s
CROSS JOIN LATERAL jsonb_array_elements_text(s.units) u(value);

DO $guard$ BEGIN
 IF (SELECT count(*) FROM _astro_new)<>6
    OR EXISTS(SELECT 1 FROM _astro_new WHERE jsonb_array_length(videos)<3
      OR jsonb_array_length(topics)<3)
    OR EXISTS(SELECT 1 FROM _astro_video GROUP BY slug,youtube_id HAVING count(*)>1)
    OR EXISTS(
      SELECT 1 FROM _astro_video v
      LEFT JOIN facodi.youtube_videos y ON y.youtube_video_id=v.youtube_id
      LEFT JOIN facodi.learning_objects lo ON lo.id=y.learning_object_id
      WHERE lo.id IS NULL OR lo.object_type<>'video' OR lo.status<>'active'
        OR NOT lo.published OR y.status<>'published')
    OR EXISTS(
      SELECT 1 FROM _astro_units u LEFT JOIN facodi.curricular_units cu
        ON cu.code=u.unit_code
      LEFT JOIN facodi.courses c ON c.id=cu.course_id
      WHERE cu.id IS NULL OR c.code<>'FACODI-GACS-ASTRO-2018'
        OR NOT cu.published OR cu.status<>'active')
    OR EXISTS(
      SELECT 1 FROM _astro_new s JOIN facodi.learning_objects lo
      ON lo.slug='facodi-astro-sequence-'||s.slug
    ) THEN
    RAISE EXCEPTION 'Astronomy sequence: missing video/unit, invalid inputs, existing slug';
 END IF;
END $guard$;

INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,objectives,keywords,tags,
 language,status,published,source_type,source_id,metadata)
SELECT md5('facodi:astro-sequence:2026:'||s.slug)::uuid,
 'playlist',s.title,'facodi-astro-sequence-'||s.slug,
 'Percurso de estudo FACODI com vídeos educativos já publicados pelos seus autores. A sequência é uma proposta pedagógica ordenada por tópico e título, não uma reprodução do curso original GACS 2018 nem material oficialmente homologado. '||s.note,
 jsonb_build_array('Consultar as aulas ou entrevistas na ordem proposta.',
 'Relacionar os conceitos com a unidade curricular indicada.',
 'Distinguir conteúdos de divulgação de aulas estruturadas.'),
 ARRAY[s.title,'Astronomia','Astrofísica','FACODI','sequência pedagógica'],
 ARRAY['facodi','astronomia','astrofisica','sequencia-video','recursos-externos',s.level],
 'pt-PT','active',true,'generated','facodi:astro-sequence:2026:'||s.slug,
 jsonb_build_object(
   'playlist_type','facodi_owned_editorial_sequence',
   'sequence_domain','astronomy',
   'learning_level',s.level,
   'topics',s.topics,
   'recommended_after',s.after,
   'curation_notes',s.note,
   'curation_method','manual_title_channel_topic_ordering',
   'metadata_review_only',true,
   'teacher_approved',false,
   'official_curriculum_status','independent_FACODI_supplementary_not_homologated',
   'historical_reconstruction',true,
   'historical_GACS_activity_evidence',false,
   'full_video_review_completed',false,
   'playback_verified',false,
   'copyright_rehosting_allowed',false,
   'youtube_native_playlist',false,
   'video_count',jsonb_array_length(s.videos),
   'curation_batch','facodi_astro_sequence_existing_videos_20261115')
FROM _astro_new s ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro-sequence:video:'||v.slug||':'||v.youtube_id)::uuid,
 md5('facodi:astro-sequence:2026:'||v.slug)::uuid,
 y.learning_object_id,'contains',v.position,
 'metadata_based_educational_curation',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
  'teacher_approved',false,'full_video_reviewed',false,
  'video_reused_from_catalog',true,'youtube_video_id',v.youtube_id,
  'curation_batch','facodi_astro_sequence_existing_videos_20261115')
FROM _astro_video v JOIN facodi.youtube_videos y ON y.youtube_video_id=v.youtube_id
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro-sequence:unit:'||u.slug||':'||cu.id::text)::uuid,
 cu.learning_object_id,md5('facodi:astro-sequence:2026:'||u.slug)::uuid,
 'contains',88000+row_number() OVER (PARTITION BY cu.id ORDER BY u.slug)::int,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','supplementary_study_path',
  'teacher_approved',false,'formal_course_content',false,
  'curation_batch','facodi_astro_sequence_existing_videos_20261115')
FROM _astro_units u JOIN facodi.curricular_units cu ON cu.code=u.unit_code
JOIN facodi.courses c ON c.id=cu.course_id AND c.code='FACODI-GACS-ASTRO-2018'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro-sequence:course:'||s.slug)::uuid,
 c.learning_object_id,md5('facodi:astro-sequence:2026:'||s.slug)::uuid,
 'contains',88000+row_number() OVER (ORDER BY s.slug)::int,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','relationship','supplementary_astro_sequence',
  'teacher_approved',false,'curation_batch','facodi_astro_sequence_existing_videos_20261115')
FROM _astro_new s JOIN facodi.courses c ON c.code='FACODI-GACS-ASTRO-2018'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Reuse pre-existing physics sequences where they are relevant as prerequisites;
-- no duplicate playlist objects or video rows are created.
CREATE TEMP TABLE _astro_existing_link(unit_code text,playlist_slug text,rationale text)
ON COMMIT DROP;
INSERT INTO _astro_existing_link
SELECT j.value->>0,j.value->>1,j.value->>2
FROM jsonb_array_elements('[["FACODI-GACS18-ASTRO03","facodi-science-fisica-vetores-cinematica","fundamento de movimento"],["FACODI-GACS18-ASTRO04","facodi-science-fisica-trabalho-energia","complemento sobre energia"],["FACODI-GACS18-ASTRO05","facodi-science-fisica-ondas-optica-moderna","fundamento de ondas e luz"],["FACODI-GACS18-ASTRO09","facodi-science-fisica-ondas-optica-moderna","base física, não cobertura de astrobiologia"]]'::jsonb) j(value);

DO $cross_guard$ BEGIN
 IF EXISTS(
   SELECT 1 FROM _astro_existing_link l
   LEFT JOIN facodi.learning_objects pl ON pl.slug=l.playlist_slug
   LEFT JOIN facodi.curricular_units u ON u.code=l.unit_code
   LEFT JOIN facodi.courses c ON c.id=u.course_id
   WHERE pl.id IS NULL OR pl.object_type<>'playlist' OR NOT pl.published
     OR u.id IS NULL OR c.code<>'FACODI-GACS-ASTRO-2018' OR NOT u.published)
 THEN RAISE EXCEPTION 'A pre-existing physics sequence or target unit is unavailable'; END IF;
END $cross_guard$;
INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro-physics-reuse:'||e.unit_code||':'||e.playlist_slug)::uuid,
 cu.learning_object_id,pl.id,'contains',86500+row_number()
  OVER (PARTITION BY cu.id ORDER BY e.playlist_slug)::int,'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','supplementary_foundation_only',
  'rationale',e.rationale,'teacher_approved',false,
  'curation_batch','facodi_astro_sequence_existing_videos_20261115')
FROM _astro_existing_link e
JOIN facodi.curricular_units cu ON cu.code=e.unit_code
JOIN facodi.courses c ON c.id=cu.course_id AND c.code='FACODI-GACS-ASTRO-2018'
JOIN facodi.learning_objects pl ON pl.slug=e.playlist_slug
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;
DO $verify$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects
   WHERE object_type='playlist' AND published
   AND metadata->>'curation_batch'='facodi_astro_sequence_existing_videos_20261115')<>6
 OR (SELECT count(*) FROM facodi.learning_object_relations r
   JOIN facodi.learning_objects p ON p.id=r.parent_object_id
   WHERE p.metadata->>'curation_batch'='facodi_astro_sequence_existing_videos_20261115'
   AND r.relation_type='contains')<>24
 THEN RAISE EXCEPTION 'New astronomy sequence or lesson count was unexpected'; END IF;
END $verify$;
