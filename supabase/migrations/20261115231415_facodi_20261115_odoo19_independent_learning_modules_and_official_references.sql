
CREATE TEMP TABLE _md ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset('[{"slug":"facodi-modulo-odoo19-gestao-sistemas","title":"Odoo 19 — fundamentos de ERP e sistemas de gestão","tag":"odoo-19","sequences":["facodi-odoo19-visao-geral"]},{"slug":"facodi-modulo-odoo19-rh-selecao","title":"Odoo — gestão de pessoas, recrutamento e avaliação","tag":"recursos-humanos","sequences":["facodi-odoo19-rh-colaboradores","facodi-odoo19-rh-recrutamento","facodi-odoo19-rh-desempenho"]},{"slug":"facodi-modulo-odoo19-rh-tempo","title":"Odoo — férias, remunerações e indicações","tag":"recursos-humanos","sequences":["facodi-odoo19-rh-tempo","facodi-odoo19-rh-remuneracao","facodi-odoo19-rh-indicacoes"]},{"slug":"facodi-modulo-odoo19-operacoes","title":"Odoo — operações administrativas e de suporte","tag":"operacoes","sequences":["facodi-odoo19-operacoes-frota","facodi-odoo19-operacoes-rececao","facodi-odoo19-operacoes-refeicoes","facodi-odoo19-operacoes-aprovacoes"]},{"slug":"facodi-modulo-odoo19-financas","title":"Odoo — controlo de despesas e refaturação","tag":"contabilidade","sequences":["facodi-odoo19-financas-despesas"]},{"slug":"facodi-modulo-odoo19-servicos","title":"Odoo — Helpdesk e Serviço de Campo","tag":"helpdesk","sequences":["facodi-odoo19-servicos-helpdesk"]},{"slug":"facodi-modulo-odoo19-integracoes","title":"Odoo — integração e desenvolvimento de aplicações","tag":"integracoes","sequences":["facodi-tecnologia-odoo-integracoes"]},{"slug":"facodi-modulo-redes-fundamentos","title":"Redes e protocolos aplicados a sistemas","tag":"redes","sequences":["facodi-tecnologia-redes-protocolos"]},{"slug":"facodi-modulo-ambientes-reprodutiveis","title":"Ambientes de desenvolvimento reproduzíveis","tag":"dev-containers","sequences":["facodi-tecnologia-dev-containers","facodi-tecnologia-python-distribuicao","facodi-tecnologia-cloud-ambientes"]},{"slug":"facodi-modulo-plataformas-lowcode","title":"Plataformas Low-Code e aplicações web","tag":"low-code","sequences":["facodi-tecnologia-lowcode-plataformas","facodi-tecnologia-react-navegacao"]}]'::jsonb)
AS x(slug text,title text,tag text,sequences jsonb);
CREATE TEMP TABLE _seq ON COMMIT DROP AS
SELECT m.slug module_slug,s.value seq_slug,s.ordinality::int position
FROM _md m CROSS JOIN LATERAL jsonb_array_elements_text(m.sequences) WITH ORDINALITY s(value,ordinality);
CREATE TEMP TABLE _refs ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset('[{"slug":"facodi-ref-odoo-learning-catalog","title":"Odoo Learn — catálogo oficial de cursos","url":"https://www.odoo.com/pt_BR/slides"},{"slug":"facodi-ref-odoo-human-resources","title":"Odoo Learn — Human Resources","url":"https://www.odoo.com/pt_BR/slides/human-resources-32"},{"slug":"facodi-ref-odoo-accounting","title":"Odoo Learn — Accounting and Invoicing","url":"https://www.odoo.com/pt_BR/slides/accounting-and-invoicing-19"},{"slug":"facodi-ref-odoo-project-timesheets","title":"Odoo Learn — Project & Timesheets","url":"https://www.odoo.com/pt_BR/slides/project-timesheets-21"},{"slug":"facodi-ref-odoo-inventory","title":"Odoo Learn — Inventory","url":"https://www.odoo.com/pt_BR/slides/inventory-24"}]'::jsonb)
AS x(slug text,title text,url text);
CREATE TEMP TABLE _refmap ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset('[{"module":"facodi-modulo-odoo19-gestao-sistemas","reference":"facodi-ref-odoo-learning-catalog"},{"module":"facodi-modulo-odoo19-rh-selecao","reference":"facodi-ref-odoo-human-resources"},{"module":"facodi-modulo-odoo19-rh-tempo","reference":"facodi-ref-odoo-human-resources"},{"module":"facodi-modulo-odoo19-operacoes","reference":"facodi-ref-odoo-inventory"},{"module":"facodi-modulo-odoo19-financas","reference":"facodi-ref-odoo-accounting"},{"module":"facodi-modulo-odoo19-servicos","reference":"facodi-ref-odoo-project-timesheets"},{"module":"facodi-modulo-odoo19-integracoes","reference":"facodi-ref-odoo-learning-catalog"}]'::jsonb)
AS x(module text,reference text);

DO $pre$ BEGIN
IF (SELECT count(*) FROM _md)<>10 OR (SELECT count(*) FROM _seq)<>20 OR
 (SELECT count(*) FROM _refs)<>5 OR (SELECT count(*) FROM _refmap)<>7
 OR EXISTS(SELECT 1 FROM _md m JOIN facodi.learning_objects lo ON lo.slug=m.slug)
 OR EXISTS(SELECT 1 FROM _refs r JOIN facodi.learning_objects lo ON lo.slug=r.slug)
 OR EXISTS(SELECT 1 FROM _seq s LEFT JOIN facodi.learning_objects lo
 ON lo.slug=s.seq_slug AND lo.object_type='playlist' AND lo.published
 WHERE lo.id IS NULL)
 THEN RAISE EXCEPTION 'Module/sequence/reference manifest not safe';END IF;
END $pre$;

INSERT INTO facodi.learning_objects(id,object_type,slug,title,description,objectives,keywords,tags,
language,status,published,source_type,source_id,metadata)
SELECT md5('facodi:module:20261115:'||m.slug)::uuid,'module',m.slug,m.title,
'Módulo de estudo independente FACODI, inspirado nas áreas de e-Learning da Odoo. Os vídeos são complementares e pertencem aos respetivos autores; não representam formação ou certificação oficial Odoo. Comparar sempre versões, edições e requisitos legais.',
jsonb_build_array('Percorrer as sequências na ordem proposta.',
'Consultar materiais e documentação nas fontes originais.',
'Relacionar o tema com os objetivos da UC.'),
ARRAY[m.title,m.tag],
CASE WHEN m.slug LIKE 'facodi-modulo-odoo19-%'
 THEN ARRAY['odoo','erp','gestao','tecnologia',m.tag,'modulo-de-estudo','facodi']
 ELSE ARRAY['tecnologia',m.tag,'modulo-de-estudo','facodi'] END,
'pt-PT','active',true,'generated','facodi:module:20261115:'||m.slug,
jsonb_build_object('module_kind','curated_existing_learning_objects','organization_inspired_by','https://www.odoo.com/pt_BR/slides',
'official_odoo_course',false,'certification',false,'teacher_approved',false,
'full_video_reviewed',false,'generated_exercises',false,
'curation_batch','facodi_20261115_odoo19_editorial_modules')
FROM _md m;

INSERT INTO facodi.learning_objects(id,object_type,slug,title,description,objectives,keywords,tags,
language,status,published,source_type,source_url,source_id,metadata)
SELECT md5('facodi:reference:20261115:'||r.slug)::uuid,'external_resource',r.slug,r.title,
'Referência ao e-Learning oficial da Odoo. A FACODI faz curadoria independente e mantém links para a fonte sem copiar os conteúdos.',
'[]'::jsonb,ARRAY[r.title,'Odoo Learn'],ARRAY['odoo','erp','gestao','fonte-oficial','recurso-externo'],
'pt-PT','active',true,'external',r.url,'facodi:official-reference:'||r.slug,
jsonb_build_object('publisher','Odoo','reference_kind','official_external_course_index',
'facodi_course_is_independent',true,'curation_batch','facodi_20261115_odoo19_editorial_modules')
FROM _refs r;

INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:module:sequence:20261115:'||s.module_slug||':'||s.seq_slug)::uuid,
p.id,ch.id,'contains',s.position,'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
'material_role','primary_video_sequence','curation_batch','facodi_20261115_odoo19_editorial_modules')
FROM _seq s JOIN facodi.learning_objects p ON p.slug=s.module_slug AND p.object_type='module'
JOIN facodi.learning_objects ch ON ch.slug=s.seq_slug AND ch.object_type='playlist'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:module:reference:20261115:'||r.module||':'||r.reference)::uuid,
p.id,ch.id,'contains',501,'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
'material_role','official_external_reference','curation_batch','facodi_20261115_odoo19_editorial_modules')
FROM _refmap r JOIN facodi.learning_objects p ON p.slug=r.module AND p.object_type='module'
JOIN facodi.learning_objects ch ON ch.slug=r.reference AND ch.object_type='external_resource'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Derive module academic associations only from verified curriculum-to-sequence links.
WITH module_units AS (
SELECT DISTINCT s.module_slug,u.id unit_id,u.learning_object_id unit_lo
FROM _seq s JOIN facodi.learning_objects pl ON pl.slug=s.seq_slug AND pl.object_type='playlist'
JOIN facodi.learning_object_relations edge ON edge.child_object_id=pl.id AND edge.relation_type='contains'
JOIN facodi.curricular_units u ON u.learning_object_id=edge.parent_object_id AND u.published
WHERE edge.metadata->>'review_status'='approved'
)
INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:module:unit:20261115:'||mu.unit_id::text||':'||mu.module_slug)::uuid,
mu.unit_lo,mo.id,'contains',82000+row_number() over(partition by mu.unit_id order by mu.module_slug)::int,
'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
'curation_batch','facodi_20261115_odoo19_editorial_modules')
FROM module_units mu JOIN facodi.learning_objects mo ON mo.slug=mu.module_slug AND mo.object_type='module'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_objects(id,object_type,slug,title,description,objectives,keywords,tags,language,status,published,source_type,source_id,metadata)
VALUES(md5('facodi:collection:odoo19:20261115')::uuid,'collection',
'facodi-odoo19-percursos-gestao','Odoo — percursos práticos de ERP e gestão',
'Coleção FACODI de percursos independentes inspirada na organização por aplicações do Odoo Learn. Reúne pessoas, operações, serviços, finanças e desenvolvimento. Não concede certificação oficial, não substitui documentação Odoo ou legislação aplicável.',
'[]'::jsonb,ARRAY['Odoo','ERP','Gestão','Odoo Learn'],
ARRAY['odoo','odoo-19','erp','gestao','tecnologia','recursos-humanos','facodi'],
'pt-PT','active',true,'generated','facodi:collection:odoo19:20261115',
jsonb_build_object('collection_type','independent_odoo_inspired_learning_hub',
'official_reference','https://www.odoo.com/pt_BR/slides',
'official_odoo_course',false,'certification',false,'modules_count',7,
'curation_batch','facodi_20261115_odoo19_editorial_modules'));

INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:odoo19:collection:module:'||m.slug)::uuid,
md5('facodi:collection:odoo19:20261115')::uuid,
md5('facodi:module:20261115:'||m.slug)::uuid,
'contains',row_number() over(order by m.slug)::int,
'structured_catalog_import',jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
'curation_batch','facodi_20261115_odoo19_editorial_modules')
FROM _md m WHERE m.slug LIKE 'facodi-modulo-odoo19-%'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:odoo19:collection:sequence:'||x.seq_slug)::uuid,
md5('facodi:collection:odoo19:20261115')::uuid,lo.id,'contains',
100+row_number() over(order by x.seq_slug)::int,'structured_catalog_import',
jsonb_build_object('review_status','approved','review_scope','title_and_channel_only',
'curation_batch','facodi_20261115_odoo19_editorial_modules')
FROM (SELECT DISTINCT seq_slug FROM _seq WHERE module_slug LIKE 'facodi-modulo-odoo19-%') x
JOIN facodi.learning_objects lo ON lo.slug=x.seq_slug AND lo.object_type='playlist'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

DO $post$ BEGIN
IF (SELECT count(*) FROM facodi.learning_objects WHERE object_type='module' AND metadata->>'curation_batch'='facodi_20261115_odoo19_editorial_modules')<>10
OR (SELECT count(*) FROM facodi.learning_objects WHERE object_type='external_resource' AND metadata->>'curation_batch'='facodi_20261115_odoo19_editorial_modules')<>5
OR (SELECT count(*) FROM facodi.learning_object_relations WHERE parent_object_id=md5('facodi:collection:odoo19:20261115')::uuid AND relation_type='contains')<>21
THEN RAISE EXCEPTION 'Odoo modules/references/collection audit failed';END IF;
END $post$;
