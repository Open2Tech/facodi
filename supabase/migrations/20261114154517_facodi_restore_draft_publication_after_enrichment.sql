-- Safety correction: preserve pre-enrichment draft state of the two imported courses
-- and all their imported/official-option curricular units. The learning graph remains unpublished.
-- Editorial review was not completed and legacy unit/video associations are pending review.
UPDATE facodi.curricular_units u
SET status='draft', published=false,
    metadata=coalesce(u.metadata,'{}'::jsonb) ||
      jsonb_build_object('publication_review_required',true)
FROM facodi.courses c
WHERE u.course_id=c.id AND c.code IN ('LESTI','LDCOM')
  AND coalesce(u.metadata->>'curriculum_review_status','pending_editorial_approval')
    IN ('pending_editorial_approval','not_listed_in_2026_27_plan')
  AND (u.status<>'draft' OR u.published IS DISTINCT FROM false);
UPDATE facodi.courses c
SET status='draft',published=false,
    metadata=coalesce(c.metadata,'{}'::jsonb) ||
      jsonb_build_object('publication_review_required',true)
WHERE c.code IN ('LESTI','LDCOM')
  AND c.metadata->>'catalog_review_status'='pending_editorial_approval'
  AND (c.status<>'draft' OR c.published IS DISTINCT FROM false);