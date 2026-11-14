# FACODI — CTeSP Sistemas e Tecnologias de Informação, UAlg 1812 (Faro)

**Data da implementação:** 14/11/2026  
**Supabase:** `wvkjainfwsyiyfcmbtid`, schema `facodi`  
**Repositório:** `Open2Tech/facodi`, branch `facodi`  
**URL pública:** https://facodi.vercel.app/courses/ctesp-sti

## 1. Identidade oficial e desambiguação

A designação oficial do curso é **Curso Técnico Superior Profissional (CTeSP) em Sistemas e Tecnologias de Informação**, código **1812**, presencial, diurno, lecionado em português, em **Faro**, com associação ao Instituto Superior de Engenharia e à Escola Superior de Gestão, Hotelaria e Turismo da Universidade do Algarve.

Fontes:
- [Apresentação oficial UAlg, curso 1812](https://www.ualg.pt/curso/1812)
- [Plano oficial UAlg, curso 1812, ano letivo 2026/27](https://www.ualg.pt/curso/1812/plano)
- [Candidaturas ao curso 1812 na UAlg](https://www.ise.ualg.pt/curso/1812/candidaturas?tipo=tesp)

**Não confundir** este CTeSP com:
- [Curso 1932 — Tecnologias Informáticas](https://www.ualg.pt/curso/1932?tipo=tesp) (oferta distinta);
- [Curso 1970 — Sistemas e Tecnologias de Informação em Portimão](https://www.ualg.pt/curso/1970/plano) (plano similar, mas identificadores de UCs diferentes);
- Licenciatura em Engenharia de Sistemas e Tecnologias Informáticas `LESTI`.

Código interno FACODI: `CTESP-STI`; slug: `ctesp-sti`; tipo de grau: `CTeSP`. O curso não foi fundido com qualquer licenciatura.

## 2. Plano oficial 2026/27

**17 UCs, 120 ECTS, 2 anos, 4 semestres.** Os títulos, códigos, semestres e ECTS foram cotejados diretamente com o plano da UAlg.

| Ano | Semestre no curso | Código | Unidade curricular | ECTS |
|---|---:|---|---|---:|
| 1.º | 1.º | 18121019 | Bases de Dados I | 6 |
| 1.º | 1.º | 18121007 | Ferramentas de Apoio à Decisão | 5 |
| 1.º | 1.º | 18121003 | Ferramentas de Produtividade | 6 |
| 1.º | 1.º | 18121000 | Matemática Aplicada | 6 |
| 1.º | 1.º | 18121001 | Programação | 6 |
| 1.º | 2.º | 18121006 | Complementos de Programação | 5 |
| 1.º | 2.º | 18121009 | Gestão Documental e de Processos de Negócio | 5 |
| 1.º | 2.º | 18121012 | Gestão e Empreendedorismo | 6 |
| 1.º | 2.º | 18121008 | Sistemas Operativos | 5 |
| 1.º | 2.º | 18121005 | Técnicas de Comunicação | 5 |
| 1.º | 2.º | 18121018 | Tecnologias Web | 5 |
| 2.º | 3.º | 18121017 | Ambientes de Desenvolvimento Colaborativo | 6 |
| 2.º | 3.º | 18121020 | Bases de Dados II | 6 |
| 2.º | 3.º | 18121015 | Business Intelligence | 6 |
| 2.º | 3.º | 18121014 | Redes e Protocolos Internet | 6 |
| 2.º | 3.º | 18121011 | Web Marketing | 6 |
| 2.º | 4.º | 18121016 | Estágio | 30 |

**Somas verificadas:** 1.º sem. 29 ECTS, 2.º sem. 31 ECTS, 3.º sem. 30 ECTS, 4.º sem. 30 ECTS. Total 120. A assimetria 29/31 é a que consta do plano oficial e não deve ser substituída por uma distribuição presumida de 30/30.

O plano de 2026/27 apresenta títulos e códigos, mas não expõe nesta consulta o texto integral de cada ficha de UC. Os links de FUC da página para 2025/26 não foram considerados verificação dos conteúdos programáticos de 2026/27. As descrições dos assuntos foram redigidas independentemente pela FACODI.

## 3. Estruturas e conteúdos integrados

| Entidade | Resultado deste lote |
|---|---:|
| Nova ficha de curso `facodi.courses` | 1 |
| Novas UCs `facodi.curricular_units` | **17** |
| Novos objetos educativos curso + UCs | **18** |
| Referências externas novas | **10** |
| Ligações UC→referência externa | **43** |
| Ligações UC→vídeo existente | **30** |
| Competências temáticas **editoriais** | **51** |
| Objetivos de estudo **editoriais** | **51** |
| Percursos internos de UC em `generated_structures` | **17** |
| Mapa interno do curso em `generated_structures` | **1** |
| Objetivos profissionais do curso sintetizados da apresentação oficial | **10** |

Novos objetos utilizam UUIDs determinísticos derivados dos códigos institucionais. Há 17 relações públicas do tipo `contains` curso→UC, com `created_by_mechanism='structured_catalog_import'`.

**Diferenciação de fontes:**
- Códigos, nomes, ECTS, ordem do plano, duração e identidade são oficiais da Universidade do Algarve (2026/27).
- O resumo temático e os três tópicos de estudo por UC são **editoriais da FACODI**; não constituem o programa oficial, a avaliação do docente ou competências formalmente certificadas.
- Os 10 objetivos profissionais gerais do curso foram **parafraseados** da página de apresentação UAlg e etiquetados como `programme_goals_paraphrased_from_official_presentation`.
- Os 17 percursos e o mapa do curso são **rascunhos internos**, obtidos deterministicamente a partir de dados já existentes; `ai_model_executed=false`, `teacher_review_required=true`.
- Os vídeos são referências para os uploads originais no YouTube. Os 30 novos vínculos são reutilizações de vídeos já existentes, **não** novos uploads. A curadoria foi por título/canal, sem revisão integral, verificação de direitos ou garantia de disponibilidade.

## 4. Biblioteca de consulta

Aproveitamento temático de materiais já existentes: PostgreSQL, MIT, Python, OpenStax, OSTEP, Git/GitHub, MDN, W3C, React, pandas, Docker, Marketing e gestão de projetos.

Foram acrescentadas dez fichas de recursos externos, incluindo:
- [LibreOffice — documentação](https://documentation.libreoffice.org/en/english-documentation/)
- [Microsoft Learn — Power BI](https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview)
- [Microsoft Learn — Power Automate](https://learn.microsoft.com/en-us/power-automate/)
- [Microsoft Learn — SharePoint](https://learn.microsoft.com/en-us/sharepoint)
- [OpenLearn — Effective Communication in the Workplace](https://www.open.edu/openlearn/money-business/effective-communication-the-workplace)
- [Google Search — SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google for Developers — Analytics](https://developers.google.com/analytics)
- [PostgreSQL — Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [Cisco Networking Academy — catálogo de redes](https://www.netacad.com/pt/catalogs/learn)
- [UAlg — plano CTeSP 1812](https://www.ualg.pt/curso/1812/plano), usado como orientação de estágio e plano, não como manual do Estágio.

**43 ligações de leitura, distribuídas pelas 17 UCs**. Todas têm referência de origem e `review_scope=external_landing_page`. Não foram importados PDFs, livros, ficheiros de vídeo nem imagens de terceiros para Storage.

## 5. Segurança e testes

As policies RLS existentes foram respeitadas; não foram criados bypasses nem `SECURITY DEFINER` novos.

Consulta executada com papel PostgreSQL `anon`:

| Consulta pública | Resultado |
|---|---:|
| Curso `CTESP-STI` | 1 |
| UCs do CTeSP | 17 |
| Objetivos editoriais disponíveis | 51 |
| Ligações para leituras | 43 |
| Ligações para vídeos existentes | 30 |
| Acesso de leitura de rascunhos em `generated_structures` | **Negado** |
| Pesquisa pública `search_public_catalog_v1` pelo nome do curso | 1 |

Os vídeos não foram descarregados para a base. As tabelas `public.videos` e `auth` não foram modificadas. Não foram criadas inscrições, progressos, avaliações, docentes fictícios, submissões de playlists ou históricos académicos simulados.

### Teste de produção

O frontend já recebe os novos objetos através das consultas genéricas a `facodi.courses`, `facodi.curricular_units` e `facodi.learning_objects`, sem necessidade de uma página codificada manualmente para o CTeSP.

Rotas verificadas:
- https://facodi.vercel.app/courses — curso CTeSP listado ao lado das duas licenciaturas anteriores;
- https://facodi.vercel.app/courses/ctesp-sti — plano por anos e semestres, perfil do curso e vídeos de apoio;
- https://facodi.vercel.app/courses/ctesp-sti/units/18121019 — Bases de Dados I, guia editorial, objetivos, leituras e vídeos;
- https://facodi.vercel.app/courses/ctesp-sti/units/18121015 — Business Intelligence, guia, três objetivos, três leituras e três vídeos.

Uma leitura do frontend pode começar por mostrar `A carregar…` durante a hidratação dos dados. A consulta completa de Business Intelligence foi confirmada.

## 6. Migrações do lote

- `supabase/migrations/20261114174753_facodi_ualg_ctesp_sti_faro_1812_official_curriculum_2026_27.sql`
- `supabase/migrations/20261114175158_facodi_ctesp_sti_1812_sources_reading_links_and_curated_videos.sql`
- `supabase/migrations/20261114175317_facodi_ctesp_sti_1812_internal_editorial_study_routes.sql`
- `supabase/migrations/20261114175547_facodi_ctesp_1812_verified_programme_competencies_profile.sql`

Cada migração foi precedida de execução transacional de validação `BEGIN/ROLLBACK`, aplicada no Supabase e versionada na branch `facodi`.

## 7. Pendências de curadoria

- Verificar a disponibilidade e qualidade integral de cada vídeo, bem como autorização de incorporação, legendas e acessibilidade.
- Obter as fichas de UC oficiais 2026/27 com conteúdo completo, quando publicadas, para rever e diferenciar os temas editoriais atuais.
- Aprovar editorialmente os 17 percursos internos antes de os expor como sequências formais.
- Para o estágio, acrescentar regulamentos/guia específico verificado do curso, sem atribuir regras fictícias a este CTeSP.
- Não existe uma integração Odoo, nem submissões reais de playlists ou alunos inventados.

Esta integração é independente dos cursos de Licenciatura LESTI e LDCOM anteriormente publicados.
