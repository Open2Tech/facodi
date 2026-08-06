# FACODI Odoo Online migration kit

This directory contains the API-only migration inventory for `edu-open2.odoo.com`.
It is deliberately hidden so it does not become an Odoo addon or a Website Builder asset.

## Read-only inventory

Run from the Codoo workspace:

```bash
.venv/bin/python odoo/facodi/.codoo/odoo_online/inventory_site.py \
  --target online --env .env
```

The script writes:

- `inventory/inventory.json`: redacted source and remote facts;
- `inventory/migration-plan.json`: structured implementation backlog;
- `inventory/migration-plan.md`: reviewable plan and acceptance gates.

The inventory script only calls `fields_get`, `check_access_rights`, `search`,
`search_count`, and `search_read`. It never calls `create`, `write`, `unlink`,
or server actions.

## API migration

The migration script defaults to a dry-run:

```bash
.venv/bin/python odoo/facodi/.codoo/odoo_online/migrate_site.py \
  dry-run --target online --env .env
```

After reviewing the generated plan, the approved API apply is:

```bash
.venv/bin/python odoo/facodi/.codoo/odoo_online/migrate_site.py \
  apply --target online --env .env --confirm APPLY-EDU-OPEN2 \
  --remove-extra-menus
```

The apply creates local snapshots under `state/`, updates the FACODI homepage,
institutional pages, menus, COW header/footer views, and a public CSS attachment.
It never deletes records except the explicitly requested extra appointment menu
when `--remove-extra-menus` is supplied. Rollback requires the same confirmation:

```bash
.venv/bin/python odoo/facodi/.codoo/odoo_online/migrate_site.py \
  rollback --target online --env .env --confirm APPLY-EDU-OPEN2
```

The current state was verified through API and browser smoke tests at five
breakpoints. Content models from `facodi_content` remain outside Odoo Online;
the Online frontend uses native Website/eLearning models and API-managed pages.

## Odoo Online boundary

The original `theme_facodi` and `facodi_content` addons are the visual and data
source of truth, but their Python models, controllers, cron, ACLs, and QWeb
inheritance cannot be installed on Odoo Online. The migration therefore maps:


No other remote write is allowed without a reviewed plan and rollback mapping for
every operation.

The final delivery report consolidates the implemented architecture, real
pilots, validation gates, and confirmed Online limitations:
`reports/final-delivery-2026-08-06.md`.
## Content Studio configuration

Capability discovery and the redacted pre-write snapshot are generated with:

```bash
.venv/bin/python odoo/facodi/.codoo/odoo_online/inventory_site.py \
  --target online --env .env
```

The guarded configuration runners default to read-only dry-runs:

```bash
.venv/bin/python odoo/facodi/.codoo/odoo_online/configure_content_studio.py dry-run --batch core --target online --env .env
.venv/bin/python odoo/facodi/.codoo/odoo_online/configure_ai_content.py dry-run --target online --env .env
.venv/bin/python odoo/facodi/.codoo/odoo_online/configure_app_shell.py dry-run --target online --env .env
```

Each runner supports `snapshot`, `apply`, `verify`, and `rollback`. Apply and
rollback require `--confirm APPLY-EDU-OPEN2`. See
`reports/content-studio-capability-2026-08-06.md` for the current evidence and
unsupported API surfaces.

## Studio reconciliation and Matemateca pilot

The existing dynamic fields can be made exportable without recreating them:

```bash
.venv/bin/python odoo/facodi/.codoo/odoo_online/reconcile_studio_fields.py \
  dry-run --target online --env .env
```
The guarded conversion action is active as `FACODI — Converter proposta em
eLearning`: it requires `approved`, creates an unpublished `slide.slide`, stores
the proposal relation, and is idempotent. See
`reports/proposal-conversion-2026-08-06.md`.

The Matemateca playlist pilot is kept separate from `Análise Matemática I`.
Five proposals were created and enriched under the suggested area
`Geometria Analítica`, all awaiting human review. No eLearning content was
created automatically. See `reports/playlist-geometria-analitica-2026-08-06.md`.

The LCM Aquino channel audit maps 30 playlists to official LESTI units with
confidence and rationale. The source-neutral importer
`imports/import_channel_manifest.py` uses canonical URL plus playlist
fingerprints, reuses existing proposals, and never creates eLearning records.
See `reports/lcmaquino-curriculum-audit-2026-08-06.md`.

The pilot also added reusable playlist/classification provenance fields to both
proposals and `slide.slide`. Conversion copies this provenance and remains
approval-gated. See `reports/lcmaquino-pilot-implementation-2026-08-06.md`.

The published Matemateca content was reviewed against LESTI: four slides remain
in Análise Matemática I and the Jacobian slide was moved to Análise Matemática
II. Public descriptions were revised while original source descriptions were
preserved. See `reports/content-review-2026-08-06.md`.

Curator decisions now have explicit Studio actions for requesting changes and
approving proposals. Both actions record reviewer, version, decision history,
and follow-up activity without converting or publishing. See
`reports/curation-decisions-2026-08-06.md`.

The queue is now complete with state menus for all, validation, AI, review,
changes, rejection, approval, conversion, and duplicates. Rejection records a
reason and history without touching eLearning. See
`reports/curation-queue-completion-2026-08-06.md`.

Kanban stages are synchronized with editorial states so pending proposals show
as `Em andamento` rather than `Novo`; the validation action also assigns stages
for valid, incomplete, and duplicate outcomes. See
`reports/curation-state-sync-2026-08-06.md`.

The triage list and Kanban now expose proposal, UC/area, state, confidence,
source, AI completion, and eLearning relation while keeping technical fields in
the form tabs. See `reports/curation-list-ux-2026-08-06.md`.

The application now includes eight Knowledge guides, an `Ajuda FACODI` menu, a
short `Como fazer a curadoria` form tab, and contextual field tooltips. See
`reports/help-onboarding-2026-08-06.md`.

Proposal search now includes lifecycle, quality, source, UC, and playlist
filters plus groupings. The `Sem licença` filter is backed by a real proposal
field. See `reports/proposal-search-filters-2026-08-06.md`.

The duplicate generic proposal menu was archived; `Propostas — Todas` is now
the single full-queue entry, while state-specific menus remain distinct. The
underlying action remains preserved for compatibility. See
`reports/menu-deduplication-2026-08-06.md`.

The proposal form was simplified and the reliable automatic Gemini step was
kept as one idempotent automation. The unsuccessful nested post-write state
automation was disabled to avoid misleading complexity. See
`reports/curation-simplification-2026-08-06.md`.

Critical proposal actions remain in the standard Actions menu. Header-button
experiments were rejected by the Online view validator because dynamic Studio
XML IDs are not accepted for `type="action"` in this view context; the form was
restored valid. See `reports/curation-actions-ux-2026-08-06.md`.

The consolidated application now groups its menus under `Propostas`,
`Operações`, and `IA`, with configuration and help at root. See
`reports/menu-submenus-2026-08-06.md`.

The guarded source runner links `Manual Editorial FACODI` through the native
Knowledge source method. The pilot importer uses canonical YouTube URLs and
preserves workflow/publication fields when reusing existing records:

```bash
.venv/bin/python odoo/facodi/.codoo/odoo_online/configure_ai_sources.py \
  verify --target online --env .env
.venv/bin/python odoo/facodi/.codoo/odoo_online/imports/matemateca/import_pilot.py \
  verify --target online --env .env
```

The authenticated Studio export is stored as
`addons/theme_facodi/customizations2.zip`. Its contents and the remaining
export warning are documented in `reports/studio-export-2026-08-06.md`.

## Separate content proposals

The submission workspace is consolidated under the `FACODI Content Studio`
application. Its technical model is `x_propostas_de_conteud`. It stores source,
submitter, workflow, AI suggestions, review, and optional eLearning relation
without creating a `slide.slide` on proposal creation. The authenticated form
is organized into source, context, processing, AI suggestions, curation,
submitter, and chatter sections. See
`reports/content-submission-architecture-2026-08-06.md`.

The first validation increment is now active: the Studio action and
`base.automation` validate new proposals, detect duplicate canonical source
URLs, create `ready_for_ai`/`duplicate` outcomes, and never create eLearning
records. See `reports/proposal-validation-2026-08-06.md`.

The Gemini proposal action is also active: it only accepts `ready_for_ai`, writes
AI suggestions on the proposal, moves it to `waiting_review`, and creates a
review activity. It does not create or publish `slide.slide`. See
`reports/proposal-enrichment-2026-08-06.md`.
