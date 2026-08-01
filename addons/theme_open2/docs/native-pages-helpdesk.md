# Native pages and Helpdesk audit

Date: 2026-08-01

## Initial production state

The read-only production audit found two websites:

- website 1: FACODI, using `theme_facodi`;
- website 2: Open2 Technology, using `theme_open2` and the instance default domain.

The Open2 Home and the six declared institutional records were native Odoo
pages. `/solutions`, `/partnerships`, `/open-source`, `/contact`, `/privacy`,
and `/terms` were materialized as website-specific `website.page` and
`ir.ui.view` records from `theme.website.page` and `theme.ir.ui.view`.
There were no Open2 HTTP controllers or custom routes.

`/privacy` and `/terms` were intentionally unpublished and excluded from
indexing because approved legal copy does not yet exist. `/about` and
`/services` did not exist.

The Website Builder successfully opened `/contact`, exposed its
`#wrap.oe_structure` editing zone and listed the Open2 snippets. The editor
was therefore not the cause of the reported architecture gap.

The first staging E2E exposed a narrower editor-only context error: the
Contact snippet used the page variable `website`, while
`ir.ui.view.render_public_asset()` renders snippet previews with
`request.website`. Version `19.0.1.1.2` uses the latter in the team lookup, so
the same template now renders both as page content and in the snippet gallery.

## Root cause

The contact form already used the standard `/website/form/` endpoint, but its
target model was `mail.mail`. A successful submission could only create and
send an email; it could never create a Helpdesk ticket.

Production already had `helpdesk` and `website_helpdesk`, but its Helpdesk
teams belonged either to FACODI or to another company. Reusing either team
would mix websites and companies. Staging did not yet have Helpdesk installed.

## Correction

- Added `website_helpdesk` as an explicit dependency.
- Added native, published `/about` and `/services` theme pages.
- Added the native, published but non-indexed `/contact/thank-you` page.
- Kept Privacy and Terms native, editable, unpublished and non-indexed pending
  legal approval.
- Added About and Services through `theme.website.menu`; header and footer now
  consume the current website's dynamic menu.
- Changed the Contact form to the standard `helpdesk.ticket` Website Form.
- Added the standard Helpdesk fields for customer, email, phone, company,
  subject, description and attachment.
- Added a website-scoped, idempotent Helpdesk team configuration during the
  standard theme-load lifecycle. No controller, endpoint, ticket model or
  anti-spam mechanism was customized.
- Kept ticket priority, New stage, partner creation, assignment, chatter,
  attachment linking, CAPTCHA and authenticated CSRF handling under Odoo's
  native implementations.
- Refused submission when no website-specific team exists, displaying a clear
  email fallback instead of silently routing to another website's team.

## Multiwebsite contract

The team lookup and hidden `team_id` are bound to `website.id`. Theme
reconciliation creates or reuses a team only when the selected website uses
`theme_open2`. Any generated `/helpdesk` menu removed by the reconciliation is
limited to the Open2 website; FACODI pages, menus, teams and views are never
selected by that cleanup.

The team is retained if the theme is later unloaded. This is intentionally
non-destructive because it may contain business records and tickets.

## Local E2E evidence

A clean Odoo 19 Enterprise database was used to install and upgrade the addon.
The browser flow submitted the native form with an attachment and produced one
ticket with:

- team: `Open2 Website`;
- website origin: the Open2 test website;
- stage: `New`;
- assignee: `Administrator` through native automatic assignment;
- a newly associated customer with the submitted name and email;
- submitted phone, subject and description;
- one attachment linked through the ticket chatter;
- a website-specific confirmation page showing the ticket reference.

The audit fixture uses `example.com` and never contacts a real recipient.

Visual evidence:

- [Contact before: mail form on production](evidence/contact-before-mail-form-mobile.png)
- [Contact after: Helpdesk form on mobile](evidence/contact-after-helpdesk-mobile.png)
- [Ticket confirmation on mobile](evidence/contact-confirmation-mobile.png)
- [Native About page on desktop](evidence/about-native-desktop.png)

## Known limitation

Installing Odoo's official `website_helpdesk` for the first time may enable
its own default Customer Care web form and `/helpdesk` menu on the company's
default website. This is standard Odoo module behavior, not theme behavior.
The theme post-install hook and the `19.0.1.1.1` migration reverse only that
exact generated menu when the official default team has no tickets. A used,
renamed or differently routed Helpdesk intake is retained. Existing
production already has `website_helpdesk`, so its post-install bootstrap is not
repeated there.
