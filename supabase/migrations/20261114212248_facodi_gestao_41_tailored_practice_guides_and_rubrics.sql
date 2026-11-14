-- FACODI original practical study guides for the 41 UCs of Gestão.
-- 4 actionable, discipline-specific checkpoints for each already-published case.
CREATE TEMP TABLE _lg_practice_guidance(
 uc_code text PRIMARY KEY,prepare text,apply text,check_result text,common_pitfall text
) ON COMMIT DROP;
INSERT INTO _lg_practice_guidance VALUES
('14181086','Identificar capital, ativos, passivos e documentos de suporte.','Construir o diário de lançamentos e sintetizar saldos por conta.','Verificar se o total de débitos coincide com o total de créditos.','Usar o SNC português como referência, não um plano de contas estrangeiro.'),
('14181177','Definir colunas, datas, valores e regras de qualidade dos dados.','Utilizar fórmulas, tabela dinâmica e gráficos para comparar meses.','Conferir totais com a fonte e documentar fórmulas e filtros.','Não confundir percentagem de crescimento com variação em pontos percentuais.'),
('14181179','Descrever contexto, missão, stakeholders e objetivos da organização.','Aplicar planeamento, organização, direção e controlo a decisões concretas.','Relacionar cada medida a um responsável e um indicador observável.','Não confundir objetivos estratégicos com tarefas operacionais isoladas.'),
('14181176','Identificar a natureza dos factos e os intervenientes do caso.','Localizar fontes legais vigentes e explicitar hipóteses jurídicas.','Distinguir factos, normas consultadas e dúvidas ainda por esclarecer.','Evitar apresentar conclusões jurídicas como aconselhamento profissional.'),
('14181178','Definir variáveis, domínio e unidades das funções de custo e receita.','Resolver a igualdade receita-custo e representar as curvas.','Substituir o resultado em ambas as expressões e interpretar o sinal.','Verificar se a solução pertence ao domínio económico admissível.'),
('14181183','Descrever sintomas e recolher evidências hipotéticas sobre a equipa.','Relacionar motivação, comunicação, cultura e liderança com ações.','Definir indicadores e um momento de reavaliação do plano.','Evitar atribuir causas ao comportamento de pessoas sem evidências.'),
('14181088','Listar documentos e identificar operações de regularização.','Organizar etapas de acréscimos, diferimentos, depreciações e fecho.','Conciliar saldos e validar a ligação às demonstrações financeiras.','Não tratar a estimativa de custos como despesa contabilizada sem suporte.'),
('14181182','Definir destinatário, objetivo, contexto e vocabulário necessário.','Redigir assunto, saudação, pedido, prazos e encerramento claros.','Rever tom, gramática, datas e ações solicitadas.','Evitar traduções literais e abreviaturas ambíguas.'),
('14181180','Definir capital inicial, taxa, periodicidade e prazo de cada alternativa.','Aplicar a fórmula correspondente e construir uma tabela de evolução.','Conferir unidades temporais e comparar resultados com pressupostos iguais.','Taxa nominal e taxa efetiva não são intercambiáveis.'),
('14181181','Identificar variáveis, restrições e função objetivo.','Resolver o modelo escolhido e testar cenários alternativos.','Verificar condições de admissibilidade e coerência dos resultados.','Uma solução matemática só tem utilidade se respeitar as restrições reais.'),
('14181184','Definir período, demonstrações e rácios adequados ao caso.','Calcular indicadores consistentes de liquidez, dívida e rentabilidade.','Comparar períodos e comentar fatores que alteram a leitura.','Um rácio isolado não constitui diagnóstico financeiro completo.'),
('14181185','Definir objetos de custo e distinguir custos diretos e indiretos.','Escolher um critério de imputação justificável e calcular custos totais.','Conciliar o custo apurado com os dados de origem.','O critério de rateio pode modificar a leitura do custo por produto.'),
('14181192','Identificar contratos, pessoas envolvidas e obrigações relevantes.','Consultar normas atuais e estruturar um mapa de requisitos.','Separar obrigações legais, boas práticas e pontos por confirmar.','A interpretação deve acompanhar a legislação em vigor.'),
('14181186','Representar os fatores de procura e oferta e o equilíbrio inicial.','Deslocar a curva afetada e comparar preço e quantidade esperados.','Explicar o sentido da alteração mantendo claras as condições assumidas.','Não confundir deslocamento da curva com movimento ao longo dela.'),
('14181187','Definir amostra, variável, unidade de análise e registos fictícios.','Calcular média, mediana, moda, amplitude e medidas de dispersão.','Comparar gráfico e medidas, identificando possíveis valores extremos.','Não generalizar conclusões amostrais para toda a população sem método.'),
('14181193','Identificar operação, sujeito passivo e enquadramento temporal.','Consultar os códigos oficiais de IVA e demais normas aplicáveis.','Organizar obrigações, datas e documentos com fontes e versões.','A legislação fiscal muda; nenhuma simulação substitui revisão atualizada.'),
('14181188','Identificar problema, público-alvo e alternativas do mercado.','Definir posicionamento, proposta de valor e variáveis do marketing-mix.','Ligar cada decisão a indicador e fonte de evidência.','Não confundir alcance de campanha com conversão efetiva.'),
('14181189','Definir orçamento base, volume esperado e categorias de custo.','Calcular desvios e explorar causas possíveis de preço e quantidade.','Explicar limitações e propor ação com responsável e prazo.','Desvio favorável nem sempre implica melhor desempenho operacional.'),
('14181190','Definir período, região e indicador macroeconómico comparável.','Obter séries de fontes oficiais e calcular taxas de variação.','Verificar unidades, revisões de série e contexto das diferenças.','Correlação entre séries não prova relação de causa e efeito.'),
('14181191','Formular hipótese nula, alternativa e pressupostos do modelo.','Selecionar procedimento estatístico e interpretar intervalo ou valor-p.','Comunicar dimensão do efeito, limitações e significado prático.','Um valor-p pequeno não mede a magnitude nem a relevância empresarial.'),
('14181094','Definir responsabilidades da função e critérios de seleção.','Construir etapas objetivas de divulgação, triagem e entrevista.','Verificar equidade, privacidade e rastreabilidade dos critérios.','Evitar critérios discriminatórios ou não relacionados com o posto.'),
('14181194','Definir investimento inicial, horizonte, fluxos e taxa de desconto.','Comparar cenários e calcular indicadores como VAL quando pertinente.','Testar sensibilidade a receita, custos, prazo e taxa.','Usar taxas e fluxos consistentes, distinguindo valores reais e nominais.'),
('14181196','Identificar atores, eventos e sistemas envolvidos num processo.','Desenhar fluxos de dados e responsabilidades de cada etapa.','Testar entradas, saídas, exceções e necessidade de autorização.','Informação repetida em sistemas não garante qualidade nem consistência.'),
('15161110','Definir persona, canal, objetivo e orçamento hipotético.','Preparar calendário com formatos, mensagens e indicadores.','Rever critérios de publicidade, privacidade e interpretação dos dados.','Visualizações e gostos não equivalem necessariamente a vendas.'),
('15161102','Descrever cliente, necessidade, proposta de valor e etapas comerciais.','Simular descoberta, proposta, objeções e fecho da negociação.','Analisar conversão, tempo de resposta e qualidade do acompanhamento.','Não prometer atributos ou resultados sem evidência.'),
('15161047','Mapear fases antes, durante e depois da prestação do serviço.','Identificar momentos críticos e melhorias da experiência.','Definir métricas e recolha hipotética de feedback.','Diferenciar expectativa, perceção e qualidade efetivamente prestada.'),
('14181199','Definir produto, recursos e dois mercados-alvo alternativos.','Comparar dimensão, barreiras, logística, risco e fontes institucionais.','Justificar a escolha e listar pressupostos que exigem validação.','Não extrapolar condições de um país para outro sem contexto.'),
('14191202','Identificar objetivos estratégicos e processos críticos.','Construir painel equilibrado com indicadores, metas e responsáveis.','Avaliar periodicidade, qualidade dos dados e desvios possíveis.','Métricas fáceis de medir nem sempre representam objetivos relevantes.'),
('14191111','Identificar entidade pública e natureza da operação hipotética.','Comparar reconhecimento, autorização e prestação de contas.','Relacionar a análise com as normas públicas aplicáveis.','Não aplicar automaticamente regras de contabilidade privada ao setor público.'),
('15161098','Definir objetivos, limites, alternativas e interesses dos parceiros.','Ensaiar propostas, concessões e comunicação fundamentada.','Verificar critérios do acordo e compromissos mensuráveis.','Posições declaradas e interesses subjacentes podem ser diferentes.'),
('14181198','Definir identidade, promessa e públicos da marca fictícia.','Comparar mensagens, criativos e posicionamento em canais digitais.','Verificar coerência visual, textual e indicadores de resposta.','Identidade de marca não é apenas um logótipo.'),
('14181095','Definir finalidade, prazo, liquidez e tolerância a risco no exemplo.','Comparar características dos instrumentos sem recomendar compras.','Distinguir cenários favoráveis, desfavoráveis e condições de resgate.','Rentabilidades passadas não garantem retornos futuros.'),
('14181031','Definir objetivos, instituição, tarefas possíveis e orientações.','Planear atividades e registar evidências e reflexões periódicas.','Relacionar cada resultado aos objetivos e preparar apresentação.','Não revelar informação confidencial da entidade de acolhimento.'),
('14181195','Caracterizar operações empresariais e período fiscal do cenário.','Localizar fontes legais atuais e organizar obrigações potenciais.','Registar condições, exceções e limites da simulação.','Não apresentar um exemplo como instrução fiscal individual.'),
('14181093','Distinguir fatores internos, externos e stakeholders.','Produzir diagnóstico, opções estratégicas e roteiro de execução.','Associar prioridades a custos, responsáveis e indicadores.','SWOT sem evidências ou plano de ação é insuficiente.'),
('14181030','Estimar datas de recebimento, pagamentos e saldo inicial.','Construir projeção mensal e simular atrasos de clientes.','Identificar necessidades de fundo de maneio e opções de mitigação.','Lucro contabilístico e saldo de caixa são grandezas diferentes.'),
('14181197','Definir utilizadores, fontes de dados e decisões a suportar.','Desenhar arquitetura simplificada de integração e indicadores.','Rever controlo de acesso, qualidade e atualização da informação.','Automatizar um processo incorreto não corrige erros de origem.'),
('14181168','Identificar hipótese de problema, segmento e proposta inicial.','Planear entrevistas, indicadores de validação e protótipo mínimo.','Distinguir opiniões favoráveis de evidências de procura real.','Evitar tratar uma ideia de negócio como validação de mercado.'),
('15161109','Definir objetivo, audiência, tom e percurso do leitor.','Escrever versão inicial, rever hierarquia e chamada para ação.','Verificar clareza, acessibilidade, ortografia e consistência.','Uma narrativa eficaz deve continuar fiel aos factos.'),
('14181200','Definir o processo, dados de entrada e decisão humana esperada.','Projetar testes de qualidade, privacidade, vieses e rastreabilidade.','Documentar falhas, supervisão e medidas de controlo.','A saída de um sistema generativo não constitui fonte verificada.'),
('14181164','Definir mercado, concorrentes, recursos e indicadores do cenário.','Executar rodadas de decisões simuladas e registar efeitos.','Comparar alternativas e explicar escolhas à luz dos resultados.','A simulação depende das hipóteses do modelo e não prevê o mercado.');
DO $$ BEGIN
 IF (SELECT count(*) FROM _lg_practice_guidance)<>41 THEN RAISE EXCEPTION '41 distinct activities required'; END IF;
 IF EXISTS(SELECT 1 FROM _lg_practice_guidance g WHERE NOT EXISTS(
  SELECT 1 FROM facodi.curricular_units u JOIN facodi.courses c ON c.id=u.course_id
  WHERE u.code=g.uc_code AND c.code='LGEST' AND u.published))
 THEN RAISE EXCEPTION 'Unknown curricular code'; END IF;
END $$;
UPDATE facodi.curricular_units u
SET metadata=coalesce(u.metadata,'{}'::jsonb)||
 jsonb_build_object('practice_study_guidance',
  jsonb_build_object('preparation',g.prepare,'execution',g.apply,
   'verification',g.check_result,'common_pitfall',g.common_pitfall,
   'author','FACODI editorial', 'official_assessment',false,
   'teacher_reviewed',false,'hypothetical_context',true,
   'reference_year','2026/27')),
 description_html=CASE WHEN coalesce(u.description_html,'') LIKE '%Como desenvolver esta atividade%'
 THEN u.description_html
 ELSE coalesce(u.description_html,'')||
 '<section><h2>Como desenvolver esta atividade</h2>'||
 '<ol><li><strong>Preparação:</strong> '||g.prepare||
 '</li><li><strong>Execução:</strong> '||g.apply||
 '</li><li><strong>Revisão:</strong> '||g.check_result||
 '</li></ol><p><strong>Atenção a um erro frequente:</strong> '||
 g.common_pitfall||
 '</p><p>Orientações originais de estudo FACODI. Não substituem a avaliação nem as indicações do docente responsável.</p></section>'
 END
FROM _lg_practice_guidance g
WHERE u.code=g.uc_code AND
 u.course_id=(SELECT id FROM facodi.courses WHERE code='LGEST') AND u.published;
UPDATE facodi.learning_objects lo
SET metadata=coalesce(lo.metadata,'{}'::jsonb)||
 jsonb_build_object('practice_study_guidance',
  jsonb_build_object('preparation',g.prepare,'execution',g.apply,
   'verification',g.check_result,'common_pitfall',g.common_pitfall,
   'source','FACODI original editorial guide','official_assessment',false))
FROM facodi.curricular_units u JOIN _lg_practice_guidance g ON g.uc_code=u.code
WHERE lo.id=u.learning_object_id
 AND u.course_id=(SELECT id FROM facodi.courses WHERE code='LGEST');
DO $$ BEGIN
 IF (SELECT count(*) FROM facodi.curricular_units u
 WHERE u.course_id=(SELECT id FROM facodi.courses WHERE code='LGEST')
 AND u.description_html LIKE '%Como desenvolver esta atividade%')<>41
 THEN RAISE EXCEPTION 'Missing practical guide';END IF;
END $$;