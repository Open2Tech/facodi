# FACODI Menu Deduplication

Date: 2026-08-06

## Duplicate found

Two active menus opened the same proposal model without meaningful functional separation:

- `Propostas — Todas`, menu id `360`, action `531`;
- `Propostas de conteúdo`, menu id `350`, action `515`.

## Consolidation

`Propostas — Todas` is now the single operational entry for the full proposal queue. Menu id `350` was archived (`active=false`). Action `515` remains intact for compatibility and direct references; no model, record, action, or proposal was deleted.

The state-specific menus remain separate because they use distinct domains and support different reviewer workflows.

## Verification

- Active menu tree read back with one all-proposals entry.
- Action `515` still exists and targets `x_propostas_de_conteud`.
- No proposal or eLearning record changed.
