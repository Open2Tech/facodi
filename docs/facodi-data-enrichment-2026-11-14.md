# FACODI — enriquecimento documentado do schema (14/11/2026)

## Âmbito

Dados inseridos **apenas no schema `facodi`**, a partir de:
- Cursos/UCs já presentes no próprio schema (importação histórica de `public.courses`/`public.units`);
- Planos oficiais Universidade do Algarve, **ano letivo 2026/27**:
  - [LESTI, código de curso 1941](https://ise.ualg.pt/curso/1941/plano);
  - [Design de Comunicação, código de curso 1454](https://www.ualg.pt/curso/1454/plano);
- Metadados de vídeos efetivamente associados em `facodi.unit_videos`, com catálogo canónico **`public.videos`**;
- Três excertos de transcrição automática já existentes em `public.video_transcripts`.

Não foram feitas alterações às playlists do Tube, nem criada integração Odoo. Não foram inventados alunos, inscrições, progressos, métricas, competências ou resultados de processamento IA.

## Alterações académicas

| Curso | UC no catálogo | Códigos cotejados no plano 2026/27 | Códigos legados ausentes no plano 2026/27 | Ligações de vídeo (pendentes) |
|---|---:|---:|---:|---:|
| LDCOM | 44 | 41 | 3 | 53 |
| LESTI | 45 | 43 | 2 | 356 |
| **Total** | **89** | **84** | **5** | **409** |

- Corrigido o nome do LESTI para *Licenciatura em Engenharia de Sistemas e Tecnologias Informáticas*, de acordo com a designação oficial.
- Preenchidos os nomes das escolas, os URL oficiais e os metadados com referência ao ano letivo 2026/27.
- Corrigidas três incoerências do LESTI, sempre guardando os valores prévios em `metadata.prior_imported_curriculum`:
  - `19411001` Ambientes de Desenvolvimento Colaborativo: 1.º ano, 2.º semestre, 5 ECTS;
  - `19411006` Programação Orientada a Objetos: 5 ECTS;
  - `19411011` Algoritmos e Estruturas de Dados: 2.º ano, 1.º semestre, 5 ECTS.
- Criadas em rascunho duas opções que constam do plano 2026/27 e não estavam no conjunto legado:
  - `19411059` Desenvolvimento de Jogos Digitais (Opção II);
  - `15241279` Automação e Robótica (Opção VII).
- Mantidas para revisão, **sem eliminar**, cinco opções de edições anteriores que não constam do plano 2026/27:
  - LDCOM: `14541164` Geometria Descritiva; `14541166` Língua Estrangeira — Espanhol; `14541190` Produção Gráfica em Design de Comunicação.
  - LESTI: `19411026` Tecnologias e Aplicações para WebSIG; `19411033` Introdução à Robótica.

**ECTS:** a soma de todas as UCs registadas pode superar 180 ECTS porque inclui opções **alternativas**. O título académico exige 180 ECTS e não a soma de todas as opções possíveis. Não usar `SUM(ects)` sem aplicar regras de escolha dos grupos opcionais.

## Grafo e material importado

| Tabela `facodi` | Registos depois da migração | Tratamento |
|---|---:|---|
| `courses` | 2 | Identidade cotejada com fontes oficiais |
| `curricular_units` | 89 | Opções, ano e ECTS oficiais quando confirmados |
| `learning_objects` | 476 | 2 cursos, 89 UCs, 382 vídeos, 3 transcrições; **todos draft** |
| `youtube_videos` | 382 | IDs, títulos, canais, URLs, duração e miniaturas existentes |
| `video_classifications` | 409 | Candidatos editoriais `needs_review`, **sem modelo de IA** |
| `learning_object_relations` | 501 | 89 curso→UC, 409 UC→vídeo proposto, 3 transcrição→vídeo |
| `external_sources` | 468 | Páginas UAlg e URLs YouTube |
| `legacy_object_links` | 473 | Proveniência por UUID das origens |
| `documents` | 3 | Excertos de transcrição automática, não validados |
| `tags` | 11 | Taxonomia controlada; áreas importadas ainda por validar |
| `learning_object_tags` | 942 | Ligações aos temas e estados de curadoria |
| `keywords` | 91 | Títulos reais dos cursos e das UCs |
| `unit_videos` | 409 | Relações pré-existentes conservadas, em `pending_review` |

Todas as ligações UC→vídeo continuam **sugestões de curadoria**. Alguns vídeos não são relevantes para as UCs onde foram originalmente colocados; importar a relação não equivale a confirmá-la. As 382 fichas de vídeo distintas foram copiadas como objetos de conhecimento sem duplicar os registos em `public.videos` (794 disponíveis no Tube).

A base partilhada contém resumos de IA antigos, incluindo exemplos pouco fiáveis ou genéricos. **Esses resumos não foram propagados** como descrições académicas. Também não foram gerados embeddings ou classificações fictícias.

A tabela `facodi.playlists` permanece vazia: exige uma submissão de playlist YouTube verdadeira com autor autenticado. Não usar um autor fictício para preencher essa tabela. O mecanismo de criação de playlists FACODI é independente deste processo.

## Segurança e publicação

- Todos os 476 objetos educativos permanecem `draft` e `published=false`.
- Após se detetar uma publicação inesperada dos cursos/UCs durante as operações, a migração corretiva restaurou **2 cursos e 89 UCs para `draft`/`published=false`**.
- Teste de leitura com papel PostgreSQL `anon`: **0 cursos, 0 UCs, 0 objetos educativos, 0 vídeos FACODI visíveis**.
- **409** classificações com `needs_review=true`, `status='needs_review'`, `model_run_id=NULL`, `confidence=0`/nível `unassessed`. Isto significa ausência de avaliação, não uma confiança calculada.
- Nenhum vídeo ou ligação curricular foi aprovado automaticamente.

O catálogo só deve ser tornado público após revisão dos planos e dos vídeos e da proveniência/licenciamento do conteúdo. A interface FACODI atual só consulta os objetos educativos/UCs existentes; não usa diretamente todas as relações do grafo. É necessária uma fase posterior de interface editorial para os candidatos `video_classifications`.

## Migrações versionadas

- `20261114153714_facodi_ualg_official_course_plan_reconciliation_2026_27.sql`
- `20261114153945_facodi_grounded_course_unit_video_learning_graph.sql`
- `20261114154153_facodi_seed_editorial_video_classification_candidates.sql`
- `20261114154517_facodi_restore_draft_publication_after_enrichment.sql`

As alterações preservam os IDs originais, usam identificadores determinísticos para novas entidades e inserções idempotentes quando aplicável.
