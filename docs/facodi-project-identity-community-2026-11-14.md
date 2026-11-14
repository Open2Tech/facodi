# FACODI — História, autoria, ecossistema e comunidade

**Registo editorial e técnico — 14 de novembro de 2026**

A FACODI é um campus digital aberto criado para ligar perguntas, cursos, unidades curriculares e recursos de aprendizagem. A sua comunicação combina curiosidade, humor e proximidade — inspirada no estilo criativo da Monynha — sem confundir a identidade ou a propriedade das duas iniciativas.

> Uma pergunta. Mil abas. Um campus aberto.

> Ninguém aprende sozinho. E ainda bem.

## Identidade pública verificada

| Relação | Entidade | Contexto | Fonte pública |
| --- | --- | --- | --- |
| Autor e responsável | Marcelo Santos | Criador da FACODI, projeto que nasceu da sua experiência como estudante | https://facodi.com/about |
| Referência académica | Universidade do Algarve | Enquadramento universitário, planos curriculares públicos e relação SEA-EU | https://www.ualg.pt/universidade-europeia-dos-mares |
| Programa europeu | SEA-EU | Seleção nos Student-Led Projects 2026, apresentação na conferência Being SEA-EU de Gdańsk | https://sea-eu.org/student-led-projects-call-2026/ |
| Colaboração tecnológica | Corvanis | Desenvolvimento de software e suporte técnico | https://facodi.com/partnerships |
| Repositório aberto | Open2Tech | Local do código e colaboração técnica | https://github.com/Open2Tech/facodi |
| Inspiração criativa | Monynha Softwares | Projeto distinto, cuja linguagem acessível inspira a comunicação | https://facodi.com/pt/blog/viagem-1/monynha-softwares-e-facodi-o-que-as-liga-e-o-que-continua-separado-2 |
| Convite público | Estudantes e autodidatas | Possibilidade de aprender e propor recursos | https://facodi.com/about |
| Convite público | Docentes e curadores | Possibilidade de enriquecer contexto e ajudar na revisão | https://facodi.com/about |

As referências a universidades **não** implicam acreditação, emissão de diplomas, equivalências ou ECTS. Uma colaboração técnica não implica propriedade intelectual do projeto. O código numa organização GitHub não prova patrocínio. Uma inspiração criativa não é parceria formal.

A FACODI foi apresentada em Gdańsk a 16 de setembro de 2026: https://facodi.com/blog/our-blog-1/from-studying-on-youtube-to-an-open-education-platform-facodi-presented-in-gdansk-4 .

## Como foi usado o Gmail

Foram consultados históricos relativos ao projeto FACODI, a contactos SEA-EU e ao planeamento de comunicação. Esses materiais serviram para reconciliar a narrativa e sinalizar **três potenciais créditos pessoais privados**, sem atribuir publicamente funções que ainda precisam de confirmação.

**Não foram importados** para o catálogo público emails, contactos privados, listas de participantes, orçamentos ou transcrições confidenciais.

A resposta de outubro de 2026 da organização SEA-EU foi um compromisso de **avaliar uma possível divulgação**, não uma aprovação de campanha. Uma proposta comercial de design/comunicação não prova contratação ou entrega.

## Modelo de dados

Três migrações aplicadas e versionadas:

- 20261114212732_facodi_project_identity_community_public_provenance_and_private_credit_queue.sql
- 20261114213423_facodi_project_profiles_and_timeline_localized_descriptions.sql
- 20261114213520_facodi_private_contributor_credit_approval_with_explicit_consent.sql

A tabela facodi.project_profiles contém perfis, relação e papel, fontes públicas, provas, estados editoriais, consentimento e descrições PT/EN/ES/FR. Oito perfis ficaram publicados e três potenciais colaboradores permanecem privados.

A tabela facodi.project_milestones contém três marcos históricos públicos, documentados e traduzidos. A tabela facodi.project_credit_approvals regista decisões editoriais privadas.

Uma constraint impede publicar o crédito de uma pessoa sem fonte pública, verificação e consentimento. A RPC facodi.review_project_credit corre com privilégios do invocador, exige editor autenticado e cria a aprovação e a auditoria numa transação. A RLS garante que utilizadores anónimos veem apenas registos públicos aprovados.

Foram realizados testes transacionais de leitura anónima, leitura editorial, recusa de publicação inválida e aprovação simulada, todos sem guardar créditos fictícios. Estado real na verificação: **8 perfis publicados, 3 em rascunho, 0 aprovações pessoais**.

## Interface

- **/about**: origem do projeto, autor, cronologia pública e ecossistema com fontes.
- **/community**: aprender, sugerir materiais, enviar playlists ou contribuir no código, sem contagens inventadas de membros.
- **/editor/project-credits**: revisão privada de autoria, participação e consentimento.

As páginas seguem o design FACODI com uma voz mais humana e têm traduções em português, inglês, espanhol e francês.

## Qualidade, publicação e próximos passos

O CI do GitHub passou em lint, TypeScript, testes, validação de templates de email e build: https://github.com/Open2Tech/facodi/actions/runs/43643930959 .

Os limites diários de builds da Vercel foram atingidos; a última revisão disponível em produção era anterior aos commits desta implementação. O deploy das páginas atuais deve ser confirmado por SHA de commit, e não presumido.

Faltam teste autenticado com editor real, validação responsiva após deploy e confirmação voluntária dos créditos pessoais. **Nenhum contacto foi publicado ou contactado em massa.** A inclusão de futuros logótipos e fotografias exige revisão de direitos de utilização.
