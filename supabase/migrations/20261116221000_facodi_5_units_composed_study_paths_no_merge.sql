-- Presentation-only composition of existing sequences for five curricular units.
-- Zero new objects or relations; never modifies video/playlist order, progress, RLS or public URLs.
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
  FOR v_entry IN SELECT value FROM jsonb_array_elements('[{"course_code":"LESTI","unit_code":"19411001","config":{"version":2,"sections":[{"id":"git","labels":{"pt":"Git e colaboração","en":"Git and collaboration","es":"Git y colaboración","fr":"Git et collaboration"},"sequence_slugs":["facodi-playlist-git-fundamentos-colaboracao"]},{"id":"ambientes","labels":{"pt":"Ambientes e dependências","en":"Development environments","es":"Entornos y dependencias","fr":"Environnements et dépendances"},"sequence_slugs":["facodi-playlist-python-moderno-ambientes-e-dependencias","facodi-tecnologia-dev-containers"]},{"id":"qualidade","labels":{"pt":"Testes e integração contínua","en":"Testing and continuous integration","es":"Pruebas e integración continua","fr":"Tests et intégration continue"},"sequence_slugs":["facodi-playlist-qualidade-testes-software","facodi-playlist-ci-cd-ambientes-colaborativos"]},{"id":"operacao","labels":{"pt":"Operação, observabilidade e deploy","en":"Operations and deployment","es":"Operaciones y despliegue","fr":"Exploitation et déploiement"},"sequence_slugs":["facodi-playlist-devops-python-colaborativo","facodi-tecnologia-cloud-ambientes"]}],"supplementary_sequence_slugs":[],"guide_module_slugs":["facodi-modulo-ambientes-reprodutiveis","facodi-modulo-20261115-collab-git","facodi-modulo-20261115-collab-cicd"]}},{"course_code":"CTESP-STI","unit_code":"18121017","config":{"version":2,"sections":[{"id":"git","labels":{"pt":"Git e colaboração","en":"Git and collaboration","es":"Git y colaboración","fr":"Git et collaboration"},"sequence_slugs":["facodi-playlist-git-fundamentos-colaboracao"]},{"id":"ambientes","labels":{"pt":"Ambientes e dependências","en":"Development environments","es":"Entornos y dependencias","fr":"Environnements et dépendances"},"sequence_slugs":["facodi-playlist-python-moderno-ambientes-e-dependencias","facodi-tecnologia-dev-containers"]},{"id":"qualidade","labels":{"pt":"Testes e integração contínua","en":"Testing and continuous integration","es":"Pruebas e integración continua","fr":"Tests et intégration continue"},"sequence_slugs":["facodi-playlist-qualidade-testes-software","facodi-playlist-ci-cd-ambientes-colaborativos"]},{"id":"operacao","labels":{"pt":"Operação, observabilidade e deploy","en":"Operations and deployment","es":"Operaciones y despliegue","fr":"Exploitation et déploiement"},"sequence_slugs":["facodi-playlist-devops-python-colaborativo","facodi-tecnologia-cloud-ambientes"]}],"supplementary_sequence_slugs":[],"guide_module_slugs":["facodi-modulo-ambientes-reprodutiveis","facodi-modulo-20261115-collab-git","facodi-modulo-20261115-collab-cicd"]}},{"course_code":"LESTI","unit_code":"19411002","config":{"version":2,"sections":[{"id":"funcoes-limites","labels":{"pt":"Funções e limites","en":"Functions and limits","es":"Funciones y límites","fr":"Fonctions et limites"},"sequence_slugs":["facodi-math-funcoes-graficos","facodi-math-limites-continuidade"]},{"id":"derivadas","labels":{"pt":"Derivadas e aplicações","en":"Derivatives and applications","es":"Derivadas y aplicaciones","fr":"Dérivées et applications"},"sequence_slugs":["facodi-math-derivadas-regras"]},{"id":"integracao","labels":{"pt":"Primitivas e integração","en":"Antiderivatives and integration","es":"Primitivas e integración","fr":"Primitives et intégration"},"sequence_slugs":["facodi-math-integracao-tecnicas"]}],"supplementary_sequence_slugs":["facodi-playlist-calculo-limites-derivadas","facodi-math-integracao-geometrica","facodi-math-otimizacao-economia","facodi-math-exponenciais-logaritmos"],"guide_module_slugs":["facodi-modulo-20261115-analysis1-functions","facodi-modulo-20261115-analysis1-calculus"]}},{"course_code":"LESTI","unit_code":"19411008","config":{"version":2,"sections":[{"id":"varias-variaveis","labels":{"pt":"Funções de várias variáveis","en":"Multivariable functions","es":"Funciones de varias variables","fr":"Fonctions de plusieurs variables"},"sequence_slugs":["facodi-math-multivariaveis-introducao"]},{"id":"derivadas-parciais","labels":{"pt":"Derivadas parciais e gradiente","en":"Partial derivatives and gradients","es":"Derivadas parciales y gradiente","fr":"Dérivées partielles et gradient"},"sequence_slugs":["facodi-math-multivariaveis-gradiente"]},{"id":"integrais-duplas","labels":{"pt":"Integrais duplas","en":"Double integrals","es":"Integrales dobles","fr":"Intégrales doubles"},"sequence_slugs":["facodi-math-multivariaveis-integrais-duplas"]},{"id":"pratica","labels":{"pt":"Exercícios graduais","en":"Progressive exercises","es":"Ejercicios progresivos","fr":"Exercices progressifs"},"sequence_slugs":["facodi-math-analise2-exercicios"]}],"supplementary_sequence_slugs":["facodi-math-integracao-geometrica","facodi-math-calculo-vetorial-extensao"],"guide_module_slugs":["facodi-modulo-20261115-analysis2-multi","facodi-modulo-20261115-analysis2-integrals"]}},{"course_code":"LESTI","unit_code":"19411018","config":{"version":2,"sections":[{"id":"descritiva","labels":{"pt":"Estatística descritiva","en":"Descriptive statistics","es":"Estadística descriptiva","fr":"Statistiques descriptives"},"sequence_slugs":["facodi-math-estatistica-descritiva"]},{"id":"probabilidade","labels":{"pt":"Probabilidade e distribuições","en":"Probability and distributions","es":"Probabilidad y distribuciones","fr":"Probabilités et distributions"},"sequence_slugs":["facodi-math-probabilidade-bayes","facodi-math-probabilidade-distribuicoes"]},{"id":"inferencia","labels":{"pt":"Inferência estatística","en":"Statistical inference","es":"Inferencia estadística","fr":"Inférence statistique"},"sequence_slugs":["facodi-math-estatistica-intervalos","facodi-math-estatistica-testes"]},{"id":"modelos","labels":{"pt":"Correlação, regressão e ANOVA","en":"Correlation, regression and ANOVA","es":"Correlación, regresión y ANOVA","fr":"Corrélation, régression et ANOVA"},"sequence_slugs":["facodi-math-estatistica-regressao","facodi-math-estatistica-anova"]}],"supplementary_sequence_slugs":["facodi-playlist-estatistica-probabilidade"],"guide_module_slugs":["facodi-modulo-20261115-statistics-basics","facodi-modulo-20261115-statistics-inference"]}}]'::jsonb) LOOP
    v_cfg := v_entry->'config';
    SELECT u.* INTO STRICT v_unit
    FROM facodi.curricular_units u
    JOIN facodi.courses c ON c.id=u.course_id
    WHERE u.code=v_entry->>'unit_code' AND c.code=v_entry->>'course_code'
      AND u.status='active' AND c.status='active' AND c.published;

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
      WHERE id=v_unit.id;
  END LOOP;
END;
$$;
