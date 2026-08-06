# FACODI Studio Fields

Create only after a read-only `fields_get`/Studio capability check confirms the technical name is free. All fields use the `x_studio_` namespace.

## `slide.channel`

| Technical name | Label | Type | Purpose |
| --- | --- | --- | --- |
| `x_studio_publisher_id` | Instituição publicadora | Many2one `res.partner` | Editorial owner of the course/collection. |
| `x_studio_collection_type` | Tipo de coleção | Selection | Course, curricular unit, playlist, topic, learning path. |
| `x_studio_editorial_state` | Estado editorial | Selection | draft, ready_for_ai, ai_enriched, under_review, changes_requested, approved, ready_to_publish, published, archived. |
| `x_studio_review_notes` | Notas de revisão | Html/Text | Human review context. |
| `x_studio_approved_for_publication` | Aprovado para publicação | Boolean | Explicit publish gate. |

## `slide.slide`

| Technical name | Label | Type | Purpose |
| --- | --- | --- | --- |
| `x_studio_source_url` | URL da fonte | Char/URL | Original public source. |
| `x_studio_source_platform` | Plataforma | Selection | YouTube, Vimeo, other approved source. |
| `x_studio_source_author` | Autor da fonte | Char | Provenance. |
| `x_studio_source_license` | Licença/proveniência | Text | Rights note. |
| `x_studio_source_description` | Descrição original | Html/Text | Source metadata before AI. |
| `x_studio_transcript` | Transcrição | Html/Text | User-provided or approved transcript. |
| `x_studio_ai_summary` | Resumo sugerido | Html/Text | AI suggestion, never auto-published. |
| `x_studio_ai_learning_objectives` | Objetivos sugeridos | Html/Text | AI suggestion. |
| `x_studio_ai_topics` | Tópicos sugeridos | Char/Text | AI suggestion. |
| `x_studio_ai_keywords` | Palavras-chave | Char/Text | AI suggestion. |
| `x_studio_ai_level` | Nível sugerido | Selection | Introductory, intermediate, advanced. |
| `x_studio_ai_language` | Idioma sugerido | Char/Selection | AI suggestion. |
| `x_studio_ai_quality_notes` | Notas de qualidade | Html/Text | Provenance and completeness warnings. |
| `x_studio_editorial_state` | Estado editorial | Selection | Same editorial state family as channel. |
| `x_studio_review_notes` | Notas de revisão | Html/Text | Reviewer feedback. |
| `x_studio_ai_processed` | Processado por IA | Boolean | Audit flag. |
| `x_studio_ai_last_processing` | Último processamento IA | Datetime | Audit timestamp. |
| `x_studio_approved_for_publication` | Aprovado para publicação | Boolean | Explicit publish gate. |

## Rules

- Do not duplicate existing standard fields such as title, description, URL, responsible user, publication, or tags.
- AI writes only suggestion fields.
- Public description/title/tags are changed by a human workflow action.
- Empty transcript means the AI must state that audiovisual content was not analyzed.
- Recheck field existence and type before every API migration.
