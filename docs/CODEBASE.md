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
  `review_resource_suggestion`.
- [src/entities/course](../src/entities/course): catálogo público. `/resources`
  usa só a RPC `search_public_resources_v3` (SECURITY INVOKER): pesquisa sem
  acentos em título, descrição e temas, com relevância; idioma-base (`pt`
  inclui `pt-BR`); todos os tipos públicos (`published` e estado `active` ou
  `published`); e contagens exatas por tipo para a pesquisa, idioma e tema
  atuais (ignora o filtro de tipo, para manter todos os tipos alcançáveis).
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
  sem indexação). [youtubeBridge.ts](../src/components/resource/youtubeBridge.ts)
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
  `prefers-reduced-motion`), os sinais de triagem e a escolha da unidade.
- [src/pages](../src/pages): composição das páginas, sem acesso direto a dados.
- [src/shared/lib/validation.ts](../src/shared/lib/validation.ts): validação
  centralizada com Zod; formulários usam React Hook Form.
- [src/i18n/locales](../src/i18n/locales): quatro idiomas, um único conjunto de keys.

Consultas públicas têm filtros explícitos mesmo em sessões editoriais.
Consultas editoriais têm keys com identidade, cancelamento e limpeza de cache.
Writes exigem uma linha devolvida; uma atualização sem linha não é tratada como
sucesso. Apenas publicação/arquivamento mudam estados; edição não apaga campos
avançados que não estejam no formulário.

HTML é sanitizado com DOMPurify e allowlist de elementos de texto, sem scripts,
frames, estilos ou eventos. Links para recursos externos só aceitam HTTP(S).

## Verificação

Testes co-localizados cobrem rotas/papéis, hidratação e limpeza de cache,
contratos Data API, validação, navegação e HTML. MSW simula respostas HTTP,
sem necessidade de utilizadores remotos. Playwright cobre navegação e
responsividade. Estes testes não substituem a matriz RLS com sessões reais.

## Histórico

O frontend social Tube O2 e o adaptador Odoo foram retirados da árvore ativa.
Documentos em `docs/features/facodi-curriculum*`, assets antigos e o servidor
de metadata descrevem a integração anterior, não a arquitetura FACODI atual.
Não executar/publicar configurações históricas em produção.
