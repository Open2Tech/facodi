# AI Rules for This Project

## Tech Stack (Bullet Points)
- **React 19** with **TypeScript** as the primary frontend framework
- **React Router** for client-side routing (routes defined in `src/App.tsx`)
- **Tailwind CSS** for utility‑first styling and responsive design
- **shadcn/ui** component library (built on Radix UI) for accessible, pre‑styled UI components
- **lucide-react** for consistent, lightweight icon set
- **React Query (tanstack/react-query)** for data fetching, caching, and background updates
- **React Hook Form** with **Zod** for form state management and validation
- **ESLint** + TypeScript for code quality and static checks
- **Vite 8** as the build tool and dev server (already configured)
- **Bun** as the only package manager and script runner
- **Vitest** + React Testing Library for unit and component tests

## Current Compatibility Notes (July 2026)
- `tailwindcss` remains pinned to `3.4.19` until a dedicated Tailwind 4 migration is completed.
- `lucide-react` remains pinned to `0.462.0` because current icon imports rely on that export set.
- TypeScript 6 is enabled; `tsconfig.json` currently uses `"ignoreDeprecations": "6.0"` while `baseUrl` alias migration is pending.

## Library Usage Rules
| Concern / Feature | Allowed Library / Approach | Reason / Note |
|-------------------|----------------------------|---------------|
| **Routing** | React Router routing declared in `src/App.tsx` | Centralized routing; do not create custom history solutions |
| **Styling** | Tailwind CSS utility classes; optionally extend via `tailwind.config.ts` | Avoid writing custom CSS or CSS-in-JS unless absolutely necessary; keep styling in JSX via className |
| **UI Components** | shadcn/ui primitives (buttons, inputs, dialogs, etc.) | Use these as the base; if a component needs modification, create a wrapper component in `src/components/` rather than editing the shadcn files directly |
| **Icons** | lucide-react only | Import icons as named exports; do not use other icon libraries |
| **State Management** | React built‑in (`useState`, `useReducer`, `useContext`) for local/UI state; React Query for server state | Avoid external state libraries (Redux, MobX, etc.) unless explicitly approved |
| **Data Fetching** | TanStack Query (`useQuery`, `useMutation`) plus entity API modules | Handles caching, deduplication, background updates; do not fetch server data directly in components |
| **Forms** | React Hook Form + Zod schema validation | Centralizes validation logic; avoid uncontrolled form inputs or manual state for form fields |
| **Icons & Images** | lucide-react for icons; public static assets in `public/`; imported code assets may live under `src/assets/` if introduced | Keep the generic social preview at `public/placeholder.png` |
| **Utilities / Helpers** | Keep `src/lib/utils.ts` for `cn()` only; place business/shared utilities in `src/shared/lib/` | Matches project architecture conventions |
| **Testing** | Vitest + React Testing Library + user-event | Follow React Testing Library guidelines; avoid testing implementation details |
| **Package Manager** | Bun only (`bun install`, `bun run`, `bunx`) | Keep `bun.lock` as the only lockfile; do not add pnpm, npm, or Yarn lockfiles |
| **Code Quality** | ESLint plus `bun run typecheck` | Run `bun run lint` and `bun run typecheck` when relevant; do not disable rules without justification |
| **Absolute Imports** | Configured via `tsconfig.json` (`@/*`) | Use `@/` alias for imports from `src/`; avoid relative paths like `../../../components` |
| **File Organization** | - Entities: `src/entities/` (types/api/query keys) <br> - Features: `src/features/` (query/mutation orchestration) <br> - Components: `src/components/` (UI by domain) <br> - Pages: `src/pages/` (routes) <br> - Shared: `src/shared/` (cross-domain code, validation, API clients) <br> - `src/lib/utils.ts`: shadcn `cn()` utility only | Follow Feature-Sliced conventions used by the current codebase |

## General Principles
- **Prefer composition over configuration**: Build UI by composing shadcn/ui primitives and Tailwind classes.
- **Keep components small and focused**: A component should have a single responsibility.
- **Avoid magic strings/numbers**: Extract to constants or config files.
- **No direct DOM manipulation**: Use React refs only when absolutely necessary (e.g., focus management) and wrap in a custom hook.
- **Environment variables**: Prefix client-exposed values with `VITE_`; keep Supabase service-role, OpenAI, Gemini, and Resend values server-side in Supabase secrets or runtime env.
- **Edge Functions**: The frontend invokes only the FACODI functions `facodi-submit-playlist` and `facodi-email-notifications`, from `src/entities/contribution`; `facodi-suggestion-analysis` runs only from pg_cron. Never call legacy Edge Functions, `public` RPCs, or Odoo; data access uses only the `facodi` schema.
- **Generated output**: Do not edit `dist/` by hand.
- **Commit messages**: Follow conventional style (`feat:`, `fix:`, `docs:`, etc.).
- **Branch naming**: `feature/...`, `bugfix/...`, `chore/...`.

## Source of Truth for Agent Instructions

- Always consult [`AGENTS.md`](AGENTS.md) first for repository-wide constraints.
- Follow scoped instruction files in [`.github/instructions/`](.github/instructions/) for frontend, Supabase/backend, i18n, and testing behavior.
- Treat historical sections in long-form docs as contextual background when they diverge from current architecture.

These rules ensure a maintainable, consistent codebase that leverages the chosen libraries effectively.
