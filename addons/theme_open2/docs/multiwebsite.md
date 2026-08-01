# Multiwebsite provisioning runbook

Do not create the Open2 `website` record through XML data owned by this addon. Keeping the website external to the theme prevents an addon uninstall from deleting editorial content.

## Inspect

1. Record every current website ID, domain, theme, language, homepage, menu count, page count, and website asset count.
2. Confirm `facodi.com` still uses `theme_facodi`.
3. Confirm the active website selector before every theme action.

## Dry run

Prepare a new website with these values without writing them yet:

- Name: Open2 Technology
- Production domain: `https://open2.tech` (use the Odoo.sh branch URL in staging)
- Main language: Portuguese (Portugal)
- Additional languages: English, French, Spanish
- Company: Open2 Technology

## Apply

1. Create the website from Website → Configuration → Websites.
2. Switch the website selector to Open2 Technology.
3. Install/select the Open2 Technology Theme from the native theme chooser.
4. Confirm copied records have the new website ID before editing navigation.
5. Remove a generated Home menu only if its `website_id` is the Open2 website and the logo already provides the home route.
6. Keep `/privacy` and `/terms` unpublished and not indexed.

## Verify

Repeat the baseline export and compare FACODI record-for-record. Open2 views, assets, pages, menus, and media must be website-scoped. Do not merge or promote if FACODI counts, theme, languages, or content differ.
