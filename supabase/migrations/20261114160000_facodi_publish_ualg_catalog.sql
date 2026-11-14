-- Publish the reconciled UAlg catalogue (LESTI, LDCOM) so the public FACODI
-- frontend can read it through the existing RLS policies.
-- Non-destructive: only flips publication state on draft rows. Archived rows
-- and video links (unit_videos, still pending review) are left untouched.
-- Rollback: set published = false, status = 'draft' on the same rows.

update facodi.courses
set published = true,
    status = 'active'
where code in ('LESTI', 'LDCOM')
  and status = 'draft';

update facodi.curricular_units u
set published = true,
    status = 'active'
from facodi.courses c
where c.id = u.course_id
  and c.code in ('LESTI', 'LDCOM')
  and u.status = 'draft';
