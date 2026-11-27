-- Presentation-only composition of existing sequences for two Gestão information systems curricular units.
-- Zero new objects or relations; preserves video/playlist order, progress, RLS and public URLs.
-- The API, Helpdesk and expense playlists already have learner progress; all existing IDs and positions are preserved.
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
  FOR v_entry IN SELECT value FROM jsonb_array_elements('[{"course_code":"LGEST","unit_code":"14181196","config":{"version":2,"sections":[{"id":"fundamentos-processos","labels":{"pt":"Fundamentos de ERP e processos de gestão","en":"ERP fundamentals and business processes","es":"Fundamentos de ERP y procesos empresariales","fr":"Fondements des ERP et processus de gestion"},"sequence_slugs":["facodi-odoo19-visao-geral","facodi-playlist-processos-sistemas-gestao"]},{"id":"financas-despesas","labels":{"pt":"Fluxos financeiros, despesas e reembolsos","en":"Finance, expenses and reimbursements","es":"Finanzas, gastos y reembolsos","fr":"Finances, dépenses et remboursements"},"sequence_slugs":["facodi-playlist-despesas-reembolso-erp","facodi-odoo19-financas-despesas"]},{"id":"pessoas-operacoes","labels":{"pt":"Gestão de pessoas e operações empresariais","en":"People and business operations","es":"Gestión de personas y operaciones","fr":"Gestion du personnel et opérations"},"sequence_slugs":["facodi-playlist-rh-cadastro-erp","facodi-odoo19-operacoes-frota"]}],"supplementary_sequence_slugs":[],"guide_module_slugs":["facodi-modulo-odoo19-financas","facodi-modulo-odoo19-operacoes","facodi-modulo-odoo19-gestao-sistemas"]}},{"course_code":"LGEST","unit_code":"14181197","config":{"version":2,"sections":[{"id":"integracoes-processos","labels":{"pt":"Integração de sistemas e processos digitais","en":"Systems integration and digital processes","es":"Integración de sistemas y procesos digitales","fr":"Intégration de systèmes et processus numériques"},"sequence_slugs":["facodi-tecnologia-odoo-integracoes","facodi-playlist-processos-sistemas-gestao"]},{"id":"aprovacoes-controle","labels":{"pt":"Aprovações, despesas e atendimento","en":"Approvals, expenses and front-office","es":"Aprobaciones, gastos y atención","fr":"Approbations, dépenses et accueil"},"sequence_slugs":["facodi-odoo19-operacoes-aprovacoes","facodi-odoo19-financas-despesas","facodi-odoo19-operacoes-rececao"]},{"id":"servicos-operacoes","labels":{"pt":"Serviços, suporte e operações","en":"Services, support and operations","es":"Servicios, soporte y operaciones","fr":"Services, assistance et opérations"},"sequence_slugs":["facodi-odoo19-servicos-helpdesk","facodi-odoo19-operacoes-frota","facodi-odoo19-operacoes-refeicoes"]},{"id":"pessoas-transversal","labels":{"pt":"Processos transversais de recursos humanos","en":"Cross-functional people processes","es":"Procesos transversales de recursos humanos","fr":"Processus transversaux des ressources humaines"},"sequence_slugs":["facodi-playlist-rh-cadastro-erp","facodi-playlist-rh-recrutamento-erp","facodi-playlist-rh-assiduidade-erp"]}],"supplementary_sequence_slugs":["facodi-odoo19-visao-geral"],"guide_module_slugs":["facodi-modulo-odoo19-financas","facodi-modulo-odoo19-servicos","facodi-modulo-odoo19-integracoes","facodi-modulo-odoo19-operacoes","facodi-modulo-odoo19-gestao-sistemas"]}}]'::jsonb) LOOP
    v_cfg := v_entry->'config';
    SELECT u.* INTO STRICT v_unit
    FROM facodi.curricular_units u
    JOIN facodi.courses c ON c.id=u.course_id
    WHERE u.code=v_entry->>'unit_code' AND c.code=v_entry->>'course_code'
      AND u.status='active' AND u.published AND c.status='active' AND c.published;

    IF v_unit.metadata ? 'facodi_study_path_v1' THEN
      RAISE EXCEPTION 'Existing legacy study path must be reviewed for %', v_unit.code;
    END IF;
    IF v_cfg->>'version' <> '2' OR jsonb_array_length(v_cfg->'sections') NOT IN (3,4) THEN
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
