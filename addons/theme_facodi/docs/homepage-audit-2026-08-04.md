# FACODI homepage audit - 2026-08-04

## Scope

Homepage audit for Odoo 19 on `staging-v1`, covering the hero, learning dashboard, course grid, navigation sidebar, learning-insights panel, public copy, and responsive behavior.

## Findings and fixes

| Area | Finding | Resolution |
|---|---|---|
| Course cards | Homepage markup used `.facodi-course-content` and `h3`, while the stylesheet only covered `.card-body` and `.card-title`. | Added direct selectors for the actual homepage structure, with stable padding, typography, wrapping, and flex layout. |
| Course cards | Cards had no dedicated art region and depended on content for height. | Added a shared art region, image sizing, equal grid rows, and consistent metadata placement. |
| Course cards | Hover existed, but keyboard focus was not visible. | Added `:focus-visible` treatment using the existing primary token. |
| Sidebar | Mobile navigation could exceed the available content width. | Constrained the sidebar to `width: 100%` and preserved horizontal navigation without layout overflow. |
| Journey card | The yellow card used an inline style. | Replaced it with the reusable `.facodi-stat-card-primary` modifier. |
| Public copy | Several Portuguese strings lacked accents, including `próximo`, `catálogo`, `currículos`, `conteúdos`, and `educação`. | Corrected the homepage copy in the QWeb template. |

## Validation

- Homepage XML parsed successfully.
- `facodi_frontend.scss` compiled successfully with libsass.
- Desktop browser audit captured the existing production layout and measured the original card/sidebar behavior.
- Original desktop cards measured equal outer height but had `padding: 0` on their actual content wrapper.
- Original mobile audit detected sidebar horizontal overflow and unequal card heights.
- Changes were committed incrementally on `staging-v1`:
  - `3ae46ad fix(theme): stabilize FACODI homepage cards`
  - `1ab796f fix(theme): polish FACODI homepage copy`

## Remaining deployment gate

The staging page still served the previous homepage after the first push, with the old copy and `padding: 0`. The external Odoo deployment pipeline had not exposed a GitHub Actions run for `staging-v1` at audit time. Final post-deployment screenshots at desktop, tablet, and mobile must be captured after the staging instance reports the new commit.

The Website Builder neutralized ribbon and editor chrome are environment overlays, not theme components; they were excluded from the addon changes.
