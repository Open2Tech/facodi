
-- Expose only curated, approved conceptual prerequisites linking public modules.
-- Do not grant access to draft relations, unpublished modules or user records.
CREATE POLICY facodi_public_read_curated_module_prerequisites
ON facodi.learning_object_relations FOR SELECT TO anon, authenticated
USING (
 relation_type='prerequisite_of'
 AND created_by_mechanism='editorial_module_graph_20261115'
 AND metadata->>'review_status'='approved'
 AND metadata->>'review_scope'='module_content_progression'
 AND EXISTS(
   SELECT 1 FROM facodi.learning_objects source
   WHERE source.id=parent_object_id AND source.object_type='module'
     AND source.published IS TRUE AND source.status='active')
 AND EXISTS(
   SELECT 1 FROM facodi.learning_objects target
   WHERE target.id=child_object_id AND target.object_type='module'
     AND target.published IS TRUE AND target.status='active')
);
