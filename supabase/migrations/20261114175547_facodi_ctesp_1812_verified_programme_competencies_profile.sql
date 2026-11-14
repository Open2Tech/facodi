-- Course-level objectives paraphrased from UAlg's official programme presentation,
-- NOT individual curricular-unit syllabi, accreditation or student assessment.
UPDATE facodi.learning_objects
SET objectives='["Desenhar, implementar e manter sistemas de informação de apoio às organizações.","Instalar, configurar e manter redes informáticas e servidores.","Desenvolver e manter websites e aplicações baseadas em tecnologias Web.","Utilizar ferramentas de computação em nuvem e ambientes de colaboração.","Organizar documentos e informação com ferramentas digitais.","Aplicar princípios de marketing digital e comunicação na Web.","Utilizar business intelligence e indicadores no apoio à decisão.","Analisar, gerir e tratar dados com ferramentas de informação.","Apoiar iniciativas de inovação, empreendedorismo e gestão de projetos.","Criar conteúdos e soluções com técnicas de computação visual e multimédia."]'::jsonb,
    metadata=coalesce(metadata,'{}'::jsonb) ||
      jsonb_build_object('programme_goals_paraphrased_from_official_presentation',true,
       'programme_goals_source','https://www.ualg.pt/curso/1812',
       'programme_goals_not_detailed_uc_syllabi',true,
       'programme_goals_count',10)
WHERE id=md5('facodi:ualg:1812:course')::uuid
 AND object_type='course' AND source_url='https://www.ualg.pt/curso/1812';

UPDATE facodi.courses
SET metadata=coalesce(metadata,'{}'::jsonb) ||
  jsonb_build_object('official_programme_objectives_paraphrased', '["Desenhar, implementar e manter sistemas de informação de apoio às organizações.","Instalar, configurar e manter redes informáticas e servidores.","Desenvolver e manter websites e aplicações baseadas em tecnologias Web.","Utilizar ferramentas de computação em nuvem e ambientes de colaboração.","Organizar documentos e informação com ferramentas digitais.","Aplicar princípios de marketing digital e comunicação na Web.","Utilizar business intelligence e indicadores no apoio à decisão.","Analisar, gerir e tratar dados com ferramentas de informação.","Apoiar iniciativas de inovação, empreendedorismo e gestão de projetos.","Criar conteúdos e soluções com técnicas de computação visual e multimédia."]'::jsonb,
   'official_programme_objectives_source','https://www.ualg.pt/curso/1812',
   'programme_objectives_are_not_unit_syllabi',true,
   'level','CTeSP (nível 5)'),
 description_html=description_html ||
 '<h2>Objetivos profissionais descritos pela UAlg</h2><p>O perfil profissional envolve sistemas de informação, redes e servidores, aplicações Web, computação em nuvem, gestão documental, marketing digital, análise de dados, business intelligence, projetos e conteúdos multimédia. Esta síntese reformula a apresentação oficial do curso; os recursos FACODI são independentes.</p>'
WHERE code='CTESP-STI' AND external_id='1812'
  AND metadata->>'official_programme_objectives_source' IS NULL;

DO $g$ BEGIN
 IF (SELECT jsonb_array_length(objectives)
  FROM facodi.learning_objects WHERE id=md5('facodi:ualg:1812:course')::uuid)<>10
 THEN RAISE EXCEPTION 'Official course presentation objectives incomplete';END IF;
END $g$;