-- Contributor roster nominated by the founder (2026-11-15).
-- Nominations are PRIVATE and are NOT proof of individual consent or contributions.
-- They remain unpublished until facodi.review_project_credit verifies attribution.
INSERT INTO facodi.project_profiles
(slug,entity_kind,relationship_kind,display_name,role_label,headline,description,
 verification_state,publication_state,consent_for_public_credit,
 editorial_metadata,sort_order)
VALUES
('sofia-pending','person','candidate_contributor','Sofia',
 'Contributo indicado pelo fundador · função a confirmar',
 'Crédito editorial reservado para validação.',
 'Sofia foi indicada pelo fundador da FACODI como possível colaboradora. É necessário confirmar o nome completo, o trabalho realizado, a fonte pública e a autorização da própria pessoa antes de divulgar qualquer crédito.',
 'pending','draft',false,
 '{"owner_nominated_on":"2026-11-15","needs_full_name":true,"needs_role_confirmation":true,"needs_consent":true,"nomination_is_not_public_credit":true}'::jsonb,230),
('tercio-pending','person','candidate_contributor','Tércio',
 'Contributo indicado pelo fundador · função a confirmar',
 'Crédito editorial reservado para validação.',
 'Tércio foi indicado pelo fundador da FACODI como possível colaborador. É necessário confirmar o nome completo, o trabalho realizado, a fonte pública e a autorização da própria pessoa antes de divulgar qualquer crédito.',
 'pending','draft',false,
 '{"owner_nominated_on":"2026-11-15","needs_full_name":true,"needs_role_confirmation":true,"needs_consent":true,"nomination_is_not_public_credit":true}'::jsonb,240)
ON CONFLICT (slug) DO NOTHING;
UPDATE facodi.project_profiles
SET editorial_metadata=editorial_metadata || '{"owner_nominated_on":"2026-11-15","needs_role_confirmation":true,"needs_consent":true}'::jsonb,
    updated_at=now()
WHERE slug IN ('gustavo-scheidt','bilal-uddin','andreia-cirne')
  AND publication_state='draft'
  AND verification_state='pending';