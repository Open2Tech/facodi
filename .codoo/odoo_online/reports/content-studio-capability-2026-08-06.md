# FACODI Content Studio Capability Report

Target: `https://edu-open2.odoo.com` / `edu-open2`
Branch: `odoo-online`
Snapshot: `inventory/inventory.json`

## Delivered

- Created the reviewed `x_studio_*` manual fields through the Online JSON-RPC `ir.model.fields` API. They are usable dynamic fields, but this is not evidence of a Studio export or form-view placement.
- Created AI agent `FACODI Content Curator` with analytical style, restricted sources, and the confirmed `gemini-2.5-flash` selection.
- Created eight AI topics for enrichment, provenance, quality, objectives, classification, curriculum, review, and publication preparation.
- Created the backend `FACODI Content Studio` menu with native window actions for courses, contents, activities, AI agents, and AI topics.
- Kept eLearning records as the only content source of truth.

## Evidence

- `inventory/inventory.json` records model fields, current-user rights, Gemini selections, unavailable model probes, and redacted records.
- `state/content-studio-before.json`, `state/content-studio-apply.json`, and `state/content-studio-rollback.json` are the field transaction artifacts.
- `state/ai-content-before.json` and `state/ai-content-apply.json` are the AI transaction artifacts.
- `state/app-shell-before.json` and `state/app-shell-apply.json` are the menu/action transaction artifacts.

## Benchmark matrix

| Probe | Result | Evidence |
| --- | --- | --- |
| Field dry-run | Pass | `configure_content_studio.py dry-run` |
| Field apply and read-back | Pass | `configure_content_studio.py verify` |
| AI model/agent/topic capability | Pass | `inventory/inventory.json` |
| AI agent/topic apply and read-back | Pass | `configure_ai_content.py verify` |
| Backend menu/action apply and read-back | Pass | `configure_app_shell.py verify` |
| AI execution latency/format/quality | Blocked | No public JSON-RPC execution method exposed by `ai.agent`; UI execution requires an authenticated Odoo session |
| AI field execution | Pass on temporary record | `slide.slide.get_ai_field_value` returned a Portuguese European summary after the prompt used `data-ai-field` references; the result remained in a suggestion field and the record stayed unpublished |
| AI source indexing | Not configured | No approved Documents/Knowledge source records supplied |
| Approval workflow | Not configured | `studio.approval.rule`, `studio.approval.entry`, and `studio.approval.request` exist, but a safe binding to the standard eLearning publication button was not proven |

## Rollback

Rollback commands require `--confirm APPLY-EDU-OPEN2` and only remove IDs recorded as created by the corresponding apply artifact. The scripts never delete pre-existing fields, menus, actions, agents, or topics.

## Objective blocker

The authenticated JSON-RPC surface exposes agent configuration and topics but no callable `ai.agent` execution method, AI tool model, AI server-action model, or provider/model registry. A direct AI Fields execution is now proven, but the installed Odoo 19 implementation uses the OpenAI Responses API with fixed model `gpt-4.1`; it does not use the configured Gemini agent. The browser session expired during the final reload, so Gemini benchmarking, source indexing, Studio export, role matrix, and end-to-end publish approval remain unexecuted. No success is claimed for those gates.