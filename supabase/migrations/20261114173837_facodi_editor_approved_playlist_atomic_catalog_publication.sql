-- FACODI: make reviewed playlist content visible in the independent learning
-- catalog, atomically with editor approval. Only references are hosted; video
-- media stays on YouTube. Does not modify public playlists.
CREATE OR REPLACE FUNCTION facodi.publish_approved_playlist_content()
RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=facodi,pg_temp
AS $fn$
DECLARE
  v_available integer;
  v_missing integer;
BEGIN
 IF TG_OP <> 'UPDATE' OR NEW.status <> 'approved' OR OLD.status = NEW.status THEN
   RETURN NEW;
 END IF;
 IF (SELECT auth.uid()) IS NULL OR NOT (SELECT facodi.is_facodi_editor()) THEN
   RAISE EXCEPTION 'FACODI editor approval required' USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
  WHERE u.id=NEW.curricular_unit_id AND u.course_id=NEW.course_id
    AND u.published AND u.status='active' AND c.published AND c.status='active'
 ) THEN
  RAISE EXCEPTION 'Cannot publish a playlist in an unpublished or mismatched unit' USING ERRCODE='22023';
 END IF;

 SELECT count(*) FILTER(WHERE i.review_status='approved' AND i.video_id IS NOT NULL),
        count(*) FILTER(WHERE i.review_status='approved' AND i.video_id IS NULL)
 INTO v_available,v_missing
 FROM facodi.playlist_items i WHERE i.playlist_id=NEW.id;
 IF v_available=0 OR v_missing>0 THEN
  RAISE EXCEPTION 'Approved playlist has no resolved videos' USING ERRCODE='22023';
 END IF;

 -- Create or publish canonical video learning objects for the approved items.
 INSERT INTO facodi.learning_objects
   (id,object_type,title,slug,description,language,status,published,
    source_type,source_url,source_id,tags,metadata)
 SELECT md5('facodi:video:'||v.id::text)::uuid,'video',v.title,
   'facodi-video-'||v.youtube_id,
   concat('Vídeo educativo disponibilizado pelo canal ',
     coalesce(nullif(v.channel_name,''),'YouTube'),
     '. Recurso externo selecionado em playlist e aprovado pela equipa editorial FACODI. Consulte a gravação original no YouTube.'),
   coalesce(nullif(v.language,''),'und'),'active',true,
   'tube','https://www.youtube.com/watch?v='||v.youtube_id,v.id::text,
   ARRAY['video','recurso-externo','youtube','apoio-ao-estudo'],
   jsonb_build_object(
    'import_source','public.videos','youtube_video_id',v.youtube_id,
    'channel_name',v.channel_name,'duration_seconds',v.duration_seconds,
    'thumbnail_url',v.thumbnail_url,
    'curation_status','editor_approved_playlist',
    'editor_reviewed_at',NEW.reviewed_at,
    'approved_playlist_id',NEW.id,
    'review_scope','playlist_item_editorial_approval',
    'video_fully_reviewed',false,
    'content_license_verified',false,
    'publication_type','external_youtube_link')
 FROM facodi.playlist_items i JOIN public.videos v ON v.id=i.video_id
 WHERE i.playlist_id=NEW.id AND i.review_status='approved'
 ON CONFLICT(id) DO UPDATE
   SET status='active',published=true,
       metadata=coalesce(facodi.learning_objects.metadata,'{}'::jsonb)
        || EXCLUDED.metadata
 WHERE facodi.learning_objects.object_type='video';

 INSERT INTO facodi.youtube_videos
 (id,learning_object_id,youtube_video_id,canonical_url,title,description,
  channel_title,duration_seconds,thumbnails,tags,language,metadata,status)
 SELECT md5('facodi:youtube-video:'||v.id::text)::uuid,
  md5('facodi:video:'||v.id::text)::uuid,
  v.youtube_id,'https://www.youtube.com/watch?v='||v.youtube_id,
  v.title,nullif(btrim(left(v.description,3000)),''),
  v.channel_name,v.duration_seconds,
  CASE WHEN nullif(v.thumbnail_url,'') IS NOT NULL THEN
   jsonb_build_object('default',jsonb_build_object('url',v.thumbnail_url))
   ELSE '{}'::jsonb END,
  '{}'::text[],coalesce(nullif(v.language,''),'und'),
  jsonb_build_object('source','facodi.playlists','approved_playlist_id',NEW.id,
   'editor_reviewed_at',NEW.reviewed_at,
   'video_fully_reviewed',false,'content_license_verified',false),
  'published'
 FROM facodi.playlist_items i JOIN public.videos v ON v.id=i.video_id
 WHERE i.playlist_id=NEW.id AND i.review_status='approved'
 ON CONFLICT(youtube_video_id) DO UPDATE
   SET status='published',metadata=coalesce(facodi.youtube_videos.metadata,'{}'::jsonb)
     || EXCLUDED.metadata;

 INSERT INTO facodi.learning_object_relations
 (id,parent_object_id,child_object_id,relation_type,position,
  created_by_mechanism,metadata)
 SELECT md5('facodi:approved-playlist-link:'||NEW.id||':'||v.id)::uuid,
  u.learning_object_id,md5('facodi:video:'||v.id)::uuid,
  'contains',40000+i.position,
  'facodi_editor_approved_playlist',
  jsonb_build_object(
   'review_status','approved','review_scope','playlist_item_editorial_approval',
   'approved_playlist_id',NEW.id,
   'reviewed_by',NEW.reviewed_by,'reviewed_at',NEW.reviewed_at,
   'video_fully_reviewed',false)
 FROM facodi.playlist_items i
 JOIN public.videos v ON v.id=i.video_id
 JOIN facodi.curricular_units u ON u.id=NEW.curricular_unit_id
 WHERE i.playlist_id=NEW.id AND i.review_status='approved'
 ON CONFLICT(parent_object_id,child_object_id,relation_type)
 DO UPDATE SET metadata=coalesce(facodi.learning_object_relations.metadata,'{}'::jsonb)
  || EXCLUDED.metadata;

 INSERT INTO facodi.external_sources
  (id,learning_object_id,source_type,external_id,source_url,title,metadata)
 SELECT md5('facodi:source:youtube:'||v.id)::uuid,
  md5('facodi:video:'||v.id)::uuid,'youtube',v.youtube_id,
  'https://www.youtube.com/watch?v='||v.youtube_id,v.title,
  jsonb_build_object('source_table','public.videos',
   'source_video_id',v.id,'approved_playlist_id',NEW.id)
 FROM facodi.playlist_items i JOIN public.videos v ON v.id=i.video_id
 WHERE i.playlist_id=NEW.id AND i.review_status='approved'
 ON CONFLICT(id) DO NOTHING;

 INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
 SELECT DISTINCT md5('facodi:video:'||v.id)::uuid,t.id
 FROM facodi.playlist_items i JOIN public.videos v ON v.id=i.video_id
 JOIN facodi.curricular_units u ON u.id=NEW.curricular_unit_id
 JOIN facodi.courses c ON c.id=u.course_id
 JOIN facodi.tags t ON t.slug IN ('uc-'||u.code,'curso-'||lower(c.code))
 WHERE i.playlist_id=NEW.id AND i.review_status='approved'
 ON CONFLICT DO NOTHING;

 RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS facodi_publish_approved_playlist ON facodi.playlists;
CREATE TRIGGER facodi_publish_approved_playlist
AFTER UPDATE OF status ON facodi.playlists
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status='approved')
EXECUTE FUNCTION facodi.publish_approved_playlist_content();

DROP POLICY IF EXISTS facodi_public_read_editor_approved_playlist_links
 ON facodi.learning_object_relations;
CREATE POLICY facodi_public_read_editor_approved_playlist_links
 ON facodi.learning_object_relations FOR SELECT TO anon,authenticated
 USING (
  relation_type='contains'
  AND metadata->>'review_status'='approved'
  AND metadata->>'review_scope'='playlist_item_editorial_approval'
  AND EXISTS (SELECT 1 FROM facodi.learning_objects p
   WHERE p.id=parent_object_id AND p.object_type='curricular_unit'
    AND p.published AND p.status='active')
  AND EXISTS (SELECT 1 FROM facodi.learning_objects c
   WHERE c.id=child_object_id AND c.object_type='video'
    AND c.published AND c.status='active')
 );
