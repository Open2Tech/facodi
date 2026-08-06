# FACODI Curation Actions UX

Date: 2026-08-06

## Simplification

The proposal form keeps a clean header with the editorial Kanban status and uses three focused tabs. The main actions remain available through the standard contextual Actions menu:

- validate;
- enrich;
- request changes;
- approve;
- reject;
- convert.

## Tested limitation

Two attempts were made to expose the Server Actions as header buttons through `ir.ui.view.arch_db`. Odoo Online rejected both because `type="action"` requires module-resolvable XML IDs and does not accept the dynamic Studio XML references in this view context. The view was restored after each rejected write and remains valid.

No invalid button markup remains. The menu actions are the supported, stable path for these Server Actions in the current Online instance.

## Result

The workflow remains less bureaucratic through the simplified tabs and automatic Gemini trigger, while critical decisions stay behind standard contextual actions. No records or publication flags were changed by the failed button experiments.
