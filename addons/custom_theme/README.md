# FACODI Theme

`custom_theme` is the Odoo 19 Website and eLearning theme for FACODI - Faculdade Comunitaria Digital.

It provides the initial public experience: a learning-oriented hero, learner dashboard, responsive navigation, learning-resource snippet, course progress cards, roadmap, AI study prompt, and community activity surface. The content is intentionally representative; production course, program, community, and profile data should come from the Odoo Website, eLearning, Portal, Knowledge, Documents, Discuss, and Survey applications.

## Design system

The theme uses a soft neo-brutalist system:

- `Space Grotesk` for hierarchy, `Inter` for interface text, and `JetBrains Mono` for labels and learning metadata.
- Open2Tech-inspired cyan and blue accents, mint progress, and a deep ink foundation.
- An 8px rhythm, 2px ink borders, compact rounded corners, and defined solid shadows.
- Automatic dark-mode treatment via `prefers-color-scheme` and reduced-motion support.

Theme values and reusable primitives are defined in `static/src/scss/primary_variables.scss` and `static/src/scss/facodi_frontend.scss`.

## Install or upgrade

1. Add `odoo/facodi/addons` to the target Odoo addons path.
2. Update the Apps list, then install or upgrade **FACODI Theme**.
3. Select the `facodi` palette in Website configuration if it was not selected during theme installation.
4. Verify the homepage, responsive header and footer, `/slides`, and the Website Builder snippet **Learning Hub**.

For a local update:

```bash
python3 odoo-bin -d <database> \
  --addons-path=<odoo-addons>,odoo/facodi/addons \
  -u custom_theme --stop-after-init
```

## Delivery notes

- Keep the module name `custom_theme` because this is the requested FACODI deployment module. All asset keys, CSS variables, tours, palette identifiers, and view IDs use a `facodi` prefix.
- Store approved FACODI source imagery, logo files, and typography licenses in `data/facodi/` before adding optimized files to `static/src/`.
- Do not publish placeholder identity data or unverified academic claims. Configure company details and public contact data in Odoo before release.