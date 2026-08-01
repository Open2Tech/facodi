# Validation record

Validation date: 2026-08-01. Local installation tests used disposable
PostgreSQL databases. The explicitly identified staging and production E2E
checks used reserved `example.com` identities; the production QA ticket was
archived after verification. No FACODI page, menu, theme or asset was changed.

## Native pages and Helpdesk follow-up

- Clean install with `website_helpdesk`: passed.
- Upgrade on the same disposable Odoo 19 Enterprise database: passed.
- Current addon suite: 13 assertions across 9 test methods, zero failures or
  errors.
- Native page materialization: Home, About, Solutions, Services, Open Source,
  Partnerships, Contact, confirmation, Privacy and Terms verified.
- Website Builder: production `/contact` opened in edit mode and exposed the
  block/style/theme panels; the audit exited without saving.
- Contact E2E: one `helpdesk.ticket`, one partner and one attachment created;
  team, website, New stage, assignee and confirmation reference verified.
- Responsive checks: 1440 × 1000 and 390 × 844; one H1 per new page and no
  horizontal overflow.
- Browser console: no relevant frontend error during the local E2E.
- Retired-brand regression scan remains covered by the addon test.
- A second clean-install fixture verified that the dependency-generated
  `/helpdesk` menu is removed before tests while a used Helpdesk team is kept.
- Staging Website Builder initially raised `KeyError: website`, then confirmed
  that its backend RPC has no `request.website`. The lookup now uses Odoo's
  `website.get_current_website()`, which supports both frontend and backend
  rendering while honoring the forced multiwebsite session.

## Final staging and production validation

- Staging build: `theme_open2` `19.0.1.1.3`, following PRs #128–#131.
- Production release: PR #132, merge commit `2bca7711`, module
  `19.0.1.1.3` installed and current.
- All eight public routes (`/`, `/about`, `/solutions`, `/services`,
  `/open-source`, `/partnerships`, `/contact`, `/contact/thank-you`) returned
  HTTP 200 in the Open2 website context.
- Staging and production Website Builder entered Edit mode, exposed Blocks,
  Style and Theme, and exited through Discard without saving.
- Staging and production Contact E2E each created exactly one ticket in
  `Open2 Website`, New stage, with the submitted partner, assigned user,
  description and one SVG attachment. The confirmation page displayed ticket
  reference `00001`.
- Chatter creation and both internal/customer notifications were present. The
  staging database was mail-neutralized; production used a reserved
  `example.com` QA address.
- Desktop 1440 × 1000, tablet 768 × 1024 and mobile 390 × 844 had one H1 and
  no horizontal overflow. Mobile navigation exposed all six page-backed menu
  entries. Keyboard focus used a visible browser outline.
- FACODI before/after comparison: website 1 kept `theme_facodi`, its Home page,
  seven navigation children, languages and unpublished default Helpdesk team.
  The dependency-generated `/helpdesk` menu observed during the first staging
  build was removed by the guarded `19.0.1.1.1` migration.

Final evidence:

- `docs/evidence/contact-staging-final-desktop.png`
- `docs/evidence/contact-staging-final-mobile.png`
- `docs/evidence/contact-before-mail-form-mobile.png`
- `docs/evidence/contact-confirmation-mobile.png`

See [native-pages-helpdesk.md](native-pages-helpdesk.md) for the diagnosis and
multiwebsite decision record.

## Automated validation completed

- Clean module install on `codoo_theme_open2_final_20260801` and, after this
  correction, `codoo_theme_open2_fix_20260801`: passed.
- Module upgrade on `codoo_theme_open2_test_20260801` and
  `codoo_theme_open2_fix_20260801`: passed.
- Odoo test suite: 5 test methods, 9 assertions, 0 failures, 0 errors.
- Theme overlap regression: after installing the module on a website with no selected theme, zero `ir.ui.view`/`website.page` copies are created; all templates remain in `theme.*` records until the administrator selects the theme.
- Two-website isolation: theme records copied only to the selected website; the control website was unchanged.
- Theme unload: the website and a non-theme editorial page survived unload.
- Navigation isolation: selecting Open2 removes only default-menu clones from the target website; Open2 theme menus and later editorial menus remain. The FACODI root menu is unchanged.
- XML/QWeb loading and SCSS/JS asset compilation: passed during install, upgrade, and HTTP rendering.
- Gettext catalogs (`pt_PT`, `fr_FR`, `es_ES`): loaded without errors and contain no empty translations.
- Retired-brand scan: passed case-insensitively; the regression test constructs the retired phrase without storing it literally in the repository.
- Public routes `/`, `/solutions`, `/partnerships`, `/open-source`, and `/contact`: HTTP 200, exactly one H1, non-empty meta description, and route-specific title.
- `/privacy` and `/terms`: HTTP 404 to public visitors while unpublished; their records are also marked not indexed.
- Structured data: `Organization` only on the homepage and `ItemList` only on partnerships.
- Contact form: required-field browser validation passed; a valid local submission created the success state. The resulting test mail was inspected and deleted immediately without external delivery.

## Browser and visual validation completed

- Chromium at 1440 × 1000 and 390 × 844.
- No horizontal overflow at either viewport.
- Desktop and mobile navigation, headings, CTA links, footer, focus styling, and responsive card stacking inspected.
- Loader visible above the sticky header on the first visit, hidden after about 1.45 seconds, and absent on subsequent navigation in the same session.
- `prefers-reduced-motion: reduce`: loader remained inactive and did not write the session flag.
- Browser error log: empty on homepage, mobile homepage, and reduced-motion run.
- Homepage SEO title after the brand refresh: `Open2 Technology — Building open solutions for a better tomorrow`.

Evidence:

- `docs/evidence/home-desktop.png`
- `docs/evidence/home-mobile.png`
- `docs/evidence/loader-desktop.png`

## Odoo.sh staging validation

Validated on the Odoo.sh staging database after build commit `2132d12`, with
module version `19.0.1.0.2` installed and current.

- The native theme refresh was run in the Open2 website context. Its direct
  root navigation now contains only `Solutions`, `Partnerships`, `Open Source`,
  and `Contact`; each has an Open2 `theme_template_id`.
- The FACODI snapshot is unchanged: website ID 1 still uses `theme_facodi`,
  retains its root menu and seven child menus, and retains the same language
  assignments.
- Open2 page records are website ID 2 only. `/solutions`, `/partnerships`,
  `/open-source`, and `/contact` are published; `/privacy` and `/terms` remain
  unpublished and non-indexed.
- Authenticated browser checks at 1440 × 1000 and 390 × 844 found one H1 per
  public route, zero horizontal overflow, Open2 layout classes, working mobile
  collapse navigation, and no browser console errors.
- Desktop and mobile evidence: `docs/evidence/staging-open2-desktop.png` and
  `docs/evidence/staging-open2-mobile.png`.
- The splash element and its assets load on staging without console errors. A
  public, first-session activation cannot be exercised against the branch URL
  while Open2 has no dedicated staging domain: the Odoo force-website endpoint
  requires authentication, and the loader intentionally disables itself for
  authenticated editor/backend sessions. Its first-session, reduced-motion,
  and JavaScript-fallback behaviours remain covered by the local browser run.

Remaining editorial or extended audit checks:

- [x] Open Website Builder and verify native snippet rendering without saving.
- [x] Submit Contact to a staging-safe reserved identity and inspect the native Helpdesk records.
- [ ] Validate all four languages using the staging website language selector.
- [ ] Add 1920, 1280, 768, and 360 pixel evidence runs.
- [ ] Complete keyboard, 200% zoom, contrast, and screen-reader checks on staging.
- [ ] Review final Privacy and Terms copy before publishing either page.

## Production portal panel refinement

The native `/my/home` portal was audited on the Open2 website after the
production release. The root cause of the unreadable cards was the theme's
global `a { color: inherit; }` rule: Odoo's portal cards inherit the Open2
white foreground while their native `bg-100` surfaces remain light.

The fix is scoped to `.open2-site` and keeps the standard portal templates,
links, counters, account sidebar, and Website Builder untouched. Portal cards
now use an accessible dark foreground, a muted secondary color, visible focus
states, consistent Open2 spacing, and a restrained hover elevation. The
account sidebar remains dark-canvas content with readable actions. FACODI is
not affected because it does not render the `.open2-site` theme root.

The browser preview was captured at `docs/evidence/portal-before.png` and
`docs/evidence/portal-preview.png`; the latter uses the exact scoped rules
before the Odoo.sh build and is retained as a visual comparison artifact.

Production verification after merge `270b0f2`:

- desktop and mobile cards render with dark readable titles and descriptions;
- 14 native portal cards remain available to the authenticated account;
- mobile viewport 390px has no horizontal overflow (`scrollWidth == 390`);
- the Open2 mobile menu remains available;
- no browser console errors were emitted during reload.

Production captures: `docs/evidence/portal-after-desktop.png` and
`docs/evidence/portal-after-mobile.png`.
