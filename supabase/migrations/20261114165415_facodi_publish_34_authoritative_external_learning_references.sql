-- FACODI references: link to external source pages only, never copy their content.
CREATE TEMP TABLE _facodi_readings(source_key text primary key,title text not null,
source_url text not null,source_label text not null,topic_summary text not null) ON COMMIT DROP;
INSERT INTO _facodi_readings VALUES ('mit-linear','Álgebra linear — MIT OpenCourseWare','https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/','MIT OpenCourseWare','Matrizes, sistemas lineares e espaços vetoriais'),
('openstax-calc-one','Cálculo — Volume 1 (OpenStax)','https://openstax.org/books/calculus-volume-1/pages/1-introduction','OpenStax','Funções, limites e cálculo de uma variável'),
('openstax-calc-three','Cálculo — Volume 3 (OpenStax)','https://openstax.org/books/calculus-volume-3/pages/1-introduction','OpenStax','Coordenadas, parametrização e cálculo multivariável'),
('openstax-physics','Física universitária — Volume 1','https://openstax.org/books/university-physics-volume-1/pages/1-introduction','OpenStax','Fundamentos físicos quantitativos'),
('mit-intro-code','Programação introdutória — MIT','https://ocw.mit.edu/collections/introductory-programming/','MIT OpenCourseWare','Coleção de cursos introdutórios de programação'),
('python-tutorial','Tutorial oficial de Python','https://docs.python.org/3/tutorial/','Python','Estruturas de dados, algoritmos e funções em Python'),
('ostep-os','Operating Systems: Three Easy Pieces','https://pages.cs.wisc.edu/~remzi/OSTEP/','OSTEP','Processos, memória e concorrência nos sistemas operativos'),
('mit-algorithms','Introdução a algoritmos — MIT','https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/','MIT OpenCourseWare','Algoritmos, estruturas de dados e complexidade'),
('pro-git','Livro Pro Git','https://git-scm.com/book/en/v2','Git','Controlo de versões, repositórios e colaboração'),
('github-actions','GitHub Actions — introdução','https://docs.github.com/en/actions/get-started/quickstart','GitHub Docs','Automação de testes e integração contínua'),
('mdn-web','Aprender desenvolvimento Web — MDN','https://developer.mozilla.org/en-US/docs/Learn_web_development','MDN Web Docs','HTML, CSS, JavaScript e acessibilidade'),
('react-learn','React — guia de aprendizagem','https://react.dev/learn','React','Interfaces por componentes e gestão de estado'),
('typescript-handbook','TypeScript Handbook','https://www.typescriptlang.org/docs/handbook/intro.html','TypeScript','Tipos, classes e programação com TypeScript'),
('postgres-tutorial','PostgreSQL — tutorial SQL','https://www.postgresql.org/docs/current/tutorial.html','PostgreSQL','Tabelas, SQL, vistas e transações'),
('openstax-stats','Estatística introdutória — OpenStax','https://openstax.org/books/introductory-statistics-2e/pages/1-introduction','OpenStax','Estatística descritiva, probabilidade e inferência'),
('openstax-management','Princípios de Gestão — OpenStax','https://openstax.org/books/principles-management/pages/1-introduction','OpenStax','Organização, planeamento e gestão de recursos'),
('openstax-marketing','Princípios de Marketing — OpenStax','https://openstax.org/books/principles-marketing/pages/1-unit-introduction','OpenStax','Posicionamento, marcas e comunicação'),
('owasp-topten','OWASP Top 10 — segurança Web','https://owasp.org/www-project-top-ten/','OWASP','Vulnerabilidades e riscos das aplicações Web'),
('kubernetes-basics','Kubernetes Basics','https://kubernetes.io/docs/tutorials/kubernetes-basics/','Kubernetes','Orquestração e implantação de contentores'),
('docker-getstart','Docker — guia inicial','https://docs.docker.com/get-started/','Docker','Construção de imagens e execução de contentores'),
('android-courses','Android Developers — cursos','https://developer.android.com/courses','Android Developers','Conceção e programação de aplicações Android'),
('flutter-learning','Flutter — aprendizagem','https://docs.flutter.dev/learn','Flutter','Desenvolvimento móvel com Dart e Flutter'),
('scikitlearn','scikit-learn — documentação','https://scikit-learn.org/stable/index.html','scikit-learn','Modelos de machine learning e avaliação'),
('pandas-start','pandas — introdução','https://pandas.pydata.org/docs/getting_started/index.html','pandas','Leitura, transformação e exploração de dados'),
('learnopengl','LearnOpenGL — fundamentos','https://learnopengl.com/Getting-started','LearnOpenGL','Gráficos 3D, geometria e shaders'),
('arduino-learn','Arduino — aprender','https://docs.arduino.cc/learn/','Arduino','Microcontroladores, sensores e comunicação'),
('w3c-accessibility','W3C — acessibilidade Web','https://www.w3.org/WAI/tutorials/','W3C WAI','Desenho de interfaces Web acessíveis'),
('krita-manual','Krita — manual','https://docs.krita.org/en/','Krita','Pintura e ilustração digital'),
('blender-manual','Blender — manual oficial','https://docs.blender.org/manual/en/latest/','Blender','Modelação e animação tridimensional'),
('google-fonts','Google Fonts — conhecimento','https://fonts.google.com/knowledge','Google Fonts','Famílias tipográficas e aplicação de fontes'),
('godot-intro','Godot — introdução','https://docs.godotengine.org/en/stable/getting_started/introduction/index.html','Godot','Conceitos introdutórios do desenvolvimento de jogos'),
('godot-xr','Godot — tutoriais XR','https://docs.godotengine.org/en/stable/tutorials/xr/index.html','Godot','Experiências de realidade virtual e aumentada'),
('met-art','The Met — coleção de arte','https://www.metmuseum.org/pt/art/collection','The Met','Referências para análise de obras e movimentos artísticos'),
('met-openaccess','The Met — Open Access','https://www.metmuseum.org/hubs/open-access','The Met','Coleção e políticas de acesso a imagens de domínio público');
CREATE TEMP TABLE _facodi_reading_units(source_key text not null,unit_code text not null,
priority int not null,PRIMARY KEY(source_key,unit_code)) ON COMMIT DROP;
INSERT INTO _facodi_reading_units VALUES ('mit-linear','19411003',1),
('openstax-calc-one','19411002',1),
('openstax-calc-three','19411008',1),
('openstax-physics','19411004',1),
('mit-intro-code','19411000',1),
('python-tutorial','19411000',1),
('python-tutorial','19411006',2),
('ostep-os','19411009',1),
('ostep-os','19411005',2),
('mit-algorithms','19411011',1),
('pro-git','19411001',1),
('github-actions','19411001',1),
('github-actions','19411016',2),
('mdn-web','19411007',1),
('mdn-web','19411021',2),
('react-learn','19411021',1),
('typescript-handbook','19411006',1),
('typescript-handbook','19411007',2),
('typescript-handbook','19411021',3),
('postgres-tutorial','19411012',1),
('postgres-tutorial','19411017',2),
('openstax-stats','19411018',1),
('openstax-stats','19411020',2),
('openstax-management','19411010',1),
('openstax-marketing','14541191',1),
('owasp-topten','19411049',1),
('owasp-topten','19411021',2),
('kubernetes-basics','19411029',1),
('docker-getstart','19411029',1),
('docker-getstart','19411016',2),
('android-courses','19411019',1),
('flutter-learning','19411019',1),
('scikitlearn','19411013',1),
('scikitlearn','19411022',2),
('pandas-start','19411020',1),
('learnopengl','19411015',1),
('arduino-learn','19411031',1),
('arduino-learn','15241279',2),
('arduino-learn','19411025',3),
('w3c-accessibility','14541025',1),
('w3c-accessibility','19411007',2),
('w3c-accessibility','19411021',3),
('krita-manual','14541145',1),
('krita-manual','14541187',2),
('krita-manual','14541142',3),
('blender-manual','14541178',1),
('blender-manual','14541188',2),
('blender-manual','14541193',3),
('blender-manual','14541194',4),
('google-fonts','14541153',1),
('google-fonts','14541155',2),
('google-fonts','14541161',3),
('godot-intro','19411059',1),
('godot-intro','14541183',2),
('godot-xr','14541199',1),
('met-art','14541196',1),
('met-art','14541154',2),
('met-art','14541157',3),
('met-art','14541156',4),
('met-openaccess','14541196',1),
('met-openaccess','14541184',2),
('met-openaccess','14541156',3);
DO $guard$ BEGIN
 IF (SELECT count(*) FROM _facodi_readings)<>34 THEN RAISE EXCEPTION 'Expected 34 sourced references'; END IF;
 IF (SELECT count(*) FROM _facodi_reading_units)<>62 THEN RAISE EXCEPTION 'Unexpected link count'; END IF;
 IF EXISTS (SELECT 1 FROM _facodi_readings WHERE source_url NOT LIKE 'https://%' OR source_url ~ '[[:space:]]')
 THEN RAISE EXCEPTION 'Invalid source URL'; END IF;
 IF EXISTS(SELECT 1 FROM _facodi_reading_units m
 LEFT JOIN facodi.curricular_units u ON u.code=m.unit_code
 LEFT JOIN facodi.courses c ON c.id=u.course_id
 WHERE u.id IS NULL OR c.code NOT IN ('LESTI','LDCOM') OR NOT u.published
 OR u.status<>'active' OR u.learning_object_id IS NULL)
 THEN RAISE EXCEPTION 'Unpublished or unknown target unit'; END IF;
END $guard$;
INSERT INTO facodi.learning_objects
 (id,object_type,title,slug,description,language,status,published,source_type,source_url,source_id,tags,metadata)
SELECT md5('facodi:oer:'||r.source_key)::uuid,'external_resource',r.title,
 'facodi-reading-'||r.source_key,
 'Referência de consulta externa para explorar '||r.topic_summary||
 '. Fonte: '||r.source_label||
 '. A ligação é para a página do autor; o material não foi reproduzido nem oficialmente aprovado pela UAlg.',
 'pt','active',true,'external',r.source_url,r.source_key,
 ARRAY['leitura','recurso-externo','documentacao'],
 jsonb_build_object('source_label',r.source_label,'topic_summary',r.topic_summary,
 'curation_batch','facodi_external_readings_2026_11_14',
 'reference_only',true,'source_material_copied',false,
 'content_license_verified',false,'is_official_ualg_course_material',false,
 'review_scope','external_source_landing_page','source_page_checked_on','2026-11-14')
FROM _facodi_readings r ON CONFLICT(id) DO NOTHING;
INSERT INTO facodi.external_sources(id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:oer:source:'||r.source_key)::uuid,
 md5('facodi:oer:'||r.source_key)::uuid,'website',r.source_key,r.source_url,r.title,
 jsonb_build_object('publisher',r.source_label,'reference_only',true)
FROM _facodi_readings r ON CONFLICT(id) DO NOTHING;
INSERT INTO facodi.keywords(id,learning_object_id,keyword,normalized_keyword,language,weight,source,metadata)
SELECT md5('facodi:oer:keyword:'||r.source_key)::uuid,
 md5('facodi:oer:'||r.source_key)::uuid,r.title,lower(btrim(r.title)),
 'pt',1,'external_reference_title',
 jsonb_build_object('source_url',r.source_url)
FROM _facodi_readings r
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;
INSERT INTO facodi.learning_object_relations(
id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:oer:relation:'||ru.source_key||':'||ru.unit_code)::uuid,
 u.learning_object_id,md5('facodi:oer:'||ru.source_key)::uuid,
 'contains',50000+row_number() OVER(PARTITION BY u.id ORDER BY ru.priority,ru.source_key)::integer,
 'verified_external_reading_curation',
 jsonb_build_object('review_status','approved','review_scope','external_landing_page',
 'unit_code',ru.unit_code,'curation_batch','facodi_external_readings_2026_11_14',
 'is_official_ualg_course_material',false,'source_material_copied',false)
FROM _facodi_reading_units ru
JOIN facodi.curricular_units u ON u.code=ru.unit_code
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;
INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT md5('facodi:oer:'||ru.source_key)::uuid,t.id
FROM _facodi_reading_units ru
JOIN facodi.tags t ON t.slug='uc-'||ru.unit_code
ON CONFLICT DO NOTHING;
GRANT SELECT ON facodi.learning_object_relations TO anon,authenticated;
DROP POLICY IF EXISTS facodi_public_external_reading_relations ON facodi.learning_object_relations;
CREATE POLICY facodi_public_external_reading_relations
ON facodi.learning_object_relations FOR SELECT TO anon,authenticated
USING (
relation_type='contains' AND created_by_mechanism='verified_external_reading_curation'
AND metadata->>'review_status'='approved'
AND metadata->>'review_scope'='external_landing_page'
AND EXISTS(SELECT 1 FROM facodi.learning_objects p WHERE p.id=parent_object_id
 AND p.published AND p.status IN('active','published') AND p.object_type='curricular_unit')
AND EXISTS(SELECT 1 FROM facodi.learning_objects child WHERE child.id=child_object_id
 AND child.published AND child.status IN('active','published') AND child.object_type='external_resource')
);
DO $final$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_objects WHERE published AND object_type='external_resource')<>34
 THEN RAISE EXCEPTION 'Expected 34 published references'; END IF;
 IF (SELECT count(*) FROM facodi.learning_object_relations
 WHERE created_by_mechanism='verified_external_reading_curation')<>62
 THEN RAISE EXCEPTION 'Expected 62 approved unit-reference relations'; END IF;
END $final$;