
-- Exact four-video sequence consolidation: preserve public alias and all
-- incoming curriculum/module/course links. No learner progress for alias.
CREATE TEMP TABLE _pair ON COMMIT DROP AS
SELECT old.id alias_id,canonical.id canon_id,old.slug alias_slug,canonical.slug canon_slug
FROM facodi.learning_objects old,facodi.learning_objects canonical
WHERE old.slug='facodi-astro-sequence-astro-luz-ondas-observacao'
AND canonical.slug='facodi-science-fisica-ondas-optica-moderna';

DO $guard$ BEGIN
IF (SELECT count(*) FROM _pair)<>1
OR EXISTS(SELECT 1 FROM _pair p JOIN facodi.editorial_playlist_progress progress ON progress.playlist_id=p.alias_id)
OR EXISTS(SELECT 1 FROM _pair p JOIN facodi.learning_objects alias ON alias.id=p.alias_id
WHERE NOT alias.published OR alias.status<>'active' OR alias.metadata ? 'canonical_playlist_slug')
OR (SELECT count(*) FROM facodi.learning_object_relations r JOIN _pair p ON r.parent_object_id=p.alias_id AND r.relation_type='contains')<>4
OR (SELECT count(*) FROM facodi.learning_object_relations r JOIN _pair p ON r.child_object_id=p.alias_id AND r.relation_type='contains')<>4
OR (SELECT count(*) FROM facodi.learning_object_relations r JOIN _pair p ON r.parent_object_id=p.canon_id AND r.relation_type='contains')<>4
OR NOT EXISTS(
SELECT 1 FROM _pair p WHERE
(SELECT array_agg(r.child_object_id ORDER BY r.position) FROM facodi.learning_object_relations r WHERE r.parent_object_id=p.alias_id AND r.relation_type='contains')
=
(SELECT array_agg(r.child_object_id ORDER BY r.position) FROM facodi.learning_object_relations r WHERE r.parent_object_id=p.canon_id AND r.relation_type='contains'))
THEN RAISE EXCEPTION 'Expected identical four-video sequences with zero alias progress and four curricular relations';END IF;
END $guard$;

UPDATE facodi.learning_objects alias SET metadata=coalesce(alias.metadata,'{}'::jsonb)||
 jsonb_build_object('canonical_playlist_slug',p.canon_slug,
 'canonical_playlist_id',p.canon_id,
 'merge_kind','identical_video_sequence_without_distinct_materials',
 'merge_batch','facodi_physics_astronomy_exact_sequence_merge_20261115',
 'original_video_count',4,'video_count',0,
 'original_parent_links',(
 SELECT coalesce(jsonb_agg(jsonb_build_object(
 'parent_id',r.parent_object_id,'position',r.position,'metadata',r.metadata)
 ORDER BY r.position),'[]'::jsonb)
 FROM facodi.learning_object_relations r WHERE r.child_object_id=p.alias_id AND r.relation_type='contains'),
 'original_video_links',(
 SELECT coalesce(jsonb_agg(jsonb_build_object(
 'video_id',r.child_object_id,'position',r.position,'metadata',r.metadata)
 ORDER BY r.position),'[]'::jsonb)
 FROM facodi.learning_object_relations r WHERE r.parent_object_id=p.alias_id AND r.relation_type='contains'))
FROM _pair p WHERE alias.id=p.alias_id;

UPDATE facodi.learning_objects c SET metadata=coalesce(c.metadata,'{}'::jsonb)||
 jsonb_build_object(
  'merged_legacy_aliases',jsonb_build_array(p.alias_slug),
  'cross_course_reuse',true,'video_count',4,
  'merge_batch','facodi_physics_astronomy_exact_sequence_merge_20261115')
FROM _pair p WHERE c.id=p.canon_id;

-- Retain links from both institutions and modules in the canonical playlist.
INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:science-merge:'||r.parent_object_id::text||':'||p.canon_id::text)::uuid,
 r.parent_object_id,p.canon_id,'contains',r.position,'structured_catalog_import',
 coalesce(r.metadata,'{}'::jsonb)||jsonb_build_object(
 'review_status','approved','review_scope','title_and_channel_only',
 'merged_from_slug',p.alias_slug,
 'merge_batch','facodi_physics_astronomy_exact_sequence_merge_20261115')
FROM _pair p JOIN facodi.learning_object_relations r ON r.child_object_id=p.alias_id
WHERE r.relation_type='contains'
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Safely remove redundant associations AFTER provenance is stored on alias.
DELETE FROM facodi.learning_object_relations r USING _pair p
WHERE r.child_object_id=p.alias_id AND r.relation_type='contains';
DELETE FROM facodi.learning_object_relations r USING _pair p
WHERE r.parent_object_id=p.alias_id AND r.relation_type='contains';

-- Update existing SECURITY INVOKER RPCs, keeping their return signatures.
DO $rpc$ DECLARE fn text; expected text;replacement text; BEGIN
SELECT pg_get_functiondef('facodi.get_public_editorial_playlist_v2(text)'::regprocedure) INTO fn;
expected := $a$WHERE pl.slug=p_slug AND pl.object_type='playlist'$a$;
replacement := $b$WHERE pl.slug=coalesce((
 SELECT alias.metadata->>'canonical_playlist_slug'
 FROM facodi.learning_objects alias WHERE alias.slug=p_slug AND alias.object_type='playlist'
 AND alias.published AND alias.status='active'
 AND nullif(alias.metadata->>'canonical_playlist_slug','') IS NOT NULL
 LIMIT 1
),p_slug) AND pl.object_type='playlist'$b$;
IF position(expected in fn)=0 THEN RAISE EXCEPTION 'Playlist lookup function changed unexpectedly';END IF;
EXECUTE replace(fn,expected,replacement);

SELECT pg_get_functiondef('facodi.list_public_editorial_sequences_v1(text)'::regprocedure) INTO fn;
expected := $c$    and pl.metadata->>'playlist_type' = 'facodi_owned_editorial_sequence'
    and (p_unit_code$c$;
replacement := $d$    and pl.metadata->>'playlist_type' = 'facodi_owned_editorial_sequence'
    and nullif(pl.metadata->>'canonical_playlist_slug','') IS NULL
    and (p_unit_code$d$;
IF position(expected in fn)=0 THEN RAISE EXCEPTION 'Playlist listing function changed unexpectedly';END IF;
EXECUTE replace(fn,expected,replacement);
END $rpc$;

DO $verify$ BEGIN
IF EXISTS(SELECT 1 FROM _pair p JOIN facodi.learning_object_relations r
 ON r.parent_object_id=p.alias_id OR r.child_object_id=p.alias_id)
OR (SELECT count(*) FROM facodi.list_public_editorial_sequences_v1(NULL))<>102
OR NOT EXISTS(SELECT 1 FROM facodi.get_public_editorial_playlist_v2('facodi-astro-sequence-astro-luz-ondas-observacao')
WHERE playlist_slug='facodi-science-fisica-ondas-optica-moderna' AND item_count=4)
OR NOT EXISTS(SELECT 1 FROM facodi.list_public_editorial_sequences_v1('FACODI-GACS18-ASTRO05')
WHERE playlist_slug='facodi-science-fisica-ondas-optica-moderna')
OR NOT EXISTS(SELECT 1 FROM facodi.list_public_editorial_sequences_v1('19411004')
WHERE playlist_slug='facodi-science-fisica-ondas-optica-moderna')
THEN RAISE EXCEPTION 'Canonicalization validation failed';END IF;
END $verify$;
