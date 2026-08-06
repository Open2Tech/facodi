# FACODI Final Delivery Report

Date: 2026-08-06
Branch: `odoo-online`
Target: `https://edu-open2.odoo.com`

## Delivered architecture

- Public Portal form creates `x_propostas_de_conteud`, never a published lesson.
- Deterministic validation and URL deduplication.
- Gemini enrichment as suggestions only.
- Review, approval, rejection, history, versioning, and activities.
- Idempotent conversion to unpublished eLearning content.
- Manual publication remains separate.
- One consolidated `FACODI Content Studio` application with proposal, operations, AI, configuration, and help submenus.
- Knowledge guides, contextual help, simplified proposal form, triage views, and filters.

## Real content

- LESTI collections: Análise Matemática I (`19411002`, 5 ECTS), Análise Matemática II (`19411008`, 7 ECTS), and Álgebra Linear e Geometria Analítica (`19411003`, 5 ECTS).
- Existing Matemateca calculus content was reviewed; Jacobian moved to Análise Matemática II.
- LCM Aquino playlists were audited and mapped to LESTI with confidence/rationale.
- Five LCM Aquino proposals remain in human review.
- Two approved LCM Aquino proposals were converted to unpublished drafts `slide.slide` 51 and 52 in Álgebra Linear e Geometria Analítica, preserving playlist position/fingerprint/classification.
- No automatic publication occurred.

## Validation gates

- Public Portal, confirmation page, homepage, catalog, and both curriculum routes: HTTP 200.
- Proposal validation, incomplete data, duplicate detection, Gemini enrichment, rejection, approval, conversion, and conversion idempotency tested.
- List/Kanban triage verified in authenticated UI.
- Five LCM Aquino proposal enrichments verified.
- Converted drafts verified unpublished.
- Local Python compile, Ruff, and diff checks passed for changed scripts.

## Known limitations

- Portal “my proposals” tracking is not implemented; the standard Website Form confirmation works, but a personalized portal list requires further access-rule/UI validation.
- Header action buttons were rejected by the Online view validator for dynamic Studio XML IDs; supported contextual Actions menu remains in use.
- Gemini fallback models are limited by the provider; `gemini-2.5-flash` is the verified primary.
- The Studio export ZIP was supplied through the authenticated Studio UI; the external API key cannot authenticate `/web_studio/export` as a web session.

## Latest commits

- `1f491f9` supported proposal actions;
- `6c1401b` simplified curation form/automation;
- `4ca9317` grouped menus into submenus;
- `d9536df` removed duplicate menu;
- `0736dcd` reviewed curricular placement;
- `9b9bdc2` reusable LCM Aquino pipeline;
- `final phase` converted approved LCM Aquino drafts.
