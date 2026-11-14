# Histórico — integração Odoo desativada no frontend

Este documento descreve o fluxo anterior. O frontend FACODI atual consulta
exclusivamente o schema Supabase `facodi`, sem Odoo nem esta Edge Function.
Não executar os passos de deployment abaixo para a aplicação atual.
Consultar [README](../../README.md).

# FACODI curriculum frontend (isolated pilot)

The new `/facodi/knowledge` route belongs to the existing Tube O2 React SPA. It is **not** a replacement for `/facodi`, the current playlist experience, or the FACODI Odoo Learning add-on. This feature is isolated on a branch originating from `facodi` and must not be merged/deployed to `marcelo-m7.com` or Tube O2 production without separate regression and operational approval.

## Source of truth and permissions

- **Odoo 19 Community (`https://facodi.com`)** remains canonical. `facodi.learning.curriculum.reference`, `.unit`, `.coverage`, and `slide.channel` are consumed without modifying any record.
- **Supabase project `wvkjainfwsyiyfcmbtid`** hosts the `facodi-curriculum` read-only Edge Function. The current frontend uses the repository's existing Supabase client and authenticated sessions.
- The Odoo user API key is stored as **`ODOO_SECRET` only in Supabase Edge Function secrets**, never in a `VITE_` variable, the Git repository, or a browser request. The function uses the Odoo 19 JSON-2 API (`/json/2/<model>/search_read`) with `Authorization: bearer ...`. `ODOO_USER` and `ODOO_PASSWORD` are intentionally unused: the connector never transmits the account password.
- Requests require a valid Supabase user JWT and pass the existing per-user rate limiter. The response contains **only** approved coverage, published references and published courses, projected to a small explicit field allowlist. It never includes internal editor reviews, full evidence JSON or personal information.
- Curriculum `equivalent` means an **editorial** comparison only, not legal equivalence, ECTS or university recognition.

## Configuration (administrator)

1. Verify that the Odoo 19 deployment supports the JSON-2 API and that its user-key account has minimal **read-only** ACLs for the four whitelisted models. Do not use an Odoo administrator key for this frontend.
2. In Supabase project `wvkjainfwsyiyfcmbtid`, configure secrets `ODOO_SECRET` and `ODOO_DB=facodi`. The **FACODI-specific** function pins the Odoo server to `https://facodi.com` regardless of the `ODOO_URL` variable, so a malformed deployment variable cannot redirect the privileged API key to another host. `ODOO_URL` can remain defined as `https://facodi.com` for compatibility, but is not used to select the destination.
3. The `facodi-curriculum` function has a **scoped HTTPS CORS allowlist** for `marcelo-m7.com`, `marcelo-m7.me`, `facodi.com` (each apex and subdomains), and the Cloudflare account's preview suffix `*.marcelo-0d6.workers.dev`. This includes the branch preview at `https://feature-facodi-curriculum-frontend-tube-o2.marcelo-0d6.workers.dev`. Existing `ALLOWED_ORIGIN`/`ALLOWED_ORIGINS` entries are retained; they must not be changed to `*`. Unrelated `*.workers.dev` accounts are deliberately **not** authorized. CORS is a browser origin policy, not authentication or a substitute for Supabase JWT validation.
4. Deploy only `facodi-curriculum`; **do not push the entire Supabase config**. The local function declares `verify_jwt=true` and requires the shared `check_edge_rate_limit` RPC.
5. Publish and validate the intended UAlg/LESTI curriculum in `facodi_learning` (`website_published=true`) and approve actual coverage to published `slide.channel` records. Do not seed fictitious mappings into a production database.

For a Coolify/Vite Docker build, set the **public** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` build arguments as well. `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` without the `VITE_` prefix do not automatically configure the browser bundle. `SUPABASE_SECRET_KEY` and `SUPABASE_JWKS_URL` must remain server-side and are not used as browser configuration.

Deployment check (2026-10-27): `facodi-curriculum` was deployed to `wvkjainfwsyiyfcmbtid` with `verify_jwt=true`; an unauthenticated POST returned HTTP 401. A signed-in end-to-end test from the Cloudflare Access-protected Worker **succeeded after Edge Function v6**, returning four published programmes and real Odoo curriculum/coverage/course mappings. LESTI shows 43 units, eight editorial partial mappings and 35 unmapped units. This establishes live read connectivity, not an authorization/security review of Monynha's Odoo access groups; validate least privilege before merging.

Without configured secrets or published Odoo records, the frontend reports an unavailable or empty state; it does not substitute local mock content.

## Contract and smoke test

`POST /functions/v1/facodi-curriculum` requires Supabase Auth bearer and project apikey headers; its success response is:

```json
{
  "references": [{"id": 1, "institution": "Universidade do Algarve", "programme": "LESTI", "year": "2026/27", "code": "LESTI", "sourceUrl": null}],
  "units": [{"id": 2, "referenceId": 1, "name": "Análise Matemática I", "code": "AM1", "year": 1, "period": "1", "credits": 6}],
  "courses": [],
  "coverage": []
}
```

This is a **shape example**, not live data. An anonymous request must be rejected, a valid signed-in user can receive published/approved data only, and unsupported Odoo APIs return a sanitized 502. All requests are server-to-server; no Odoo key is visible in browser DevTools.

## Acceptance checklist

- `bun run typecheck`, `bun run test`, `bun run build` pass.
- Existing `/`, `/facodi`, `/videos` and `/playlists` behave as before.
- `/facodi/knowledge` handles login requirements, no published references, no mapped courses, error states and valid data.
- Check responsive layout, keyboard navigation, locale strings (pt/en/es/fr), contrast and links to canonical Odoo course pages.
- Exercise Odoo JSON-2 live read against a least-privileged API-key user, then inspect the response for private data.
- Do not merge into `facodi` or `main` before the deploy target and the `marcelo-m7.com` preservation strategy are confirmed.

## Preview hardening (PR #72 review, 27 October 2026)

- Cloudflare Access protects the branch preview. The PWA plugin now emits one manifest link with `crossorigin="use-credentials"` so the manifest fetch includes the existing Access session rather than being redirected to the cross-origin Access login page. Visitors still need legitimate access; this does not bypass Cloudflare Access. Do not permit wildcard CORS on Cloudflare's login service.
- Authentication is resolved before invoking the Supabase function. A signed-out visitor sees a dedicated sign-in state, and the return path `/facodi/knowledge` is kept for the existing login flow. The React Query snapshot key includes the authenticated Supabase user ID to avoid another user's cached snapshot being displayed after account switching.
- The Odoo connector pages all four model queries in stable `id asc` order, with a 5,000-record safety cap per model. Rather than reporting misleading coverage when the cap is exceeded, it returns a sanitized upstream error. The Supabase Edge logs indicate the failing stage and HTTP status, **never credentials or Odoo response bodies**.
- The `facodi-curriculum` Supabase Edge Function **v6** remains authenticated (`verify_jwt=true`), read-only and CORS-scoped to the existing trusted origins. A real authenticated browser request initially returned 502; safe logs isolated the cause as `configuration / invalid_odoo_origin`. The function now pins the canonical FACODI host while keeping `ODOO_SECRET` exclusively in Supabase secrets. Subsequent authenticated browser requests returned the intended four programmes and mapped courses successfully. Logs distinguish rate-limit, configuration, network and upstream HTTP errors without disclosing the Monynha API key.
- The branch preview PWA and its manifest may remain inaccessible to visitors who have not authenticated with **Cloudflare Access**, separately from Supabase Auth. This is expected and should not be worked around by relaxing access policies.

## Authenticated Atlas route metadata (follow-up to #74)

The client-side `/facodi/knowledge` route now applies `robots` and `googlebot`
`noindex, nofollow, noarchive` meta tags while mounted. It temporarily
removes the public Tube O2 canonical and language-alternate links, preventing
the authenticated Atlas from inheriting the homepage's canonical. On navigation
away, the previous tags and document title are restored to avoid contaminating
public pages. Unit tests cover entry, departure and translated title changes.

**Limit:** in a static SPA, the first HTML response is the shared `index.html`.
A crawler that does not execute JavaScript may never see the route-specific
robots tags. For reliable crawler exclusion configure an HTTP
`X-Robots-Tag: noindex, nofollow` response for
`/facodi/knowledge` on the owning Cloudflare Worker (and any other server
hosting this route). Validate with an unauthenticated HTTP request before
claiming server-side noindex. This meta tag is not authentication or an
authorization control.
