-- Close a public RLS gap: previously, a UC marked 'active' but published=false
-- was visible if its parent course was published. Editors retain their separate
-- app_metadata-based policy. The catalog contains 84 active published UCs.
ALTER POLICY public_read_units_for_published_courses
 ON facodi.curricular_units
 USING (
  published IS TRUE AND status='active'
  AND EXISTS(
   SELECT 1 FROM facodi.courses c
   WHERE c.id=curricular_units.course_id
    AND c.published IS TRUE AND c.status='active')
 );
DO $check$ BEGIN
 IF (SELECT count(*) FROM facodi.curricular_units WHERE published AND status='active') <> 84
 THEN RAISE EXCEPTION 'Unexpected academic catalog state'; END IF;
END $check$;