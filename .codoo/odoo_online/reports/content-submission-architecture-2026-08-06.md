# FACODI Content Submission Architecture

Target: `https://edu-open2.odoo.com` / `edu-open2`
Date: 2026-08-06

## Model

Studio created the technical model `x_propostas_de_conteud`; its menu and configuration are now consolidated under the canonical `FACODI Content Studio` application as `Propostas de conteúdo`.

The first record is proposal id `1`, created from a controlled Matemateca submission. It is in `received`, stage `Novo`, and has no related `slide.slide`.

## Separation proof

- The proposal stores source URL, type, description, suggested area, language, original author/channel, origin declaration, workflow state, enrichment flags, AI suggestions, review notes, rejection reason, and optional created eLearning content.
- The existing eLearning models remain the source of truth for courses and slides.
- Creating proposal id `1` changed the count of slides matching the source URL from `0` to `0`.
- No publication flag exists on the proposal model.

## Backoffice form

The Studio form is organized into:

- Fonte;
- Contexto enviado;
- Processamento;
- Sugestões IA;
- Curadoria;
- Submissor;
- Chatter.

Technical AI details are separated from source/context fields and are not part of the standard `slide.slide` form.

## Portal form

The public Website Form page is `/propor-conteudo` and uses the standard endpoint `/website/form/x_propostas_de_conteud`. It exposes title, source URL, content type, description, suggested area, usefulness context, and origin declaration. The confirmation page is `/propor-conteudo-obrigado`.

The fields were explicitly opted into Website Form with `website_form_blacklisted=false`. A direct standard POST returned a proposal id and the confirmation page returned HTTP 200. Temporary proposal records were removed after verification; no slide was created.

## Duplicate risk found

The first browser submission created a proposal before the client-side widget displayed an error, and a retry created another test proposal. The test records were removed. The next increment must add deterministic idempotency, preferably a source URL key plus a user/session or submission fingerprint, before exposing the form broadly.

## Remaining boundary

The first increment proves the separate model, views, stages, fields, chatter, and no-direct-slide creation. Portal website form/rules and conversion actions remain the next increment; they must create proposals only and require review before creating an eLearning slide.
