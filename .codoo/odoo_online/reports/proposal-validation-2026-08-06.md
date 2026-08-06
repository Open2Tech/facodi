# FACODI Proposal Validation

Target: `https://edu-open2.odoo.com` / `edu-open2`
Date: 2026-08-06

## Automation

Created in Studio on `x_propostas_de_conteud`:

- Action: `FACODI — Validar proposta e detetar duplicado`, id `518`.
- Automation: `FACODI — Validar proposta ao receber`, id `2`.
- Trigger: `on_create`.

The deterministic action checks title, source URL, and origin declaration. Valid records move to `ready_for_ai`; incomplete records move to `changes_requested`; active duplicate source URLs move to `duplicate` with a clear error message. It does not create or publish `slide.slide`.

## Tests

- Temporary duplicate proposal id `9` was marked `duplicate` and then removed.
- No matching eLearning slide was created.
- Real portal proposal id `8` (`MAtemqarica`, source `https://youtu.be/PaxRzKyrwqY?si=saKt5rUCtnJH6suW`) moved from `received` to `ready_for_ai` with `validation_done=true`.
- Activity `Enriquecimento Gemini FACODI`, id `6`, was created for the next human-controlled step.

## Boundary

The validation action does not call Gemini and does not convert a proposal to eLearning. Enrichment and conversion remain separate approved actions. Publication remains controlled by the standard eLearning workflow.
