# Licenciatura em Engenharia Civil, UAlg/ISE 1449

**Data:** 2026-11-18
**Manifesto:** `supabase/seeds/facodi_ualg_1449_engenharia_civil_20261118.json`
**Script:** [`facodi_ualg_1449_engenharia_civil_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1449_engenharia_civil_20261118/supabase/seeds/facodi_ualg_1449_engenharia_civil_20261118.sql). Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72). Não é uma migração.
**Depende de:** #67 (já integrado em `facodi`), para a página do curso mostrar os grupos de opção.

## Identidade

- **Curso:** Licenciatura em Engenharia Civil, Instituto Superior de Engenharia da Universidade do Algarve, curso **1449**.
- **Língua:** português.
- **Duração:** 180 ECTS, 6 semestres.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1449) e [plano 2026/27](https://www.ualg.pt/curso/1449/plano).
- **Na FACODI:** código interno `LCIV`, slug `engenharia-civil`. Nem o código, nem o slug, nem o ID 1449, nem nenhum
  código de UC existem na base (leitura pública a 18/11/2026).

## Plano 2026/27

São **39 UCs distintas e 40 colocações** em `curriculum_placements`, sem ramos (`Tronco Comum`):
- **32 obrigatórias** de 5 ECTS (160 ECTS);
- **Opção I** (1.º ano, 2.º semestre, 5 ECTS): Inovação Tecnológica e Sustentabilidade Ambiental, Modelação BIM ou Outra;
- **Opção II** (2.º ano, 1.º semestre, 5 ECTS): Aquisição e Modelação 3D, Economia e Gestão ou Outra;
- **Opção III** (3.º ano, 2.º semestre, 10 ECTS): Projeto de Estruturas Regulares ou Projeto de Reabilitação Urbana.

Total: 160 + 5 + 5 + 10 = 180 ECTS, com 30 ECTS em cada semestre.

**Decisões assinaladas nos metadados:**
- **UCs oferecidas nos dois semestres.** Álgebra Linear e Geometria Analítica, Análise Matemática e Análise Matemática
  Aplicada aparecem no plano como "Semestral" e nas listas dos dois semestres do 1.º ano (a ficha diz só "S"). Ficam no
  semestre que fecha 30 ECTS, como na Eletrotécnica: AL e AM no 1.º, AMA (equações diferenciais e várias variáveis, que
  segue a AM) no 2.º, com `offered_in_both_semesters: true`.
- **"Outra (definida anualmente pela UO)", código 14491104.** O plano lista-a, com o mesmo código, na Opção I e na
  Opção II. Entra como uma UC com duas colocações (uma por grupo), com o título do plano e um resumo genérico. Não tem
  ficha publicada, e `detailed_fuc_checked` fica `false`.
- **Nomes dos grupos:** os do plano, com "OPÇÃO" em minúsculas: `Opção I`, `Opção II` e `Opção III`.

**Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27** (academico.ualg.pt, `codInstituic=7`). O
URL da ficha fica em `metadata.official_fuc_url`. As 38 UCs com link no plano têm ficha publicada.

| Ano | Sem. | Código | Unidade curricular | ECTS | Playlists publicadas | Primeira playlist publicada |
|---|---|---|---|---:|---:|---|
| 1.º | 1.º | 14491074 | Álgebra Linear e Geometria Analítica ¹ | 5 | 2 | MA 33 – Introdução à Álgebra Linear — PROFMAT |
| 1.º | 1.º | 14491077 | Análise Matemática ¹ | 5 | 2 | CÁLCULO 1 — Equaciona Com Paulo Pereira |
| 1.º | 1.º | 14491068 | Desenho Técnico e CAD | 5 | 2 | Desenho técnico assistido por computador — UNIVESP |
| 1.º | 1.º | 14491076 | Física Aplicada à Engenharia Civil | 5 | 2 | Mecânica Vetorial: Estática — Filipe Molinar |
| 1.º | 1.º | 14491069 | Geologia de Engenharia Civil | 5 | 2 | Geologia de Engenharia e Mecânica das Rochas e Solos — Profa. Maria Giovana |
| 1.º | 1.º | 14491073 | Química | 5 | 2 | Química Geral - Cursos de Engenharia — Prof. Caio - Química |
| 1.º | 2.º | 14491070 | Análise Matemática Aplicada ¹ | 5 | 2 | CÁLCULO EM VÁRIAS VARIÁVEIS — Matemateca - Ester Velasquez |
| 1.º | 2.º | 14491071 | Estática | 5 | 2 | Isostática — Prof. Rodolfo - Engenharia |
| 1.º | 2.º | 14491072 | Probabilidades e Estatística | 5 | 2 | Probabilidade e Estatística — Professor Douglas Maioli |
| 1.º | 2.º | 14491067 | Programação e Computação Numérica | 5 | 2 | Curso de Python 3 - Mundo 1: Fundamentos — Curso em Vídeo |
| 1.º | 2.º | 14491075 | Topografia e Sistemas de Informação Geográfica | 5 | 2 | Métodos de levantamento topográfico planimétrico e cálculos — Alessandro Carvalho |
| 1.º | 2.º | 14491103 | Inovação Tecnológica e Sustentabilidade Ambiental (Opção I) | 5 | 0 | — |
| 1.º | 2.º | 14491105 | Modelação BIM (Opção I) | 5 | 0 | — |
| 1.º | 2.º | 14491104 | Outra, definida anualmente pela UO (Opção I e Opção II) | 5 | 0 | — |
| 2.º | 1.º | 14491078 | Caracterização Geotécnica | 5 | 2 | Propriedades-índices — Professor Klinger Senra |
| 2.º | 1.º | 14491088 | Hidráulica Geral | 5 | 2 | Mecânica dos Fluidos — A. Gil Andrade-Campos (Universidade de Aveiro, PT-PT) |
| 2.º | 1.º | 14491082 | Materiais de Construção Não Estruturais | 5 | 1 | Materiais de Construção Civil II — Tassiane Oliveira |
| 2.º | 1.º | 14491081 | Resistência dos Materiais I | 5 | 2 | Resistência dos Materiais — Prof. Pablo Altoé Amorim |
| 2.º | 1.º | 14491086 | Urbanismo Sustentável | 5 | 0 | — (2 de confiança baixa) |
| 2.º | 1.º | 14491106 | Aquisição e Modelação 3D (Opção II) | 5 | 0 | — |
| 2.º | 1.º | 14491107 | Economia e Gestão (Opção II) | 5 | 0 | — |
| 2.º | 2.º | 14491087 | Análise de Estruturas | 5 | 2 | Hiperestática — Prof. Rodolfo - Engenharia |
| 2.º | 2.º | 14491084 | Edificações | 5 | 0 | — (2 de confiança baixa) |
| 2.º | 2.º | 14491079 | Hidráulica Aplicada | 5 | 2 | Máquinas de Fluxo — Ricardo V. Salvo |
| 2.º | 2.º | 14491083 | Materiais de Construção Estruturais | 5 | 2 | Tecnologia do Concreto e Argamassa — Professor João Melo |
| 2.º | 2.º | 14491085 | Mecânica dos Solos | 5 | 2 | Adensamento dos solos — Professor Klinger Senra |
| 2.º | 2.º | 14491080 | Resistência dos Materiais II | 5 | 2 | Mecânica dos Sólidos 2 — Prof. Ana Pierri |
| 3.º | 1.º | 14491095 | Análise Computacional de Estruturas Correntes | 5 | 0 | — (2 de confiança baixa) |
| 3.º | 1.º | 14491094 | Betão Estrutural I | 5 | 1 | BetaoArmado — João Vinagre (PT-PT, Eurocódigo 2) |
| 3.º | 1.º | 14491090 | Estaleiros e Segurança | 5 | 1 | Gerenciamento da Obra pelo Caminho Crítico — Prof. Alex Amarante |
| 3.º | 1.º | 14491092 | Estradas e Arruamentos | 5 | 0 | — (2 de confiança baixa) |
| 3.º | 1.º | 14491091 | Fundações e Contenções | 5 | 2 | Fundações — Prof. Ana Pierri |
| 3.º | 1.º | 14491089 | Tecnologia de Edifícios | 5 | 0 | — (2 de confiança baixa) |
| 3.º | 2.º | 14491097 | Betão Estrutural II | 5 | 1 | BetaoArmado — João Vinagre (PT-PT, Eurocódigo 2) |
| 3.º | 2.º | 14491098 | Construção e Processos | 5 | 2 | Processos Construtivos — Bruno Toniolo |
| 3.º | 2.º | 14491093 | Gestão de Obras | 5 | 1 | Gestão de Projetos — UNIVESP |
| 3.º | 2.º | 14491096 | Hidráulica Urbana | 5 | 0 | — (2 de confiança baixa) |
| 3.º | 2.º | 14491100 | Projeto de Estruturas Regulares (Opção III) | 10 | 0 | — |
| 3.º | 2.º | 14491101 | Projeto de Reabilitação Urbana (Opção III) | 10 | 0 | — |

¹ Oferecida nos dois semestres do 1.º ano (`offered_in_both_semesters: true`).

## Playlists

- **Pesquisa:** 61 playlists e 63 ligações para as 32 UCs obrigatórias. Confiança das ligações: 26 alta, 21 média e
  16 baixa. Idioma: 58 em PT-BR, 2 em PT-PT e 1 em inglês.
- **No script:** **45 playlists e 47 ligações para 26 UCs**, só de confiança alta (26) ou média (21). Idioma: 43 em PT-BR
  e 2 em PT-PT (Betão Armado segundo o Eurocódigo 2, de João Vinagre, e Mecânica dos Fluidos da Universidade de Aveiro).
  As 16 ligações de confiança baixa ficam só no manifesto (`published: false`), para revisão, como no #69. As 16
  playlists que só aparecem nessas ligações também ficam fora do script.
- **Duas playlists servem duas UCs:** Resistência dos Materiais (Pablo Altoé Amorim), em RM I e RM II, e BetaoArmado
  (João Vinagre), em Betão Estrutural I e II.
- **Critérios:**
  - a correspondência segue o programa da ficha oficial da UC;
  - só canais do autor original, com pelo menos 4 vídeos;
  - todas confirmadas no YouTube a 18/11/2026, pelo oEmbed (título e canal dono) e pela página da playlist (nº de vídeos).
- **Reutilização:** uma playlist já registada com o mesmo ID do YouTube é reaproveitada, e não duplicada. Nenhuma das 45
  está hoje no catálogo público.

**Para rever:**
- **Fora do script (confiança baixa), por dependerem de normas e legislação portuguesas e europeias** que o material
  brasileiro não cobre:
  - **Urbanismo Sustentável** (2): metade do programa é a Lei de Bases dos solos, do ordenamento do território e do
    urbanismo e as condicionantes legais portuguesas.
  - **Edificações** (2): enquadramento regulamentar, exigências funcionais e regras de medição portuguesas.
  - **Análise Computacional de Estruturas Correntes** (2): EN 1990, NP EN 1991 e NP EN 1998-1. Só a dinâmica estrutural
    (NPTEL, em inglês) e a sismologia de base correspondem.
  - **Estradas e Arruamentos** (2): Norma de Traçado portuguesa e acessibilidade (DL 163/2006).
  - **Tecnologia de Edifícios** (2): DL 23/95, RRAE e regime térmico.
  - **Hidráulica Urbana** (2): DL 23/95 (sistemas públicos e prediais).
  - **Betão Estrutural I e II**, a 2.ª playlist de cada (NBR 6118): fica a playlist portuguesa do EC2.
  - **Estaleiros e Segurança**, a 2.ª playlist (NR-18 em vez da Diretiva Estaleiros e do DL 273/2003).
  - **Gestão de Obras**, a 1.ª playlist (orçamentação brasileira; contratos e Código dos Contratos Públicos sem equivalente).
- **Sem playlist publicada:** as 6 obrigatórias acima, as 5 opções, a "Outra" e os 2 projetos da Opção III (a pesquisa
  cobriu só as obrigatórias).
- **Só uma playlist publicada:** Materiais de Construção Não Estruturais (metais não ferrosos, madeira e betuminosos
  ficam por cobrir), Betão Estrutural I e II, Estaleiros e Segurança e Gestão de Obras.
- **Cobertura parcial assinalada na pesquisa:** a playlist de Mecânica dos Fluidos de Aveiro (Hidráulica Geral) é do
  docente, mas inclui uns 15 vídeos de terceiros como complemento; a Geologia de Portugal, a rede geodésica nacional
  (PT-TM06) e a otimização numérica não têm equivalente nos vídeos.

## Verificação do script

**Dry-run em PostgreSQL 17**, com as tabelas `facodi` reduzidas às colunas usadas:

| Caso | Resultado |
|---|---|
| Primeira execução | 1 curso (180 ECTS), 39 UCs com 40 colocações, 45 playlists, 39 relações curso → UC e 47 relações UC → playlist |
| Segunda execução | Não altera nada (idempotente) |
| Outro curso já com `LCIV` | Aborta antes de inserir |
| Código de UC já usado noutro curso | Aborta antes de inserir |
| Playlist já registada com o mesmo ID do YouTube | É reaproveitada (sem duplicado) |

**Pré-verificações:**
- as contagens de UCs, colocações, playlists e ligações;
- os 160 ECTS obrigatórios e os grupos Opção I (3 × 5 ECTS), Opção II (3 × 5) e Opção III (2 × 10);
- que nenhuma ligação de confiança baixa entra no script;
- os IDs e URLs das playlists;
- conflitos de curso (código, slug ou ID 1449) e de códigos de UC.

**Pós-verificação:** confirma o curso publicado, as 39 UCs com colocação e as 47 ligações. Se uma restrição da base que
não está no repositório rejeitar alguma linha, aborta a importação inteira.

**Vista do plano:** simulada com o `buildUalgSections` do #67 e os dados do manifesto. Cada semestre soma 30 ECTS:
obrigatórias de 30, 25, 25, 30, 30 e 20 ECTS, mais a Opção I no 1.º ano (2.º semestre), a Opção II no 2.º ano
(1.º semestre) e a Opção III no 3.º ano (2.º semestre), cada uma com a lista do plano.

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72):
[`scripts/facodi_ualg_1449_engenharia_civil_20261118`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1449_engenharia_civil_20261118/supabase/seeds/facodi_ualg_1449_engenharia_civil_20261118.sql).
Não é uma migração e não foi aplicado em produção. Depois de aplicado, o build seguinte gera as páginas estáticas do
curso e das UCs e acrescenta-as ao sitemap e ao `llms.txt`.
