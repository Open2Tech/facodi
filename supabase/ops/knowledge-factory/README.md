# Knowledge Factory — operational migration history

This directory preserves the actual Knowledge Factory SQL migration history (2026-11-26/27), outside automatic supabase/migrations. It is not a bootstrap script. The live database has historical migrations and deployment prerequisites not reconciled with Git. Do not run this history as a batch. Do not use migration repair to conceal drift.

Supabase owns learning objects, publication and evidence; Odoo owns operational work orders, quality decisions and editorial tasks. The private asynchronous route in facodi-suggestion-analysis reuses the community worker without triggering community notification or publication side effects. Credentials stay in Vault/environment. No credential values, learner records, receipts or production data exports belong in Git. SQL includes deployment-specific selectors, public endpoint addresses and editorial batches; parameterize them before reuse. Native Odoo configuration, separately configured schedules and production content are not reproduced by this history.

Verify schema dependencies, RLS, grants and extensions in a disposable database before integrating these files into automated migration deployment. Verify actual outcomes, lease expiry, idempotency, public visibility and mirror reconciliation. A successful dispatch is not a successful analysis or editorial approval.

Existing operational snapshot: twice per hour; AV dispatcher: daily; mirror: every two minutes. Preserve normal community notifications; do not send synthetic messages to production recipients. For incident recovery, disable only the affected schedule, preserve evidence, and restore the previous worker version if confirmed necessary. Do not retry paid jobs indiscriminately.

The aggregate snapshot exposes `kf_assurance_v1.resource_av_batches` for source receipts that pass the MRP manifest checks. It reports the resource count and at most one qualifying audiovisual job per resource. The [Odoo snapshot action block](odoo/resource_av_assurance.py) matches each batch against the existing `facodi.kf.mrp.evidence.manifest.v1` allowlist and its manufacturing order. It adds evidence to the pending curricular relevance check. The check and publication decision require their existing approvals.

To reconcile eLearning, compare `facodi.kf_mirror_health_v1()` with the active native courses and their slides in Odoo. The SQL function measures the local ledger. A newly mirrored course stays unpublished until its slides are complete. The active mirror job imports at most 50 records per run.
