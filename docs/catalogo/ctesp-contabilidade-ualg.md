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

