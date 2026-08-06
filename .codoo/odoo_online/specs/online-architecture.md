# FACODI Online Architecture

## Source of truth

`edu-open2.odoo.com`, website `FACODI` (`website.id=2`), is the only operational source of truth. The repository stores inventories, API migration scripts, Studio specifications, prompts, evidence, and rollback manifests.

## Runtime boundary

Odoo Online does not execute the Python addons `theme_facodi` or `facodi_content`. Their public frontend was ported through `website.page`, `website.menu`, website-scoped `ir.ui.view`, public CSS attachment, and JSON-RPC.

Do not introduce FastAPI, Docker, Redis, Celery, SQLite workers, custom controllers, or addon installation into this target architecture.

## Standard models

- `slide.channel`: course, collection, playlist, curricular unit, or learning path.
- `slide.slide`: video, document, article, quiz, or lesson.
- `slide.tag`: topics and subject labels.
- `documents.document`: approved source files and editorial material.
- Knowledge articles: editorial guidance, curricula, and approved references.
- `mail.activity` and chatter: review assignments and decisions.

## Current remote facts

- Installed capabilities include `website_slides`, `web_studio`, `website_studio`, `ai`, `ai_fields`, `ai_server_actions`, `ai_documents`, `ai_knowledge`, `documents`, `knowledge`, `survey`, and dashboards.
- No `x_studio_*` fields currently exist on `slide.channel` or `slide.slide`.
- The API exposes `studio.approval.rule`, `studio.approval.entry`, and `studio.approval.request`. The standard eLearning publication button has not been safely bound to a rule through the public API, so publication remains restricted to the standard eLearning Manager permission until that binding is proven in Studio.
- The old external enrichment service is not part of the Online runtime. AI suggestions must use fields, source documents, Knowledge, and explicitly supplied transcript/description data.

## Delivery order

1. Inventory and capability matrix.
2. Studio fields and localized views.
3. Editorial workflow and approval proof-of-concept.
4. AI fields/prompts with suggestions only.
5. Backend work views and actions.
6. Role tests and publish gate.
7. Export Studio customizations and rollback runbook.
