-- Presentation-only composition of existing sequences for three Management curricular units.
-- Zero new objects or relations; preserves video/playlist order, progress, RLS and public URLs.
-- The existing Management Statistics I 25-video sequence has learner progress and remains a supplementary route.
DO $$
DECLARE
  v_entry jsonb;
  v_cfg jsonb;
  v_unit facodi.curricular_units%ROWTYPE;
  v_expected text[];
  v_public text[];
  v_linked text[];
  v_modules text[];
  v_requested_modules text[];
BEGIN
  FOR v_entry IN SELECT value FROM jsonb_array_elements('[{"course_code":"LGEST","unit_code":"14181187","config":{"version":2,"sections":[{"id":"dados-medidas","labels":{"pt":"Dados, gráficos e estatística descritiva","en":"Data, charts and descriptive statistics","es":"Datos, gráficos y estadística descriptiva","fr":"Données, graphiques et statistique descriptive"},"sequence_slugs":["facodi-math-estatistica-descritiva"]},{"id":"eventos-bayes","labels":{"pt":"Probabilidades, eventos e teorema de Bayes","en":"Probability, events and Bayes’ theorem","es":"Probabilidades, eventos y teorema de Bayes","fr":"Probabilités, événements et théorème de Bayes"},"sequence_slugs":["facodi-math-probabilidade-bayes"]},{"id":"distribuicoes","labels":{"pt":"Variáveis aleatórias e distribuições","en":"Random variables and distributions","es":"Variables aleatorias y distribuciones","fr":"Variables aléatoires et distributions"},"sequence_slugs":["facodi-math-probabilidade-distribuicoes"]}],"supplementary_sequence_slugs":["facodi-gestao-sequencia-estatistica-i"],"guide_module_slugs":[]}},{"course_code":"LGEST","unit_code":"14181191","config":{"version":2,"sections":[{"id":"inferencia","labels":{"pt":"Inferência estatística e intervalos de confiança","en":"Statistical inference and confidence intervals","es":"Inferencia estadística e intervalos de confianza","fr":"Inférence statistique et intervalles de confiance"},"sequence_slugs":["facodi-math-estatistica-intervalos"]},{"id":"testes","labels":{"pt":"Testes de hipóteses","en":"Hypothesis testing","es":"Pruebas de hipótesis","fr":"Tests d’hypothèses"},"sequence_slugs":["facodi-math-estatistica-testes"]},{"id":"modelos","labels":{"pt":"Regressão, correlação e ANOVA","en":"Regression, correlation and ANOVA","es":"Regresión, correlación y ANOVA","fr":"Régression, corrélation et ANOVA"},"sequence_slugs":["facodi-math-estatistica-regressao","facodi-math-estatistica-anova"]}],"supplementary_sequence_slugs":["facodi-math-probabilidade-distribuicoes","facodi-gestao-sequencia-estatistica-ii"],"guide_module_slugs":[]}},{"course_code":"LGEST","unit_code":"14181094","config":{"version":2,"sections":[{"id":"pessoas-recrutamento","labels":{"pt":"Cadastro, competências e recrutamento","en":"Employee records, skills and recruitment","es":"Empleados, competencias y contratación","fr":"Dossiers du personnel, compétences et recrutement"},"sequence_slugs":["facodi-playlist-rh-cadastro-erp","facodi-playlist-rh-recrutamento-erp"]},{"id":"tempo-desempenho","labels":{"pt":"Assiduidade, férias e avaliação de desempenho","en":"Attendance, leave and performance reviews","es":"Asistencia, vacaciones y evaluación del desempeño","fr":"Présences, congés et évaluation des performances"},"sequence_slugs":["facodi-playlist-rh-assiduidade-erp","facodi-playlist-rh-desempenho-erp"]},{"id":"contratos-remuneracoes","labels":{"pt":"Contratos e remunerações","en":"Contracts and compensation","es":"Contratos y remuneraciones","fr":"Contrats et rémunérations"},"sequence_slugs":["facodi-playlist-rh-remuneracoes-erp"]}],"supplementary_sequence_slugs":["facodi-odoo19-rh-colaboradores","facodi-odoo19-rh-recrutamento","facodi-odoo19-rh-tempo","facodi-odoo19-rh-desempenho","facodi-odoo19-rh-remuneracao","facodi-odoo19-rh-indicacoes"],"guide_module_slugs":["facodi-modulo-odoo19-rh-selecao","facodi-modulo-odoo19-rh-tempo"]}}]'::jsonb) LOOP
    v_cfg := v_entry->'config';
    SELECT u.* INTO STRICT v_unit
    FROM facodi.curricular_units u
    JOIN facodi.courses c ON c.id=u.course_id
    WHERE u.code=v_entry->>'unit_code' AND c.code=v_entry->>'course_code'
      AND u.status='active' AND u.published AND c.status='active' AND c.published;

    IF v_unit.metadata ? 'facodi_study_path_v1' THEN
      RAISE EXCEPTION 'Existing legacy study path must be reviewed for %', v_unit.code;
    END IF;
    IF v_cfg->>'version' <> '2' OR jsonb_array_length(v_cfg->'sections') <> 3 THEN
      RAISE EXCEPTION 'Unexpected Gestão path structure for %', v_unit.code;
    END IF;

    SELECT array_agg(slug ORDER BY slug) INTO v_expected FROM (
      SELECT jsonb_array_elements_text(section.value->'sequence_slugs') AS slug
      FROM jsonb_array_elements(v_cfg->'sections') section
      UNION ALL
      SELECT jsonb_array_elements_text(v_cfg->'supplementary_sequence_slugs')
    ) x;

    IF v_expected IS NULL OR cardinality(v_expected) <> (
      SELECT count(DISTINCT slug) FROM unnest(v_expected) slug
    ) THEN
      RAISE EXCEPTION 'Duplicate or missing curated playlist for %', v_unit.code;
    END IF;

    SELECT array_agg(playlist_slug ORDER BY playlist_slug) INTO v_public
      FROM facodi.list_public_editorial_sequences_v1(v_unit.code);

    SELECT array_agg(p.slug ORDER BY p.slug) INTO v_linked
      FROM facodi.learning_object_relations r
      JOIN facodi.learning_objects p ON p.id=r.child_object_id
      WHERE r.parent_object_id=v_unit.learning_object_id AND r.relation_type='contains'
        AND p.object_type='playlist' AND p.published AND p.status='active';

    IF v_expected IS DISTINCT FROM v_public OR v_expected IS DISTINCT FROM v_linked THEN
      RAISE EXCEPTION 'Playlist content or public visibility drift for %', v_unit.code;
    END IF;

    SELECT array_agg(m.slug ORDER BY m.slug) INTO v_modules
      FROM facodi.learning_object_relations r
      JOIN facodi.learning_objects m ON m.id=r.child_object_id
      WHERE r.parent_object_id=v_unit.learning_object_id AND r.relation_type='contains'
        AND m.object_type='module' AND m.published AND m.status='active';
    SELECT array_agg(slug ORDER BY slug) INTO v_requested_modules
      FROM jsonb_array_elements_text(v_cfg->'guide_module_slugs') slug;
    IF coalesce(v_modules,'{}'::text[]) IS DISTINCT FROM coalesce(v_requested_modules,'{}'::text[]) THEN
      RAISE EXCEPTION 'Guide module drift for %', v_unit.code;
    END IF;

    IF v_unit.metadata ? 'facodi_study_path_v2'
       AND v_unit.metadata->'facodi_study_path_v2' IS DISTINCT FROM v_cfg THEN
      RAISE EXCEPTION 'Existing custom composition for %; refuse to overwrite', v_unit.code;
    END IF;

    UPDATE facodi.curricular_units
      SET metadata=jsonb_set(coalesce(metadata,'{}'::jsonb),'{facodi_study_path_v2}',v_cfg,true)
      WHERE id=v_unit.id AND v_unit.metadata->'facodi_study_path_v2' IS DISTINCT FROM v_cfg;
  END LOOP;
END;
$$;
