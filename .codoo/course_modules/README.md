# FACODI course modules

Prepared course structures:

- `courses/matematica_i.json`
- `courses/probabilidade_estatistica.json`

The video catalog is intentionally empty until the Odoo Staging and Supabase
sources are reachable and the URLs are curator-approved. Do not invent URLs or
publish courses without source evidence.

## Import contract

Populate a catalog following `video_catalog.schema.json`, then run:

```bash
.venv/bin/python odoo/facodi/.codoo/course_modules/create_course_modules.py \
  dry-run --catalog path/to/approved-video-catalog.json \
  --target staging --env .env
```

After reviewing the dry-run:

```bash
.venv/bin/python odoo/facodi/.codoo/course_modules/create_course_modules.py \
  apply --catalog path/to/approved-video-catalog.json \
  --target online --env .env --confirm APPLY-FACODI-COURSES
```

The importer uses only `slide.channel` and `slide.slide`, creates or updates
courses idempotently, keeps them unpublished, and never copies or redistributes
video files. It refuses to apply with an empty or unapproved catalog.

Current blocker: Odoo Staging is resolving to `0.0.0.0` and Supabase MCP is timing
out, so no remote video inventory could be collected in this run.
