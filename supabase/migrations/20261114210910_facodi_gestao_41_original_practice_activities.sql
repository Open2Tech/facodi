-- 41 original, tailored FACODI practice briefs for the 2026/27
-- Gestão course. Exercises are hypothetical, NOT official UAlg assessment.
CREATE TEMP TABLE _lg_activities(
 uc_code text PRIMARY KEY,exercise_title text,exercise_prompt text,deliverable text
) ON COMMIT DROP;
INSERT INTO _lg_activities VALUES
('14181086','Registos de abertura de uma microempresa','Uma papelaria fictícia inicia atividade com capital, compra mercadorias a crédito e realiza uma venda. Identifique as contas afetadas e organize os lançamentos contabilísticos em termos introdutórios.','Quadro de lançamentos e balanço simplificado.'),
('14181177','Dashboard de vendas de uma PME','Construa uma folha de cálculo com 12 meses de vendas hipotéticas de uma loja em Faro, calcule variações e margens e represente os resultados.','Folha com fórmulas, tabela dinâmica e dois gráficos.'),
('14181179','Diagnóstico organizacional','Analise uma pequena empresa fictícia de serviços turísticos: identifique missão, objetivos, clientes e principais decisões de planeamento e organização.','Mapa simples das quatro funções da gestão.'),
('14181176','Enquadramento legal de uma atividade','Compare formas jurídicas de organização de um negócio hipotético e indique que fontes legais portuguesas seria necessário consultar.','Tabela de fontes e questões jurídicas a esclarecer.'),
('14181178','Receita, custo e ponto de equilíbrio','Considere funções hipotéticas de receita e de custo de uma empresa e determine onde os valores se igualam, interpretando graficamente o resultado.','Cálculo e gráfico comentado.'),
('14181183','Motivação e colaboração em equipa','Imagine uma equipa de atendimento com elevada rotatividade. Formule hipóteses sobre motivação, comunicação e liderança e proponha ações observáveis.','Plano de melhoria com três medidas e indicadores.'),
('14181088','Operações de fim de exercício','Numa empresa fictícia, identifique os documentos e as regularizações necessários para fechar um período contabilístico.','Checklist de operações e demonstrações a preparar.'),
('14181182','Email profissional em inglês','Redija um pedido de proposta comercial e uma resposta curta a um cliente estrangeiro, mantendo clareza e tom adequado.','Dois emails em inglês com glossário de termos empresariais.'),
('14181180','Comparação de condições financeiras','Compare dois financiamentos hipotéticos com prazos e taxas diferentes, distinguindo juro simples e composto quando aplicável.','Tabela de cálculo, pressupostos e conclusão justificada.'),
('14181181','Otimização de recursos','Formule um pequeno problema de atribuição de horas de trabalho ou materiais sob restrições explícitas e apresente uma solução matemática.','Modelo, cálculo e interpretação dos limites.'),
('14181184','Diagnóstico por indicadores','A partir de demonstrações financeiras fictícias, calcule indicadores de liquidez, autonomia e rentabilidade e identifique limitações da análise.','Painel com rácios e uma nota de diagnóstico.'),
('14181185','Mapa de custos de produção','Separe custos diretos e indiretos de uma pequena operação fictícia e escolha critérios de imputação transparentes.','Mapa de classificação e apuramento de custos.'),
('14181192','Contrato e relação de trabalho','Considere um cenário hipotético de contratação de pessoal e fornecimento entre empresas e identifique a legislação consolidada a consultar.','Checklist de fontes legais e riscos de conformidade.'),
('14181186','Choque de oferta num mercado','Desenhe curvas de oferta e procura para um mercado fictício e explique qualitativamente os efeitos de uma mudança de custos.','Gráfico de equilíbrio e análise das alterações.'),
('14181187','Descrever uma amostra de vendas','Crie uma amostra de 20 observações fictícias de valores de compra e calcule medidas centrais, dispersão e representação adequada.','Tabela estatística com histograma e interpretação.'),
('14181193','Mapa de obrigações fiscais','Para uma PME hipotética, identifique obrigações relativas à atividade, IVA e documentação, remetendo aos códigos vigentes.','Calendário de consulta de obrigações e fontes oficiais, sem aconselhamento fiscal individual.'),
('14181188','Segmentação de um serviço local','Desenhe uma proposta de marketing para um serviço fictício no Algarve, definindo públicos, valor e canais de divulgação.','Mapa de segmentos, proposta de valor e marketing-mix.'),
('14181189','Orçamento e desvios','Construa um orçamento hipotético de custos e compare com valores realizados, explicando diferenças de preço e quantidade.','Relatório de desvios com medidas corretivas.'),
('14181190','Inflação e atividade económica','Selecione séries públicas da Pordata, Eurostat ou BCE e compare a evolução da inflação e de outro indicador em dois períodos.','Gráficos com fontes, datas e interpretação económica.'),
('14181191','Hipótese e inferência','Defina uma questão de gestão que possa ser analisada por dados amostrais e escolha uma técnica de inferência adequada, verificando pressupostos.','Enunciado de hipótese, procedimento e interpretação de resultados.'),
('14181094','Processo de recrutamento responsável','Desenhe um processo de contratação para uma função fictícia de apoio administrativo, justificando critérios, divulgação e avaliação.','Fluxograma de seleção e grelha de critérios.'),
('14181194','Avaliação de projeto de investimento','Compare dois projetos hipotéticos com diferentes fluxos de caixa e explique como indicadores financeiros e risco apoiam a decisão.','Tabela de fluxos, pressupostos e avaliação de cenários.'),
('14181196','Fluxo de informação empresarial','Mapeie como um pedido de cliente passa por vendas, operações e faturação numa organização fictícia.','Diagrama de processos e requisitos de informação.'),
('15161110','Campanha em redes sociais','Planeie uma campanha fictícia de informação de produto com objetivos, público, calendário e métricas.','Calendário editorial e quadro de indicadores.'),
('15161102','Funil comercial e negociação','Simule o percurso de um potencial cliente desde o primeiro contacto até à proposta, identificando necessidades e objeções.','Funil de vendas e guião de contacto.'),
('15161047','Jornada do cliente num serviço','Mapeie a experiência de um cliente de um serviço turístico fictício, com momentos de contacto e pontos de melhoria.','Mapa da jornada e métricas de qualidade percebida.'),
('14181199','Entrada num mercado externo','Escolha um produto hipotético português e compare dois mercados de destino com base em dados oficiais e barreiras possíveis.','Matriz comparativa e estratégia exploratória.'),
('14191202','Painel de controlo estratégico','Proponha indicadores financeiros e não financeiros para uma pequena organização fictícia e defina periodicidade de acompanhamento.','Scorecard com metas hipotéticas e responsáveis.'),
('14191111','Responsabilização de recursos públicos','Analise um cenário hipotético de despesa pública e identifique diferenças entre prestação de contas e gestão financeira empresarial.','Quadro comparativo com fontes normativas para consulta.'),
('15161098','Negociação entre parceiros','Prepare uma negociação fictícia entre uma PME e um fornecedor, definindo prioridades, concessões e alternativas.','Plano de negociação e registo de acordo.'),
('14181198','Identidade de marca digital','Descreva o posicionamento de uma marca fictícia e avalie a consistência de mensagem em três canais digitais.','Guia de tom, mensagens e indicadores de marca.'),
('14181095','Comparação educativa de produtos financeiros','Analise características gerais de três instrumentos financeiros hipotéticos quanto a liquidez, risco e prazo, sem recomendação personalizada.','Matriz comparativa e nota de riscos.'),
('14181031','Plano de estágio e evidências','Estruture um plano de atividades fictício com objetivos, tarefas, prazos, evidências de aprendizagem e reflexão crítica.','Plano de estágio e modelo de diário de atividades.'),
('14181195','Caso de cumprimento fiscal','Analise um cenário empresarial hipotético de operações nacionais e identifique quais códigos e declarações oficiais seria necessário consultar.','Mapa de verificação e fontes fiscais atualizadas.'),
('14181093','Estratégia para uma pequena organização','Construa uma análise interna e externa de uma PME fictícia, defina prioridades e proponha indicadores para a implementação.','Síntese SWOT, alternativas e plano de ação.'),
('14181030','Gestão de tesouraria','Crie uma previsão mensal de recebimentos e pagamentos para uma pequena empresa e identifique meses de potencial falta de liquidez.','Mapa de fluxos de caixa e medidas possíveis.'),
('14181197','Arquitetura de apoio à decisão','Proponha a integração hipotética de dados de vendas, clientes e custos num sistema de informação para direção.','Diagrama de fontes, indicadores e requisitos de acesso.'),
('14181168','Validação de ideia de negócio','Formule uma hipótese de problema de cliente, um modelo de negócio inicial e um plano de entrevistas exploratórias.','Canvas de negócio e roteiro de validação.'),
('15161109','Narrativa digital para serviço','Escreva uma página de apresentação de um serviço fictício, orientada para um público definido e com chamada para ação clara.','Texto Web, mapa narrativo e revisão de acessibilidade.'),
('14181200','Uso responsável de IA em operações','Desenhe um caso de uso hipotético de IA generativa no apoio administrativo, identificando dados pessoais, critérios de avaliação e supervisão humana.','Ficha de riscos, critérios de qualidade e plano de testes.'),
('14181164','Simulação de decisões de gestão','Crie uma empresa fictícia com procura, capacidade, custos e concorrência simulados e analise como diferentes decisões afetam resultados.','Relatório de cenários, indicadores e reflexão final.');
DO $$ BEGIN
 IF (SELECT count(*) FROM _lg_activities)<>41 THEN RAISE EXCEPTION 'Missing original activities'; END IF;
 IF EXISTS(SELECT 1 FROM _lg_activities a WHERE NOT EXISTS(
  SELECT 1 FROM facodi.curricular_units u
  JOIN facodi.courses c ON c.id=u.course_id
  WHERE u.code=a.uc_code AND c.code='LGEST' AND u.published))
 THEN RAISE EXCEPTION 'Activity references unknown UC';END IF;
END $$;
UPDATE facodi.curricular_units u SET
 description_html=CASE
 WHEN coalesce(u.description_html,'') LIKE '%Atividade prática proposta pela FACODI%'
 THEN u.description_html
 ELSE coalesce(u.description_html,'')||
  '<section><h2>Atividade prática proposta pela FACODI</h2><h3>'||
  replace(replace(replace(a.exercise_title,'&','&amp;'),'<','&lt;'),'>','&gt;')||
  '</h3><p>'||
  replace(replace(replace(a.exercise_prompt,'&','&amp;'),'<','&lt;'),'>','&gt;')||
  '</p><p><strong>Entrega sugerida:</strong> '||
  replace(replace(replace(a.deliverable,'&','&amp;'),'<','&lt;'),'>','&gt;')||
  '</p><p>Exercício hipotético e original de apoio ao estudo. Não substitui enunciados, avaliação ou ficha oficial da UAlg.</p></section>'
 END,
 metadata=coalesce(u.metadata,'{}'::jsonb)||
 jsonb_build_object('facodi_practice_activity',
  jsonb_build_object('title',a.exercise_title,'prompt',a.exercise_prompt,
  'deliverable',a.deliverable,'origin','facodi_original',
  'university_assessment',false,'hypothetical',true,
  'review_status','editorial_proposal'),
  'practice_activity_version','2026-11-14')
FROM _lg_activities a
WHERE u.code=a.uc_code
 AND u.course_id=(SELECT id FROM facodi.courses WHERE code='LGEST')
 AND u.published;
UPDATE facodi.learning_objects lo SET
 metadata=coalesce(lo.metadata,'{}'::jsonb)||
  jsonb_build_object('facodi_practice_activity',
   jsonb_build_object('title',a.exercise_title,
    'prompt',a.exercise_prompt,'deliverable',a.deliverable,
    'official_assessment',false,'hypothetical',true))
FROM facodi.curricular_units u JOIN _lg_activities a ON a.uc_code=u.code
WHERE lo.id=u.learning_object_id AND lo.published
 AND u.course_id=(SELECT id FROM facodi.courses WHERE code='LGEST');
DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.curricular_units WHERE
  course_id=(SELECT id FROM facodi.courses WHERE code='LGEST')
  AND description_html LIKE '%Atividade prática proposta pela FACODI%')<>41
 THEN RAISE EXCEPTION 'Missing published activity on a course UC'; END IF;
END $$;