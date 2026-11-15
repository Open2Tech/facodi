---
description: "Use when editing docs, marketing copy, SEO metadata, structured data, sitemap/robots/manifest files, or brand assets and copy."
name: "Docs Branding SEO Rules"
applyTo: "{README.md,docs/**/*.md,index.html,public/robots.txt,public/sitemap.xml,public/site.webmanifest,public/brand/o2t/README.md}"
---
# Docs, Branding, and SEO Rules

- Public-facing copy is for `FACODI` (open digital campus). `Open 2 Technology` / `O2T` is the organization. Do not reintroduce `Tube O2` or `Monynha` branding unless the text is explicitly historical.
- The canonical FACODI origin is `https://facodi.com` (`SITE_ORIGIN` in [src/shared/seo/seo.ts](../../src/shared/seo/seo.ts)); `www` has no DNS. Page metadata goes through `PageSeo` with descriptors from `seo.ts`; keep the `seo:start/end` block in `index.html` in sync with `homeMeta` (covered by `seo.test.ts`). Auth callbacks still use the app origin.
- Keep metadata in [index.html](../../index.html) and [public/site.webmanifest](../../public/site.webmanifest) aligned with FACODI branding.
- Treat [public/social-preview-default.png](../../public/social-preview-default.png) as the default social share image currently used by metadata. Do not swap preview assets without updating metadata references and verifying the image still fits a `1200x630` share card.
- When editing [public/site.webmanifest](../../public/site.webmanifest), keep the app name, short name, theme colors, and icon set consistent with the current product branding and favicon assets in [public](../../public).
- When editing [public/robots.txt](../../public/robots.txt) or [public/sitemap.xml](../../public/sitemap.xml), keep the host, canonical domain, and crawl policy aligned with the live product routes. Do not add private or authenticated routes.
- Prefer linking to existing brand and design references instead of duplicating guidance. Use [public/brand/o2t/README.md](../../public/brand/o2t/README.md) for brand assets and [docs/visual-elevation.md](../../docs/visual-elevation.md) for visual system context.