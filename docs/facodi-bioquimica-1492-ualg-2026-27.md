# Licenciatura em Bioquímica, UAlg/FCT 1492

**Data:** 2026-11-18
**Manifesto:** `supabase/seeds/facodi_ualg_1492_bioquimica_20261118.json`
**Script:** [`facodi_ualg_1492_bioquimica_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1492_bioquimica_20261118/supabase/seeds/facodi_ualg_1492_bioquimica_20261118.sql). Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72). Não é uma migração.
**Depende de:** #67 (já integrado em `facodi`), para a página do curso mostrar os grupos de opção.

## Identidade

- **Curso:** Licenciatura em Bioquímica, Faculdade de Ciências e Tecnologia da Universidade do Algarve, curso **1492**.
- **Língua:** português.
- **Duração:** 180 ECTS, 6 semestres.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1492) e [plano 2026/27](https://www.ualg.pt/curso/1492/plano).
- **Na FACODI:** código interno `LBQM`, slug `bioquimica`. Nem o código, nem o slug, nem o ID 1492 existem na base
  (leitura pública a 18/11/2026).

## Plano 2026/27

São **44 UCs distintas e 61 colocações** em `curriculum_placements`, sem ramos (`Tronco Comum`):
- **26 obrigatórias** de 6 ECTS (156 ECTS): os dois primeiros anos completos e 3 UCs em cada semestre do 3.º ano;
- **3.º ano, 1.º semestre:** Opção 3.1.1 (QAC) e Opção 3.1.2 (QAC), 6 ECTS cada, com as **mesmas 9 alternativas**;
- **3.º ano, 2.º semestre:** Opção 3.2.1 (QAC), com 9 alternativas (8 de 6 ECTS e o **Projeto, de 12 ECTS**), e
  Opção 3.2.2 (QAC), com as mesmas 8 de 6 ECTS, sem o Projeto.

Total: 156 + 4 × 6 = 180 ECTS, com 30 ECTS em cada semestre. Cada UC de opção tem um único registo e uma colocação por
grupo em que aparece (as 17 opções de 6 ECTS estão em dois grupos cada).

**Decisões assinaladas nos metadados:**
- **Projeto (14921118, 12 ECTS).** Só aparece na Opção 3.2.1. Como o 2.º semestre do 3.º ano tem 18 ECTS obrigatórios,
  escolher o Projeto ocupa as duas vagas de opção (3.2.1 e 3.2.2). A regra fica em `metadata.option_group_rule` do curso.
  A página mostra o Projeto na lista da Opção 3.2.1 com os seus 12 ECTS, mas não explica esta regra.
- **Nomes dos grupos:** os do plano, com "OPÇÃO" em minúsculas e a sigla mantida: `Opção 3.1.1 (QAC)`, etc.
- **UCs partilhadas com Ciências Biomédicas (LCBM, #66/#72, já em produção).** Cinco opções têm o código de UCs da LCBM:
  Biologia do Desenvolvimento Embrionário (14241061), Imunologia Humana (14241063), Neurobiologia (14241065),
  Parasitologia e Micologia Médica (14241058) e Doenças Metabólicas (14241054). O link da ficha no plano é o mesmo
  (`codInstituic=12`). Têm registo próprio neste curso, com o resumo e os temas do #66. Como o código já é o slug da UC
  da LCBM, o slug aqui fica `bioquimica-uc-<código>`, como a Eletrotécnica fez com a LESTI.
- **Outras opções vêm de outros cursos da UAlg** (códigos 1413…, 1488…, 1530… e 140064…). Nenhuma delas está hoje
  na base.

**Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27** (academico.ualg.pt, `codInstituic=9` e
`12`, com o link exato do plano). O URL da ficha fica em `metadata.official_fuc_url`. As 44 UCs têm ficha publicada;
a do Projeto diz só que o programa é específico de cada projeto.

| Ano | Sem. | Código | Unidade curricular | ECTS | Playlists publicadas | Primeira playlist publicada |
|---|---|---|---|---:|---:|---|
| 1.º | 1.º | 140064284 | Biologia Celular | 6 | 2 | Biologia Celular e Molecular — Cristiane Matte (UFRGS) |
| 1.º | 1.º | 140064292 | Cálculo I | 6 | 2 | Cálculo 1 — Projeto Newton (UFPA) |
| 1.º | 1.º | 14921113 | Metodologia Científica e Introdução ao Laboratório | 6 | 2 | Boas Práticas de Laboratório — Eli Heber Anjos |
| 1.º | 1.º | 140064294 | Probabilidades e Estatística | 6 | 2 | Probabilidades e Estatística - Instituto Superior Técnico — MathTutorCascais (PT-PT) |
| 1.º | 1.º | 140064296 | Teoria da Ligação Química | 6 | 2 | Química Inorgânica - Graduação - UFMG — Guilherme Ferreira Lima |
| 1.º | 2.º | 140064301 | Bioquímica I | 6 | 2 | Bioquímica — Cristiane Matte (UFRGS) |
| 1.º | 2.º | 140064330 | Cálculo II | 6 | 2 | Cálculo 2 — Projeto Newton (UFPA) |
| 1.º | 2.º | 140064302 | Física | 6 | 2 | Curso Física 1 / Fundamentos de Mecânica — Uai Física |
| 1.º | 2.º | 140064305 | Introdução à Química Física | 6 | 2 | Termodinâmica Química: Conceitos e Definições — Físico-Química Universitária |
| 1.º | 2.º | 140064306 | Química Orgânica I | 6 | 2 | Química Orgânica na graduação — Claudia Regina Quimica |
| 2.º | 1.º | 14921078 | Bioquímica Física | 6 | 2 | Bioquímica e Biofísica — Biocel UnB |
| 2.º | 1.º | 140064287 | Bioquímica II | 6 | 2 | Aulas de Graduação: Metabolismo — Alicia Kowaltowski |
| 2.º | 1.º | 140064293 | Fisiologia Animal | 6 | 1 | Fisiologia sem mistério — PPG Fisiologia UFRGS |
| 2.º | 1.º | 140064295 | Química Orgânica II | 6 | 2 | Química Orgânica 2 — Patricia de Oliveira Figueiredo |
| 2.º | 1.º | 14921114 | Técnicas Laboratoriais de Análise | 6 | 2 | Química Analítica Instrumental 2021-1 — Endler Marcel Borges |
| 2.º | 2.º | 14921077 | Bioquímica Analítica | 6 | 1 | Espectrometria de Massas na Identificação de Compostos Orgânicos — Luiz Cláudio A. Barbosa |
| 2.º | 2.º | 14921072 | Bioquímica Estrutural | 6 | 2 | Bioquímica: estrutura, propriedades e funções de biomoléculas — UFABC |
| 2.º | 2.º | 14921079 | Enzimologia | 6 | 2 | Cinética Enzimática — Química Sergipe |
| 2.º | 2.º | 140064303 | Genética Molecular | 6 | 2 | Genética Molecular — Thaisplicando Genética |
| 2.º | 2.º | 140064308 | Microbiologia | 6 | 2 | Microbiologia geral — Antonio Canettieri |
| 3.º | 1.º | 140064286 | Bioinformática | 6 | 2 | Alinhamento de sequências — OnlineBioinfo Bioinformática |
| 3.º | 1.º | 14921115 | Bioquímica Inorgânica | 6 | 1 | Inorganic Chemistry of Life — NPTEL IIT Bombay |
| 3.º | 1.º | 14921086 | Bioquímica Laboratorial | 6 | 1 | Laboratório virtual de Biologia Molecular — UFABC |
| 3.º | 1.º | 140064348 | Aplicações Ambientais de Sistemas Biológicos (opção 3.1.x) | 6 | 0 | — |
| 3.º | 1.º | 14131096 | Biologia do Desenvolvimento (opção 3.1.x) | 6 | 0 | — |
| 3.º | 1.º | 14241061 | Biologia do Desenvolvimento Embrionário (opção 3.1.x; LCBM) | 6 | 2 | EmbriologiaFarmácia2020 — Rodrigo Nunes da Fonseca |
| 3.º | 1.º | 15301094 | Biotecnologia Vegetal (opção 3.1.x) | 6 | 0 | — |
| 3.º | 1.º | 14241063 | Imunologia Humana (opção 3.1.x; LCBM) | 6 | 2 | Imunologia - UNEB — Imunologia UNEB |
| 3.º | 1.º | 14241065 | Neurobiologia (opção 3.1.x; LCBM) | 6 | 2 | Aulas de Neurofisiologia — AldoLucion |
| 3.º | 1.º | 14241058 | Parasitologia e Micologia Médica (opção 3.1.x; LCBM) | 6 | 2 | Parasitologia Humana — Medicina UFMT |
| 3.º | 1.º | 14881205 | Técnicas Avançadas e Qualidade em Análises (opção 3.1.x) | 6 | 0 | — |
| 3.º | 1.º | 15301102 | Tecnologia da Produção Biológica (opção 3.1.x) | 6 | 0 | — |
| 3.º | 2.º | 14921085 | Bioquímica Alimentar | 6 | 1 | Videoaulas - Análise de alimentos — LabBio PPGAN / UNIRIO |
| 3.º | 2.º | 14921117 | Biotecnologia de Células Animais | 6 | 2 | Cell Culture Technologies — Cell Culture Technologies |
| 3.º | 2.º | 14921116 | Genómica Funcional | 6 | 2 | Bioinformática e genômica funcional (MCB485) — NUPEM-UFRJ |
| 3.º | 2.º | 15301090 | Biotecnologia Alimentar (opção 3.2.x) | 6 | 0 | — |
| 3.º | 2.º | 15301100 | Controlo de Qualidade (opção 3.2.x) | 6 | 0 | — |
| 3.º | 2.º | 14241054 | Doenças Metabólicas (opção 3.2.x; LCBM) | 6 | 2 | Fisiopatologia do Diabetes — Profa Tatiana Lavich |
| 3.º | 2.º | 140064304 | Imunologia (opção 3.2.x) | 6 | 0 | — |
| 3.º | 2.º | 15301085 | Introdução à Economia e Gestão (opção 3.2.x) | 6 | 0 | — |
| 3.º | 2.º | 140064345 | Lipidómica Aplicada (opção 3.2.x) | 6 | 0 | — |
| 3.º | 2.º | 15301103 | Processos de Separação (opção 3.2.x) | 6 | 0 | — |
| 3.º | 2.º | 14921118 | Projeto (só Opção 3.2.1) | 12 | 0 | — |
| 3.º | 2.º | 14881211 | Toxicologia Molecular (opção 3.2.x) | 6 | 0 | — |

"opção 3.1.x": Opção 3.1.1 (QAC) e Opção 3.1.2 (QAC). "opção 3.2.x": Opção 3.2.1 (QAC) e Opção 3.2.2 (QAC).
"LCBM": código partilhado com Ciências Biomédicas.

## Playlists

- **Fontes:**
  - a pesquisa da Bioquímica, para as **26 obrigatórias** (50 ligações, 46 playlists);
  - para as **5 opções partilhadas com a LCBM**, as playlists da pesquisa de Ciências Biomédicas para as mesmas UCs
    (10 ligações, 6 alta e 4 média), já verificadas no #66 e publicadas em produção pelo #72. É o mesmo critério da
    Eletrotécnica com as opções partilhadas com a LESTI.
- **Pesquisa no total:** 56 playlists e 60 ligações. Confiança: 22 alta, 35 média e 3 baixa. Idioma: 49 em PT-BR,
  6 em inglês (CrashCourse, NPTEL, Thermo Fisher, Cell Culture Technologies) e 1 em PT-PT (Probabilidades e Estatística
  do Instituto Superior Técnico, MathTutorCascais).
- **No script:** **54 playlists e 57 ligações para 31 UCs** (todas as obrigatórias e as 5 opções partilhadas), só de
  confiança alta (22) ou média (35). As 3 ligações de confiança baixa ficam só no manifesto (`published: false`), como
  no #69; 2 playlists que só aparecem nelas também ficam fora.
- **Reutilização:** 24 das 54 playlists já estão no catálogo (lote da LCBM) e são reaproveitadas pelo ID do YouTube,
  sem duplicado. O script cria 30 playlists novas.
- **Critérios:**
  - a correspondência segue o programa da ficha oficial da UC;
  - só canais do autor original, com pelo menos 4 vídeos;
  - todas confirmadas no YouTube a 18/11/2026, pelo oEmbed (título e canal dono) e pela página da playlist (nº de vídeos).

**Para rever:**
- **Fora do script (confiança baixa):**
  - Fisiologia Animal, 2.ª playlist (Fisiologia Animal Comparada, autor sem credenciais confirmadas);
  - Bioquímica Analítica, 2.ª playlist (canal "Bioquímica Animal" sem autor identificado);
  - Bioquímica Inorgânica, 2.ª playlist (química inorgânica de base da UFMG; continua publicada em Teoria da Ligação
    Química, onde tem confiança alta).
- **Só uma playlist publicada:** Fisiologia Animal, Bioquímica Analítica (cobre espetrometria de massa e proteómica;
  faltam cromatografia e eletroforese de biomoléculas), Bioquímica Inorgânica (só há bioinorgânica em inglês, NPTEL),
  Bioquímica Laboratorial (as aulas práticas da UFPR não têm playlist própria; a única era uma cópia de terceiros) e
  Bioquímica Alimentar.
- **Cálculo II:** a pesquisa não tinha confirmado o programa. A ficha 2026/27 confirma séries numéricas e de potências,
  integrais impróprios e integrais duplos e triplos. Convém confirmar que as duas playlists (Projeto Newton e Cálculo
  Integral) chegam aos integrais múltiplos.
- **Cobertura parcial assinalada na pesquisa:** Bioquímica Estrutural (não há curso de biologia estrutural, cristalografia
  ou RMN em português), Biotecnologia de Células Animais (só material em inglês; não cobre biofármacos nem biorreatores)
  e Introdução à Química Física (a playlist do Prof. Juracy tem 2 clipes de notícias entre 28 vídeos).
- **Sem playlist:** 13 opções e o Projeto (a pesquisa cobriu as obrigatórias).

## Verificação do script

**Dry-run em PostgreSQL 17**, com as tabelas `facodi` reduzidas às colunas usadas. Os casos (a), (b) e (d) partem de
uma base onde já se aplicou o script da LCBM do #66, como está em produção:

| Caso | Resultado |
|---|---|
| (a) Primeira execução, com a LCBM já aplicada | +1 curso (180 ECTS), 44 UCs com 61 colocações, 30 playlists novas e 24 reaproveitadas, 44 relações curso → UC e 57 relações UC → playlist |
| (b) Segunda execução | Não altera nada (idempotente) |
| (c) Outro curso já com `LBQM` | Aborta antes de inserir |
| (d) UCs partilhadas com a LCBM | Ficam `bioquimica-uc-14241054`, `-14241058`, `-14241061`, `-14241063` e `-14241065`; as da LCBM mantêm o slug |
| Base sem a LCBM | 1 curso, 44 UCs, 54 playlists e 57 ligações; os 5 códigos ficam com o slug igual ao código |

**Pré-verificações:**
- as contagens de UCs, colocações, playlists e ligações;
- os 156 ECTS obrigatórios, os 4 grupos (9, 9, 9 e 8 alternativas) e os ECTS de cada opção (6, e 12 no Projeto);
- que nenhuma ligação de confiança baixa entra no script;
- os IDs e URLs das playlists;
- conflitos de curso (código, slug ou ID 1492).

Ao contrário do script da LCBM, este não aborta quando um código de UC já existe noutro curso: as 5 UCs partilhadas
são esperadas.

**Pós-verificação:** confirma o curso publicado, as 44 UCs com colocação e as 57 ligações. Se uma restrição da base que
não está no repositório rejeitar alguma linha (por exemplo, um código de UC único entre cursos, o que hoje não se pode
confirmar porque nenhum código se repete em produção), aborta a importação inteira.

**Vista do plano:** simulada com o `buildUalgSections` do #67 e os dados do manifesto. Os dois primeiros anos têm
30 ECTS obrigatórios por semestre. No 3.º ano, cada semestre mostra 18 ECTS obrigatórios e dois grupos de opção com as
listas do plano: 9 + 9 alternativas no 1.º semestre e 9 (com o Projeto) + 8 no 2.º.

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72):
[`scripts/facodi_ualg_1492_bioquimica_20261118`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1492_bioquimica_20261118/supabase/seeds/facodi_ualg_1492_bioquimica_20261118.sql).
Não é uma migração e não foi aplicado em produção. Depois de aplicado, o build seguinte gera as páginas estáticas do
curso e das UCs e acrescenta-as ao sitemap e ao `llms.txt`.
