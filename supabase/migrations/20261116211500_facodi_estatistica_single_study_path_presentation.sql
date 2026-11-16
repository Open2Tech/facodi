-- Curated presentation only: one learning journey, three sections, existing playlists and module.
-- Scope: IFES-CAR-ADM26-1-ESTATISTICA. No inserts/deletes of learning objects
-- or relations, and no changes to editorial playlist progress.
DO $$
DECLARE
  v_unit facodi.curricular_units%ROWTYPE;
  v_count integer;
  v_ids text[];
  v_config jsonb := '{"version":1,"sequence_slug":"facodi-playlist-ifes-adm26-estatistica-descritiva","guide_module_slug":"ifes-adm26-estudo-1-estatistica","sections":[{"id":"dados-graficos","labels":{"pt":"Coleta e visualização de dados","en":"Data collection and visualization","es":"Recogida y visualización de datos","fr":"Collecte et visualisation des données"},"youtube_ids":["XE4UHson59Y","tWcwNRBpViQ","SVH0EbN3QDE","34rK4b4Ixrw"]},{"id":"medidas-estimativas","labels":{"pt":"Medidas descritivas, amostragem e estimativas","en":"Descriptive measures, sampling and estimates","es":"Medidas descriptivas, muestreo y estimaciones","fr":"Statistiques descriptives, échantillonnage et estimations"},"youtube_ids":["x2IwKEB8pdQ","ToTN0oZaDcY","ld4vUbxn9Mc","HH81AoQVvsA","SB5i1cGaLFg","6by8etdzDAo","RSRGO8U6rSU","jwt7KCejF0M"]},{"id":"correlacao-regressao","labels":{"pt":"Correlação e regressão","en":"Correlation and regression","es":"Correlación y regresión","fr":"Corrélation et régression"},"youtube_ids":["5SIB_FjcsEo"]}],"supplementary_sequence_slugs":["facodi-playlist-ifes-adm26-ferramentas-dados","facodi-playlist-ifes-mesalva-estatistica"],"standalone_resource_slugs":["facodi-oito-canais-video-PaIzefYCwEc"]}'::jsonb;
BEGIN
  SELECT u.* INTO STRICT v_unit
  FROM facodi.curricular_units u
  JOIN facodi.courses c ON c.id = u.course_id
  WHERE c.code = 'IFES-CAR-ADM-INT-2026'
    AND u.code = 'IFESCAR-ADM26-1-ESTATISTICA'
    AND u.status = 'active'
    AND c.status = 'active' AND c.published = true;

  SELECT count(*), array_agg(y.youtube_video_id ORDER BY r.position)::text[]
    INTO v_count, v_ids
  FROM facodi.learning_object_relations ur
  JOIN facodi.learning_objects pl ON pl.id = ur.child_object_id
  JOIN facodi.learning_object_relations r ON r.parent_object_id = pl.id
  JOIN facodi.learning_objects video ON video.id = r.child_object_id
  JOIN facodi.youtube_videos y ON y.learning_object_id = video.id
  WHERE ur.parent_object_id = v_unit.learning_object_id
    AND ur.relation_type = 'contains'
    AND pl.object_type = 'playlist'
    AND pl.slug = 'facodi-playlist-ifes-adm26-estatistica-descritiva'
    AND pl.published = true AND pl.status = 'active'
    AND r.relation_type = 'contains'
    AND r.metadata->>'review_status' = 'approved'
    AND r.metadata->>'review_scope' = 'title_and_channel_only'
    AND video.published = true AND video.status = 'active'
    AND y.status = 'published';

  IF v_count <> 13 OR v_ids IS DISTINCT FROM ARRAY['XE4UHson59Y','tWcwNRBpViQ','SVH0EbN3QDE','34rK4b4Ixrw','x2IwKEB8pdQ','ToTN0oZaDcY','ld4vUbxn9Mc','HH81AoQVvsA','SB5i1cGaLFg','6by8etdzDAo','RSRGO8U6rSU','jwt7KCejF0M','5SIB_FjcsEo']::text[] THEN
    RAISE EXCEPTION 'Statistic sequence changed; editorial configuration aborted';
  END IF;
  IF (SELECT count(*) FROM facodi.learning_object_relations r
      JOIN facodi.learning_objects o ON o.id = r.child_object_id
      WHERE r.parent_object_id = v_unit.learning_object_id AND r.relation_type = 'contains'
        AND o.object_type = 'module' AND o.slug = 'ifes-adm26-estudo-1-estatistica'
        AND o.published AND o.status = 'active') <> 1 THEN
    RAISE EXCEPTION 'Expected public guide module is missing';
  END IF;
  IF (SELECT count(*) FROM facodi.learning_object_relations r
      JOIN facodi.learning_objects o ON o.id = r.child_object_id
      WHERE r.parent_object_id = v_unit.learning_object_id AND r.relation_type = 'contains'
        AND o.object_type = 'playlist' AND o.slug IN
          ('facodi-playlist-ifes-adm26-ferramentas-dados','facodi-playlist-ifes-mesalva-estatistica')
        AND o.published AND o.status = 'active') <> 2 THEN
    RAISE EXCEPTION 'Expected supplementary sequences are missing';
  END IF;
  IF (SELECT count(*) FROM facodi.learning_object_relations r
      JOIN facodi.learning_objects o ON o.id = r.child_object_id
      WHERE r.parent_object_id = v_unit.learning_object_id AND r.relation_type = 'contains'
        AND o.object_type = 'video' AND o.slug = 'facodi-oito-canais-video-PaIzefYCwEc'
        AND o.published AND o.status = 'active') <> 1 THEN
    RAISE EXCEPTION 'Expected standalone complementary resource is missing';
  END IF;

  IF v_unit.metadata ? 'facodi_study_path_v1'
     AND v_unit.metadata->'facodi_study_path_v1' IS DISTINCT FROM v_config THEN
    RAISE EXCEPTION 'Pre-existing different study path; do not overwrite without review';
  END IF;

  UPDATE facodi.curricular_units
  SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb),
                           '{facodi_study_path_v1}', v_config, true)
  WHERE id = v_unit.id;
END;
$$;
