# FACODI — Auditoria e enriquecimento de metadados de vídeos

**Data:** 15/11/2026  
**Projeto:** Supabase `wvkjainfwsyiyfcmbtid`, schema `facodi`  
**Código/migrações:** `Open2Tech/facodi`, branch `facodi`  
**Âmbito:** metadados, proveniência e contexto de estudo; **sem upload, rehosting, cópias ou republicação de ficheiros**.

## Decisão sobre licenças do YouTube

Segundo a [ajuda oficial do YouTube](https://support.google.com/youtube/answer/2797468), **Standard YouTube License** é o valor predefinido para uploads, mas o autor pode selecionar **Creative Commons Attribution**. Um vídeo público **não está automaticamente em domínio público**, nem existe autorização genérica para copiar, editar, redistribuir ou alojar o ficheiro fora do YouTube.

Os [termos do YouTube](https://www.youtube.com/t/terms) permitem utilização por funcionalidades da própria plataforma, nomeadamente o player incorporável, **sujeito à disponibilidade e restrições do vídeo**. Em cada `youtube_videos.metadata.youtube_platform_policy` foram registados:

- `default_upload_license=standard_youtube_license`, como **política geral da plataforma**, não como tipo de licença individual verificado;
- `individual_video_license=not_verified`;
- `permitted_usage=youtube_watch_link_or_official_embed_when_enabled`;
- `embed_enabled_per_video=not_checked`;
- `license_for_rehosting_or_redistribution=not_established`;
- links para a ajuda de licenças e para os termos.

Nos `learning_objects.metadata` ficaram os campos equivalentes, com
`content_license_verified=false` onde anteriormente não havia evidência. As declarações de licença preexistentes e os dados declarados por submetedores não foram sobrescritos. Nenhum vídeo passou a ser rotulado como Creative Commons ou reutilizável independentemente do YouTube.

## Fonte dos dados e regras de qualidade

As alterações resultam da união por **ID canónico do YouTube** com os dados existentes da própria FACODI, `public.videos`, sugestões semânticas de `public.ai_enrichments`, relações aprovadas `curricular_unit→video` e caminhos aprovados `curricular_unit→playlist→video`.

Não foram criadas descrições fictícias do autor. A coluna `facodi.youtube_videos.description` continua dedicada à **descrição original**, enquanto `facodi.learning_objects.description` armazena texto editorial da FACODI quando necessário. As sugestões de IA têm origem e estado **não revisto** explicitamente registados; não foram importadas transcrições nem tratados resumos automáticos como verdade confirmada.

### Quatro migrações aplicadas e versionadas

1. `20261115232814_facodi_20261115_youtube_license_policy_thumbnails_languages.sql` — política de uso da plataforma, thumbs de fallback e idioma inferido.
2. `20261115232947_facodi_20261115_educational_context_keywords_ai_proposals.sql` — palavras-chave, contexto curricular direto e de sequências, e tags propostas pela IA.
3. `20261115233114_facodi_20261115_indirect_curricular_context_and_source_traceability.sql` — relação indireta às UCs por playlists e correspondência exata com `public.videos`.
4. `20261115233236_facodi_20261115_enrich_two_standalone_youtube_link_submissions.sql` — completude de dois recursos **link-only** sem convertê-los em objetos de vídeo canónicos.

Cada migração foi testada antes de ser aplicada numa transação com `ROLLBACK`.

## Indicadores antes / depois

| Indicador | Antes | Depois |
| --- | ---: | ---: |
| Registos canónicos `facodi.youtube_videos` | 940 | 940 |
| Objetos `learning_objects` de tipo vídeo | 942 | 942 |
| Objetos vídeo publicados | 933 | 933 |
| Vídeos canónicos sem thumbnail `default` | 155 | **0** |
| Vídeos canónicos com idioma `und` | 92 | **5** |
| Objetos vídeo sem palavras-chave | 792 | **0** |
| Objetos vídeo sem tags | 2 | **0** |
| Objetos vídeo sem descrição editorial | 10 | **0** |
| Sem duração original do vídeo | 558 | 558 |
| Sem descrição original do autor em `youtube_videos` | 762 | 762 |
| Com política YouTube documentada | 0 nesta taxonomia | **940** |
| Com contexto curricular **direto** validado | — | **851** |
| Com contexto curricular **indireto** por sequência validada | — | **516** |
| Com correspondência `public.videos` por ID exato | — | **657** |
| Com propostas temáticas de IA recuperadas | — | **579** |

Das associações indiretas, **79 vídeos** não tinham associação curricular direta alguma. A relação indireta não é reivindicação de que o vídeo faça parte oficial do programa curricular da UAlg ou do Ifes.

**Nota sobre os 155 thumbnails:** foram construídos URLs de imagem seguindo o padrão público
`https://i.ytimg.com/vi/<youtube-id>/hqdefault.jpg`. Este é um **fallback inferido**, não um teste de disponibilidade ou licença das imagens. A origem consta em `thumbnail_origin`.

**Nota sobre os 87 idiomas:** foram inferidos a partir de títulos e canais com padrão altamente consistente (80 `pt`, 7 `en`), não confirmados com metadados da API oficial. Cinco permanecem indefinidos.

## Exemplos do enriquecimento

- **Create Job Positions | Odoo Recruitment** passou a explicitar caminhos indiretos para a UC de **Gestão de Recursos Humanos** (LGEST) e **Gestão de Pessoas — 3º ano** (Ifes), por meio da sequência editorial de Recrutamento. As palavras-chave incluem os temas das UCs e do percurso.
- **Every Networking Concept Explained In 20 Minutes** passou a identificar os caminhos até **Redes de Computadores** (LESTI) e **Redes e Protocolos Internet** (CTeSP STI), através da sequência pública de Redes.
- **Integrais Duplas — Coordenadas Polares #02** conserva a relação direta com Análise Matemática II, com palavras-chave contextuais e sugestões de IA `calculo`/`matematica`, assinaladas como não verificadas.

## Garantias verificadas após publicação

- **0** relações educativas órfãs e **0** pares de relação duplicados.
- **933** vídeos públicos visíveis em leitura anónima; **0** rascunhos expostos.
- A aula de Redes continua numa sequência pública com 2 vídeos; Recrutamento Odoo com 10.
- `facodi.editorial_playlist_progress` permaneceu com **16 registos no momento do teste**; `anon` continua sem permissão de `SELECT`.
- O schema `public` não foi modificado: `public.videos` permaneceu com **795** registos.
- Os dois itens originais sem linha em `facodi.youtube_videos` mantêm-se como `external_reference_link_only`: um recurso Jellyfin publicado e um vlog em rascunho; as declarações dos submetedores foram preservadas.

## Melhorias futuras possíveis

- Atualizar metadados **originais** (duração, descrição, data e idioma declarado) apenas com a API YouTube Data API ou a informação verificável do criador; manter `null` quando não existirem.
- Verificar por vídeo `embeddable`, disponibilidade, restrições geográficas e licença específica pela API oficial, sem assumir que todos são incorporáveis.
- Criar revisão editorial humana para as propostas de tags da IA, usando uma taxonomia FACODI consistente antes de promovê-las para filtros públicos.
- Tornar explícita no frontend a distinção entre **descrição do criador** e **contextualização educativa FACODI**, evitando atribuição indevida.
