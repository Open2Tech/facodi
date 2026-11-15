-- Auditable withdrawal of a FACODI contributor credit.
-- A revoked credit disappears from public RLS queries in the same transaction.
CREATE TABLE IF NOT EXISTS facodi.project_credit_revocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 profile_id uuid NOT NULL REFERENCES facodi.project_profiles(id) ON DELETE RESTRICT,
 revoked_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 revoked_at timestamptz NOT NULL DEFAULT now(),
 reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 25 AND 600)
);
ALTER TABLE facodi.project_credit_revocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON facodi.project_credit_revocations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON facodi.project_credit_revocations TO authenticated;
CREATE POLICY "project_credit_revocations_editor_read"
 ON facodi.project_credit_revocations FOR SELECT TO authenticated
 USING ((SELECT facodi.is_facodi_editor()));
CREATE POLICY "project_credit_revocations_editor_insert"
 ON facodi.project_credit_revocations FOR INSERT TO authenticated
 WITH CHECK ((SELECT facodi.is_facodi_editor()) AND revoked_by=(SELECT auth.uid()));

CREATE OR REPLACE FUNCTION facodi.revoke_project_credit(
 p_profile_id uuid, p_reason text
) RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path = facodi, pg_temp
AS $fn$
DECLARE v_id uuid;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT (SELECT facodi.is_facodi_editor()) THEN
   RAISE EXCEPTION 'Only authenticated FACODI editors may withdraw contributor credits' USING ERRCODE='42501';
 END IF;
 IF char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 25 AND 600 THEN
   RAISE EXCEPTION 'A meaningful private withdrawal reason is required' USING ERRCODE='22023';
 END IF;
 UPDATE facodi.project_profiles AS p
 SET publication_state='archived',
     consent_for_public_credit=false,
     verification_state='disputed',
     updated_at=now(),
     editorial_metadata = coalesce(p.editorial_metadata,'{}'::jsonb) ||
       jsonb_build_object('credit_revoked_at',now(),'credit_status','withdrawn')
 WHERE p.id=p_profile_id
   AND p.entity_kind='person'
   AND p.relationship_kind='candidate_contributor'
   AND p.publication_state='published'
   AND EXISTS (SELECT 1 FROM facodi.project_credit_approvals a WHERE a.profile_id=p.id)
 RETURNING p.id INTO v_id;
 IF v_id IS NULL THEN
   RAISE EXCEPTION 'Only a previously approved active contributor credit may be withdrawn' USING ERRCODE='P0002';
 END IF;
 INSERT INTO facodi.project_credit_revocations(profile_id,revoked_by,reason)
 VALUES(v_id,(SELECT auth.uid()),btrim(p_reason));
 RETURN v_id;
END
$fn$;
REVOKE ALL ON FUNCTION facodi.revoke_project_credit(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION facodi.revoke_project_credit(uuid,text) TO authenticated;