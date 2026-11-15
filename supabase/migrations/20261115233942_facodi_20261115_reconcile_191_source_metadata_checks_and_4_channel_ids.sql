
-- Only records verified earlier by watch-page OpenGraph or publisher indexes.
-- No guessed video duration, publish date, license, or embeddability.
CREATE TEMP TABLE _checks_verified ON COMMIT DROP AS
SELECT DISTINCT ON(c.youtube_video_id)
 c.id check_id,c.youtube_video_id,c.checked_at,c.method,c.verification_result,
 c.observed_title,c.observed_thumbnail_url,c.source_url
FROM facodi.youtube_video_metadata_checks c
WHERE c.verification_result='metadata_found'
  AND c.method IN ('youtube_watch_page_opengraph','publisher_index')
ORDER BY c.youtube_video_id,c.checked_at DESC,c.id DESC;

CREATE TEMP TABLE _channel_candidates ON COMMIT DROP AS
SELECT y.id video_row_id,min(ch.youtube_channel_id) channel_id,
 count(distinct ch.youtube_channel_id) matches
FROM facodi.youtube_videos y
JOIN facodi.youtube_channels ch ON lower(btrim(y.channel_title))=lower(btrim(ch.title))
WHERE y.channel_id IS NULL AND ch.youtube_channel_id IS NOT NULL
GROUP BY y.id;

DO $guard$ BEGIN
IF (SELECT count(*) FROM _checks_verified)<>191
 OR (SELECT count(*) FROM _checks_verified WHERE method='youtube_watch_page_opengraph')<>187
 OR (SELECT count(*) FROM _checks_verified WHERE method='publisher_index')<>4
 OR EXISTS(SELECT 1 FROM _checks_verified c LEFT JOIN facodi.youtube_videos y
 ON y.youtube_video_id=c.youtube_video_id WHERE y.id IS NULL
 OR y.title IS DISTINCT FROM c.observed_title)
 OR (SELECT count(*) FROM _channel_candidates WHERE matches=1)<>4
 OR EXISTS(SELECT 1 FROM _channel_candidates WHERE matches>1)
THEN RAISE EXCEPTION 'Verified source checks or channel matches changed';END IF;
END $guard$;

UPDATE facodi.youtube_videos y SET
metadata=coalesce(y.metadata,'{}'::jsonb)||
jsonb_build_object(
 'source_metadata_check',jsonb_build_object(
   'check_id',v.check_id,
   'method',v.method,
   'observed_title',v.observed_title,
   'observed_thumbnail_url',v.observed_thumbnail_url,
   'checked_at',v.checked_at,
   'verification_scope','title_and_thumbnail_only',
   'verified_publisher_license',false,
   'youtube_data_api_response',false),
 'metadata_verification_reconciled_at','2026-11-15')
FROM _checks_verified v WHERE y.youtube_video_id=v.youtube_video_id;

UPDATE facodi.learning_objects lo SET
metadata=coalesce(lo.metadata,'{}'::jsonb)||
jsonb_build_object(
 'source_title_thumbnail_verification',jsonb_build_object(
 'verified_source_check_id',v.check_id,
 'method',v.method,
 'checked_at',v.checked_at,
 'scope','watch_page_og_or_publisher_index_title_thumbnail_only',
 'license_and_embed_not_checked',true),
 'metadata_verification_reconciled_at','2026-11-15')
FROM _checks_verified v
JOIN facodi.youtube_videos y ON y.youtube_video_id=v.youtube_video_id
WHERE lo.id=y.learning_object_id;

UPDATE facodi.youtube_videos y SET
 channel_id=q.channel_id,
 metadata=coalesce(y.metadata,'{}'::jsonb)||
 jsonb_build_object('channel_id_origin','existing_verified_facodi.youtube_channels_exact_title',
 'channel_id_reconciled_at','2026-11-15')
FROM _channel_candidates q WHERE y.id=q.video_row_id AND q.matches=1
AND y.channel_id IS NULL;

DO $verify$ BEGIN
IF (SELECT count(*) FROM facodi.youtube_videos y
 WHERE y.metadata->'source_metadata_check'->>'verification_scope'='title_and_thumbnail_only')<191
 OR (SELECT count(*) FROM facodi.youtube_videos
 WHERE metadata->>'channel_id_reconciled_at'='2026-11-15')<>4
 OR (SELECT count(*) FROM facodi.youtube_videos WHERE metadata->'youtube_platform_policy'->>'individual_video_license'='not_verified')<>940
THEN RAISE EXCEPTION 'Metadata source or policy reconciliation failed';END IF;
END $verify$;
