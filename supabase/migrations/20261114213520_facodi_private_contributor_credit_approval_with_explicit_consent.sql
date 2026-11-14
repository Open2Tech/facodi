-- FACODI: public attribution requires an explicit editorial decision and traceable consent.
-- Only public verified sources are placed in the profile; private audit notes remain isolated.
CREATE TABLE IF NOT EXISTS facodi.project_credit_approvals(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 profile_id uuid NOT NULL REFERENCES facodi.project_profiles(id) ON DELETE RESTRICT,
 reviewed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 reviewed_at timestamptz NOT NULL DEFAULT now(),
 consent_basis text NOT NULL CHECK(consent_basis IN ('direct_written_confirmation','public_self_identification')),
 review_note text NOT NULL CHECK(char_length(btrim(review_note)) BETWEEN 20 AND 500)
);
ALTER TABLE facodi.project_credit_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON facodi.project_credit_approvals FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON facodi.project_credit_approvals TO authenticated;
CREATE POLICY project_credit_approvals_editor_read
 ON facodi.project_credit_approvals FOR SELECT TO authenticated
 USING((SELECT facodi.is_facodi_editor()));
CREATE POLICY project_credit_approvals_editor_insert
 ON facodi.project_credit_approvals FOR INSERT TO authenticated
 WITH CHECK((SELECT facodi.is_facodi_editor()) AND reviewed_by=(SELECT auth.uid()));

CREATE OR REPLACE FUNCTION facodi.review_project_credit(
 p_profile_id uuid,
 p_role_label text,
 p_headline text,
 p_description text,
 p_public_source_url text,
 p_consent_basis text,
 p_review_note text
) RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=facodi,pg_temp
AS $fn$
DECLARE v_profile_id uuid;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT (SELECT facodi.is_facodi_editor()) THEN
  RAISE EXCEPTION 'Only FACODI editors may approve public credits' USING ERRCODE='42501';
 END IF;
 IF p_consent_basis NOT IN ('direct_written_confirmation','public_self_identification') THEN
  RAISE EXCEPTION 'Confirmed consent basis is required' USING ERRCODE='22023';
 END IF;
 IF p_public_source_url IS NULL OR p_public_source_url !~ '^https://[^[:space:]]+$'
    OR char_length(p_public_source_url)>1000 THEN
  RAISE EXCEPTION 'Verifiable HTTPS public source required' USING ERRCODE='22023';
 END IF;
 IF char_length(btrim(coalesce(p_role_label,''))) NOT BETWEEN 3 AND 150
 OR char_length(btrim(coalesce(p_headline,''))) NOT BETWEEN 10 AND 320
 OR char_length(btrim(coalesce(p_description,''))) NOT BETWEEN 20 AND 1800
 OR char_length(btrim(coalesce(p_review_note,''))) NOT BETWEEN 20 AND 500 THEN
  RAISE EXCEPTION 'Role, headline, description and review note require meaningful text' USING ERRCODE='22023';
 END IF;
 UPDATE facodi.project_profiles
 SET role_label=btrim(p_role_label),headline=btrim(p_headline),
  description=btrim(p_description),public_source_url=btrim(p_public_source_url),
  verification_state='verified_public',publication_state='published',
  consent_for_public_credit=true,
  reviewed_by=(SELECT auth.uid()),reviewed_at=now(),updated_at=now()
 WHERE id=p_profile_id
   AND entity_kind='person'
   AND relationship_kind='candidate_contributor'
   AND publication_state='draft'
   AND verification_state='pending'
 RETURNING id INTO v_profile_id;
 IF v_profile_id IS NULL THEN
  RAISE EXCEPTION 'Pending contributor profile missing or already reviewed' USING ERRCODE='P0002';
 END IF;
 INSERT INTO facodi.project_credit_approvals(profile_id,reviewed_by,consent_basis,review_note)
 VALUES(v_profile_id,(SELECT auth.uid()),p_consent_basis,btrim(p_review_note));
 RETURN v_profile_id;
END;
$fn$;
REVOKE ALL ON FUNCTION facodi.review_project_credit(uuid,text,text,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION facodi.review_project_credit(uuid,text,text,text,text,text,text) TO authenticated;
