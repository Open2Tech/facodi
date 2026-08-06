# FACODI Proposal Search and Filters

Date: 2026-08-06

## Filters

The proposal search view now provides standard filters for:

- received;
- ready for AI;
- processing;
- waiting for review;
- changes requested;
- low confidence;
- no transcript;
- no license;
- Matemateca;
- LCMAquino.

## Groupings

The same view groups proposals by:

- editorial state;
- UC/area;
- classification confidence;
- source author;
- playlist.

## Model improvement

The missing proposal field `x_studio_source_license` was added with contextual help so the `Sem licença` filter is backed by real data rather than a UI-only approximation.

## Verification

The list view remains valid after the search view update and continues to show operational triage columns. No proposal or eLearning record was modified by the view change.
