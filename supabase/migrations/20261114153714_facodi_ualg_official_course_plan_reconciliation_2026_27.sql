-- FACODI official programme references, academic year 2026/27.
-- Source: https://www.ualg.pt/curso/1454/plano
--         https://ise.ualg.pt/curso/1941/plano
-- The source lists optional units as alternatives, not cumulative credits.
-- Keep both programmes and every unit as unpublished drafts until editorial approval.
CREATE TEMP TABLE _facodi_official_2026 (
  course_code text NOT NULL,
  unit_code text NOT NULL,
  official_year integer NOT NULL,
  official_semester integer NOT NULL,
  official_ects numeric NOT NULL,
  option_group text,
  PRIMARY KEY(course_code,unit_code)
) ON COMMIT DROP;
INSERT INTO _facodi_official_2026
  (course_code,unit_code,official_year,official_semester,official_ects,option_group)
VALUES
('LDCOM','14541142',1,1,5,NULL),
('LDCOM','14541000',1,1,9,NULL),
('LDCOM','14541196',1,1,3,NULL),
('LDCOM','14541181',1,1,3,NULL),
('LDCOM','14541143',1,1,5,NULL),
('LDCOM','14541153',1,1,5,NULL),
('LDCOM','14541006',1,2,9,NULL),
('LDCOM','14541154',1,2,3,NULL),
('LDCOM','14541182',1,2,5,NULL),
('LDCOM','14541144',1,2,5,NULL),
('LDCOM','14541156',1,2,3,NULL),
('LDCOM','14541155',1,2,5,NULL),
('LDCOM','14541012',2,3,9,NULL),
('LDCOM','14541184',2,3,4,NULL),
('LDCOM','14541157',2,3,3,NULL),
('LDCOM','14541145',2,3,4,NULL),
('LDCOM','14541183',2,3,5,NULL),
('LDCOM','14541147',2,3,5,NULL),
('LDCOM','14541018',2,4,9,NULL),
('LDCOM','14541025',2,4,4,NULL),
('LDCOM','14541185',2,4,4,NULL),
('LDCOM','14541194',2,4,4,NULL),
('LDCOM','14541150',2,4,5,NULL),
('LDCOM','14541161',2,4,4,'I'),
('LDCOM','14541187',2,4,4,'I'),
('LDCOM','14541195',2,4,4,'I'),
('LDCOM','14541178',2,4,4,'I'),
('LDCOM','14541188',2,4,4,'I'),
('LDCOM','14541026',3,5,3,NULL),
('LDCOM','14541158',3,5,10,NULL),
('LDCOM','14541197',3,5,3,NULL),
('LDCOM','14541028',3,5,6,NULL),
('LDCOM','14541189',3,5,4,'II'),
('LDCOM','14541191',3,5,4,'II'),
('LDCOM','14541193',3,5,4,'II'),
('LDCOM','14541198',3,5,4,'II'),
('LDCOM','14541172',3,5,4,'II'),
('LDCOM','14541200',3,5,4,'III'),
('LDCOM','14541165',3,5,4,'III'),
('LDCOM','14541199',3,5,4,'III'),
('LDCOM','14541152',3,6,30,NULL),
('LESTI','19411003',1,1,5,NULL),
('LESTI','19411002',1,1,5,NULL),
('LESTI','19411008',1,1,7,NULL),
('LESTI','19411005',1,1,5,NULL),
('LESTI','19411004',1,1,5,NULL),
('LESTI','19411000',1,1,5,NULL),
('LESTI','19411009',1,1,5,NULL),
('LESTI','19411001',1,2,5,NULL),
('LESTI','19411010',1,2,5,NULL),
('LESTI','19411006',1,2,5,NULL),
('LESTI','19411007',1,2,5,NULL),
('LESTI','19411037',1,2,3,'I'),
('LESTI','19411023',1,2,3,'I'),
('LESTI','19411011',2,3,5,NULL),
('LESTI','19411013',2,3,5,NULL),
('LESTI','19411012',2,3,5,NULL),
('LESTI','19411015',2,3,5,NULL),
('LESTI','19411014',2,3,5,NULL),
('LESTI','19411059',2,3,5,'II'),
('LESTI','19411025',2,3,5,'II'),
('LESTI','19411038',2,3,5,'II'),
('LESTI','19411017',2,4,5,NULL),
('LESTI','19411019',2,4,5,NULL),
('LESTI','19411016',2,4,5,NULL),
('LESTI','19411018',2,4,5,NULL),
('LESTI','19411028',2,4,5,'III'),
('LESTI','19411039',2,4,5,'III'),
('LESTI','19411029',2,4,5,'IV'),
('LESTI','19411040',2,4,5,'IV'),
('LESTI','19411030',2,4,5,'IV'),
('LESTI','19411020',3,5,5,NULL),
('LESTI','19411021',3,5,5,NULL),
('LESTI','19411022',3,5,5,NULL),
('LESTI','19411031',3,5,5,'V'),
('LESTI','19411041',3,5,5,'V'),
('LESTI','19411049',3,5,5,'VI'),
('LESTI','19411042',3,5,5,'VI'),
('LESTI','15241279',3,5,5,'VII'),
('LESTI','19411050',3,5,5,'VII'),
('LESTI','19411043',3,5,5,'VII'),
('LESTI','19411034',3,5,5,'VII'),
('LESTI','19411035',3,6,30,'VIII'),
('LESTI','19411036',3,6,30,'VIII');

-- Two currently listed elective units did not exist in the old 2025/26 seed.
-- Insert only if missing; never duplicate by course + code.
INSERT INTO facodi.curricular_units
 (id,course_id,code,external_source,external_id,slug,title,normalized_title,
  summary,year,semester,ects,position,language,source_url,plan_url,
  status,published,metadata)
SELECT md5('facodi:ualg:2026/27:'||o.course_code||':'||o.unit_code)::uuid,
       c.id,o.unit_code,'ualg_official',o.unit_code,
       lower(o.course_code)||'-uc-'||o.unit_code,
       CASE o.unit_code WHEN '19411059' THEN 'Desenvolvimento de Jogos Digitais'
                        WHEN '15241279' THEN 'Automação e Robótica' END,
       CASE o.unit_code WHEN '19411059' THEN 'Desenvolvimento de Jogos Digitais'
                        WHEN '15241279' THEN 'Automação e Robótica' END,
       'Opção curricular prevista no plano oficial 2026/27. Conteúdo pedagógico ainda por validar.',
       o.official_year,o.official_semester,o.official_ects,
       9000+row_number() OVER (ORDER BY o.unit_code),
       'pt','https://ise.ualg.pt/curso/1941/plano','https://ise.ualg.pt/curso/1941/plano',
       'draft',false,
       jsonb_build_object('source_quality','official_plan_code_2026_27',
         'official_academic_year','2026/27','official_option_group',o.option_group,
         'official_plan_url','https://ise.ualg.pt/curso/1941/plano',
         'curriculum_review_status','pending_editorial_approval')
FROM _facodi_official_2026 o JOIN facodi.courses c ON c.code=o.course_code
WHERE o.course_code='LESTI' AND o.unit_code IN ('19411059','15241279')
  AND NOT EXISTS(
    SELECT 1 FROM facodi.curricular_units u WHERE u.course_id=c.id AND u.code=o.unit_code)
ON CONFLICT(id) DO NOTHING;

-- Match official codes, correct year/term/ECTS only when the official source states them,
-- and preserve the imported values in metadata if they differ.
UPDATE facodi.curricular_units u
SET year=o.official_year,
    semester=o.official_semester,
    ects=o.official_ects,
    source_url=CASE WHEN o.course_code='LDCOM' THEN 'https://www.ualg.pt/curso/1454/plano'
      ELSE 'https://ise.ualg.pt/curso/1941/plano' END,
    plan_url=CASE WHEN o.course_code='LDCOM' THEN 'https://www.ualg.pt/curso/1454/plano'
      ELSE 'https://ise.ualg.pt/curso/1941/plano' END,
    summary=CASE WHEN nullif(btrim(u.summary),'') IS NULL THEN
      concat('UC do percurso ',o.course_code,' (',o.official_year,'.º ano, ',
        o.official_semester,'.º semestre). ',
        CASE WHEN o.option_group IS NULL THEN
          'Código e ECTS cotejados com a página oficial UAlg 2026/27. '
        ELSE concat('Alternativa da Opção ',o.option_group,
          '; não contabilizar simultaneamente com as restantes opções do grupo. ') END,
        'Recursos educativos pendentes de revisão.')
      ELSE u.summary END,
    metadata=coalesce(u.metadata,'{}'::jsonb) ||
      CASE WHEN u.year IS DISTINCT FROM o.official_year OR
                u.semester IS DISTINCT FROM o.official_semester OR
                u.ects IS DISTINCT FROM o.official_ects THEN
        jsonb_build_object('prior_imported_curriculum',
          jsonb_build_object('year',u.year,'semester',u.semester,'ects',u.ects))
      ELSE '{}'::jsonb END ||
      jsonb_build_object(
        'official_academic_year','2026/27',
        'official_plan_url',CASE WHEN o.course_code='LDCOM' THEN
          'https://www.ualg.pt/curso/1454/plano' ELSE 'https://ise.ualg.pt/curso/1941/plano' END,
        'official_code_checked',true,
        'official_option_group',o.option_group,
        'is_elective_option',(o.option_group IS NOT NULL),
        'curriculum_review_status','pending_editorial_approval')
FROM facodi.courses c, _facodi_official_2026 o
WHERE u.course_id=c.id AND c.code=o.course_code AND u.code=o.unit_code
  AND u.status='draft' AND u.published=false;

-- Explicitly flag old choices that do not occur in the 2026/27 listing.
UPDATE facodi.curricular_units u
SET metadata=coalesce(u.metadata,'{}'::jsonb)||
  jsonb_build_object('official_academic_year','2026/27',
    'official_code_checked',false,'curriculum_review_status','not_listed_in_2026_27_plan')
FROM facodi.courses c
WHERE u.course_id=c.id AND c.code IN ('LESTI','LDCOM')
  AND u.status='draft' AND u.published=false
  AND NOT EXISTS(SELECT 1 FROM _facodi_official_2026 o
                 WHERE o.course_code=c.code AND o.unit_code=u.code);

UPDATE facodi.courses c SET
 title=CASE WHEN c.code='LESTI' THEN 'Licenciatura em Engenharia de Sistemas e Tecnologias Informáticas'
            ELSE 'Licenciatura em Design de Comunicação' END,
 normalized_title=CASE WHEN c.code='LESTI' THEN 'Engenharia de Sistemas e Tecnologias Informáticas'
            ELSE 'Design de Comunicação' END,
 school=CASE WHEN c.code='LESTI' THEN 'Instituto Superior de Engenharia'
            ELSE 'Escola Superior de Educação e Comunicação' END,
 degree_type='Licenciatura',
 language='pt',
 source_url=CASE WHEN c.code='LESTI' THEN 'https://ise.ualg.pt/curso/1941'
              ELSE 'https://www.ualg.pt/curso/1454' END,
 plan_url=CASE WHEN c.code='LESTI' THEN 'https://ise.ualg.pt/curso/1941/plano'
              ELSE 'https://www.ualg.pt/curso/1454/plano' END,
 summary=CASE WHEN c.code='LESTI' THEN
   'Licenciatura politécnica de três anos do Instituto Superior de Engenharia da Universidade do Algarve, na área de sistemas e tecnologias informáticas. Catálogo académico em revisão.'
   ELSE
   'Licenciatura politécnica de três anos da Escola Superior de Educação e Comunicação da Universidade do Algarve, na área de design visual e comunicação. Catálogo académico em revisão.' END,
 metadata=coalesce(c.metadata,'{}'::jsonb)||
   jsonb_build_object('official_program_verified',true,
      'official_academic_year','2026/27',
      'official_plan_url',CASE WHEN c.code='LESTI' THEN
         'https://ise.ualg.pt/curso/1941/plano' ELSE 'https://www.ualg.pt/curso/1454/plano' END,
      'official_course_ects_total',180,
      'catalog_review_status','pending_editorial_approval',
      'curriculum_contains_elective_alternatives',true)
WHERE c.code IN ('LDCOM','LESTI') AND c.status='draft' AND c.published=false;
