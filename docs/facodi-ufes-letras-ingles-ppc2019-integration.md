# FACODI — Licenciatura em Língua Inglesa e Literaturas de Língua Inglesa (UFES)

**Data de integração:** 14 de novembro de 2026  
**Projeto:** `wvkjainfwsyiyfcmbtid`  
**Schema:** `facodi`  
**Código de curso FACODI:** `UFES-LETRAS-ING-83-2019`  
**Curso UFES:** código `83`; versão PPC `2019` — documento oficial identifica a situação como *Corrente*  
**URL pública:** https://facodi.vercel.app/courses/ufes-letras-ingles

## 1. Fontes institucionais

- **[UFES — Projeto Pedagógico de Curso (PPC 2019)](https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf)** — identificação, perfil, organização curricular, códigos das disciplinas, cargas horárias, créditos brasileiros, pré-requisitos, ementas, bibliografia e normas.
- [Estrutura do curso](https://letras.ufes.br/pt-br/estrutura-do-curso-de-letras-ingles) e [Matriz curricular](https://letras.ufes.br/pt-br/matriz-curricular-3).
- [Apresentação da licenciatura](https://letras.ufes.br/pt-br/apresentacao-0).
- [Estágio supervisionado](https://letras.ufes.br/pt-br/estagio-obrigatorio).
- [TCC](https://letras.ufes.br/pt-br/tcc-trabalho-de-conclusao-de-curso) e [Atividades complementares](https://letras.ufes.br/pt-br/atividades-complementares).

A integração usa o PPC 2019 e **não afirma que o currículo de 2019 tenha sido revisto em 2026**. O PPC está identificado como corrente na fonte consultada. Existem divergências de carga horária entre páginas oficiais: a matriz detalhada do PPC 2019 exige **3.210 horas**; outra página da Pró-Reitoria indica **3.240 horas**. Mantivemos como fonte principal a matriz detalhada, registando a diferença em `courses.metadata.hours_conflict_with_prograd_page`. Isto merece confirmação institucional antes de uso para equivalências ou emissão de documentos.

## 2. Matriz curricular oficial e opções

| Tipo | Ofertas catalogadas | Carga de integralização |
| --- | ---: | ---: |
| Disciplinas obrigatórias (incluindo práxis) | 28 | 1.890 h |
| Estágio supervisionado obrigatório I e II | 2 | 400 h |
| Optativas Letras-Inglês, Linguística | 24 | Escolher 5 (375 h) |
| Optativas Letras-Inglês, Literatura | 11 | Escolher 3 (225 h) |
| Optativas Letras, Linguística | 5 | Escolher 1 (60 h) |
| Optativas Letras, Literatura | 5 | Escolher 1 (60 h) |
| Atividades acadêmico-científico-culturais | Componente integrador (sem código de disciplina na matriz) | 200 h |
| **Integralização** | **75 componentes com código disponíveis (incluindo alternativas)** | **3.210 h** |

As **45 disciplinas optativas** são ofertas alternativas, das quais se escolhem **10** para integralizar **720 horas**. Não foram somadas todas as alternativas no total do curso. A prática curricular de **405 horas** está distribuída nas disciplinas obrigatórias e não constitui horas adicionadas à soma. A matriz prevê 8 períodos mínimos e prazo máximo de 12 períodos. As 660 horas pedagógicas integram os componentes e não são contabilizadas novamente.

**AACC:** registrada em metadados e associada a orientação institucional, **sem criar uma UC artificial com código inventado**.

**Pré-requisitos oficiais:**
- Estágio Supervisionado I (`LCE13933`) — requer `LCE13705` (Didática).
- Estágio Supervisionado II (`LCE13934`) — requer `LCE13933`.

**Créditos:** o campo `curricular_units.ects` é **NULL**. Os créditos brasileiros oficiais estão em `metadata.brazilian_course_credits`. Não houve conversão automática para ECTS ou atribuição de grau pela FACODI.

## 3. Implementação e modelagem

Todas as alterações estão em **`facodi`**, com IDs determinísticos e upserts que evitam múltiplas importações da mesma UC. Nenhuma tabela foi criada fora deste schema; não há integração com Odoo.

- `facodi.courses`: curso publicado com campus, instituição, regime, duração, resumo, conflitos de fontes e grupos de optativas.
- `facodi.curricular_units`: **75 linhas** publicadas, cada uma com código oficial, título oficial, horas, créditos brasileiros, grupo de optativas/obrigatórias, período quando aplicável e link do PPC.
- `facodi.learning_objects`: ficha do curso, 75 fichas de UC e 36 referências de leitura. Os materiais externos são **ligações**, sem cópia de livros, textos ou vídeos.
- `facodi.learning_object_relations`: **75 relações curso→UC**, duas relações `prerequisite_of` dos estágios, 152 relações UC→leitura e uma relação curso→orientação oficial sobre atividades complementares.
- `facodi.external_sources`: origem oficial do curso, origem oficial das 75 UCs e proveniência das referências externas.
- `facodi.competencies` e `facodi.learning_outcomes`: **225+225** propostas editoriais FACODI geradas deterministicamente dos três tópicos de apoio de cada UC.
- `facodi.keywords`, `facodi.tags` e `facodi.learning_object_tags`: indexação temática e relações com as UCs de origem.
- `facodi.generated_structures`: **75 roteiros de estudo** e **um mapa curricular**, todos `draft`, sem execução de IA e sem homologação docente.

As 45 optativas têm `year=NULL` e `semester=NULL` na tabela, pois são *ofertas de escolha*, não disciplinas programadas para cursar cumulativamente. Os lugares previstos para grupos de optativas por período estão em `courses.metadata.scheduled_elective_slots`.

## 4. Recursos externos e a distinção oficial/editorial

Foram verificadas e adicionadas **36 referências externas**, com **152 associações temáticas**, cobrindo **75/75** componentes do PPC.

Os recursos incluem materiais de ensino e estudo de inglês (British Council), linguística (MIT/Open University), escrita (Purdue OWL/OpenStax), textos literários (Project Gutenberg/Folger Shakespeare Library), estudos literários (British Library), educação, diversidade e antirracismo (Stanford Encyclopedia/UNESCO/INES), literatura regional (núcleo NEPLES da UFES) e páginas oficiais de estágios e TCC.

As fontes externas estão marcadas como:
- Material complementar selecionado pela FACODI, **não** bibliografia oficial obrigatória.
- Página de origem verificada, **sem inspeção integral dos textos ou vídeos**.
- `content_license_verified=false` ou campo equivalente; não se presume autorização de reprodução.
- `review_scope='external_landing_page'` nas relações, publicadas apenas quando pai e filho estão ativos.

A biblioteca histórica `public.videos` do Tube não apresentou vídeos com correspondência temática suficiente para importação segura automática; **não foram inventados identificadores YouTube nem importados ficheiros audiovisuais**.

## 5. Validação de segurança e publicação

Após a importação foram verificadas via SQL:
- **1 curso** e **75 UCs** publicadas; a contagem por grupo bate com o PPC e as 28 obrigatórias somam 1.890 horas.
- **225 objetivos** e **225 competências** propostos como editoriais, não institucionais.
- **36 referências** e **152 associações** UC→leitura.
- **75 roteiros de UC** e **1 mapa curricular** internos, sem publicação automática.

Simulando `SET LOCAL ROLE anon`, os 75 componentes, os objetivos editoriais e as 36 referências permanecem acessíveis. Classificações editoriais privadas não são visíveis. O website carregou o curso na rota `/courses/ufes-letras-ingles`; a página de TCC em `/courses/ufes-letras-ingles/units/ufes-ingles-let13932` apresentou objetivos e referências.

A aplicação usa o **slug** `ufes-ingles-let13932` em links para a UC, não apenas o código `LET13932`.

## 6. Migrações aplicadas e versionadas

- `20261114214728_facodi_publish_ufes_letras_ingles_ppc2019_75_official_components.sql`
- `20261114214925_facodi_ufes_letras_ingles_75_editorial_learning_routes_and_skills.sql`
- `20261114215240_facodi_ufes_letras_ingles_20_sources_and_thematic_readings.sql`
- `20261114215620_facodi_ufes_letras_ingles_literature_pedagogy_15_more_references.sql`
- `20261114215730_facodi_ufes_english_complete_all_75_subject_reference_coverage.sql`

Cada uma passou por simulação transacional antes de ser aplicada e foi incluída na branch `facodi`.

## 7. Limitações e próximas revisões

- Os objetivos de estudo não foram assinados por docentes nem equivalem a ementas oficiais. O PPC contém ementas e bibliografias completas, consultáveis no documento original; não foram reproduzidas integralmente por razões de proveniência e direitos.
- A listagem de optativas contém as 45 ofertas, não a escolha de cada aluno. A navegação distingue as ofertas opcionais da sequência obrigatória.
- A disponibilidade de cada fonte externa pode mudar; consultar o portal original antes de adotar o material.
- Nenhum estudante, inscrição, nota, presença, resultado de IA, playlist submetida ou certificado foi criado de forma fictícia.
- A FACODI não representa uma plataforma institucional oficialmente operada ou acreditada pela Universidade Federal do Espírito Santo.

Recomendação editorial: revisão das ementas por docente/responsável; confirmar com a UFES a divergência de 3.210 vs 3.240 h e a aplicação do PPC a estudantes ingressantes em 2026; posteriormente, organizar atividades e questões de estudo abertas para as disciplinas com maior procura.
