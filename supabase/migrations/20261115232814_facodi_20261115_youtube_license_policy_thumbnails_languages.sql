
-- YouTube publicly accessible does not mean content is CC-licensed or rehostable.
-- Preserve existing individual license evidence, link with the official player only.
CREATE TEMP TABLE _quality_yt ON COMMIT DROP AS
SELECT y.id yt_id,y.learning_object_id lo_id,y.youtube_video_id vid,
y.thumbnails->'default'->>'url' thumb,
y.language old_lang,
CASE
WHEN y.language='und' AND y.channel_title IN (
'Professor Aquino - Matemática','Educacional THM','Professor Douglas Maioli',
'Dani Porto','Prof. MURAKAMI - MATEMÁTICA RAPIDOLA','Matemateca - Ester Velasquez',
'Otávio Miranda','Douglas Lockshield','Cartes Consultoria & Treinamento') THEN 'pt'
WHEN y.language='und' AND y.channel_title='Odoo'
 AND y.title ~* '^(Manage|Log|Create|Add|Appraisal|Expense|Attend|Recruit|Time Off|Employee|Employees|Fleet|Payroll|Salary|Payslip|Work|Inventory|Presence)' THEN 'en'
WHEN y.language='und' AND y.channel_title='Airoflare'
 AND y.title ~* '^(Automatic|Migrate)' THEN 'en'
END inferred_language
FROM facodi.youtube_videos y;

DO $guard$ BEGIN
IF (SELECT count(*) FROM _quality_yt)<>940
OR (SELECT count(*) FROM _quality_yt WHERE thumb IS NULL)<>155
OR (SELECT count(*) FROM _quality_yt WHERE inferred_language IS NOT NULL)<>87
OR EXISTS(SELECT 1 FROM _quality_yt WHERE vid !~ '^[A-Za-z0-9_-]{11}$')
THEN RAISE EXCEPTION 'Expected audited source inventory changed';END IF;
END $guard$;

UPDATE facodi.youtube_videos y SET
thumbnails=CASE WHEN q.thumb IS NULL THEN jsonb_set(coalesce(y.thumbnails,'{}'::jsonb),
 '{default}',jsonb_build_object('url','https://i.ytimg.com/vi/'||q.vid||'/hqdefault.jpg'),true)
 ELSE y.thumbnails END,
language=coalesce(q.inferred_language,y.language),
metadata=coalesce(y.metadata,'{}'::jsonb)||
jsonb_build_object(
 'youtube_platform_policy',jsonb_build_object(
 'default_upload_license','standard_youtube_license',
 'individual_video_license','not_verified',
 'permitted_usage','youtube_watch_link_or_official_embed_when_enabled',
 'embed_enabled_per_video','not_checked',
 'license_for_rehosting_or_redistribution','not_established',
 'source','https://support.google.com/youtube/answer/2797468',
 'terms','https://www.youtube.com/t/terms'),
 'metadata_quality_batch','facodi_20261115_youtube_policy_quality')
||CASE WHEN q.thumb IS NULL THEN jsonb_build_object(
 'thumbnail_origin','youtube_standard_thumbnail_pattern_unverified') ELSE '{}'::jsonb END
||CASE WHEN q.inferred_language IS NOT NULL THEN jsonb_build_object(
 'language_inference','channel_and_title_unverified_by_youtube',
 'language_previous_value',q.old_lang) ELSE '{}'::jsonb END
FROM _quality_yt q WHERE y.id=q.yt_id;

UPDATE facodi.learning_objects lo SET
language=CASE WHEN lo.language='und' AND q.inferred_language IS NOT NULL
 THEN q.inferred_language ELSE lo.language END,
source_url=CASE WHEN nullif(btrim(lo.source_url),'') IS NULL
 THEN 'https://www.youtube.com/watch?v='||q.vid ELSE lo.source_url END,
metadata=coalesce(lo.metadata,'{}'::jsonb)||
jsonb_build_object(
'youtube_video_id',q.vid,
'youtube_platform_default_license','standard_youtube_license',
'per_video_license_verified',false,
'facodi_allowed_usage_policy','youtube_link_or_official_embed_if_available',
'ownership_retained_by_original_creator',true,
'facodi_rehosting_rights','not_assumed',
'license_policy_reference','https://support.google.com/youtube/answer/2797468',
'metadata_quality_batch','facodi_20261115_youtube_policy_quality')
||CASE WHEN lo.metadata->>'content_license_verified' IS NULL
 THEN jsonb_build_object('content_license_verified',false) ELSE '{}'::jsonb END
||CASE WHEN lo.metadata->>'channel_name' IS NULL
 THEN jsonb_build_object('channel_name',y.channel_title,
 'channel_name_source','facodi.youtube_videos') ELSE '{}'::jsonb END
||CASE WHEN lo.language='und' AND q.inferred_language IS NOT NULL
 THEN jsonb_build_object('language_inference','channel_and_title_unverified_by_youtube')
 ELSE '{}'::jsonb END
FROM _quality_yt q JOIN facodi.youtube_videos y ON y.id=q.yt_id
WHERE lo.id=q.lo_id AND lo.object_type='video';

DO $verify$ BEGIN
IF EXISTS(SELECT 1 FROM _quality_yt q JOIN facodi.youtube_videos y ON y.id=q.yt_id
WHERE y.thumbnails->'default'->>'url' IS NULL
 OR y.metadata->'youtube_platform_policy'->>'individual_video_license' IS DISTINCT FROM 'not_verified')
OR (SELECT count(*) FROM facodi.youtube_videos WHERE language='und')<>5
THEN RAISE EXCEPTION 'YouTube derived fields invalid'; END IF;
END $verify$;
