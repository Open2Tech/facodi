---
description: "Use when editing Supabase config, Auth email templates, or the shared Supabase client helpers."
name: "Supabase Backend Rules"
applyTo: "{supabase/**/*,src/shared/api/supabase/**/*.ts,src/integrations/supabase/**/*.ts}"
---
# Supabase Backend Rules

- FACODI uses only the `facodi` schema through the single client in [src/integrations/supabase/client.ts](../../src/integrations/supabase/client.ts) (`db.schema = 'facodi'`). Do not query `public`, call legacy Edge Functions, or integrate Odoo from the frontend.
- The frontend requires only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (validated in [src/shared/config/env.ts](../../src/shared/config/env.ts)). No fallbacks, alternate keys, or feature flags.
- Regenerate types read-only with `bun run db:types > src/integrations/supabase/types.ts`.
- Authorization is enforced by existing RLS in `facodi`; roles come only from `app_metadata.role` (`editor`, `admin`). React route guards control navigation only. Never promote accounts or alter shared `auth` triggers.
- Do not run destructive migrations or alter remote tables, policies, or functions without an explicit task.
- Treat [supabase/config.toml](../../supabase/config.toml) as deployment-as-code for hosted settings, including Auth email templates in [supabase/email-templates](../../supabase/email-templates).
- Do not run `supabase config push --yes`. Push with `bunx supabase config push --project-ref wvkjainfwsyiyfcmbtid`, inspect every CLI prompt, and accept only the intended diff. Preserve the `facodi` API schema/search path, `site_url`, redirect URLs, manual linking, MFA TOTP, email confirmations, and OTP length.
- Keep service-role access out of the frontend. Never expose secrets through `VITE_*` variables.
