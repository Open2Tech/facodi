
-- Curated related-module links, explicitly non-prerequisite and not accreditation.
CREATE TEMP TABLE _facodi_related_modules (src text,dst text,rationale text) ON COMMIT DROP;
INSERT INTO _facodi_related_modules SELECT j->>0,j->>1,j->>2
FROM jsonb_array_elements('[["algebra-vectors","physics-motion","Vetores e decomposição de grandezas físicas"],["algebra-vectors","analysis2-multi","Bases vetoriais e interpretação do gradiente"],["analysis1-calculus","physics-motion","Derivadas como taxas de variação da posição e da velocidade"],["physics-waves","astro-observation","Propagação e espectro da luz aplicados à observação astronómica"],["physics-thermal","chemistry-thermo","Energia, temperatura e comportamento dos gases"],["chemistry-bonds","biology-genetics","Fundamentos moleculares para estudar DNA e RNA"],["statistics-inference","biology-ecology","Inferência estatística aplicada à interpretação de dados ecológicos"],["statistics-basics","db-relational","Organização de dados e interpretação quantitativa"],["biology-genetics","astro-waves-life","Biologia e composição molecular como temas da astrobiologia"]]'::jsonb) j;
DO $check$ BEGIN
 IF (SELECT count(*) FROM _facodi_related_modules)<>9
 OR EXISTS(SELECT 1 FROM _facodi_related_modules GROUP BY src,dst HAVING count(*)>1)
 OR EXISTS(
  SELECT 1 FROM _facodi_related_modules m
  LEFT JOIN facodi.learning_objects src ON src.slug='facodi-modulo-20261115-'||m.src
  LEFT JOIN facodi.learning_objects dst ON dst.slug='facodi-modulo-20261115-'||m.dst
  WHERE src.id IS NULL OR dst.id IS NULL OR src.id=dst.id
    OR src.object_type<>'module' OR dst.object_type<>'module'
    OR NOT src.published OR NOT dst.published)
 THEN RAISE EXCEPTION 'Related-module manifest invalid'; END IF;
END $check$;

INSERT INTO facodi.learning_object_relations
(id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:related-modules:20261115:'||m.src||':'||m.dst)::uuid,
 src.id,dst.id,'correlates_with',1,
 'editorial_module_graph_20261115',
 jsonb_build_object('review_status','approved','review_scope','module_cross_discipline_curation',
 'rationale',m.rationale,'is_prerequisite',false,'teacher_approved',false,
 'curation_batch','facodi_interdisciplinary_module_graph_20261115')
FROM _facodi_related_modules m
JOIN facodi.learning_objects src ON src.slug='facodi-modulo-20261115-'||m.src
JOIN facodi.learning_objects dst ON dst.slug='facodi-modulo-20261115-'||m.dst
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

-- Narrow public visibility to reviewed module-to-module semantic links only.
CREATE POLICY facodi_public_read_curated_module_correlations
ON facodi.learning_object_relations FOR SELECT TO anon,authenticated USING (
 relation_type='correlates_with'
 AND created_by_mechanism='editorial_module_graph_20261115'
 AND metadata->>'review_status'='approved'
 AND metadata->>'review_scope'='module_cross_discipline_curation'
 AND EXISTS(SELECT 1 FROM facodi.learning_objects src
  WHERE src.id=parent_object_id AND src.object_type='module'
    AND src.status='active' AND src.published)
 AND EXISTS(SELECT 1 FROM facodi.learning_objects dst
  WHERE dst.id=child_object_id AND dst.object_type='module'
    AND dst.status='active' AND dst.published)
);

DO $verify$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_object_relations r
 WHERE r.relation_type='correlates_with' AND r.created_by_mechanism='editorial_module_graph_20261115')<>9
 THEN RAISE EXCEPTION 'Related-module graph missing expected links'; END IF;
END $verify$;
