# Installation diagnosis

Date: 2026-08-01  
Target: Odoo 19, `theme_open2`

## Production Website Builder SCSS regression

On 2026-08-01 the production Website Builder reproduced a deterministic
`web.assets_frontend` compilation failure:

```text
Internal Error: Incompatible units: 'vw' and 'rem'.
```

The branding refresh introduced `width: min(28rem, 36vw)` in the hero visual.
Odoo 19's Python LibSass treats lowercase `min()` as a Sass calculation and
tries to compare the incompatible units during compilation. Using `Min()`
preserves the declaration as the native CSS function; CSS function names are
ASCII case-insensitive in the browser.

The regression is reproducible without Odoo state by compiling
`static/src/scss/snippets.scss` with the same `sass` Python package. The file
fails before the correction and compiles after it. A module test now compiles
all standalone Open2 frontend stylesheets so the same class of failure is
caught before deployment. No Website Builder values, FACODI assets, or database
records are changed by the correction.

## Factual staging audit

The staging database recognised `theme_open2` as version `19.0.1.0.0` and
initially reported it as uninstalled. The required `website` models and theme
template models were available. There were no Open2 theme copies, XML IDs,
assets, pages, menus, or `ir.logging` entries left from a failed attempt.

Consequently, the historical installation error and traceback were not retained
by the accessible Odoo.sh interfaces. No specific XML, asset, or method can be
named as the cause of that prior failure without inventing evidence.

The same published revision was installed and upgraded successfully in a fresh
local Odoo 19 database with the staging-equivalent addon paths. The
`_generate_primary_snippet_templates` call is valid in Odoo 19: the method is
implemented by `website.models.ir_module_module`, accepts the module recordset,
and is loaded after `base.module_theme_open2` is available.

## Root cause found during the staging application

The issue reproducibly observed after selecting Open2 was navigation leakage,
not a module loader exception. Odoo creates every new website by copying
`website.main_menu`. The FACODI installation has additional entries in that
global default hierarchy. Therefore the newly created Open2 website inherited
FACODI navigation before `theme_open2` was selected.

The copied entries have the Open2 website ID but no `theme_template_id`; Open2
theme menus have both the Open2 website ID and a `theme_template_id`. This
explains why the Open2 header rendered FACODI labels despite the theme templates
being correctly website-scoped.

## Correction

`models/ir_module_module.py` uses Odoo 19's standard `_theme_load` lifecycle,
which runs after the theme is materialised for its selected website and also on
Odoo.sh module upgrades. `models/theme_utils.py` contains the idempotent,
website-scoped reconciliation and is also exposed through the native post-copy
hook used by the Website Builder. It removes direct children of that website's
root menu only when they have no `theme_template_id` and their URL belongs to
Odoo's global default menu hierarchy.

This does not query, write, or unlink FACODI records. It retains Open2 theme
menus and subsequent editor-created Open2 menus. A regression test covers both
the removal and preservation cases.

## Local reproduction

Run from `odoo/odoo` with PostgreSQL available:

```bash
./odoo-bin --database codoo_theme_open2_repro --addons-path=addons,../facodi/addons --init theme_open2 --stop-after-init
./odoo-bin --database codoo_theme_open2_repro --addons-path=addons,../facodi/addons --update theme_open2 --stop-after-init
```

Then select Open2 through the native theme chooser with the Open2 website as
the active website. The theme lifecycle materialises only website-scoped copies
and runs the post-copy hook.

## Staging procedure

After the Odoo.sh build for this commit succeeds, update `theme_open2`, switch
to the Open2 website, and select/refresh the Open2 theme through the Website
theme chooser. Verify that the menu has the four Open2 entries only and compare
the saved FACODI snapshot before and after. No direct database changes are part
of this procedure.
