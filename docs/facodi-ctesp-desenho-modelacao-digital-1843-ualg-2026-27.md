# CTeSP em Desenho e Modelação Digital, UAlg/ISE 1843 (Faro)

**Data:** 2026-11-18
**Manifesto:** `supabase/seeds/facodi_ualg_1843_ctesp_desenho_modelacao_digital_20261118.json`
**Script SQL:** [`facodi_ualg_1843_ctesp_desenho_modelacao_digital_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1843_ctesp_desenho_modelacao_digital_20261118/supabase/seeds/facodi_ualg_1843_ctesp_desenho_modelacao_digital_20261118.sql). Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72).

## Identidade

- **Curso:** Curso Técnico Superior Profissional (CTeSP) em Desenho e Modelação Digital, Instituto Superior de
  Engenharia da Universidade do Algarve, curso **1843**.
- **Local:** Faro, Campus da Penha.
- **Duração:** 120 ECTS, 4 semestres, com estágio de 30 ECTS no último.
- **Perfil:** desenhadores de CAD e modeladores BIM para projetos de arquitetura e especialidades de engenharia, na
  construção civil e obras públicas, com técnicas de apresentação, simulação e animação de projeto.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1843) e [plano 2026/27](https://www.ualg.pt/curso/1843/plano).
- **Na FACODI:** código interno `CTESP-DMD`, slug `ctesp-desenho-modelacao-digital`, tipo de grau `CTeSP`, como o
  `CTESP-STI`. É uma área nova no site: nenhum outro curso trata CAD, BIM ou geomática.

## Plano 2026/27

**19 UCs, todas obrigatórias, 120 ECTS.** Nos três primeiros semestres há cinco UCs de 4 ECTS e um projeto de 10 ECTS
por semestre (Projeto I, II e III). O 4.º semestre é o Estágio de 30 ECTS. Cada semestre soma 30 ECTS. Não há grupos
de opção nem ramos.

- **Semestres.** Seguem o `CTESP-STI` na base:
  - `year` é o ano (1 ou 2);
  - `semester` é o semestre do curso (1 a 4);
  - `metadata.local_semester` é o semestre dentro do ano (1 ou 2), como aparece no plano.
- **`curriculum_placements`** em todas as UCs: `mandatory`, `Tronco Comum`, com o mesmo ano e semestre da UC.
- **Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27** (academico.ualg.pt). As 19 fichas
  estão publicadas, incluindo as dos projetos e do Estágio, e o URL de cada uma fica em `metadata.official_fuc_url`.
- **Títulos.** O plano vem em maiúsculas. Duas correções, registadas em `course.title_corrections` no manifesto:
  - "MATEMATICA" ficou **Matemática**;
  - "…MECHANICAL, ELETRICAL, AND PLUMBING" ficou **…Mechanical, Electrical, and Plumbing**. O plano e a ficha
    escrevem "Eletrical".

| Ano | Sem. | Código | Unidade curricular | ECTS | Playlists | Primeira playlist |
|---|---|---|---|---:|---:|---|
| 1.º | 1.º | 18431004 | Desenho Assistido por Computador | 4 | 2 | Curso AutoCAD 2D completo — Rodrigo Lorenzi |
| 1.º | 1.º | 18431002 | Desenho Técnico | 4 | 2 | Desenho Técnico Básico — Nádia de Oliveira Camacho |
| 1.º | 1.º | 18431005 | Edifícios | 4 | 2 | Processos Construtivos — Bruno Toniolo |
| 1.º | 1.º | 18431001 | Matemática | 4 | 2 | Funções Reais de Variável Real — Khan Academy em Português de Portugal |
| 1.º | 1.º | 18431000 | Projeto I | 10 | 0 | — |
| 1.º | 1.º | 18431003 | Topografia e Cartografia | 4 | 2 | Métodos de levantamento topográfico planimétrico e cálculos — Alessandro Carvalho |
| 1.º | 2.º | 18431010 | Building Information Modeling na Arquitetura | 4 | 2 | Curso de Revit, Revit Mais + — Jônathas Aquino Melo |
| 1.º | 2.º | 18431008 | Digitalização e Modelação 3D | 4 | 2 | Fotogrametria — Professor Téo |
| 1.º | 2.º | 18431011 | Infraestruturas Urbanas | 4 | 2 | Projeto Geométrico de Estradas — Alvaro Vieira |
| 1.º | 2.º | 18431007 | Programação | 4 | 2 | Curso de Python 3 - Mundo 1: Fundamentos — Curso em Vídeo |
| 1.º | 2.º | 18431006 | Projeto II | 10 | 0 | — |
| 1.º | 2.º | 18431009 | Técnicas e Métodos de Inventariação | 4 | 0 | — |
| 2.º | 3.º | 18431016 | Animação Digital | 4 | 2 | Como modelar e animar personagem no Blender 3D — Wellington Coloni |
| 2.º | 3.º | 18431014 | Building Information Modeling nas Estruturas e Mechanical, Electrical, and Plumbing | 4 | 2 | Modelagem de estrutura de concreto armado em BIM com o Revit 2025 — Joel Donizete |
| 2.º | 3.º | 18431017 | Computação Visual | 4 | 2 | INE410121 - Visão Computacional — Aldo von Wangenheim |
| 2.º | 3.º | 18431013 | Medições e Valoração Digital | 4 | 2 | Medições e Orçamentos - Eng. Emerson Lourenço — Aprender & Aplicar |
| 2.º | 3.º | 18431012 | Projeto III | 10 | 0 | — |
| 2.º | 3.º | 18431015 | Sistemas de Informação Geográfica | 4 | 2 | Geoprocessamento — Prof. Ana Pierri |
| 2.º | 4.º | 18431018 | Estágio | 30 | 0 | — |

A coluna "Playlists" conta só as ligações publicadas (confiança alta ou média).

## Playlists

- **Volume:** 28 playlists publicadas em 28 ligações, para **14 das 15 UCs de 4 ECTS**. Os 3 projetos e o Estágio
  ficaram fora da pesquisa.
- **Idioma:** 26 em PT-BR, 1 em PT-PT (Khan Academy em Português de Portugal) e 1 em português lusófono, com idioma
  `pt` (Medições e Orçamentos, de Aprender & Aplicar, que usa a terminologia portuguesa de medições). O valor `pt` já
  é usado noutras playlists da base e a pré-verificação do script aceita-o.
- **Confiança:** 11 alta e 17 média publicadas; 1 baixa, que fica fora do SQL.
- **Nível:** 12 playlists de nível superior (entre elas aulas da UFSC, da UFC e da UERJ) e 13 técnico-profissionais
  de software (AutoCAD, Revit, Blender, QGIS). Matemática aceita nível secundário, porque a UC é de nivelamento.
- **Critérios:**
  - a correspondência segue o programa da ficha oficial da UC;
  - só canais do autor original, com pelo menos 4 vídeos;
  - todas confirmadas no YouTube a 18/11/2026, pelo oEmbed (título e canal dono) e pela página da playlist (nº de vídeos).
- **Reutilização:** uma playlist já registada com o mesmo ID do YouTube é reaproveitada, e não duplicada. Hoje são 2:
  Funções Reais de Variável Real (Khan Academy), da Biomédicas (#72), e Princípios da Animação no Blender 3D
  (Crazy Pixel School), do #69.
- **Ordem:** a melhor playlist publicada de cada UC fica em `position` 91001 e a segunda em 91002.

## Para rever

- **Confiança baixa, fora do SQL** (no manifesto com `"published": false`):
  - Técnicas e Métodos de Inventariação, com *Levantamento Arquitetônico* (Projeto e Detalhes). Cobre só o
    levantamento de edifícios; inquéritos de mobilidade e transportes, índices urbanísticos e formulários de recolha
    ficam sem playlist. A UC fica sem playlist publicada.
- **Sem playlist:** Projeto I, II e III, o Estágio e Técnicas e Métodos de Inventariação.
- **Regras e normas portuguesas sem cobertura.** As playlists são brasileiras e cobrem a técnica, não a regulamentação:
  - Desenho Técnico: RGEU e normas NP;
  - Edifícios: soluções construtivas e normas portuguesas;
  - Topografia e Cartografia: sistemas de coordenadas portugueses (ETRS89/PT-TM06);
  - Infraestruturas Urbanas: em Portugal vale o DR 23/95, e as playlists seguem DNIT e NBR;
  - Medições e Valoração Digital: regras de medição LNEC/ProNIC, contratação eletrónica e BIM 4D.
- **Cobertura parcial:**
  - Programação: o Mundo 3 do Curso em Vídeo (listas, dicionários, funções, módulos) só aparece em reuploads de
    terceiros, por isso ficaram o Mundo 1 e o Mundo 2;
  - Computação Visual: realidade aumentada sem playlist; na primeira playlist, 3 dos 34 vídeos são complementos de
    outros canais;
  - BIM nas Estruturas e MEP: AVAC sem playlist; a 2.ª playlist usa o Revit MEP 2019;
  - Animação Digital: física, partículas e motion graphics só em parte; a 2.ª playlist usa o Blender 2.8.
- **Gravações antigas:** as duas playlists de Desenho Assistido por Computador têm 5 a 7 anos. Os comandos 2D de base
  do AutoCAD mantêm-se.

## Verificação

**Dry-run em PostgreSQL 17**, com as tabelas `facodi` reduzidas às colunas usadas:

| Caso | Resultado |
|---|---|
| Primeira execução, com as 2 playlists da base já registadas | 1 curso (120 ECTS, 4 semestres), 19 UCs, 26 playlists novas e 2 reaproveitadas, 19 relações curso → UC e 28 relações UC → playlist |
| Segunda execução | Não altera nada (idempotente) |
| Outro curso já com `CTESP-DMD` | Aborta antes de inserir |
| Código de UC já usado como slug noutro curso | A UC deste curso fica com o slug `ctesp-desenho-modelacao-digital-uc-<código>` |

Hoje nenhum código de UC deste curso existe na base. O último caso foi testado só para confirmar a regra.

**Pré-verificações:**
- 19 UCs, 120 ECTS e 30 ECTS em cada um dos 4 semestres;
- uma colocação por UC;
- só ligações de confiança alta ou média;
- IDs, URLs, idioma e nº de vídeos das playlists;
- conflitos de curso (código, slug ou ID 1843).

**Pós-verificação:** confirma o curso publicado, as 19 UCs com colocação e as 28 ligações. Se alguma linha não
entrar, a transação inteira é revertida.

**Vista do plano:** simulada com o `buildUalgSections` do #67 e os dados do manifesto. Cada semestre mostra as
obrigatórias com 30 ECTS: Ano 1 · Semestre 1 e 2, Ano 2 · Semestre 3 (cinco UCs e o projeto do semestre) e
Ano 2 · Semestre 4 (o Estágio). Não há grupos de opção.

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72):
[`supabase/seeds/facodi_ualg_1843_ctesp_desenho_modelacao_digital_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1843_ctesp_desenho_modelacao_digital_20261118/supabase/seeds/facodi_ualg_1843_ctesp_desenho_modelacao_digital_20261118.sql),
na branch `scripts/facodi_ualg_1843_ctesp_desenho_modelacao_digital_20261118` do fork. Não é uma migração.

O script corre numa única transação e não foi aplicado em produção. Depois de aplicado, o build seguinte gera as
páginas do curso e das UCs e acrescenta-as ao sitemap e ao `llms.txt`.
