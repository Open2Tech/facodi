# Open2 visual identity refresh

Date: 2026-08-01

The attached branding proposal in `docs/open2-design.png` is treated as the current visual source of truth for `theme_open2`.

## Extracted identity

The proposal defines a dark premium technology system built around:

- a standalone `2` symbol with an upper arc;
- a violet to blue to cyan gradient: `#6d3df6`, `#3b82f6`, `#00c2ff`;
- a primary dark surface: `#0d1117`;
- cool neutral support: `#64748b`, `#e5e7eb`, `#ffffff`;
- horizontal, vertical, monochrome, negative, app, favicon, social, and splash applications;
- the brand line `Open minds. Open source. Open future.`;
- a cleaner website language with an opaque dark menu, subtle borders, gradient CTAs, and fewer hard white dividers.

## Implemented assets

Canonical SVG assets live under `static/src/img/branding/`:

- `logos/open2-logo-horizontal.svg`
- `logos/open2-logo-vertical.svg`
- `logos/open2-symbol.svg`
- `logos/open2-logo-monochrome.svg`
- `logos/open2-logo-negative.svg`
- `logos/open2-logo-reduced.svg`
- `logos/open2-watermark.svg`
- `splash/open2-splash-logo.svg`
- `splash/open2-loading-logo.svg`
- `icons/open2-app-icon.svg`
- `icons/open2-odoo-app-icon.svg`
- `favicons/favicon.svg`

Raster production assets were generated from the same geometry:

- `favicons/favicon.ico`
- `favicons/favicon-16x16.png`
- `favicons/favicon-32x32.png`
- `favicons/favicon-48x48.png`
- `favicons/favicon-96x96.png`
- `favicons/apple-touch-icon.png`
- `favicons/android-chrome-192x192.png`
- `favicons/android-chrome-512x512.png`
- `icons/open2-app-icon.png`
- `icons/open2-odoo-app-icon.png`
- `social/open2-og.png`
- `social/open2-twitter-card.png`
- `social/open2-github-avatar.png`
- `social/open2-linkedin-avatar.png`

The legacy paths `static/src/icons/open2-logo.svg`, `static/src/icons/favicon.ico`, and `static/src/img/open2-social.png` remain as compatibility aliases for already materialized pages or external cache.

## Website adaptation

The homepage hero now uses the brand proposition from the mockup: `Building open solutions for a better tomorrow`. The header stays opaque for readability and editor stability, with the new horizontal logo and a restrained gradient top rule. The footer uses the vertical lockup and a low-opacity watermark. Buttons, cards, forms, and portal surfaces use the new color tokens and subtler borders.

All changes are scoped by `.open2-site` and by theme assets, so FACODI and other websites do not receive the Open2 visual system unless the Open2 theme is selected for that website.
