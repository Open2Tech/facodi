
-- Existing standalone YouTube-link submissions: metadata only.
-- Do not change status, create canonical video records, infer permission,
-- or alter author-submitted license assertions.
CREATE TEMP TABLE _standalone ON COMMIT DROP AS
SELECT lo.id,lo.published,lo.status,lo.metadata,lo.title,lo.source_url
FROM facodi.learning_objects lo
LEFT JOIN facodi.youtube_videos y ON y.learning_object_id=lo.id
WHERE lo.object_type='video' AND y.id IS NULL
AND lo.metadata->>'publication_type'='external_reference_link_only';

DO $guard$ BEGIN
IF (SELECT count(*) FROM _standalone)<>2
OR (SELECT count(*) FROM _standalone WHERE published AND status='active')<>1
OR (SELECT count(*) FROM _standalone WHERE NOT published AND status='draft')<>1
OR EXISTS(SELECT 1 FROM _standalone WHERE
  source_url !~ '^https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]{11}$'
  OR metadata->>'license_declared_by_submitter'<>'true')
THEN RAISE EXCEPTION 'Expected two unchanged YouTube-link submissions';END IF;
END $guard$;

UPDATE facodi.learning_objects lo SET
  keywords=CASE WHEN cardinality(lo.keywords)=0
  THEN ARRAY[lo.title,coalesce(nullif(lo.metadata->>'channel_name',''),'YouTube')]
  ELSE lo.keywords END,
  tags=CASE WHEN cardinality(lo.tags)=0 THEN ARRAY['youtube','recurso-externo']
  ELSE lo.tags END,
  description=CASE WHEN nullif(btrim(lo.description),'') IS NULL
    THEN 'Referência externa para vídeo publicado no YouTube pelo canal '||
      coalesce(nullif(lo.metadata->>'channel_name',''),'original')||
      '. Sem descrição original importada; consultar a fonte para informação do autor.'
    ELSE lo.description END,
  metadata=coalesce(lo.metadata,'{}'::jsonb)||
  jsonb_build_object(
    'youtube_platform_default_license','standard_youtube_license',
    'individual_video_license','not_checked',
    'facodi_allowed_usage_policy','youtube_watch_link_or_official_embed_if_enabled',
    'facodi_rehosting_rights','not_assumed',
    'platform_license_reference','https://support.google.com/youtube/answer/2797468',
    'educational_metadata_quality_batch','facodi_20261115_standalone_youtube_links')
FROM _standalone s WHERE lo.id=s.id;

DO $verify$ BEGIN
IF EXISTS(SELECT 1 FROM _standalone s JOIN facodi.learning_objects lo ON lo.id=s.id
 WHERE lo.published IS DISTINCT FROM s.published OR lo.status<>s.status
 OR lo.metadata->>'license_declared_by_submitter' IS DISTINCT FROM s.metadata->>'license_declared_by_submitter'
 OR cardinality(lo.keywords)=0 OR cardinality(lo.tags)=0 OR lo.description IS NULL)
THEN RAISE EXCEPTION 'Standalone link state or source metadata changed';END IF;
END $verify$;
