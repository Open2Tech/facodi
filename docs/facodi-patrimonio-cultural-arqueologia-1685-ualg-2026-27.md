# Licenciatura em Património Cultural e Arqueologia, UAlg/FCHS 1685

**Data:** 2026-11-18
**Script de dados:** [`facodi_ualg_1685_patrimonio_cultural_arqueologia_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1685_patrimonio_cultural_arqueologia_20261118/supabase/seeds/facodi_ualg_1685_patrimonio_cultural_arqueologia_20261118.sql), na branch `scripts/facodi_ualg_1685_patrimonio_cultural_arqueologia_20261118` do fork. Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72).
**Manifesto:** `supabase/seeds/facodi_ualg_1685_patrimonio_cultural_arqueologia_20261118.json`
**Depende de:** #67 (já integrado na `facodi`), para a página do curso mostrar os ramos e os grupos de opção.

## Identidade

- **Curso:** Licenciatura em Património Cultural e Arqueologia, Faculdade de Ciências Humanas e Sociais da
  Universidade do Algarve, curso **1685**. Área temática: Artes, Comunicação e Património.
- **Duração:** 180 ECTS, 6 semestres. Ensino em português, presencial, Campus de Gambelas.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1685) e [plano 2026/27](https://www.ualg.pt/curso/1685/plano).
  O ID 1685 é o do `plan_url` da pesquisa e o da página do curso.
- **Fichas das UCs:** os links da própria página do plano (`academico.ualg.pt`, `codInstituic=8`, ano letivo 2026/27).
- **Na FACODI:** código interno `LPCA`, slug `patrimonio-cultural-arqueologia`. Nem o código, nem o slug, nem o ID 1685, nem
  nenhum código de UC `1685…` existem no catálogo público (leitura de 18/11/2026).

## Plano 2026/27 com ramos

- **1.º e 2.º anos comuns (120 ECTS):** 20 UCs obrigatórias (100 ECTS) e quatro grupos de opção de 5 ECTS no 2.º ano
  (OPÇÃO 1 e 2 no 1.º semestre, OPÇÃO 3 e 4 no 2.º).
- **3.º ano:** o curso divide-se em dois ramos.
  - **Arqueologia:** técnicas de análise laboratorial (cerâmicas, faunas e líticos) e arqueociências.
  - **Património Cultural:** história da arte portuguesa e contemporânea, história da cultura portuguesa e representação
    gráfica do património construído.
  - **Comuns aos dois ramos:** História da Cultura Contemporânea, História do Pensamento Historiográfico e Arqueológico,
    Gestão do Património Cultural e História do Urbanismo.
- **ECTS por ramo:** 140 ECTS obrigatórios (os dois anos comuns incluídos) mais oito grupos de opção de 5 ECTS
  (OPÇÃO 1 a 4 no tronco comum e OPÇÃO 5 a 8 no ramo). Total: 180. Cada semestre fecha 30 ECTS em cada ramo.

Modelo: **43 UCs distintas, cada uma com um único registo**, e **65 colocações** em `curriculum_placements`
(ramo, ano, semestre, papel e grupo), como já se faz na Psicologia, no Mestrado em Neurociências e no #68. Por exemplo,
Arqueologia Marítima e Costeira é opção no 2.º ano (OPÇÃO 1 e 2) e outra vez no 3.º ano do ramo de Arqueologia
(OPÇÃO 5 e 6). Com o #67, a página do curso mostra um seletor de ramo, e o tronco comum aparece nos dois.

**Decisões assinaladas nos metadados:**
- **Seminários de Investigação (10 ECTS, anuais).** O plano lista o Seminário de Investigação (área ARQ) no grupo
  OPÇÃO 6 do ramo de Arqueologia, e os das áreas H e HA no grupo OPÇÃO 6 do ramo de Património Cultural, num bloco
  "Anual", ao lado das opções semestrais de 5 ECTS desse mesmo grupo. O plano não diz que ECTS os 10 do seminário
  substituem. Entram como estão no plano: alternativa do grupo OPÇÃO 6, com `semester` nulo (anual), `is_annual: true` e a
  nota em `official_plan_note`. A soma de 180 ECTS conta cada grupo de opção uma vez, a 5 ECTS.
- **Grupos repetidos.** Os pares OPÇÃO 1/2, 3/4, 5/6 e 7/8 têm a mesma lista de UCs. Ficam como no plano: são dois
  grupos, e o estudante escolhe uma UC diferente em cada um.
- **Áreas ARQ, H e HA** dos seminários: entram com o nome do plano. As siglas não são expandidas.
- **Nenhuma UC aparece nos dois semestres** ("Semestral") neste plano.

**Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27**. O URL de cada ficha fica em
`metadata.official_fuc_url`, exceto nos três seminários, que não têm ficha publicada na página do plano.

## Unidades curriculares

TC = tronco comum; ARQ = ramo de Arqueologia; PC = ramo de Património Cultural. A coluna "Playlists" conta as ligações
publicadas pelo script.

| Ano | Sem. | Código | UC | ECTS | Colocação no plano | Playlists |
|---|---|---|---|---:|---|---:|
| 1 | 1 | 16851000 | Introdução à Arqueologia | 5 | TC, obrigatória | 1 |
| 1 | 1 | 16851005 | Introdução à História Cultural | 5 | TC, obrigatória | 0 |
| 1 | 1 | 16851001 | Introdução à História da Arte | 5 | TC, obrigatória | 2 |
| 1 | 1 | 16851003 | Introdução ao Património Cultural | 5 | TC, obrigatória | 2 |
| 1 | 1 | 16851124 | Metodologia de Trabalho Científico | 5 | TC, obrigatória | 1 |
| 1 | 1 | 16851006 | Pré-História | 5 | TC, obrigatória | 2 |
| 1 | 2 | 16851009 | Arqueologia Romana | 5 | TC, obrigatória | 2 |
| 1 | 2 | 16851008 | História da Arte da Antiguidade | 5 | TC, obrigatória | 2 |
| 1 | 2 | 16851007 | História da Cultura Clássica | 5 | TC, obrigatória | 1 |
| 1 | 2 | 16851122 | Itinerários do Património | 5 | TC, obrigatória | 0 |
| 1 | 2 | 16851123 | Materiais e Técnicas de Construção Tradicional | 5 | TC, obrigatória | 0 |
| 1 | 2 | 16851060 | Proto-História | 5 | TC, obrigatória | 1 |
| 2 | 1 | 16851013 | História da Arte Medieval | 5 | TC, obrigatória | 2 |
| 2 | 1 | 16851012 | História da Cultura Medieval | 5 | TC, obrigatória | 0 |
| 2 | 1 | 16851160 | Metodologias de Intervenção em Património Construído | 5 | TC, obrigatória | 1 |
| 2 | 1 | 16851027 | Museologia | 5 | TC, obrigatória | 2 |
| 2 | 1 | 16851157 | Arqueologia Marítima e Costeira | 5 | TC OPÇÃO 1 e 2; ARQ 3.º ano OPÇÃO 5 e 6 | 0 |
| 2 | 1 | 16851155 | Estudos de Megalitismo | 5 | TC OPÇÃO 1 e 2; ARQ 3.º ano OPÇÃO 5 e 6 | 0 |
| 2 | 1 | 16851156 | Mitologia Greco-Romana | 5 | TC OPÇÃO 1 e 2; PC 3.º ano OPÇÃO 5 e 6 | 0 |
| 2 | 2 | 16851011 | Arqueologia Medieval | 5 | TC, obrigatória | 2 |
| 2 | 2 | 16851097 | Arqueologia Urbana | 5 | TC, obrigatória | 1 |
| 2 | 2 | 16851015 | História da Arte Moderna | 5 | TC, obrigatória | 1 |
| 2 | 2 | 16851014 | História da Cultura Moderna | 5 | TC, obrigatória | 2 |
| 2 | 2 | 16851143 | Arqueologia da Alimentação | 5 | TC OPÇÃO 3 e 4; ARQ 3.º ano OPÇÃO 7 e 8 | 0 |
| 2 | 2 | 16851053 | Estética e Teorias da Arte | 5 | TC OPÇÃO 3 e 4; PC 3.º ano OPÇÃO 7 e 8 | 0 |
| 3 | 1 | 16851016 | História da Cultura Contemporânea | 5 | ARQ e PC, obrigatória | 1 |
| 3 | 1 | 16851159 | História do Pensamento Historiográfico e Arqueológico | 5 | ARQ e PC, obrigatória | 1 |
| 3 | 1 | 16851032 | Técnicas de Análise Laboratorial: Cerâmicas | 5 | ARQ, obrigatória | 0 |
| 3 | 1 | 16851030 | Técnicas de Análise Laboratorial: Faunas | 5 | ARQ, obrigatória | 0 |
| 3 | 1 | 16851121 | História da Arte Portuguesa | 5 | PC, obrigatória | 0 |
| 3 | 1 | 16851024 | Representação Gráfica do Património Construído | 5 | PC, obrigatória | 0 |
| 3 | 1 | 16851070 | Introdução ao Estudo das Imagens Medievais | 5 | PC OPÇÃO 5 e 6 | 0 |
| 3 | 2 | 16851114 | Arqueociências | 5 | ARQ, obrigatória | 1 |
| 3 | 2 | 16851029 | Gestão do Património Cultural | 5 | ARQ e PC, obrigatória | 0 |
| 3 | 2 | 16851018 | História do Urbanismo | 5 | ARQ e PC, obrigatória | 0 |
| 3 | 2 | 16851031 | Técnicas de Análise Laboratorial: Líticos | 5 | ARQ, obrigatória | 0 |
| 3 | 2 | 16851144 | Sustentabilidade e Colapso de Sociedades do Passado | 5 | ARQ OPÇÃO 7 e 8 | 0 |
| 3 | 2 | 16851025 | História da Arte Contemporânea | 5 | PC, obrigatória | 0 |
| 3 | 2 | 16851125 | História da Cultura Portuguesa | 5 | PC, obrigatória | 0 |
| 3 | 2 | 16851158 | O Género na Arte e na Cultura Visual do Ocidente | 5 | PC OPÇÃO 7 e 8 | 0 |
| 3 | Anual | 16851134 | Seminário de Investigação (área ARQ) | 10 | ARQ OPÇÃO 6 (anual) | 0 |
| 3 | Anual | 16851148 | Seminário de Investigação (área H) | 10 | PC OPÇÃO 6 (anual) | 0 |
| 3 | Anual | 16851154 | Seminário de Investigação (área HA) | 10 | PC OPÇÃO 6 (anual) | 0 |

## Playlists

- **Pesquisa:** 35 playlists e 35 ligações para 25 das 32 UCs obrigatórias (tronco comum e obrigatórias dos dois ramos).
  As opções e os seminários ficaram fora da pesquisa.
  - Idioma: 15 em PT-PT, 15 em PT-BR e 5 em inglês.
  - Confiança: 7 alta, 21 média e 7 baixa.
- **No script:** só entram as ligações de confiança alta ou média. São **28 playlists e 28 ligações para 19 UCs**:
  - 11 em PT-PT, 12 em PT-BR e 5 em inglês;
  - 7 de confiança alta e 21 média.
- **Fontes:** é a área com mais fontes portuguesas de autor (ERA Arqueologia, Património Cultural, I.P., ICOM Portugal,
  Museu Nacional de Arqueologia, Gabinete de Estudos Olisiponenses, Citaliarestauro), com a história da arte em
  Smarthistory, CrashCourse e Univesp.
- **Critérios:**
  - a correspondência segue o programa da ficha oficial;
  - só canais do autor original, com pelo menos 4 vídeos;
  - todas as 35 confirmadas no YouTube a 18/11/2026 (oEmbed e página da playlist), incluindo as de confiança baixa.
- **Reutilização:** uma playlist já registada com o mesmo ID do YouTube é reaproveitada.

## Pontos a rever

- **Fora do script (confiança baixa), ficam no manifesto com `published: false`:**
  - Itinerários do Património: reportagens RTP do Património Cultural, I.P. (visitas a sítios, não metodologia de itinerários);
  - História da Cultura Medieval: "Cultura", da História Medieval UFSC (formato de divulgação);
  - Gestão do Património Cultural: encontro "Arqueologia em Portugal: recuperar o passado em 2015" (canal Património Cultural), só sobre gestão do património arqueológico;
  - Técnicas de Análise Laboratorial: Faunas: COMUNIARQ Science Videos 2023 (UNIARQ), em que só 5 vídeos são de zooarqueologia;
  - Arqueociências: "Antropologia Biológica" da ERA Arqueologia, como 2.ª playlist;
  - História da Arte Portuguesa: "A História da Arte entre Brasil e Portugal" (Univesp);
  - História da Arte Contemporânea: playlist panorâmica de história da arte, só com a parte final a corresponder à UC.
  
  Seis destas UCs ficam sem playlist publicada.
- **Só uma playlist:** Introdução à Arqueologia, Metodologia de Trabalho Científico, História da Cultura Clássica,
  Proto-História, Metodologias de Intervenção em Património Construído, Arqueologia Urbana, História da Arte Moderna,
  História da Cultura Contemporânea, História do Pensamento Historiográfico e Arqueológico e Arqueociências.
- **Sem playlist na pesquisa (7 obrigatórias):** Introdução à História Cultural, Materiais e Técnicas de Construção
  Tradicional, Técnicas de Análise Laboratorial: Cerâmicas e Líticos, Representação Gráfica do Património Construído,
  História do Urbanismo e História da Cultura Portuguesa. A pesquisa não encontrou curso aberto de autor que corresponda
  ao programa. Ficam sem playlist.
- **Sem playlist, fora da pesquisa:** as 8 opções e os 3 seminários de investigação.
- **Ao todo, 13 das 32 obrigatórias ficam sem playlist publicada.** As técnicas laboratoriais e a história da cultura
  portuguesa não têm aulas abertas de nível superior.

## Verificação

**Dry-run em PostgreSQL 17**, com as tabelas `facodi` reduzidas às colunas usadas, aplicado numa só transação:

| Caso | Resultado |
|---|---|
| Primeira execução, base vazia | 1 curso (180 ECTS, 2 ramos), 43 UCs (3 anuais), 28 playlists e 71 relações (43 curso → UC e 28 UC → playlist) |
| Com outro curso cuja UC já tem o slug `16851000` e uma das playlists já registada | A UC deste curso fica `patrimonio-arqueologia-uc-16851000`; a playlist existente é reaproveitada, sem duplicar |
| Segunda execução | Não altera nada (idempotente: mesmas contagens e mesmo hash das UCs) |
| Outro curso já com `LPCA` | Aborta antes de inserir |

**Pré-verificações:**
- as contagens de UCs, colocações, playlists e ligações;
- os 140 ECTS obrigatórios e os 8 grupos de opção por ramo;
- só ligações de confiança alta ou média;
- os dados das playlists;
- conflitos de curso (código, slug ou ID 1685).

**Pós-verificação:** confirma o curso, as 43 UCs com colocação e as 28 ligações. Se uma restrição da base que não está
no repositório rejeitar alguma linha, a pós-verificação aborta a importação inteira.

**Vista do plano:** foi simulada com o `buildUalgSections` do #67 e os dados deste manifesto. Em cada ramo, todos os
semestres fecham 30 ECTS: 30 obrigatórios no 1.º ano; 20 obrigatórios mais dois grupos de opção nos 2.º e 3.º anos. O
seminário aparece no fim do 3.º ano, como bloco anual do grupo OPÇÃO 6 (1 seminário no ramo de Arqueologia, 2 no de
Património Cultural).

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72): [facodi_ualg_1685_patrimonio_cultural_arqueologia_20261118.sql](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1685_patrimonio_cultural_arqueologia_20261118/supabase/seeds/facodi_ualg_1685_patrimonio_cultural_arqueologia_20261118.sql).

Este PR não leva nenhum ficheiro `.sql`: só este documento e o manifesto. O script testado está na branch
`scripts/facodi_ualg_1685_patrimonio_cultural_arqueologia_20261118` do fork.

O script não foi aplicado em produção. Corre numa só transação (as tabelas temporárias são `ON COMMIT DROP`). Depois
de aplicado, o build gera as páginas do curso e das UCs, que entram no sitemap e no `llms.txt`.
