# FACODI Content architecture

## Scope

This addon extends native Odoo eLearning models. It does not introduce replacement models or frontend controllers.

## Models

### `slide.channel`

- `partner_id`: optional publishing institution or organization.
- `collection_type`: required taxonomy value used to distinguish courses, curricular units, topics, playlists, and learning paths.

### `slide.slide`

- `facodi_source_key`: stable external identity, indexed and unique.
- `enrichment_state`: editorial state machine (`new`, `queued`, `processing`, `ready`, `failed`, `applied`).
- `enrichment_job_ref`: external job identifier.
- `enrichment_summary`: sanitized suggested HTML summary.
- `enrichment_error`: last service error.
- `enrichment_updated_at`: last pipeline synchronization time.

## Security and editorial control

Only `website_slides.group_website_slides_officer` users can queue, refresh, or apply enrichment. The module never publishes a slide as a side effect of enrichment.

## Integration contract

The optional service must provide:

- `POST /v1/videos/enrich` with `{ "source_url": "..." }`.
- `GET /v1/jobs/<job_id>`.
- A JSON object containing `state`; ready jobs provide `summary`, failed jobs may provide `error`, and jobs should provide `id`.

The client requires an HTTPS base URL, bearer token, and a timeout clamped between 1 and 60 seconds.

## Automation

`data/ir_cron.xml` schedules refreshes for up to 50 queued or processing slides. Individual service failures are logged and do not stop the full cron batch.

## Extension points

Keep new fields on the native models, add view changes through inherited views, and keep transport logic isolated in `slide_slide.py`. New external states must be added to both the service validation and the editorial selection field before use.
