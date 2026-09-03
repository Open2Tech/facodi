# FACODI architecture blueprint

Functional and visual blueprint for a future FACODI addon on **Odoo Community**.

This branch intentionally contains architecture documentation only. It does not introduce Python models, SQL tables, XML views, Docker changes, Supabase dependencies, or implementation code.

## Primary artefacts

- [Editable Lucidchart blueprint (17 pages)](https://lucid.app/lucidchart/a4dd1b70-922c-416a-8390-3bd7886d8c7f/edit)
- [FACODI architecture folder on Google Drive](https://drive.google.com/drive/folders/1f1LoZ6KeyWvG0aMzrl3verS7zTdmCEXm)
- [Functional architecture specification](../../superpowers/specs/2026-09-03-facodi-architecture-blueprint-design.md)

## Architectural rule

1. Use Odoo Standard.
2. Extend Odoo Standard when necessary.
3. Relate Standard objects.
4. Reuse Website, eLearning, Users, Portal, Contacts, Mail/Discuss, Activities, Project, Attachments, tags and cron where suitable.
5. Add FACODI-specific responsibilities only for educational domain meaning, provenance, AI-assisted analysis, curricular matching, coverage and human curation that Standard cannot represent correctly.

## Status

Conceptual proposal for human review. Technical derivation and implementation are a later, separately approved phase.
