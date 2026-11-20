# CTeSP em Contabilidade — Universidade do Algarve (1802)

**Estado do catálogo:** publicado no Supabase de produção em 2026-11-20.  
**Origem curricular:** [Plano oficial UAlg 2026/27](https://www.ualg.pt/curso/1802/plano) · [Apresentação](https://www.ualg.pt/curso/1802)  
**Página FACODI:** https://facodi.com/courses/ctesp-contabilidade  
**Identificadores de curadoria:** `facodi_ualg_1802_contabilidade_20261120` (primeira ronda) e `facodi_ualg_1802_enrichment_20261120_v2` (segunda ronda)

## Âmbito

CTeSP em Contabilidade, Escola Superior de Gestão, Hotelaria e Turismo da Universidade do Algarve, 120 ECTS em 4 semestres (2 anos), regime presencial/noturno, língua portuguesa. O currículo tem 16 unidades curriculares obrigatórias; o estágio final corresponde a 30 ECTS.

| Ano | Sem. | Código da UC | Unidade curricular | ECTS |
|---|---|---|---|---:|
| 1 | 1 | 18021027 | Contabilidade Financeira I | 10 |
| 1 | 1 | 18021026 | Direito Fiscal Aplicado I | 5 |
| 1 | 1 | 18021025 | Informática | 5 |
| 1 | 1 | 18021023 | Matemática Aplicada às Ciências Sociais | 5 |
| 1 | 1 | 18021024 | Técnicas de Expressão Oral e Escrita | 5 |
| 1 | 2 | 18021031 | Contabilidade de Gestão | 5 |
| 1 | 2 | 18021030 | Contabilidade Financeira II | 10 |
| 1 | 2 | 18021032 | Direito Empresarial | 5 |
| 1 | 2 | 18021029 | Direito Fiscal Aplicado II | 5 |
| 1 | 2 | 18021028 | Princípios de Finanças Empresariais | 5 |
| 2 | 1 | 18021036 | Auditoria Contabilística e Fiscal | 5 |
| 2 | 1 | 18021033 | Contabilidade Pública | 5 |
| 2 | 1 | 18021035 | Direito Fiscal Aplicado III | 5 |
| 2 | 1 | 18021034 | Gestão Orçamental | 5 |
| 2 | 1 | 18021037 | Projeto de Simulação Empresarial | 10 |
| 2 | 2 | 18021016 | Estágio | 30 |
| **Total** | | | **16 UCs obrigatórias** | **120** |

## Registos no Supabase

Este catálogo usa exclusivamente tabelas **existentes** no esquema `facodi` do projeto `wvkjainfwsyiyfcmbtid`:

- `courses`: 1 registo `slug='ctesp-contabilidade'`, `external_id='1802'`, `status='active'`, `published=true`.
- `curricular_units`: 16 UCs com respetivos códigos oficiais, ano, semestre e ECTS, também `active/published`.
- `learning_objects`: espelho do curso e das 16 UCs; **35 módulos** de estudo originais FACODI (`facodi-contabilidade-mod-<codigo>-<n>`), **16 guias** (`facodi-contabilidade-guia-<codigo>`), **8 referências externas e 4 vídeos na ronda inicial** de terceiros catalogados, além de materiais preexistentes reutilizados.
- `youtube_videos`: metadados dos quatro vídeos com referência à fonte original.
- `learning_object_relations`: composição curso → UCs → módulos/guias, e associações de vídeos, playlists e fontes externas às UCs/módulos. A estrutura é aditiva e reutiliza objetos existentes (sem duplicar vídeos e sem novas tabelas).

Os **tópicos de estudo, objetivos, atividades ilustrativas e guias** são curadoria FACODI, **não** conteúdo letivo oficial, provas oficiais, certificação, nem fichas de UC. A estrutura e os créditos da matriz curricular são provenientes do plano UAlg 2026/27.

As FUC detalhadas de **2026/27 não foram verificadas integralmente** durante este carregamento. Foram adicionadas ligações diretas por código no campo `metadata.official_fuc_url`, marcadas `detailed_fuc_checked=false`. Para Contabilidade Financeira I e Contabilidade de Gestão também foram registadas referências às FUC **2025/26**, explicitamente assinaladas como pertencendo ao ano anterior: não assumir continuidade de conteúdos ou critérios de avaliação sem comparação com 2026/27.

## Materiais complementares

A curadoria inclui fontes primárias portuguesas, particularmente a [Comissão de Normalização Contabilística](https://www.cnc.min-financas.pt/snc2016.html), [SNC-AP](https://www.cnc.min-financas.pt/sncap2017.html), [CIVA](https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/civa_rep/Pages/codigo-do-iva-indice.aspx), [CIRC](https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/circ_rep/Pages/codigo-do-irc-indice.aspx), [CIRS](https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/codigo-do-irs-indice.aspx), [Diário da República](https://diariodarepublica.pt/dr/home) e [Portal BASE](https://www.base.gov.pt/Base4/pt/o-portal/base/).

Materiais audiovisuais incluem playlists de contabilidade de gestão, cálculo financeiro e Excel, um vídeo de introdução à contabilidade financeira, e vídeos de contabilidade portuguesa com atribuição ao canal original. A seleção foi efetuada por título, descrição pública e correspondência temática; **não constitui revisão integral dos vídeos**. Verificar sempre jurisdição, atualidade fiscal e direitos de reutilização. **Nem todas as UCs têm vídeos específicos verificados**, embora todas tenham um guia e pelo menos um módulo de estudo.

## Acesso público / RLS

O frontend é dirigido por dados. A rota `/courses/:slug` usa `src/entities/course/course.api.ts`; `/modules/:slug` usa `src/entities/module/module.api.ts`. Não são necessárias alterações ao frontend para este novo curso.

As políticas RLS do esquema `facodi` preexistentes exigem marcadores específicos para permitir a leitura pública dos vínculos aprovados. As relações deste lote foram alinhadas **sem alterar políticas**:
- `structured_catalog_import` para estrutura, guias e módulos originais;
- `review_scope='title_and_channel_only'` e `review_status='approved'` para materiais audiovisuais;
- `created_by_mechanism='verified_external_reading_curation'` e `review_scope='external_landing_page'` para referências externas ligadas às UCs.

Nunca substituir a permissão de leitura dos objetos por acesso indiscriminado às relações. Respeitar o modelo definido em `AGENTS.md` e a análise editorial já publicada.

## Auditoria realizada

Em 2026-11-20, consulta direta à base de dados:
- 1 curso, 16 UCs, soma **120 ECTS**;
- 35 módulos e 16 guias criados; **zero módulos sem filhos**;
- 8 novas referências externas e 4 vídeos indexados;
- 102 relações diretas cujos pais são UCs e 86 relações com pais módulos, contabilizando composição + material complementar;
- 204 relações do lote categorizadas por mecanismo/escopo: 127 estruturais, 52 audiovisuais, 25 externas.

**Próximos pontos de qualidade:** verificar acessibilidade das FUC 2026/27 por UC; revisão pedagógica integral dos vídeos, reforço específico de vídeo para Fiscalidade, Comunicação Oral/Escrita, Contabilidade Pública e Estágio, e testes visuais públicos das páginas em desktop e telemóvel. Evitar confundir conteúdos genéricos de fiscalidade brasileira com o direito tributário português.

## Segunda ronda de enriquecimento — 2026-11-20

Esta ronda adicionou materiais complementares **diretamente no Supabase de produção**, sem novas tabelas, migrations, alteração de RLS ou deploy frontend.

### Resultado verificado

| Indicador | Resultado após a segunda ronda |
|---|---:|
| Curso e unidades oficiais | 1 curso, 16 UCs, 120 ECTS |
| Módulos editoriais FACODI | 35, todos reescritos com conceitos, atividade aplicada e erro comum |
| Guias por unidade curricular | 16, todos aprofundados com percurso e fontes |
| Novas fontes externas nesta ronda | 28 |
| Vídeos catalogados nesta ronda | 9 |
| Relações educativas criadas nesta ronda | 205 |
| Relações dos dois lotes | 409 |
| UCs sem ligações | 0 |
| Módulos sem conteúdo associado | 0 |
| Duplicações de vídeos por source_id | 0 |

Os **205 vínculos** adicionais são relações do tipo `contains` entre a UC, os respetivos módulos e os recursos. A contagem representa relações, não recursos educativos únicos. Todos os 205 vínculos ficaram visíveis sob a role `anon` numa consulta SQL de verificação da RLS.

### Fontes mais relevantes, por domínio

- **Contabilidade financeira/SNC:** [CNC — Instrumentos SNC](https://www.cnc.min-financas.pt/Instrumentos_snc2016.html), [CNC — FAQ empresariais](https://www.cnc.min-financas.pt/faqs_empresarial.html), [Universidade Aberta — Contabilidade Financeira](https://guiadoscursos.uab.pt/ucs/contabilidade-financeira/), [Universidade de Coimbra — programa 2026/27](https://apps.uc.pt/courses/PT/unit/93286/23001/2026-2027?common_core=true&id=10622&type=ram), [Centro de Estudos Judiciários — Princípios de Contabilidade Financeira e Fiscal](https://cej.justica.gov.pt/LinkClick.aspx?fileticket=3tRxHlXPvwk%3D&portalid=30).
- **Contabilidade de gestão:** [OCC — contabilidade geral e analítica](https://www.occ.pt/pt-pt/noticias/contabilidade-geral-contabilidade-analitica). O sistema reutiliza a playlist existente “Contabilidade de Gestão” de Fátima Explica Gestão.
- **Fiscalidade portuguesa:** [AT — declaração periódica do IVA](https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/questoes_frequentes/pages/faqs-00612.aspx), [AT — SAF-T (PT)](https://info.portaldasfinancas.gov.pt/pt/apoio_ao_contribuinte/Negocios/Faturacao/SAF_T_PT/SAF_T_PT_Versao_PT/Paginas/default.aspx), [OCC — catálogo de formação](https://www.occ.pt/pt-pt/catalogo-formacao). Reutilização das playlists previamente verificadas “Impostos? Eu explico” (OCC) e “IRS” (Autoridade Tributária).
- **Contabilidade pública:** [DGAL — SNC-AP](https://www.portalautarquico.dgal.gov.pt/pt-PT/financas-locais/snc-ap/), [CNC — FAQ setor público](https://www.cnc.min-financas.pt/faqs_publico.html), [SISAL](https://portalautarquico.dgal.gov.pt/pt-PT/servicos-on-line/sisal/).
- **Informática:** [Excel — suporte Microsoft](https://support.microsoft.com/pt-pt/excel/), [AT — SAF-T](https://info.portaldasfinancas.gov.pt/pt/apoio_ao_contribuinte/Negocios/Faturacao/SAF_T_PT/SAF_T_PT_Versao_PT/Paginas/default.aspx).
- **Direito empresarial:** [IRN — criar uma empresa](https://registo.justica.gov.pt/Empresas/Criar-uma-empresa), [IRN — escolher contabilista](https://justica.gov.pt/Como-criar-uma-empresa-online/Escolher-o-contabilista-certificado).
- **Comunicação profissional:** [UAlg — guia de trabalhos escritos e apresentações](https://sapientia.ualg.pt/entities/publication/318aff5e-ac26-48a1-83a0-e1cd5bdf1757), [Universidade Aberta — técnicas de expressão e comunicação](https://guiadoscursos.uab.pt/ucs/tecnicas-de-expressao-e-comunicacao-i/), [UAlg — normas para relatórios técnicos](https://sapientia.ualg.pt/entities/publication/25be8603-7b2f-4277-b2b0-67c732b5c9dc).
- **Estágio:** [UAlg ESGHT — gabinete e recursos oficiais](https://esght.ualg.pt/servicos-10), incluindo guia e regulamento institucional para CTeSP.

As páginas externas são **ligações e referências**; não foram importados ficheiros PDF ou textos protegidos de terceiros. Materiais históricos são rotulados com o respetivo ano. A entrada `Manual de Técnicas de Expressão e Comunicação` da Universidade Aberta possui página bibliográfica pública, mas o repositório classifica o acesso ao manual como **restrito**; o catálogo marca explicitamente esta limitação.

### Vídeos adicionais

Nove vídeos públicos sobre demonstrações financeiras, rácios, descontos, IVA, adiantamentos, remunerações, IRC 2026 e comunicação oral foram indexados com `source_id` original. Parte das vídeo-aulas sobre contabilidade é da CERTFORM e inclui promoção de formação paga nas descrições. **Não** apresentar essas formações pagas como aulas integrais gratuitas; apenas o vídeo público é tratado como recurso complementar.

Esta curadoria avaliou títulos, canais e descrições públicas, **não a transcrição ou visualização integral de cada vídeo**. Os conteúdos fiscais podem tornar-se obsoletos. Nenhum destes vídeos é oficialmente atribuído à UAlg. Não houve duplicação de `source_id` nos vídeos.

### Estado de validação e próximos passos

- Consultas em produção confirmaram estrutura, contagens, zero órfãos, e leitura das 205 relações pela role `anon`.
- As FUC de **2026/27** não foram integralmente recuperadas; as descrições editoriais são hipóteses de percurso, não programas oficiais.
- **Contabilidade Pública e Contabilidade de Gestão** têm fontes e playlists/recursos documentais relevantes, mas ainda não receberam uma vídeo-aula individual nova verificada sobre cada tópico.
- Não foi possível validar visualmente as rotas em `https://facodi.com` por falha de acesso do navegador web usado para consulta. Essa limitação não invalida o teste de dados/RLS.
- Não alterar as políticas de segurança nem duplicar o mesmo material em cada UC: as relações são a fonte de verdade. Ajustar correspondências mediante avaliação editorial efetiva.

## Terceira ronda — auditoria editorial, correções e vídeo-aulas (2026-11-20)

**Identificador:** `facodi_ualg_1802_editorial_qa_20261120_v3`. As correções foram feitas diretamente no Supabase em produção. Não foram criadas tabelas, migrations, novas permissões ou alterações ao frontend.

### Auditoria de fontes oficiais

- [Plano oficial UAlg do CTeSP de Contabilidade, 2026/27](https://www.ualg.pt/curso/1802/plano): confirmou 16 UCs obrigatórias, 120 ECTS, regime noturno, presencial e ESGHT.
- [Apresentação oficial UAlg](https://www.ualg.pt/curso/1802): foram enriquecidos os metadados do curso com o perfil profissional e as licenciaturas relacionadas que a universidade enumera para candidatura com dispensa de prova de ingresso (Gestão, Gestão Hoteleira, Marketing e Turismo). A elegibilidade individual depende das regras vigentes; não é promessa de admissão.
- **Regulamento de estágio CTeSP:** foi corrigida a URL do recurso `facodi-cont-20261120-ref-estagio-reg`. A ligação anterior ao PDF não estava acessível; a ESGHT publica o [Despacho RT.14/2022](https://www.esght.ualg.pt/sites/default/files/inline-files/despachort14-2022---regulamento-estagio-ctesp_atualizado.pdf), que contém as normas de plano, acompanhamento e relatório de estágio. O regulamento de 2022 substitui o de 2017, mas deve ser confirmado se existem revisões posteriores.
- **IVA:** foi substituído o endereço ambíguo `faqs-00612.aspx` da referência `facodi-cont-20261120-ref-dp-iva` por [FAQ da declaração periódica de IVA — preenchimento (`faqs-00933.aspx`)](https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/questoes_frequentes/pages/faqs-00933.aspx). Nesta página já constam esclarecimentos relativos a regras de 2026, sujeitos a atualização.
- As duas alterações mantiveram os mesmos IDs de `learning_objects` e todas as relações existentes. A proveniência e as URLs antigas ficaram no campo `metadata`.

### Novos vídeos e reutilização

| UC | Vídeo e autor | Vídeo de origem |
|---|---|---|
| Contabilidade de Gestão (`18021031`) | **Contabilidade de Gestão na Prática: Quanto Custa Mesmo o que Vendes?** — Fátima Explica Gestão (2025) | [Gy7UY5uZBZA](https://www.youtube.com/watch?v=Gy7UY5uZBZA) |
| Contabilidade de Gestão (`18021031`) | **Método Direto de Apuramento de Custos de Produção** — Fátima Explica Gestão (2023) | [hNKxWjrtLo8](https://www.youtube.com/watch?v=hNKxWjrtLo8) |
| Contabilidade Pública (`18021033`) | **SNC-AP: Uma Visão Prática Do Normativo** — Incurso Capital Humano, com Célia Custódio (2025) | [5kkmer2aCEA](https://www.youtube.com/watch?v=5kkmer2aCEA) |

Os três vídeos foram encontrados em páginas públicas indexadas, com canal, título e tema confirmado. Foram associados às UCs e aos módulos pertinentes por dez relações `contains`, sem duplicações e sem replicar media de terceiros. **A visualização integral e verificação de transcrição não foram efetuadas**, pelo que `full_video_reviewed=false`; a aprovação editorial corresponde a `review_scope='title_and_channel_only'`, não à certificação de exatidão de toda a aula. O vídeo sobre custeio também inclui divulgação de formação paga do próprio canal — apenas o vídeo de acesso público foi catalogado.

### Verificações depois da publicação

- `facodi.youtube_videos`: três novos registos com `status='published'`, associados aos objetos de aprendizagem publicados.
- Consulta sob `SET LOCAL ROLE anon`: **3 vídeos + 10 relações** visíveis, preservando o acesso às 16 UCs.
- Soma curricular: **16 UCs / 120 ECTS**, inalterada.
- Cobertura direta após esta ronda: Contabilidade de Gestão **2 vídeos e 1 playlist**; Contabilidade Pública **1 vídeo e 7 fontes externas**.
- Teste visual das rotas em `facodi.com` ainda não foi concluído: a ferramenta de consulta da página não conseguiu abri-la, embora o teste de RLS tenha passado.
- A leitura detalhada de todas as FUC de **2026/27** continua pendente; não preencher lacunas académicas com suposições. A eventual indisponibilidade temporária do portal não equivale a inexistência das fichas.

**Prioridades editoriais seguintes:** revisão pedagógica individual de vídeos e ligações, validação das FUC 2026/27, reforço com aulas realmente específicas em Direito Fiscal Aplicado I, Informática e Contabilidade Pública; corrigir materiais antiquados antes de criar mais objetos.


## Quarta ronda — vídeos, recursos introdutórios e marcação de FUC não verificadas (2026-11-20)

**Lote:** `facodi_ualg_1802_quality_20261120_v4`. Carregamento direto no Supabase de produção, sem migrations, novas tabelas, alterações a RLS ou deploy frontend.

### Novos conteúdos e fontes

| Área de aplicação | Material | Referência |
|---|---|---|
| Informática e Simulação Empresarial | TABELA DINÂMICA no EXCEL: como criar, configurar e personalizar — Edu Tognon (2024) | [YouTube `xNvxfQprGvo`](https://www.youtube.com/watch?v=xNvxfQprGvo) |
| Informática e Simulação Empresarial | Como formatar segmentação de dados no Excel — Edu Tognon (2023) | [YouTube `oIZ_KPyBgqI`](https://www.youtube.com/watch?v=oIZ_KPyBgqI) |
| Direito Fiscal Aplicado I e II | MUDA num minuto — Autoridade Tributária e Aduaneira: IVA Automático — MUDA (2024), com participação de Cláudia Dias da AT | [YouTube `U3PBUBLDauo`](https://www.youtube.com/watch?v=U3PBUBLDauo) |
| Direito Fiscal, Matemática Aplicada | Impostos diretos e indiretos: aplicação de IRS e IVA — #EstudoEmCasa / DGE / RTP | [Página do recurso](https://estudoemcasaapoia.dge.mec.pt/recurso/impostos-diretos-e-indiretos-atividades-de-aplicacao-irs-e-iva) |
| Contabilidade Pública, Gestão Orçamental, Direito Fiscal | Receitas e despesas públicas — #EstudoEmCasa / DGE | [Página do recurso](https://estudoemcasaapoia.dge.mec.pt/recurso/receitas-e-despesas-publicas) |
| Contabilidade Pública, Gestão Orçamental | Como elaborar o Orçamento do Estado — #EstudoEmCasa / DGE | [Página do recurso](https://estudoemcasaapoia.dge.mec.pt/recurso/como-elaborar-o-orcamento-do-estado) |
| Direito Fiscal e Simulação Empresarial | Portal de cidadania fiscal, tutoriais e atividades — Autoridade Tributária e Aduaneira | [Portal institucional](https://info.portaldasfinancas.gov.pt/pt/Cidadania/O_que_fazemos/Paginas/default.aspx) |

**Cuidado editorial:** as aulas de Excel são sobre ferramentas genéricas, não regras contabilísticas portuguesas. O vídeo MUDA explica a funcionalidade de IVA Automático em 2024 e não substitui instruções e regras de fiscalidade vigentes em 2026. Os recursos DGE destinam-se originalmente ao ensino secundário e funcionam aqui como introdução, não como substituição das unidades curriculares da ESGHT. Os links são conservados com autoria e metadados, sem reprodução de conteúdo externo.

### Contagens confirmadas

- 3 novos objetos `video`, também indexados em `youtube_videos`;
- 4 novas referências externas;
- 17 vínculos temáticos diretos com unidades curriculares e 17 com módulos: **34 relações** novas no lote;
- 16 guias de estudo atualizados com índice de fontes ligado à realidade após este lote;
- **453 relações** nos quatro lotes do CTeSP (204 iniciais, 205 da segunda ronda, 10 da terceira e 34 desta quarta);
- Todas as **16 UCs** possuem pelo menos um vídeo diretamente associado, mais referências e percurso editorial;
- `SET LOCAL ROLE anon`: 3 vídeos, 4 referências e 34 relações novas visíveis; curso acessível sob role pública;
- Curso preserva **16 UCs e 120 ECTS**, 35 módulos, 16 guias e zero duplicações por `source_id` de vídeo.

### Qualidade das FUC de 2026/27

A **matriz oficial do curso** foi confirmada em [UAlg — Plano de Estudos](https://www.ualg.pt/curso/1802/plano). A construção das 16 URLs `academico.ualg.pt/netpa/doc?...anoLectivo=202627...` foi mantida como **padrão de ligação ainda não validado**, pois as páginas não puderam ser recuperadas pelo mecanismo público disponível, mesmo após pesquisa dirigida por código de UC.

Em `facodi.curricular_units.metadata`, foram colocados os marcadores:
- `fuc_202627_status='not_verified_by_public_retrieval'`;
- `official_fuc_url_status='pattern_link_unverified'`;
- `fuc_202627_access_attempted_at='2026-11-20'`;
- `curriculum_plan_independently_verified=true`.

Não afirmar que as FUC inexistem, que foram verificadas ou que o seu programa detalhado coincide com os módulos editoriais FACODI.

**Próximos passos:** obter as FUC por fonte institucional ou acesso autorizado, verificar conteúdos dos vídeos para além de metadados públicos e testar a apresentação em desktop/telemóvel no frontend `facodi.com` por navegador autenticado adequado.
