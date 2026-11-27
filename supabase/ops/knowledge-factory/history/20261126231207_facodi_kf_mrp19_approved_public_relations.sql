create policy facodi_public_read_kf_approved_community_links on facodi.learning_object_relations for select to anon,authenticated using (
 relation_type='contains' and created_by_mechanism='knowledge_factory'
 and metadata->>'review_status'='approved' and metadata->>'review_scope'='community_course_release'
 and exists(select 1 from facodi.learning_objects p where p.id=parent_object_id and p.published and p.status in ('active','published') and p.object_type in ('collection','module') and p.metadata->>'editorial_batch'='facodi-kf-mrp19-20261126')
 and exists(select 1 from facodi.learning_objects c where c.id=child_object_id and c.published and c.status in ('active','published') and c.object_type in ('module','document','video') and c.metadata->>'editorial_batch'='facodi-kf-mrp19-20261126')
);
