
-- FACODI collections group extant, already-published topic playlists.
-- Zero new video, no exercises, no fabricated university approval or certifications.
CREATE TEMP TABLE _facodi_science_collection (
 slug text PRIMARY KEY,title text NOT NULL,domain text NOT NULL,course jsonb NOT NULL,
 playlists jsonb NOT NULL,note text NOT NULL
) ON COMMIT DROP;
INSERT INTO _facodi_science_collection SELECT * FROM
jsonb_to_recordset('[{"slug":"facodi-study-astronomy-gacs-2018","title":"Astronomia e astrofísica — percurso orientado GACS/FACODI","domain":"astronomy","course":["FACODI-GACS-ASTRO-2018"],"playlists":["facodi-astro-sequence-astro-gravitacao-orbitas","facodi-astro-sequence-astro-luz-ondas-observacao","facodi-astro-sequence-astro-estrelas-energia","facodi-astro-sequence-astro-galaxias-cosmologia-divulgacao","facodi-astro-sequence-astro-fisica-espacial-ondas","facodi-astro-sequence-astro-missoes-ciencia-comunicacao"],"note":"Reorganização autoral e contemporânea da FACODI, não programa oficial ou reconstrução documental das sessões GACS de 2018."},{"slug":"facodi-study-physics-foundations","title":"Física — do movimento à termodinâmica, luz e eletricidade","domain":"physics","course":["LESTI","IFES-CAR-ADM-INT-2026"],"playlists":["facodi-science-fisica-vetores-cinematica","facodi-science-fisica-dinamica-newton","facodi-science-fisica-trabalho-energia","facodi-science-fisica-calor-termodinamica","facodi-science-fisica-eletricidade-magnetismo","facodi-science-fisica-ondas-optica-moderna","facodi-science-fisica-engenharia-modelacao"],"note":"Percurso suplementar multidisciplinar com aprofundamentos opcionais que podem não constar do programa específico de cada UC."},{"slug":"facodi-study-chemistry-ifes","title":"Química — ligações, termologia e reações","domain":"chemistry","course":["IFES-CAR-ADM-INT-2026"],"playlists":["facodi-playlist-ifes-mesalva-ligacoes-quimicas","facodi-science-quimica-termoquimica-gases","facodi-science-quimica-cinetica-equilibrio-eletro"],"note":"As aulas universitárias de físico-química são complementares e não substituem os conteúdos obrigatórios do ensino médio."},{"slug":"facodi-study-biology-ifes","title":"Biologia — genética, microbioma, evolução e ambiente","domain":"biology","course":["IFES-CAR-ADM-INT-2026"],"playlists":["facodi-playlist-ifes-mesalva-genetica","facodi-science-biologia-genetica-hereditariedade","facodi-playlist-ifes-kurzgesagt-biosfera","facodi-science-biologia-microbioma-imunidade","facodi-science-biologia-evolucao-ecologia"],"note":"Combina aulas e divulgação científica de canais existentes; conteúdos de saúde são educativos, não orientações médicas."}]'::jsonb)
AS x(slug text,title text,domain text,course jsonb,playlists jsonb,note text);

CREATE TEMP TABLE _facodi_collection_part ON COMMIT DROP AS
SELECT s.slug,p.value playlist_slug,p.ordinality::int position
FROM _facodi_science_collection s CROSS JOIN LATERAL
jsonb_array_elements_text(s.playlists) WITH ORDINALITY p(value,ordinality);

CREATE TEMP TABLE _facodi_collection_course ON COMMIT DROP AS
SELECT s.slug,c.value course_code FROM _facodi_science_collection s
CROSS JOIN LATERAL jsonb_array_elements_text(s.course) c(value);

DO $validate$ BEGIN
 IF (SELECT count(*) FROM _facodi_science_collection)<>4
 OR EXISTS(SELECT 1 FROM _facodi_collection_part GROUP BY slug,playlist_slug HAVING count(*)>1)
 OR EXISTS(
  SELECT 1 FROM _facodi_collection_part cp LEFT JOIN facodi.learning_objects pl
    ON pl.slug=cp.playlist_slug
  WHERE pl.id IS NULL OR pl.object_type<>'playlist' OR NOT pl.published OR pl.status<>'active')
 OR EXISTS(
  SELECT 1 FROM _facodi_collection_course cc LEFT JOIN facodi.courses c
  ON c.code=cc.course_code
  WHERE c.id IS NULL OR NOT c.published OR c.status<>'active')
 OR EXISTS(
  SELECT 1 FROM _facodi_science_collection s JOIN facodi.learning_objects lo
  ON lo.slug=s.slug) THEN
 RAISE EXCEPTION 'Collection manifest has duplicates, missing playlists/courses, or existing slugs';
 END IF;
END $validate$;

INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,objectives,keywords,tags,language,
 status,published,source_type,source_id,metadata
)
SELECT md5('facodi:science-collection:2026:'||s.slug)::uuid,
 'collection',s.title,s.slug,
 'Coleção temática FACODI que reúne sequências de vídeos externos existentes, ordenadas como percurso sugerido. Conteúdo suplementar; não homologado pelas instituições de ensino. '||s.note,
 jsonb_build_array('Explorar as sequências por tema.',
  'Relacionar cada recurso com a UC e o plano oficial, quando aplicável.',
  'Distinguir vídeos de aulas estruturadas, aprofundamentos opcionais e divulgação.'),
 ARRAY[s.title,s.domain,'FACODI','coleção de sequências'],
 ARRAY['facodi','ciencias','colecao','percurso','recursos-externos',s.domain],
 'pt-PT','active',true,'generated','facodi:science-collection:2026:'||s.slug,
 jsonb_build_object('collection_type','topic_ordered_existing_video_sequences',
  'area',s.domain,'playlist_count',jsonb_array_length(s.playlists),
  'topics_order',s.playlists,'curation_notes',s.note,
  'source_video_catalog','public.videos','reuses_existing_playlists',true,
  'teacher_approved',false,'official_curriculum_status','supplementary_not_homologated',
  'metadata_review_only',true,'full_video_review_completed',false,
  'copyright_rehosting_allowed',false,
  'curation_batch','facodi_science_collection_reuse_20261115')
FROM _facodi_science_collection s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:science-collection:playlist:'||s.slug||':'||s.playlist_slug)::uuid,
 md5('facodi:science-collection:2026:'||s.slug)::uuid,
 pl.id,'contains',s.position,'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
  'pedagogical_scope','topic_ordered_playlists','teacher_approved',false,
  'curation_batch','facodi_science_collection_reuse_20261115')
FROM _facodi_collection_part s
JOIN facodi.learning_objects pl ON pl.slug=s.playlist_slug
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:science-collection:course:'||x.slug||':'||x.course_code)::uuid,
 c.learning_object_id,
 md5('facodi:science-collection:2026:'||x.slug)::uuid,
 'contains',89000+row_number() OVER (PARTITION BY c.id ORDER BY x.slug)::int,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
  'pedagogical_scope','supplementary_collection',
  'teacher_approved',false,'curation_batch','facodi_science_collection_reuse_20261115')
FROM _facodi_collection_course x
JOIN facodi.courses c ON c.code=x.course_code
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $verify$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects
     WHERE object_type='collection' AND metadata->>'curation_batch'='facodi_science_collection_reuse_20261115')<>4
 OR (SELECT count(*) FROM facodi.learning_object_relations r
     JOIN facodi.learning_objects lo ON lo.id=r.parent_object_id
     WHERE lo.metadata->>'curation_batch'='facodi_science_collection_reuse_20261115')<>21
 THEN RAISE EXCEPTION 'Collection or ordered-playlist count mismatch'; END IF;
END $verify$;
