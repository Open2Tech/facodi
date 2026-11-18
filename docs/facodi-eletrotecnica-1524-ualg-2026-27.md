# Licenciatura em Engenharia Eletrotécnica e de Computadores, UAlg/ISE 1524

**Data:** 2026-11-18
**Script de dados:** fora do PR, como pediste no #66/#72, na branch [`scripts/facodi_ualg_1524_eletrotecnica_computadores_20261118`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1524_eletrotecnica_computadores_20261118/supabase/seeds/facodi_ualg_1524_eletrotecnica_computadores_20261118.sql) do fork, para aplicar via Supabase MCP. O PR só tem este doc e o manifesto.
**Manifesto:** `supabase/seeds/facodi_ualg_1524_eletrotecnica_computadores_20261118.json`
**Depende de:** #67 (já mergeado), para a página do curso mostrar os ramos e os grupos de opção.

## Identidade

- **Curso:** Licenciatura em Engenharia Eletrotécnica e de Computadores, Instituto Superior de Engenharia da
  Universidade do Algarve, curso **1524**.
- **Duração:** 180 ECTS, 6 semestres.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1524) e [plano 2026/27](https://www.ualg.pt/curso/1524/plano).
- **Na FACODI:** código interno `LEEC`, slug `engenharia-eletrotecnica-computadores`.
- **Nome:** não existe na UAlg um curso chamado "Engenharia Elétrica e Eletrónica". O curso correspondente é este.

## Plano 2026/27 com ramos

- **1.º ano comum (60 ECTS):** análise matemática, álgebra linear, física, análise de circuitos, programação, tecnologias
  de eletricidade, computação física, medidas elétricas, sistemas digitais e técnicas de comunicação.
- **2.º e 3.º anos:** o curso divide-se em dois ramos.
  - **Telecomunicações, Eletrónica e Computadores:** algoritmos e estruturas de dados, bases de dados, eletromagnetismo, eletrónica,
    microprocessadores, telecomunicações, sinais e sistemas, comunicações digitais e redes.
  - **Energia e Automação:** automação e robótica, eletrotecnia aplicada, controlo automático, eletrónica de potência,
    energias renováveis, máquinas elétricas, produção e transporte de energia e instalações elétricas.
- **ECTS por ramo:** 155 ECTS obrigatórios (1.º ano incluído) mais três grupos de opção: Opção I (5), Opção II (5) e
  Opção III (estágio ou projeto, 15). Total: 180.

Modelo: **55 UCs distintas, cada uma com um único registo**, e **116 colocações** em `curriculum_placements`
(ramo, ano, semestre, papel e grupo), como já se faz na Psicologia e no Mestrado em Neurociências. Por exemplo,
Algoritmos e Estrutura de Dados é obrigatória no 2.º ano do ramo de Telecomunicações e opção no 3.º ano do ramo de
Energia. Com o #67, a página do curso mostra um seletor de ramo, e o tronco comum aparece nos dois.

**Decisões assinaladas nos metadados:**
- **UCs oferecidas nos dois semestres.** Álgebra Linear, Análise Matemática I e II, e Projeto de Instalações Elétricas I no ramo de Energia aparecem nos dois semestres do plano. Ficam no semestre que fecha 30 ECTS: AL e AM I no 1.º, AM II e PIE I no 2.º, com `offered_in_both_semesters: true`.
- **UCs partilhadas com a LESTI** (Automação e Robótica, Laboratório IoT, Jogos Digitais, Computação Reconfigurável, Low-Code). Têm registo próprio neste curso. Se o código já for slug de uma UC de outro curso, o slug recebe o prefixo `eletrotecnica-uc-` (por exemplo, `eletrotecnica-uc-19411031`).
- **Áreas CI, EA e EE.** Os estágios e projetos das três áreas entram com o nome do plano. As siglas não são expandidas.

**Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27**. O URL de cada ficha fica em
`metadata.official_fuc_url`, exceto nos estágios e projetos das áreas CI e EE, que não têm ficha publicada.

## Playlists

- **Cobertura:** a pesquisa tem 83 playlists e 85 ligações para 44 das 55 UCs. O script publica **80 playlists e 82 ligações para 42 UCs**: as 3 ligações de confiança baixa (Projeto de Instalações Elétricas I e II) ficam só no manifesto (`published: false`), para revisão, como no #69. Entram todas as obrigatórias dos dois ramos menos essas duas, mais 3 opções partilhadas com a LESTI, que reaproveitam as playlists já publicadas pelo #69.
- **Idioma:** 82 em PT-BR e 3 em inglês.
- **Confiança:** 48 alta, 34 média, 3 baixa.
- **Critérios:**
  - a correspondência segue o programa da ficha oficial;
  - só canais do autor original, com pelo menos 4 vídeos;
  - todas confirmadas no YouTube a 18/11/2026 (oEmbed e página da playlist).
- **Reutilização:** uma playlist já registada com o mesmo ID do YouTube é reaproveitada.

**Para rever:**
- **Fora do script (confiança baixa):**
  - Projeto de Instalações Elétricas I e II ficam sem playlist publicada. As instalações elétricas em Portugal seguem as RTIEBT e os regulamentos de redes de baixa tensão e de postos de transformação, e não há aulas abertas portuguesas. As playlists brasileiras cobrem os conceitos, não a regulamentação.
- **Só uma playlist:** Projeto de Instalações Elétricas I, Energias Renováveis e Sistemas de Telecomunicações I.
- **Sem playlist:** 11 opções, estágios e projetos (Low-Code, Domótica, Introdução aos Sistemas Operativos,
  Complementos de Bases de Dados e Infraestruturas de Telecomunicações, mais os 6 estágios e projetos). A pesquisa cobriu as obrigatórias.

## Verificação

**Dry-run em PostgreSQL 17**, com as tabelas `facodi` reduzidas às colunas usadas:

| Caso | Resultado |
|---|---|
| Execução com a LESTI já registada (UC `19411031`) | 1 curso (180 ECTS, 2 ramos), 55 UCs, 80 playlists e 82 ligações; o Laboratório IoT deste curso fica `eletrotecnica-uc-19411031` |
| Segunda execução | Não altera nada (idempotente) |
| Outro curso já com `LEEC` | Aborta antes de inserir |

**Pré-verificações:**
- as contagens;
- os 155 ECTS obrigatórios por ramo;
- as playlists;
- conflitos de curso.

**Pós-verificação:** confirma o curso, as 55 UCs com colocação e as 82 ligações. Se uma restrição da base que não está
no repositório rejeitar alguma linha (por exemplo, código de UC único entre cursos), a pós-verificação aborta a
importação inteira.

**Vista do plano:** foi simulada com o `buildUalgSections` do #67 e os dados deste manifesto. Em cada ramo, o 1.º e o
2.º ano somam 30 ECTS por semestre. O 3.º ano tem 25 ECTS obrigatórios no 1.º semestre e 10 no 2.º, mais os grupos
Opção I e II (com as listas do plano em cada semestre) e a Opção III (estágio ou projeto).

## Aplicação

O script não foi aplicado em produção. Aplica-se via Supabase MCP, como no #69, depois do merge do #67. Depois de aplicada, o build gera as
páginas do curso e das UCs, que entram no sitemap e no `llms.txt`.
