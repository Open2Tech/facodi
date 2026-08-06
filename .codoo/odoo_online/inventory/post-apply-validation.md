# FACODI Odoo Online post-apply validation

Date: 2026-08-06
Target: `https://edu-open2.odoo.com`
Website: `FACODI` (`website.id=2`)

## Remote API result

- Homepage: `website.page.id=7`, URL `/`, published, FACODI homepage architecture present.
- Institutional pages: `/sobre` id `8`, `/manifesto` id `9`, `/comunidade` id `10`, `/roadmap` id `11`, `/como-contribuir` id `12`.
- Header COW view: `codoo.facodi_online.header`, id `2477`.
- Footer COW view: `codoo.facodi_online.footer`, id `2478`.
- CSS attachment: `facodi-online.css`, id `431`, served at `/web/content/431`.
- Asset link view: `codoo.facodi_online.assets`, id `2479`.
- FACODI menu root: id `12`; approved child routes are `/`, `/slides`, `/sobre`, `/manifesto`, `/comunidade`, `/roadmap`, `/como-contribuir`, `/contactus`.
- The extra `/appointment` menu was removed from the FACODI tree. The prior record is preserved in `state/rollback-before.json`.

## HTTP smoke

All routes returned HTTP 200 with no `Internal Server Error` or `A css error occured` marker:

- `/`
- `/sobre`
- `/manifesto`
- `/comunidade`
- `/roadmap`
- `/como-contribuir`
- `/slides`
- `/website/search?search=zzzzzz`
- `/web/login`

The CSS attachment returned HTTP 200 and was served as CSS.

## Responsive browser matrix

| Viewport | Horizontal overflow | Passo 02 | CSS fallback | Extra menu |
| --- | --- | --- | --- | --- |
| 390x844 | No | Visible | No | No |
| 768x1024 | No | Visible | No | No |
| 1024x768 | No | Visible | No | No |
| 1440x1000 | No | Visible | No | No |
| 1920x1080 | No | Visible | No | No |

## Boundary

This validates the public visual frontend and API-managed website records. The
Python addons `theme_facodi` and `facodi_content` are not installed on Odoo Online.
Their controllers, cron, ACLs, record rules, and server-side models require
Odoo.sh or another Python-capable Odoo deployment. Studio fields and editorial
workflow remain a separate migration phase.
