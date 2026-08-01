# Open2 Theme v0.10.0

Release date: 2026-08-01

## Scope

`v0.10.0` promotes the Open2 Technology theme updates completed after
`v0.9.0` for Odoo 19:

- native, Website Builder-editable About, Services, Contact and contact
  confirmation pages;
- a website-scoped native Helpdesk intake for Contact submissions;
- multiwebsite-safe theme, menu and Helpdesk reconciliation;
- resilient Website Builder rendering when no frontend `request.website`
  context exists;
- restored opaque header and footer contrast, including responsive CSS
  compatibility;
- translated page content for Portuguese, English, French and Spanish.

The FACODI website and `theme_facodi` remain independent. The Open2 theme
does not alter FACODI menus, pages, languages or Helpdesk configuration.

## Validation

- Clean installation and upgrade completed on Odoo 19.
- Automated test suite completed without failures or errors.
- Public Open2 routes returned HTTP 200 and rendered one H1 without horizontal
  overflow at desktop, tablet and mobile sizes.
- Website Builder was checked in staging and production, then exited with
  Discard.
- Contact end-to-end verification created one scoped Helpdesk ticket with its
  submitted partner, attachment, New stage, assignee and confirmation page.

Evidence and detailed checks are maintained in [validation.md](validation.md)
and [native-pages-helpdesk.md](native-pages-helpdesk.md).

## Deployment

1. Deploy this branch to the Odoo 19 environment.
2. Upgrade `theme_open2` from Apps or with `-u theme_open2`.
3. Confirm the Open2 website remains selected for `theme_open2`.
4. Verify `/about`, `/services`, `/contact` and `/contact/thank-you` in the
   Open2 website context.

Privacy and Terms remain unpublished and non-indexed until approved legal copy
is available.