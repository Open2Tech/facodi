-- Public graph is limited to already-published course -> unit links and
-- editorially accepted UC -> video associations. Pending relationships remain hidden.
GRANT SELECT ON facodi.learning_object_relations TO anon,authenticated;
DROP POLICY IF EXISTS facodi_public_read_published_educational_links
 ON facodi.learning_object_relations;
CREATE POLICY facodi_public_read_published_educational_links
 ON facodi.learning_object_relations FOR SELECT TO anon, authenticated
 USING (
   relation_type='contains'
   AND (
     (created_by_mechanism='structured_catalog_import')
     OR (metadata->>'review_status'='approved'
         AND (metadata->>'review_scope'='title_and_channel_only'
              OR created_by_mechanism='existing_public_playlist_mapping'))
   )
   AND EXISTS (
     SELECT 1 FROM facodi.learning_objects p
     WHERE p.id=parent_object_id AND p.published=true
       AND p.status IN ('active','published'))
   AND EXISTS (
     SELECT 1 FROM facodi.learning_objects ch
     WHERE ch.id=child_object_id AND ch.published=true
       AND ch.status IN ('active','published'))
 );