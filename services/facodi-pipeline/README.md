# FACODI Pipeline

Authenticated metadata enrichment for curator-approved video URLs. The service stores jobs in SQLite, fetches public oEmbed metadata, and returns a suggested summary. It never downloads or republishes source media.

## Run

```bash
export PIPELINE_TOKEN="replace-with-a-random-secret"
docker compose up -d --build
curl http://127.0.0.1:8000/healthz
```

Use a persistent HTTPS deployment for Odoo integration. Configure these protected Odoo system parameters:

- `facodi.pipeline.base_url`: public HTTPS service URL, without a trailing slash
- `facodi.pipeline.token`: same bearer token as `PIPELINE_TOKEN`
- `facodi.pipeline.timeout`: request timeout in seconds, from 1 to 60

The Odoo addon queues jobs from the eLearning content form and polls active jobs every five minutes. Applying a ready suggestion updates the native content description but never publishes the course or video.

## Validate

```bash
python -m pytest -q
```