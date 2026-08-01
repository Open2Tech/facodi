# Open2 design system

The theme centralizes the brand palette, typography, spacing, motion, and component styles in `static/src/scss/`.

| Role | Value |
|---|---|
| Ink | `#05070a` |
| Violet | `#8b5cf6` |
| Blue | `#3c83f6` |
| Teal | `#0d9488` |
| Text | `#f8fafc` |
| Secondary text | `#cbd5e1` |
| Muted text | `#94a3b8` |
| Error | `#ef4444` |

Space Grotesk is used for display text and Inter for body text. Both variable fonts are self-hosted under the SIL Open Font License. Headings are capped at 6rem, use fluid `clamp()` sizing, and never exceed `-.04em` letter spacing.

The layout uses a four-point spacing base, 1600px maximum content width, structural four-pixel rules, square controls, and explicit focus states. Snippet options expose compact/default/airy density, brand/light/violet/teal contrast, and start/center alignment.
