# FACODI Content

![Odoo 19](https://img.shields.io/badge/Odoo-19.0-714B67?logo=odoo&logoColor=white)
![License](https://img.shields.io/badge/license-LGPL--3-blue)
![Status](https://img.shields.io/badge/status-Beta-yellow)

Content and enrichment extensions for FACODI eLearning collections.

## Objective

`facodi_content` extends Odoo eLearning with stable collection metadata and a reviewable enrichment workflow for video lessons. It keeps editorial control inside Odoo while allowing an external FACODI pipeline to suggest summaries.

## Problem solved

Native `slide.channel` and `slide.slide` records do not provide a stable FACODI source identity, editorial collection type, or a controlled state machine for external enrichment. This addon adds those capabilities without replacing Odoo's eLearning models.

## Features

- Collection type on `slide.channel`: course, curricular unit, topic, playlist, or learning path.
- Publishing partner on collections.
- Stable `facodi_source_key` on slides with a database uniqueness constraint.
- Enrichment state, job reference, summary, error, and update timestamp.
- Officer-only actions to queue, refresh, and apply enrichment.
- Scheduled refresh for queued and processing jobs.
- HTTPS-only pipeline configuration with bearer token and bounded timeout.
- Sanitized HTML summaries before they are written to the slide description.

## Functional flow

```mermaid
flowchart LR
    A[Video slide with source URL] --> B[Queue enrichment]
    B --> C[External FACODI pipeline]
    C --> D{Job state}
    D -->|processing| E[Cron refresh]
    E --> C
    D -->|ready| F[Officer reviews summary]
    F --> G[Apply to slide description]
    D -->|failed| H[Review error and retry]
```

## Architecture

- `models/slide_channel.py`: collection metadata.
- `models/slide_slide.py`: enrichment fields, actions, pipeline client, and cron entry point.
- `views/slide_channel_views.xml`: backend collection fields.
- `views/slide_slide_views.xml`: backend enrichment fields and actions.
- `data/ir_cron.xml`: periodic refresh job.

## Dependencies

- Odoo 19 Community: `website_slides`.
- Python package: `requests`.
- A FACODI-compatible HTTPS enrichment service is optional and only required for enrichment actions.

## Installation

Add `odoo/facodi/addons` to the Odoo addons path, update the Apps list, and install **FACODI Content**.

```bash
python3 odoo-bin -d <database> \
  --addons-path=<odoo-core>/addons,odoo/facodi/addons \
  -i facodi_content --stop-after-init
```

## Configuration

Set these system parameters before using enrichment:

- `facodi.pipeline.base_url`: HTTPS base URL.
- `facodi.pipeline.token`: bearer token.
- `facodi.pipeline.timeout`: timeout in seconds, clamped to 1-60 seconds.

Only users in `website_slides.group_website_slides_officer` can manage enrichment.

## Usage

1. Create or open a video slide with a source URL.
2. Set its FACODI source key if it is imported from an external catalogue.
3. Use **Queue Enrichment** as an eLearning officer.
4. Refresh the job manually or wait for the scheduled job.
5. Review the suggested summary and apply it explicitly.

## Limitations

- The external service contract is intentionally small and must expose `/v1/videos/enrich` and `/v1/jobs/<id>`.
- The addon does not publish content automatically.
- Failed jobs require an officer review and retry.
- No frontend or portal UI is included; this addon is a backend content extension.

## Roadmap

- Add a dedicated configuration view for pipeline parameters.
- Add audit history for enrichment changes.
- Add tests using a mocked pipeline transport.
- Add a review queue dashboard for editors.

## Contribution

Keep model extensions narrow, preserve Odoo inheritance patterns, add regression tests for state transitions, and validate XML before opening a pull request. See the repository contribution guidance at [github.com/Open2Tech/facodi](https://github.com/Open2Tech/facodi).

## License and authors

Copyright Open2 Technology. Licensed under [LGPL-3](https://www.gnu.org/licenses/lgpl-3.0.html).

Maintained by Open2 Technology: [open2.tech](https://open2.tech).
