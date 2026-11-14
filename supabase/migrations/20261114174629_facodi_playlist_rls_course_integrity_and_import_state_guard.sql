-- Tighten course/UC ownership validation for authenticated playlist authors.
-- Composite FK still protects integrity; this removes a tautological RLS term.
ALTER POLICY facodi_playlist_insert_own ON facodi.playlists
WITH CHECK (
 submitted_by=(SELECT auth.uid())
 AND status='pending'
 AND import_status IN ('pending','partial','completed','failed')
 AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_note IS NULL
 AND (
   (SELECT facodi.is_facodi_editor())
   OR EXISTS(
     SELECT 1 FROM facodi.curricular_units u
     JOIN facodi.courses c ON c.id=u.course_id
     WHERE u.id=playlists.curricular_unit_id
       AND u.course_id=playlists.course_id
       AND u.published AND u.status='active'
       AND c.published AND c.status='active'
   )
 )
);

-- Non-editors may update pending import status only to its actual computed
-- value. This does not change the editorial status or bypass RLS.
CREATE OR REPLACE FUNCTION facodi.validate_playlist_import_status()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path=facodi,pg_temp AS $fn$
DECLARE
 item_total integer;
 linked_total integer;
 expected text;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR (SELECT facodi.is_facodi_editor()) THEN
  RETURN NEW;
 END IF;
 IF OLD.status <> 'pending' OR NEW.status <> 'pending'
   OR OLD.submitted_by IS DISTINCT FROM NEW.submitted_by THEN
   RAISE EXCEPTION 'Only pending own playlist import state can be updated' USING ERRCODE='42501';
 END IF;
 SELECT count(*),count(video_id) INTO item_total,linked_total
 FROM facodi.playlist_items WHERE playlist_id=OLD.id;
 expected=CASE WHEN item_total=0 THEN 'pending'
  WHEN item_total=linked_total THEN 'completed' ELSE 'partial' END;
 IF NEW.import_status IS DISTINCT FROM expected THEN
  RAISE EXCEPTION 'Import state must match resolved playlist items' USING ERRCODE='22023';
 END IF;
 RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS facodi_validate_playlist_import_status ON facodi.playlists;
CREATE TRIGGER facodi_validate_playlist_import_status
 BEFORE UPDATE OF import_status ON facodi.playlists
 FOR EACH ROW EXECUTE FUNCTION facodi.validate_playlist_import_status();
