# FACODI Studio Merge

Date: 2026-08-06

## Consolidation

The duplicate top-level application `FACODI Propostas` (menu id `349`) was archived. Its functional children were preserved and reparented under the canonical `FACODI Content Studio` (menu id `343`):

- `Propostas de conteúdo` (action `515`);
- `Configuração`;
- proposal stages;
- proposal tags.

The existing proposal actions, automations, records, chatter, activities, and conversion relation were not deleted or recreated.

## Result

There is now one operational backoffice application with courses, contents, activities, AI, proposals, curation queues, and configuration. The old top-level menu is inactive to prevent duplicate navigation.

## Validation

- Menu parent relationships read back successfully through JSON-RPC.
- Proposal action remains `x_propostas_de_conteud`.
- No proposal or eLearning record was altered by the merge.