-- Reduce multiple permissive SELECT policies for the FACODI community inbox.
DROP POLICY IF EXISTS "facodi_community_owner_read" ON facodi.community_participation_requests;
DROP POLICY IF EXISTS "facodi_community_editor_read" ON facodi.community_participation_requests;
CREATE POLICY "facodi_community_owner_or_editor_read"
 ON facodi.community_participation_requests FOR SELECT TO authenticated
 USING (
   submitted_by=(SELECT auth.uid())
   OR (SELECT facodi.is_facodi_editor())
 );
-- FK indexes for FACODI-only participant and consent-audit tables.
CREATE INDEX IF NOT EXISTS facodi_community_reviewed_by_idx
 ON facodi.community_participation_requests(reviewed_by) WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS facodi_project_credit_approvals_profile_idx
 ON facodi.project_credit_approvals(profile_id);
CREATE INDEX IF NOT EXISTS facodi_project_credit_approvals_reviewer_idx
 ON facodi.project_credit_approvals(reviewed_by);
CREATE INDEX IF NOT EXISTS facodi_project_credit_revocations_profile_idx
 ON facodi.project_credit_revocations(profile_id);
CREATE INDEX IF NOT EXISTS facodi_project_credit_revocations_reviewer_idx
 ON facodi.project_credit_revocations(revoked_by);
CREATE INDEX IF NOT EXISTS facodi_project_profiles_reviewer_idx
 ON facodi.project_profiles(reviewed_by) WHERE reviewed_by IS NOT NULL;