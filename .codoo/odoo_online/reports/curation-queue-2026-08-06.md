# FACODI Curation Queue

Target: `https://edu-open2.odoo.com` / `edu-open2`
Date: 2026-08-06

## Queue menus

The `FACODI Content Studio` app now has real actions/menus for:

- Propostas — A validar;
- Propostas — Prontas para IA;
- Propostas — Em enriquecimento;
- Propostas — Aguardando revisão;
- Propostas — Alterações solicitadas;
- Propostas — Rejeitadas.

Each action filters `x_propostas_de_conteud` by `x_studio_editorial_state` and opens the existing Kanban/list/form views.

## Current proposals

- Proposal 8: Matemateca source, enriched, `waiting_review`, corrected area `Análise Matemática I`; no slide relation.
- Proposals 13–17: playlist videos, enriched, `waiting_review`, suggested area `Geometria Analítica`; no slide relation.

No proposal in this queue has been converted or published. Conversion remains gated on `approved` and uses the separate idempotent action documented in `proposal-conversion-2026-08-06.md`.
