# PULSE — source incident lifecycle v2

Applied migration `20261128135701_kf_source_maintenance_incident_lifecycle` and Odoo action 1184. An open incident carries a deterministic SHA-256 key derived from the learning-object UUID, YouTube ID and initial observation epoch. A persistent signal keeps its key; a resolved signal that recurs gets a new first-seen time and key. Only fresh open demand rows are eligible for mission creation. The Odoo consumer deduplicates across all task stages and archives, with the existing one-per-day and three-open limits. Explicit HTTP 200 recovery evidence for the same video and incident is attached once to the matching mission; absence of a signal is not proof of recovery. No automatic QC approval, publication change or content deletion.

## Verification (2026-11-28)

- SQL transaction with rollback: initial incident, repeated refresh, recovery with same key, recurrence with new key passed. No synthetic incident persisted; no webhook sent with fixture data.
- Real operational webhook returned HTTP 200 and the Odoo Control Tower displayed the new recovery metric (zero real incidents/recoveries).
- Positive Odoo task creation/recovery awaits genuine evidence; not claimed as tested.
- Functions retain existing private execution grants. No schema/table changes or new cron.

## Rollback

Restore prior functions from the preceding operations history and action 1184 from its previous reviewed revision. Do not delete existing tasks or evidence.
