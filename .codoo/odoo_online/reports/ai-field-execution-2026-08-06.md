# FACODI AI Field Execution Evidence

Target: `https://edu-open2.odoo.com` / `edu-open2`
Date: 2026-08-06

## Test record

- Model: `slide.slide`
- Record: `43` (temporary test record)
- AI field: `x_studio_char_field_36r_1jvaectbp`
- Source fields: `name`, `description`, `x_studio_transcript`
- Editorial state: `preparing`
- `website_published`: `false`
- `is_published`: `false`
- `x_studio_approved_for_publication`: `false`

## Execution

The official Odoo AI Fields method was called through the authenticated JSON-RPC client:

`slide.slide.get_ai_field_value(43, "x_studio_char_field_36r_1jvaectbp", {})`

Result: success. The method returned a Portuguese European pedagogical summary based on the controlled title, description, and transcript. The result was persisted only in the AI suggestion field on the temporary record.

## Negative-path correction

The first execution returned an insufficient-context warning because the Studio prompt contained prose references rather than Odoo AI field-reference spans. The prompt was corrected to use `data-ai-field` references for `name`, `description`, and `x_studio_transcript`. The second execution succeeded after the record was reloaded.

## Provider limitation

The installed Odoo 19 `ai_fields` implementation uses the OpenAI Responses API and fixed model `gpt-4.1` for AI fields. The configured `ai.agent` selection `gemini-2.5-flash` is a separate agent configuration and was not used by this field execution. No Gemini benchmark is claimed.

## Cleanup

The temporary record must be deleted after evidence capture. No production course or published content was modified by this test.
