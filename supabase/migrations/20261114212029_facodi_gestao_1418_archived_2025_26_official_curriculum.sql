-- Preserve the previous 2025/26 UAlg Gestão plan as a versioned archive.
-- Not active or equivalent to the current 2026/27 plan.
-- Source official UAlg course 1418 page /plano (2025/26 selector).
CREATE TABLE IF NOT EXISTS facodi.course_curriculum_archives (
 id uuid PRIMARY KEY,
 course_id uuid NOT NULL REFERENCES facodi.courses(id) ON DELETE CASCADE,
 academic_year text NOT NULL,
 status text NOT NULL CHECK(status IN ('archived','draft')),
 published boolean NOT NULL DEFAULT false,
 official_source_url text NOT NULL,
 unique_unit_count integer NOT NULL CHECK(unique_unit_count>=0),
 programme_ects numeric NOT NULL,
 plan jsonb NOT NULL DEFAULT '[]'::jsonb,
 comparison jsonb NOT NULL DEFAULT '{}'::jsonb,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(course_id,academic_year)
);
CREATE INDEX IF NOT EXISTS course_curriculum_archives_course_idx
 ON facodi.course_curriculum_archives(course_id,academic_year);
ALTER TABLE facodi.course_curriculum_archives ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON facodi.course_curriculum_archives TO anon,authenticated;
DROP POLICY IF EXISTS facodi_public_read_published_curriculum_archives
 ON facodi.course_curriculum_archives;
CREATE POLICY facodi_public_read_published_curriculum_archives
 ON facodi.course_curriculum_archives FOR SELECT TO anon,authenticated
 USING(published=true AND status='archived'
   AND EXISTS(SELECT 1 FROM facodi.courses c
   WHERE c.id=course_id AND c.status='active' AND c.published));
DROP POLICY IF EXISTS facodi_editor_manage_curriculum_archives
 ON facodi.course_curriculum_archives;
CREATE POLICY facodi_editor_manage_curriculum_archives
 ON facodi.course_curriculum_archives FOR ALL TO authenticated
 USING((SELECT facodi.is_facodi_editor()))
 WITH CHECK((SELECT facodi.is_facodi_editor()));
GRANT INSERT,UPDATE,DELETE ON facodi.course_curriculum_archives TO authenticated;

CREATE TEMP TABLE _gestao_archive_25(
 code text PRIMARY KEY,title text NOT NULL,yr int NOT NULL,
 sem int NOT NULL,ects numeric NOT NULL,option_group text,sort_key int
) ON COMMIT DROP;
INSERT INTO _gestao_archive_25 VALUES
('14181085','Inglês para Gestão',1,0,8,NULL,1),
('14181086','Contabilidade Financeira I',1,1,7,NULL,2),
('14181002','Direito Civil',1,1,5,NULL,3),
('14181087','Informática I',1,1,4,NULL,4),
('14181005','Introdução à Gestão',1,1,5,NULL,5),
('14181004','Matemática I',1,1,5,NULL,6),
('14181088','Contabilidade Financeira II',1,2,7,NULL,7),
('14181007','Direito Comercial',1,2,5,NULL,8),
('14181089','Informática II',1,2,4,NULL,9),
('14181006','Matemática Financeira',1,2,5,NULL,10),
('14181010','Matemática II',1,2,5,NULL,11),
('14181014','Análise Financeira',2,1,5,NULL,12),
('14181090','Contabilidade de Gestão I',2,1,7,NULL,13),
('14181011','Economia I',2,1,4,NULL,14),
('14181016','Estatística I',2,1,4.5,NULL,15),
('14181013','Marketing Estratégico',2,1,5,NULL,16),
('14181015','Sistemas de Informação I',2,1,4.5,NULL,17),
('14181020','Comportamento Organizacional',2,2,5,NULL,18),
('14181091','Contabilidade de Gestão II',2,2,7,NULL,19),
('14181017','Economia II',2,2,4,NULL,20),
('14181022','Estatística II',2,2,4.5,NULL,21),
('14181019','Marketing Operacional',2,2,5,NULL,22),
('14181021','Sistemas de Informação II',2,2,4.5,NULL,23),
('14181092','Análise de Investimentos',3,1,5,NULL,24),
('14181026','Direito do Trabalho',3,1,5,NULL,25),
('14181023','Direito Fiscal I',3,1,5,NULL,26),
('14181024','Economia Portuguesa e Europeia',3,1,5,NULL,27),
('14181094','Gestão de Recursos Humanos',3,1,5,NULL,28),
('14191133','Contabilidade de Gestão Avançada',3,1,5,'I',29),
('14191111','Contabilidade Pública',3,1,5,'I',30),
('140064466','Gestão e Negociação',3,1,5,'I',31),
('140064467','Gestão e Publicidade em Redes Sociais',3,1,5,'I',32),
('140064465','Gestão e Técnica de Vendas',3,1,5,'I',33),
('140064471','Marketing de Serviços',3,1,5,'I',34),
('140064468','Marketing Desportivo',3,1,5,'I',35),
('14181095','Produtos Financeiros',3,1,5,'I',36),
('14181029','Direito Fiscal II',3,2,5,NULL,37),
('14181031','Estágio',3,2,10,NULL,38),
('14181093','Gestão Estratégica',3,2,5,NULL,39),
('14181030','Gestão Financeira',3,2,5,NULL,40),
('14181167','Complementos de Estágio para Contabilista Certificado (CC)',3,2,5,'II',41),
('14181168','Empreendedorismo e Inovação',3,2,5,'II',42),
('140064472','Escrita para a Web e Storytelling',3,2,5,'II',43),
('140064470','Marketing Internacional',3,2,5,'II',44),
('14181164','Projeto de Simulação Empresarial',3,2,5,'II',45),
('140064469','Tecnologias Multimédia',3,2,5,'II',46);
DO $$ BEGIN
 IF (SELECT count(*) FROM _gestao_archive_25)<>46 THEN
 RAISE EXCEPTION 'Unexpected 2025/26 plan size'; END IF;
 IF (SELECT sum(ects) FROM _gestao_archive_25
     WHERE yr=1 AND option_group IS NULL)<>60
 OR (SELECT sum(ects) FROM _gestao_archive_25
     WHERE yr=2 AND option_group IS NULL)<>60
 OR (SELECT sum(ects) FROM _gestao_archive_25
     WHERE yr=3 AND option_group IS NULL)<>50
 THEN RAISE EXCEPTION '2025/26 mandatory ECTS do not reconcile'; END IF;
 IF (SELECT count(distinct option_group) FROM _gestao_archive_25
     WHERE option_group IS NOT NULL)<>2 THEN RAISE EXCEPTION 'Expected two 2025/26 elective groups'; END IF;
 IF (SELECT count(*) FROM facodi.courses
     WHERE code='LGEST' AND status='active' AND published)<>1 THEN
   RAISE EXCEPTION 'Active Gestão missing'; END IF;
END $$;

INSERT INTO facodi.course_curriculum_archives(
 id,course_id,academic_year,status,published,official_source_url,
 unique_unit_count,programme_ects,plan,comparison,metadata)
SELECT md5('facodi:lg1418:curriculum_archive:2025-26')::uuid,
 c.id,'2025/26','archived',true,'https://www.ualg.pt/curso/1418/plano',
 46,180,
 (SELECT jsonb_agg(jsonb_build_object(
   'code',a.code,'title',a.title,'year',a.yr,'semester',a.sem,
   'semester_type',CASE WHEN a.sem=0 THEN 'annual'
      WHEN a.sem=1 THEN 'first' ELSE 'second' END,
   'ects',a.ects,'option_group',a.option_group,
   'is_elective',a.option_group IS NOT NULL) ORDER BY a.sort_key)
 FROM _gestao_archive_25 a),
 jsonb_build_object(
   'comparison_basis','exact_code_only',
   'equivalence_claimed',false,
   'current_academic_year','2026/27',
   'older_unique_uc_count',46,
   'newer_unique_uc_count',(SELECT count(*) FROM facodi.curricular_units u WHERE u.course_id=c.id),
   'exact_code_overlap',(
     SELECT count(*) FROM _gestao_archive_25 a
     JOIN facodi.curricular_units u ON u.code=a.code AND u.course_id=c.id),
   'older_only_codes',(
     SELECT coalesce(jsonb_agg(a.code ORDER BY a.code),'[]'::jsonb)
     FROM _gestao_archive_25 a WHERE NOT EXISTS(
       SELECT 1 FROM facodi.curricular_units u
       WHERE u.course_id=c.id AND u.code=a.code)),
   'newer_only_codes',(
     SELECT coalesce(jsonb_agg(u.code ORDER BY u.code),'[]'::jsonb)
     FROM facodi.curricular_units u WHERE u.course_id=c.id AND NOT EXISTS(
       SELECT 1 FROM _gestao_archive_25 a WHERE a.code=u.code))
 ),
 jsonb_build_object(
  'source','Universidade do Algarve',
  'official_course_code','1418',
  'reference_year','2025/26',
  'historical_snapshot',true,
  'equivalence_not_verified',true,
  'historical_units_are_not_current_enrollments',true,
  'course_type','politecnico',
  'expected_student_ects',180,
  'annual_code','14181085',
  'elective_choices',jsonb_build_object('I',1,'II',1),
  'archive_available_to_public',true)
FROM facodi.courses c
WHERE c.code='LGEST'
ON CONFLICT(course_id,academic_year) DO NOTHING;

-- Enrich the course listing without presenting archived units as current.
UPDATE facodi.courses c
SET metadata=coalesce(c.metadata,'{}'::jsonb)||
 jsonb_build_object(
   'historical_curriculum_available',true,
   'historical_years',jsonb_build_array('2025/26'),
   'historical_archive_table','facodi.course_curriculum_archives',
   'historical_exact_code_comparison_only',true,
   'historical_2025_26_official_url','https://www.ualg.pt/curso/1418/plano',
   'historical_2025_26_note',
     'O plano da UAlg para 2025/26 era distinto, contendo 46 UCs/ofertas e dois grupos de opções. Códigos diferentes não demonstram equivalência curricular.')
WHERE c.code='LGEST';

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.course_curriculum_archives
   WHERE academic_year='2025/26' AND published=true AND
    course_id=(SELECT id FROM facodi.courses WHERE code='LGEST'))<>1
 THEN RAISE EXCEPTION 'Historical archive was not created'; END IF;
END $$;