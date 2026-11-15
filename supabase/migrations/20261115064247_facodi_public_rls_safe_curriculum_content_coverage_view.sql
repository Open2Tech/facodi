-- Public, row-level-security-aware curriculum coverage.
-- Only published courses/UCs and approved, visible child objects contribute.
CREATE OR REPLACE VIEW facodi.course_unit_content_coverage
WITH (security_invoker = true)
AS
SELECT
 c.id AS course_id,
 c.code AS course_code,
 u.id AS curricular_unit_id,
 u.learning_object_id AS curricular_unit_object_id,
 u.code AS curricular_unit_code,
 u.title AS curricular_unit_title,
 u.year,
 u.semester,
 u.metadata->>'curricular_category' AS curricular_category,
 u.metadata->>'elective_group' AS elective_group,
 CASE WHEN jsonb_typeof(u.metadata->'official_hours') = 'number'
  THEN (u.metadata->>'official_hours')::numeric ELSE NULL END AS official_hours,
 count(DISTINCT child.id) FILTER (WHERE child.object_type='video')::integer AS video_count,
 count(DISTINCT child.id) FILTER (WHERE child.object_type='external_resource')::integer AS reading_count,
 count(DISTINCT child.id) FILTER (WHERE child.object_type='collection')::integer AS collection_count,
 CASE
  WHEN count(DISTINCT child.id) FILTER (WHERE child.object_type='video')>0
   AND count(DISTINCT child.id) FILTER (WHERE child.object_type='external_resource')>0
   THEN 'video_and_reading'
  WHEN count(DISTINCT child.id) FILTER (WHERE child.object_type='video')>0
   THEN 'video_only'
  WHEN count(DISTINCT child.id) FILTER (WHERE child.object_type='external_resource')>0
   THEN 'reading_only'
  ELSE 'no_approved_resources'
 END AS coverage_status
FROM facodi.courses c
JOIN facodi.curricular_units u ON u.course_id=c.id
LEFT JOIN facodi.learning_object_relations r ON r.parent_object_id=u.learning_object_id
 AND r.relation_type='contains'
 AND r.metadata->>'review_status'='approved'
LEFT JOIN facodi.learning_objects child ON child.id=r.child_object_id
 AND child.published=true AND child.status IN('active','published')
WHERE c.published=true AND c.status='active' AND u.published=true AND u.status='active'
GROUP BY c.id,c.code,u.id,u.learning_object_id,u.code,u.title,u.year,u.semester,u.metadata;
COMMENT ON VIEW facodi.course_unit_content_coverage IS
 'RLS-aware, published-only content coverage for all courses; approved video and reading counts per UC. No student/private editorial data.';
REVOKE ALL ON facodi.course_unit_content_coverage FROM PUBLIC;
GRANT SELECT ON facodi.course_unit_content_coverage TO anon, authenticated;
