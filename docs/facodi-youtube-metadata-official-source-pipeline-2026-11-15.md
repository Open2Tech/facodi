# FACODI — Verificação de fontes e preparação da sincronização oficial do YouTube

**Data:** 15/11/2026  
**Schema:** `facodi` do projeto Supabase `wvkjainfwsyiyfcmbtid`  
**Código:** branch `facodi` de `Open2Tech/facodi`  
**Produção:** `facodi.com` em Cloudflare (sem Vercel)

## Objetivos e resultados

O foco deste avanço foi melhorar **fontes verificáveis**, a capacidade de pesquisa de recursos não-vídeo e o mecanismo de sincronização futura de metadados originais do YouTube — sem substituir os autores, assumir licenças Creative Commons ou alterar a publicação de vídeos.

| Melhoria realizada | Resultado |
| --- | ---: |
| Registos históricos em `youtube_video_metadata_checks` reconciliados | **191** |
| Desses, verificações `youtube_watch_page_opengraph` | **187** |
| Verificações por índice de editor/publicador | **4** |
| IDs de canal preenchidos por correspondência exata e única a `youtube_channels` | **4** |
| Recursos não-vídeo com `keywords` inicialmente vazias, enriquecidos | **187** |
| Referências externas abrangidas | **145** |
| Playlists abrangidas | **22** |
| Coleções abrangidas | **16** |
| Documentos em rascunho abrangidos (sem publicar) | **3** |
| Curso abrangido | **1** |
| Objetos `learning_objects` que continuam sem keywords | **0** |

Não foram alteradas as contagens de vídeos publicados, as relações de aulas/UCs, os registos de progresso, as permissões de utilizadores ou o schema `public`.

### Verificações da fonte

`facodi.youtube_video_metadata_checks` tinha 191 verificações anteriores com data, método, título e thumbnail observados, mas os campos eram pouco visíveis nos metadados de cada objeto. A migração transferiu somente **referências e proveniência** para `youtube_videos.metadata.source_metadata_check` e `learning_objects.metadata.source_title_thumbnail_verification`.

Estes dados verificam apenas **título e thumbnail segundo a fonte e o método registados**, sem pretender provar que o vídeo foi visto por inteiro, que continua disponível hoje, que pode ser incorporado ou que tem licença livre. Os títulos observados coincidiam com os títulos já guardados, portanto não se alteraram.

Quatro entradas de vídeo sem `channel_id` foram reconciliadas a partir de IDs de canais já existentes em `facodi.youtube_channels`, exigindo correspondência única por título. Os restantes `channel_id` desconhecidos não foram inventados.

### Pesquisa dos restantes recursos

Os 187 objetos sem keywords receberam um array ordenado e deduplicado de palavras presentes em **título, tags já publicadas e domínio de origem**. Termos editoriais pouco úteis (como `recurso-externo`, `youtube` ou `facodi`) foram filtrados; a origem está assinalada em `keywords_source`. Não foram criados cursos, material curricular, transcrições, matrículas ou exercícios.

A atualização incluiu três documentos de transcrição ainda **não publicados**. Manteve-se o respetivo estado privado.

## Infraestrutura de metadados existente e cuidados

Existem Edge Functions V2, incluindo `v2_fetch_youtube_metadata` e `v2_ingest_youtube_video`. A implementação analisada de `fetchYouTubeMetadata` usa OpenGraph/oEmbed e preenche `language='pt'` mesmo sem confirmação. Na etapa `runFetchYoutubeMetadata`, `youtube_videos` recebe `status='metadata_ready'` e campos da fonte, o que **não é seguro executar em massa sobre recursos já publicados** sem uma revisão de comportamento e testes. A implementação V2 também referencia `facodi.video_artifacts`, que não foi encontrada nesta auditoria SQL.

**A Edge Function preexistente não foi executada nem modificada em produção.** Foi preparada uma via mais conservadora na branch `facodi` para posterior sincronização oficial.

Tentei criar uma issue de manutenção no repositório, mas a API GitHub devolveu `410 Issues has been disabled in this repository`. Esta secção preserva o diagnóstico até ser possível registar a tarefa noutro sistema de acompanhamento.

## Sincronização oficial — código preparado

- [`scripts/enrichment/youtube-data-api-sync.mjs`](../scripts/enrichment/youtube-data-api-sync.mjs) — consulta `videos.list(part=snippet,contentDetails,status)`, máximo 50 IDs por chamada, pré-visualização por defeito e gravação somente com `--apply`;
- [`scripts/enrichment/youtube-data-api-utils.mjs`](../scripts/enrichment/youtube-data-api-utils.mjs) — validação de campos oficiais, duração ISO 8601 e merge seletivo;
- [`scripts/enrichment/youtube-data-api-utils.test.mjs`](../scripts/enrichment/youtube-data-api-utils.test.mjs) — testes Node de parsing, preservação de descrição/idioma e separação de licença/incorporação;
- [`scripts/audits/facodi_youtube_metadata_integrity.sql`](../scripts/audits/facodi_youtube_metadata_integrity.sql) — auditoria SQL de leitura, testada na base.

### Como executar em ambiente servidor autorizado

Definir `YOUTUBE_API_KEY`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` **apenas em ambiente seguro**, nunca no React/Cloudflare cliente ou no repositório. Utilizar:

```bash
node --test scripts/enrichment/youtube-data-api-utils.test.mjs
node scripts/enrichment/youtube-data-api-sync.mjs --limit=50
node scripts/enrichment/youtube-data-api-sync.mjs --apply --limit=50
```

A primeira execução é **somente leitura**. A terceira linha faz a sincronização, mas **não foi executada nesta sessão**. O código verifica `updated_at` antes de alterar um registo, preserva `status`, keywords, organização editorial e progresso e não despublica vídeos ausentes de uma resposta. Atualiza campos de publicação/duração/descrição apenas com dados presentes na resposta oficial e regista o tipo de licença e a permissão de incorporação numa estrutura `metadata.youtube_data_api_v3` separada. **Não** trata uma incorporação permitida como prova de reprodução em todos os países ou dispositivos.

### Limitações atuais

As credenciais necessárias à execução da YouTube Data API não estavam disponibilizadas neste fluxo de execução, e o plugin de dados de vídeo estava sem créditos. Não foram feitas chamadas autenticadas oficiais e não se afirma que os 558 vídeos sem duração, 762 sem descrição original ou 940 sem data de publicação foram corrigidos.

Os testes unitários Node foram **criados mas não executados** nesta sessão; a auditoria SQL foi executada e aprovada. É necessária validação num ambiente servidor antes de executar o sincronizador com `--apply`.

A política do YouTube sobre armazenamento de dados da API exige atualização ou eliminação de determinados dados **até 30 dias**; o sincronizador seleciona itens com 25 ou mais dias desde a última consulta. Devem existir operações regulares de refresh para garantir conformidade, além de validação de quota. O método [`videos.list`](https://developers.google.com/youtube/data/reference/rest/v3/videos/list) tem custo anunciado de 1 unidade por chamada; utilizar batches até 50 IDs.

**Fontes oficiais:**
- [YouTube Data API — videos.list](https://developers.google.com/youtube/data/reference/rest/v3/videos/list)
- [YouTube Data API — propriedades de vídeo, licença e embeddable](https://developers.google.com/youtube/data/reference/rest/v3/videos)
- [YouTube API Services — Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
