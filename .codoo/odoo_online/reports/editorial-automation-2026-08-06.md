# FACODI Editorial Automation Evidence

Target: `https://edu-open2.odoo.com` / `edu-open2`
Date: 2026-08-06

## Remote configuration

- Automation: `base.automation` id `1`, `FACODI - Validar pedido de enriquecimento`.
- Model: `slide.slide`.
- Trigger: `on_create`.
- Action: `ir.actions.server` id `514`.
- Action state: `object_write`.
- Updated field: `x_studio_editorial_state`.
- Evaluation type: `value`.
- Value: `preparing`.
- Publication fields are not touched.

## Test

A temporary slide created through the authenticated Odoo UI received `preparing` immediately after creation. The same record remained unpublished. A prior scheduled trigger configuration (`on_time_created` with Created on) was corrected to `on_create` using the guarded automation script and a before snapshot.

Temporary records were removed after verification. The real course retained 40 contents, all with their previous published state.

## Scope

This automation proves the editorial entry transition only. It does not perform AI enrichment, approval, or publication. Those remain separate human-controlled steps.
