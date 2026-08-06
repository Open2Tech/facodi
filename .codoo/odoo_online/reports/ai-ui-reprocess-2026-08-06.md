# FACODI AI UI Reprocess

Date: 2026-08-06

## Problem

The UI showed the full Gemini response inside the summary field while dedicated fields remained empty. It also exposed raw `[SOURCE:...]` markers and Markdown-style headings.

## Fix

The Gemini action now requests explicit labeled sections, parses them, strips source markers/Markdown artifacts, and fills:

- suggested title;
- summary;
- objectives;
- topics;
- keywords;
- level;
- collection;
- quality notes.

The action supports safe reprocessing of `waiting_review` and `converted` proposals while preserving their existing state and relation to eLearning.

The technical boolean label was corrected from `Aguardando revisão` to `IA concluída` so it is not confused with editorial state.

## Reprocessing result

Proposals 13–17 were reprocessed:

- all structured AI fields are non-empty;
- no `[SOURCE:]` or raw `**` markers remain;
- proposals 14, 15, and 17 remain `waiting_review`;
- converted proposals 13 and 16 remain `converted`;
- eLearning relations 51 and 52 were preserved;
- no publication flags changed.

The authenticated UI was checked on proposal 13 and displayed the structured title, keywords, summary, and topics in their dedicated fields.
