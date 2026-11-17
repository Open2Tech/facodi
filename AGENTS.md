# FACODI Agent Guide

Fast-start guide for AI coding agents in this repository. Keep changes small, follow existing patterns, and prefer linking to docs over duplicating them.

## Fast Facts

- Product: FACODI, an open digital campus (courses, curricular units, learning objects).
- Organization: Open 2 Technology (Open2 / O2T).
- Stack: React, TypeScript, Vite, Tailwind, shadcn/ui, Supabase (Auth + `facodi` schema), TanStack Query.
- Package manager: Bun only (`bun install`, `bun run <script>`, `bunx <tool>`). If missing from PATH: `export PATH="$HOME/.bun/bin:$PATH"`.
- Source of truth: [README.md](README.md), [AI_RULES.md](AI_RULES.md), [docs/CODEBASE.md](docs/CODEBASE.md), and scoped rules in [.github/instructions](.github/instructions).
- Supabase project ref: `wvkjainfwsyiyfcmbtid`. No Odoo integration, no `public` schema data; the only Edge Function is the server-side suggestion worker `facodi-suggestion-analysis`.

## Dependency Notes

- `tailwindcss@3.4.19` and `lucide-react@0.462.0` are intentional pins.
- `tsconfig.json` uses `"ignoreDeprecations": "6.0"` while alias migration away from `baseUrl` is pending.

## Commands

| Goal | Command |
|---|---|
| Development (port 8080) | `bun run dev` |
| Build | `bun run build` |
| Preview build (port 4173) | `bun run preview` |
| Lint | `bun run lint` |
| Type check | `bun run typecheck` |
| Tests | `bun run test` |
| E2E tests | `bun run test:e2e` |
| Regenerate `facodi` types | `bun run db:types > src/integrations/supabase/types.ts` |

- Targeted tests: `bun run test -- <pattern>` (Vitest; do **not** use `--testPathPattern`).
- Keep `bun.lock` as the only lockfile.
- Never run `supabase config push --yes`; inspect the diff and preserve remote Auth/API settings (see [.github/instructions/backend.instructions.md](.github/instructions/backend.instructions.md)).

## Environment

Only two public variables, validated in [src/shared/config/env.ts](src/shared/config/env.ts), with no fallbacks or extra flags:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Never expose service-role or other secrets through `VITE_*`.

## Architecture Boundaries

- `src/entities/*`: domain types, query keys, and Supabase API functions (`course`, `auth`, `facodi` access rules)
- `src/features/*`: TanStack Query hooks and orchestration (`auth`, `courses`)
- `src/components/*`: UI by domain (`ui`, `layout`, `auth`, `course`, `editorial`)
- `src/shared/*`: config, validation, navigation helpers, shared Supabase client, test utilities
- `src/pages/*`: route-level pages, lazy-loaded in [src/App.tsx](src/App.tsx)
- `src/i18n/*`: localization (pt, en, es, fr kept aligned)

## Auth & Permissions

- Supabase Auth (email/password, PKCE). Session state lives in [src/features/auth/useAuth.tsx](src/features/auth/useAuth.tsx); it waits for `INITIAL_SESSION` before rendering private routes and clears the query cache when the identity or role changes.
- Roles come only from `app_metadata.role` ([src/entities/facodi/access.ts](src/entities/facodi/access.ts)): `editor`/`admin`; anything else is a regular user. Never promote accounts.
- Route guards in [src/components/auth/ProtectedRoute.tsx](src/components/auth/ProtectedRoute.tsx) control navigation only; RLS in `facodi` is the real authorization.
- Post-login redirects must go through `safeReturnPath()` in [src/shared/lib/navigation.ts](src/shared/lib/navigation.ts).

## Catalog Rules

- Public courses: `published = true AND status = 'active'`.
- Public units: `status = 'active'` in a published, active course (unit `published` is not a privacy guarantee).
- Public learning objects: `published = true` with status `active` or `published`. Do not use `learning_object_relations` publicly (editor-only).
- New editorial content starts as draft with manual origin; no hard deletes. Sanitize HTML via [src/components/course/SafeHtml.tsx](src/components/course/SafeHtml.tsx).
- Use real empty states; no mock catalogs.

## Conventions

- Reuse schemas from [src/shared/lib/validation.ts](src/shared/lib/validation.ts); forms use React Hook Form + Zod.
- Server state via TanStack Query hooks in `src/features/*/queries`, keys from `src/entities/*/*.keys.ts` (covered by [src/entities/queryKeys.test.ts](src/entities/queryKeys.test.ts)).
- Supabase access only in `src/entities/*/*.api.ts`, through [src/shared/api/supabase/supabaseClient.ts](src/shared/api/supabase/supabaseClient.ts); use `getSupabaseErrorMessage()` for errors.
- Prefer shadcn/ui primitives and Tailwind; compose classes with `cn()` from [src/lib/utils.ts](src/lib/utils.ts). `src/lib/` holds only `cn()`.
- No hard-coded user-facing strings; update all four locale files together.
- Use `@/` alias imports.
- Global providers live in [src/app/providers/AppProviders.tsx](src/app/providers/AppProviders.tsx).

## Adding Pages

1. Add the component in `src/pages/`.
2. Register it with `React.lazy()` in [src/App.tsx](src/App.tsx) and add the `<Route>` (wrap with `ProtectedRoute` when private).
3. Add i18n keys in all locales.

## Deployment

Static SPA: `bun run build` → `dist/` with SPA fallback. Cloudflare uses [wrangler.jsonc](wrangler.jsonc); Docker serves `dist/` via nginx ([Dockerfile](Dockerfile)). There is no runtime metadata server. The canonical origin is `https://facodi.com` (`SITE_ORIGIN` in [src/shared/seo/seo.ts](src/shared/seo/seo.ts)); Auth callbacks use the app origin.

## Generated Artifacts

- Do not edit `dist/` by hand.
- [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts) is generated from the remote `facodi` schema.
