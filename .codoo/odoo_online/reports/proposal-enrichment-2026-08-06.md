# FACODI Proposal Enrichment

Target: `https://edu-open2.odoo.com` / `edu-open2`
Date: 2026-08-06

## Action

Studio action: `FACODI — Enriquecer proposta com Gemini`, id `521`, bound to `x_propostas_de_conteud`.

The action only runs from `ready_for_ai`. It calls the `FACODI Content Curator` agent, writes suggestion fields on the proposal, increments the attempt count, moves the proposal to `waiting_review`, and creates a review activity. It never creates or publishes `slide.slide`.

## Real proposal test

Proposal id `8` (`MAtemqarica`) was validated and then enriched.

- Input source: `https://youtu.be/PaxRzKyrwqY?si=saKt5rUCtnJH6suW`.
- Input text: title plus the supplied description `Video`; no transcript.
- Agent response: successful Gemini response with explicit insufficient-information warnings.
- State: `waiting_review`.
- Enrichment done: true.
- Attempt count: 1.
- Review activity: id `7`, state `today`.
- Related eLearning slide: false.
- Matching slide count: zero.

The agent cited the indexed `Manual Editorial FACODI` Knowledge source and did not claim to have watched the video.

## Error repaired

The first server-action draft used `env.context_today`, which is not available in the Online safe-eval environment. The action was corrected to `datetime.date.today()` before execution; the failed attempt was transactional and left the proposal unchanged.

## Boundary

The proposal now follows:

`received -> ready_for_ai -> waiting_review`

Conversion to eLearning and publication remain separate human-controlled actions.
