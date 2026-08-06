# FACODI Content Submission Architecture

Target: `https://edu-open2.odoo.com` / `edu-open2`
Date: 2026-08-06

## Model

Studio created the separate application `FACODI Propostas` with menu `Propostas de conteúdo` and technical model `x_propostas_de_conteud`.

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

## Remaining boundary

The first increment proves the separate model, views, stages, fields, chatter, and no-direct-slide creation. Portal website form/rules and conversion actions remain the next increment; they must create proposals only and require review before creating an eLearning slide.
