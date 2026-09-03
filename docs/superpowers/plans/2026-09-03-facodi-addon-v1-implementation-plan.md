# FACODI Odoo Community Addon — Implementation Plan

> **For agentic workers:** execute this plan task by task. Do not combine tasks, and do not write production code before the named failing test exists. Use `superpowers:test-driven-development` during implementation and `superpowers:verification-before-completion` before every completion claim.

## Goal

Transform the approved FACODI architectural blueprint into a production-oriented Odoo 19 Community addon that ingests and versions educational resources, models university curricula, records AI suggestions separately from human decisions, evaluates curriculum coverage, composes reusable learning structures, publishes approved material through native Odoo eLearning, preserves provenance and rights, supports controlled updates, and provides a future-ready baseline for skills evidence and personalised recommendations.

## Architecture

Odoo and PostgreSQL are the only operational source of truth. The existing `facodi_content` addon is upgraded in place from `19.0.1.1.0` to `19.0.2.0.0`; this preserves the installed module identity and permits an ordinary Odoo migration. Native `slide.channel`, `slide.slide`, `res.partner`, `res.users`, `ir.attachment`, mail threads, activities, groups, cron, ratings and eLearning progress remain authoritative. FACODI models exist only for gaps in the standard domain: external resource identity and snapshots, rights decisions, curricula, semantic assertions, matching, coverage, candidate composition, curation, provenance, publication receipts, skills evidence and recommendations.

Background work is a small Odoo-native PostgreSQL job queue processed by `ir.cron`, with idempotency, bounded retries and row locking. External ingestion and AI are adapter services invoked by those jobs. The former standalone SQLite/FastAPI pipeline is replaced only after its Odoo callers and data have a tested migration path. AI output is always a proposal; only a named human action may accept, correct, reject or publish it.

## Tech Stack

- Odoo 19 Community, Python 3.12+ and PostgreSQL 16/17
- Native Odoo ORM, `mail.thread`, `mail.activity.mixin`, `website_slides`, `portal`, `rating`
- `requests`, `lxml`, `odoo.tools.pdf.PdfFileReader`, standard-library URL/DNS/IP validation
- Odoo `TransactionCase` and `HttpCase`; `unittest.mock` for network isolation
- Docker Compose using official `odoo:19.0` and `postgres:17` images
- GitHub Actions for static validation and full Odoo install/upgrade tests

## Spec

- Approved functional/architectural spec: `docs/superpowers/specs/2026-09-03-facodi-architecture-blueprint-design.md`
- Visual blueprint: `https://lucid.app/lucidchart/a4dd1b70-922c-416a-8390-3bd7886d8c7f/edit`
- This plan deliberately does not use `addons/facodi_content/docs/architecture.md`, the internship report, or any Supabase proposal as an architectural source.

## Global Constraints

1. Odoo Standard first: extend or relate standard records before adding a FACODI model.
2. Odoo Community only; no Enterprise-only `documents` dependency and no Supabase dependency.
3. No automatic publication from ingestion, rules or AI.
4. Preserve five distinct evidence layers: source fact, extracted structure, AI inference, human decision, published result.
5. Every publication must pass a deterministic rights gate and retain the exact source snapshot used.
6. Translations live on the same resource/concept identity using Odoo translatable fields; translations do not create duplicate resources.
7. All connector calls use HTTPS, bounded timeouts and sizes, SSRF protection, redacted errors and no secrets in chatter or provenance JSON.
8. Portal/public users consume only native published eLearning records. FACODI operational models remain internal.
9. Every state-changing public model action checks the appropriate FACODI group, even when a button is hidden by a view.
10. Existing `facodi_source_key` and enrichment fields remain readable for one compatibility release, but new code must use canonical resource and analysis records.

## Definition of Done

- Fresh install and upgrade from `19.0.1.1.0` both pass in Docker.
- Core flows are executable from backend UI: ingest, rights review, enrich, match, cover, compose, curate, publish, update.
- YouTube video/oEmbed, YouTube playlist/channel discovery with API key, generic web metadata, uploaded PDF, native Odoo slide and curriculum JSON/CSV ingestion paths are covered by tests.
- AI adapter produces versioned assertions and never mutates approved/published content directly.
- Accepted relations generate deterministic coverage lines; candidates remain reviewable.
- Approved composition publishes to native `slide.channel`/`slide.slide` and records a publication receipt and snapshot.
- Existing FACODI slide enrichment data is backfilled idempotently into new models.
- Curator/manager separation and multi-company record rules pass access tests.
- All backend views, menus, actions, cron jobs and configuration fields install without warnings.
- Repository documentation and a native Google Drive operations/design document match the shipped code.

## Target File Map

### Addon bootstrap and shared data

- Modify: `addons/facodi_content/__manifest__.py`
- Modify: `addons/facodi_content/__init__.py`
- Create: `addons/facodi_content/hooks.py`
- Create: `addons/facodi_content/security/facodi_security.xml`
- Create: `addons/facodi_content/security/ir.model.access.csv`
- Create: `addons/facodi_content/data/facodi_license_data.xml`
- Create: `addons/facodi_content/data/facodi_sequence_data.xml`
- Modify: `addons/facodi_content/data/ir_cron.xml`

### Models

- Modify: `addons/facodi_content/models/__init__.py`
- Create: `addons/facodi_content/models/facodi_source.py`
- Create: `addons/facodi_content/models/facodi_resource.py`
- Create: `addons/facodi_content/models/facodi_snapshot.py`
- Create: `addons/facodi_content/models/facodi_job.py`
- Create: `addons/facodi_content/models/facodi_concept.py`
- Create: `addons/facodi_content/models/facodi_analysis.py`
- Create: `addons/facodi_content/models/facodi_curriculum.py`
- Create: `addons/facodi_content/models/facodi_matching.py`
- Create: `addons/facodi_content/models/facodi_coverage.py`
- Create: `addons/facodi_content/models/facodi_composition.py`
- Create: `addons/facodi_content/models/facodi_review.py`
- Create: `addons/facodi_content/models/facodi_publication.py`
- Create: `addons/facodi_content/models/facodi_skills.py`
- Create: `addons/facodi_content/models/res_config_settings.py`
- Modify: `addons/facodi_content/models/slide_channel.py`
- Modify: `addons/facodi_content/models/slide_slide.py`

### Services and wizards

- Create: `addons/facodi_content/services/__init__.py`
- Create: `addons/facodi_content/services/url_safety.py`
- Create: `addons/facodi_content/services/ingestion.py`
- Create: `addons/facodi_content/services/ai.py`
- Create: `addons/facodi_content/services/matching.py`
- Create: `addons/facodi_content/services/publication.py`
- Create: `addons/facodi_content/wizard/__init__.py`
- Create: `addons/facodi_content/wizard/ingest_resource.py`
- Create: `addons/facodi_content/wizard/ingest_resource_views.xml`
- Create: `addons/facodi_content/wizard/curriculum_import.py`
- Create: `addons/facodi_content/wizard/curriculum_import_views.xml`

### Backend UI

- Create: `addons/facodi_content/views/facodi_menus.xml`
- Create: `addons/facodi_content/views/facodi_source_views.xml`
- Create: `addons/facodi_content/views/facodi_resource_views.xml`
- Create: `addons/facodi_content/views/facodi_curriculum_views.xml`
- Create: `addons/facodi_content/views/facodi_intelligence_views.xml`
- Create: `addons/facodi_content/views/facodi_coverage_views.xml`
- Create: `addons/facodi_content/views/facodi_composition_views.xml`
- Create: `addons/facodi_content/views/facodi_review_views.xml`
- Create: `addons/facodi_content/views/facodi_publication_views.xml`
- Create: `addons/facodi_content/views/facodi_skills_views.xml`
- Create: `addons/facodi_content/views/res_config_settings_views.xml`
- Modify: `addons/facodi_content/views/slide_channel_views.xml`
- Modify: `addons/facodi_content/views/slide_slide_views.xml`

### Migration and tests

- Create: `addons/facodi_content/migrations/19.0.2.0.0/pre-migrate.py`
- Create: `addons/facodi_content/migrations/19.0.2.0.0/post-migrate.py`
- Create: `addons/facodi_content/tests/__init__.py`
- Create: `addons/facodi_content/tests/common.py`
- Create: `addons/facodi_content/tests/test_resource_provenance.py`
- Create: `addons/facodi_content/tests/test_job_queue.py`
- Create: `addons/facodi_content/tests/test_ingestion.py`
- Create: `addons/facodi_content/tests/test_curriculum.py`
- Create: `addons/facodi_content/tests/test_ai_curation.py`
- Create: `addons/facodi_content/tests/test_matching_coverage.py`
- Create: `addons/facodi_content/tests/test_composition_publication.py`
- Create: `addons/facodi_content/tests/test_update_cycle.py`
- Create: `addons/facodi_content/tests/test_skills.py`
- Create: `addons/facodi_content/tests/test_security.py`
- Create: `addons/facodi_content/tests/test_legacy_migration.py`

### Runtime, CI and documentation

- Create: `.env.example`
- Create: `compose.yaml`
- Create: `docker/odoo/Dockerfile`
- Create: `docker/odoo/odoo.conf`
- Create: `scripts/test_facodi_content.sh`
- Create: `scripts/validate_facodi_content.py`
- Create: `.github/workflows/facodi-content-ci.yml`
- Modify: `.gitignore`
- Rewrite: `addons/facodi_content/README.md`
- Replace: `addons/facodi_content/docs/architecture.md`
- Create: `docs/architecture/facodi-addon/model-map.md`
- Create: `docs/architecture/facodi-addon/workflows.md`
- Create: `docs/architecture/facodi-addon/security-and-rights.md`
- Create: `docs/operations/facodi-local-development.md`
- Create: `docs/operations/facodi-upgrade-19.0.2.0.0.md`
- Create: `docs/integrations/facodi-connectors-and-ai.md`
- Delete after replacement verification: `services/facodi-pipeline/`

## Model Contract

| Model | Responsibility | Standard anchor |
|---|---|---|
| `facodi.source` | Connector/source configuration and discovery cursor | `res.partner`, cron |
| `facodi.license` | Rights vocabulary not present in Odoo Standard | resource rights gate |
| `facodi.resource` | Canonical identity and current editorial state | one-to-many `slide.slide` |
| `facodi.resource.snapshot` | Immutable fetched/uploaded version | `ir.attachment` |
| `facodi.job` | Odoo-native asynchronous command | `ir.cron`, PostgreSQL locks |
| `facodi.concept` | Topic, outcome, competency or prerequisite | translated metadata/tags |
| `facodi.resource.concept` | Evidence-bearing semantic relation | snapshot/analysis/reviewer |
| `facodi.analysis.run` | Versioned AI/extraction execution | resource snapshot/job |
| `facodi.assertion` | Individual proposed inference | human review decision |
| `facodi.program` | Degree/program owned by an institution | `res.partner` |
| `facodi.curriculum` | Versioned plan of study | source resource/snapshot |
| `facodi.curriculum.period` | Year/semester ordering | curriculum |
| `facodi.course.unit` | Curricular unit | optional native course |
| `facodi.unit.concept` | Required topic/outcome/skill/prerequisite | canonical concept |
| `facodi.resource.unit.match` | Content ↔ UC correspondence | analysis and reviewer |
| `facodi.coverage` / `.line` | Reproducible coverage assessment | accepted relations only |
| `facodi.composition` / `.item` | Candidate playlist/module/course/path | publishes as eLearning |
| `facodi.review` | Human assignment and immutable decision | chatter/activity/users |
| `facodi.publication` / `.item` | Exact native publication receipt | `slide.channel`/`slide.slide` |
| `facodi.skill.evidence` | Human-validatable learner evidence | `res.partner`, eLearning progress |
| `facodi.learning.recommendation` | Proposed next resource/path | partner, concept, composition |

## Task 1: Isolated Branch, Docker Baseline and Test Harness

**Files:** `.env.example`, `compose.yaml`, `docker/odoo/Dockerfile`, `docker/odoo/odoo.conf`, `scripts/test_facodi_content.sh`, `scripts/validate_facodi_content.py`, `.gitignore`, `.github/workflows/facodi-content-ci.yml`.

1. Create branch `feat/facodi-addon-v1` from `docs/facodi-architecture-blueprint` in an isolated worktree.
2. Add a failing smoke test script that expects `facodi_content` to install and expose model `facodi.resource`.
3. Run `bash scripts/test_facodi_content.sh`; confirm failure because the model does not exist.
4. Add the official Odoo/PostgreSQL Compose stack and deterministic test database handling.
5. Add static validation for Python compilation, XML parsing, manifest loading and forbidden `supabase` references in addon/runtime code.
6. Run `python scripts/validate_facodi_content.py`; static checks pass while the Odoo smoke test still fails for the missing model.
7. Commit: `build(facodi): add Odoo 19 development and test harness`.

## Task 2: Addon Foundation, Groups and Canonical Resource/Provenance

**Tests first:** `tests/common.py`, `test_resource_provenance.py`, `test_security.py`.

1. Write failing tests for source/resource uniqueness, translated fields, immutable snapshots, attachment linkage, rights eligibility and multi-company visibility.
2. Write failing tests proving curators can edit proposals, managers can configure/publish, ordinary internal users are read-only and portal/public users cannot read FACODI operational models.
3. Run the two test modules and confirm missing-model/access failures.
4. Bump the manifest to `19.0.2.0.0`; add `mail`, `website_slides` and `base_setup` dependencies only.
5. Implement groups `FACODI Viewer`, `FACODI Curator`, `FACODI Manager`, with curator implying eLearning officer and manager implying eLearning manager.
6. Implement `facodi.source`, `facodi.license`, `facodi.resource` and immutable `facodi.resource.snapshot`, all with company boundaries, chatter/activity where a human decision is expected, database constraints and indexes.
7. Store current snapshot and published slides as relations; never duplicate a resource for translation.
8. Seed CC0, CC BY, CC BY-SA, public-domain, external-link, metadata-only and unknown licence/usage policies.
9. Run focused tests until green.
10. Commit: `feat(facodi): add canonical resources rights and provenance`.

## Task 3: Odoo-Native Job Queue and Safe Connector Boundary

**Tests first:** `test_job_queue.py`, URL-safety cases in `test_ingestion.py`.

1. Write failing tests for idempotency keys, FIFO priority, `FOR UPDATE SKIP LOCKED` claiming, bounded attempts, exponential retry, cancellation and redacted errors.
2. Write failing SSRF tests for localhost, RFC1918, link-local, IPv6 private ranges, credential-bearing URLs, unsafe redirects, non-HTTPS API endpoints and oversized responses.
3. Implement `facodi.job` with kinds `discover`, `ingest`, `enrich`, `match`, `coverage`, `compose`, `publish`, `refresh`, `skill_sync`; payload/result use `fields.Json`.
4. Implement one-minute cron runner and stale-lock recovery. Keep each job transition transactional and idempotent.
5. Implement `services/url_safety.py`; validate DNS results before connection and the final URL after redirects, cap body size and redact query strings/tokens from errors.
6. Run focused tests until green.
7. Commit: `feat(facodi): add native jobs and safe connector boundary`.

## Task 4: Complete Content Ingestion Paths

**Tests first:** remaining `test_ingestion.py`.

1. Write failing contract tests for URL normalisation, source/external-key de-duplication, changed-versus-unchanged snapshot checksums and provenance fields.
2. Write mocked adapter tests for YouTube oEmbed video metadata, YouTube Data API playlist/channel pagination, generic HTML OpenGraph/JSON-LD metadata, PDF attachment text extraction and existing `slide.slide` synchronisation.
3. Write wizard tests for a single URL/upload and a batch of URLs. No test may contact the public internet.
4. Implement adapter dispatch in `services/ingestion.py`; providers return one normalised result schema and never write models directly.
5. Implement resource ingestion methods that atomically create/reuse identity, create immutable snapshot, record source facts, select the next rights/review state and enqueue enrichment only when configured.
6. Implement ingest wizard and source discovery actions; store API keys in `ir.config_parameter`, not source records or chatter.
7. Run focused tests until green.
8. Commit: `feat(facodi): ingest web video pdf and Odoo resources`.

## Task 5: Versioned University Curricula

**Tests first:** `test_curriculum.py`.

1. Write failing tests for institution → program → curriculum version → period → UC hierarchy, unique codes within scope, year/semester ordering, ECTS validation and archive rules.
2. Write failing tests for unit topics, learning outcomes, competencies, prerequisites and bibliography links using canonical concepts/resources.
3. Write failing JSON/CSV import tests for idempotent re-import, source snapshot traceability, validation errors with row paths and draft-only mutation.
4. Implement curriculum models and constraints in `models/facodi_curriculum.py` and concepts in `models/facodi_concept.py`.
5. Implement the curriculum import wizard; accepted schema is documented and import always creates/updates a draft curriculum version. Human validation is required to activate it.
6. Relate an approved UC to an optional native `slide.channel`; do not model a second learner-facing course system.
7. Run focused tests until green.
8. Commit: `feat(facodi): add versioned curriculum domain and import`.

## Task 6: AI Runs, Assertions and Human Curation

**Tests first:** `test_ai_curation.py`.

1. Write failing tests for analysis input hash, provider/model/prompt version, source language, requested output language, raw result, assertion confidence/justification and terminal error details.
2. Mock an OpenAI-compatible JSON endpoint and verify summary, concepts, outcomes, skills, prerequisites and difficulty are parsed into proposed assertions.
3. Write tests that malformed output fails without changing the resource, retries are bounded, secrets are redacted and duplicate input/model/prompt reuses the run.
4. Write tests proving only a curator/manager can accept, correct or reject; acceptance materialises semantic relations, correction preserves original inference, and no AI action can approve or publish a resource.
5. Implement `facodi.analysis.run`, `facodi.assertion`, `facodi.resource.concept`, `services/ai.py` and review actions.
6. Implement configuration fields for endpoint, API key, model, timeout and prompt version. Endpoint must be HTTPS and API key is never returned by ordinary settings reads.
7. Use Odoo activities/chatter for assignment and audit, plus a dedicated `facodi.review` record for immutable decisions.
8. Run focused tests until green.
9. Commit: `feat(facodi): add reviewable AI assertions and curation`.

## Task 7: Content ↔ UC Matching

**Tests first:** matching half of `test_matching_coverage.py`.

1. Write failing tests for deterministic candidates based on accepted concept overlap, relevance, estimated coverage, level, confidence, justification, origin, analysis run and validation state.
2. Write tests for one current match per resource/UC pair, re-analysis history through assertions/reviews and accept/correct/reject permissions.
3. Write a cross-language case where English resource metadata and Portuguese UC metadata resolve to the same canonical concepts without duplicating either record.
4. Implement `facodi.resource.unit.match` and `services/matching.py` with a deterministic baseline scorer. Optional AI can suggest scores/justification but cannot validate them.
5. Add resource and UC actions to generate candidates and schedule reviews.
6. Run focused tests until green.
7. Commit: `feat(facodi): match resources to curricular units`.

## Task 8: Reproducible Curriculum Coverage

**Tests first:** coverage half of `test_matching_coverage.py`.

1. Write failing tests for weighted per-concept coverage from accepted matches and accepted resource-concept evidence only.
2. Cover status boundaries: `good >= 0.80`, `partial >= 0.30`, `gap < 0.30`, and `redundant` when at least three strong accepted resources cover the same requirement. Put thresholds in settings.
3. Verify the overall score, input fingerprint, resource count, explanation and next action are reproducible and change only when accepted inputs change.
4. Verify a recomputation creates a new assessment version instead of rewriting a validated historical assessment.
5. Implement `facodi.coverage`, `.line`, recomputation job and review/validation actions.
6. Add list, pivot, graph and search views for the curriculum coverage map.
7. Run focused tests until green.
8. Commit: `feat(facodi): calculate versioned curriculum coverage`.

## Task 9: Candidate Composition and Native eLearning Publication

**Tests first:** `test_composition_publication.py`.

1. Write failing tests for playlists, modules, courses and learning paths; ordered resource/child-composition items; exclusive item target; duplicate prevention; and cycle detection.
2. Verify generated/AI compositions remain `candidate`, require human review, and cannot publish while any item is rejected, rights-ineligible or lacks an accepted snapshot.
3. Write publication mapping tests: video → native video slide; eligible external document → document/link; article/book/chapter/exercise/external metadata → native article with attribution and source link; composition → native `slide.channel` plus sections/slides.
4. Verify a resource can appear in multiple courses through distinct `slide.slide` records sharing one `facodi_resource_id`.
5. Verify publication creates `facodi.publication` and `.item` receipts linking exact snapshots, reviewer, native records and timestamp; retry must be idempotent.
6. Implement composition models, cycle checks, `services/publication.py`, publication state machine and extensions to `slide.channel`/`slide.slide`.
7. Separate `prepare draft` from `publish`; only an approved review and manager action can set native records published.
8. Run focused tests until green.
9. Commit: `feat(facodi): compose and publish approved eLearning content`.

## Task 10: Continuous Update Cycle and Feedback Signals

**Tests first:** `test_update_cycle.py`.

1. Write failing tests for refresh scheduling by `next_check_at`, ETag/Last-Modified use, unchanged snapshots, changed snapshots, deleted/unreachable sources and reactivation.
2. Verify a changed published resource becomes `stale`, retains the published snapshot and opens a review; it never overwrites a published slide automatically.
3. Verify an accepted update refreshes only publication items linked to that resource, creates a new receipt revision and preserves prior snapshot history.
4. Verify native ratings, views and slide/course completion are read as feedback signals for analysis/recommendation without copying them into a parallel progress model.
5. Implement refresh job, review action and publication update path; add daily cron scheduling.
6. Run focused tests until green.
7. Commit: `feat(facodi): add traceable content refresh cycle`.

## Task 11: Skills Evidence and Personalised Recommendations Baseline

**Tests first:** `test_skills.py`.

1. Write failing tests that accepted curriculum competencies and native eLearning completion can propose learner skill evidence.
2. Verify evidence remains proposed until a curator validates it, records source course/content and completion event, and never claims an external formal credential.
3. Write recommendation tests ranking approved resources/compositions by uncovered target competencies, prerequisite satisfaction, language compatibility and learner history.
4. Verify recommendations are explainable, dismissible, time-bounded and never auto-enrol or auto-publish.
5. Implement `facodi.skill.evidence` and `facodi.learning.recommendation`, using `res.partner`, `slide.channel.partner` and `slide.slide.partner` as the standard identity/progress anchors.
6. Add backend views with record rules: learners can read only their own evidence/recommendations through internal/portal-safe methods; operational write access remains curator-only.
7. Run focused tests until green.
8. Commit: `feat(facodi): add validated skill evidence and recommendations`.

## Task 12: Backend Information Architecture and Settings

**Tests first:** view/action assertions added to domain tests and a smoke install test.

1. Write failing tests that resolve every action, menu and inherited view XML ID and verify restricted groups.
2. Add a FACODI application menu with Catalog, Curriculum, Intelligence, Coverage, Composition, Curation, Publication and Configuration sections.
3. Build compact list/form/search/pivot/graph views; include chatter and activity widgets only on reviewable aggregate records.
4. Extend native eLearning forms with FACODI resource/composition/publication provenance links while keeping legacy enrichment fields in a collapsed compatibility group.
5. Add `res.config.settings` for connector/AI timeouts, keys, coverage thresholds, refresh interval and publication defaults.
6. Run a fresh module install and focused tests until green.
7. Commit: `feat(facodi): add operational backend and settings`.

## Task 13: Upgrade Migration From 19.0.1.1.0

**Tests first:** `test_legacy_migration.py` plus an actual two-version Docker upgrade fixture.

1. Create legacy fixtures containing old `slide.slide` fields in all enrichment states, repeated resource use needs, summaries, errors, URLs and source keys.
2. Write failing assertions for idempotent backfill into source/resource/snapshot/analysis/assertion records and preservation of old slide values.
3. In `pre-migrate.py`, drop only the old database uniqueness constraint on `slide_slide.facodi_source_key`; the canonical uniqueness moves to `(source_id, external_key)` on `facodi.resource`.
4. In `post-migrate.py`, call a tested model helper that creates an `odoo_legacy` source, maps legacy states, computes a snapshot checksum, records a legacy analysis/assertion when appropriate and links the slide to the canonical resource.
5. Queued/processing legacy jobs become reviewable `enrichment` resources and new Odoo jobs; they do not depend on the old SQLite service.
6. Run migration helper twice and verify no duplicates.
7. Build a Docker database with manifest `19.0.1.1.0`, install, load fixtures, switch to new code, run `-u facodi_content`, and run all migration assertions.
8. Commit: `feat(facodi): migrate legacy enrichment into canonical domain`.

## Task 14: Retire the Standalone Pipeline and Harden Operations

**Files:** old `services/facodi-pipeline/` plus runtime/CI files.

1. Search the complete repository for `facodi.pipeline`, `/v1/videos/enrich`, SQLite job paths and service references.
2. Confirm all addon callers and data migration tests are green.
3. Delete `services/facodi-pipeline/`; this removal is recoverable in Git and occurs only after the replacement passes.
4. Add a validation rule preventing runtime references to the retired endpoints while allowing the upgrade guide to name legacy keys.
5. Add CI jobs for static validation, fresh Odoo install, full tagged addon tests and upgrade migration.
6. Run the full CI command locally.
7. Commit: `refactor(facodi): retire standalone enrichment pipeline`.

## Task 15: Documentation and Drive Delivery

**Files:** addon README and all `docs/architecture`, `docs/operations`, `docs/integrations` targets above.

1. Rewrite documentation from the shipped model/actions, not from old proposals.
2. Document model ownership, state machines, rights matrix, provenance chain, permissions, menus, jobs, connector contracts, AI contract, multilingual behaviour, publication mappings, backup/restore, local Docker flow and upgrade/rollback.
3. Add Mermaid diagrams for the actual runtime pipeline, review gate, publication sequence, update cycle and model boundary; keep the Lucid blueprint as the conceptual companion.
4. Document exact admin procedures and commands, including API-key rotation and how to re-run failed jobs safely.
5. Create one native Google Doc named `FACODI — Addon Odoo Community 19: Arquitetura, Operação e Migração` inside the existing FACODI architecture folder. Include links to the GitHub branch/PR, Lucid blueprint and repository docs.
6. Verify the Google Doc by reading it back and checking all main headings and links.
7. Commit: `docs(facodi): document architecture operations and migration`.

## Task 16: Final Verification, Review and Pull Request

1. Run `python scripts/validate_facodi_content.py`.
2. Run `bash scripts/test_facodi_content.sh --fresh`.
3. Run `bash scripts/test_facodi_content.sh --upgrade`.
4. Run a repository search and confirm no production code contains `supabase`, old external pipeline endpoints, secrets, `TODO`, `FIXME`, placeholder assertions or network-enabled tests.
5. Inspect `git diff --check`, migration idempotency, access-control failures and Docker health checks.
6. Request a code review focused on standard-Odoo reuse, security, rights enforcement, migration safety and AI/human separation; address findings with new failing tests first.
7. Push the final branch and create a pull request to `production`, without merging it unless explicitly requested.
8. Update the Google Doc with final commit SHA, PR URL, verification evidence and known operational limits.

## Verification Commands

```bash
python scripts/validate_facodi_content.py
bash scripts/test_facodi_content.sh --fresh
bash scripts/test_facodi_content.sh --upgrade
git diff --check
rg -n --hidden --glob '!docs/operations/facodi-upgrade-19.0.2.0.0.md' \
  'supabase|/v1/videos/enrich|facodi\.pipeline|TODO|FIXME' \
  addons/facodi_content services docker scripts .github
```

Expected results: static validation exits 0; fresh install and upgrade suites exit 0; `git diff --check` is empty; the forbidden-reference search returns no production-code matches.

## Delivery Checkpoints

- Checkpoint A after Task 5: canonical catalog, jobs, ingestion and curriculum are demonstrable.
- Checkpoint B after Task 9: AI, curation, matching, coverage and native publication are demonstrable.
- Checkpoint C after Task 13: update, skills baseline, UI and migration pass.
- Final after Task 16: CI, documentation, Drive readback and PR are complete.

## Explicit Non-Goals

- No replacement LMS frontend or duplicate learner authentication/progress subsystem.
- No automatic legal determination of copyright status.
- No automatic academic credential issuance; skills evidence is advisory and human-validatable.
- No redistribution of source media unless the recorded licence and usage mode expressly permit it.
- No Supabase, no Enterprise-only Odoo dependency and no hidden external source of truth.
