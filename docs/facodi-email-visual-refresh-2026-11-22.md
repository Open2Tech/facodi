# FACODI emails — 22 November 2026

The previous rounded, grey email cards diverged from the current campus design. All 15 versioned FACODI templates now use the site's warm paper, ink borders, F. signature, marker colours and strong yellow actions. Access messages use cyan, study messages use mint/pink, and security changes use orange/coral. Colour conveys category alongside a visible text label.

`supabase/functions/_shared/email-layout.ts` is shared by the two transactional senders and the static-template generator. Its HEX colours are the sRGB equivalents of the existing HSL values in `src/index.css`; website tokens were not changed. Templates use tables, inline styles, system font fallbacks and an Outlook width wrapper, without remote assets. Auth tokens, study placeholders, opt-out links, recipients and dispatch rules are preserved.

Edit `supabase/email-templates/content.json` for static copy and run `bun run email:generate`. Commit the generated HTML because Supabase Auth reads these files directly. Run `bun run test:email` to check generation drift, branding, required placeholders and catalog limits.

## Applied remotely

- All 15 `facodi.email_template_catalog` rows updated in place; delivery flags remain disabled, as before. This table is an editor preview catalog, not the Auth delivery configuration.
- `facodi-email-notifications` deployed as version 21, preserving the latest v20 handler from PR #159, its internal session/worker authentication and all four contributor locales. Only mail presentation changed.
- `facodi-suggestion-analysis` deployed as version 29, preserving its existing worker-secret authentication and delivery settings. Non-presentation source matched the deployed baseline before release.
- No real emails were sent. Existing queues and delivery settings were not changed.

## Auth publication

The six configured Auth templates still require applying to the hosted Auth configuration. The Supabase connector has no Auth configuration action, the CLI has no management credential, and the dashboard sign-in reached an hCaptcha challenge that requires user intervention. Versioned templates and previews are ready. After authentication, update only the six template bodies from `supabase/config.toml`; preserve all other hosted settings. Shared Auth branding was already FACODI before this refresh.

## Validation

- Static checks cover all 15 templates, including study reminders and preferences URLs.
- 51 focused tests passed: 26 existing suggestion analysis/notification tests and 25 contributor presentation checks across all six outcomes in PT/EN/ES/FR, including HTML escaping and locale fallback.
- Lint and TypeScript checks passed.
- Vite/PWA compilation passed with placeholder public variables. The full build could not finish its SEO snapshot step because it requires a reachable catalog; this step was not claimed as passing.
- Email-client inbox rendering and real delivery were not tested. Local browser rendering was blocked by the execution environment, so no Gmail/Outlook/mobile compatibility claim is made.
