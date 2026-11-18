# Licenciatura em Ciências da Educação e da Formação, UAlg/FCHS 1448

**Data:** 2026-11-18
**Script:** [`facodi_ualg_1448_ciencias_educacao_formacao_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1448_ciencias_educacao_formacao_20261118/supabase/seeds/facodi_ualg_1448_ciencias_educacao_formacao_20261118.sql). Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72).
**Manifesto:** `supabase/seeds/facodi_ualg_1448_ciencias_educacao_formacao_20261118.json`
**Depende de:** #67 (já integrado na `facodi`), para a página do curso mostrar os grupos de opção.

## Identidade

- **Curso:** Licenciatura em Ciências da Educação e da Formação, Universidade do Algarve, curso **1448**.
- **Unidade orgânica:** Faculdade de Ciências Humanas e Sociais (ensino universitário), Campus de Gambelas.
- **Língua:** português.
- **Duração:** 180 ECTS, 6 semestres.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1448) e [plano 2026/27](https://www.ualg.pt/curso/1448/plano).
- **Na FACODI:** código interno `LCEF`, slug `ciencias-educacao-formacao`. Nem o código, nem o slug, nem o ID 1448, nem os códigos `1448xxxx` existem na base (confirmado por leitura pública a 18/11/2026).

## Porque este curso

Na pesquisa de playlists para cursos da UAlg ainda fora do site (`facodi/pesquisa/playlists-ualg-2026-11-18`):
- **A UNIVESP tem as disciplinas de fundamentos da Pedagogia gravadas por inteiro:** filosofia, psicologia, sociologia, currículo, avaliação, estatística e tecnologias educativas.
- **A lacuna está nas UCs presas ao sistema educativo português:** história da educação em Portugal, gestão e administração escolar, políticas educativas e educação de adultos. Aí só há material português de seminários e congressos (CNE, APCEP, Forma-te), ou nada.

## Plano 2026/27

São 36 UCs, todas no tronco comum (o curso não tem ramos):
- **31 obrigatórias**, com 165 ECTS. Entre elas estão os quatro **Seminários de Projeto – Práticas Profissionais em Educação**, com 5 ECTS nos três primeiros e 15 ECTS no IV (3.º ano, 2.º semestre).
- **Três grupos de opção, de 5 ECTS cada:**
  - **Opção I (CE)** (2.º ano, 2.º semestre): Educação de Infância.
  - **Opção II (QAC)** (3.º ano, 1.º semestre): Psicologia da Motivação e Emoção, Psicologia da Personalidade ou Psicologia Social.
  - **Opção III (QAC)** (3.º ano, 2.º semestre): Aprendizagem em Serviço.

Resultado: 165 + 5 + 5 + 5 = 180 ECTS, com 30 ECTS em cada semestre.

**Modelo:**
- **Cada UC tem um único registo**, com `curriculum_placements` (ano, semestre, papel, grupo e `specialization: "Tronco Comum"`).
- **As opções** entram como alternativas: `role: alternative`, com o grupo como está no plano, `is_elective_option` e `official_option_group`.
- **Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27** (academico.ualg.pt, `codInstituic=8`). As 36 UCs têm ficha publicada, e o URL fica em `metadata.official_fuc_url`.

**Decisões assinaladas:**
- **Grupos de opção com uma só UC.** No plano 2026/27, a Opção I (CE) só lista Educação de Infância e a Opção III (QAC) só lista Aprendizagem em Serviço. Ficam como alternativas no seu grupo, como o plano as apresenta, e não como obrigatórias. As siglas CE e QAC não são expandidas, porque o plano não as explica.
- **UCs partilhadas com a Psicologia (LPSI).** As três UCs da Opção II têm códigos da Psicologia (`1452xxxx`), que já existem na base como UCs da LPSI, com o código como slug. Têm registo próprio neste curso, como as UCs partilhadas com a LESTI na Eletrotécnica (#68). O slug recebe o prefixo `ciencias-educacao-uc-` (por exemplo, `ciencias-educacao-uc-14521138`), e o curso regista a partilha em `metadata.shared_units_with_course`.
- **Semestre da ficha diferente do plano.** Processos de Comunicação em Educação está no 1.º semestre do 2.º ano no plano e no 2.º semestre na ficha; Estatística Aplicada às Ciências Sociais está no 2.º semestre no plano e no 1.º na ficha. Segue-se o plano, que fecha 30 ECTS no 2.º ano, 1.º semestre. As duas UCs ficam com `fuc_semester_differs_from_plan: true` e o semestre da ficha em `official_fuc_semester`.
- **Seminários de Projeto I a IV.** A apresentação do curso fala em Seminários I a V, mas o plano 2026/27 só tem I a IV. Segue-se o plano.

| Ano | Sem. | Código | Unidade curricular | ECTS | Playlists | Primeira playlist |
|---|---|---|---|---:|---:|---|
| 1.º | 1.º | 14481000 | Filosofia da Educação | 5 | 2 | Pedagogia \| Filosofia da Educação — UNIVESP |
| 1.º | 1.º | 14481006 | História da Educação | 5 | 0 | — |
| 1.º | 1.º | 14481115 | Introdução à Investigação Científica | 5 | 2 | Ciclo Básico \| Projetos e Métodos para a Produção do Conhecimento — UNIVESP |
| 1.º | 1.º | 14481113 | Introdução às Ciências da Educação | 5 | 0 | — |
| 1.º | 1.º | 14481114 | Psicologia do Desenvolvimento | 5 | 1 | Pedagogia * D-11: Psicologia do Desenvolvimento — UNIVESP |
| 1.º | 1.º | 14481005 | Recursos e Tecnologias Educativas | 5 | 1 | Letras, Matemática e Pedagogia \| Educação Mediada por Tecnologias (2019.2) — UNIVESP |
| 1.º | 2.º | 14481118 | Conceção, Gestão e Avaliação de Projetos | 5 | 1 | Eixo de Negócios \| Gestão de Projetos — UNIVESP |
| 1.º | 2.º | 14481081 | Correntes da Pedagogia Contemporânea | 5 | 1 | Disciplina: Pedagogias Contra-Hegemônicas — HISTEDBR |
| 1.º | 2.º | 14481116 | Metodologias e Técnicas de Investigação em Educação I | 5 | 1 | Métodos e técnicas de pesquisa — Prof. Dr. Ivan Guedes |
| 1.º | 2.º | 14481117 | Psicologia da Educação | 5 | 2 | Pedagogia * D-08: Psicologia da Educação — UNIVESP |
| 1.º | 2.º | 14481001 | Sociologia da Educação | 5 | 1 | Pedagogia \| Sociologia da Educação — UNIVESP |
| 1.º | 2.º | 14481089 | Teoria e Desenvolvimento Curricular | 5 | 1 | Licenciaturas \| Teorias do Currículo (2019.2) — UNIVESP |
| 2.º | 1.º | 14481028 | Educação e Formação de Adultos | 5 | 1 | EDUCAÇÃO PERMANENTE EM TEMPO DE MUDANÇA — APCEP Associação |
| 2.º | 1.º | 14481009 | Educação e Intervenção Social | 5 | 1 | Pedagogia \| Educação em Espaços Não-Formais — UNIVESP |
| 2.º | 1.º | 14481120 | Metodologias e Técnicas de Investigação em Educação II | 5 | 1 | SÉRIE METODOLOGIA DA PESQUISA QUALITATIVA — Metodologia Científica Sem Sofrimento |
| 2.º | 1.º | 14481121 | Políticas Educativas | 5 | 1 | Seminários 2022 - 2026 — CONSELHO NACIONAL EDUCAÇÃO |
| 2.º | 1.º | 14481086 | Processos de Comunicação em Educação | 5 | 1 | Comunicação Assertiva para Líderes — Kultivi |
| 2.º | 1.º | 14481011 | Seminário de Projeto – Práticas Profissionais em Educação I | 5 | 0 | — |
| 2.º | 2.º | 14481119 | Estatística Aplicada às Ciências Sociais | 5 | 1 | Pedagogia \| Estatística Aplicada à Educação (2017.2) — UNIVESP |
| 2.º | 2.º | 14481024 | Gestão e Administração em Educação e Formação | 5 | 0 | — |
| 2.º | 2.º | 14481122 | Intervenção Comunitária e Animação Sociocultural | 5 | 0 | — |
| 2.º | 2.º | 14481104 | Necessidades Educativas Especiais | 5 | 1 | Licenciatura em letras \| Educação especial e Inclusiva — UNIVESP |
| 2.º | 2.º | 14481016 | Seminário de Projeto – Práticas Profissionais em Educação II | 5 | 0 | — |
| 2.º | 2.º | 14481126 | Educação de Infância (Opção I) | 5 | 0 | — |
| 3.º | 1.º | 14481014 | Construção de Materiais Educativos | 5 | 1 | Pedagogia \| Design Educacional (2018.1) — UNIVESP |
| 3.º | 1.º | 14481123 | Formação, Emprego e Profissionalidade | 5 | 0 | — |
| 3.º | 1.º | 14481124 | Modelos de Formação | 5 | 0 | — |
| 3.º | 1.º | 14481022 | Seminário de Projeto – Práticas Profissionais em Educação III | 5 | 0 | — |
| 3.º | 1.º | 14481087 | Teoria e Prática da Avaliação | 5 | 1 | Pedagogia * D-29: Avaliação Educacional e Escolar — UNIVESP |
| 3.º | 1.º | 14521138 | Psicologia da Motivação e Emoção (Opção II) | 5 | 0 | — |
| 3.º | 1.º | 14521140 | Psicologia da Personalidade (Opção II) | 5 | 0 | — |
| 3.º | 1.º | 14521012 | Psicologia Social (Opção II) | 5 | 0 | — |
| 3.º | 2.º | 14481088 | Empreendedorismo em Educação | 5 | 0 | — |
| 3.º | 2.º | 14481085 | Formação ao Longo da Vida | 5 | 0 | — |
| 3.º | 2.º | 14481125 | Seminário de Projeto – Práticas Profissionais em Educação IV | 15 | 0 | — |
| 3.º | 2.º | 14481127 | Aprendizagem em Serviço (Opção III) | 5 | 0 | — |

A coluna "Playlists" conta só as ligações que entram no script (confiança alta ou média).

## Playlists

- **Pesquisa:** 27 playlists e 28 ligações para as 27 UCs obrigatórias que não são Seminários de Projeto. Duas delas ficaram sem nenhuma proposta (Intervenção Comunitária e Animação Sociocultural, e Empreendedorismo em Educação). A pesquisa não cobriu os Seminários nem as 5 opções.
- **No script:** 22 playlists e 22 ligações, para 19 UCs. As 6 ligações de confiança baixa ficam só no manifesto (`published: false`), para revisão, como no #69. Cinco playlists aparecem só nessas ligações e também ficam fora do script.
- **Idioma (no script):** 20 em PT-BR e 2 em PT-PT (Conselho Nacional de Educação e APCEP).
- **Confiança (todas as ligações):** 6 alta, 16 média, 6 baixa.
- **Critérios:**
  - a correspondência segue o programa da ficha oficial da UC;
  - só canais do autor original, com pelo menos 4 vídeos;
  - preferência por disciplinas universitárias completas (UNIVESP, HISTEDBR/Unicamp).
- **Verificação:** todas as 27 foram confirmadas no YouTube a 18/11/2026, pelo oEmbed (título e canal dono) e pela página da playlist (nº de vídeos). O gerador volta a verificar e aborta se alguma falhar.
- **Reutilização:** uma playlist que já exista no catálogo com o mesmo ID do YouTube é reaproveitada, e não duplicada. Nenhuma das 22 do script existe hoje em produção. *Gestão de Projetos* (UNIVESP) também está na Licenciatura em Desporto (#76): o script que correr em segundo lugar reaproveita o registo do primeiro.

**Para rever:**
- **Confiança baixa (6 ligações, fora do script):**
  - **História da Educação**, com *Pedagogia | História da Educação* (UNIVESP). O núcleo da UC é o sistema educativo português (reformas pombalinas, século XIX, 1.ª República, Estado Novo, 1960–1986), e a playlist é sobretudo história da educação brasileira. Não há playlist aberta portuguesa de nível superior.
  - **Gestão e Administração em Educação e Formação**, com *Gestão Escolar* (UNIVESP). Cobre a gestão democrática e a liderança, mas não o enquadramento português nem a avaliação externa das escolas.
  - **Introdução às Ciências da Educação**, com *D-01: Educação e Sociedade* (UNIVESP). Falta a parte epistemológica sobre as Ciências da Educação como campo científico.
  - **Formação, Emprego e Profissionalidade**, com *Gestão de Carreira* (UNIVESP), que só cobre o ponto 4 (planeamento de carreira).
  - **Modelos de Formação**, com o *VI Congresso Nacional da Formação Profissional* (Forma-te). São comunicações de congresso e não seguem o ciclo formativo do programa.
  - **Formação ao Longo da Vida**, com o encontro da APCEP. A mesma playlist entra, com confiança média, em Educação e Formação de Adultos.
- **Partes do sistema português sem cobertura, em ligações de confiança média (entram no script):**
  - Teoria e Desenvolvimento Curricular: o ponto 3 (Lei de Bases do Sistema Educativo e organização das escolas) não é coberto; os exemplos da playlist são brasileiros;
  - Necessidades Educativas Especiais: o ponto 1.3 (sistema educativo português e enquadramento legal, DL 54/2018) não é coberto; a playlist usa a legislação brasileira.
- **Sem playlist:** 17 UCs. São as 6 que só tinham ligações de confiança baixa, Intervenção Comunitária e Animação Sociocultural, Empreendedorismo em Educação, os 4 Seminários de Projeto e as 5 opções.
- **Só uma playlist:** 16 UCs (todas as que têm playlist, exceto Filosofia da Educação, Introdução à Investigação Científica e Psicologia da Educação).
- **Material que não é aula (confiança média):**
  - Políticas Educativas, com os seminários do Conselho Nacional de Educação (cobre o ponto 4, a política portuguesa atual);
  - Educação e Formação de Adultos, com as comunicações do encontro da APCEP;
  - Processos de Comunicação em Educação, com um curso de comunicação assertiva para líderes (Kultivi), que não cobre a comunicação pedagógica.
- **Outras partes do programa sem cobertura:**
  - Erasmo, Montaigne e Victoria Camps (Filosofia da Educação);
  - a idade adulta e a velhice (Psicologia do Desenvolvimento);
  - a sociologia da educação em Portugal (Sociologia da Educação);
  - a pedagogia social, a economia social e a educação em contexto prisional (Educação e Intervenção Social);
  - os Centros Qualifica, o RVCC e os cursos EFA (Educação e Formação de Adultos).

## Verificação do script

**Dry-run em PostgreSQL 17**, com as tabelas `facodi` reduzidas às colunas usadas:

| Caso | Resultado |
|---|---|
| Primeira execução | 1 curso (`LCEF`, 180 ECTS), 36 UCs com colocação (165 ECTS obrigatórios), 22 playlists, 36 relações curso → UC e 22 relações UC → playlist |
| Segunda execução | Não altera nada (contagens e hashes das tabelas iguais) |
| Outro curso já com `LCEF` | Aborta na pré-verificação, sem inserir nada |
| As três UCs de Psicologia já registadas na LPSI, com o código como slug | Ficam neste curso como `ciencias-educacao-uc-14521138`, `-14521140` e `-14521012`, no grupo Opção II (QAC); as da LPSI não mudam |
| Playlist já registada com o mesmo ID do YouTube | É reaproveitada (1 registo, com a ligação a apontar para ele) |

**Pré-verificações:**
- as contagens de UCs, colocações, playlists e ligações;
- os 165 ECTS obrigatórios e os três grupos de opção, com o nº de UCs e os ECTS do plano;
- só ligações de confiança alta ou média;
- os IDs e URLs das playlists;
- conflitos de curso (código, slug ou ID 1448).

**Pós-verificação:** confirma o curso publicado, as 36 UCs com colocação e as 22 ligações.

**Vista do plano:** foi simulada com o `buildUalgSections` do #67 e os dados deste manifesto. Sem ramos, a página mostra:
- 30 ECTS obrigatórios em cada semestre do 1.º ano e no 1.º semestre do 2.º ano;
- 25 ECTS obrigatórios nos outros três semestres, cada um com o seu grupo de opção: Opção I (CE) no 2.º ano, 2.º semestre; Opção II (QAC), com 3 UCs, no 3.º ano, 1.º semestre; e Opção III (QAC) no 3.º ano, 2.º semestre.

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72): [facodi_ualg_1448_ciencias_educacao_formacao_20261118.sql](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1448_ciencias_educacao_formacao_20261118/supabase/seeds/facodi_ualg_1448_ciencias_educacao_formacao_20261118.sql), na branch `scripts/facodi_ualg_1448_ciencias_educacao_formacao_20261118` do fork.

- **Este PR não tem ficheiros `.sql`:** leva só este documento e o manifesto JSON.
- **O script não foi aplicado em produção.** Corre numa única transação: as tabelas temporárias são `ON COMMIT DROP`.
- **Depois de aplicado,** o build seguinte gera as páginas estáticas do curso e das UCs e acrescenta-as ao sitemap e ao `llms.txt`.
