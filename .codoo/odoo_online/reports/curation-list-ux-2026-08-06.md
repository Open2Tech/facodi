# FACODI Curation List UX

Date: 2026-08-06

## Change

The proposal list now exposes the minimum signals needed for triage:

- proposal title;
- UC/area;
- editorial state;
- classification confidence;
- source author/channel;
- AI enrichment flag;
- eLearning relation.

The Kanban retains stage grouping and adds area, editorial state, confidence, source, Gemini completion, and eLearning relation to cards.

## UI verification

Authenticated browser verification of `FACODI — Propostas — Todas` showed the columns and five LCMAquino proposals as:

- area: `Geometria Analítica`;
- state: `Aguardando revisão`;
- confidence: `Alta`;
- source: `LCMAquino`;
- AI: completed;
- eLearning relation: empty.

The Análise Matemática I proposal is also visible with its corrected area and no eLearning relation.

Technical fields such as prompts, raw errors, and internal history remain in the form tabs rather than the triage list.
