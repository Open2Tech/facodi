
CREATE TEMP TABLE _gacs_outcome_manifest ON COMMIT DROP AS SELECT * FROM jsonb_to_recordset($gacs_outcomes$[{"code":"ASTRO01","statements":["Distinguir observação, evidência e interpretação em questões de astronomia.","Identificar como o GACS e outras iniciativas de extensão promovem a divulgação científica."]},{"code":"ASTRO02","statements":["Reconhecer os movimentos aparentes do céu e relacioná-los com a rotação terrestre.","Utilizar referências do horizonte e pontos cardeais para descrever uma observação astronómica."]},{"code":"ASTRO03","statements":["Explicar qualitativamente as fases da Lua e os eclipses pela geometria Sol–Terra–Lua.","Distinguir o efeito da inclinação terrestre sobre as estações das variações de distância ao Sol."]},{"code":"ASTRO04","statements":["Comparar características de planetas, planetas anões e pequenos corpos do Sistema Solar.","Relacionar a gravitação com movimentos orbitais e missões de exploração espacial em nível introdutório."]},{"code":"ASTRO05","statements":["Reconhecer por que diferentes comprimentos de onda revelam propriedades distintas dos astros.","Explicar de forma introdutória o papel de telescópios e detectores na obtenção de evidências observacionais."]},{"code":"ASTRO06","statements":["Descrever como a fusão nuclear sustenta a emissão de energia das estrelas.","Diferenciar grandes etapas da formação e evolução estelar conforme a massa."]},{"code":"ASTRO07","statements":["Reconhecer a escala da Via Láctea e sua relação com outras galáxias.","Explicar por que métodos de medição de distâncias são fundamentais na astronomia extragaláctica."]},{"code":"ASTRO08","statements":["Apresentar as evidências observacionais básicas da expansão cósmica.","Distinguir os dados astronómicos de modelos e hipóteses na descrição da história do Universo."]},{"code":"ASTRO09","statements":["Descrever o princípio de detecção de ondas gravitacionais e o que revelam.","Distinguir a investigação de ambientes habitáveis da comprovação de vida fora da Terra."]},{"code":"ASTRO10","statements":["Planejar uma atividade de astronomia com procedimentos de observação seguros e acessíveis.","Comunicar resultados de uma oficina usando fontes, limites e adequação ao público."]}]$gacs_outcomes$::jsonb) AS m(code text, statements jsonb);
DO $verify_source$ BEGIN
 IF (SELECT count(*) FROM _gacs_outcome_manifest)<>10
 OR (SELECT count(DISTINCT code) FROM _gacs_outcome_manifest)<>10
 OR EXISTS(SELECT 1 FROM _gacs_outcome_manifest m
 LEFT JOIN facodi.curricular_units u ON u.code='FACODI-GACS18-'||m.code AND u.course_id=md5('facodi:gacs2018:course')::uuid
 WHERE u.id IS NULL OR jsonb_array_length(m.statements)<>2)
 THEN RAISE EXCEPTION 'Incorrect GACS curriculum unit or outcomes inventory';END IF;
END $verify_source$;
INSERT INTO facodi.learning_outcomes(id,learning_object_id,competency_id,statement,position,metadata)
SELECT md5('facodi:gacs2018:outcome:'||m.code||':'||v.n)::uuid,u.learning_object_id,NULL,v.statement,v.n::int,
jsonb_build_object('publisher','FACODI editorial','source','GACS_IFES_historical_context_and_INPE_2018',
'teacher_approved',false,'official_learning_outcome',false,'independent_2026_study_guide',true,
'course_code','FACODI-GACS-ASTRO-2018','unit_code',u.code,
'batch','facodi_gacs_astronomy_2018_editorial_20261115')
FROM _gacs_outcome_manifest m
CROSS JOIN LATERAL jsonb_array_elements_text(m.statements) WITH ORDINALITY v(statement,n)
JOIN facodi.curricular_units u ON u.code='FACODI-GACS18-'||m.code AND u.course_id=md5('facodi:gacs2018:course')::uuid
ON CONFLICT(id) DO NOTHING;
DO $verify_result$ BEGIN
 IF (SELECT count(*) FROM facodi.learning_outcomes WHERE metadata->>'batch'='facodi_gacs_astronomy_2018_editorial_20261115')<>20
 THEN RAISE EXCEPTION 'GACS 20 editorial outcomes missing';END IF;
END $verify_result$;