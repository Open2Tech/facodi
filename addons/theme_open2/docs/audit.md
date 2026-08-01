# Open2 source and Odoo audit

## Sources

- Editorial and visual source: `data/open2/open2.tech`, branch `fix/open2-technology-references`.
- Odoo implementation target: `Open2Tech/facodi`, branch based on `odoo`.
- Odoo 19 reference code: read-only `odoo/odoo` checkout.

The reference has five routes: `/`, `/solutions`, `/partnerships`, `/open-source`, and `/contact`. It uses React, Tailwind, Framer Motion, i18next, and a custom contact endpoint. The Odoo implementation replaces these with website pages, QWeb, theme assets, Odoo snippets, native translations, and `/website/form/`.

The audited source revision was `2b9b541503bdaaad6d1554ffda741bf105987ebf`. Its working tree already contained the reviewed Open2 naming corrections and replacement PDFs/screenshots. Those uncommitted source changes were treated as editorial input and were not modified, staged, or committed by this theme delivery.

## Multiwebsite baseline

The read-only production audit found one website at `facodi.com`, using `theme_facodi`, with its own homepage, menus, languages, and six website-scoped assets. No Open2 website or installed `theme_open2` module existed at audit time.

The source worktree contained reviewed brand-reference corrections. It was not modified or committed by this delivery.

## Known source adaptations

- Loader reduced from 2.9 seconds on every load to 1.45 seconds once per public browser session.
- Content is visible without JavaScript; motion never gates visibility.
- Low-contrast white alpha text was replaced with accessible solid slate tokens.
- Duplicate project source links were removed.
- Legal links remain absent until reviewed pages are published.
- React, Tailwind, Framer Motion, and the external form API are not bundled.
