# FACODI — Publicação de percursos Odoo e enriquecimento temático

**Data:** 15 de novembro de 2026  
**Projeto Supabase:** `wvkjainfwsyiyfcmbtid`, schema `facodi`  
**Código:** `Open2Tech/facodi`, branch `facodi`  
**Produção:** https://facodi.com (Cloudflare, sem utilização de Vercel)

## Propósito editorial

A FACODI reutiliza vídeos públicos previamente catalogados no Tube (`public.videos`) e
material já existente em `facodi.youtube_videos`. A arquitetura respeita
`curso → UC → módulo → sequência → vídeo` e distingue a formação oficial da
Odoo dos percursos **independentes e complementares** da FACODI.

A organização foi inspirada no catálogo público **Odoo Learn**,
https://www.odoo.com/pt_BR/slides, especialmente nas categorias oficiais
Human Resources, Accounting and Invoicing, Inventory, Project & Timesheets, Sales,
Services e eLearning. A distinção entre *curso/UC da instituição*, *módulo FACODI* e
*formação oficial Odoo* é intencional: **nenhum dos novos módulos equivale a formação
certificada ou reconhecida pela Odoo, UAlg ou Ifes**. Os vídeos são mantidos no
YouTube original. O conteúdo foi revisto por títulos, autores/canais e adequação
temática; não houve revisão integral das gravações.

## Resumo de operações verificadas

| Indicador | Resultado |
| --- | ---: |
| Vídeos acrescentados a partir de `public.videos` | **40** |
| Desses, vídeos catalogados com canal oficial Odoo | **31** |
| Outros recursos técnicos (Redes, Dev Containers, Python, Low-Code, Web) | **9** |
| Vídeos no catálogo FACODI após a importação | **933 publicados** |
| Registos em `facodi.youtube_videos` | **940** |
| Novas sequências editoriais | **20** |
| Associações vídeo–sequência criadas (sem cópias) | **88** |
| Associações UC–sequência criadas | **38** |
| Novos módulos de estudo | **10** |
| Novas coleções | **1** |
| Referências externas oficiais Odoo Learn | **5** |
| Vídeos com tags atualizadas (72 Odoo e 9 técnicos) | **81** |
| Sequências de RH existentes com tags atualizadas | **5** |
| Total de sequências editoriais públicas | **122** |
| Total de módulos públicos | **77** |
| Total de coleções públicas | **26** |

Nota sobre a versão: alguns vídeos foram publicados por Odoo noutras versões. A
FACODI usa o título *Odoo 19* apenas para o panorama explicitamente identificado como
tal. Os demais percursos têm títulos **Odoo — [tema]** e os metadados
`content_version_verified=false` nos vídeos importados. Não se deve interpretar
a coleção inteira como a transcrição do curso oficial de certificação Odoo 19.

### Sequências de Odoo — 14

1. [Visão geral de um ERP integrado](https://facodi.com/sequences/facodi-odoo19-visao-geral)
2. [Colaboradores e ciclo de vida](https://facodi.com/sequences/facodi-odoo19-rh-colaboradores)
3. [Recrutamento e seleção](https://facodi.com/sequences/facodi-odoo19-rh-recrutamento)
4. [Avaliação de desempenho](https://facodi.com/sequences/facodi-odoo19-rh-desempenho)
5. [Assiduidade, férias e tempo](https://facodi.com/sequences/facodi-odoo19-rh-tempo)
6. [Contratos e remunerações](https://facodi.com/sequences/facodi-odoo19-rh-remuneracao)
7. [Indicações de candidatos](https://facodi.com/sequences/facodi-odoo19-rh-indicacoes)
8. [Frotas](https://facodi.com/sequences/facodi-odoo19-operacoes-frota)
9. [Receção](https://facodi.com/sequences/facodi-odoo19-operacoes-rececao)
10. [Refeições internas](https://facodi.com/sequences/facodi-odoo19-operacoes-refeicoes)
11. [Despesas e refaturação](https://facodi.com/sequences/facodi-odoo19-financas-despesas)
12. [Aprovações operacionais](https://facodi.com/sequences/facodi-odoo19-operacoes-aprovacoes)
13. [Helpdesk e Serviço de Campo](https://facodi.com/sequences/facodi-odoo19-servicos-helpdesk)
14. [API, webhooks e desenvolvimento de aplicações](https://facodi.com/sequences/facodi-tecnologia-odoo-integracoes)

### Sequências de tecnologia — 6

- [Redes — IP, DNS, HTTPS e cloud](https://facodi.com/sequences/facodi-tecnologia-redes-protocolos): LESTI Redes de Computadores e CTeSP Redes e Protocolos Internet
- [Dev Containers e ambientes Python](https://facodi.com/sequences/facodi-tecnologia-dev-containers): LESTI e CTeSP Ambientes de Desenvolvimento Colaborativo
- [Pacotes e executáveis Python](https://facodi.com/sequences/facodi-tecnologia-python-distribuicao): LESTI Programação e CTeSP Complementos de Programação
- [Plataformas Low-Code](https://facodi.com/sequences/facodi-tecnologia-lowcode-plataformas): LESTI Low-Code e LGEST Informática para Gestão
- [React e CMS](https://facodi.com/sequences/facodi-tecnologia-react-navegacao): LESTI/CTeSP Desenvolvimento Web
- [Cloud e deploy](https://facodi.com/sequences/facodi-tecnologia-cloud-ambientes): LESTI/CTeSP Desenvolvimento Colaborativo

## Módulos e coleção

**Coleção central:**
[Odoo — percursos práticos de ERP e gestão](https://facodi.com/resources/facodi-odoo19-percursos-gestao).
Contém sete módulos Odoo e 14 sequências, com associações curriculares e metadados de
proveniência. Também foram criados três módulos de tecnologia (Redes, ambientes
reproduzíveis, plataformas Low-Code/Web) associados às UCs correspondentes.

As referências oficiais foram adicionadas como `external_resource`, não como
conteúdo espelhado:
- [Catálogo Odoo Learn](https://www.odoo.com/pt_BR/slides)
- [Odoo Human Resources](https://www.odoo.com/pt_BR/slides/human-resources-32)
- [Odoo Accounting and Invoicing](https://www.odoo.com/pt_BR/slides/accounting-and-invoicing-19)
- [Odoo Project & Timesheets](https://www.odoo.com/pt_BR/slides/project-timesheets-21)
- [Odoo Inventory](https://www.odoo.com/pt_BR/slides/inventory-24)

## Tags e filtros

A taxonomia tem rótulos temáticos explícitos, evitando depender exclusivamente de
tags genéricas como `youtube` e `recurso-externo`. Os 81 vídeos afetados foram
enriquecidos a partir da origem, dos títulos e das associações aos percursos; a
proveniência original foi preservada. A seleção inclui `odoo`, `erp`,
`recursos-humanos`, `recrutamento`, `avaliacao-desempenho`, `assiduidade`,
`remuneracao`, `contabilidade`, `frota`, `helpdesk`, `redes`,
`dev-containers`, `low-code`, `python`, `cloud` e `react`.

A RPC `facodi.list_public_resource_topics_v1(search, language, object_type, area)`
devolve contagens reais para esses tópicos, considerando a pesquisa e os filtros de
contexto. Tem `SECURITY INVOKER`, acesso somente de leitura, e devolve apenas
objetos com `published=true` e `status='active'/'published'`, excluindo os
aliases canónicos de sequências fundidas. A página `/resources` apresenta
`FacetGroup` traduzido PT/EN/ES/FR para os temas disponíveis. O filtro existente
`?tag=...` continua a usar `search_public_resources_v4`.

O detalhe de uma coleção foi enriquecido para listar também filhos `module`
através de `useLinkedCatalogAssets(id, 'module')`, com navegação para
`/resources/:slug`; as sequências anteriormente suportadas são preservadas.

## Validações realizadas

**Postgres / Supabase (após migrações):**

- 40 vídeos, 20 sequências, 10 módulos, 5 referências externas e 1 coleção foram
  confirmados por contagens específicas de `curation_batch`.
- 88 relações `playlist→video`, 38 relações `UC→playlist` e
  21 relações `collection→module/playlist` foram verificadas.
- Sob `SET LOCAL ROLE anon`: 122 sequências visíveis; 10 aulas em Recrutamento,
  6 em Despesas, 2 em Redes e 4 em Dev Containers; sete módulos ligados à coleção
  visíveis; filtro `odoo` disponível; rascunhos visíveis **zero**.
- Relações órfãs e duplicadas: **zero**.
- `facodi.editorial_playlist_progress`: `anon` sem `SELECT`; nenhuma
  migração de progresso foi efetuada.
- `public.videos` permaneceu com 795 registos.

**Cloudflare (verificação no navegador sem autenticação):**

- [Coleção Odoo](https://facodi.com/resources/facodi-odoo19-percursos-gestao):
  título e descrição corretos, 14 sequências visíveis e aviso de independência.
- [Recrutamento](https://facodi.com/sequences/facodi-odoo19-rh-recrutamento):
  dez aulas na ordem proposta, incluindo recrutamento, anúncios, candidatos,
  entrevistas, contratação e análise.
- [Redes](https://facodi.com/sequences/facodi-tecnologia-redes-protocolos):
  duas aulas visíveis.
- [Filtro Odoo](https://facodi.com/resources?tag=odoo): 104 recursos encontrados;
  botão de Recrutamento reduz a pesquisa para 16 recursos.
- **Validação de módulos concluída numa segunda passagem Cloudflare:** a secção
  "Módulos e percursos desta coleção" apresentou **7 módulos**, além das **14
  sequências**. O módulo [Gestão de Pessoas, Recrutamento e Avaliação](https://facodi.com/resources/facodi-modulo-odoo19-rh-selecao)
  abriu sem autenticação, mostrando três sequências e a referência externa
  "Odoo Learn — Human Resources". Não foram detetados erros de navegação.

Nenhum vídeo foi reproduzido integralmente nem foram auditadas as licenças de
reutilização dos 40 vídeos. Nenhum exercício automático, progresso fictício,
certificação, email ou matrícula foi criado.

## Migrações versionadas

- `20261115230806_facodi_20261115_selected_40_tube_videos_odoo19_hr_and_tech.sql`
- `20261115231122_facodi_20261115_publish_20_odoo19_and_technology_curated_sequences.sql`
- `20261115231415_facodi_20261115_odoo19_independent_learning_modules_and_official_references.sql`
- `20261115231545_facodi_20261115_enrich_81_odoo_and_technical_video_filter_tags.sql`
- `20261115231636_facodi_20261115_public_resource_tag_facets_security_invoker.sql`

**Ficheiros React/TS alterados:**

- `src/features/courses/queries/usePublicResourceTopics.ts`
- `src/integrations/supabase/types.ts`
- `src/pages/Resources.tsx`
- `src/pages/ResourceDetails.tsx`
- `src/i18n/locales/{pt,en,es,fr}.json`

O deployment da Vercel não foi utilizado.
