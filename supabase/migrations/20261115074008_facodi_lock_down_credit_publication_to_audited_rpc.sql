-- Credit visibility may ONLY change through audited, role-checked RPCs.
REVOKE INSERT, UPDATE, DELETE ON TABLE facodi.project_profiles FROM authenticated;
REVOKE INSERT ON TABLE facodi.project_credit_approvals FROM authenticated;
REVOKE INSERT ON TABLE facodi.project_credit_revocations FROM authenticated;
ALTER FUNCTION facodi.review_project_credit(uuid,text,text,text,text,text,text) SECURITY DEFINER;
ALTER FUNCTION facodi.review_project_credit(uuid,text,text,text,text,text,text) SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION facodi.revoke_project_credit(uuid,text) SECURITY DEFINER;
ALTER FUNCTION facodi.revoke_project_credit(uuid,text) SET search_path = pg_catalog, pg_temp;
REVOKE ALL ON FUNCTION facodi.review_project_credit(uuid,text,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION facodi.revoke_project_credit(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION facodi.review_project_credit(uuid,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION facodi.revoke_project_credit(uuid,text) TO authenticated;
COMMENT ON FUNCTION facodi.review_project_credit(uuid,text,text,text,text,text,text)
 IS 'Editor-only audited credit publication. Elevated only to bridge revocation of direct API writes; all referenced tables are schema-qualified.';
COMMENT ON FUNCTION facodi.revoke_project_credit(uuid,text)
 IS 'Editor-only audited credit withdrawal; direct API DML is revoked. Retains audit records.';