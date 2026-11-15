
-- Read-only preview for editor-verified, FACODI-owned public video sequences.
CREATE OR REPLACE FUNCTION facodi.get_editorial_sequence_order_v1(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = facodi, pg_temp
AS $$
DECLARE
  v_pl facodi.learning_objects%ROWTYPE;
  v_items jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT facodi.is_facodi_editor() THEN
    RAISE EXCEPTION 'editor_only' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v_pl FROM facodi.learning_objects
  WHERE slug=p_slug AND object_type='playlist' AND published AND status='active'
    AND metadata->>'playlist_type'='facodi_owned_editorial_sequence'
    AND nullif(metadata->>'canonical_playlist_slug','') IS NULL;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'videoId',video.id,'title',video.title,'youtubeId',yt.youtube_video_id,
    'channel',yt.channel_title,'position',rel.position)
    ORDER BY rel.position,yt.youtube_video_id),'[]'::jsonb) INTO v_items
  FROM facodi.learning_object_relations rel
  JOIN facodi.learning_objects video ON video.id=rel.child_object_id
  JOIN facodi.youtube_videos yt ON yt.learning_object_id=video.id
  WHERE rel.parent_object_id=v_pl.id AND rel.relation_type='contains'
    AND rel.metadata->>'review_status'='approved'
    AND rel.metadata->>'review_scope'='title_and_channel_only'
    AND video.object_type='video' AND video.published AND video.status='active'
    AND yt.status='published';
  RETURN jsonb_build_object(
    'id',v_pl.id,'slug',v_pl.slug,'title',v_pl.title,
    'revision',coalesce((v_pl.metadata->>'editorial_order_revision')::integer,0),
    'items',v_items);
END; $$;

-- Atomic, optimistic and permission-checked reorder: no additions/removals,
-- no changes to videos, UC links or per-learner progress.
CREATE OR REPLACE FUNCTION facodi.reorder_editorial_sequence_v1(
  p_playlist_id uuid,
  p_expected_revision integer,
  p_expected_order uuid[],
  p_new_order uuid[])
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=facodi,pg_temp
AS $$
DECLARE
  v_pl facodi.learning_objects%ROWTYPE;
  v_revision integer;
  v_current uuid[];
  v_public_count integer;
  v_total_video_links integer;
  v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT facodi.is_facodi_editor() THEN
    RAISE EXCEPTION 'editor_only' USING ERRCODE='42501';
  END IF;
  IF p_expected_revision IS NULL OR p_expected_revision<0 OR
     p_expected_order IS NULL OR p_new_order IS NULL THEN
    RAISE EXCEPTION 'invalid_order' USING ERRCODE='22023';
  END IF;
  v_count:=cardinality(p_expected_order);
  IF v_count<2 OR v_count>200 OR cardinality(p_new_order)<>v_count OR
     array_position(p_new_order,NULL) IS NOT NULL OR
     array_position(p_expected_order,NULL) IS NOT NULL OR
     (SELECT count(DISTINCT x) FROM unnest(p_new_order) x)<>v_count OR
     (SELECT count(DISTINCT x) FROM unnest(p_expected_order) x)<>v_count THEN
    RAISE EXCEPTION 'invalid_permutation' USING ERRCODE='22023';
  END IF;

  -- All reorder RPC callers serialize on the playlist row.
  SELECT * INTO v_pl FROM facodi.learning_objects
  WHERE id=p_playlist_id AND object_type='playlist' AND published AND status='active'
    AND metadata->>'playlist_type'='facodi_owned_editorial_sequence'
    AND nullif(metadata->>'canonical_playlist_slug','') IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'sequence_not_editable' USING ERRCODE='22023';
  END IF;
  v_revision:=coalesce((v_pl.metadata->>'editorial_order_revision')::integer,0);
  IF v_revision<>p_expected_revision THEN
    RAISE EXCEPTION 'order_conflict' USING ERRCODE='40001';
  END IF;

  -- Lock existing children as well: only approved, public videos may move.
  PERFORM rel.id FROM facodi.learning_object_relations rel
  WHERE rel.parent_object_id=p_playlist_id AND rel.relation_type='contains' FOR UPDATE;

  SELECT array_agg(video.id ORDER BY rel.position,yt.youtube_video_id),count(*)::integer
  INTO v_current,v_public_count
  FROM facodi.learning_object_relations rel
  JOIN facodi.learning_objects video ON video.id=rel.child_object_id
  JOIN facodi.youtube_videos yt ON yt.learning_object_id=video.id
  WHERE rel.parent_object_id=p_playlist_id AND rel.relation_type='contains'
    AND rel.metadata->>'review_status'='approved'
    AND rel.metadata->>'review_scope'='title_and_channel_only'
    AND video.object_type='video' AND video.published AND video.status='active'
    AND yt.status='published';

  SELECT count(*)::integer INTO v_total_video_links
  FROM facodi.learning_object_relations rel JOIN facodi.learning_objects video
    ON video.id=rel.child_object_id
  WHERE rel.parent_object_id=p_playlist_id AND rel.relation_type='contains'
    AND video.object_type='video';

  IF v_total_video_links<>v_public_count OR v_public_count<>v_count THEN
    RAISE EXCEPTION 'sequence_membership_changed' USING ERRCODE='40001';
  END IF;
  IF v_current IS DISTINCT FROM p_expected_order THEN
    RAISE EXCEPTION 'order_conflict' USING ERRCODE='40001';
  END IF;
  IF (SELECT array_agg(x ORDER BY x) FROM unnest(p_new_order) x)
     IS DISTINCT FROM
     (SELECT array_agg(x ORDER BY x) FROM unnest(v_current) x) THEN
    RAISE EXCEPTION 'invalid_permutation' USING ERRCODE='22023';
  END IF;
  IF v_current=p_new_order THEN
    RETURN jsonb_build_object('changed',false,'revision',v_revision,'count',v_count);
  END IF;

  UPDATE facodi.learning_object_relations rel SET
    position=next.position::integer,
    metadata=coalesce(rel.metadata,'{}'::jsonb)||
      jsonb_build_object('last_editorial_reorder_at',now(),
                        'previous_editorial_order_position',rel.position)
  FROM unnest(p_new_order) WITH ORDINALITY next(video_id,position)
  WHERE rel.parent_object_id=p_playlist_id AND rel.relation_type='contains'
    AND rel.child_object_id=next.video_id AND rel.metadata->>'review_status'='approved'
    AND rel.metadata->>'review_scope'='title_and_channel_only';

  UPDATE facodi.learning_objects pl SET
    metadata=coalesce(pl.metadata,'{}'::jsonb)||
      jsonb_build_object('editorial_order_revision',v_revision+1,
       'editorial_order_updated_at',now(),
       'editorial_order_editor_id',auth.uid(),
       'video_count',v_count,'ordering_policy','editor_confirmed_custom_order')
  WHERE pl.id=p_playlist_id;

  RETURN jsonb_build_object('changed',true,'revision',v_revision+1,'count',v_count);
END; $$;

REVOKE ALL ON FUNCTION facodi.get_editorial_sequence_order_v1(text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION facodi.reorder_editorial_sequence_v1(uuid,integer,uuid[],uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION facodi.get_editorial_sequence_order_v1(text) TO authenticated;
GRANT EXECUTE ON FUNCTION facodi.reorder_editorial_sequence_v1(uuid,integer,uuid[],uuid[]) TO authenticated;
