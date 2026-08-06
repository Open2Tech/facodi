# FACODI AI Prefill Review

Date: 2026-08-06

## Finding

The original enrichment action stored the full Gemini response only in `x_studio_ai_summary`. The dedicated fields for objectives, topics, keywords, level, collection, and quality remained empty.

## Fix

The action `FACODI — Enriquecer proposta com Gemini` now requests explicit sections and parses them into separate proposal fields:

- `x_studio_ai_summary`;
- `x_studio_ai_objectives`;
- `x_studio_ai_topics`;
- `x_studio_ai_keywords`;
- `x_studio_ai_level`;
- `x_studio_ai_collection`;
- `x_studio_ai_quality_notes`.

The action preserves original source fields, increments the attempt count, creates a review activity, and moves the proposal to `waiting_review`.

## Test

A temporary `ready_for_ai` proposal was enriched successfully. All dedicated fields were populated; fields without sufficient evidence explicitly contained `Informação insuficiente`. The temporary proposal was removed. The converted proposal 13 and all published eLearning content were not modified.

## Decision

AI output is now both readable as a summary and actionable as structured review data. Human approval and conversion remain separate.
