# FACODI interface

Learners use the public catalogue in ordinary reading conditions; editors work
with forms and lists. The default is a light, high-contrast canvas, not an
animated social feed.

- Identity: FACODI wordmark with a simple F favicon, lime `#eeff00`, near-black
  ink, white background and neutral secondary surfaces.
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
