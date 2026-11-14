---
description: "Use when editing frontend TypeScript/React files in src/, including entities/features/components/pages and query or form logic."
name: "Frontend Architecture Rules"
applyTo: "src/**/*.{ts,tsx}"
---
# Frontend Architecture Rules

- Keep Feature-Sliced boundaries used in this repo: entities for domain API/types/keys, features for orchestration hooks, components for UI, pages for routes, shared for cross-domain utilities.
- Keep server data access in feature query/mutation hooks and domain API modules; do not fetch directly inside presentational components.
- Reuse shared validation from [src/shared/lib/validation.ts](../../src/shared/lib/validation.ts); do not duplicate email/password/username schemas.
- Keep Supabase calls in entity API files using the shared `facodi`-schema client. The FACODI frontend does not call Edge Functions, `public` RPCs, or Odoo.
- Use shadcn/ui primitives plus Tailwind utilities; compose class names with [src/lib/utils.ts](../../src/lib/utils.ts).
- Keep business utilities in [src/shared/lib](../../src/shared/lib), not in [src/lib](../../src/lib).
- Use alias imports with @/ and avoid deep relative import chains.
- For route additions, follow lazy-route registration in [src/App.tsx](../../src/App.tsx).
