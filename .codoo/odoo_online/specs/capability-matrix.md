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
| `approval.category` API model | Not available in probe | Not used. Approval rules are exposed through `studio.approval.rule`; publication binding remains unproven. |
| `studio.approval.rule` | Available; create/write rights observed | Candidate for Studio button approvals; do not bind it to publication without a UI/API proof. |
| `base.automation` records | Empty in probe | Configure only after Studio capability confirmation. |
| Python custom addons | Not supported on target | Keep source repo for migration/docs only. |
| External pipeline | Not part of target | Do not reintroduce for Online architecture. |

## Required next gate

The current proof created namespaced manual fields and a backend menu shell through JSON-RPC. These are not an exported Studio customization. The next required gate is a disposable Studio UI proof: create one field and one approval rule, export the customization, then verify the real publication action and access behavior before calling the Studio layer complete.
