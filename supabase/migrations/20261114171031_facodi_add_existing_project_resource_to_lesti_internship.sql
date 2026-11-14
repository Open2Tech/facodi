-- Existing OpenLearn project-management material is also suitable as general
-- planning support for LESTI's Estágio; not the official internship regulation.
DO $guard$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM facodi.learning_objects
  WHERE id=md5('facodi:oer:project-management-openlearn')::uuid
   AND object_type='external_resource' AND published
   AND source_url='https://www.open.edu/openlearn/money-business/leadership-management/project-management-the-start-the-project-journey')
 THEN RAISE EXCEPTION 'Reviewed source not present'; END IF;
 IF NOT EXISTS(SELECT 1 FROM facodi.curricular_units u
  JOIN facodi.courses c ON c.id=u.course_id WHERE u.code='19411035'
  AND c.code='LESTI' AND u.status='active' AND u.published AND u.learning_object_id IS NOT NULL)
 THEN RAISE EXCEPTION 'Internship UC is not published'; END IF;
END $guard$;
INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:oer:relation:project-management-openlearn:19411035')::uuid,
 u.learning_object_id,md5('facodi:oer:project-management-openlearn')::uuid,
 'contains',60001,'verified_external_reading_curation',
 jsonb_build_object('review_status','approved',
 'review_scope','external_landing_page',
 'resource_purpose','study_reference',
 'uc_code',u.code,'note','General project management support for internship activities, not UAlg regulations.',
 'is_official_ualg_course_material',false,
 'curation_batch','facodi_readings_2026_11_14_internship_support')
FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
WHERE u.code='19411035' AND c.code='LESTI'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;
INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT md5('facodi:oer:project-management-openlearn')::uuid,t.id
FROM facodi.tags t WHERE t.slug='uc-19411035'
ON CONFLICT DO NOTHING;
DO $final$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_object_relations
  WHERE created_by_mechanism='verified_external_reading_curation')<>113
 THEN RAISE EXCEPTION 'Unexpected reference relation count'; END IF;
END $final$;