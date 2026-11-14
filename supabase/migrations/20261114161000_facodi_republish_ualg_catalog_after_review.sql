-- Republish the UAlg catalogue (LESTI, LDCOM) after owner editorial approval.
-- 20261114154517_facodi_restore_draft_publication_after_enrichment returned these
-- rows to draft because editorial review was still pending. The project owner has
-- since approved publication, so this records the approval in metadata and
-- publishes only the UCs that belong to the official 2026/27 plan.
-- UCs flagged 'not_listed_in_2026_27_plan' stay in draft.
-- unit_videos links remain pending_review.
-- Rollback: set status = 'draft', published = false and
-- publication_review_required = true on the same rows.

update facodi.courses
set status = 'active',
    published = true,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'catalog_review_status', 'approved',
      'publication_review_required', false,
      'publication_approved_at', now()
    )
where code in ('LESTI', 'LDCOM')
  and metadata->>'catalog_review_status' = 'pending_editorial_approval';

update facodi.curricular_units u
set status = 'active',
    published = true,
    metadata = coalesce(u.metadata, '{}'::jsonb) || jsonb_build_object(
      'curriculum_review_status', 'approved',
      'publication_review_required', false,
      'publication_approved_at', now()
    )
from facodi.courses c
where c.id = u.course_id
  and c.code in ('LESTI', 'LDCOM')
  and u.metadata->>'curriculum_review_status' = 'pending_editorial_approval';
