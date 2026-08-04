---
name: Neo-Technical Brutalism
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#474832'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#78795f'
  outline-variant: '#c8c8ab'
  surface-tint: '#5c6300'
  primary: '#5c6300'
  on-primary: '#ffffff'
  primary-container: '#efff00'
  on-primary-container: '#6d7400'
  inverse-primary: '#c3d000'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#5d5f5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#f3f3f3'
  on-tertiary-container: '#6d6f6f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#deed00'
  primary-fixed-dim: '#c3d000'
  on-primary-fixed: '#1b1d00'
  on-primary-fixed-variant: '#454a00'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  text-secondary: '#666666'
  dark-bg: '#0B0B0B'
  dark-surface: '#1A1A1A'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 38.4px
    fontWeight: '700'
    lineHeight: '1'
  headline-h1:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-h2:
    fontFamily: JetBrains Mono
    fontSize: 17.6px
    fontWeight: '700'
    lineHeight: '1.4'
    letterSpacing: 0.1em
  body-lead:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14.4px
    fontWeight: '400'
    lineHeight: '1.5'
  stat-value:
    fontFamily: Space Grotesk
    fontSize: 25.6px
    fontWeight: '700'
    lineHeight: '1'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  metadata:
    fontFamily: JetBrains Mono
    fontSize: 10.4px
    fontWeight: '400'
    lineHeight: '1.2'
  button-text:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  page-padding: 40px
  section-gap-top: 40px
  section-gap-bottom: 32px
  card-padding: 20px
  button-padding-y: 9px
  button-padding-x: 20px
  grid-gap-lg: 24px
  grid-gap-sm: 14px
  nav-height: 64px
---

## Brand & Style

The design system is built on **Neo-Brutalism**, a style that emphasizes raw structure, high-contrast energy, and technical precision. It is designed for an audience that values transparency, education, and modern web culture. The personality is unapologetically bold, energetic, and authoritative.

The aesthetic rejects the "softness" of modern SaaS design. Instead of subtle gradients and blurs, it utilizes heavy 2px solid strokes and hard-edged shadows to create a tactile, "clickable" interface. The presence of monospaced typography injects a developer-centric, documentation-first feel, signaling that this is a place for learning and technical mastery.

- **Primary Style:** Neo-Brutalism.
- **Key Characteristics:** 2px solid black borders, 4px hard-offset shadows, high-contrast neon accents, and a distinct separation between content and metadata.
- **Emotional Response:** High energy, technical confidence, and structural clarity.

## Colors

The palette centers on a high-visibility "Electric Lime" (#EFFF00) that serves as the primary driver for interaction and focus. This is anchored by a binary foundation of absolute Black and White to maintain maximum contrast.

- **Primary:** Use for main CTAs, active states, and as a highlight background for critical section headers.
- **Secondary (Black):** Used for all borders, primary text, and hard shadows. It provides the "ink" that defines the structure.
- **Neutral (White/Muted):** White is the default background for cards and pages. The muted gray (#F2F2F2) is reserved for subtle surface differentiation, such as hover states or legacy content containers.
- **Secondary Text:** A mid-tone gray (#666666) is used for body paragraphs and metadata to ensure the 2px black borders and primary titles remain the focal point.

## Typography

The system uses a tri-font hierarchy to balance character with utility:

1.  **Space Grotesk (Headings/Branding):** Use for all primary headings and brand-facing elements. It provides the geometric, expressive character of the system.
2.  **Inter (Body):** Reserved for long-form reading and interface text. Its neutrality prevents the design from feeling overwhelming.
3.  **JetBrains Mono (Technical/Labels):** Used for "Kickers" (over-lines), technical data, and H2 section headers. This adds a layer of "documentation" aesthetic that reinforces the educational brand.

**Scaling:** For mobile devices, the `display-hero` should scale down to `32px` to ensure legibility and prevent excessive word breaking.

## Layout & Spacing

This design system uses a **fixed-width grid container** for desktop (max-width 1280px) and shifts to a **fluid fluid-margin model** for mobile. 

- **The Rhythm:** Spacing is deliberate and generous. Sections are separated by a consistent 40px/32px vertical rhythm.
- **Grid Strategy:** Use a 12-column grid for desktop with 24px gutters. For metadata-heavy areas (like stat grids), reduce the gap to 14px to maintain visual grouping.
- **Mobile Adaptation:** On mobile, page margins reduce to 20px. Grid columns collapse to a single-column stack for course cards, while stat cards should wrap into a 2-column layout.

## Elevation & Depth

Depth is created through **physical displacement**, not light simulation. 

- **Shadow Logic:** Shadows are always #000000 at 100% opacity. 
- **Standard Elevation:** Used for cards and buttons. Apply a 3px horizontal and 3px vertical offset.
- **Hero Elevation:** Reserved for high-impact elements like hero sections or primary CTAs. Apply a 5px horizontal and 5px vertical offset.
- **Interactive State:** When an element is hovered or active, it should "depress." Transition the shadow to 1px 1px and translate the element by 2px 2px. This creates a mechanical "click" feel.
- **Borders:** Every surface (cards, inputs, buttons) must have a 2px solid #000000 border. No exceptions.

## Shapes

The shape language is "Softened Brutalism." While the colors and borders are aggressive, the corners are slightly rounded to ensure the UI feels modern and accessible.

- **Standard Radius (8px):** Buttons, cards, and navigation bars.
- **Large Radius (10px):** Stat cards and large hero containers.
- **Accent Radius (6px):** Small badges and accent highlights.
- **Focus Rings:** Use a 3px solid `--facodi-primary` stroke with a 3px offset from the element border.

## Components

### Buttons
- **Primary:** Neon Yellow (#EFFF00) background, 2px black border, 3px black hard shadow. Black text (Space Grotesk Bold).
- **Secondary:** White background, 2px black border, 3px black hard shadow. Black text.
- **Hover:** Transform `translate(2px, 2px)` and reduce shadow to `1px 1px`.

### Course Cards
- **Background:** White. 
- **Border:** 2px Solid Black.
- **Shadow:** 3px hard black offset.
- **Header:** Course image followed by a 2px horizontal black divider.
- **Content:** Card padding of 20px. Use JetBrains Mono for the category "kicker" above the title.

### Input Fields
- **Surface:** #FFFFFF.
- **Border:** 2px solid black. 
- **Text:** Inter Regular.
- **Focus:** No shadow change, but add a 3px primary-color outline with 3px offset.

### Navigation Bar
- **Height:** 64px.
- **Style:** White background with a 2px bottom border. 
- **Links:** Space Grotesk Semi-bold. On hover, apply a #F2F2F2 background and a 4px border radius.

### Chips & Badges
- **Style:** JetBrains Mono Bold, uppercase. 
- **Border:** 2px solid black. 
- **Radius:** 6px.
- **Color:** Use primary for "New" or "Active" states; White for general metadata.