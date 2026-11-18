# Licenciatura em Economia, UAlg/FE 1440

**Data:** 2026-11-18
**Manifesto:** `supabase/seeds/facodi_ualg_1440_economia_20261118.json`
**Script:** [`facodi_ualg_1440_economia_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1440_economia_20261118/supabase/seeds/facodi_ualg_1440_economia_20261118.sql), na branch `scripts/facodi_ualg_1440_economia_20261118` do fork. Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72).
**Depende de:** #67, já integrado, para a página do curso mostrar os grupos de opção à parte das obrigatórias.
**Ordem de aplicação:** aplicar este script **antes do #82** (Matemática Aplicada, `LMAEG`), que partilha as UCs 14401021 e 14401022. A pré-verificação deste script aborta se esses códigos já pertencerem a outro curso; o #82 já indica "aplicar depois do #74".

## Identidade

- **Curso:** Licenciatura em Economia, Faculdade de Economia da Universidade do Algarve, curso **1440**.
- **Unidade orgânica:** Faculdade de Economia, Campus de Gambelas.
- **Língua:** português.
- **Duração:** 180 ECTS, 6 semestres.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1440) e [plano 2026/27](https://www.ualg.pt/curso/1440/plano).
- **Na FACODI:** código interno `LECON`, slug `economia`. Nem o código, nem o slug, nem o ID 1440 existem no catálogo (leitura pública a 18/11/2026).

## Porque este curso

Na pesquisa de playlists para cursos da UAlg ainda fora do site (`facodi/pesquisa/playlists-ualg-2026-11-18`), foi o
curso de economia e negócios com melhor cobertura:
- **As UCs nucleares** (micro, macro, econometria, crescimento, economia monetária, finanças públicas, economia
  internacional e história do pensamento económico) têm disciplinas universitárias gravadas por professores (USP, UFPel,
  UFPE, ITA, UNIVESP).
- **As UCs de finanças e contabilidade** têm canais portugueses (As Explicações do Pontes, Fátima Explica Gestão, CERTFORM).
- **Complementa a Licenciatura em Gestão**, que já está no site. Nenhum código de UC é partilhado com ela; várias UCs
  sobrepõem-se só no tema.

## Plano 2026/27

O plano tem **32 UCs, todas de 6 ECTS**, cinco por semestre: **28 obrigatórias** e dois grupos de opção no 3.º ano.
- **Opção I (G)**, no 1.º semestre: Empreendedorismo ou Gestão da Negociação.
- **Opção II (G)**, no 2.º semestre: Ética e Responsabilidade Social ou Fiscalidade.

Resultado: 168 + 6 + 6 = 180 ECTS, com 30 ECTS em cada semestre.
- **Colocação no plano:** todas as UCs levam `curriculum_placements`, no Tronco Comum. As obrigatórias levam `role: mandatory`. As opções levam `role: alternative`, com o grupo como está no plano.
- **Nenhuma UC é "Semestral"** e nenhuma aparece em dois grupos, por isso cada UC tem uma só colocação.
- **Ordem:** a ordem das UCs em cada semestre segue a página do plano.
- **Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27** (academico.ualg.pt). O URL da ficha, com o link exato da página do plano (`codInstituic=4`), fica em `metadata.official_fuc_url`. As 32 fichas estão publicadas.

**Decisão assinalada:** o nome dos grupos fica **"Opção I (G)" e "Opção II (G)"**, como no plano. Só "OPÇÃO" passa a
"Opção", como na Eletrotécnica. O "(G)" não é explicado na página do curso, por isso não foi expandido.

| Ano | Sem. | Código | Unidade curricular | ECTS | Playlists | Primeira playlist |
|---|---|---|---|---:|---:|---|
| 1.º | 1.º | 14401000 | Economia I | 6 | 2 | Introdução à Economia — Fábio Henrique Bittes Terra |
| 1.º | 1.º | 14401080 | Introdução às Ciências Sociais | 6 | 1 | Crash Course Sociology — CrashCourse |
| 1.º | 1.º | 14401001 | Matemática I | 6 | 2 | CÁLCULO 1 — Equaciona Com Paulo Pereira |
| 1.º | 1.º | 14401079 | Organização e Gestão de Empresas | 6 | 2 | Introdução à Teoria Geral da Administração · 3ª Edição · Antonio Cesar Amaru Maximiano — GEN Negócios e Gestão |
| 1.º | 1.º | 14401007 | Tecnologias de Informação | 6 | 2 | Excel - Funções — Alessandro Trovato |
| 1.º | 2.º | 14401081 | Cálculo e Instrumentos Financeiros | 6 | 2 | Cálculo Financeiro — As Explicações do Pontes |
| 1.º | 2.º | 14401082 | Contabilidade Geral | 6 | 1 | Rubrica Contabilidade — CERTFORM – Escola de Formação Prática |
| 1.º | 2.º | 14401013 | Direito da Economia | 6 | 0 | — |
| 1.º | 2.º | 14401005 | Economia II | 6 | 2 | Introdução à macroeconomia — Wladimir Azevedo Jr. |
| 1.º | 2.º | 14401006 | Matemática II | 6 | 2 | CÁLCULO EM VÁRIAS VARIÁVEIS — Matemateca - Ester Velasquez |
| 2.º | 1.º | 14401083 | Análise Financeira | 6 | 2 | Finanças Empresariais — As Explicações do Pontes |
| 2.º | 1.º | 14401084 | Contabilidade de Gestão | 6 | 1 | Contabilidade de Gestão — Fátima Explica Gestão |
| 2.º | 1.º | 14401014 | Estatística I | 6 | 2 | Probabilidade e Estatística — Professor Douglas Maioli |
| 2.º | 1.º | 14401010 | Macroeconomia I | 6 | 2 | Macroeconomia I — Marcelo de Oliveira Passos UFPEL |
| 2.º | 1.º | 14401011 | Microeconomia I | 6 | 2 | Microeconomia — Roberto Guena de Oliveira |
| 2.º | 2.º | 14401025 | Crescimento Económico | 6 | 2 | Crescimento (I) — Paolo Imori |
| 2.º | 2.º | 14401017 | Economia da Empresa | 6 | 0 | — |
| 2.º | 2.º | 14401019 | Estatística II | 6 | 2 | Inferência Estatística - Testes de Hipóteses Paramétricos e não Paramétricos — As Explicações do Pontes |
| 2.º | 2.º | 14401015 | Macroeconomia II | 6 | 1 | Modelo IS-LM-BP — Aplicadas Descomplicadas |
| 2.º | 2.º | 14401016 | Microeconomia II | 6 | 2 | Teoria dos Jogos — Professor Jáder Jucá |
| 3.º | 1.º | 14401023 | Econometria I | 6 | 2 | Introdução à Econometria — Alessandro V. M. Oliveira |
| 3.º | 1.º | 14401021 | Economia e Finanças Públicas | 6 | 1 | Economia do Setor Público — DAECA UFRGS |
| 3.º | 1.º | 14401022 | Economia Monetária e Financeira | 6 | 2 | Economia Monetária - Moeda e Bancos — UNIVESP |
| 3.º | 1.º | 14401087 | História do Pensamento Económico | 6 | 2 | História do Pensamento Econômico I — Ricardo Luís Chaves Feijó |
| 3.º | 1.º | 14401033 | Empreendedorismo · Opção I (G) | 6 | 0 | — |
| 3.º | 1.º | 14401092 | Gestão da Negociação · Opção I (G) | 6 | 0 | — |
| 3.º | 2.º | 14401085 | Avaliação de Projetos | 6 | 2 | Análise de Investimentos — Matemática Financeira UFRGS |
| 3.º | 2.º | 14401028 | Econometria II | 6 | 2 | Econometria 2 — economiaetv |
| 3.º | 2.º | 14401086 | Economia Internacional | 6 | 2 | Curso de Economia Internacional — Ecio Costa |
| 3.º | 2.º | 14401088 | Seminário de Economia Aplicada | 6 | 2 | Ciclo Básico · Projetos e Métodos para a Produção do Conhecimento — UNIVESP |
| 3.º | 2.º | 14401090 | Ética e Responsabilidade Social · Opção II (G) | 6 | 0 | — |
| 3.º | 2.º | 14401093 | Fiscalidade · Opção II (G) | 6 | 0 | — |


## Playlists

- **Pesquisa:** 48 playlists em 49 ligações, para 27 das 28 UCs obrigatórias (todas menos Direito da Economia).
- **O que o script publica:** **46 playlists em 47 ligações**, para **26 UCs**. As 2 ligações de confiança baixa ficam só no
  manifesto (`published: false`), para revisão, como no #69. As duas playlists dessas ligações não aparecem noutra UC,
  por isso também ficam fora do script.
- **Idioma (publicadas):** 34 em PT-BR, 10 em PT-PT (As Explicações do Pontes, Miguel Coelho, MathTutorCascais, Fátima Explica Gestão, CERTFORM) e 2 em inglês (CrashCourse, Marginal Revolution University).
- **Confiança:**
  - publicadas: 31 alta e 16 média;
  - na pesquisa: 31 alta, 16 média e 2 baixa.
- **Critérios:**
  - a correspondência segue o programa da ficha oficial da UC;
  - só canais do autor original, com pelo menos 4 vídeos;
  - português primeiro (PT-PT quando existe), e matérias portuguesas como contabilidade e direito só com conteúdo português.
- **Verificação:** todas confirmadas no YouTube a 18/11/2026, pelo oEmbed (título e canal dono) e pela página da playlist (nº de vídeos).
- **Reutilização:** uma playlist que já exista no catálogo com o mesmo ID do YouTube é reaproveitada, e não duplicada. Hoje já existem 4: as duas de Organização e Gestão de Empresas, Bases das Finanças Empresariais (CERTFORM) e Economia Monetária (UNIVESP), vindas do #69.
- **Uma playlist em duas UCs:** Finanças Empresariais, de As Explicações do Pontes, serve Análise Financeira e Avaliação de Projetos.
- **Retirada antes do PR:** a playlist "Modelo Mundell Fleming", prevista para Macroeconomia II, saiu porque os vídeos são de outro canal, e não do dono da playlist.

**Para rever:**
- **Confiança baixa, retidas no manifesto:**
  - Introdução às Ciências Sociais, na 2.ª playlist (*Metodologia de Investigação Científica*, Sérgio Ventura). Cobre só o tema 4 do programa, e a variante do português não foi confirmada.
  - Economia da Empresa, com a única playlist (*Empreendedorismo e Inovação*, UNIVESP). O programa inclui políticas públicas, ecossistemas empresariais e o tecido empresarial português, sem equivalente aberto.
- **Uma só playlist:**
  - Introdução às Ciências Sociais (CrashCourse, em inglês);
  - Contabilidade Geral e Contabilidade de Gestão, com cápsulas práticas portuguesas e não aulas sequenciais;
  - Macroeconomia II, que ficou com uma só depois de sair a do Mundell-Fleming;
  - Economia e Finanças Públicas.
- **Autoria a confirmar:** a playlist de Economia e Finanças Públicas é de um canal de diretório académico da UFRGS que publica as aulas da disciplina. Ficou com confiança alta, mas convém confirmar o autor antes de aplicar.
- **Sem playlist:**
  - Direito da Economia: o programa é direito português, e só havia direito brasileiro;
  - Economia da Empresa: só tinha a ligação de confiança baixa;
  - as 4 UCs de opção, porque a pesquisa cobriu só as obrigatórias.
- **Cobertura parcial**, registada em `match_rationale`: séries em Matemática I; formas quadráticas e Kuhn-Tucker em
  Matemática II; ANOVA e SPSS em Estatística II; UEM e BCE em Economia Monetária e Financeira; variáveis
  instrumentais, equações simultâneas, ARDL e cointegração em Econometria II.

## Verificação do script

O script foi testado num dry-run em PostgreSQL 17, com as tabelas `facodi` reduzidas às colunas usadas:

| Caso | Resultado |
|---|---|
| Primeira execução, com uma playlist já registada (`PL9B175DCCA462A826`, como em produção) | 1 curso (180 ECTS), 32 UCs, 45 playlists novas mais a existente, 32 relações curso → UC e 47 relações UC → playlist |
| Segunda execução | Não altera nada (idempotente) |
| Outro curso já com `LECON` | Aborta antes de inserir |
| Código de UC já usado noutro curso | Aborta antes de inserir |

**Pré-verificações:**
- 32 UCs, 28 obrigatórias com 168 ECTS e dois grupos de 2 alternativas de 6 ECTS;
- uma colocação por UC, no Tronco Comum, coerente com o grupo;
- os IDs, URLs, idiomas e nº de vídeos das playlists, e só ligações de confiança alta ou média;
- conflitos de curso (código, slug ou ID 1440) e de códigos de UC.

**Pós-verificação:** confirma o curso publicado, as 32 UCs com colocação e as 47 ligações. Se uma restrição da base
que não está no repositório rejeitar alguma linha, a pós-verificação aborta o script inteiro.

**Vista do plano:** foi simulada com o `buildUalgSections` do #67 e os dados deste manifesto. O 1.º e o 2.º ano mostram
30 ECTS obrigatórios por semestre. O 3.º ano mostra 24 ECTS obrigatórios em cada semestre, mais o grupo Opção I (G) no
1.º e o Opção II (G) no 2.º, cada um com as duas alternativas.

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72):
[`supabase/seeds/facodi_ualg_1440_economia_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1440_economia_20261118/supabase/seeds/facodi_ualg_1440_economia_20261118.sql), na branch `scripts/facodi_ualg_1440_economia_20261118` do fork.

**Aplicar antes do #82** (Matemática Aplicada), que partilha as UCs 14401021 e 14401022: a pré-verificação deste script
aborta se esses códigos já pertencerem a outro curso.

O PR não tem nenhum ficheiro `.sql`: leva só este documento e o manifesto. O script não foi aplicado em produção.
Só tem as ligações de confiança alta ou média; as 2 de confiança baixa ficam no manifesto com `"published": false`.
O #67, que mostra os grupos de opção na página do curso, já está integrado. Depois de aplicado o script, o build
seguinte gera as páginas estáticas do curso e das UCs e acrescenta-as ao sitemap e ao `llms.txt`.
