# Histórico — observabilidade da integração anterior

O frontend FACODI atual não chama Odoo nem a função descrita abaixo.
Este documento é mantido como histórico, não como procedimento operacional.
Consultar [README](../../README.md).

# FACODI Curriculum Atlas — observability runbook

**Scope:** only `supabase/functions/facodi-curriculum`. Odoo 19 remains the read-only source of approved/public curriculum data. Supabase Auth JWT, rate limits, CORS and the `ODOO_SECRET` server-side key remain unchanged. No new database table or third-party telemetry destination is required.

## Structured request completion logs

After this PR is reviewed and **the Edge Function is deployed separately**, each non-OPTIONS request emits one JSON line via `console.info`:

```json
{"event":"facodi_curriculum_request","request_id":"c0fe1234-5678-4abc-8def-0123456789ab","status":200,"outcome":"ok","stage":"upstream","duration_ms":154,"upstream_duration_ms":112,"counts":{"references":4,"units":122,"courses":8,"coverage":24}}
```

- `request_id` is an unpredictable UUID generated server-side; the same value is returned as `X-Request-Id` (exposed to the browser via `Access-Control-Expose-Headers`). It enables correlation with a support report without logging the identity of the user.
- `status`, `outcome`, `stage`, and optional `reason`/`upstream_status` use finite whitelisted values. On upstream errors, the stage identifies the failing Odoo model-read phase (`references`, `units`, `coverage`, or `courses`).
- `duration_ms` measures the whole function path after method dispatch; `upstream_duration_ms` measures only the Odoo read section. Durations are rounded and bounded; success counts are aggregates only, never raw course/unit records.
- **Never log** `Authorization`, `ODOO_SECRET`, service-role keys, user ID, email, IP, Odoo response bodies, exception messages/stacks or raw client headers. The helper enforces a whitelist at runtime, including against unexpected upstream text.
- `OPTIONS` requests keep existing CORS behavior and are counted through Supabase platform `edge_logs`/`function_edge_logs`; they intentionally have no application completion event.
- Error responses remain sanitized (401/429/502/503); all non-OPTIONS responses now return `Cache-Control: private, no-store` and the request correlation header.

## Review logs and suggested alert criteria

Open **Supabase project `wvkjainfwsyiyfcmbtid` → Logs → Edge Functions**, filter to `facodi-curriculum`, then search for `facodi_curriculum_request`. Group by status, outcome, stage and reason. Use the response's `X-Request-Id` from DevTools to isolate one attempt. Restrict log access to operational administrators.

Initial proposed thresholds (tune after measuring normal traffic):

| Signal | Suggested alert | First diagnostic action |
| --- | --- | --- |
| 502/503 | >=3 completion events in 5 minutes | Group by stage and reason; check Odoo API health vs rate limiter |
| Odoo auth denied | `upstream_status` 401/403 | Check read-only ACL/API key rotation for Monynha; never print the key |
| Timeout/connectivity | `reason=network_failure` | Inspect server-to-server DNS/TLS, Odoo uptime and upstream latency |
| Incomplete snapshot | `reason=incomplete_snapshot` | Audit approved data growth and 5,000-row safety cap; do not raise silently |
| Slow reads | p95 `duration_ms` > 8000 over 15 minutes | Split by upstream duration; review pagination and Odoo performance |
| Sudden empty snapshots | `counts.references=0` on HTTP 200 | Check Odoo publication/editorial visibility before calling it a failure |

This PR **adds observable events only**. Automated alert delivery is *not* created by the code; enable a supported log alert/drain in the project dashboard if the Supabase plan and available observability provider support it. Avoid implementing a log-drain receiver as an Edge Function in the same project without loop protection.

## Release and verification gates

1. Review the PR and validate `bun run test`, `bun run typecheck`, `bun run lint` and `bun run build`. Do not merge on a failing CI.
2. After approval, deploy **only** `facodi-curriculum` from the merged revision, preserving `verify_jwt=true`. Keep `ODOO_SECRET` exclusively in Supabase secrets. Do not deploy all Edge Functions or modify RLS, DB schema or the frontend app.
3. Test `OPTIONS` from `https://tube.marcelo-m7.me` (204, scoped allowed origin), an anonymous POST (401 or Supabase gateway rejection), and a legitimate authenticated POST (200). Verify the same curricular snapshot and that `X-Request-Id` can be read by the browser for function-generated responses.
4. Confirm one JSON event per function-handled POST in Edge logs, and check a synthetic mocked upstream 403 produces `status=502,stage=references,reason=upstream_http_error,upstream_status=403`, without secrets.
5. Test `/facodi/knowledge`, `/facodi`, login/logout and existing video/playlist pages. An Edge-only deploy should not change the current Cloudflare Workers bundle.
6. Record the deployed function version, results and any outstanding alerts in issue [#74](https://github.com/marcelo-m7/tube-o2/issues/74). Roll back the individual function to its prior v6 bundle if new errors occur.

No account credentials or personal information belong in PR comments or QA logs.
