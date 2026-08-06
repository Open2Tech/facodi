# FACODI Studio Export

Target: `https://edu-open2.odoo.com` / `edu-open2`
Branch: `odoo-online`

## Artifact

- File: `addons/theme_facodi/customizations2.zip`
- Module inside archive: `studio_customization`
- ZIP integrity: verified with `unzip -tq`.
- Export source: authenticated Odoo Studio UI after API reconciliation.

## Exported records

- 24 `ir.model.fields` records with `studio=True` metadata.
- `slide.slide` Studio form view customization.
- FACODI server action for the editorial state.
- FACODI `base.automation` create trigger.
- Studio manifest and warnings file.

The 23 original dynamic fields plus the Studio AI field now have stable `studio_customization` external IDs. No duplicate runtime fields were created.

## API reconciliation

`reconcile_studio_fields.py` used the external JSON-RPC API with Studio context to create only missing `ir.model.data` metadata for existing fields. It did not recreate fields or migrate values. Verification reported 24 fields and no missing/non-Studio metadata.

The action's redundant `selection_value` relation was cleared through API while preserving `update_path=x_studio_editorial_state` and `value=preparing`. A temporary slide confirmed that the automation still assigns `preparing`; the temporary record was deleted.

## Remaining export warning

The Studio exporter still reports the `ir.model.fields.selection` record used by the action's former custom-value relation as non-exportable. The relation is now false and the functional value is exported. No `update_field_id` warning remains.

## Session boundary

The repository's API key authenticates JSON-RPC model calls but was rejected by `/web/session/authenticate`; therefore the ZIP download itself was obtained through the authenticated Studio UI session rather than a second API HTTP session. No credentials are stored in the artifact.
