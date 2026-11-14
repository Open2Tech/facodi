# FACODI interface

Learners use the public catalogue in ordinary reading conditions; editors work
with forms and lists. The default is a light, high-contrast canvas, not an
animated social feed.

- Identity: FACODI wordmark with a simple F favicon and the facodi.com palette:
  warm paper `#FDFCF7`, navy ink `#142846`, sun `#EFFF00`. Shapes stay flat and
  square: no rounded cards and no offset shadows.
- Accents (`brand-*` tokens): cyan `#37BED2`, mint `#A7E8BE`, orange `#FFAE33`,
  pink `#FF70A6`, coral `#FF8A7A` are fills that always carry navy text
  (≥5.7:1). Blue `#3979C8` is for non-text marks only (3.3:1 with navy).
  Content types keep one colour and icon, defined once in
  `src/components/catalog/contentTone.ts` and shown with `TypeBadge`: courses
  sun, units orange, videos pink, external references cyan, documents mint,
  unknown types coral. The colour is decorative; the label always names the type.
- Chips, facets and badges are square like everything else; an active facet
  uses the sun fill.
- Editorial states use a neutral ramp (`src/components/editorial/statusTone.ts`,
  `StatusBadge`) so they never compete with content-type colours: active solid
  ink, published translucent ink, draft sun (pending work), archived muted,
  unknown coral. The same swatches drive the admin distribution bars, whose
  exact counts stay available as text and in the table.
- Account pages (login, password recovery, invalid auth links) share
  `AuthShell`: the form leads and an ink panel with live catalogue counts
  reminds visitors that reading never needs an account. The profile pairs its
  forms with an account summary (initials tile, role, email state, join date).
- With a signed-in session, account links (personal area, editor, admin)
  collapse to icon links between `xl` and `2xl` so the header keeps one line;
  their name stays as the accessible label and tooltip.
- Ink surfaces (`bg-ink text-ink-foreground`): footer, method band and
  thumbnail banners, opened by a 4px sun top rule. Sun text is allowed on ink.
  Never use `bg-black`, `neutral-*` or `text-white` directly.
- Dark mode (`facodi-theme`, header toggle): deep navy `#0B1325`, cards
  `#111E36`, sun stays the primary fill; accent fills are unchanged.
- Headline emphasis: a sun marker (`<mark>` from the locale string), never
  gradient text.
- Imagery: real YouTube thumbnails of published, approved trail videos
  (`VideoMosaic`, `VideoCard`); never placeholder or stock imagery.
- Typography: locally hosted Space Grotesk, mixed-case headings, balanced line
  wrapping and prose widths no greater than 65–75 characters.
- Public pages: a clear learning question, direct catalogue access, honest
  empty states and separated course rows rather than decorative card grids.
- Editorial pages: typed forms, searchable existing-record associations,
  paginated lists, explicit state labels and confirmation for visibility changes.
- Components: existing shadcn primitives and Tailwind utilities. No side-stripe
  alerts, gradient text or default glass surfaces.
- Interaction: short state-driven color transitions, keyboard-visible focus,
  loading placeholders, explicit errors and retry controls.
- Mobile: collapsible inline navigation and stacked forms; tables scroll
  within their container.
- Accessibility: body and placeholder contrast at least 4.5:1; reduced-motion
  overrides all animation/transition durations.

Tokens live in [src/index.css](src/index.css). Domain UI is composed under
[src/components](src/components); do not change generated primitives casually.
