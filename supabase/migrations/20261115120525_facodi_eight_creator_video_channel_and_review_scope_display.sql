
-- Populate only missing UI-facing provenance for this specific eight-channel import.
-- Never overwrite channel names already reviewed by an editor.
WITH video_sources AS (
  SELECT o.id AS object_id, NULLIF(btrim(y.channel_title), '') AS verified_channel
  FROM facodi.learning_objects o
  JOIN facodi.youtube_videos y ON y.learning_object_id=o.id
  WHERE o.object_type='video'
    AND o.metadata->>'curation_batch'='facodi_eight_creator_channels_20261115'
    AND o.published AND o.status='active'
    AND NULLIF(btrim(y.channel_title),'') IS NOT NULL
)
UPDATE facodi.learning_objects o
SET metadata = o.metadata || jsonb_build_object(
  'channel_name', COALESCE(NULLIF(btrim(o.metadata->>'channel_name'),''),s.verified_channel),
  'review_scope', COALESCE(NULLIF(btrim(o.metadata->>'review_scope'),''),'title_and_channel_only')
)
FROM video_sources s
WHERE o.id=s.object_id
  AND (NULLIF(btrim(o.metadata->>'channel_name'),'') IS NULL
       OR NULLIF(btrim(o.metadata->>'review_scope'),'') IS NULL);

DO $verify$ BEGIN
IF (SELECT count(*) FROM facodi.learning_objects o
 WHERE o.object_type='video'
   AND o.metadata->>'curation_batch'='facodi_eight_creator_channels_20261115'
   AND o.metadata->>'channel_name' IS NOT NULL
   AND o.metadata->>'review_scope'='title_and_channel_only') <> 59
THEN RAISE EXCEPTION 'Expected all 59 new videos to show original channel and selection scope'; END IF;
END $verify$;
