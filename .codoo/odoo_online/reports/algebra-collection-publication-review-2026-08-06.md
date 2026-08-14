# Álgebra Linear Collection Publication Review

Date: 2026-08-06

## Finding

The newly created collection `Álgebra Linear e Geometria Analítica` (id `4`) was publicly published while its two converted slides were still unpublished drafts. The collection reported zero public slides.

## Correction

The collection was set to:

- `website_published=false`;
- `is_published=false`;
- editorial state `preparing`;
- approval false.

Slides 51 and 52 remain unpublished and available for review. No records were deleted and no published collection was altered.

## Verification

- Backend confirms the collection is not published.
- Both slides remain `website_published=false` and `is_published=false`.
- The public route returns HTTP 200 without exposing the draft titles/content.

## Rule reinforced

A collection must not be published while it has no approved public content. Publication happens only after the contained drafts are reviewed and the publisher explicitly approves the collection.
