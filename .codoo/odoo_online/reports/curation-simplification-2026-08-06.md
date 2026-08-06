# FACODI Curation Simplification

Date: 2026-08-06

## UX change

The proposal form was reduced from multiple competing tabs to three operational surfaces:

- Visão geral;
- IA e decisão;
- Fonte e rastreabilidade;
- Histórico.

The workflow help was folded into the main process guidance and the header now exposes the next action and enrichment completion signal.

## Automation change

A single idempotent automation remains responsible for triggering Gemini when a proposal enters `ready_for_ai`. It creates suggestions and the review activity without creating or publishing eLearning.

A second post-write automation was tested but disabled because Odoo Online executes the nested state write inside the same event transaction and restores the original state. Keeping it active would add misleading complexity. The reliable signal for review is `x_studio_enrichment_done=true`, the review activity, and the proposal triage queue.

Approval, conversion, and publication remain explicit human steps.

## Validation

- Temporary `ready_for_ai` proposals triggered Gemini without a manual enrichment click.
- Suggestions and review activity were created.
- No slide was created.
- The ineffective secondary automation is inactive.
- The real proposals and published eLearning contents were not changed by the test.
