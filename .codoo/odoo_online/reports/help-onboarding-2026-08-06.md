# FACODI Help and Onboarding

Date: 2026-08-06

## In-app help

Created eight Knowledge guides and menu `Ajuda FACODI` inside the consolidated Content Studio application:

- Começar a utilizar o FACODI;
- Como submeter conteúdo;
- Como validar uma proposta;
- Como enriquecer com IA;
- Como fazer a curadoria;
- Como associar a LESTI;
- Como converter e publicar;
- Como tratar duplicados e erros.

## Contextual help

The proposal form now includes a `Como fazer a curadoria` tab with six short steps and a link to the Knowledge guides. Field help/tooltips were added for confidence, classification rationale, fingerprint, publication approval, transcript availability, created eLearning relation, playlist provenance, and editorial state.

## UX principle

The primary form remains focused on source, context, workflow, and decisions. Technical provenance and AI details stay in dedicated tabs and tooltips rather than competing with the proposal title and next action.

## Validation

- Knowledge articles created through the standard `knowledge.article` model.
- Help menu is under the canonical `FACODI Content Studio` application.
- Form view contains the help tab and six procedural steps.
- Tooltips were written to the real `ir.model.fields` records.
