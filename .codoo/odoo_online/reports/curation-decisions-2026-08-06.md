# FACODI Curation Decisions

Target: `https://edu-open2.odoo.com` / `edu-open2`
Date: 2026-08-06

## Actions

- `FACODI — Solicitar alterações da proposta`, id `529`.
- `FACODI — Aprovar proposta editorial`, id `530`.

Both actions require `waiting_review`, update the proposal state, assign the reviewer, increment `x_studio_review_version`, append to `x_studio_decision_history`, and create a follow-up activity. Approval does not convert or publish content.

## Tests

- Temporary proposal transitioned to `changes_requested`, version 1, with activity and decision history.
- Separate temporary proposal transitioned to `approved`, version 1, with activity and decision history.
- Both temporary records were removed.
- Real proposals remain untouched in `waiting_review`.

## Boundary

The next action after approval is the separate guarded conversion action. Publication remains controlled by eLearning permissions and is never performed by the approval action.
