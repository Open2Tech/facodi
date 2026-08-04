# Open2 Technology Theme

![Odoo 19](https://img.shields.io/badge/Odoo-19.0-714B67?logo=odoo&logoColor=white)
![License](https://img.shields.io/badge/license-LGPL--3-blue)
![Status](https://img.shields.io/badge/status-Beta-yellow)

A reusable Odoo 19 Website theme for Open2 Technology's people-first technology presence.

## Objective

`theme_open2` provides a composable corporate website foundation with native Website Builder snippets, multi-website support, accessible interaction states, and a documented visual system.

## Problem solved

A standard Odoo website needs a coherent identity across navigation, pages, helpdesk contact flows, mailing forms, snippets, and responsive layouts. This theme centralizes those decisions while keeping the Website Builder and per-website lifecycle native.

## Features

- Open2 palette and typography tokens in the SCSS foundation.
- Responsive header, footer, layout, and native content pages.
- Website Builder snippets for hero, services, AI, team, and CTA sections.
- Snippet options for density, contrast, and alignment.
- Helpdesk and mass-mailing integration through standard Odoo routes and forms.
- Multi-website utilities and post-install theme setup.
- Editor tour coverage for the theme builder experience.

## Screenshots and evidence

Visual evidence captured during previous staging audits is available under [`docs/evidence/`](docs/evidence/). The source files are intentionally kept outside `static/description` so the Apps listing remains lightweight.

## Architecture

- `static/src/scss/`: palette, typography, layout, components, and snippet styles.
- `static/src/website_builder/`: editor options and their XML templates.
- `views/layout.xml`: base website layout inheritance.
- `views/header.xml`, `views/footer.xml`: site chrome.
- `views/snippet_templates.xml`, `views/snippets.xml`: reusable builder components.
- `data/website_pages.xml`, `data/website_menu.xml`: native website content.
- `models/`: theme utilities and module lifecycle helpers.
- `tests/`, `static/tests/tours/`: Python and browser-level regression coverage.

## Dependencies

- Odoo 19 Community: `website`, `website_helpdesk`, `website_mass_mailing`.
- No external Python dependencies are declared by the addon.

## Installation

```bash
python3 odoo-bin -d <database> \
  --addons-path=<odoo-core>/addons,odoo/facodi/addons \
  -i theme_open2 --stop-after-init
```

Update the Apps list, install **Open2 Technology Theme**, then select it under Website configuration. For an existing installation, use `-u theme_open2` after deploying the updated addon.

## Configuration

1. Configure the target website under Website settings.
2. Select the theme from the Website configurator.
3. Review the generated homepage snippets and navigation menu.
4. Configure Helpdesk and Mass Mailing if those integrations are enabled.
5. Verify desktop and mobile layouts using the evidence checklist in [`docs/validation.md`](docs/validation.md).

## Usage

Use the Website Builder to compose the homepage from the registered Open2 snippets. Keep content and claims in website data files or the Website Builder, while keeping reusable visual behavior in the addon assets.

## Integrations

- `website_helpdesk`: contact and support flows.
- `website_mass_mailing`: mailing form integration.
- Odoo Website Builder: snippets, options, and configurator.
- Multi-website: per-website configuration and native menu/page lifecycle.

## Roadmap

- Add a public visual regression workflow for desktop and mobile routes.
- Add rasterized App Store previews generated from approved staging captures.
- Expand accessibility tests to keyboard navigation and reduced-motion behavior.

## Known limitations

- Content claims and screenshots depend on the configured website instance.
- The addon does not include production credentials or external service configuration.
- Browser tours require a running Odoo instance with Website Builder assets enabled.

## Contribution

Preserve native Odoo inheritance, keep public claims verifiable, add tests for new builder behavior, and update the relevant docs/evidence in the same change. Open issues and pull requests at [github.com/Open2Tech/facodi](https://github.com/Open2Tech/facodi).

## License and authors

Copyright Open2 Technology. Licensed under [LGPL-3](https://www.gnu.org/licenses/lgpl-3.0.html).

Maintained by Open2 Technology: [open2.tech](https://open2.tech).
