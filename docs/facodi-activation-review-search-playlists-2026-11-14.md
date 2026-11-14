# FACODI — ativação de pesquisa, revisão editorial e submissão de playlists

**Data de referência:** 14/11/2026  
**Projeto Supabase:** `wvkjainfwsyiyfcmbtid`  
**Schema:** `facodi`  
**Código:** `Open2Tech/facodi`, branch `facodi`  
**Produção:** https://facodi.vercel.app

## Escopo e resultado

Foram ativados no Supabase o serviço de pesquisa pública paginada, a revisão auditável dos percursos editoriais e a publicação transacional das playlists aprovadas. Na aplicação foram integradas interfaces de pesquisa, submissão de playlists e moderação, guardadas na branch `facodi`. A interface de envio necessita sessão de utilizador real; as interfaces de revisão exigem perfil `editor` ou `admin` no `app_metadata` autenticado.

**Atenção a deploy:** a chamada explícita à API de criação de deploy da Vercel devolveu HTTP 402 / `api-deployments-free-per-day`, indicando limite diário de mais de 100 deploys. A última versão de produção confirmada por `list_deployments` estava em `READY`, no commit `73c8448932a633cd443829ed5d767d62eecb414d`; não se deve presumir que todos os commits subsequentes estão efetivamente publicados, mesmo que estejam no GitHub. GitHub Actions e o deploy da Vercel têm limites/estados independentes. **A validação local de código por CI passou, mas o teste E2E autenticado de utilizadores reais permanece pendente.**

## 1. Pesquisa pública — Supabase

A nova função `facodi.search_public_resources_v2`:

- Recebe texto, idioma, tipo, etiqueta, página e tamanho.
- Usa pesquisa por texto completo em título e descrição e ordenação por relevância, com o índice GIN criado anteriormente.
- Regressa `{total, items}` e limita o tamanho da página a 50.
- É `SECURITY INVOKER`: apenas objetos `published=true AND status='active'`, sem ignorar RLS.
- Está autorizada a `anon` e `authenticated`, mas não consulta dados editoriais privados.
- É utilizada por `listResources()` no frontend quando `search` está preenchido; sem pesquisa, mantém-se a listagem alfabética anterior.

Foi verificada em SQL com papel `anon` e no navegador em:
https://facodi.vercel.app/resources?search=matem%C3%A1tica.

## 2. Revisão editorial — Supabase

`facodi.generated_structures` recebeu `reviewed_by`, `reviewed_at`, `review_note` e índice da fila editorial. As permissões da tabela foram reduzidas: o papel `anon` não tem `SELECT`, `UPDATE`, `INSERT` ou `DELETE`.

A função `facodi.review_study_blueprint(p_id,p_decision,p_note)`:

- É `SECURITY INVOKER`; verifica identidade por `auth.uid()` e papel `editor/admin` apenas em `auth.jwt().app_metadata`.
- Aceita `accepted` e `rejected`, exclusivamente a partir de `draft`, registando a autoria e a data.
- Não publica automaticamente o roteiro, nem altera as fichas dos cursos, UCs ou conteúdos.
- Revoga `EXECUTE` do papel `anon`.
- Passou um teste SQL transacional de editor; o acesso de estudante foi negado. Os testes de escrita foram revertidos.

Frontend em `/editor/study-paths`, protegido por rota editorial e RLS, com fila de rascunhos, aceites e rejeitados. Um registo foi aceite por outra sessão durante o desenvolvimento; este estado foi preservado.

## 3. Submissão de playlists

A Edge Function `facodi-submit-playlist` foi atualizada para **versão 2, ACTIVE, `verify_jwt=true`**; a origem exata `https://facodi.vercel.app` foi acrescentada à allow-list CORS.

A aplicação dispõe da página `/playlists/submit`, protegida por sessão, com:

- Curso e UC publicados, URL de playlist YouTube, título, descrição, limite de 10/25/50/100 vídeos.
- Importação de IDs obtidos do YouTube ou alternativa manual com IDs explícitos; a alternativa manual não comprova pertença à playlist e exige curadoria.
- Histórico pessoal de submissões e respetivo estado.
- Validação estrita dos domínios YouTube, protocolo HTTPS, formato dos IDs e máximo de 100 vídeos.
- Limitação de submissões e controles RLS no backend.

A página `/editor/playlists` mostra a fila de moderação. O editor analisa IDs e ligações ao YouTube, bloqueia aprovação de vídeos não resolvidos e utiliza a RPC `facodi.review_playlist` para aceitar ou rejeitar com nota.

### Publicação transacional após aprovação

A trigger `facodi.publish_approved_playlist_content()` reage à passagem de `pending` para `approved` e, sob identidade/RLS do editor, cria ou atualiza:

- `facodi.learning_objects` para vídeos;
- `facodi.youtube_videos`;
- `facodi.learning_object_relations` publicadas por uma policy específica;
- `facodi.external_sources` e `facodi.learning_object_tags`.

O fluxo não copia o vídeo do YouTube nem cria playlists no `public.playlists` do Tube. O registo marca a revisão editorial e **não** declara que o vídeo foi integralmente visto nem que existe autorização de redistribuição.

Um teste SQL autenticado com `BEGIN … ROLLBACK` submeteu e aprovou uma playlist transacional, e confirmou a criação de um objeto vídeo, uma relação curricular e uma ficha YouTube. Outro teste de autor não editor confirmou `status='pending'` e `import_status='completed'` com o item resolvido. **Nenhuma playlist fictícia foi persistida.**

A policy de `facodi.playlists` foi corrigida para comparar `u.course_id=playlists.course_id`, e uma trigger adicional impede que autores não editores declarem estados de importação não fundamentados nos itens ligados.

## 4. Código, testes e qualidade

Os novos componentes estão no repositório:

- `src/pages/EditorStudyPaths.tsx`
- `src/pages/PlaylistSubmit.tsx`
- `src/pages/EditorPlaylists.tsx`
- `src/entities/facodi-playlists/playlistUtils.ts` e respetivos testes
- `src/entities/course/course.api.ts` (pesquisa pública)
- `src/App.tsx` e textos `src/i18n/locales/{pt,en,es,fr}.json`
- `supabase/functions/facodi-submit-playlist/index.ts`
- `.github/workflows/facodi-validation.yml`

**CI verificado:** a execução [GitHub Actions #13](https://github.com/Open2Tech/facodi/actions/runs/43623658522) passou com sucesso em `456cfbe24d8ba2c3bc5784b04f61923541681608`, incluindo:

1. `bun install --frozen-lockfile`
2. ESLint
3. TypeScript `typecheck`
4. Vitest
5. validação estática dos 13 templates de email FACODI
6. Vite build de produção (com chave de teste pública fictícia no CI, sem acesso administrativo)

Nos testes de frontend, foram corrigidos um bloco de teste mal fechado e um ícone `ListVideo` sem import.

O navegador sem sessão devolveu `login_required` para `/playlists/submit`, `/editor/study-paths` e `/editor/playlists`, como esperado. **Não houve teste de submissão/decisão real com conta autenticada, nem envio de email real**.

## 5. Estado da base durante outras alterações simultâneas

O banco foi modificado por outra sessão no mesmo intervalo de desenvolvimento. À última consulta desta etapa:

| Indicador | Contagem observada |
| --- | ---: |
| Cursos públicos | **3** |
| UCs públicas | **101** |
| Objetos educativos públicos | **733** |
| Vídeos publicados | **564** |
| Leituras externas | **65** |
| Rascunhos editoriais | **103** |
| Percursos aceites | **1** |
| Submissões reais de playlists | **0** |

A alteração paralela incluiu o **CTeSP em Sistemas e Tecnologias de Informação** (17 UCs públicas); esta sessão não removeu nem reverteu esses registos. Estas contagens são um snapshot, não uma restrição permanente de cardinalidade.

## 6. Segurança e limites

- As três funções introduzidas/alteradas neste lote usam `SECURITY INVOKER`, não `SECURITY DEFINER`.
- `anon` não consegue ler os planos internos nem executar a RPC de revisão. Pode usar a pesquisa pública.
- A autorização editorial utiliza `app_metadata.role` e nunca `user_metadata.client_app`; este último é apenas um sinal de apresentação.
- A função de envio de playlists mantém JWT obrigatório. A importação automática de vídeos continua a poder escrever novos registos no catálogo partilhado `public.videos`, mas não altera as playlists do Tube.
- O Security Advisor do Supabase continua com avisos preexistentes: `vector` em `public`, 16 funções `SECURITY DEFINER` acessíveis por `anon`, 26 por `authenticated` e proteção de palavras-passe comprometidas não ativada.
- Os 13 templates FACODI de email **continuam versionados apenas no repositório**; ativá-los indiscriminadamente no Auth partilhado afetaria o Tube O2 e exige isolamento/roteamento testado.
- Existe limite da API de criação manual de deploys da Vercel nesta equipa. Não foi alterada faturação ou subscrição.

## 7. Migrações versionadas

- `20261114172715_facodi_audited_editorial_blueprint_review_least_privilege.sql`
- `20261114172814_facodi_public_search_v2_fulltext_facets_pagination.sql`
- `20261114173837_facodi_editor_approved_playlist_atomic_catalog_publication.sql`
- `20261114174629_facodi_playlist_rls_course_integrity_and_import_state_guard.sql`

### Próxima etapa de qualidade

Fazer uma submissão real e uma revisão editorial controlada com contas autorizadas, verificar que a playlist aprovada aparece na UC correta e avaliar URLs de YouTube indisponíveis/restritas. Reconciliar o estado do último deployment da Vercel com o head do GitHub assim que os limites permitirem, sem contornar controlos de faturação.
