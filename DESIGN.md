---
name: FACODI
description: Open digital campus that maps free videos and resources onto real university curricula.
colors:
  warm-paper: "hsl(50 60% 98%)"
  navy-ink: "hsl(216 56% 18%)"
  sun-marker: "hsl(64 100% 50%)"
  sun-marker-pressed: "hsl(64 100% 46%)"
  white-sheet: "hsl(0 0% 100%)"
  ruled-grey: "hsl(214 26% 95%)"
  pencil-grey: "hsl(219 21% 37%)"
  hairline: "hsl(216 22% 86%)"
  field-edge: "hsl(219 15% 49%)"
  ink-foreground: "hsl(210 7% 95%)"
  correction-red: "hsl(0 75% 42%)"
  tab-cyan: "hsl(188 63% 52%)"
  tab-mint: "hsl(141 59% 78%)"
  tab-orange: "hsl(36 100% 60%)"
  tab-pink: "hsl(337 100% 72%)"
  tab-coral: "hsl(7 100% 74%)"
  margin-blue: "hsl(213 57% 50%)"
  night-desk: "hsl(222 54% 9%)"
  night-sheet: "hsl(219 52% 14%)"
  night-ink: "hsl(222 60% 6%)"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-ui:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.1em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.sun-marker}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.body-ui}"
    rounded: "{rounded.none}"
    padding: "8px 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.sun-marker-pressed}"
    textColor: "{colors.navy-ink}"
  button-outline:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.none}"
    padding: "8px 20px"
    height: "40px"
  input-text:
    backgroundColor: "{colors.white-sheet}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.body-ui}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "40px"
  type-badge:
    backgroundColor: "{colors.tab-pink}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  nav-link-active:
    backgroundColor: "{colors.sun-marker}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.body-ui}"
    padding: "8px 12px"
  ink-panel:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.ink-foreground}"
    rounded: "{rounded.none}"
    padding: "32px 40px"
  video-card:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.none}"
    padding: "16px"
---

# Design System: FACODI

The [FACODI v4 design and voice guide](docs/facodi-identidade-v4.md) applies
the v03 media kit's visual direction and editorial tone to this HSL system.
Use it for colour pairings, channel formats and practical copy examples.

## Overview

**Creative North Star: "O caderno marcado"** — warm paper, navy ink and a
yellow highlighter laid over a real curriculum.

FACODI reads like a student's annotated notebook, not a streaming feed. The
page is warm paper, the text is navy ink, and the sun-yellow marker is the
one loud gesture: it highlights the word that matters, the active filter and
the next action. Coloured tabs, like index stickers on a binder, tell content
types apart without competing with the marker.

Learners mostly arrive on a phone, wanting to find a unit and start studying,
so the interface is calm, high-contrast and flat. Editorial and account pages
use the same world with denser lists and typed forms. Real thumbnails of
curated videos are the only imagery; the curriculum itself is the hero.

**Key Characteristics:**
- Warm paper canvas with navy ink, light by default and with a deep-navy dark mode.
- One sun-yellow marker for emphasis, active state and primary actions.
- Square geometry everywhere; borders separate, shadows barely exist.
- Coloured tabs encode content type, always with an icon and a written label.
- Navy ink bands opened by a 4px sun rule mark the footer and key panels.
- Space Grotesk for reading, IBM Plex Mono for labels, counts and metadata.

## Colors

The palette comes from the original facodi.com: paper, navy and highlighter,
plus five marker tabs. Every fill that carries text carries navy text.

### Primary
- **Sun Marker** (`sun-marker`): primary buttons, the active navigation item,
  active facets, the draft status, headline `<mark>` emphasis and the 4px top
  rule on ink surfaces. **Sun Marker Pressed** is its hover and pressed state.

### Secondary
- **Marker Tabs** (`tab-cyan`, `tab-mint`, `tab-orange`, `tab-pink`,
  `tab-coral`): content-type fills, defined once in
  `src/components/catalog/contentTone.ts`. Courses use sun, units orange,
  modules and documents mint, videos and sequences pink, external references
  cyan, and unknown types coral.
- **Margin Blue** (`margin-blue`): non-text marks only, such as dots, bars and
  icons on paper. It does not meet text contrast with navy.

### Neutral
- **Warm Paper** (`warm-paper`): page background.
- **White Sheet** (`white-sheet`): cards, popovers and form fields.
- **Navy Ink** (`navy-ink`): body text, rings and ink surfaces. **Ink
  Foreground** is text on ink.
- **Ruled Grey** (`ruled-grey`) for muted and secondary fills; **Pencil Grey**
  (`pencil-grey`) for secondary text and placeholders.
- **Hairline** (`hairline`) for dividers; **Field Edge** (`field-edge`) for input
  and card borders that must stay visible.
- **Correction Red** (`correction-red`): destructive actions and errors only.
- Dark mode: **Night Desk** background, **Night Sheet** cards, **Night Ink**
  bands. The marker and tab fills stay the same; the focus ring turns sun.

### Named Rules
**The One Marker Rule.** Sun yellow means "look here" or "act here". Never use
it as a section background or a decorative wash.

**The Navy-on-Fill Rule.** Sun and every marker tab carry navy text, at least
5.7:1. White text never sits on a light fill; sun text is allowed only on ink.

**The Label Names It Rule.** Content-type and status colours are decoration.
The badge text always names the type or state.

**The Neutral Status Rule.** Editorial states use a neutral ramp
(`src/components/editorial/statusTone.ts`, `StatusBadge`) so they never compete
with content-type tabs: active is solid ink, published translucent ink, draft
sun, archived muted, unknown coral.

## Typography

**Body Font:** Space Grotesk (locally hosted via Fontsource, weights 400–700)
**Label Font:** IBM Plex Mono (400 and 500)

Space Grotesk's geometric, slightly quirky shapes carry both headlines and
reading text. Mono is the notebook's margin hand: counts, durations, codes,
eyebrows and badges.

### Hierarchy
- **Display** (600): the home hero only. It steps down from 2.6rem on phones to
  the full size on large screens, with balanced wrapping.
- **Headline** (600): page titles and major section headings.
- **Title** (600): card titles, list rows and panel headings.
- **Body** (400): reading prose, at most 65–75 characters per line (legal
  sections cap at 68ch).
- **Body UI** (400): controls, tables and dense editorial lists.
- **Label** (Plex Mono 500, uppercase, wide tracking): badges, eyebrows and
  metadata. Numbers use tabular figures.

### Named Rules
**The Mixed-Case Rule.** Headings stay mixed case; uppercase belongs to mono
labels only.

**The Tabular Count Rule.** Every count, duration and statistic uses mono with
tabular figures so columns line up.

## Layout

- The content column is capped at 80rem, with 20px side padding on phones
  and 32px from `lg` up.
- Public pages lead with a clear learning question and direct catalogue
  access. Courses appear as separated rows, not decorative card grids; video
  grids are used only where thumbnails carry information.
- Editorial pages use paginated lists, searchable association pickers and
  stacked typed forms.
- The header is sticky and stays on one line. Below `xl`, navigation opens
  in a modal sheet with its own scroll area. At `xl` and above, public links
  use text labels and account actions share a labelled dropdown, independent
  of role. Language codes keep desktop preferences compact.
- Mobile: stacked forms; tables scroll inside their container.
- Legal pages use `LegalDocument`: a sticky numbered index (a `<details>` on
  mobile), a bordered review note, an optional summary box, numbered sections
  and an ink related-policies block.

## Elevation & Depth

The system is flat. Depth comes from borders, ink bands and the sun rule, not
from shadows. Surfaces sit at one level, separated by hairlines or field-edge
borders.

### Shadow Vocabulary
- A soft, diffuse shadow (`0 4px 8px rgba(0,0,0,0.12)`) appears only under
  filled buttons and deepens slightly on hover.
- Popovers use the same soft shadow; dialogs use a slightly deeper one
  (`0 8px 16px rgba(0,0,0,0.16)`) so they read as floating above the page.

### Named Rules
**The No Offset Rule.** No hard offset or "brutalist" shadows, no glass, no
glows on surfaces. When a surface needs separation, give it a border.

**The Sun Rule.** Ink surfaces (footer, method band, thumbnail banners,
`AuthShell` panel, legal related-policies block) open with a 4px sun top rule.

## Shapes

Everything is square: every radius token resolves to 0px, including pills and
`rounded-full`. Chips, facets, badges, inputs, cards, thumbnails and buttons
all have sharp corners. The only curves come from icons and the F favicon.

## Components

### Buttons
- **Primary:** sun fill, navy text, semibold, a soft shadow and a slight
  press scale (0.98). Hover darkens to Sun Marker Pressed.
- **Outline:** a 2px field-edge border on paper; hover fills with sun.
- **Ghost / Link:** used for low-emphasis actions; link buttons underline on hover.
- **Destructive:** Correction Red with white text. It is reserved for
  irreversible editorial confirmations; there are no hard deletes.

### Chips
- Facets and filter chips are square. The active facet takes the sun fill;
  removable chips show a visible ✕ with an accessible name.

### Cards / Containers
- `VideoCard`: a white or paper container with a field-edge border, a
  real 16:9 YouTube thumbnail, a mono duration on an ink tag, and a title
  clamped to two lines. Hover darkens the border to navy and underlines the
  title.
- Panels and summaries use a bordered box, never a coloured side stripe.

### Inputs / Fields
- 40px tall, white sheet, a 1.5px field-edge border. Focus moves the border to
  sun, with a visible outline from the global focus style. Placeholders use
  pencil grey at full opacity (at least 4.5:1).
- Search fields bound to the URL use `SearchInput` (local draft, 300ms
  debounce).

### Navigation
- The header shows the FACODI wordmark with a cyan full stop and the F favicon.
  Desktop links use text labels; mobile links pair icons with labels. The active
  link is a sun block. Mobile uses an outline icon button to open a labelled
  sheet with focus trapping, Escape dismissal and scrollable navigation.
- The footer is an ink band with the sun rule, holding institutional and
  legal links.

### Type Badge
- `TypeBadge`: square marker-tab fill, navy mono uppercase label and a 14px
  lucide icon, coloured by `contentTone`.

### Auth Shell
- `AuthShell`: the form leads, and an ink panel with live catalogue counts
  reminds visitors that reading never needs an account. The profile pairs its
  forms with an account summary (initials tile, role, email state, join date).

### Video Mosaic
- `VideoMosaic`: a banner of real thumbnails from published, approved trail
  videos, used on ink bands. It never uses placeholder or stock imagery.

## Do's and Don'ts

### Do:
- **Do** use the sun marker for the one thing that matters on a view: the
  primary action, the active state or the emphasised word.
- **Do** pair every content-type colour with its icon and written label.
- **Do** separate surfaces with borders and ink bands.
- **Do** show honest empty states, loading placeholders, explicit errors and
  retry controls.
- **Do** keep focus visible on every interactive element, and let
  reduced-motion override all animation and transition durations.
- **Do** use short, state-driven colour transitions (about 150ms) and the
  `rise` entrance (320ms) sparingly.

### Don't:
- **Don't** round corners or add offset shadows, glassmorphism or glows.
- **Don't** use gradient text, side-stripe alerts or decorative card grids.
- **Don't** use `bg-black`, `neutral-*` or `text-white` directly; use the ink
  and foreground tokens.
- **Don't** put white text on sun or marker tabs, or text in Margin Blue.
- **Don't** use placeholder, stock or AI-generated imagery; use only real
  thumbnails of curated videos.
- **Don't** change generated shadcn primitives casually; compose domain UI
  under `src/components`.
