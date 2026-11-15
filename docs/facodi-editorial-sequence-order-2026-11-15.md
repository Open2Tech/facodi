# FACODI — Editor seguro de ordenação de videoaulas

**Data:** 15/11/2026  
**Ambiente:** [FACODI Cloudflare](https://facodi.com)  
**Frontend:** `Open2Tech/facodi`, branch `facodi`  
**Supabase:** projeto `wvkjainfwsyiyfcmbtid`, schema `facodi`

## Objetivo

Permitir que editores ajustem a ordem de uma sequência de videoaulas **sem scripts SQL manuais**. A operação não altera a seleção dos vídeos, progressos pessoais, origem de cada aula, pertenças curriculares ou licenças.

Rota de edição: [`/editor/sequence-order`](https://facodi.com/editor/sequence-order). O acesso está protegido por `ProtectedRoute(required="editor")`; o servidor faz verificação independente através de `auth.uid()` e `facodi.is_facodi_editor()` (role em `app_metadata`).

## Experiência de edição

1. Pesquisar uma sequência editorial publicada e selecioná-la na lista.
2. Consultar o título, número de aulas e revisão atual do conteúdo.
3. Reorganizar as aulas arrastando os itens ou pelos botões **Subir/Descer** (usáveis por teclado e ecrãs táteis).
4. Inspecionar a **pré-visualização** das posições modificadas e consultar o endereço público da sequência.
5. **Descartar** para voltar à ordem original ou **Guardar ordem**, com confirmação e descrição do impacto para os leitores.
6. Após gravação, atualizar as consultas editoriais e públicas do React Query. Se a revisão tiver mudado, apresentar aviso de conflito e exigir recarregamento da nova ordem.

As etiquetas e instruções estão em PT/EN/ES/FR.

## API Supabase

A migração `facodi_editorial_video_sequence_reorder_atomic_optimistic_20261115` cria duas funções `SECURITY INVOKER`:

- `facodi.get_editorial_sequence_order_v1(p_slug text)` → objeto JSON com `id`, `slug`, `title`, `revision` e `items` ordenados;
- `facodi.reorder_editorial_sequence_v1(p_playlist_id uuid, p_expected_revision integer, p_expected_order uuid[], p_new_order uuid[])` → JSON `{ changed, revision, count }`.

São ambas concedidas apenas ao role PostgreSQL `authenticated`, sem `EXECUTE` para `anon`/`PUBLIC`; além disso, o código recusa quem não tiver permissões editoriais. As tabelas continuam protegidas pelas suas políticas RLS.

### Limites e concorrência

- Somente `playlist` editorial publicado, ativo, FACODI-owned, não sendo um alias de uma sequência fundida.
- Exige uma **permutação completa**, com 2–200 aulas, sem IDs duplicados, nulos, acrescentados ou omitidos.
- Bloqueia a linha da sequência e as suas relações dentro de uma transação PostgreSQL, comparando a revisão esperada e toda a lista antiga de IDs com o estado atual.
- Alterações em paralelo não podem sobrescrever silenciosamente uma revisão antiga: rejeição com `order_conflict` ou `sequence_membership_changed`.
- Na gravação, atualiza apenas `learning_object_relations.position` e metadados de auditoria, incrementando `learning_objects.metadata.editorial_order_revision`.
- Não altera `facodi.editorial_playlist_progress`, `facodi.study_module_progress`, o vídeo canónico, legendas, autorizações do YouTube ou as relações com UCs e cursos.
- Uma ordem idêntica devolve `changed=false`, sem incremento de revisão.

### Testes realizados

| Cenário | Resultado |
| --- | --- |
| Visitante anónimo invoca RPC de edição | Negado (sem `EXECUTE`) |
| Utilizador autenticado sem papel editor lê/altera a ordem | Negado pela validação interna |
| Editor lê sequência e muda duas aulas | Aceite |
| Reutilização de revisão anterior | Rejeitada com conflito |
| Repetição de vídeo numa nova ordem | Rejeitada por permutação inválida |
| Transação de teste de alterações editoriais | `ROLLBACK`; nenhuma ordem de produção alterada |
| Abertura da página no Cloudflare sem login | Redirecionada para `/login?next=/editor/sequence-order` |
| Login com conta de teste autorizada (sem guardar password) | Acesso editorial permitido |
| Sequência Álgebra Linear no navegador | Sete aulas e ordem esperada |
| Subir um vídeo e descartar | Pré-visualização correta e ordem restaurada; nenhuma gravação |

Foi acrescentado `src/entities/sequence/sequence-order.test.ts` com testes Vitest do algoritmo de movimentação e de contagem de posições alteradas. **O ficheiro de testes foi versionado, mas não foi executado via CI/local nesta sessão**; a execução efetiva deve ser validada pelo pipeline Cloudflare/GitHub.

## Ficheiros modificados

- `src/pages/EditorSequenceOrder.tsx` — página editorial de reordenação;
- `src/entities/sequence/sequence-order.ts` — algoritmo puro;
- `src/entities/sequence/sequence-order.test.ts` — testes unitários;
- `src/App.tsx` — rota protegida;
- `src/pages/Editor.tsx` — atalho da gestão editorial;
- `src/integrations/supabase/types.ts` — assinaturas da API;
- `src/i18n/locales/{pt,en,es,fr}.json` — traduções;
- `supabase/migrations/20261115222417_facodi_editorial_video_sequence_reorder_atomic_optimistic_20261115.sql`.

## Gestão de alterações e melhorias futuras

Os testes existentes fazem a pré-visualização com a ordem ainda **não guardada**. Um próximo aperfeiçoamento poderá incluir histórico editorial persistente de versões, reversão controlada e alteração guiada de conjuntos de vídeos, mas deve manter a separação entre a ação de **reordenar** e operações mais complexas de **adicionar/remover** aulas.

A implantação continua exclusivamente no **Cloudflare**; Vercel não foi utilizada. Nenhuma mensagem de email foi enviada e nenhuma alteração à ordem pública foi aplicada durante o teste do browser.
