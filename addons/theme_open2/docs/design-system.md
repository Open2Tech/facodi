# Open2 design system

The theme centralizes the brand palette, typography, spacing, motion, and component styles in `static/src/scss/`.

| Role | Value |
|---|---|
| Deep ink | `#05070a` |
| Website black | `#0d1117` |
| Raised surface | `#111827`, `#1b2130` |
| Violet | `#6d3df6` |
| Blue | `#3b82f6` |
| Cyan | `#00c2ff` |
| Text | `#ffffff` |
| Secondary text | `#e5e7eb` |
| Muted text | `#64748b` |
| Error | `#ef4444` |

The official brand gradient runs violet to blue to cyan. It carries the symbol, primary calls to action, splash motion, social imagery, and the thin header/footer signal. Blue supports focus and secondary states. Cyan is reserved for active highlights and high-contrast inclusion/accessibility moments.

Space Grotesk is used for display text and Inter for body text. Both variable fonts are self-hosted under the SIL Open Font License. Headings are capped at 6rem, use fluid `clamp()` sizing on public brand surfaces, and stay above the `-.04em` letter-spacing floor.

The layout uses a 1600px maximum content width, subtle one-pixel structural rules, small-radius controls, and explicit focus states. Snippet options expose compact/default/airy density, brand/light/violet/teal contrast, and start/center alignment.
