# Licenciatura em Desporto, UAlg/ESEC 1538

**Data:** 2026-11-18
**Script:** [`facodi_ualg_1538_desporto_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1538_desporto_20261118/supabase/seeds/facodi_ualg_1538_desporto_20261118.sql). Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72).
**Manifesto:** `supabase/seeds/facodi_ualg_1538_desporto_20261118.json`
**Depende de:** #67 (já integrado na `facodi`), para a página do curso mostrar os grupos de opção.

## Identidade

- **Curso:** Licenciatura em Desporto, Universidade do Algarve, curso **1538**.
- **Unidade orgânica:** Escola Superior de Educação e Comunicação (ensino politécnico), Campus da Penha.
- **Área temática:** Ciências Sociais e da Educação.
- **Língua:** português.
- **Duração:** 180 ECTS, 6 semestres.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1538) e [plano 2026/27](https://www.ualg.pt/curso/1538/plano).
- **Na FACODI:** código interno `LDESP`, slug `desporto`. Nem o código, nem o slug, nem o ID 1538, nem os códigos de UC `1538xxxx` existem na base (confirmado por leitura pública a 18/11/2026).

## Porque este curso

Na pesquisa de playlists para cursos da UAlg ainda fora do site (`facodi/pesquisa/playlists-ualg-2026-11-18`):
- **As ciências do desporto têm disciplinas universitárias inteiras em aberto**, de professores da UFRGS, Unicamp, USP, UFRN e UFAM, com terminologia científica comum a Portugal.
- **As duas UCs que pedem Portugal têm fonte oficial portuguesa:** o INEM (Prevenção, Segurança e Emergência) e o Comité Paralímpico de Portugal (Desporto Adaptado).

## Plano 2026/27

São 32 UCs, todas no tronco comum (o curso não tem ramos):
- **24 obrigatórias**, com 156 ECTS, incluindo o **Estágio** de 30 ECTS no 3.º ano, 2.º semestre.
- **Quatro grupos de opção, cada um com 2 UCs:**
  - **Opção I - Metodologia dos Desportos Náuticos** (2.º ano, 1.º semestre, 7 ECTS): Metodologia da Canoagem ou Metodologia da Vela.
  - **Opção II - Metodologia das Atividades Desportivas** (2.º ano, 2.º semestre, 7 ECTS): Metodologia do Futebol ou Metodologia do Ténis.
  - **Opção III** (3.º ano, 1.º semestre, 5 ECTS): Análise do Desempenho Desportivo ou Prescrição do Exercício para Populações Especiais.
  - **Opção IV** (3.º ano, 1.º semestre, 5 ECTS): Animação Desportiva ou Motricidade Infantil.

Resultado: 156 + 7 + 7 + 5 + 5 = 180 ECTS.

**Modelo:**
- **Cada UC tem um único registo**, com `curriculum_placements` (ano, semestre, papel, grupo e `specialization: "Tronco Comum"`).
- **As opções** entram como alternativas: `role: alternative`, com o grupo como está no plano, `is_elective_option` e `official_option_group`.
- **Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27** (academico.ualg.pt, `codInstituic=5`). As 32 UCs têm ficha publicada, e o URL fica em `metadata.official_fuc_url`.

**Decisões assinaladas:**
- **Títulos das opções.** No plano, as UCs de opção vêm com o nome do grupo à frente (por exemplo, "OPÇÃO I - METODOLOGIA DOS DESPORTOS NÁUTICOS - METODOLOGIA DA CANOAGEM"). O título da UC fica só "Metodologia da Canoagem", e o grupo fica no `group` da colocação.
- **1.º ano com 32 + 28 ECTS.** No plano 2026/27, Métodos de Pesquisa e Análise de Dados em Desporto passou para o 1.º semestre e Pedagogia do Desporto para o 2.º (em 2025/26 era ao contrário). Segue-se o plano 2026/27. Nenhuma UC aparece nos dois semestres, por isso `offered_in_both_semesters` é sempre `false`.

| Ano | Sem. | Código | Unidade curricular | ECTS | Playlists | Primeira playlist |
|---|---|---|---|---:|---:|---|
| 1.º | 1.º | 15381200 | Anatomofisiologia | 6 | 2 | Aparelho Locomotor — Anatomia Unicamp |
| 1.º | 1.º | 15381173 | Atividades Desportivas I | 6 | 1 | Metodologia da Natação I — Cicero Cleber Brito Pereira |
| 1.º | 1.º | 15381201 | Bioquímica do Desporto e do Exercício | 5 | 2 | Bioquímica do Exercício - Profa. Dra. Cristiane Matte/UFRGS — CRISTIANE MATTE |
| 1.º | 1.º | 15381172 | Desenvolvimento e Aprendizagem Motora | 5 | 1 | Controle, Aprendizagem e Desenvolvimento Motor — Luciana Weinert |
| 1.º | 1.º | 15381171 | Fitness I | 5 | 0 | — |
| 1.º | 1.º | 15381170 | Métodos de Pesquisa e Análise de Dados em Desporto | 5 | 2 | Disciplina Bioestatística aplicada a Educação Física — PsicoFisio UFRN |
| 1.º | 2.º | 15381175 | Cinesiologia | 6 | 2 | IPE067 - CINESIOLOGIA — Coordenacao Educacao Fisica ICSEZ |
| 1.º | 2.º | 15381176 | Desportos Náuticos | 7 | 2 | Curso de vela - vídeo aulas — Marcelo Velejador |
| 1.º | 2.º | 15381113 | Fisiologia do Esforço | 6 | 1 | Fisiologia do Exercício — Fisio Ex - Prof. Alvaro Reischak de Oliveira |
| 1.º | 2.º | 15381174 | Nutrição no Desporto e no Exercício | 4 | 2 | ISN069 Nutrição Aplicada à Atividade Física — Gustavo Fanaro |
| 1.º | 2.º | 15381012 | Pedagogia do Desporto | 5 | 2 | Pedagogia do Esporte — Educação Física com Vinho |
| 2.º | 1.º | 15381178 | Atividades Desportivas II | 8 | 1 | Curso: Futebol Tático Nível I (Básico) — Júlio César Nunes |
| 2.º | 1.º | 15381202 | Biomecânica do Desporto e do Exercício | 5 | 1 | Biomecânica aplicada saúde esporte — Leonardo Alexandre Peyré-Tartaruga |
| 2.º | 1.º | 15381177 | Saúde e Condição Física | 5 | 1 | Medidas e avaliações em Educação Física e Saúde — Moacir Pereira Junior |
| 2.º | 1.º | 15381203 | Teoria Geral do Treino Desportivo | 5 | 1 | Periodização do Treinamento Esportivo — Guilherme Tucher |
| 2.º | 1.º | 15381204 | Metodologia da Canoagem (Opção I) | 7 | 0 | — |
| 2.º | 1.º | 15381205 | Metodologia da Vela (Opção I) | 7 | 0 | — |
| 2.º | 2.º | 15381181 | Desporto Adaptado | 5 | 1 | Série Classificação Funcional Desportiva — Paralímpicos Portugal |
| 2.º | 2.º | 15381183 | Fitness II | 7 | 0 | — |
| 2.º | 2.º | 15381182 | Gestão do Desporto | 5 | 2 | O que é Gestão do Esporte? — Bia Amorim |
| 2.º | 2.º | 15381124 | Metodologia do Treino Desportivo | 6 | 2 | Periodização do Treinamento (de forma descomplicada e o melhor 100% PRÁTICA) — NEFET by Prof. Dr. Luis Polito |
| 2.º | 2.º | 15381207 | Metodologia do Futebol (Opção II) | 7 | 0 | — |
| 2.º | 2.º | 15381206 | Metodologia do Ténis (Opção II) | 7 | 0 | — |
| 3.º | 1.º | 15381184 | Gestão de Projetos Desportivos | 6 | 1 | Eixo de Negócios \| Gestão de Projetos — UNIVESP |
| 3.º | 1.º | 15381186 | Prevenção, Segurança e Emergência | 5 | 1 | Lições INEM — INEM |
| 3.º | 1.º | 15381187 | Psicologia do Desporto e do Exercício | 5 | 1 | Introdução à Psicologia do Esporte \| PSICOBIO EM REDE — Psicobiologia USP RP |
| 3.º | 1.º | 15381185 | Sociologia do Desporto | 4 | 2 | ESPORTE E SOCIOLOGIA — Esporte & Sociedade - EEFERP-USP |
| 3.º | 1.º | 15381208 | Análise do Desempenho Desportivo (Opção III) | 5 | 0 | — |
| 3.º | 1.º | 15381209 | Prescrição do Exercício para Populações Especiais (Opção III) | 5 | 0 | — |
| 3.º | 1.º | 15381210 | Animação Desportiva (Opção IV) | 5 | 0 | — |
| 3.º | 1.º | 15381211 | Motricidade Infantil (Opção IV) | 5 | 0 | — |
| 3.º | 2.º | 15381188 | Estágio | 30 | 0 | — |

A coluna "Playlists" conta só as ligações que entram no script (confiança alta ou média).

## Playlists

- **Pesquisa:** 34 playlists e 36 ligações para as 23 UCs obrigatórias com aulas (todas exceto o Estágio). A pesquisa não cobriu as 8 opções.
- **No script:** 30 playlists e 31 ligações, para 21 UCs. As 5 ligações de confiança baixa ficam só no manifesto (`published: false`), para revisão, como no #69. Quatro playlists aparecem só nessas ligações e também ficam fora do script.
- **Idioma (no script):** 28 em PT-BR e 2 em PT-PT (INEM e Paralímpicos Portugal).
- **Confiança (todas as ligações):** 13 alta, 18 média, 5 baixa.
- **Critérios:**
  - a correspondência segue o programa da ficha oficial da UC;
  - só canais do autor original, com pelo menos 4 vídeos;
  - preferência por professores e universidades identificados.
- **Verificação:** todas as 34 foram confirmadas no YouTube a 18/11/2026, pelo oEmbed (título e canal dono) e pela página da playlist (nº de vídeos). O gerador volta a verificar e aborta se alguma falhar.
- **Reutilização:** uma playlist que já exista no catálogo com o mesmo ID do YouTube é reaproveitada, e não duplicada. Duas já existem em produção: *Aparelho Locomotor* (Anatomia Unicamp) e *Introdução à Psicologia do Esporte* (Psicobiologia USP RP).

**Para rever:**
- **Confiança baixa (5 ligações, fora do script):**
  - Fitness I e Fitness II, com a mesma playlist, *Métodos de treinamento para força e hipertrofia* (Moacir Pereira Junior). É divulgação para profissionais. Sem ela, as duas UCs ficam sem playlist.
  - Atividades Desportivas I, na 2.ª playlist (técnica de crawl, Prof. Rogério Nocentini).
  - Atividades Desportivas II, na 2.ª playlist (ténis para iniciantes, Academia do Tênis).
  - Saúde e Condição Física, na 2.ª playlist (avaliação física, Fabio Ceschini).
- **Só uma playlist:** Atividades Desportivas I e II, Desenvolvimento e Aprendizagem Motora, Fisiologia do Esforço, Biomecânica do Desporto e do Exercício, Saúde e Condição Física, Teoria Geral do Treino Desportivo, Desporto Adaptado, Gestão de Projetos Desportivos, Prevenção, Segurança e Emergência, e Psicologia do Desporto e do Exercício.
- **Sem playlist:** Fitness I e II (só tinham ligações de confiança baixa), as 8 opções e o Estágio.
- **Material de formação profissional, não universitário (confiança média):** a vela em Desportos Náuticos (Marcelo Velejador, Allan Godoy), o futebol em Atividades Desportivas II (Júlio César Nunes) e Gestão do Desporto (Bia Amorim).
- **Partes do programa sem cobertura:**
  - polo aquático, natação sincronizada e saltos (Atividades Desportivas I);
  - canoagem e windsurf (Desportos Náuticos);
  - o ténis com Teaching Games for Understanding (Atividades Desportivas II);
  - o setor público e privado do desporto em Portugal (Gestão do Desporto, módulo IV);
  - o modelo de deficiência da OMS e o método Halliwick (Desporto Adaptado);
  - as lesões desportivas e o afogamento (Prevenção, Segurança e Emergência).

## Verificação do script

**Dry-run em PostgreSQL 17**, com as tabelas `facodi` reduzidas às colunas usadas:

| Caso | Resultado |
|---|---|
| Primeira execução | 1 curso (`LDESP`, 180 ECTS), 32 UCs com colocação (156 ECTS obrigatórios), 30 playlists, 32 relações curso → UC e 31 relações UC → playlist |
| Segunda execução | Não altera nada (contagens e hashes das tabelas iguais) |
| Outro curso já com `LDESP` | Aborta na pré-verificação, sem inserir nada |
| UC `15381200` já é slug de uma UC de outro curso | A UC deste curso fica com o slug `desporto-uc-15381200` |
| Playlist já registada com o mesmo ID do YouTube | É reaproveitada (1 registo, com a ligação a apontar para ele) |

**Pré-verificações:**
- as contagens de UCs, colocações, playlists e ligações;
- os 156 ECTS obrigatórios e os quatro grupos de opção, cada um com 2 UCs e os ECTS do plano;
- só ligações de confiança alta ou média;
- os IDs e URLs das playlists;
- conflitos de curso (código, slug ou ID 1538).

**Pós-verificação:** confirma o curso publicado, as 32 UCs com colocação e as 31 ligações.

**Vista do plano:** foi simulada com o `buildUalgSections` do #67 e os dados deste manifesto. Sem ramos, a página mostra:
- no 1.º ano, 32 e 28 ECTS obrigatórios;
- no 2.º ano, 23 ECTS obrigatórios por semestre, mais a Opção I no 1.º semestre e a Opção II no 2.º (7 ECTS cada);
- no 3.º ano, 20 ECTS obrigatórios no 1.º semestre, mais as Opções III e IV (5 ECTS cada), e o Estágio de 30 ECTS no 2.º.

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72): [facodi_ualg_1538_desporto_20261118.sql](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1538_desporto_20261118/supabase/seeds/facodi_ualg_1538_desporto_20261118.sql), na branch `scripts/facodi_ualg_1538_desporto_20261118` do fork.

- **Este PR não tem ficheiros `.sql`:** leva só este documento e o manifesto JSON.
- **O script não foi aplicado em produção.** Corre numa única transação: as tabelas temporárias são `ON COMMIT DROP`.
- **Depois de aplicado,** o build seguinte gera as páginas estáticas do curso e das UCs e acrescenta-as ao sitemap e ao `llms.txt`.
