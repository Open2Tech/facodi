-- FACODI / UAlg 1526, academic year 2026/27.
-- Source: https://fchs.ualg.pt/curso/1526/plano
-- Cognitive Neuroscience has a 60-ECTS dissertation. Neuropsychology
-- has the 30-ECTS professional internship + 30-ECTS dissertation.
-- Preserve all curricular units, published lessons, and other placements.
-- Idempotent metadata-only repair: no schema changes, deletions or RLS changes.
DO $reconcile$
DECLARE
  v_bad jsonb;
  v_source text := 'https://fchs.ualg.pt/curso/1526/plano';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM facodi.curricular_units u
    JOIN facodi.courses c ON c.id=u.course_id
    WHERE c.code='MNCN' AND u.code='15261012'
  ) THEN
    RAISE EXCEPTION 'FACODI MNCN dissertation 15261012 not found; reconciliation aborted';
  END IF;

  -- Remove only the unsupported Neuropsychology / research association.
  -- Keep the Cognitive Neuroscience / research association intact.
  UPDATE facodi.curricular_units u
  SET metadata = jsonb_set(
      u.metadata,
      '{curriculum_placements}',
      COALESCE((
        SELECT jsonb_agg(x.value ORDER BY x.ord)
        FROM jsonb_array_elements(COALESCE(u.metadata->'curriculum_placements','[]'::jsonb))
          WITH ORDINALITY AS x(value,ord)
        WHERE NOT (
          x.value->>'specialization'='Neuropsicologia'
          AND x.value->>'track'='investigação'
          AND x.value->>'year'='2'
        )
      ),'[]'::jsonb)
    ) || jsonb_build_object(
      'completion_track_reconciled','2026-11-16',
      'completion_track_source',v_source,
      'completion_track_review','official_2026_27_no_neuropsychology_research_route'
    )
  FROM facodi.courses c
  WHERE c.id=u.course_id AND c.code='MNCN' AND u.code='15261012';

  -- Keep the curricular-unit learning object and course relation in sync.
  UPDATE facodi.learning_objects lo
  SET metadata = jsonb_set(
      lo.metadata,'{curriculum_placements}',
      u.metadata->'curriculum_placements'
    ) || jsonb_build_object('completion_track_reconciled','2026-11-16',
      'completion_track_source',v_source)
  FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
  WHERE lo.id=u.learning_object_id AND c.code='MNCN' AND u.code='15261012';

  UPDATE facodi.learning_object_relations r
  SET metadata = r.metadata || jsonb_build_object(
      'curriculum_placements',u.metadata->'curriculum_placements',
      'completion_track_reconciled','2026-11-16',
      'completion_track_source',v_source
    )
  FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
  WHERE r.child_object_id=u.learning_object_id AND r.parent_object_id=c.learning_object_id
    AND r.relation_type='contains'
    AND c.code='MNCN' AND u.code='15261012';

  -- Clearly record the official completion pathways without changing course ECTS.
  UPDATE facodi.courses c
  SET summary='Mestrado da Universidade do Algarve, com 120 ECTS em dois anos. Neurociências Cognitivas conclui com dissertação de 60 ECTS; Neuropsicologia com estágio de 30 ECTS e dissertação de 30 ECTS, conforme plano 2026/27.',
      description_html=replace(
        c.description_html,
        'bem como percursos de dissertação ou estágio e dissertação',
        'incluindo dissertação de 60 ECTS em Neurociências Cognitivas e estágio de 30 ECTS mais dissertação de 30 ECTS em Neuropsicologia'
      ),
      metadata=c.metadata||jsonb_build_object(
        'completion_routes_2026_27',jsonb_build_object(
          'Neurociências Cognitivas',jsonb_build_object('route','investigação','unit_codes',jsonb_build_array('15261012'),'ects',60),
          'Neuropsicologia',jsonb_build_object('route','profissional','unit_codes',jsonb_build_array('15261018','15261019'),'ects',60)
        ),
        'completion_routes_source',v_source,
        'completion_routes_reconciled','2026-11-16',
        'facodi_ects_conflict_requires_human_review',true
      )
  WHERE c.code='MNCN';

  UPDATE facodi.learning_objects lo
  SET metadata=lo.metadata||jsonb_build_object(
    'completion_routes_source',v_source,
    'completion_routes_reconciled','2026-11-16'
  )
  WHERE lo.id=(SELECT learning_object_id FROM facodi.courses WHERE code='MNCN');

  -- The 2026/27 source lists UC 15271021 at both 0 and 5 ECTS in
  -- different elective blocks. Do not overwrite the stored source value.
  -- Expose the conflict explicitly until the faculty confirms the rules.
  UPDATE facodi.curricular_units u
  SET metadata=u.metadata||jsonb_build_object(
    'ects_requires_fchs_confirmation',true,
    'official_ects_checked',false,
    'ects_conflicting_source_values',jsonb_build_array(0,5),
    'ects_source_conflict_url',v_source
  )
  FROM facodi.courses c
  WHERE c.id=u.course_id AND c.code='MNCN' AND u.code='15271021';

  UPDATE facodi.learning_objects lo
  SET metadata=lo.metadata||jsonb_build_object(
    'ects_requires_fchs_confirmation',true,
    'official_ects_checked',false,
    'ects_conflicting_source_values',jsonb_build_array(0,5),
    'ects_source_conflict_url',v_source
  )
  WHERE lo.id IN (
    SELECT u.learning_object_id FROM facodi.curricular_units u
    JOIN facodi.courses c ON c.id=u.course_id
    WHERE c.code='MNCN' AND u.code='15271021'
  );

  IF NOT EXISTS (
    SELECT 1 FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
    CROSS JOIN LATERAL jsonb_array_elements(u.metadata->'curriculum_placements') x(placement)
    WHERE c.code='MNCN' AND u.code='15261012'
      AND x.placement->>'specialization'='Neurociências Cognitivas'
      AND x.placement->>'track'='investigação'
  ) THEN
    RAISE EXCEPTION 'Expected Cognitive Neuroscience dissertation placement not found';
  END IF;
  IF EXISTS (
    SELECT 1 FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
    CROSS JOIN LATERAL jsonb_array_elements(u.metadata->'curriculum_placements') x(placement)
    WHERE c.code='MNCN' AND u.code='15261012'
      AND x.placement->>'specialization'='Neuropsicologia'
  ) THEN
    RAISE EXCEPTION 'Unsupported Neuropsychology dissertation placement remains';
  END IF;
END
$reconcile$;
