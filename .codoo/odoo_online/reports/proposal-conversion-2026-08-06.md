# FACODI Proposal Conversion

Target: `https://edu-open2.odoo.com` / `edu-open2`
Date: 2026-08-06

## Action

Studio action: `FACODI — Converter proposta em eLearning`, id `522`.

Rules:

- only `approved` proposals may convert;
- an existing `x_studio_created_slide_id` makes the action idempotent;
- the target collection is resolved by the canonical suggested-area name;
- the created `slide.slide` copies only approved proposal/source fields;
- `website_published` and `is_published` are always false;
- the proposal stores the created slide relation and moves to `converted`.

## Realistic test

A temporary proposal was created, then moved to `approved` to simulate the completed human review. The action created slide id `50` in `Análise Matemática I`, unpublished. Re-running the action did not create a second slide. The proposal relation was set and the proposal moved to `converted`.

The existing eLearning create automation assigned the new slide to `preparing`, which is the intended editorial queue entry state. The temporary proposal and slide were removed after verification.

## Rejection test

A first conversion attempt before approval was rejected with `A proposta precisa estar aprovada antes da conversão.` No slide was created.

## Boundary

The conversion action does not publish. Publication remains a separate manual eLearning Manager decision after the converted slide is reviewed.
