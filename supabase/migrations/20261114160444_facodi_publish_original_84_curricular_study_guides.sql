-- Original editorial study guides based on the official 2026/27 UC names
-- and the topics visible in the associated educational video titles.
-- NOT the university's official learning outcomes or official syllabus.
CREATE TEMP TABLE _facodi_study_guide (
 uc_code text primary key, editorial_summary text not null, suggested_topics text not null
) ON COMMIT DROP;
INSERT INTO _facodi_study_guide VALUES
('14541000','Introdução à metodologia de projeto em design de comunicação: pesquisa, conceitos visuais, composição e desenvolvimento de soluções gráficas.','Fundamentos de design|Pesquisa visual|Processo de projeto'),
('14541006','Desenvolvimento de projetos de comunicação visual com aprofundamento do conceito, linguagem gráfica e apresentação de propostas.','Conceptualização|Identidade visual|Iteração de projeto'),
('14541012','Conceção e desenvolvimento de projetos de design de comunicação com maior autonomia, argumentação e consistência visual.','Projeto integrado|Pesquisa e prototipagem|Comunicação de conceitos'),
('14541018','Desenvolvimento de projetos complexos de comunicação visual, articulando investigação, estratégia e resolução gráfica.','Estratégia de comunicação|Desenvolvimento visual|Apresentação de projeto'),
('14541025','Conceção de experiências multimédia e interativas, com atenção à navegação, interface e relação entre utilizador e conteúdo.','Interação e interface|Prototipagem|Experiência do utilizador'),
('14541026','Análise crítica de imagens e práticas visuais contemporâneas, relacionando cultura, sociedade e meios de comunicação.','Cultura visual|Representações sociais|Análise crítica'),
('14541028','Espaço de discussão, pesquisa e apresentação crítica de temas de design e comunicação, articulando referências e projetos.','Pesquisa|Discussão crítica|Apresentação'),
('14541142','Exploração do desenho como linguagem visual, com observação, proporção, representação e experimentação gráfica.','Observação e representação|Composição|Expressão gráfica'),
('14541143','Contacto inicial com tecnologias, ferramentas e fluxos digitais aplicados à criação e comunicação visual.','Ferramentas gráficas|Fluxos digitais|Produção visual'),
('14541144','Aplicação de ferramentas digitais e procedimentos técnicos na criação, edição e preparação de produtos de design.','Edição digital|Preparação de ficheiros|Fluxos de produção'),
('14541145','Exploração de técnicas de ilustração e representação gráfica aplicadas à expressão de ideias e à comunicação visual.','Técnicas de ilustração|Narrativa visual|Experimentação'),
('14541147','Aprofundamento de tecnologias de produção e edição de conteúdos visuais em projetos de comunicação.','Ferramentas digitais|Produção avançada|Preparação de suportes'),
('14541150','Aplicação de ferramentas e métodos técnicos avançados no desenvolvimento de artefactos visuais e multimédia.','Tecnologias criativas|Prototipagem|Produção'),
('14541152','Integração de competências do curso em projeto aplicado ou estágio, com documentação, reflexão e apresentação de resultados.','Projeto aplicado|Prática profissional|Relatório e apresentação'),
('14541153','Fundamentos da tipografia, anatomia das letras, legibilidade, hierarquia, composição e escolha de famílias tipográficas.','Famílias tipográficas|Legibilidade|Hierarquia e composição'),
('14541154','Análise de marcos históricos e abordagens teóricas que fundamentam a prática do design e a evolução da comunicação gráfica.','História do design|Correntes teóricas|Análise crítica'),
('14541155','Aprofundamento da composição tipográfica, da grelha editorial e do uso expressivo do texto em projetos gráficos.','Tipografia editorial|Grelhas|Expressão tipográfica'),
('14541156','Exploração dos modos de construção, circulação e interpretação das imagens e das mensagens na cultura visual.','Semiótica visual|Imagem e mensagem|Comunicação'),
('14541157','Estudo de movimentos, protagonistas e práticas do design em perspetiva histórica e crítica.','Movimentos do design|Crítica e contexto|Evolução de práticas'),
('14541158','Projeto avançado de design de comunicação, com autonomia na pesquisa, estratégia, conceção e apresentação.','Projeto autoral|Pesquisa aplicada|Comunicação profissional'),
('14541161','Estudo da forma caligráfica, do lettering e da relação entre gesto, letra e composição gráfica.','Caligrafia|Lettering|Composição com letras'),
('14541165','Prática de comunicação em inglês, com ênfase na leitura, escrita e apresentação em contextos académicos e profissionais.','Comunicação oral|Leitura técnica|Vocabulário profissional'),
('14541172','Planeamento, captação e edição de vídeo para comunicação, com articulação entre imagem, som e narrativa.','Captação|Montagem|Narrativa audiovisual'),
('14541178','Introdução à animação tridimensional, abordando princípios de movimento, temporalidade e construção de cenas.','Princípios de animação|Movimento e tempo|Cena 3D'),
('14541181','Estudo da perceção visual, organização da imagem, hierarquia, cor, forma, ritmo e relações compositivas.','Perceção e forma|Hierarquia visual|Composição'),
('14541182','Estudo de materiais, suportes e processos de reprodução e acabamento gráfico, com atenção ao projeto e à produção.','Processos gráficos|Materiais e suportes|Preparação para produção'),
('14541183','Introdução à produção multimédia com integração de imagem, som, vídeo e elementos interativos.','Linguagens multimédia|Produção de conteúdos|Integração de meios'),
('14541184','Fundamentos da linguagem fotográfica: enquadramento, luz, exposição e construção de imagens.','Enquadramento|Luz e exposição|Linguagem fotográfica'),
('14541185','Aprofundamento da prática fotográfica, com controlo da luz, edição, série e narrativa visual.','Projeto fotográfico|Tratamento de imagem|Narrativa'),
('14541187','Ilustração digital aplicada à comunicação, com exploração de ferramentas, estilos, composição e exportação.','Desenho digital|Composição|Aplicações editoriais'),
('14541188','Produção de elementos visuais tridimensionais, incluindo modelação, materiais, iluminação e composição.','Modelação 3D|Materiais e luz|Produção de cenas'),
('14541189','Experimentação dos processos de fotografia analógica, incluindo exposição, revelação e estética do suporte.','Processo analógico|Exposição|Linguagem fotográfica'),
('14541191','Introdução à relação entre design, marcas, posicionamento e comunicação com públicos.','Posicionamento|Comunicação de marca|Estratégia'),
('14541193','Modelação de formas e espaços tridimensionais aplicados ao desenvolvimento de soluções de design de comunicação.','Geometria 3D|Modelação|Visualização'),
('14541194','Exploração de técnicas de registo e montagem de imagens em movimento, com atenção ao ritmo e à narrativa.','Linguagem audiovisual|Captação|Montagem'),
('14541195','Oficina de técnicas de impressão e acabamento, explorando a transposição de projetos visuais para suportes físicos.','Impressão|Oficina e materiais|Acabamentos'),
('14541196','Panorama histórico das linguagens artísticas, com contextualização das transformações que conduziram à arte moderna e contemporânea.','Movimentos artísticos|Contexto histórico|Análise de obras'),
('14541197','Ética, responsabilidade e práticas profissionais do design, com atenção à autoria, sustentabilidade e relação com clientes.','Ética profissional|Autoria|Responsabilidade'),
('14541198','Prática de impressão digital, preparação de ficheiros, escolha de materiais e controlo de produção.','Pré-impressão|Impressão digital|Acabamento'),
('14541199','Exploração de experiências imersivas, realidade virtual e projeção mapeada aplicadas à comunicação visual.','Ambientes imersivos|Videomapping|Prototipagem'),
('14541200','Reflexão sobre processos de ensino e mediação das artes visuais, com desenho de atividades e comunicação de conceitos.','Didática artística|Mediação visual|Planeamento pedagógico'),
('15241279','Introdução a sistemas de automação e robótica, com programação, sensores, atuadores e integração de componentes.','Sensores e atuadores|Automação|Robótica'),
('19411000','Fundamentos de programação: variáveis, tipos, controlo de fluxo, funções e construção de algoritmos.','Lógica de programação|Estruturas de controlo|Funções'),
('19411001','Ferramentas e processos de trabalho colaborativo no desenvolvimento de software, incluindo controlo de versões e integração de alterações.','Git e versões|Colaboração|Integração contínua'),
('19411002','Estudo de funções de uma variável, limites, continuidade, derivadas, aplicações e técnicas fundamentais de integração.','Funções e limites|Derivadas e aplicações|Integrais'),
('19411003','Fundamentos de álgebra linear e geometria analítica, incluindo sistemas lineares, matrizes, vetores e espaços geométricos.','Matrizes e sistemas|Vetores|Geometria analítica'),
('19411004','Fundamentos físicos relevantes para a engenharia, com modelação quantitativa e análise de grandezas e fenómenos.','Grandezas e unidades|Modelação física|Resolução de problemas'),
('19411005','Organização interna dos computadores, representação de informação, processadores, memória e comunicação entre componentes.','Processador e memória|Representação de dados|Arquitetura'),
('19411006','Programação orientada a objetos: classes, objetos, encapsulamento, herança, polimorfismo e desenho de software.','Classes e objetos|Abstração|Reutilização'),
('19411007','Fundamentos da Web: documentos, estilos, interatividade, protocolos e construção de aplicações web.','HTML e CSS|JavaScript|HTTP e aplicações'),
('19411008','Estudo de funções de várias variáveis, limites, derivadas parciais, aproximações, otimização e integração múltipla.','Domínio e continuidade|Derivadas parciais|Integrais múltiplas'),
('19411009','Conceitos de sistemas operativos: processos, memória, sistemas de ficheiros, concorrência e gestão de recursos.','Processos|Gestão de memória|Sistema de ficheiros'),
('19411010','Noções de gestão e organização, com atenção a planeamento, tomada de decisão, recursos e avaliação de resultados.','Planeamento|Organização|Gestão de recursos'),
('19411011','Conceção e análise de algoritmos e estruturas de dados, considerando complexidade, correção e eficiência.','Estruturas de dados|Complexidade|Algoritmos'),
('19411012','Modelação e utilização de bases de dados relacionais: entidades, relações, SQL e integridade dos dados.','Modelo relacional|SQL|Normalização e integridade'),
('19411013','Fundamentos de aprendizagem automática: preparação de dados, aprendizagem supervisionada, avaliação e interpretação de modelos.','Preparação de dados|Modelos supervisionados|Avaliação'),
('19411014','Fundamentos de redes de computadores: camadas, endereçamento, encaminhamento e serviços de comunicação.','Protocolos|Endereçamento|Redes e serviços'),
('19411015','Representação, processamento e visualização de informação gráfica em sistemas computacionais.','Gráficos e imagens|Representação visual|Processamento'),
('19411016','Engenharia de software e ciclo de vida: requisitos, modelação, testes, manutenção e organização do desenvolvimento.','Requisitos|Arquitetura e testes|Processo de software'),
('19411017','Aprofundamento dos sistemas de bases de dados, consultas avançadas, transações, desempenho e funcionalidades de SGBD.','Consultas avançadas|Transações|Desempenho'),
('19411018','Probabilidade, estatística descritiva e inferencial para análise de dados e interpretação da incerteza.','Probabilidades|Distribuições|Inferência estatística'),
('19411019','Desenvolvimento de aplicações para dispositivos móveis, considerando interface, plataformas e integração de serviços.','Interfaces móveis|Aplicações|Integração'),
('19411020','Preparação, exploração e comunicação visual de dados, incluindo estatística descritiva e construção de representações.','Exploração de dados|Visualização|Comunicação de resultados'),
('19411021','Desenvolvimento de aplicações Web, integrando arquitetura, frontend, backend, dados e práticas de segurança.','Frontend e backend|API e dados|Segurança Web'),
('19411022','Introdução a técnicas de inteligência artificial, representação, pesquisa, raciocínio e aplicações inteligentes.','Representação|Pesquisa e raciocínio|Aplicações de IA'),
('19411023','Comunicação oral e escrita em contextos técnicos e de equipa, incluindo estruturação de mensagens e apresentação.','Comunicação técnica|Apresentações|Trabalho em equipa'),
('19411025','Arquitetura e programação de microprocessadores e sistemas digitais de baixo nível.','Processadores|Sistemas digitais|Programação de baixo nível'),
('19411028','Sistemas de computação reconfigurável, com atenção a arquiteturas flexíveis e implementação digital.','Arquiteturas reconfiguráveis|Sistemas digitais|Implementação'),
('19411029','Conceitos e práticas de computação em nuvem, incluindo virtualização, serviços, escalabilidade e implantação.','Infraestrutura cloud|Serviços|Deployment'),
('19411030','Realização de projeto aplicado em contexto organizacional, integrando planeamento, implementação e comunicação.','Projeto aplicado|Desenvolvimento|Documentação'),
('19411031','Experimentação com dispositivos conectados, sensores, comunicação e processamento de dados em IoT.','Sensores|Conectividade|Soluções IoT'),
('19411034','Projeto aplicado em contexto empresarial, com maior autonomia, integração de competências e apresentação de resultados.','Projeto em empresa|Integração|Entrega e avaliação'),
('19411035','Estágio curricular em contexto profissional, com objetivos definidos, prática supervisionada e relatório de atividades.','Estágio|Prática profissional|Relatório'),
('19411036','Projeto curricular final, aplicando métodos de engenharia à resolução documentada de um problema.','Projeto final|Implementação|Apresentação'),
('19411037','Opção curricular escolhida entre ofertas elegíveis da UAlg/ISE; a área concreta depende da unidade selecionada pelo estudante.','Escolha curricular|Regras de opções|Plano individual'),
('19411038','Opção curricular do segundo ano escolhida entre alternativas da UAlg/ISE; o conteúdo depende da escolha efetuada.','Alternativas curriculares|Plano individual|Escolha da UC'),
('19411039','Opção curricular do segundo ano; a disciplina efetiva depende da alternativa escolhida no plano UAlg/ISE.','Escolha curricular|Plano individual|Alternativas'),
('19411040','Opção curricular do segundo ano; o conteúdo formativo depende da unidade escolhida pelo estudante.','Escolha curricular|Plano individual|Alternativas'),
('19411041','Opção curricular do terceiro ano, selecionada entre as alternativas previstas no plano de estudos.','Escolha curricular|Alternativas|Plano individual'),
('19411042','Opção curricular do terceiro ano, selecionada entre as alternativas previstas no plano de estudos.','Escolha curricular|Alternativas|Plano individual'),
('19411043','Opção curricular do terceiro ano, selecionada entre as alternativas previstas no plano de estudos.','Escolha curricular|Alternativas|Plano individual'),
('19411049','Fundamentos de cibersegurança, com identificação de riscos, proteção de sistemas e boas práticas de segurança.','Ameaças e riscos|Proteção de sistemas|Segurança operacional'),
('19411050','Conceção de aplicações utilizando plataformas de desenvolvimento low-code, com atenção a dados, processos e integração.','Modelação visual|Workflows|Integração'),
('19411059','Introdução ao desenvolvimento de jogos digitais, com programação, interação, regras e prototipagem.','Mecânicas|Programação de jogos|Prototipagem');

DO $$ BEGIN
 IF (SELECT count(*) FROM _facodi_study_guide) <> 84 THEN
  RAISE EXCEPTION 'Missing or duplicate study guides: expected 84'; END IF;
 IF (SELECT count(*) FROM facodi.curricular_units u
   JOIN _facodi_study_guide g ON g.uc_code=u.code
   WHERE u.status='active' AND u.published AND
     u.metadata->>'curriculum_review_status'='approved')<>84 THEN
  RAISE EXCEPTION 'Academic active UC count differs from source material'; END IF;
END $$;

UPDATE facodi.curricular_units u SET
 summary=g.editorial_summary,
 description_html=concat(
  '<h2>Orientação de estudo</h2><p>',g.editorial_summary,'</p>',
  '<p><strong>Temas para explorar:</strong> ',
  replace(g.suggested_topics,'|','; '),'.</p>',
  '<p>Este roteiro é uma proposta pedagógica da FACODI, não a ficha oficial da unidade curricular. ',
  'Consulte o plano de estudos da Universidade do Algarve para confirmação académica. ',
  'Os materiais audiovisuais associados são complementares e provenientes dos seus autores.</p>'),
 metadata=coalesce(u.metadata,'{}'::jsonb)||
 jsonb_build_object(
  'study_topics',to_jsonb(string_to_array(g.suggested_topics,'|')),
  'editorial_summary_basis','unit_title_and_related_video_subjects',
  'study_guide_is_official_syllabus',false,
  'study_guide_version','2026-11-14',
  'content_edition','FACODI original pedagogical introduction')
FROM _facodi_study_guide g
WHERE u.code=g.uc_code AND u.published AND u.status='active';

UPDATE facodi.learning_objects lo
SET description=concat(g.editorial_summary,
 '. Temas de apoio: ',replace(g.suggested_topics,'|',', '),
 '. Roteiro introdutório elaborado pela FACODI; não corresponde à ficha oficial da UC.'),
 keywords=string_to_array(g.suggested_topics,'|'),
 metadata=coalesce(lo.metadata,'{}'::jsonb)||
 jsonb_build_object('suggested_topics',to_jsonb(string_to_array(g.suggested_topics,'|')),
  'study_guide_is_official_syllabus',false,
  'study_guide_version','2026-11-14')
FROM facodi.curricular_units u JOIN _facodi_study_guide g ON g.uc_code=u.code
WHERE lo.id=u.learning_object_id AND lo.published=true AND lo.object_type='curricular_unit';

UPDATE facodi.courses c SET
 summary=CASE WHEN c.code='LESTI' THEN
   'Percurso de licenciatura da Universidade do Algarve em engenharia de sistemas e tecnologias informáticas. Explore a estrutura oficial por anos e unidades curriculares, com roteiros introdutórios e recursos audiovisuais complementares selecionados pela FACODI.'
  ELSE
   'Licenciatura da Universidade do Algarve em design de comunicação. Navegue pelas unidades curriculares do plano de estudos, encontre introduções temáticas e aprofunde o trabalho visual com materiais externos selecionados pela FACODI.'
  END,
 description_html=CASE WHEN c.code='LESTI' THEN
  '<h2>O que encontra neste percurso</h2><p>Programação, matemática, bases de dados, sistemas, redes, desenvolvimento de software e aplicações tecnológicas, organizados por anos e semestres do plano oficial de 2026/27.</p><h2>Como utilizar os recursos</h2><p>Escolha uma unidade curricular, consulte os temas sugeridos e explore os vídeos associados. Os recursos externos apoiam o estudo e não substituem docentes, fichas de UC ou avaliação académica.</p><h2>Plano oficial</h2><p>A informação curricular de referência é a publicada pela Universidade do Algarve. As opções alternativas não representam créditos cumulativos.</p>'
  ELSE
  '<h2>O que encontra neste percurso</h2><p>Fundamentos de desenho, tipografia, história da arte e do design, projeto de comunicação, fotografia, tecnologias criativas e multimédia, organizados por anos e semestres do plano oficial de 2026/27.</p><h2>Como utilizar os recursos</h2><p>As unidades apresentam percursos introdutórios e, quando disponíveis, vídeos complementares. A seleção de recursos é editorial e não constitui acreditação ou ficha oficial da UAlg.</p><h2>Plano oficial</h2><p>As unidades de opção são alternativas dentro dos respetivos grupos e não devem ser somadas como obrigatórias.</p>' END,
 metadata=coalesce(c.metadata,'{}'::jsonb)||
  jsonb_build_object('study_guide_version','2026-11-14',
   'study_guide_is_official_syllabus',false)
WHERE c.code IN ('LESTI','LDCOM') AND c.published;

UPDATE facodi.learning_objects lo SET
 description=c.summary,
 metadata=coalesce(lo.metadata,'{}'::jsonb)||
  jsonb_build_object('study_guide_version','2026-11-14',
   'study_guide_is_official_syllabus',false)
FROM facodi.courses c
WHERE lo.id=c.learning_object_id AND c.published AND c.code IN ('LESTI','LDCOM');
