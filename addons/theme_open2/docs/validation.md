# Validation record

Validation date: 2026-08-01. All writes described below were made against disposable local PostgreSQL databases. No FACODI or production record was changed.

## Automated validation completed

- Clean module install on `codoo_theme_open2_final_20260801`: passed.
- Module upgrade on `codoo_theme_open2_test_20260801`: passed.
- Odoo test suite: 5 test methods, 9 assertions, 0 failures, 0 errors.
- Two-website isolation: theme records copied only to the selected website; the control website was unchanged.
- Theme unload: the website and a non-theme editorial page survived unload.
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
- Homepage SEO title: `Open2 Technology — Democratizing access to technology`.

Evidence:

- `docs/evidence/home-desktop.png`
- `docs/evidence/home-mobile.png`
- `docs/evidence/loader-desktop.png`

## Odoo.sh staging gate

The following checks require the dedicated Odoo.sh staging branch and remain a deployment gate, not a local implementation gap:

- [ ] Capture a read-only before snapshot of the real FACODI website.
- [ ] Create the Open2 website through the native multiwebsite UI and apply the theme in that website context.
- [ ] Confirm the FACODI before/after snapshot is identical.
- [ ] Exercise Website Builder insertion, editing, duplication, reordering, and saving while authenticated.
- [ ] Route contact mail to a staging-safe sink and verify delivery without contacting the public recipient.
- [ ] Validate all four languages using the staging website language selector.
- [ ] Add 1920, 1280, 768, and 360 pixel evidence runs.
- [ ] Complete keyboard, 200% zoom, contrast, and screen-reader checks on staging.
- [ ] Review final Privacy and Terms copy before publishing either page.

Do not promote the branch until every staging gate is checked and the FACODI comparison is clean.
