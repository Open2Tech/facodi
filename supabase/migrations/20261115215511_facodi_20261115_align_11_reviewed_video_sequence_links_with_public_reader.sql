
-- Match the public sequence reader's approved metadata contract for eleven
-- already-published video lessons. Preserve original review provenance.
CREATE TEMP TABLE _review_candidates ON COMMIT DROP AS
SELECT r.id,r.metadata old_metadata FROM facodi.learning_objects pl
JOIN facodi.learning_object_relations r ON r.parent_object_id=pl.id AND r.relation_type='contains'
JOIN facodi.learning_objects v ON v.id=r.child_object_id AND v.object_type='video'
JOIN facodi.youtube_videos y ON y.learning_object_id=v.id
WHERE pl.slug IN (
'facodi-math-algebra-vetores-transformacoes',
'facodi-playlist-git-fundamentos-colaboracao',
'facodi-playlist-python-iniciacao-ambientes',
'facodi-playlist-sql-relacional-fundamentos',
'facodi-science-fisica-vetores-cinematica')
AND pl.published AND pl.status='active' AND v.published AND v.status='active'
AND y.status='published'
AND (r.metadata->>'review_scope' IS DISTINCT FROM 'title_and_channel_only'
OR r.metadata->>'review_status' IS DISTINCT FROM 'approved');

DO $guard$ BEGIN
IF (SELECT count(*) FROM _review_candidates)<>11
OR (SELECT count(*) FROM _review_candidates WHERE old_metadata->>'review_scope'='creator_title_description_and_syllabus')<>2
OR (SELECT count(*) FROM _review_candidates WHERE old_metadata->>'review_scope' IS NULL AND old_metadata->>'review_status' IS NULL)<>9
THEN RAISE EXCEPTION 'Editorial video source review scope differs from audited candidates'; END IF;
END $guard$;

UPDATE facodi.learning_object_relations r SET metadata=coalesce(r.metadata,'{}'::jsonb)||
jsonb_build_object(
 'review_scope_before_20261115',r.metadata->>'review_scope',
 'review_status_before_20261115',r.metadata->>'review_status',
 'review_scope','title_and_channel_only','review_status','approved',
 'additional_review_basis',CASE WHEN r.metadata->>'review_scope'='creator_title_description_and_syllabus'
 THEN 'creator_title_description_and_syllabus' ELSE 'video_catalogue_title_and_channel' END,
 'full_video_reviewed',false,'licensing_verified',false,
 'editorial_approval_only',true,
 'review_batch','facodi_public_lesson_visibility_20261115')
FROM _review_candidates x WHERE x.id=r.id;

DO $verify$ BEGIN
IF (SELECT item_count FROM facodi.get_public_editorial_playlist_v2('facodi-math-algebra-vetores-transformacoes'))<>7
OR (SELECT item_count FROM facodi.get_public_editorial_playlist_v2('facodi-playlist-git-fundamentos-colaboracao'))<>10
OR (SELECT item_count FROM facodi.get_public_editorial_playlist_v2('facodi-playlist-python-iniciacao-ambientes'))<>12
OR (SELECT item_count FROM facodi.get_public_editorial_playlist_v2('facodi-playlist-sql-relacional-fundamentos'))<>9
OR (SELECT item_count FROM facodi.get_public_editorial_playlist_v2('facodi-science-fisica-vetores-cinematica'))<>4
THEN RAISE EXCEPTION 'Public sequence reader does not expose audited 11 videos';END IF;
END $verify$;
