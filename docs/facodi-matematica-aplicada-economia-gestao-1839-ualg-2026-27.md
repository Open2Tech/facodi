# Licenciatura em Matemática Aplicada à Economia e à Gestão, UAlg/FCT 1839

**Data:** 2026-11-18
**Script de dados:** [`facodi_ualg_1839_matematica_aplicada_economia_gestao_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1839_matematica_aplicada_economia_gestao_20261118/supabase/seeds/facodi_ualg_1839_matematica_aplicada_economia_gestao_20261118.sql), na branch `scripts/facodi_ualg_1839_matematica_aplicada_economia_gestao_20261118` do fork. Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72).
**Manifesto:** `supabase/seeds/facodi_ualg_1839_matematica_aplicada_economia_gestao_20261118.json`
**Depende de:** #67 (já integrado na `facodi`), para a página do curso mostrar os grupos de opção.
**Ordem de aplicação:** depois da Licenciatura em Economia (#74), se esta for aplicada. Ver "UCs partilhadas com a Economia".

## Identidade

- **Curso:** Licenciatura em Matemática Aplicada à Economia e à Gestão, Faculdade de Ciências e Tecnologia da
  Universidade do Algarve, em parceria com a Faculdade de Economia, curso **1839**. Área temática: Ciências Exatas e Naturais.
- **Duração:** 180 ECTS, 6 semestres. Ensino em português, presencial.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1839) e [plano 2026/27](https://www.ualg.pt/curso/1839/plano).
  O ID 1839 é o do `plan_url` da pesquisa e o da página do curso.
- **Fichas das UCs:** os links da própria página do plano (`academico.ualg.pt`, ano letivo 2026/27): `codInstituic=9` nas UCs
  da FCT e `codInstituic=4` nas duas UCs da Faculdade de Economia.
- **Na FACODI:** código interno `LMAEG` (a sigla que a própria UAlg usa no contacto do diretor de curso), slug
  `matematica-aplicada-economia-gestao`. Nem o código, nem o slug, nem o ID 1839, nem nenhum dos 31 códigos de UC existem
  no catálogo público (leitura de 18/11/2026).

## Plano 2026/27

- **Sem ramos.** 27 UCs obrigatórias de 6 ECTS (162 ECTS) e três grupos de opção de 6 ECTS no 3.º ano:
  - **I (a.c. Economia)**, no 1.º semestre: Economia e Finanças Públicas ou Economia Monetária e Financeira;
  - **II (a.c. Matemática)**, no 2.º semestre: Equações às Diferenças (a única UC listada);
  - **III (a.c. Gestão)**, no 2.º semestre: uma entrada genérica, "Opção a escolher por requerimento na UALGNET".
- **Total:** 162 + 6 + 6 + 6 = 180 ECTS. Cada semestre fecha 30 ECTS (24 obrigatórios + I no 3.º ano, 1.º semestre;
  18 obrigatórios + II + III no 2.º semestre).

Modelo: **31 UCs, cada uma com um único registo e uma colocação** em `curriculum_placements` (Tronco Comum, ano,
semestre, papel e grupo), como na Psicologia e no #68.

**Decisões assinaladas nos metadados:**
- **Nome dos grupos.** Ficam com o nome da legenda do plano: "I (a.c. Economia)", "II (a.c. Matemática)" e
  "III (a.c. Gestão)". A sigla "a.c." não é expandida. A página mostra, por exemplo, "2.º semestre · II (a.c. Matemática)".
- **Grupo III.** O plano só lista a entrada genérica `140064482`, sem ficha. Entra como UC de opção do grupo, com um resumo
  genérico a partir do título e a nota em `official_plan_note`. Sem ela, o 3.º ano mostraria 24 ECTS no 2.º semestre.
- **UCs partilhadas com a Economia.** As duas UCs do grupo I têm códigos da Licenciatura em Economia (`14401021` e
  `14401022`) e ficha da Faculdade de Economia. Têm registo próprio neste curso, como as UCs da LESTI na Eletrotécnica
  (#68): se o código já for slug de uma UC de outro curso, o slug recebe o prefixo `matematica-aplicada-uc-` (por exemplo,
  `matematica-aplicada-uc-14401021`).
- **Nenhuma UC aparece nos dois semestres** ("Semestral") neste plano.

**Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27**. O URL de cada ficha fica em
`metadata.official_fuc_url`, exceto na entrada genérica do grupo III, que não tem ficha.

## Unidades curriculares

A coluna "Playlists" conta as ligações publicadas pelo script.

| Ano | Sem. | Código | UC | ECTS | Colocação no plano | Playlists |
|---|---|---|---|---:|---|---:|
| 1 | 1 | 18391000 | Cálculo Infinitesimal I | 6 | Obrigatória | 2 |
| 1 | 1 | 18391002 | Economia I | 6 | Obrigatória | 2 |
| 1 | 1 | 18391004 | Introdução à Programação | 6 | Obrigatória | 2 |
| 1 | 1 | 18391001 | Matrizes e Aplicações | 6 | Obrigatória | 2 |
| 1 | 1 | 18391030 | Organização e Gestão de Empresas | 6 | Obrigatória | 2 |
| 1 | 2 | 18391031 | Cálculo e Instrumentos Financeiros | 6 | Obrigatória | 2 |
| 1 | 2 | 18391005 | Cálculo Infinitesimal II | 6 | Obrigatória | 2 |
| 1 | 2 | 18391009 | Contabilidade Geral | 6 | Obrigatória | 1 |
| 1 | 2 | 18391007 | Economia II | 6 | Obrigatória | 2 |
| 1 | 2 | 18391006 | Laboratório de Programação Aplicada | 6 | Obrigatória | 2 |
| 2 | 1 | 18391010 | Cálculo Infinitesimal III | 6 | Obrigatória | 2 |
| 2 | 1 | 18391032 | Contabilidade de Gestão | 6 | Obrigatória | 1 |
| 2 | 1 | 18391013 | Macroeconomia I | 6 | Obrigatória | 2 |
| 2 | 1 | 18391012 | Microeconomia I | 6 | Obrigatória | 2 |
| 2 | 1 | 18391011 | Probabilidades | 6 | Obrigatória | 2 |
| 2 | 2 | 18391015 | Análise Complexa e Equações Diferenciais | 6 | Obrigatória | 2 |
| 2 | 2 | 18391033 | Análise Económica e Financeira | 6 | Obrigatória | 1 |
| 2 | 2 | 18391016 | Análise Estatística I | 6 | Obrigatória | 2 |
| 2 | 2 | 18391018 | Macroeconomia II | 6 | Obrigatória | 2 |
| 2 | 2 | 18391017 | Microeconomia II | 6 | Obrigatória | 2 |
| 3 | 1 | 18391023 | Análise Econométrica I | 6 | Obrigatória | 2 |
| 3 | 1 | 18391020 | Análise Estatística II | 6 | Obrigatória | 2 |
| 3 | 1 | 18391021 | Análise Numérica I | 6 | Obrigatória | 2 |
| 3 | 1 | 18391022 | Investigação Operacional I | 6 | Obrigatória | 2 |
| 3 | 1 | 14401021 | Economia e Finanças Públicas | 6 | I (a.c. Economia) | 0 |
| 3 | 1 | 14401022 | Economia Monetária e Financeira | 6 | I (a.c. Economia) | 0 |
| 3 | 2 | 18391026 | Análise Econométrica II | 6 | Obrigatória | 2 |
| 3 | 2 | 18391024 | Investigação Operacional II | 6 | Obrigatória | 2 |
| 3 | 2 | 18391025 | Processos Estocásticos e Aplicações | 6 | Obrigatória | 2 |
| 3 | 2 | 18391040 | Equações às Diferenças | 6 | II (a.c. Matemática) | 0 |
| 3 | 2 | 140064482 | Opção a Escolher por Requerimento na UALGNET | 6 | III (a.c. Gestão) | 0 |

## Playlists

- **Pesquisa:** 52 playlists e 52 ligações para as **27 UCs obrigatórias**. As opções ficaram fora da pesquisa.
  - Idioma: 41 em PT-BR, 9 em PT-PT e 2 em inglês.
  - Confiança: 38 alta, 13 média e 1 baixa.
- **No script:** só entram as ligações de confiança alta ou média. São **51 playlists e 51 ligações, para todas as
  27 obrigatórias**:
  - 41 em PT-BR, 8 em PT-PT e 2 em inglês (MIT OpenCourseWare);
  - 38 de confiança alta e 13 média.
- **Fontes:** disciplinas universitárias gravadas pelos professores (Univesp, Pedro Munari em programação linear e
  dinâmica, Roberto Guena em microeconomia, Processos Estocásticos da UFPA), MIT OpenCourseWare em programação e
  finanças, e canais portugueses em cálculo financeiro, estatística, probabilidades e contabilidade (As Explicações do
  Pontes, Miguel Coelho, MathTutorCascais, CERTFORM e Fátima Explica Gestão).
- **Critérios:**
  - a correspondência segue o programa da ficha oficial;
  - só canais do autor original, com pelo menos 4 vídeos;
  - todas as 52 confirmadas no YouTube a 18/11/2026 (oEmbed e página da playlist), incluindo a de confiança baixa.
- **Reutilização:** uma playlist já registada com o mesmo ID do YouTube é reaproveitada.
  - 1 já está em produção (Introdução à Teoria Geral da Administração, em Organização e Gestão de Empresas);
  - 28 são as mesmas da Economia (#74) e 5 as mesmas da Eletrotécnica (#68). Se esses cursos forem aplicados antes,
    são reaproveitadas; se não, este script cria-as e eles reaproveitam-nas.

## Pontos a rever

- **Fora do script (confiança baixa), fica no manifesto com `published: false`:**
  - Análise Económica e Financeira: "Finanças Empresariais", de As Explicações do Pontes (PT-PT), como 2.ª playlist.
    Trata de rendibilidade e balanço funcional, não de avaliação de ativos e CAPM. A UC fica com a playlist do MIT
    (inglês), porque não se encontrou um curso em português de avaliação e CAPM com autoria própria.
- **Só uma playlist:**
  - Contabilidade Geral: é a única fonte PT-PT encontrada (CERTFORM), formação profissional em temas soltos. O conteúdo
    brasileiro ficou de fora por não seguir o SNC;
  - Contabilidade de Gestão: vídeos curtos de Fátima Explica Gestão, bons como apoio;
  - Análise Económica e Financeira: só a do MIT, em inglês.
- **Sem playlist:** as 4 UCs de opção (Economia e Finanças Públicas, Economia Monetária e Financeira, Equações às
  Diferenças e a entrada genérica do grupo III). A pesquisa cobriu as obrigatórias.
- **Ordem de aplicação com a Economia (#74).** O script da Economia aborta se um código de UC já pertencer a outro curso.
  Se este curso for aplicado primeiro, a Economia aborta por causa de `14401021` e `14401022`. Aplicado depois, este
  script dá às duas UCs o slug com prefixo e não interfere com a Economia.

## Verificação

**Dry-run em PostgreSQL 17**, com as tabelas `facodi` reduzidas às colunas usadas, aplicado numa só transação:

| Caso | Resultado |
|---|---|
| Primeira execução, com outro curso cuja UC já tem o slug `14401021` e uma das playlists já registada | 1 curso (180 ECTS), 31 UCs, 50 playlists novas mais a existente reaproveitada, e 82 relações (31 curso → UC e 51 UC → playlist); a UC deste curso fica `matematica-aplicada-uc-14401021` |
| Com o script da Economia (#74) aplicado antes | A Economia mantém os slugs `14401021` e `14401022`; neste curso ficam `matematica-aplicada-uc-14401021` e `matematica-aplicada-uc-14401022`; 28 playlists reaproveitadas e 23 novas |
| Segunda execução | Não altera nada (idempotente: mesmas contagens e mesmo hash das UCs) |
| Outro curso já com `LMAEG` | Aborta antes de inserir |
| Este script antes do da Economia | Este aplica-se; o da Economia aborta em "A UC code already belongs to another course" |

**Pré-verificações:**
- as contagens de UCs, colocações, playlists e ligações;
- os 162 ECTS obrigatórios, os 3 grupos de opção e os 6 ECTS de cada UC;
- só ligações de confiança alta ou média;
- os dados das playlists;
- conflitos de curso (código, slug ou ID 1839).

**Pós-verificação:** confirma o curso, as 31 UCs com colocação e as 51 ligações. Se uma restrição da base que não está
no repositório rejeitar alguma linha, a pós-verificação aborta a importação inteira.

**Vista do plano:** foi simulada com o `buildUalgSections` do #67 e os dados deste manifesto. O 1.º e o 2.º ano mostram
30 ECTS obrigatórios por semestre. O 3.º ano mostra 24 ECTS obrigatórios mais o grupo I no 1.º semestre, e 18 ECTS
obrigatórios mais os grupos II e III no 2.º.

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72): [facodi_ualg_1839_matematica_aplicada_economia_gestao_20261118.sql](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1839_matematica_aplicada_economia_gestao_20261118/supabase/seeds/facodi_ualg_1839_matematica_aplicada_economia_gestao_20261118.sql).

Este PR não leva nenhum ficheiro `.sql`: só este documento e o manifesto. O script testado está na branch
`scripts/facodi_ualg_1839_matematica_aplicada_economia_gestao_20261118` do fork.

O script não foi aplicado em produção. Corre numa só transação (as tabelas temporárias são `ON COMMIT DROP`). Se a
Economia (#74) também for aplicada, convém aplicá-la antes. Depois de aplicado, o build gera as páginas do curso e das UCs,
que entram no sitemap e no `llms.txt`.
