-- FACODI 2026/11/14: reduce privileges on unpublished editorial material,
-- audit editor decisions, and expose a strictly invoker-owned review RPC.
REVOKE ALL ON facodi.generated_structures FROM anon;
ALTER TABLE facodi.generated_structures
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE facodi.generated_structures
  DROP CONSTRAINT IF EXISTS facodi_blueprint_review_note_limit;
ALTER TABLE facodi.generated_structures
  ADD CONSTRAINT facodi_blueprint_review_note_limit
  CHECK (review_note IS NULL OR char_length(review_note)<=2000);
CREATE INDEX IF NOT EXISTS facodi_blueprint_editor_queue_idx
  ON facodi.generated_structures (status,created_at DESC)
  WHERE generated_by='facodi_deterministic_editorial_blueprint';

CREATE OR REPLACE FUNCTION facodi.review_study_blueprint(
  p_id uuid, p_decision text, p_note text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=facodi,pg_temp
AS $fn$
DECLARE result_id uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT (SELECT facodi.is_facodi_editor()) THEN
    RAISE EXCEPTION 'Only FACODI editors may review study blueprints' USING ERRCODE='42501';
  END IF;
  IF p_decision NOT IN ('accepted','rejected') OR p_decision IS NULL THEN
    RAISE EXCEPTION 'Decision must be accepted or rejected' USING ERRCODE='22023';
  END IF;
  IF length(coalesce(p_note,''))>2000 THEN
    RAISE EXCEPTION 'Review note too long' USING ERRCODE='22023';
  END IF;

  UPDATE facodi.generated_structures g
     SET status=p_decision,
         reviewed_at=now(),
         reviewed_by=(SELECT auth.uid()),
         review_note=nullif(btrim(p_note),''),
         updated_at=now()
  WHERE g.id=p_id
    AND g.status='draft'
    AND g.generated_by='facodi_deterministic_editorial_blueprint'
    AND g.structure_type IN ('module','curriculum_mapping')
  RETURNING g.id INTO result_id;

  IF result_id IS NULL THEN
    RAISE EXCEPTION 'Draft blueprint not found or already reviewed' USING ERRCODE='P0002';
  END IF;
  RETURN result_id;
END;
$fn$;
REVOKE ALL ON FUNCTION facodi.review_study_blueprint(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION facodi.review_study_blueprint(uuid,text,text) FROM anon;
GRANT EXECUTE ON FUNCTION facodi.review_study_blueprint(uuid,text,text) TO authenticated;
-- An accepted blueprint is an internal editorial decision. Never publish
-- the corresponding course, unit, or learning object automatically.
