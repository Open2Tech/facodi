-- Verified UAlg academic programme enrichment with a date-specific admissions snapshot.
-- Figures below refer only to the institution's 2026/27 published intake,
-- not a promise of availability or the fees of future academic years.
UPDATE facodi.courses c
SET metadata=coalesce(c.metadata,'{}'::jsonb)||
 jsonb_build_object(
  'admissions_2026_27',
    jsonb_build_object('source','https://www.ualg.pt/curso/1418/candidaturas?tipo=concurso-nacional',
      'academic_year','2026/27','source_kind','official_UAlg_national_admission',
      'vacancies',76,'published_annual_tuition_eur',697,
      'minimum_application_score_points',100,
      'minimum_entry_exam_score_points',95,
      'secondary_school_weight_percent',50,'entry_exam_weight_percent',50,
      'regional_preference_vacancies_percent',50,
      'regional_preference_area','Faro',
      'eligible_exam_combinations_must_be_checked_in_official_source',true,
      'future_admissions_data_not_claimed',true),
  'historic_2025_26_exact_code_overlap_count',10,
  'historical_curriculum_does_not_imply_uc_equivalence',true),
 description_html=CASE WHEN coalesce(c.description_html,'') LIKE '%Histórico do plano de estudos%'
 THEN c.description_html
 ELSE coalesce(c.description_html,'')||
  '<section><h2>Histórico do plano de estudos</h2>'||
  '<p>A UAlg publica também um plano de 2025/26. O arquivo FACODI preserva 46 códigos/ofertas, incluindo opções alternativas; o plano de 2026/27 apresenta 41. Apenas 10 códigos aparecem em ambos os anos. '||
  'Códigos distintos não constituem prova de equivalência académica. Para equivalências e transição de plano, contacte os serviços académicos.</p>'||
  '<p><a href="https://www.ualg.pt/curso/1418/plano" target="_blank" rel="noopener noreferrer">Comparar os planos na Universidade do Algarve</a></p>'||
  '<h2>Informação de acesso — 2026/27</h2>'||
  '<p>No Concurso Nacional de Acesso de 2026/27, a universidade divulgou 76 vagas, propina anual de 697 €, nota mínima de candidatura de 100 pontos e das provas de ingresso de 95 pontos. '||
  'As condições e os montantes são específicos desse ano letivo e podem mudar nos concursos seguintes.</p>'||
  '<p><a href="https://www.ualg.pt/curso/1418/candidaturas?tipo=concurso-nacional" target="_blank" rel="noopener noreferrer">Consultar condições e provas de ingresso oficiais</a></p></section>'
 END
WHERE c.code='LGEST';

UPDATE facodi.learning_objects lo
SET metadata=coalesce(lo.metadata,'{}'::jsonb)||
 jsonb_build_object(
  '2026_27_admissions_source',
    'https://www.ualg.pt/curso/1418/candidaturas?tipo=concurso-nacional',
  'historical_archive_year','2025/26',
  'historical_exact_code_overlap_count',10)
FROM facodi.courses c
WHERE lo.id=c.learning_object_id AND c.code='LGEST';
