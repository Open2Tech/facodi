# FACODI Curation State Synchronization

Date: 2026-08-06

## Problem

The proposal model had two useful state layers but they were confusing in the UI:

- functional `x_studio_editorial_state`;
- generic Studio Kanban stage (`Novo`, `Em andamento`, `Concluído`).

The real proposals were waiting for review while still displayed in the `Novo` stage.

## Fix

The validation action now synchronizes visual stages:

- valid/ready for AI and changes requested -> `Em andamento`;
- active duplicate -> `Concluído`;
- current pending proposals 8 and 13–17 were moved to `Em andamento` without changing editorial state or content.

The `A validar` action domain now includes both `received` and `validating`.

## Verification

All six real pending proposals read back as:

- editorial state: `waiting_review`;
- visual stage: `Em andamento`;
- created slide: false.

No eLearning record or publication flag was changed.
