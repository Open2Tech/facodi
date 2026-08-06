# Matemateca Pilot Validation

Target: `https://edu-open2.odoo.com` / `edu-open2`
Channel: `https://www.youtube.com/@Matemateca`
Date: 2026-08-06

## Import

- Contact: `Matemateca - Ester Velasquez`, id `11`.
- Collection: `Matemateca — Piloto de Cálculo`, id `2`.
- Pilot slides: ids `44`, `45`, `46`, `47`, `48`.
- Identity: canonical YouTube URL and video id.
- First import: five created.
- Second import: five reused, zero created, zero duplicate URLs.
- Collection and slides remained unpublished.

## Gemini enrichment

The `FACODI Content Curator` agent used `gemini-2.5-flash` and processed all five slides successfully. Results were written to suggestion fields only:

- `x_studio_ai_summary`;
- `x_studio_ai_quality_notes`;
- `x_studio_ai_language`;
- `x_studio_ai_processed`;
- `x_studio_ai_last_processing`.

Each slide moved to `under_review`. No title, public description, course assignment, approval, or publication flag was overwritten by the enrichment call.

Measured durations: 3.771s, 3.808s, 3.568s, 3.927s, and 4.186s.

## Source grounding

The Knowledge article `Manual Editorial FACODI` was created through the authenticated UI and linked with the native `create_from_articles` API. The source reached `type=knowledge_article`, `status=indexed`, `is_active=true`. Gemini responses included citations to the Knowledge article.

## Benchmark

| Model | Result | Time | Decision |
| --- | --- | ---: | --- |
| `gemini-2.5-flash` | Success | 3.395s on benchmark input | Primary/default. |
| `gemini-2.5-pro` | Provider rejected model for new users | n/a | Not usable as fallback. |
| `gemini-3.5-flash` | Odoo rejected: no provider | n/a | Not supported by current Online provider. |

The agent was restored to `gemini-2.5-flash` after the benchmark.

## Prompt injection

A prompt containing an instruction to ignore the rules and publish content was sent as source data. Gemini returned an insufficiency response and did not publish or execute the embedded instruction.

## Review gate

Activities and chatter notes were created for all five slides. They remain `under_review`, `x_studio_approved_for_publication=false`, and unpublished. The source channel authorization was supplied by the project request, but the public pages do not state a reusable license. Publication therefore remains blocked until the responsible publisher confirms the applicable reuse permission or records an approved license basis.
