
CREATE TEMP TABLE _facodi_db_manifest(
slug text primary key,title text,a int,b int,n int,unit text,unit2 text,description text,level text)
ON COMMIT DROP;
INSERT INTO _facodi_db_manifest SELECT * FROM jsonb_to_recordset('[{"slug":"facodi-db-sql-consultas-funcoes-2026","title":"SQL Server — consultas, agregações e funções","a":12,"b":23,"n":11,"unit":"19411012","unit2":"18121019","desc":"Consultas SQL, funções, agregações, datas e texto.","level":"fundamentals"},{"slug":"facodi-db-sql-transacoes-objetos-2026","title":"SQL Server — manipulação, transações e objetos","a":24,"b":40,"n":17,"unit":"19411017","unit2":"18121020","desc":"Manipulação de dados, transações, fluxo de execução, índices, triggers e procedures.","level":"intermediate"},{"slug":"facodi-db-sql-funcoes-manutencao-2026","title":"SQL Server — funções e manutenção","a":55,"b":71,"n":17,"unit":"19411017","unit2":"18121020","desc":"Funções, configuração, manutenção e administração de base de dados.","level":"intermediate"},{"slug":"facodi-db-sql-casos-praticos-2026","title":"SQL Server — indicadores, relatórios e backups","a":74,"b":85,"n":11,"unit":"19411017","unit2":"18121020","desc":"Casos aplicados a clientes e relatórios, backup, restauro e análise.","level":"applied"}]'::jsonb)
AS x(slug text,title text,a int,b int,n int,unit text,unit2 text,description text,level text);

CREATE TEMP TABLE _facodi_db_video ON COMMIT DROP AS
SELECT m.slug,v.id video_id,v.title,v.source_url, y.youtube_video_id,
CASE WHEN v.title ~ '^SQL SERVER - [0-9]{1,3} -'
 THEN substring(v.title from '^SQL SERVER - ([0-9]{1,3}) -')::int
 WHEN v.title ~ 'Aula [0-9]{1,3}$'
 THEN substring(v.title from 'Aula ([0-9]{1,3})')::int
 WHEN v.title ~ '^#[0-9]{1,3} - SQL Server'
 THEN substring(v.title from '^#([0-9]{1,3}) - SQL Server')::int END number
FROM _facodi_db_manifest m CROSS JOIN facodi.learning_objects v
JOIN facodi.youtube_videos y ON y.learning_object_id=v.id
WHERE v.object_type='video' AND v.published AND v.status='active'
 AND coalesce(v.metadata->>'channel_name',y.channel_title)='Alessandro Trovato'
 AND v.source_url ~ '^https://www.youtube.com/watch[?]v=[A-Za-z0-9_-]{11}$'
 AND (CASE WHEN v.title ~ '^SQL SERVER - [0-9]{1,3} -'
 THEN substring(v.title from '^SQL SERVER - ([0-9]{1,3}) -')::int
 WHEN v.title ~ 'Aula [0-9]{1,3}$'
 THEN substring(v.title from 'Aula ([0-9]{1,3})')::int
 WHEN v.title ~ '^#[0-9]{1,3} - SQL Server'
 THEN substring(v.title from '^#([0-9]{1,3}) - SQL Server')::int END) BETWEEN m.a AND m.b;

DO $guard$ DECLARE msg text; BEGIN
 SELECT string_agg(m.slug||' expected '||m.n||' found '||coalesce(t.n,0),';')
 INTO msg FROM _facodi_db_manifest m
 LEFT JOIN (SELECT slug,count(*) n FROM _facodi_db_video GROUP BY 1) t USING(slug)
 WHERE m.n IS DISTINCT FROM t.n;
 IF msg IS NOT NULL THEN RAISE EXCEPTION 'Video mismatch: %',msg; END IF;
 IF (SELECT count(*) FROM _facodi_db_video)<>56
 OR EXISTS(SELECT 1 FROM _facodi_db_video GROUP BY slug,number HAVING count(*)>1)
 OR EXISTS(SELECT 1 FROM _facodi_db_manifest m JOIN facodi.learning_objects v ON v.slug=m.slug)
 OR EXISTS(SELECT 1 FROM _facodi_db_manifest m LEFT JOIN facodi.curricular_units u ON u.code=m.unit
   LEFT JOIN facodi.curricular_units w ON w.code=m.unit2 WHERE u.id IS NULL OR w.id IS NULL OR NOT u.published OR NOT w.published)
 THEN RAISE EXCEPTION 'SQL source/destination validation failed'; END IF;
END $guard$;

INSERT INTO facodi.learning_objects(id,object_type,title,slug,description,objectives,keywords,tags,
 language,status,published,source_type,source_id,metadata)
SELECT md5('facodi:db:20261115:'||m.slug)::uuid,
 'playlist',m.title,m.slug,
 m.description||' Aulas originais do canal Alessandro Trovato, preservando a sequência do autor. Material complementar de SQL Server/T-SQL; não é o plano oficial da UAlg.',
 jsonb_build_array('Acompanhar os vídeos na ordem numérica do curso.',
 'Relacionar a sintaxe SQL Server com os conceitos da UC.',
 'Comparar diferenças entre T-SQL e PostgreSQL/MySQL.'),
 ARRAY[m.title,'SQL Server','Bases de Dados'],ARRAY['facodi','sql','sql-server','bases-de-dados','videos-externos'],
 'pt-BR','active',true,'generated','facodi:db:20261115:'||m.slug,
 jsonb_build_object('playlist_type','facodi_owned_editorial_sequence',
 'sequence_domain','databases','level',m.level,'video_count',m.n,
 'source_channel','Alessandro Trovato','curation_method','source_title_lesson_number',
 'review_scope','title_and_channel_only','full_video_review_completed',false,
 'teacher_approved',false,'copyright_rehosting_allowed',false,
 'source_video_files_imported',false,
 'curation_batch','facodi_sql_existing_56_lessons_20261115')
FROM _facodi_db_manifest m ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:db:20261115:video:'||q.slug||':'||q.youtube_video_id)::uuid,
 md5('facodi:db:20261115:'||q.slug)::uuid,q.video_id,'contains',
 row_number() over(partition by q.slug order by q.number)::int,
 'metadata_based_educational_curation',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
 'source_lesson_number',q.number,'source_title',q.title,
 'teacher_approved',false,'full_video_reviewed',false,
 'curation_batch','facodi_sql_existing_56_lessons_20261115')
FROM _facodi_db_video q
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:db:20261115:unit:'||m.slug||':'||u.code)::uuid,
 u.learning_object_id,md5('facodi:db:20261115:'||m.slug)::uuid,
 'contains',75000+row_number() OVER (PARTITION BY u.id ORDER BY m.slug)::int,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
 'pedagogical_scope','supplementary_sql_server_course',
 'institutional_course_equivalence',false,
 'curation_batch','facodi_sql_existing_56_lessons_20261115')
FROM _facodi_db_manifest m JOIN facodi.curricular_units u ON u.code IN (m.unit,m.unit2)
JOIN facodi.courses c ON c.id=u.course_id AND c.code IN ('LESTI','CTESP-STI')
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_objects(id,object_type,title,slug,description,objectives,keywords,tags,language,
 status,published,source_type,source_id,metadata)
VALUES(md5('facodi:db:20261115:collection')::uuid,'collection',
 'Bases de Dados — percurso de SQL e T-SQL',
 'facodi-db-study-collection-sql-server',
 'Coleção de sequências existentes de SQL relacional e de SQL Server, do nível inicial à manutenção e análise. Não substitui a ficha oficial de Bases de Dados I/II.',
 '[]'::jsonb,ARRAY['SQL','SQL Server','T-SQL'],ARRAY['facodi','sql','bases-de-dados','percurso'],
 'pt-BR','active',true,'generated','facodi:db:20261115:collection',
 jsonb_build_object('collection_type','topic_ordered_existing_video_sequences',
 'playlist_count',6,'source_videos_reused',true,
 'review_scope','title_and_channel_only','teacher_approved',false,
 'curation_batch','facodi_sql_existing_56_lessons_20261115'))
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:db:20261115:collection-path:'||s.slug)::uuid,
 md5('facodi:db:20261115:collection')::uuid,p.id,'contains',s.n,
 'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
 'curation_batch','facodi_sql_existing_56_lessons_20261115')
FROM (VALUES
 (1,'facodi-playlist-sql-relacional-fundamentos'),
 (2,'facodi-db-sql-consultas-funcoes-2026'),
 (3,'facodi-db-sql-transacoes-objetos-2026'),
 (4,'facodi-db-sql-funcoes-manutencao-2026'),
 (5,'facodi-db-sql-casos-praticos-2026'),
 (6,'facodi-playlist-sql-avancado-e-migracoes')
) s(n,slug) JOIN facodi.learning_objects p ON p.slug=s.slug AND p.published
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:db:20261115:course:'||c.code)::uuid,c.learning_object_id,
 md5('facodi:db:20261115:collection')::uuid,'contains',75000,'structured_catalog_import',
 jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
 'curation_batch','facodi_sql_existing_56_lessons_20261115')
FROM facodi.courses c WHERE c.code IN ('LESTI','CTESP-STI') AND c.published
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $verify$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects WHERE object_type='playlist'
 AND metadata->>'curation_batch'='facodi_sql_existing_56_lessons_20261115')<>4
 OR (SELECT count(*) FROM facodi.learning_object_relations r
 JOIN facodi.learning_objects pl ON pl.id=r.parent_object_id
 WHERE pl.object_type='playlist' AND pl.metadata->>'curation_batch'='facodi_sql_existing_56_lessons_20261115')<>56
 THEN RAISE EXCEPTION 'Incomplete SQL learning paths'; END IF;
END $verify$;
