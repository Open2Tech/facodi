
-- Search taxonomy for a single official UAlg degree; no duplicate course or videos.
INSERT INTO facodi.tags(id,slug,label,language,metadata)
VALUES (md5('facodi:tag:curso-lgest')::uuid,'curso-lgest',
        'Licenciatura em Gestão','pt',
        jsonb_build_object('source','FACODI','official_course_id','1418'))
ON CONFLICT(slug) DO NOTHING;
INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT lo.id,t.id FROM facodi.learning_objects lo
JOIN facodi.tags t ON t.slug IN ('curso-lgest','area-management')
WHERE lo.id=md5('facodi:ualg:1418:course_object')::uuid
ON CONFLICT DO NOTHING;
INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT u.learning_object_id,t.id FROM facodi.curricular_units u
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
JOIN facodi.tags t ON t.slug IN ('curso-lgest','area-management')
WHERE u.learning_object_id IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO facodi.learning_object_tags(learning_object_id,tag_id)
SELECT u.learning_object_id,t.id FROM facodi.curricular_units u
JOIN facodi.courses c ON c.id=u.course_id AND c.code='LGEST'
JOIN facodi.tags t ON t.slug=
 CASE
  WHEN u.title ILIKE 'Matemática%' OR u.title ILIKE 'Estatística%'
   THEN 'area-mathematics'
  WHEN u.title ILIKE '%Informática%' OR u.title ILIKE 'Sistemas de Informação%'
    OR u.title ILIKE 'Inteligência Artificial%'
   THEN 'area-computer-science'
  ELSE 'area-management' END
WHERE u.learning_object_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO facodi.keywords
 (id,learning_object_id,keyword,normalized_keyword,language,source,metadata)
VALUES (md5('facodi:gestao:keyword:course:1418')::uuid,
 md5('facodi:ualg:1418:course_object')::uuid,
 'Licenciatura em Gestão','licenciatura em gestão','pt',
 'official_programme_title',jsonb_build_object('official_course_id','1418'))
ON CONFLICT(learning_object_id,normalized_keyword,language) DO NOTHING;

DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_object_tags tag
 JOIN facodi.curricular_units u ON u.learning_object_id=tag.learning_object_id
 JOIN facodi.courses c ON c.id=u.course_id
 JOIN facodi.tags t ON t.id=tag.tag_id
 WHERE c.code='LGEST' AND t.slug='curso-lgest')<>41 THEN
  RAISE EXCEPTION 'Not all LGEST UCs are tagged';END IF;
END $$;
