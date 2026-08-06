# LCM Aquino Pilot Implementation

## Audit

- Channel playlists discovered: 30.
- Official LESTI units used for mapping: Análise Matemática I (`19411002`, 5 ECTS), Álgebra Linear e Geometria Analítica (`19411003`, 5 ECTS), and Análise Matemática II (`19411008`, 7 ECTS).
- Playlist-to-UC associations include confidence and rationale in `imports/lcmaquino-playlist-map-2026-08-06.json`.
- Non-curricular playlists are explicitly left unmapped.

## Data model increment

The proposal model now has reusable provenance/classification fields for playlist URL/id/position, canonical URL, fingerprint, confidence, rationale, origin, order, prerequisites, competences, related ECTS, transcript/caption availability, import status, and duplicate identity. The same provenance fields were added to `slide.slide` for conversion traceability.

## Generic import

`imports/import_channel_manifest.py` accepts generic channel manifests, supports the Matemateca pilot format, computes URL+playlist fingerprints, reuses proposals, and never creates an eLearning slide during import.

Dry-run against the Geometria Analítica pilot: five existing proposals reused, zero new proposals, zero slides.

## Current pilot state

- Five Geometria Analítica proposals: enriched by Gemini, `waiting_review`, no slide relation.
- One real Análise Matemática I proposal: enriched, `waiting_review`, no slide relation.
- Conversion action id `522` requires `approved`, creates an unpublished slide, is idempotent, and now copies playlist/classification provenance.
- No playlist proposal was converted or published in this increment.
