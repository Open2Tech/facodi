
CREATE TABLE IF NOT EXISTS facodi.project_profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
 entity_kind text NOT NULL CHECK(entity_kind IN ('person','organization','initiative','community')),
 relationship_kind text NOT NULL CHECK(relationship_kind IN ('founder','academic_reference','student_led_program','technology_collaboration','code_repository','creative_influence','contribution_path','candidate_contributor')),
 display_name text NOT NULL CHECK(char_length(display_name) BETWEEN 2 AND 160),
 role_label text NOT NULL CHECK(char_length(role_label) BETWEEN 3 AND 150),
 headline text NOT NULL CHECK(char_length(headline) BETWEEN 10 AND 320),
 description text NOT NULL CHECK(char_length(description) BETWEEN 20 AND 1800),
 website_url text CHECK(website_url IS NULL OR website_url ~ '^https://'),
 public_source_url text CHECK(public_source_url IS NULL OR public_source_url ~ '^https://'),
 verification_state text NOT NULL DEFAULT 'pending' CHECK(verification_state IN ('pending','verified_public','disputed')),
 publication_state text NOT NULL DEFAULT 'draft' CHECK(publication_state IN ('draft','published','archived')),
 consent_for_public_credit boolean NOT NULL DEFAULT false,
 translations jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(translations)='object'),
 editorial_metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(editorial_metadata)='object'),
 sort_order integer NOT NULL DEFAULT 100,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 reviewed_at timestamptz,
 CONSTRAINT facodi_project_public_consent_guard CHECK(
   publication_state <> 'published' OR (
   verification_state='verified_public' AND public_source_url IS NOT NULL
   AND (entity_kind <> 'person' OR consent_for_public_credit))
 )
);
ALTER TABLE facodi.project_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON facodi.project_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON facodi.project_profiles TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON facodi.project_profiles TO authenticated;
CREATE POLICY project_profiles_public_read ON facodi.project_profiles FOR SELECT TO anon,authenticated
 USING(publication_state='published' AND verification_state='verified_public'
       AND (entity_kind <> 'person' OR consent_for_public_credit));
CREATE POLICY project_profiles_editor_manage ON facodi.project_profiles FOR ALL TO authenticated
 USING ((SELECT facodi.is_facodi_editor())) WITH CHECK ((SELECT facodi.is_facodi_editor()));
CREATE INDEX IF NOT EXISTS facodi_project_profiles_public_idx
 ON facodi.project_profiles(relationship_kind,sort_order,slug)
 WHERE publication_state='published' AND verification_state='verified_public';

CREATE TABLE IF NOT EXISTS facodi.project_milestones (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
 event_date date,
 date_label text NOT NULL CHECK(char_length(date_label) BETWEEN 4 AND 70),
 title text NOT NULL CHECK(char_length(title) BETWEEN 5 AND 180),
 summary text NOT NULL CHECK(char_length(summary) BETWEEN 15 AND 900),
 public_source_url text NOT NULL CHECK(public_source_url ~ '^https://'),
 publication_state text NOT NULL DEFAULT 'draft' CHECK(publication_state IN ('draft','published','archived')),
 verification_state text NOT NULL DEFAULT 'pending' CHECK(verification_state IN ('pending','verified_public','disputed')),
 translations jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(translations)='object'),
 sort_order integer NOT NULL DEFAULT 100,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT facodi_project_milestone_guard CHECK(
  publication_state <> 'published' OR verification_state='verified_public'
 )
);
ALTER TABLE facodi.project_milestones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON facodi.project_milestones FROM PUBLIC, anon, authenticated;
GRANT SELECT ON facodi.project_milestones TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON facodi.project_milestones TO authenticated;
CREATE POLICY project_milestones_public_read ON facodi.project_milestones FOR SELECT TO anon,authenticated
 USING(publication_state='published' AND verification_state='verified_public');
CREATE POLICY project_milestones_editor_manage ON facodi.project_milestones FOR ALL TO authenticated
 USING ((SELECT facodi.is_facodi_editor())) WITH CHECK ((SELECT facodi.is_facodi_editor()));
CREATE INDEX IF NOT EXISTS facodi_project_milestones_public_idx ON facodi.project_milestones(event_date DESC,sort_order)
 WHERE publication_state='published' AND verification_state='verified_public';

INSERT INTO facodi.project_profiles(slug,entity_kind,relationship_kind,display_name,role_label,headline,description,website_url,public_source_url,verification_state,publication_state,consent_for_public_credit,translations,editorial_metadata,sort_order)
VALUES ('marcelo-santos','person','founder','Marcelo Santos','Autor e responsável pelo projeto','Uma pergunta de estudante virou uma plataforma de aprendizagem aberta.','Marcelo idealizou a FACODI para transformar a procura dispersa por vídeos, documentação e materiais educativos em percursos de aprendizagem com contexto. A iniciativa nasceu de experiências reais de estudo, une engenharia de software e educação aberta e foi apresentada na Being SEA-EU 2026.','https://facodi.com/about','https://facodi.com/about','verified_public','published',true,'{"en":{"role_label":"Founder and project lead","headline":"A student question became an open learning platform."},"es":{"role_label":"Autor y responsable","headline":"Una idea de estudiante, una plataforma abierta."},"fr":{"role_label":"Créateur et responsable","headline":"Une idée d''étudiant devenue plateforme ouverte."}}'::jsonb,'{"public_named":true}'::jsonb,10),
('ualg','organization','academic_reference','Universidade do Algarve','Enquadramento académico','Uma referência académica, não um diploma atribuído pela FACODI.','A FACODI tem ligação à Universidade do Algarve no âmbito da SEA-EU. Os planos curriculares públicos ajudam a organizar unidades e recursos, mas não atribuem acreditação, graus, equivalências nem créditos ECTS pela FACODI.','https://www.ualg.pt','https://www.ualg.pt/universidade-europeia-dos-mares','verified_public','published',false,'{"en":{"role_label":"Academic context"},"es":{"role_label":"Contexto académico"},"fr":{"role_label":"Référence universitaire"}}'::jsonb,'{"not_accreditation":true}'::jsonb,20),
('sea-eu','initiative','student_led_program','SEA-EU · European University of the Seas','Programa de projetos liderados por estudantes','Ideias de estudantes que atravessam fronteiras.','A FACODI foi selecionada nos SEA-EU Student-Led Projects 2026 e apresentada na 3.ª Being SEA-EU Conference, em Gdańsk. A aliança constitui o enquadramento europeu do projeto, não uma garantia de revisão do conteúdo por todas as universidades membros.','https://sea-eu.org/student-led-projects/','https://sea-eu.org/student-led-projects-call-2026/','verified_public','published',false,'{"en":{"role_label":"European student-led programme"},"es":{"role_label":"Programa estudiantil europeo"},"fr":{"role_label":"Programme européen étudiant"}}'::jsonb,'{"alliance_wide_endorsement":false}'::jsonb,30),
('corvanis','organization','technology_collaboration','Corvanis','Colaboração tecnológica','Engenharia de software a trabalhar pela educação aberta.','A Corvanis é apresentada publicamente como parceira tecnológica de desenvolvimento da FACODI. A colaboração apoia engenharia de software e evolução da plataforma, sem substituir a missão educativa nem a curadoria editorial da FACODI.','https://corvanis.com','https://facodi.com/partnerships','verified_public','published',false,'{"en":{"role_label":"Technology development partner"},"es":{"role_label":"Colaboración tecnológica"},"fr":{"role_label":"Collaboration technologique"}}'::jsonb,'{"not_curriculum_owner":true}'::jsonb,40),
('open2tech','community','code_repository','Open2Tech','Casa do código aberto','O código tem morada. O conhecimento é de toda a gente.','O repositório Open2Tech/facodi acolhe o código da aplicação e a colaboração técnica. A referência identifica o espaço de desenvolvimento, sem sugerir patrocínio legal ou financeiro.','https://github.com/Open2Tech/facodi','https://github.com/Open2Tech/facodi','verified_public','published',false,'{"en":{"role_label":"Open-source repository"},"es":{"role_label":"Repositorio abierto"},"fr":{"role_label":"Dépôt open source"}}'::jsonb,'{"not_formal_sponsor":true}'::jsonb,50),
('monynha','initiative','creative_influence','Monynha Softwares','Inspiração criativa · projeto independente','A tecnologia pode ter rigor, humor e coração.','A Monynha inspira um tom criativo, próximo e acolhedor. A Monynha e a FACODI têm ligação à trajetória do mesmo autor, mas são iniciativas diferentes. Esta menção não significa patrocínio, propriedade institucional ou parceria formal.','https://facodi.com/blog/our-blog-1/por-tras-da-monynha-1','https://facodi.com/pt/blog/viagem-1/monynha-softwares-e-facodi-o-que-as-liga-e-o-que-continua-separado-2','verified_public','published',false,'{"en":{"role_label":"Creative inspiration · separate initiative"},"es":{"role_label":"Inspiración creativa independiente"},"fr":{"role_label":"Inspiration créative indépendante"}}'::jsonb,'{"distinct_project":true}'::jsonb,60),
('learners','community','contribution_path','Estudantes e autodidatas','Porta aberta à participação','Aprender já é bom. Deixar uma boa referência é melhor ainda.','Quem aprende pode explorar cursos, indicar lacunas e propor playlists e materiais. São formas de participar, não uma lista de pessoas registadas nem prova de matrícula universitária.','https://facodi.vercel.app/about','https://facodi.com/about','verified_public','published',false,'{"en":{"role_label":"Invitation to learners"},"es":{"role_label":"Invitación a estudiantes"},"fr":{"role_label":"Invitation aux apprenants"}}'::jsonb,'{"category_only":true,"registered_members_claim":false}'::jsonb,70),
('educators','community','contribution_path','Docentes, revisores e curadores','Curadoria com contexto','Partilhar uma boa explicação pode mudar o dia de alguém.','Docentes e curadores podem sugerir recursos, enriquecer o contexto e ajudar a rever correções. Esta é uma convocatória à colaboração, não um diretório de docentes aderentes.','https://facodi.vercel.app/about','https://facodi.com/about','verified_public','published',false,'{"en":{"role_label":"Invitation to educators and curators"},"es":{"role_label":"Invitación a docentes y curadores"},"fr":{"role_label":"Invitation aux enseignants et éditeurs"}}'::jsonb,'{"category_only":true,"registered_members_claim":false}'::jsonb,80),
('bilal-uddin','person','candidate_contributor','Bilal Uddin','Colaboração em design e planeamento · a confirmar','Crédito editorial reservado até validação.','Notas automáticas de reuniões de 2026 mencionam discussões de UI, wireframes e comunicação. A autoria de entregas e a autorização para crédito público não estão verificadas.',NULL,NULL,'pending','draft',false,'{}'::jsonb,'{"private_correspondence":true,"notes_may_be_inaccurate":true,"no_contact_data":true}'::jsonb,200),
('gustavo-scheidt','person','candidate_contributor','Gustavo Cezar Scheidt','Planeamento de comunicação · a confirmar','Crédito editorial reservado até validação.','Correspondência de outubro de 2026 regista participação no planeamento de comunicação. O papel e a autorização para crédito público necessitam de confirmação.',NULL,NULL,'pending','draft',false,'{}'::jsonb,'{"private_correspondence":true,"no_contact_data":true}'::jsonb,210),
('andreia-cirne','person','candidate_contributor','Andreia Cirne','Proposta criativa · a confirmar','Uma proposta comercial não comprova entrega nem parceria.','O histórico inclui briefing e proposta comercial de comunicação e produção gráfica. Publicação depende de prova do trabalho e consentimento para crédito.',NULL,NULL,'pending','draft',false,'{}'::jsonb,'{"proposal_not_contract":true,"no_contact_data":true}'::jsonb,220) ON CONFLICT(slug) DO NOTHING;
INSERT INTO facodi.project_milestones(slug,event_date,date_label,title,summary,public_source_url,publication_state,verification_state,translations,sort_order)
VALUES ('selected-sea-eu-2026',NULL,'2026','Um projeto de estudantes com horizonte europeu','A FACODI foi selecionada no âmbito dos SEA-EU Student-Led Projects 2026, um programa que apoia ideias de estudantes com colaboração internacional.','https://facodi.com/about','published','verified_public','{"en":{"title":"A student-led project with European reach"}}'::jsonb,10),
('being-sea-eu-gdansk','2026-09-16','16 setembro 2026','De uma rotina de estudo até Gdańsk','A FACODI foi apresentada na 3.ª Being SEA-EU Conference, na Universidade de Gdańsk, com a proposta de aprendizagem aberta e organizada em comunidade.','https://facodi.com/blog/our-blog-1/from-studying-on-youtube-to-an-open-education-platform-facodi-presented-in-gdansk-4','published','verified_public','{"en":{"title":"From study tabs to Gdańsk"}}'::jsonb,20),
('open-catalog-2026','2026-11-14','novembro 2026','Mais contexto, menos separadores perdidos','A plataforma aberta liga cursos e unidades curriculares a vídeos e referências externas, com propostas e revisão editorial em estados separados.','https://github.com/Open2Tech/facodi','published','verified_public','{"en":{"title":"More context, fewer lost tabs"}}'::jsonb,30) ON CONFLICT(slug) DO NOTHING;