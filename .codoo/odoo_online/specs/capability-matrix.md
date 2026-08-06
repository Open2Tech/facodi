# FACODI Online Capability Matrix

Inventory date: 2026-08-06. All observations are read-only API facts.

| Capability | Observed | Decision |
| --- | --- | --- |
| Website | Installed | Keep standard; API-managed pages/menus/views. |
| eLearning | Installed | Keep `slide.channel`/`slide.slide` as source of truth. |
| Studio | `web_studio`, `website_studio` installed | Use for fields, views, menus, automations. |
| AI fields | `ai_fields` installed | Use suggestion fields only. |
| AI server actions | `ai_server_actions` installed | Probe action creation/configuration before applying. |
| AI Documents | Installed | Use approved Documents sources. |
| AI Knowledge | Installed | Use restricted Knowledge sources. |
| Documents | Installed | Store approved source material. |
| Knowledge | Installed | Store curricula and editorial guide. |
| Surveys | Installed | Optional assessments after course content exists. |
| Dashboards | Installed | Use native dashboard/filter views; no custom frontend. |
| `x_studio_*` on slide models | None observed | Create only after field matrix review. |
| `approval.category` API model | Not available in probe | Do not assume approval API; validate in Studio UI or use explicit approval field/activity. |
| `base.automation` records | Empty in probe | Configure only after Studio capability confirmation. |
| Python custom addons | Not supported on target | Keep source repo for migration/docs only. |
| External pipeline | Not part of target | Do not reintroduce for Online architecture. |

## Required next gate

Create one Studio field and one workflow proof-of-concept on a disposable/test record, export the Studio customization, then verify the real publication action and access behavior before bulk field creation.
