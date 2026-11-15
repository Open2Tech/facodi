
-- Official external video playlists, sourced from IAG-USP/UNIVESP course pages
-- and USP digital listing; only links, no copied video metadata/media or claims
-- of affiliation, copyright licence, or course accreditation.
CREATE TEMP TABLE _astro_official_playlist (
 slug text PRIMARY KEY,title text NOT NULL,playlist text NOT NULL,
 count integer NOT NULL,source text NOT NULL,units jsonb NOT NULL,note text NOT NULL
) ON COMMIT DROP;
INSERT INTO _astro_official_playlist SELECT * FROM jsonb_to_recordset('[{"slug":"facodi-astro-referencia-univesp-usp-visao-geral-i","title":"Astronomia: Uma Visão Geral I — IAG-USP / UNIVESP","playlist":"PLxI8Can9yAHd7kUPviBHxr-49QEl7PRXR","count":35,"source":"https://www.aia.iag.usp.br/cultext/materiais/visao-geral-astronomia","units":["FACODI-GACS18-ASTRO01","FACODI-GACS18-ASTRO02","FACODI-GACS18-ASTRO03","FACODI-GACS18-ASTRO04","FACODI-GACS18-ASTRO05","FACODI-GACS18-ASTRO06","FACODI-GACS18-ASTRO10"],"note":"Introdução universitária à observação astronómica, história dos telescópios, Sistema Solar e estrelas. Playlists externas da USP/UNIVESP; não correspondem às atividades GACS de 2018."},{"slug":"facodi-astro-referencia-univesp-usp-visao-geral-ii","title":"Astronomia: Uma Visão Geral II — IAG-USP / UNIVESP","playlist":"PLxI8Can9yAHfJ2sGxMii8mJ6maoCj9AtU","count":31,"source":"https://www.aia.iag.usp.br/cultext/materiais/visao-geral-astronomia","units":["FACODI-GACS18-ASTRO07","FACODI-GACS18-ASTRO08"],"note":"Curso universitário de divulgação sobre Via Láctea, galáxias, observações cosmológicas e evolução do Universo; não é um módulo específico de ondas gravitacionais ou astrobiologia."}]'::jsonb)
AS x(slug text,title text,playlist text,count integer,source text,units jsonb,note text);
CREATE TEMP TABLE _astro_official_unit ON COMMIT DROP AS
SELECT s.slug,u.value code FROM _astro_official_playlist s
CROSS JOIN LATERAL jsonb_array_elements_text(s.units) u(value);

DO $guard$ BEGIN
 IF (SELECT count(*) FROM _astro_official_playlist)<>2
 OR EXISTS(SELECT 1 FROM _astro_official_playlist s
   WHERE s.playlist !~ '^[A-Za-z0-9_-]{10,120}$' OR s.count<1 OR s.source !~ '^https://')
 OR EXISTS(SELECT 1 FROM _astro_official_playlist s
    JOIN facodi.learning_objects lo ON lo.slug=s.slug)
 OR EXISTS(SELECT 1 FROM _astro_official_unit s
    LEFT JOIN facodi.curricular_units u ON u.code=s.code
    LEFT JOIN facodi.courses c ON c.id=u.course_id
    WHERE u.id IS NULL OR c.code<>'FACODI-GACS-ASTRO-2018' OR NOT u.published)
 THEN RAISE EXCEPTION 'Official astronomy playlist import precondition failed'; END IF;
END $guard$;

INSERT INTO facodi.learning_objects (
 id,object_type,title,slug,description,objectives,keywords,tags,
 language,status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:astro:univesp:external:'||s.slug)::uuid,
 'external_resource',s.title,s.slug,
 concat('Playlist institucional externa com ',s.count,
 ' videoaulas de Astronomia, pelo professor João Steiner (IAG-USP), com produção UNIVESP. ',s.note,
 ' O acesso é pelo YouTube original. Não é um curso da FACODI nem material produzido pelo GACS.'),
 '[]'::jsonb,
 ARRAY['Astronomia','UNIVESP','IAG-USP','João Steiner'],
 ARRAY['astronomia','astrofisica','videoaulas','fonte-academica-externa','sem-rehospedagem'],
 'pt-BR','active',true,'external',
 'https://www.youtube.com/playlist?list='||s.playlist,s.playlist,
 jsonb_build_object(
 'publisher','IAG-USP / UNIVESP',
 'official_listing_url',s.source,
 'official_playlist_url','https://www.youtube.com/playlist?list='||s.playlist,
 'external_video_count_as_listed',s.count,
 'source_quality','institutional_external_landing_page',
 'rights_rehosting_verified',false,
 'source_video_files_imported',false,
 'video_count_imported_to_public',0,
 'historical_2018_GACS_content',false,
 'teacher_approved_by_FACODI',false,
 'review_scope','verified_official_playlist_link',
 'curation_batch','facodi_astro_univesp_institutional_external_video_playlists_20261115')
FROM _astro_official_playlist s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:astro:univesp:unit:'||s.slug||':'||s.code)::uuid,
 u.learning_object_id,
 md5('facodi:astro:univesp:external:'||s.slug)::uuid,
 'contains',
 90000+row_number() OVER (PARTITION BY u.id ORDER BY s.slug)::int,
 'verified_external_reading_curation',
 jsonb_build_object(
   'review_status','approved',
   'review_scope','external_landing_page',
   'source_quality','institutional_official_course_listing',
   'copyright_rehosting_allowed',false,
   'original_videos_referenced_not_copied',true,
   'teacher_approved',false,
   'curation_batch','facodi_astro_univesp_institutional_external_video_playlists_20261115')
FROM _astro_official_unit s
JOIN facodi.curricular_units u ON u.code=s.code
JOIN facodi.courses c ON c.id=u.course_id AND c.code='FACODI-GACS-ASTRO-2018'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $verify$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects lo WHERE lo.object_type='external_resource'
   AND lo.metadata->>'curation_batch'='facodi_astro_univesp_institutional_external_video_playlists_20261115')<>2
 OR (SELECT count(*) FROM facodi.learning_object_relations r
   JOIN facodi.learning_objects lo ON lo.id=r.child_object_id
   WHERE lo.metadata->>'curation_batch'='facodi_astro_univesp_institutional_external_video_playlists_20261115')<>9
 THEN RAISE EXCEPTION 'Unexpected official playlist references/UC links'; END IF;
END $verify$;
