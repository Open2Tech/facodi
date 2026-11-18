# Licenciatura em Marketing, UAlg/ESGHT 1516

**Data:** 2026-11-18
**Manifesto:** `supabase/seeds/facodi_ualg_1516_marketing_20261118.json`
**Script:** [`facodi_ualg_1516_marketing_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1516_marketing_20261118/supabase/seeds/facodi_ualg_1516_marketing_20261118.sql), na branch `scripts/facodi_ualg_1516_marketing_20261118` do fork. Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72).
**Depende de:** #67, já integrado, para a página do curso mostrar os grupos de opção à parte das obrigatórias.

## Identidade

- **Curso:** Licenciatura em Marketing, Escola Superior de Gestão, Hotelaria e Turismo da Universidade do Algarve, curso **1516**.
- **Unidade orgânica:** Escola Superior de Gestão, Hotelaria e Turismo (ESGHT), Campus da Penha.
- **Língua:** português.
- **Duração:** 180 ECTS, 6 semestres.
- **Fontes oficiais:** [apresentação](https://www.ualg.pt/curso/1516) e [plano 2026/27](https://www.ualg.pt/curso/1516/plano).
- **Na FACODI:** código interno `LMKT`, slug `marketing`. Nem o código, nem o slug, nem o ID 1516 existem no catálogo (leitura pública a 18/11/2026).

## Porque este curso

Na pesquisa de playlists para cursos da UAlg ainda fora do site (`facodi/pesquisa/playlists-ualg-2026-11-18`), foi a
segunda melhor cobertura entre os cursos de negócios e comunicação, depois da Economia:
- **As UCs próprias de marketing** (consumidor, estudos de mercado, produto e preço, distribuição, publicidade e meios,
  business intelligence, comércio eletrónico, serviços e marketing relacional) têm aulas em português (FEA-USP, UNIVESP e professores de licenciatura).
- **É da mesma escola que a Licenciatura em Gestão**, que já está no site, e partilha com ela 10 códigos de UC.

## Plano 2026/27

O plano tem **43 UCs**: **33 obrigatórias** (32 de 5 ECTS e o Estágio, de 10 ECTS, no último semestre) e dois grupos de
opção no 3.º ano, cada um com 5 alternativas de 5 ECTS.
- **Opção I**, no 1.º semestre: Gestão e Publicidade em Redes Sociais, Marketing Desportivo, Marketing e Branding Digital, Organização de Eventos e Congressos ou Produtos Financeiros.
- **Opção II**, no 2.º semestre: Empreendedorismo e Inovação, Escrita para a Web e Storytelling, Gestão Estratégica, Inteligência Artificial Generativa Aplicada ou Turismo de Golfe.

Resultado: 170 + 5 + 5 = 180 ECTS, com 30 ECTS em cada semestre.
- **Colocação no plano:** todas as UCs levam `curriculum_placements`, no Tronco Comum. As obrigatórias levam `role: mandatory`. As opções levam `role: alternative`, com o grupo como está no plano ("Opção I" e "Opção II").
- **Nenhuma UC é "Semestral"** e nenhuma aparece em dois grupos, por isso cada UC tem uma só colocação.
- **Ordem:** a ordem das UCs em cada semestre segue a página do plano.
- **Resumos e temas** de cada UC vêm do **programa da ficha oficial 2026/27** (academico.ualg.pt). O URL da ficha, com o link exato da página do plano (`codInstituic=6`), fica em `metadata.official_fuc_url`. As 43 fichas estão publicadas, incluindo a do Estágio.

### Códigos partilhados com a Licenciatura em Gestão

10 UCs deste plano têm o mesmo código que UCs da Licenciatura em Gestão (`LGEST`), já no site, todas com o código como slug:
- **obrigatórias aqui, opções na Gestão:** Gestão e Negociação (15161098), Gestão e Técnica de Vendas (15161102) e Marketing de Serviços (15161047);
- **opções aqui e na Gestão:** Gestão e Publicidade em Redes Sociais (15161110), Marketing e Branding Digital (14181198), Produtos Financeiros (14181095), Empreendedorismo e Inovação (14181168), Escrita para a Web e Storytelling (15161109) e Inteligência Artificial Generativa Aplicada (14181200);
- **opção aqui, obrigatória na Gestão:** Gestão Estratégica (14181093).

**Decisão, como a Eletrotécnica fez com a LESTI:**
- Cada uma tem **registo próprio neste curso**, com a sua colocação e `metadata.official_code_shared_with_course = "LGEST"`.
- O slug leva o prefixo `marketing-uc-` só se o código já for slug de outra UC. Em produção isso acontece às 10, por exemplo `marketing-uc-15161047`. As outras 33 UCs ficam com o código como slug.

| Ano | Sem. | Código | Unidade curricular | ECTS | Playlists | Primeira playlist |
|---|---|---|---|---:|---:|---|
| 1.º | 1.º | 15161078 | Design Gráfico e Comunicação | 5 | 2 | Os Fundamentos do Design - Aprenda os Conceitos de Design — Chief of Design |
| 1.º | 1.º | 15161081 | Fundamentos de Marketing | 5 | 2 | Marketing — Prof. Thiago Meneghel |
| 1.º | 1.º | 15161080 | Gestão das Organizações | 5 | 2 | Introdução à Teoria Geral da Administração · 3ª Edição · Antonio Cesar Amaru Maximiano — GEN Negócios e Gestão |
| 1.º | 1.º | 15161082 | Informática | 5 | 2 | Excel - Funções — Alessandro Trovato |
| 1.º | 1.º | 15161077 | Inglês para Marketing I | 5 | 2 | Inglês para Marketing Digital — KULTIVI seu INGLÊS |
| 1.º | 1.º | 15161079 | Métodos Quantitativos | 5 | 2 | CÁLCULO 1 — Equaciona Com Paulo Pereira |
| 1.º | 2.º | 15161084 | Contabilidade Financeira | 5 | 1 | Rubrica Contabilidade — CERTFORM – Escola de Formação Prática |
| 1.º | 2.º | 15161088 | Economia | 5 | 1 | Introdução à Economia — Fábio Henrique Bittes Terra |
| 1.º | 2.º | 15161087 | Estatística I | 5 | 2 | Eixo de Negócios · Estatística aplicada aos negócios — UNIVESP |
| 1.º | 2.º | 15161083 | Inglês para Marketing II | 5 | 1 | Business English — Learn English with Rebecca · engVid |
| 1.º | 2.º | 15161086 | Política de Produto e de Preço | 5 | 2 | Politica de Produto — Ariana Marketeer |
| 1.º | 2.º | 15161085 | Psicologia Social Aplicada ao Marketing | 5 | 2 | Psicologia Social - aulas — Profa. Josevânia Silva |
| 2.º | 1.º | 15161094 | Comunicação Integrada de Marketing | 5 | 1 | Marketing — Prof. Thiago Meneghel |
| 2.º | 1.º | 15161090 | Contabilidade de Gestão | 5 | 1 | Contabilidade de Gestão — Fátima Explica Gestão |
| 2.º | 1.º | 15161091 | Estatística II | 5 | 2 | Probabilidade e Estatística — Professor Douglas Maioli |
| 2.º | 1.º | 15161089 | Finanças Empresariais | 5 | 2 | Finanças Empresariais — As Explicações do Pontes |
| 2.º | 1.º | 15161095 | Política de Distribuição e Merchandising | 5 | 2 | TRADE MARKETING — Educaline Brasil |
| 2.º | 1.º | 15161093 | Sistemas de Informação para Marketing | 5 | 2 | Eixo de Negócios - Ferramentas de Análise e Business Intelligence — UNIVESP |
| 2.º | 2.º | 15161097 | Comércio Eletrónico | 5 | 2 | Engenharia de Computação · Negócios online – 18º Bimestre — UNIVESP |
| 2.º | 2.º | 15161041 | Comportamento do Consumidor | 5 | 2 | Módulo 4 - Comportamento do consumidor — Fundamentos de Marketing - FEA USP |
| 2.º | 2.º | 15161007 | Direito das Empresas e do Marketing | 5 | 0 | — |
| 2.º | 2.º | 15161046 | Estudos de Mercado | 5 | 2 | Pesquisa de Marketing — Marina Monteiro Garcia |
| 2.º | 2.º | 15161092 | Marketing Digital | 5 | 1 | Marketing Digital do Básico ao Avançado — Welbth Orneles |
| 2.º | 2.º | 15161096 | Publicidade e Planeamento de Meios | 5 | 2 | Planejamento de Mídia — Ivana Duarte Mechailech |
| 3.º | 1.º | 15161100 | Gestão de Recursos Humanos | 5 | 1 | Tecnologias em Processos Gerenciais  · Gestão de Pessoas — UNIVESP |
| 3.º | 1.º | 15161098 | Gestão e Negociação | 5 | 1 | Negociação: O Método Harvard — Rodolfo Araujo |
| 3.º | 1.º | 15161102 | Gestão e Técnica de Vendas | 5 | 0 | — |
| 3.º | 1.º | 15161047 | Marketing de Serviços | 5 | 1 | Marketing de Serviços - 2021/S2 - Graduação - INESP — Prof. Eduardo Bianchi |
| 3.º | 1.º | 15161048 | Simulação de Marketing | 5 | 0 | — |
| 3.º | 1.º | 15161110 | Gestão e Publicidade em Redes Sociais · Opção I | 5 | 2 | MARKETING DIGITAL - Curso Sequencial - Eduardo Tanaka — Prof. Eduardo Tanaka |
| 3.º | 1.º | 15161111 | Marketing Desportivo · Opção I | 5 | 0 | — |
| 3.º | 1.º | 14181198 | Marketing e Branding Digital · Opção I | 5 | 0 | — |
| 3.º | 1.º | 14161160 | Organização de Eventos e Congressos · Opção I | 5 | 0 | — |
| 3.º | 1.º | 14181095 | Produtos Financeiros · Opção I | 5 | 2 | Derivativos e Hedge — Finanças Pragmáticas  ·  Prof. Massa  |
| 3.º | 2.º | 15161099 | Análise de Investimentos | 5 | 2 | Análise de Investimentos — Matemática Financeira UFRGS |
| 3.º | 2.º | 15161052 | Estágio | 10 | 0 | — |
| 3.º | 2.º | 15161051 | Marketing Internacional | 5 | 1 | Negócios Internacionais — Professor Danillo Nogueira |
| 3.º | 2.º | 15161101 | Marketing Relacional | 5 | 1 | Marketing de Relacionamento: Curso Completo em  8 aulas — Líderes em Ação |
| 3.º | 2.º | 14181168 | Empreendedorismo e Inovação · Opção II | 5 | 0 | — |
| 3.º | 2.º | 15161109 | Escrita para a Web e Storytelling · Opção II | 5 | 2 | Copywriting, Storytelling e Narrativa: Como Escrever, Convencer e Construir Autoridade · Jota Gui — KULTIVI sua CARREIRA |
| 3.º | 2.º | 14181093 | Gestão Estratégica · Opção II | 5 | 2 | Tecnologia em processos gerenciais · Planejamento e ferramentas de gestão estratégica — UNIVESP |
| 3.º | 2.º | 14181200 | Inteligência Artificial Generativa Aplicada · Opção II | 5 | 0 | — |
| 3.º | 2.º | 14161242 | Turismo de Golfe · Opção II | 5 | 0 | — |


## Playlists

- **O que o script publica:** **50 playlists em 55 ligações**, para **33 UCs**:
  - **pesquisa de 18/11/2026:** 42 playlists em 47 ligações, para 29 das 33 obrigatórias;
  - **#69:** 8 playlists em 8 ligações, para 4 opções com código partilhado com a Gestão que a pesquisa não cobriu: Gestão e Publicidade em Redes Sociais, Produtos Financeiros, Escrita para a Web e Storytelling e Gestão Estratégica. São as playlists já verificadas e publicadas nas mesmas UCs da Gestão, como a Eletrotécnica fez com três opções da LESTI. A UC tem o mesmo código e a mesma ficha.
- **Retidas no manifesto:** as 3 ligações de confiança baixa ficam só no manifesto, com `"published": false`, para revisão, como no #69. Duas dessas playlists não aparecem noutra UC e ficam fora do script. A terceira, *Inglês para Marketing Digital*, entra por Inglês para Marketing I, onde tem confiança média.
- **Idioma (publicadas):** 43 em PT-BR, 6 em PT-PT (As Explicações do Pontes, Fátima Explica Gestão, CERTFORM, MathTutorCascais, Ariana Marketeer) e 1 em inglês (engVid).
- **Confiança:**
  - publicadas: 20 alta e 35 média;
  - total: 20 alta, 35 média e 3 baixa.
- **Critérios:**
  - a correspondência segue o programa da ficha oficial da UC;
  - só canais do autor original, com pelo menos 4 vídeos;
  - português primeiro, com PT-PT quando existe; direito só com conteúdo português.
- **Verificação:** todas confirmadas no YouTube a 18/11/2026, pelo oEmbed (título e canal dono) e pela página da playlist (nº de vídeos). A playlist de Inglês para Marketing I tem um ID antigo e curto (`PLMbUu4QLDhNM`). A página do YouTube confirma-o como ID canónico.
- **Reutilização:** uma playlist que já exista no catálogo com o mesmo ID do YouTube é reaproveitada, e não duplicada. Hoje já existem 13: as 8 do #69 e mais 5 da pesquisa (Teoria Geral da Administração, Método Harvard, Marketing de Serviços do INESP, Bases das Finanças Empresariais e Negócios Internacionais).
- **Playlists em duas UCs:**
  - Marketing (Prof. Thiago Meneghel): Fundamentos de Marketing e Comunicação Integrada de Marketing;
  - Business English (engVid): Inglês para Marketing I e II;
  - Probabilidades e Estatística (MathTutorCascais): Estatística I e II;
  - Comportamento do Consumidor (Marina Monteiro Garcia): Psicologia Social Aplicada ao Marketing e Comportamento do Consumidor;
  - Finanças Empresariais (As Explicações do Pontes): Finanças Empresariais e Análise de Investimentos.

**Decisão assinalada:** a pesquisa registou *Política de Produto* (Ariana Marketeer) só como "pt". O canal declara Portugal como país e escreve em PT-PT, por isso entra como `pt-PT`.

**Para rever:**
- **Confiança baixa, retidas no manifesto:**
  - Inglês para Marketing II, na 2.ª playlist (*Inglês para Marketing Digital*, KULTIVI);
  - Gestão e Negociação, na 2.ª playlist (*Gestão de Processos*, ProdutividadeMaxima), que é um curso profissional;
  - Simulação de Marketing, na única playlist que tinha (*Plano de Marketing na Prática*). A UC é um jogo de simulação (Cesim SimBrand), sem equivalente em vídeo.
- **Uma só playlist:** Contabilidade Financeira, Economia, Inglês para Marketing II, Comunicação Integrada de Marketing,
  Contabilidade de Gestão, Marketing Digital, Gestão de Recursos Humanos, Gestão e Negociação, Marketing de Serviços,
  Marketing Internacional e Marketing Relacional.
- **Sem playlist:**
  - Direito das Empresas e do Marketing: o programa é direito português e da UE, e só havia direito brasileiro;
  - Gestão e Técnica de Vendas: só havia conteúdo motivacional de vendas, sem gestão da força de vendas;
  - Simulação de Marketing: só tinha a ligação de confiança baixa;
  - o Estágio;
  - 6 opções: Marketing Desportivo, Marketing e Branding Digital, Organização de Eventos e Congressos, Empreendedorismo e Inovação, Inteligência Artificial Generativa Aplicada e Turismo de Golfe.
- **Nível:** Matrizes, Determinantes e Sistemas Lineares (Métodos Quantitativos) é de nível secundário. Excel, Photoshop e Power BI são cursos práticos. Contabilidade e finanças da CERTFORM e Trade Marketing são formação profissional.
- **Gestão de Recursos Humanos:** a playlist da UNIVESP segue o enquadramento laboral brasileiro. Serve só a parte de gestão.
- **Na Gestão, as mesmas UCs têm mais playlists do #69:** Gestão e Negociação (*Negociação, Mediação e Arbitragem*) e Marketing de Serviços (*Service Design*, NNgroup). Aqui ficou só a seleção da pesquisa, como a Eletrotécnica fez com Automação e Robótica. Podem ser acrescentadas, se o Marcelo preferir.

## Verificação do script

O script foi testado num dry-run em PostgreSQL 17, com as tabelas `facodi` reduzidas às colunas usadas:

| Caso | Resultado |
|---|---|
| Primeira execução, com a Gestão já registada (UCs `15161047` e `14181093` com o código como slug) e uma playlist já existente | 1 curso (180 ECTS), 43 UCs, 49 playlists novas mais a existente, 43 relações curso → UC e 55 relações UC → playlist |
| UCs com código partilhado | Marketing de Serviços e Gestão Estratégica deste curso ficam `marketing-uc-15161047` e `marketing-uc-14181093`; as da Gestão não mudam |
| Segunda execução | Não altera nada (idempotente) |
| Outro curso já com `LMKT` | Aborta antes de inserir |

**Pré-verificações:**
- 43 UCs: 33 obrigatórias com 170 ECTS, e Opção I e Opção II com 5 alternativas de 5 ECTS cada;
- uma colocação por UC, no Tronco Comum, coerente com o grupo;
- os IDs, URLs, idiomas e nº de vídeos das playlists, e só ligações de confiança alta ou média;
- conflitos de curso (código, slug ou ID 1516) e slugs `marketing-uc-` já usados por outro curso.

**Pós-verificação:** confirma o curso publicado, as 43 UCs com colocação e as 55 ligações. Se uma restrição da base
que não está no repositório rejeitar alguma linha (por exemplo, código de UC único entre cursos), a pós-verificação
aborta o script inteiro.

**Vista do plano:** foi simulada com o `buildUalgSections` do #67, igual ao que está integrado, e os dados deste manifesto. O 1.º e o
2.º ano mostram 30 ECTS obrigatórios por semestre. O 3.º ano mostra 25 ECTS obrigatórios em cada semestre (com o Estágio no 2.º),
mais o grupo Opção I no 1.º e o Opção II no 2.º, cada um com as cinco alternativas.

## Aplicação

Script para aplicar via Supabase MCP (fora do PR, como pediste no #66/#72):
[`supabase/seeds/facodi_ualg_1516_marketing_20261118.sql`](https://github.com/guguscheidt/facodi/blob/scripts/facodi_ualg_1516_marketing_20261118/supabase/seeds/facodi_ualg_1516_marketing_20261118.sql), na branch `scripts/facodi_ualg_1516_marketing_20261118` do fork.

O PR não tem nenhum ficheiro `.sql`: leva só este documento e o manifesto. O script não foi aplicado em produção.
Só tem as ligações de confiança alta ou média; as 3 de confiança baixa ficam no manifesto com `"published": false`.
O #67, que mostra os grupos de opção na página do curso, já está integrado. Depois de aplicado o script, o build
seguinte gera as páginas estáticas do curso e das UCs e acrescenta-as ao sitemap e ao `llms.txt`.
