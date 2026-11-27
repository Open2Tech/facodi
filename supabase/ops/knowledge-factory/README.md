# Knowledge Factory — operational migration history

This directory preserves the actual Knowledge Factory SQL migration history (2026-11-26/27), outside automatic supabase/migrations. It is not a bootstrap script. The live database has historical migrations and deployment prerequisites not reconciled with Git. Do not run this history as a batch. Do not use migration repair to conceal drift.

Supabase owns learning objects, publication and evidence; Odoo owns operational work orders, quality decisions and editorial tasks. The private asynchronous route in facodi-suggestion-analysis reuses the community worker without triggering community notification or publication side effects. Credentials stay in Vault/environment. No credential values, learner records, receipts or production data exports belong in Git. SQL includes deployment-specific selectors, public endpoint addresses and editorial batches; parameterize them before reuse. Native Odoo configuration, separately configured schedules and production content are not reproduced by this history.

Verify schema dependencies, RLS, grants and extensions in a disposable database before integrating these files into automated migration deployment. Verify actual outcomes, lease expiry, idempotency, public visibility and mirror reconciliation. A successful dispatch is not a successful analysis or editorial approval.

Existing operational snapshot: twice per hour; AV dispatcher: daily; mirror: every two minutes. Preserve normal community notifications; do not send synthetic messages to production recipients. For incident recovery, disable only the affected schedule, preserve evidence, and restore the previous worker version if confirmed necessary. Do not retry paid jobs indiscriminately.

The aggregate snapshot exposes `kf_assurance_v1.resource_av_batches` for source receipts that pass the MRP manifest checks. It reports the resource count and at most one qualifying audiovisual job per resource. The [Odoo snapshot action block](odoo/resource_av_assurance.py) matches each batch against the existing `facodi.kf.mrp.evidence.manifest.v1` allowlist and its manufacturing order. It adds evidence to the pending curricular relevance check. The check and publication decision require their existing approvals.

To reconcile eLearning, compare `facodi.kf_mirror_health_v1()` with the active native courses and their slides in Odoo. The SQL function measures the local ledger. A newly mirrored course stays unpublished until its slides are complete. The active mirror job imports at most 50 records per run.

## Recovery checks

Run [recovery-preflight.sql](recovery-preflight.sql) before configuring the integration and again after restoring the KF schema. It lists missing objects by platform, FACODI catalog and KF. The catalog prerequisites include the FACODI foundation, learning objects and academic catalog migrations from the Supabase migration history. The Git migration directory starts after their original versions.

```sh
psql "$KF_RESTORED_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/ops/knowledge-factory/recovery-preflight.sql
psql "$KF_SCRATCH_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/ops/knowledge-factory/rehearsal-private-av.sql
```

The second command uses an empty PostgreSQL database and synthetic jobs. It exercises claim, finish, retry and the daily cap, then rolls back its fixtures. Deployment verification also requires the worker secrets, the enabled cron jobs and an Odoo instance configured for the integration.

For private audiovisual analysis, first attempts precede retries. A gateway failure with HTTP 502, 503 or 504 makes the job eligible for one additional attempt within the existing daily cap. The previous attempt stays in the job record. Two consecutive failures still open the circuit.
