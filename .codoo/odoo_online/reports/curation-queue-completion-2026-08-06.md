# FACODI Curation Queue Completion

Date: 2026-08-06

## Navigation merged into Content Studio

Added real actions and menus for:

- Todas;
- A validar;
- Prontas para IA;
- Em enriquecimento;
- Aguardando revisão;
- Alterações solicitadas;
- Rejeitadas;
- Aprovadas;
- Convertidas;
- Duplicadas.

All menus target `x_propostas_de_conteud` and use state domains; no duplicate records or actions were introduced on rerun.

## Rejection decision

Studio action `FACODI — Rejeitar proposta editorial` (id `535`) records the rejection reason, reviewer, version, and decision history. It accepts proposals in review/requested/ready states and does not convert or publish.

A temporary rejection test passed and was removed. Real proposals 8 and 13–17 remain `waiting_review` with no created slide relation.
