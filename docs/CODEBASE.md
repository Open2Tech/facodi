# Frontend FACODI

React + Vite SPA, Bun, TypeScript e Supabase. Ver [operação e limites](../README.md).

## Camadas

- [src/App.tsx](../src/App.tsx): rotas lazy e guardas de acesso.
- [src/app/providers](../src/app/providers): QueryClient, i18n, Auth, tema, metadata e notificações.
- [src/integrations/supabase](../src/integrations/supabase): cliente único e tipos
  gerados do schema remoto `facodi`, reexportados pelo módulo shared.
- [src/entities/course](../src/entities/course): tipos, APIs e keys do catálogo,
  incluindo as unidades e os objetos educativos associados.
- [src/entities/facodi](../src/entities/facodi): autorização por `app_metadata.role`.
- [src/entities/auth](../src/entities/auth): chamadas ao Supabase Auth nativo
  (conta, mudança de email com reenvio, sessões noutros dispositivos) e
  `authErrorKey()`, que converte códigos de erro Auth em keys i18n; mensagens
  em inglês da API nunca chegam à interface.
- [src/entities/contribution](../src/entities/contribution): submissão de playlists
  (Edge Function `facodi-submit-playlist`), filas de revisão e RPCs
  `review_playlist`/`review_study_blueprint`, e normalização dos percursos gerados.
- [src/entities/notes](../src/entities/notes): caderno de estudo pessoal.
  Contas guardam as notas em `facodi.study_notes` (RLS só do dono, sem acesso
  `anon`, ids gerados no cliente para upsert idempotente); visitantes usam
  `localStorage` (`facodi-notes:v1:guest`). Notas antigas por conta no navegador
  migram uma vez; as de visitante só migram por escolha explícita. Inclui
  ordenação, timestamps, pesquisa sem acentos entre recursos, agrupamento por
  recurso (com `object_type`) e exportação Markdown por recurso ou completa.
- [src/entities/suggestion](../src/entities/suggestion): sugestões de recursos
  (`facodi.resource_suggestions`, RLS do dono e editorial). `recognition.ts`
  replica a normalização de URL e a classificação de licença do trigger SQL só
  para pré-visualização; o servidor grava o `screening` autoritativo.
  `metadata.ts` consulta oEmbed/GitHub/Zenodo com `credentials: 'omit'` e
  devolve `null` em falha (preenchimento manual). A revisão usa a RPC
  `review_resource_suggestion` (4.º parâmetro opcional: UC escolhida pelo
  editor). `parseAnalysis` lê, de forma defensiva, o job consultivo
  `analysis_jobs` (`analyze_resource_suggestion`).
- Análise consultiva de sugestões: um trigger enfileira um job por sugestão;
  o pg_cron (`facodi-suggestion-analysis`, a cada minuto) chama, via pg_net e
  Vault, a Edge Function homónima. Esta lê só metadados públicos (oEmbed do
  YouTube), pede ao Gemini uma escolha estruturada entre até 12 UCs
  pré-filtradas em SQL e grava `result_payload`, com lease, 3 tentativas e
  limite diário (`FACODI_SUGGESTION_AI_DAILY_LIMIT`). Nada é associado ou
  publicado automaticamente. Parar: `select cron.unschedule('facodi-suggestion-analysis')`;
  desativar só a IA: limite `0`. Detalhes em
  [suggest-ai-analysis-plan.md](suggest-ai-analysis-plan.md).
- [src/entities/course](../src/entities/course): catálogo público. `/courses`
  carrega uma vez os cursos públicos (`listPublicCourses`, até 500, com a
  contagem de UCs ativas via embed `curricular_units(count)`) e filtra no
  cliente com `course.catalog.ts`: pesquisa sem acentos em título, código,
  resumo, instituição e escola; idioma-base; e facetas de instituição e tipo de
  curso contadas com os restantes filtros. `degree_type` é texto livre e é
  mostrado tal como está. `/resources`
  usa a RPC `search_public_resources_v4` (SECURITY INVOKER): pesquisa sem
  acentos em título, descrição e temas, com relevância; idioma-base (`pt`
  inclui `pt-BR`); todos os tipos públicos (`published` e estado `active` ou
  `published`); e contagens exatas por tipo para a pesquisa, idioma e tema
  atuais, incluindo a área temática (ignora o filtro de tipo, para manter
  todos os tipos alcançáveis). A página começa pela pesquisa, com atalhos para
  os formatos mais usados; todos os tipos continuam disponíveis em «Mais
  filtros». Idioma, área e temas pesquisáveis ficam nesse painel recolhido;
  os filtros ativos mantêm chips removíveis mesmo quando o painel está
  fechado. A consulta de temas só é montada ao abrir o painel.
  Na primeira página sem filtros, `ResourceDiscovery` reutiliza os hooks
  públicos de módulos e sequências para mostrar uma entrada de cada tipo,
  com erros e estados vazios independentes da biblioteca. Esta descoberta
  deixa de ocupar espaço ao pesquisar, filtrar ou paginar.
  Ver [proposta e limites do explorador](resources-learning-explorer.md).
- [src/entities/sequence](../src/entities/sequence): sequências de estudo
  (playlists editoriais). Leitura pública pelas RPCs
  `list_public_editorial_sequences_v1`, `get_public_editorial_playlist_v2` e
  `list_public_sequences_for_video_v1`; a página de vídeo usa a última para
  ligar à sequência na aula correspondente. `/sequences` pesquisa título,
  descrição e código da UC, filtra idioma (incluindo variantes regionais) e
  pagina com estado na URL. Progresso privado em
  `facodi.editorial_playlist_progress`. O papel
  `authenticated` só pode atualizar `last_position_seconds`/`completed_at`, por
  isso a gravação faz update e, sem linha, insert (sem upsert que reescreva a
  chave). As capas usam `hqdefault` do YouTube.
- [src/features/sequences](../src/features/sequences): consultas públicas e
  `useSequenceProgress` (alternância otimista, posição best-effort, reset).
- [src/features/auth](../src/features/auth): Auth nativo, hidratação, PKCE e
  invalidação de cache na mudança de identidade/papel.
- [src/features/courses/queries](../src/features/courses/queries): TanStack Query
  para catálogo público, conteúdo editorial e contagens administrativas.
- [src/features/contributions/queries](../src/features/contributions/queries):
  TanStack Query para contribuições e revisão editorial, com keys privadas por utilizador.
- [src/features/suggestions/queries](../src/features/suggestions/queries):
  TanStack Query para as sugestões do utilizador e a fila editorial.
- [src/features/notes](../src/features/notes): `useNotebook`/`useResourceNotes`;
  TanStack Query com escrita otimista e rollback para contas,
  `useSyncExternalStore` entre separadores para visitantes; `useNoteActions`
  partilha o feedback de gravação e a eliminação com desfazer.
- [src/components](../src/components): apresentação, formulários e primitivas shadcn.
  [src/components/profile](../src/components/profile) compõe `/profile`: dados da
  conta, segurança e sessões, preferências do navegador e contribuições.
  [src/components/notes](../src/components/notes) compõe o caderno lateral
  não modal (`?notes=open`), a linha de marcos sob o vídeo, o resumo no
  dashboard e a página `/notes` (pesquisa `?q=`, `?tag=` e `?view=` no URL,
  sem indexação). [StudyVideo.tsx](../src/components/resource/StudyVideo.tsx)
  integra o mesmo caderno nos players das unidades e sequências: as notas
  pertencem ao recurso de vídeo, não à página que o incorpora. `?v=` mantém
  a aula selecionada; `?t=` inicia o vídeo nesse instante e é removido ao
  trocar de aula. A troca reinicia o relógio e o formulário; as notas gravadas
  são partilhadas com a página do recurso. O retorno do login mantém a página,
  a aula e o estado do caderno. [youtubeBridge.ts](../src/components/resource/youtubeBridge.ts)
  lê o tempo do embed `youtube-nocookie` via `postMessage` (origem validada) e
  envia `seekTo`; `?t=<segundos>` define o início do vídeo.
  [VideoSequences.tsx](../src/components/sequence/VideoSequences.tsx) mostra
  sequências editoriais que incluem a aula, a posição e o progresso concluído
  privado da conta autenticada.
  [src/components/catalog](../src/components/catalog) partilha a barra de
  pesquisa (`SearchInput` com debounce), os grupos de facetas (linha deslizável
  em mobile com `scroll`) e `ActiveFilters`: total de resultados anunciado e um
  chip removível por filtro do URL, usado em `/resources` e `/sequences`.
  [src/components/suggestion](../src/components/suggestion) mostra o
  reconhecimento por etapas (`useStagedReveal`, sem animação com
  `prefers-reduced-motion`), os sinais de triagem, a escolha da unidade e o
  resultado da análise consultiva (`SuggestionAnalysis`).
- [src/pages](../src/pages): composição das páginas, sem acesso direto a dados.
- [src/shared/lib/validation.ts](../src/shared/lib/validation.ts): validação
  centralizada com Zod; formulários usam React Hook Form.
- [src/shared/lib/preferenceStorage.ts](../src/shared/lib/preferenceStorage.ts):
  idioma (`i18nextLng`) e tema (`facodi-theme`) ficam em `sessionStorage`; só
  passam a `localStorage` depois de o visitante ligar «Lembrar idioma e tema»
  (em `/cookies` e no perfil). Usa sempre este módulo e o `useTheme` de
  [src/shared/theme](../src/shared/theme) em vez de escrever no `localStorage`;
  um novo armazenamento no navegador exige atualizar a política de cookies.
- [src/i18n/locales](../src/i18n/locales): quatro idiomas, um único conjunto de keys.

Consultas públicas têm filtros explícitos mesmo em sessões editoriais.
Consultas editoriais têm keys com identidade, cancelamento e limpeza de cache.
Writes exigem uma linha devolvida; uma atualização sem linha não é tratada como
sucesso. Apenas publicação/arquivamento mudam estados; edição não apaga campos
avançados que não estejam no formulário.

HTML é sanitizado com DOMPurify e allowlist de elementos de texto, sem scripts,
frames, estilos ou eventos. Links para recursos externos só aceitam HTTP(S).

## Páginas legais

`/privacy`, `/terms`, `/cookies`, `/copyright`, `/accessibility` e `/legal`
são rotas públicas renderizadas por
[LegalDocument](../src/components/legal/LegalDocument.tsx). O conteúdo vive
nos locales em `legal.<documento>` (`title`, `description`, `lead`, `summary`,
`sections` com `body`, `items`, `table` ou `facts`); não há CMS nem tabelas
para textos legais. Links no texto usam a sintaxe `[rótulo](/rota#secção)`,
interpretada por [LegalRichText](../src/components/legal/LegalRichText.tsx).
`legalDocuments.test.ts` garante a mesma estrutura nos quatro idiomas e que
as âncoras internas existem. Ao alterar uma política, atualize
`LEGAL_LAST_UPDATED` em
[legalDocuments.ts](../src/components/legal/legalDocuments.ts) e confirme que
o texto continua a corresponder ao funcionamento real (armazenamento no
browser, fornecedores, fluxos de conta). Dados institucionais por confirmar
usam `facts` com `pending: true` e nunca valores provisórios.

## SEO e partilha

[src/shared/seo/seo.ts](../src/shared/seo/seo.ts) é a fonte única de metadados:
descritores por página (`homeMeta`, `courseMeta`, `unitMeta`, `resourceMeta`,
`sequenceMeta`, `staticPageMeta`), builders JSON-LD (`Organization`, `WebSite`,
`BreadcrumbList`, `Course`, `LearningResource`, `VideoObject`, `ItemList`) e
`headTags()`. O módulo é puro (sem `@/` nem APIs do browser) para poder ser
reutilizado por scripts de build. As páginas usam
[PageSeo](../src/components/layout/PageSeo.tsx); estados inexistentes usam
`NoIndex`. O canonical é sempre `https://facodi.com`; o bloco `seo:start/end`
do `index.html` tem de corresponder a `homeMeta` (teste em `seo.test.ts`).
No React 19, o `react-helmet-async` só delega o hoisting ao React e não
deduplica tags: `PageSeo`/`NoIndex` reclamam o head através de `SeoScope`, e o
`FacodiLayout` só emite título, descrição e `robots` por defeito quando nenhuma
página o fez. As tags estáticas da shell (`data-seo-shell`) são removidas no
arranque, em `main.tsx`.

Depois do Vite, `scripts/generate-seo-snapshots.mjs` consulta apenas cursos,
unidades, learning objects e sequências públicos no schema `facodi`, usando
`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (sem service key nem
alterações de base de dados). Escreve um ficheiro `route.html` por rota em
`dist/`; Workers Assets serve `/route` sem redirecionar e a aplicação React
continua a hidratar normalmente. O mesmo conjunto de rotas cria
`dist/sitemap.xml`. O service worker não precacheia snapshots de detalhes. Em
builds de CI com URL `.invalid`, só são gerados snapshots das páginas estáticas.
O build falha com variáveis em falta ou URL inválido, e também quando a RPC de
sequências é truncada ou atinge o limite SQL de 500, pois nesse caso a paginação
HTTP não garante um sitemap completo.
Os dados ficam congelados até ao próximo build; o fallback SPA ainda responde
HTTP 200 a rotas desconhecidas (soft 404).

## Verificação

Testes co-localizados cobrem rotas/papéis, hidratação e limpeza de cache,
contratos Data API, validação, navegação e HTML. MSW simula respostas HTTP,
sem necessidade de utilizadores remotos. Playwright cobre navegação e
responsividade. Estes testes não substituem a matriz RLS com sessões reais.

Após cada push em `facodi`, o workflow de smoke espera pelo check bem-sucedido
da Cloudflare para o mesmo commit e confirma que `/build-revision.txt` serve
esse SHA antes de testar as rotas. O ficheiro é gerado apenas em Workers Builds
com `WORKERS_CI_COMMIT_SHA`, injetado pela própria Cloudflare, e não é guardado
em cache. Um check ausente, falhado ou uma revisão diferente não são sucesso.
O comando local `bun run test:workers:smoke` testa apenas o Worker disponível;
nenhum destes testes substitui a validação de dados no navegador.

## Histórico

O frontend social Tube O2 e o adaptador Odoo foram retirados da árvore ativa.
Documentos em `docs/features/facodi-curriculum*`, assets antigos e o servidor
de metadata descrevem a integração anterior, não a arquitetura FACODI atual.
Não executar/publicar configurações históricas em produção.
