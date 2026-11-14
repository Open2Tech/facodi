-- Three FACODI-owned editorial video sequences for the Gestão programme.
-- NOT native YouTube playlists, no video hosting, no licence to copy content.
CREATE TEMP TABLE _g_sequences(key text PRIMARY KEY,title text,description text,
 uc_code text,expected_count integer) ON COMMIT DROP;
INSERT INTO _g_sequences VALUES
('estatistica-i','Estatística para Gestão I — dados e probabilidade',
 'Percurso introdutório de estatística descritiva, gráficos, medidas de posição e dispersão, amostragem e fundamentos de probabilidade com vídeos dos canais selecionados.',
 '14181187',25),
('estatistica-ii','Estatística para Gestão II — testes e regressão',
 'Sequência de inferência, testes de hipóteses, ANOVA, correlação e regressão aplicadas à interpretação de dados em organizações.',
 '14181191',21),
('matematica-financeira','Matemática Financeira — juros e capitalização',
 'Percurso introdutório de juros simples e compostos e interpretação do valor temporal do dinheiro com aulas externas.',
 '14181180',3);

CREATE TEMP TABLE _g_sequence_links ON COMMIT DROP AS
SELECT s.key,s.title,s.description,s.uc_code,s.expected_count,
 u.id uc_id,u.learning_object_id uc_object_id,
 r.child_object_id video_object_id,coalesce(r.position,10000) position,
 lo.title video_title
FROM _g_sequences s
JOIN facodi.curricular_units u ON u.code=s.uc_code
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
JOIN facodi.learning_object_relations r ON r.parent_object_id=u.learning_object_id
JOIN facodi.learning_objects lo ON lo.id=r.child_object_id
 AND lo.object_type='video' AND lo.published AND lo.status='active'
WHERE r.metadata->>'review_status'='approved';

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM _g_sequences s WHERE
 (SELECT count(*) FROM _g_sequence_links l WHERE l.key=s.key)<>s.expected_count)
 THEN RAISE EXCEPTION 'A video list has changed; re-review its ordered selection'; END IF;
END $$;

INSERT INTO facodi.learning_objects
(id,object_type,title,slug,description,objectives,keywords,tags,language,
status,published,source_type,source_id,metadata)
SELECT md5('facodi:lg1418:editorial_playlist:'||s.key)::uuid,
 'playlist',s.title,'facodi-gestao-sequencia-'||s.key,
 s.description||
 ' Lista editorial de links para vídeos no YouTube. Não é uma playlist publicada na conta de nenhum canal; pertinência avaliada por títulos e metadados.',
 '[]'::jsonb,ARRAY['Gestão','vídeos','percurso de estudo'],
 ARRAY['gestao','playlist-editorial','apoio-ao-estudo'],
 'pt','active',true,'generated','facodi-lg1418-editorial-'||s.key,
 jsonb_build_object('playlist_type','facodi_owned_editorial_sequence',
  'item_count',s.expected_count,'target_uc_code',s.uc_code,
  'review_scope','title_description_and_channel_only',
  'full_video_reviewed',false,'is_youtube_native_playlist',false,
  'videos_hosted_externally',true,'official_ualg_curriculum_material',false,
  'copyright_reuse_license_confirmed',false,
  'created_from','facodi.learning_object_relations','academic_year','2026/27')
FROM _g_sequences s
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,
created_by_mechanism,metadata)
SELECT md5('facodi:lg1418:playlist_item:'||l.key||':'||l.video_object_id::text)::uuid,
 md5('facodi:lg1418:editorial_playlist:'||l.key)::uuid,
 l.video_object_id,'contains',
 row_number() OVER(PARTITION BY l.key ORDER BY l.position,l.video_title)::int,
 'facodi_editorial_learning_path',
 jsonb_build_object('review_status','approved',
  'review_scope','title_and_channel_only',
  'source_unit_code',l.uc_code,'content_fully_reviewed',false,
  'creator_rehost_permission_claimed',false)
FROM _g_sequence_links l
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Unit and programme navigation to the sequences.
INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,
created_by_mechanism,metadata)
SELECT md5('facodi:lg1418:unit_playlist:'||s.key)::uuid,
 u.learning_object_id,md5('facodi:lg1418:editorial_playlist:'||s.key)::uuid,
 'contains',9000,
 'facodi_editorial_learning_path',
 jsonb_build_object('review_status','approved',
  'review_scope','title_and_channel_only',
  'source_unit_code',s.uc_code,'is_native_youtube_playlist',false)
FROM _g_sequences s
JOIN facodi.curricular_units u ON u.code=s.uc_code
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,
created_by_mechanism,metadata)
SELECT md5('facodi:lg1418:course_playlist:'||s.key)::uuid,
 md5('facodi:ualg:1418:course_object')::uuid,
 md5('facodi:lg1418:editorial_playlist:'||s.key)::uuid,
 'contains',3000+row_number() OVER(ORDER BY s.key),
 'facodi_editorial_learning_path',
 jsonb_build_object('review_status','approved',
  'review_scope','title_and_channel_only','academic_year','2026/27')
FROM _g_sequences s
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects lo
 WHERE lo.object_type='playlist' AND lo.source_id LIKE 'facodi-lg1418-editorial-%')<>3
 THEN RAISE EXCEPTION 'Playlist creation mismatch'; END IF;
 IF (SELECT count(*) FROM facodi.learning_object_relations r
 JOIN facodi.learning_objects lo ON lo.id=r.parent_object_id
 WHERE lo.source_id LIKE 'facodi-lg1418-editorial-%' AND
 r.relation_type='contains')<>49
 THEN RAISE EXCEPTION 'Playlist videos were not linked'; END IF;
END $$;