-- Optional student-owned guide progress: read model for the Ifes Cariacica 2026 curriculum.
-- The logged-in identity is always taken from auth.uid(); caller cannot supply a user ID.
-- Published guide availability is not the same as certification or Ifes academic grading.
CREATE OR REPLACE FUNCTION facodi.get_my_course_study_modules_v1(p_course_code text)
RETURNS TABLE(
  module_slug text, unit_slug text, school_year integer,
  status text, completed_at timestamptz
)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path=facodi,pg_temp
AS $fn$
  SELECT mo.slug, u.slug, u.year, pr.status, pr.completed_at
  FROM facodi.courses c
  JOIN facodi.curricular_units u ON u.course_id=c.id
  JOIN facodi.learning_object_relations edge
    ON edge.parent_object_id=u.learning_object_id
  JOIN facodi.learning_objects mo ON mo.id=edge.child_object_id
  LEFT JOIN facodi.study_module_progress pr
    ON pr.module_id=mo.id AND pr.user_id=(SELECT auth.uid())
  WHERE c.code=p_course_code
    AND c.id=md5('facodi:ifes:cariacica:administracao:2026:course:record')::uuid
    AND c.published AND c.status='active'
    AND u.published AND u.status='active'
    AND mo.object_type='module' AND mo.status='active' AND mo.published
    AND mo.metadata->>'batch'='facodi_ifes_adm26_public_practical_learning_20261115'
    AND mo.metadata->>'associated_unit_id'=u.id::text
    AND edge.relation_type='contains'
    AND (SELECT auth.uid()) IS NOT NULL
  ORDER BY u.year,u.position,u.title;
$fn$;
REVOKE ALL ON FUNCTION facodi.get_my_course_study_modules_v1(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION facodi.get_my_course_study_modules_v1(text) TO authenticated;

DO $v$ BEGIN
  IF has_function_privilege('anon','facodi.get_my_course_study_modules_v1(text)','EXECUTE')
  THEN RAISE EXCEPTION 'Study progress must remain private'; END IF;
  IF (SELECT count(*) FROM facodi.learning_object_relations e
    JOIN facodi.curricular_units u ON u.learning_object_id=e.parent_object_id
    JOIN facodi.learning_objects lo ON lo.id=e.child_object_id
    WHERE u.course_id=md5('facodi:ifes:cariacica:administracao:2026:course:record')::uuid
      AND lo.object_type='module'
      AND lo.metadata->>'batch'='facodi_ifes_adm26_public_practical_learning_20261115'
      AND lo.metadata->>'associated_unit_id'=u.id::text
      AND u.published AND lo.published)<>39
  THEN RAISE EXCEPTION 'Expected 39 published school study modules'; END IF;
END $v$;
