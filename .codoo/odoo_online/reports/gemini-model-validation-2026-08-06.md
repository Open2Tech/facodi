# FACODI Gemini Model Validation

Target: `https://edu-open2.odoo.com` / `edu-open2`
Date: 2026-08-06

## Default configuration

The following agents use `gemini-2.5-flash`:

- `Odoo Agent` (system agent, id 1)
- `Ask AI` (id 2)
- `FACODI Content Curator` (id 4)

The Google Gemini account setting is enabled. No API key or credential is stored in this report.

## Real execution

The authenticated JSON-RPC call:

`ai.agent.get_direct_response(4, "Responda apenas: GEMINI_OK FACODI", "", false)`

returned successfully:

`GEMINI_OK FACODI`

This confirms that the FACODI agent is operational with the configured Gemini default.

## Gemini 3.5 Flash experiment

Attempted value: `gemini-3.5-flash`

Result: rejected by Odoo with `No provider found for the selected model`.

The agent remained on `gemini-2.5-flash`. The installed Odoo 19 provider selection exposes only:

- `gemini-2.5-pro`
- `gemini-2.5-flash`
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- supported OpenAI selections

No arbitrary model registry or provider-extension API is available on the target. Adding Gemini 3.5 therefore requires a provider/core update outside the allowed Odoo Online-only scope and was not forced.

## Important distinction

The Odoo AI agent uses the Gemini provider successfully. Odoo `ai_fields` is a separate implementation that currently calls the OpenAI Responses API with fixed model `gpt-4.1`; changing the agent default does not change AI Field execution.
