# FACODI Theme

`theme_facodi` is the Odoo 19 Website and eLearning theme for FACODI — Faculdade Comunitaria Digital.

Created by [Open2 Technology](https://open2.tech).

It delivers the public learning experience: a hero, learner dashboard, responsive navigation, Learning Hub snippet, course progress cards, roadmap, and community activity surface. Dashboard content is dynamically populated from published `slide.channel` records managed in the Odoo eLearning backend.

## Design system

- **Fonts**: `Space Grotesk` for headings, `Inter` for body text, `JetBrains Mono` for code labels and metadata.
- **Palette**: FACODI cyan `#37BED2`, blue `#3979C8`, mint `#A7E8BE`, sun `#FFD45F`, ink `#142846`.
- **Style**: neo-brutalist — 8 px rhythm, 2 px solid borders, defined box shadows, minimal border radius.
- **Dark mode**: automatic via `prefers-color-scheme: dark`; motion reduced via `prefers-reduced-motion`.

SCSS tokens in `static/src/scss/primary_variables.scss`; layout and components in `static/src/scss/facodi_frontend.scss`.

## Module structure

```
theme_facodi/
├── __manifest__.py                     # depends: website, website_slides, website_forum, website_helpdesk, website_mass_mailing
├── data/
│   ├── generate_primary_template.xml   # generates configurator snippet templates
│   ├── ir_asset.xml                    # registers SCSS bundles
│   ├── forum.xml                       # initial FACODI forums
│   ├── helpdesk.xml                    # helpdesk teams and support page
│   └── mass_mailing.xml                # newsletter mailing list
├── models/
│   ├── theme_facodi.py                 # theme.utils post-copy hook and per-website setup
│   └── website_page.py                 # injects facodi_channels into homepage context
├── static/
│   ├── description/
│   │   ├── facodi_theme_preview.svg    # shown in Apps list
│   │   ├── theme_facodi.svg            # used by Website Configurator preview
│   │   └── evidence/                  # local E2E screenshots (not shipped)
│   └── src/
│       ├── js/
│       │   └── facodi_theme_editor.js  # editor tour
│       └── scss/
│           ├── primary_variables.scss  # palette, fonts, tokens
│           ├── bootstrap_overridden.scss
│           └── facodi_frontend.scss    # layout and components
├── views/
│   ├── header.xml                      # inherits website.layout, dynamic menu
│   ├── footer.xml                      # replaces div#footer with FACODI footer
│   ├── homepage.xml                    # extends website.homepage wrap
│   ├── pages.xml                       # institutional pages and menus
│   ├── forum/                          # forum templates overrides
│   ├── helpdesk/                       # helpdesk templates overrides
│   ├── slides/                         # eLearning templates overrides
│   └── snippets/
│       └── facodi_learning_hub.xml     # Website Builder snippet
└── i18n/
    ├── theme_facodi.pot                # translation template
    └── pt_BR.po                        # Brazilian Portuguese translation
```

## Install or upgrade

1. Add `odoo/facodi/addons` to the target Odoo addons path.
2. Update the Apps list, then install or upgrade **FACODI Theme**.
3. Apply the theme via **Website → Configuration → Website → Edit → Theme** or via the Website Configurator.
4. Verify: homepage with course cards, dynamic header menu, `/slides` catalog, Website Builder snippet **Learning Hub**.

```bash
# Local install
python3 odoo-bin -d <database> \
  --addons-path=<odoo-core>/addons,odoo/facodi/addons \
  -i theme_facodi --stop-after-init

# Local upgrade
python3 odoo-bin -d <database> \
  --addons-path=<odoo-core>/addons,odoo/facodi/addons \
  -u theme_facodi --stop-after-init
```

### Transition from the legacy `custom_theme` module

The former `custom_theme` module used a non-standard technical name and could not participate in Odoo's native per-website theme lifecycle. To migrate:

1. Uninstall **FACODI Theme** while the old module is still available.
2. Deploy `theme_facodi` into the addons path.
3. Update the Apps list and install **FACODI Theme**.
4. Reapply the theme from Website configuration.

## Operational notes

- **Multiwebsite isolation**: all theme-specific data (forums, helpdesk teams, mailing lists, menus, pages) is created with `website_id` set to the FACODI website during `_theme_facodi_post_copy`.
- **Helpdesk**: requires Odoo 19 Enterprise (`website_helpdesk`).
- **Staged activation**: do not enable forum/helpdesk features in production before validating them in staging.
- **i18n**: run `python odoo-bin -d <db> --i18n-export=theme_facodi.po -l pt_BR -m theme_facodi` to refresh translations after content changes.

## Course integration (website_slides)

The homepage displays up to 6 published courses from the `slide.channel` model. The `FacodiWebsitePage` mixin in `models/website_page.py` injects them as `facodi_channels` into the QWeb rendering context. No additional configuration is required — courses become visible automatically once they are published in the Odoo eLearning backend.

To link a course card to a specific channel, set its URL under `/slides` in the backend and ensure `is_published = True`.

## Community and support

- **Forum**: the `/comunidade` page lists FACODI forums created during theme application. Forums are scoped to the FACODI website (`website_id`) so they do not leak to other websites.
- **Helpdesk**: the `/suporte` page lists support teams for common requests (access issues, suggestions, content reports, partnerships, technical support, institutional requests). Tickets capture the originating website and are routed to the appropriate team.
- **Newsletter**: a FACODI mailing list is created on theme application and can be subscribed via the Website Builder newsletter snippet.

All community and support flows are built on native Odoo 19 modules (`website_forum`, `website_helpdesk`, `website_mass_mailing`) and styled with FACODI tokens.

## Delivery notes

- Keep `theme_` prefix: Odoo uses it to identify theme modules and create per-website view/asset copies.
- Source brand assets (logos, fonts, photography) belong in `data/facodi/` in the Codoo root repo. Convert approved assets to web-ready SVG/PNG/WebP before referencing from QWeb.
- Do not commit `__pycache__`, generated asset bundles, or Odoo filestore artefacts.
- Do not publish placeholder identity data, unverified credentials, course copy, or Odoo sample-company content.
