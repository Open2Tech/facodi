# FACODI Editorial Workflow

```text
Rascunho
  -> Pronto para IA
  -> Enriquecido por IA
  -> Em revisão
      -> Alterações solicitadas
      -> Aprovado
  -> Pronto para publicação
  -> Publicado
  -> Arquivado
```

## State semantics

- `draft`: creator may edit source and pedagogical metadata.
- `ready_for_ai`: sufficient source URL/description/transcript exists.
- `ai_enriched`: suggestions exist; no public field was overwritten.
- `under_review`: reviewer activity assigned.
- `changes_requested`: reviewer notes are required.
- `approved`: reviewer accepted the suggestions/content.
- `ready_to_publish`: publication gate is satisfied.
- `published`: standard eLearning publication flags are true.
- `archived`: no public exposure; historical record remains.

## Roles

- Creator: eLearning Officer; creates and enriches assigned content.
- Reviewer: Officer plus FACODI reviewer role; reviews and requests changes.
- Publisher: eLearning Manager; approves final publication.
- Administrator: Settings/Studio/AI configuration.

The first implementation should prove the workflow with one channel and one slide before bulk configuration. If Studio approval stages cannot bind to the actual eLearning publication action, use the explicit approval boolean plus a publisher activity; never treat a hidden button as security.

## Automation candidates

- On `ready_for_ai`: assign AI enrichment activity.
- On `ai_enriched`: assign reviewer activity.
- On `changes_requested`: notify creator and require review notes.
- On `approved`: notify publisher and set `ready_to_publish`.
- On missing source/license/responsible: add a quality warning activity.

## Acceptance

No AI-generated suggestion may become public without human approval. Standard `is_published`/`website_published` remains the final public visibility mechanism.
