# Licenciatura em Ciências Biomédicas, UAlg 1915

**Data:** 2026-11-18
**Migração:** `supabase/migrations/20261118190000_facodi_ualg_1915_ciencias_biomedicas_20261118.sql`
**Manifesto:** `supabase/seeds/facodi_ualg_1915_ciencias_biomedicas_20261118.json`

## Identidade

- **Curso:** Licenciatura em Ciências Biomédicas, Universidade do Algarve, curso **1915**.
- **Unidade orgânica:** Faculdade de Medicina e Ciências Biomédicas.
- **Área temática:** Ciências e Tecnologias da Saúde.
- **Língua:** português.
- **Duração:** 180 ECTS, 6 semestres.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1915) e [plano 2026/27](https://www.ualg.pt/curso/1915/plano).
- **Na FACODI:** código interno `LCBM`, slug `ciencias-biomedicas`.

## Porque este curso primeiro

Na pesquisa de playlists para cursos da UAlg ainda fora do site (`facodi/pesquisa/playlists-ualg-2026-11-18`),
foi o curso com melhor correspondência:
- **Todas as 31 UCs obrigatórias têm playlist.**
- **O plano organiza o corpo humano por sistemas orgânicos funcionais**, que é onde há mais aulas de graduação em português (Unicamp, USP, UFRGS, UFMT, UFBA).
- **Nenhuma UC depende de legislação portuguesa.**
- **Complementa a Psicologia e o Mestrado em Neurociências**, que já estão no site.

## Plano 2026/27 e playlists

São 40 UCs: 31 obrigatórias, **Opção I** (escolher 1 de 3, com 3 ECTS), **Opção 2** (escolher 1 de 5, com 3 ECTS) e
**Projeto** (15 ECTS). Resultado: 174 + 3 + 3 = 180 ECTS.
- **As UCs de opção** entram como alternativas, como já se faz na Psicologia e na Gestão: `is_elective_option`, `official_option_group` e `curriculum_placements` com `role: alternative`.
- **Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27** (academico.ualg.pt). O URL da ficha fica em `metadata.official_fuc_url`.

| Ano | Sem. | Código | Unidade curricular | ECTS | Playlists | Primeira playlist |
|---|---|---|---|---:|---:|---|
| 1.º | 1.º | 14241044 | Bioestatística | 4 | 2 | Bioestatística aplicada à saúde — Moacir Pereira Junior |
| 1.º | 1.º | 14241045 | Bioética | 3 | 1 | Curso de Bioética — Maria Clara Dias |
| 1.º | 1.º | 14241040 | Biologia Celular | 6 | 2 | Biologia Celular e Molecular - Profa. Dra. Cristiane Matte/U — CRISTIANE MATTE |
| 1.º | 1.º | 19151009 | Histologia | 4 | 2 | Histologia Básica: Dominando os 4 Tecidos Fundamentais. Aula — Prof Roberval Moraes - MedAulas |
| 1.º | 1.º | 14241042 | Matemática | 6 | 2 | Projeto Newton | Cálculo 1 | 2026-2 — Projeto Newton - UFPA |
| 1.º | 1.º | 14241041 | Química Geral | 6 | 2 | Química Geral para o Ensino Superior — Prof. Caio - Química |
| 1.º | 2.º | 14241048 | Bioquímica | 6 | 2 | BIOQUÍMICA: ESTRUTURA, PROPRIEDADES E FUNÇÕES DE BIOMOLÉCULA — QUÍMICA - A CIÊNCIA CENTRAL NA UFABC |
| 1.º | 2.º | 14241049 | Estrutura e Função dos Compostos Orgânicos | 4 | 2 | Organic Chemistry — CrashCourse |
| 1.º | 2.º | 14241047 | Sistemas Orgânicos Funcionais 102 – Aparelho Digestivo | 6 | 2 | Sistema Digestório — Anatomia Unicamp |
| 1.º | 2.º | 14241057 | Sistemas Orgânicos Funcionais 103 – Aparelho Urinário | 6 | 2 | Sistema Urogenital — Anatomia Unicamp |
| 1.º | 2.º | 14241051 | Sistemas Orgânicos Funcionais 201 – Aparelho Circulatório e Respiratório | 6 | 2 | Sistema Circulatório: Cardiovascular e Linfático — Anatomia Fácil com Rogério Gozzi |
| 1.º | 2.º | 14241071 | Genética do Desenvolvimento (Opção I) | 3 | 0 | — |
| 1.º | 2.º | 19151004 | Práticas de Investigação Molecular (Opção I) | 3 | 0 | — |
| 1.º | 2.º | 14241075 | Técnicas Básicas de Laboratório (Opção I) | 3 | 0 | — |
| 2.º | 1.º | 19151011 | Aplicações em Histologia | 3 | 1 | Histologia Sistêmica para Medicina e Área da Saúde - Curso C — Prof Roberval Moraes - MedAulas |
| 2.º | 1.º | 14241069 | Epidemiologia | 3 | 2 | Epidemiologia e Saúde Coletiva — Prof. Mario Gandra |
| 2.º | 1.º | 14241055 | Fundamentos de Microbiologia Médica | 6 | 2 | Microbiologia Médica — Teoria da Medicina |
| 2.º | 1.º | 19151012 | Sistemas Orgânicos Funcionais 202 – Sistema Endócrino, Reprodução e Desenvolvimento | 5 | 2 | Fisiologia Endócrina — Fisiologia Virtual |
| 2.º | 1.º | 14241053 | Sistemas Orgânicos Funcionais 301 – Sistema Nervoso e Sentidos Especiais | 6 | 2 | Neuroanatomia — Jamary Oliveira Filho |
| 2.º | 1.º | 19151010 | Tópicos de Física para Ciências Biomédicas | 4 | 2 | Física para ciências biológicas - Alonso — Antonio Alonso |
| 2.º | 2.º | 14241054 | Doenças Metabólicas | 6 | 2 | Fisiopatologia do Diabetes — Profa Tatiana Lavich |
| 2.º | 2.º | 14241056 | Genética Molecular | 6 | 2 | Genética Molecular — Thaisplicando Genética |
| 2.º | 2.º | 14241058 | Parasitologia e Micologia Médica | 6 | 2 | Parasitologia Humana — MEDICINA UFMT |
| 2.º | 2.º | 14241046 | Sistemas Orgânicos Funcionais 101 – Sistema Músculo-Esquelético | 6 | 2 | Aparelho Locomotor — Anatomia Unicamp |
| 2.º | 2.º | 14241059 | Tecnologia de Cultura de Células Animais | 6 | 2 | Cell Culture Technologies — Cell Culture Technologies |
| 2.º | 2.º | 19151013 | Aplicações em Bioestatística (Opção 2) | 3 | 0 | — |
| 2.º | 2.º | 19151000 | Bases Moleculares de Neurodegeneração (Opção 2) | 3 | 0 | — |
| 2.º | 2.º | 19151001 | Fundamentos Anatómicos, Fisiológicos e Evolutivos nas Perturbações Psíquicas (Opção 2) | 3 | 0 | — |
| 2.º | 2.º | 19151030 | Inteligência Artificial em Biomedicina (Opção 2) | 3 | 0 | — |
| 2.º | 2.º | 14241160 | Modelos Animais em Investigação Biomédica (Opção 2) | 3 | 0 | — |
| 3.º | 1.º | 14241061 | Biologia do Desenvolvimento Embrionário | 6 | 2 | EmbriologiaFarmácia2020 — Rodrigo Nunes da Fonseca |
| 3.º | 1.º | 14241062 | Genética Humana | 6 | 2 | Genética Médica — MEDICINA UFMT |
| 3.º | 1.º | 14241063 | Imunologia Humana | 6 | 2 | Imunologia - UNEB — Imunologia UNEB |
| 3.º | 1.º | 14241065 | Neurobiologia | 6 | 2 | Aulas de Neurofisiologia — AldoLucion |
| 3.º | 1.º | 14241064 | Terapia Génica e Celular | 6 | 2 | Cátedra Darcy Fontoura de Almeida - Terapias Avançadas — Colégio Brasileiro de Altos Estudos da UFRJ |
| 3.º | 2.º | 14241156 | Epigenética | 4 | 2 | ABC Epigenética — genoma USP |
| 3.º | 2.º | 14241154 | Farmacologia Molecular | 4 | 2 | Farmacocinetica e Farmacodinâmica — Profa Tatiana Lavich |
| 3.º | 2.º | 14241066 | Fundamentos de Bioinformática | 4 | 2 | Alinhamento de sequências — OnlineBioinfo Bioinformática |
| 3.º | 2.º | 14241124 | Projeto | 15 | 0 | — |
| 3.º | 2.º | 14241155 | Sistemas Orgânicos Funcionais 302 – Sistema Tegumentar, Regulação da Temperatura, Integração | 3 | 2 | Dermatologia (Sistema Tegumentar): Pele e Anexos — Anatomia Fácil com Rogério Gozzi |

As UCs de opção e o Projeto ainda não têm playlists. A pesquisa cobriu só as obrigatórias.

## Playlists

- **Volume:** 60 playlists para 31 UCs.
- **Idioma:** 52 em PT-BR, 7 em inglês (CrashCourse, iBiology, Khan Academy Medicine, Thermo Fisher, NPTEL), 1 em PT-PT.
- **Confiança:** 23 alta, 36 média, 1 baixa.
- **Critérios:**
  - a correspondência segue o programa da ficha oficial da UC;
  - só canais do autor original, com pelo menos 4 vídeos;
  - preferência por professores e universidades identificados.
- **Verificação:** todas foram confirmadas no YouTube a 18/11/2026, pelo oEmbed (título e canal dono) e pela página da playlist (nº de vídeos).
- **Uma playlist que já exista no catálogo com o mesmo ID do YouTube** é reaproveitada, e não duplicada.

**Para rever:**
- **Confiança baixa:** Epigenética, na 2.ª playlist.
- **Uma só playlist:** Bioética (conteúdo teórico brasileiro) e Aplicações em Histologia (cobre histologia de órgãos, não a técnica laboratorial).
- **Canal sem autor identificado:** "Facilitando a Medicina" é usado em algumas entradas e ficou com confiança média.

## Verificação da migração

Foi feito um dry-run em PostgreSQL 17, com as tabelas `facodi` reduzidas às colunas usadas:

| Caso | Resultado |
|---|---|
| Primeira execução | 1 curso (180 ECTS), 40 UCs, 60 playlists, 40 relações curso → UC e 60 relações UC → playlist |
| Segunda execução | Não altera nada (idempotente) |
| Outro curso já com `LCBM`, o slug ou o ID 1915 | Aborta antes de inserir |
| Playlist já registada com o mesmo ID do YouTube | É reaproveitada |

As pré-verificações confirmam:
- a contagem de UCs e de ECTS;
- os IDs e URLs das playlists;
- que nenhum código de UC pertence a outro curso.

A pós-verificação confirma o curso publicado, as 40 UCs e as 60 ligações.

## Aplicação

A migração não foi aplicada em produção. Fica para o fluxo habitual de migrações do projeto. Depois de
aplicada, o build seguinte gera as páginas estáticas do curso e das UCs e acrescenta-as ao sitemap e ao `llms.txt`.
