
-- Source: UFES Letras Inglês — PPC 2019 marked "Situação: Corrente".
-- Complete catalog of 75 official codes, not a 75-discipline student schedule.
-- The 45 offered electives are choices, not cumulatively mandatory hours.
CREATE TEMP TABLE _ufes83_units ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset($ufes2019$[{"code":"EPS13106","title":"FUNDAMENTOS HISTÓRICOS E FILOSÓFICOS DA EDUCAÇÃO","hours":60,"credits":4,"period":1,"year":1,"semester":1,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":1,"prerequisite":null},{"code":"LET13915","title":"ESTRUTURA DA LÍNGUA INGLESA I","hours":90,"credits":6,"period":1,"year":1,"semester":1,"group":"mandatory","topics":["Organização formal e usos da língua","Análise de formas, sentidos e variações linguísticas","Aplicação de conceitos a exemplos em inglês"],"ordinal":2,"prerequisite":null},{"code":"LET13917","title":"INTRODUÇÃO AOS ESTUDOS LINGUÍSTICOS","hours":60,"credits":4,"period":1,"year":1,"semester":1,"group":"mandatory","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":3,"prerequisite":null},{"code":"LET13916","title":"PRÁXIS CURRICULAR: COMUNICAÇÃO ORAL","hours":75,"credits":2,"period":1,"year":1,"semester":1,"group":"mandatory","topics":["Fundamentos e vocabulário de práxis curricular: comunicação oral","Abordagens e debates do campo de práxis curricular: comunicação oral","Estudos de caso e reflexão crítica sobre o tema"],"ordinal":4,"prerequisite":null},{"code":"PSI00764","title":"PSICOLOGIA DA EDUCACAO","hours":60,"credits":4,"period":1,"year":1,"semester":1,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":5,"prerequisite":null},{"code":"LET13920","title":"PRÁXIS CURRICULAR: LETRAMENTOS","hours":75,"credits":2,"period":2,"year":1,"semester":2,"group":"mandatory","topics":["Fundamentos e vocabulário de práxis curricular: letramentos","Abordagens e debates do campo de práxis curricular: letramentos","Estudos de caso e reflexão crítica sobre o tema"],"ordinal":6,"prerequisite":null},{"code":"LET13918","title":"ESTRUTURA DA LÍNGUA INGLESA II","hours":90,"credits":6,"period":2,"year":1,"semester":2,"group":"mandatory","topics":["Organização formal e usos da língua","Análise de formas, sentidos e variações linguísticas","Aplicação de conceitos a exemplos em inglês"],"ordinal":7,"prerequisite":null},{"code":"LET13919","title":"METODOLOGIAS DE ENSINO DE LÍNGUA INGLESA","hours":60,"credits":4,"period":2,"year":1,"semester":2,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":8,"prerequisite":null},{"code":"EPS13687","title":"POLÍTICA E ORGANIZAÇÃO DA EDUCAÇÃO BÁSICA","hours":60,"credits":4,"period":2,"year":1,"semester":2,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":9,"prerequisite":null},{"code":"LET13921","title":"LÍNGUA INGLESA: ESTUDOS DO DISCURSO","hours":75,"credits":5,"period":3,"year":2,"semester":1,"group":"mandatory","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":10,"prerequisite":null},{"code":"LET13923","title":"INTRODUÇÃO AOS ESTUDOS LITERÁRIOS","hours":60,"credits":4,"period":3,"year":2,"semester":1,"group":"mandatory","topics":["Fundamentos e vocabulário de introdução aos estudos literários","Abordagens e debates do campo de introdução aos estudos literários","Estudos de caso e reflexão crítica sobre o tema"],"ordinal":11,"prerequisite":null},{"code":"LCE13705","title":"DIDÁTICA","hours":60,"credits":4,"period":3,"year":2,"semester":1,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":12,"prerequisite":null},{"code":"LET13922","title":"HISTÓRIA DA LÍNGUA INGLESA ATRAVÉS DA LITERATURA","hours":75,"credits":5,"period":3,"year":2,"semester":1,"group":"mandatory","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":13,"prerequisite":null},{"code":"LET13924","title":"INTRODUÇÃO AOS ESTUDOS DA TRADUÇÃO","hours":75,"credits":5,"period":4,"year":2,"semester":2,"group":"mandatory","topics":["Princípios e contextos da tradução","Análise comparativa e escolhas tradutórias","Tradução como prática cultural e educacional"],"ordinal":14,"prerequisite":null},{"code":"LET13925","title":"LITERATURAS ANGLÓFONAS DO SÉC. XVII A XIX","hours":75,"credits":5,"period":4,"year":2,"semester":2,"group":"mandatory","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":15,"prerequisite":null},{"code":"TEP13690","title":"EDUCAÇÃO DAS RELAÇÕES ÉTNICO-RACIAIS","hours":60,"credits":4,"period":4,"year":2,"semester":2,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":16,"prerequisite":null},{"code":"LET13926","title":"PRÁXIS CURRICULAR: ESCRITA ACADÊMICA","hours":60,"credits":2,"period":4,"year":2,"semester":2,"group":"mandatory","topics":["Fundamentos e vocabulário de práxis curricular: escrita acadêmica","Abordagens e debates do campo de práxis curricular: escrita acadêmica","Estudos de caso e reflexão crítica sobre o tema"],"ordinal":17,"prerequisite":null},{"code":"LCE13698","title":"FUNDAMENTOS DA LÍNGUA BRASILEIRA DE SINAIS","hours":60,"credits":4,"period":5,"year":3,"semester":1,"group":"mandatory","topics":["Fundamentos e vocabulário de fundamentos da língua brasileira de sinais","Abordagens e debates do campo de fundamentos da língua brasileira de sinais","Estudos de caso e reflexão crítica sobre o tema"],"ordinal":18,"prerequisite":null},{"code":"LET13929","title":"PRÁXIS CURRICULAR: TRADUÇÃO E ENSINO","hours":75,"credits":2,"period":5,"year":3,"semester":1,"group":"mandatory","topics":["Princípios e contextos da tradução","Análise comparativa e escolhas tradutórias","Tradução como prática cultural e educacional"],"ordinal":19,"prerequisite":null},{"code":"LET13928","title":"LITERATURAS ANGLÓFONAS DO SÉC. XX A XXI","hours":75,"credits":5,"period":5,"year":3,"semester":1,"group":"mandatory","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":20,"prerequisite":null},{"code":"LET13927","title":"INTRODUÇÃO À LINGUÍSTICA APLICADA","hours":75,"credits":5,"period":5,"year":3,"semester":1,"group":"mandatory","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":21,"prerequisite":null},{"code":"TEP13129","title":"CURRÍCULO DA EDUCAÇÃO BÁSICA","hours":60,"credits":4,"period":6,"year":3,"semester":2,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":22,"prerequisite":null},{"code":"LET13930","title":"PRÁXIS CURRICULAR: LITERATURA E ENSINO","hours":60,"credits":2,"period":6,"year":3,"semester":2,"group":"mandatory","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":23,"prerequisite":null},{"code":"LET13931","title":"PRÁXIS CURRICULAR: PESQUISA E ENSINO","hours":60,"credits":2,"period":7,"year":4,"semester":1,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":24,"prerequisite":null},{"code":"TEP13131","title":"EDUCAÇÃO E DIVERSIDADE","hours":60,"credits":4,"period":7,"year":4,"semester":1,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":25,"prerequisite":null},{"code":"CSO03274","title":"SOCIOLOGIA DA EDUCACAO","hours":60,"credits":4,"period":8,"year":4,"semester":2,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":26,"prerequisite":null},{"code":"LET13932","title":"TRABALHO DE CONCLUSÃO DE CURSO","hours":75,"credits":5,"period":8,"year":4,"semester":2,"group":"mandatory","topics":["Fundamentos e vocabulário de trabalho de conclusão de curso","Abordagens e debates do campo de trabalho de conclusão de curso","Estudos de caso e reflexão crítica sobre o tema"],"ordinal":27,"prerequisite":null},{"code":"EPS13133","title":"GESTÃO DA EDUCAÇÃO BÁSICA","hours":60,"credits":4,"period":8,"year":4,"semester":2,"group":"mandatory","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":28,"prerequisite":null},{"code":"LCE13933","title":"ESTÁGIO CURRICULAR SUPERVISIONADO DE LÍNGUA INGLESA I","hours":200,"credits":9,"period":6,"year":3,"semester":2,"group":"internship","topics":["Observação de práticas e contextos de ensino de inglês","Planejamento, regência e mediação de atividades pedagógicas","Reflexão crítica e avaliação da experiência supervisionada"],"ordinal":29,"prerequisite":"LCE13705"},{"code":"LCE13934","title":"ESTÁGIO CURRICULAR SUPERVISIONADO DE LÍNGUA INGLESA II","hours":200,"credits":9,"period":7,"year":4,"semester":1,"group":"internship","topics":["Observação de práticas e contextos de ensino de inglês","Planejamento, regência e mediação de atividades pedagógicas","Reflexão crítica e avaliação da experiência supervisionada"],"ordinal":30,"prerequisite":"LCE13933"},{"code":"LET13954","title":"ENSINO DE LÍNGUA INGLESA NO BRASIL","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":31,"prerequisite":null},{"code":"LET13937","title":"TÓPICOS EM ESTUDOS LINGUÍSTICOS","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":32,"prerequisite":null},{"code":"LET13940","title":"INTRODUÇÃO À FILOSOFIA DA LINGUAGEM","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":33,"prerequisite":null},{"code":"LET13943","title":"ANÁLISE, ELABORAÇÃO E ADAPTAÇÃO DE MATERIAL DIDÁTICO","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":34,"prerequisite":null},{"code":"LET13952","title":"INTRODUÇÃO À METODOLOGIA DE PESQUISA EM LINGUÍSTICA E EM LINGUÍSTICA APLICADA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":35,"prerequisite":null},{"code":"LET13956","title":"LÍNGUAS ESTRANGEIRAS E O CURRÍCULO DA EDUCAÇÃO BÁSICA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":36,"prerequisite":null},{"code":"LET15836","title":"PRÁTICAS DE ENSINO-APRENDIZAGEM DA LÍNGUA INGLESA I","hours":75,"credits":2,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":37,"prerequisite":null},{"code":"LET13939","title":"ESCRITA ACADÊMICA EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Práticas comunicativas e letramentos em língua inglesa","Análise de gêneros e discursos orais e escritos","Produção e reflexão sobre textos em contextos autênticos"],"ordinal":38,"prerequisite":null},{"code":"LET13941","title":"TÓPICOS EM LINGUÍSTICA APLICADA CRÍTICA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":39,"prerequisite":null},{"code":"LET13946","title":"LÍNGUA INGLESA: TÓPICOS EM COMUNICAÇÃO ORAL II","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Práticas comunicativas e letramentos em língua inglesa","Análise de gêneros e discursos orais e escritos","Produção e reflexão sobre textos em contextos autênticos"],"ordinal":40,"prerequisite":null},{"code":"LET13949","title":"LÍNGUA INGLESA: LETRAMENTOS","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Práticas comunicativas e letramentos em língua inglesa","Análise de gêneros e discursos orais e escritos","Produção e reflexão sobre textos em contextos autênticos"],"ordinal":41,"prerequisite":null},{"code":"LET13945","title":"LÍNGUA INGLESA: TÓPICOS EM COMUNICAÇÃO ORAL I","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Práticas comunicativas e letramentos em língua inglesa","Análise de gêneros e discursos orais e escritos","Produção e reflexão sobre textos em contextos autênticos"],"ordinal":42,"prerequisite":null},{"code":"LET13951","title":"COMUNICAÇÃO ORAL NA LÍNGUA INGLESA: ESTRATÉGIAS DE ENSINO","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Práticas comunicativas e letramentos em língua inglesa","Análise de gêneros e discursos orais e escritos","Produção e reflexão sobre textos em contextos autênticos"],"ordinal":43,"prerequisite":null},{"code":"LET13955","title":"QUESTÕES DE IDENTIDADE E O ENSINO DE INGLÊS","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":44,"prerequisite":null},{"code":"LET13936","title":"LÍNGUA INGLESA: PESQUISA NAS CIÊNCIAS HUMANAS","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":45,"prerequisite":null},{"code":"LET13950","title":"LÍNGUA INGLESA: LINGUAGEM E TECNOLOGIAS","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":46,"prerequisite":null},{"code":"LET13935","title":"LÍNGUA INGLESA: A SOCIOLINGUÍSTICA DO INGLÊS","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":47,"prerequisite":null},{"code":"LET13944","title":"A PRÁTICA DOCENTE DO PROFESSOR DE LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Fundamentos e vocabulário de a prática docente do professor de língua inglesa","Abordagens e debates do campo de a prática docente do professor de língua inglesa","Estudos de caso e reflexão crítica sobre o tema"],"ordinal":48,"prerequisite":null},{"code":"LET13953","title":"LINGUÍSTICA APLICADA: PROCESSOS INTERACIONAIS","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":49,"prerequisite":null},{"code":"LET13957","title":"AVALIAÇÃO E ENSINO DE LÍNGUAS","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":50,"prerequisite":null},{"code":"LET13938","title":"TÓPICOS EM TRADUÇÃO","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Princípios e contextos da tradução","Análise comparativa e escolhas tradutórias","Tradução como prática cultural e educacional"],"ordinal":51,"prerequisite":null},{"code":"LET13942","title":"O ENSINO DO INGLÊS NA EDUCAÇÃO INFANTIL","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":52,"prerequisite":null},{"code":"LET13947","title":"ESTUDOS DE CULTURA E O ENSINO DE LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":53,"prerequisite":null},{"code":"LET13958","title":"ENSINO DE INGLÊS PARA FINS ESPECÍFICOS","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_linguistics","topics":["Fundamentos e políticas da educação","Planejamento e mediação do processo de ensino-aprendizagem","Reflexão crítica sobre práticas e diversidade educacional"],"ordinal":54,"prerequisite":null},{"code":"LET13960","title":"LITERATURA DE MINORIAS EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":55,"prerequisite":null},{"code":"LET13968","title":"TÓPICOS ESPECIAIS EM CRÍTICA LITERÁRIA EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":56,"prerequisite":null},{"code":"LET13962","title":"ANÁLISE ESTILÍSTICA E LITERÁRIA DE CONTOS EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Fundamentos e vocabulário de análise estilística e literária de contos em língua inglesa","Abordagens e debates do campo de análise estilística e literária de contos em língua inglesa","Estudos de caso e reflexão crítica sobre o tema"],"ordinal":57,"prerequisite":null},{"code":"LET13961","title":"LITERATURA MEDIEVAL EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":58,"prerequisite":null},{"code":"LET13964","title":"TEATRO RENASCENTISTA EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":59,"prerequisite":null},{"code":"LET13969","title":"LITERATURA E OUTRAS ARTES EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":60,"prerequisite":null},{"code":"LET13963","title":"LITERATURA EM LÍNGUA INGLESA: CÂNONE E OCIDENTALISMO","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":61,"prerequisite":null},{"code":"LET13959","title":"LITERATURA DE IMIGRANTES EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":62,"prerequisite":null},{"code":"LET13967","title":"LITERATURA COMPARADA EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":63,"prerequisite":null},{"code":"LET13965","title":"ESTUDO DE BEST SELLERS EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":64,"prerequisite":null},{"code":"LET13966","title":"TÓPICOS ESPECIAIS EM LITERATURA EM LÍNGUA INGLESA","hours":75,"credits":5,"period":null,"year":null,"semester":null,"group":"opt_english_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":65,"prerequisite":null},{"code":"LET05151","title":"SEMÂNTICA","hours":60,"credits":4,"period":null,"year":null,"semester":null,"group":"opt_general_linguistics","topics":["Organização formal e usos da língua","Análise de formas, sentidos e variações linguísticas","Aplicação de conceitos a exemplos em inglês"],"ordinal":66,"prerequisite":null},{"code":"LET10553","title":"PORTUGUÊS: LÍNGUA ESTRANGEIRA","hours":60,"credits":3,"period":null,"year":null,"semester":null,"group":"opt_general_linguistics","topics":["Fundamentos e vocabulário de português: língua estrangeira","Abordagens e debates do campo de português: língua estrangeira","Estudos de caso e reflexão crítica sobre o tema"],"ordinal":67,"prerequisite":null},{"code":"LET09456","title":"HISTÓRIA DA LINGÜÍSTICA","hours":60,"credits":4,"period":null,"year":null,"semester":null,"group":"opt_general_linguistics","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":68,"prerequisite":null},{"code":"LET05805","title":"FONÉTICA E FONOLOGIA","hours":60,"credits":4,"period":null,"year":null,"semester":null,"group":"opt_general_linguistics","topics":["Organização formal e usos da língua","Análise de formas, sentidos e variações linguísticas","Aplicação de conceitos a exemplos em inglês"],"ordinal":69,"prerequisite":null},{"code":"LET05110","title":"SOCIOLINGUISTICA","hours":60,"credits":4,"period":null,"year":null,"semester":null,"group":"opt_general_linguistics","topics":["Conceitos e métodos da análise da linguagem","Língua, cultura, poder e contexto social","Aplicação de perspectivas linguísticas a textos e práticas"],"ordinal":70,"prerequisite":null},{"code":"LET13971","title":"LITERATURAS DE LÍNGUA PORTUGUESA: QUESTÕES ESPECÍFICAS","hours":60,"credits":4,"period":null,"year":null,"semester":null,"group":"opt_general_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":71,"prerequisite":null},{"code":"LET13974","title":"LITERATURA DO ESPÍRITO SANTO","hours":60,"credits":4,"period":null,"year":null,"semester":null,"group":"opt_general_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":72,"prerequisite":null},{"code":"LET13972","title":"LITERATURA INFANTIL E JUVENIL","hours":60,"credits":4,"period":null,"year":null,"semester":null,"group":"opt_general_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":73,"prerequisite":null},{"code":"LET13973","title":"CÂNONES DA CRÍTICA INTERNACIONAL","hours":60,"credits":4,"period":null,"year":null,"semester":null,"group":"opt_general_literature","topics":["Contextos históricos e culturais da produção literária","Leitura e interpretação crítica de obras e gêneros","Representação, identidade e diálogo intercultural na literatura"],"ordinal":74,"prerequisite":null},{"code":"LET13970","title":"ESTUDOS LITERÁRIOS: TEORIA E CRÍTICA","hours":60,"credits":4,"period":null,"year":null,"semester":null,"group":"opt_general_literature","topics":["Fundamentos e vocabulário de estudos literários: teoria e crítica","Abordagens e debates do campo de estudos literários: teoria e crítica","Estudos de caso e reflexão crítica sobre o tema"],"ordinal":75,"prerequisite":null}]$ufes2019$::jsonb)
 AS r(code text,title text,hours int,credits int,period int,year int,semester int,
 "group" text,topics jsonb,ordinal int,prerequisite text);

DO $guard$ BEGIN
 IF (SELECT count(*) FROM _ufes83_units)<>75 OR
    (SELECT count(distinct code) FROM _ufes83_units)<>75
 THEN RAISE EXCEPTION 'Official curriculum must contain 75 distinct subject codes'; END IF;
 IF (SELECT sum(hours) FROM _ufes83_units WHERE "group"='mandatory')<>1890
 OR (SELECT sum(hours) FROM _ufes83_units WHERE "group"='internship')<>400
 OR (SELECT count(*) FROM _ufes83_units WHERE "group" LIKE 'opt_%')<>45
 THEN RAISE EXCEPTION 'PPC 2019 official required totals mismatch'; END IF;
 IF EXISTS (SELECT 1 FROM _ufes83_units WHERE code !~ '^[A-Z]{3}[0-9]{5}$'
 OR title='' OR hours<=0 OR credits<=0 OR jsonb_array_length(topics)<>3)
 THEN RAISE EXCEPTION 'Invalid source subject'; END IF;
 IF EXISTS (SELECT 1 FROM facodi.courses WHERE slug='ufes-letras-ingles' AND code<>'UFES-LETRAS-ING-83-2019')
 THEN RAISE EXCEPTION 'Existing course slug conflicts with import'; END IF;
END $guard$;

INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,language,status,published,source_type,
 source_url,source_id,tags,metadata)
VALUES (
 md5('facodi:ufes:83:2019:course-object')::uuid,'course',
 'Licenciatura em Língua Inglesa e Literaturas de Língua Inglesa',
 'ufes-letras-ingles',
 'Licenciatura presencial da Universidade Federal do Espírito Santo, campus Goiabeiras, Vitória. Formação em linguística, literaturas anglófonas e docência de inglês na Educação Básica. O catálogo FACODI segue o PPC 2019 e preserva separadamente os blocos de optativas e a prática supervisionada.',
 'pt','active',true,'external',
 'https://letras.ufes.br/pt-br/estrutura-do-curso-de-letras-ingles',
 'UFES-83-PPC2019',ARRAY['UFES','Letras','Língua Inglesa','Licenciatura','PPC 2019'],
 jsonb_build_object('institution','UFES','campus','Goiabeiras',
 'country','Brasil','state','Espírito Santo','city','Vitória','official_course_code','83',
 'curriculum_version','2019','official_curriculum_verified',true,
 'official_ppc_url','https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf',
 'course_hours_total',3210,'no_ects_conversion',true,
 'official_source_is_course_website',true,
 'facodi_is_independent',true,'facodi_editorial_guides_not_official',true)
)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.courses(
 id,learning_object_id,code,external_source,external_id,slug,title,normalized_title,
 summary,degree_type,language,school,source_url,plan_url,status,published,institution,
 ects_total,duration_semesters,metadata)
VALUES (
 md5('facodi:ufes:83:2019:course')::uuid,
 md5('facodi:ufes:83:2019:course-object')::uuid,
 'UFES-LETRAS-ING-83-2019','ufes_official_ppc','83:2019','ufes-letras-ingles',
 'Licenciatura em Língua Inglesa e Literaturas de Língua Inglesa',
 'licenciatura em lingua inglesa e literaturas de lingua inglesa',
 'Formação de professores de inglês para Educação Básica, com estudos linguísticos, literários, culturais e pedagógicos. PPC 2019: 3.210 horas em oito períodos, com escolhas obrigatórias de optativas. A FACODI disponibiliza um catálogo independente, não uma oferta oficial da UFES.',
 'Licenciatura','pt',
 'Centro de Ciências Humanas e Naturais (CCHN) — UFES',
 'https://letras.ufes.br/pt-br/estrutura-do-curso-de-letras-ingles',
 'https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf','active',true,
 'Universidade Federal do Espírito Santo (UFES)',NULL,8,
 jsonb_build_object(
 'official_course_code','83','curriculum_version','2019',
 'official_ppc_situation','corrente','ppc_url','https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf',
 'official_profile_url','https://letras.ufes.br/pt-br/apresentacao-0',
 'official_curriculum_matrix_url','https://letras.ufes.br/pt-br/matriz-curricular-3',
 'institution','UFES','institution_type','federal_public_university',
 'degree','Licenciatura','mode','presencial','study_shift','integral',
 'campus','Goiabeiras','city','Vitória','state','Espírito Santo','country','Brasil',
 'minimum_semesters',8,'maximum_semesters',12,'official_course_hours',3210,
 'mandatory_discipline_hours',1890,'elective_selection_hours',720,
 'supervised_internship_hours',400,'complementary_activities_hours',200,
 'praxis_hours_within_mandatory',405,'pedagogical_hours_within_course',660,
 'elective_groups',jsonb_build_array(
   jsonb_build_object('id','opt_english_linguistics','choose',5,'required_hours',375,'available',24),
   jsonb_build_object('id','opt_english_literature','choose',3,'required_hours',225,'available',11),
   jsonb_build_object('id','opt_general_linguistics','choose',1,'required_hours',60,'available',5),
   jsonb_build_object('id','opt_general_literature','choose',1,'required_hours',60,'available',5)
 ),
 'scheduled_elective_slots',jsonb_build_array(
  jsonb_build_object('period',2,'english_optatives',1),
  jsonb_build_object('period',3,'english_optatives',1),
  jsonb_build_object('period',4,'general_letras_optatives',1),
  jsonb_build_object('period',5,'general_letras_optatives',1),
  jsonb_build_object('period',6,'english_optatives',2),
  jsonb_build_object('period',7,'english_optatives',2),
  jsonb_build_object('period',8,'english_optatives',2)
 ),
 'official_component_count',75,'mandatory_component_count',28,
 'internship_component_count',2,'available_elective_components',45,
 'brazilian_credits_not_ects',true,'ects_not_applicable',true,
 'annual_vacancies_ppc2019',60,
 'hours_conflict_with_prograd_page',jsonb_build_object(
  'ppc2019',3210,'prograd_page',3240,'note','divergência entre fontes oficiais; adota-se a matriz detalhada do PPC 2019'),
 'publication_basis','official_ufes_ppc2019',
 'is_affiliated_with_ufes',false,
 'syllabus_is_not_reproduced',true,
 'facodi_original_study_guides_are_not_official_ufes',true)
)
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_objects(
 id,object_type,title,slug,description,language,status,published,source_type,
 source_url,source_id,tags,metadata)
SELECT md5('facodi:ufes:83:2019:uc-object:'||u.code)::uuid,
 'curricular_unit',u.title,'ufes-ingles-'||lower(u.code),
 concat('Componente do PPC 2019 de Letras Inglês da UFES (código ',u.code,
 '). Carga horária: ',u.hours,'h. ',
 CASE WHEN u."group"='mandatory' THEN 'Obrigatório.'
 WHEN u."group"='internship' THEN 'Estágio supervisionado obrigatório.'
 ELSE 'Disciplina disponível em bloco de optativas: nem todas as alternativas são cursadas por um estudante.' END,
 ' Para a ementa oficial, consulte o PPC da universidade.'),
 'pt','active',true,'external','https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf',u.code,
 ARRAY['UFES','Letras Inglês',u.code],
 jsonb_build_object('official_code',u.code,'official_title',u.title,
 'official_ppc_url','https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf','curriculum_version','2019',
 'official_hours',u.hours,'brazilian_course_credits',u.credits,
 'category',u."group",'prerequisite_code',u.prerequisite,
 'study_topics',u.topics,'editorial_study_topics',true,
 'official_syllabus_not_copied',true,
 'full_official_ementa_at_source',true,
 'ects_not_applicable',true,
 'source_type','ufes_ppc2019')
FROM _ufes83_units u
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.curricular_units(
 id,learning_object_id,course_id,code,external_source,external_id,slug,title,
 normalized_title,summary,year,semester,ects,position,language,
 source_url,plan_url,status,published,metadata)
SELECT md5('facodi:ufes:83:2019:uc:'||u.code)::uuid,
 md5('facodi:ufes:83:2019:uc-object:'||u.code)::uuid,
 md5('facodi:ufes:83:2019:course')::uuid,u.code,'ufes_official_ppc2019',
 u.code,'ufes-ingles-'||lower(u.code),u.title,lower(u.title),
 concat(u.hours,' horas do PPC 2019 da UFES (',u.code,'). ',
 CASE WHEN u."group"='mandatory' THEN 'Componente obrigatório.'
 WHEN u."group"='internship' THEN 'Estágio obrigatório, com pré-requisito a observar.'
 ELSE 'Optativa pertencente a bloco de escolha; não é obrigatória individualmente.' END,
 ' Os temas de estudo FACODI não substituem a ementa oficial.'),
 u.year,u.semester,NULL,u.ordinal,'pt','https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf','https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf',
 'active',true,
 jsonb_build_object(
  'official_code',u.code,'official_title',u.title,
  'official_hours',u.hours,'brazilian_course_credits',u.credits,
  'official_ppc_2019',true,'official_semester_period',u.period,
  'academic_regime','semestre','curricular_category',u."group",
  'elective_group',CASE WHEN u."group" LIKE 'opt_%' THEN u."group" ELSE NULL END,
  'optional_not_cumulative',u."group" LIKE 'opt_%',
  'prerequisite_code',u.prerequisite,
  'study_topics',u.topics,'study_topics_are_facodi_editorial',true,
  'ects_not_applicable',true,'not_official_fuc',true,
  'official_ppc_url','https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf','source_institution','UFES',
  'curriculum_version','2019','source_document_pages','14-18',
  'authoritative_source','UFES official PPC 2019')
FROM _ufes83_units u
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes:83:2019:course-unit-link:'||u.code)::uuid,
 md5('facodi:ufes:83:2019:course-object')::uuid,
 md5('facodi:ufes:83:2019:uc-object:'||u.code)::uuid,
 'contains',u.ordinal,'structured_catalog_import',
 jsonb_build_object('source','UFES PPC 2019','review_status','approved',
  'curricular_group',u."group",'semester_period',u.period,
  'is_elective_candidate',u."group" LIKE 'opt_%','official_code',u.code)
FROM _ufes83_units u
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.learning_object_relations(
 id,parent_object_id,child_object_id,relation_type,position,created_by_mechanism,metadata)
SELECT md5('facodi:ufes:83:2019:prerequisite:'||u.code)::uuid,
 md5('facodi:ufes:83:2019:uc-object:'||u.prerequisite)::uuid,
 md5('facodi:ufes:83:2019:uc-object:'||u.code)::uuid,
 'prerequisite_of',NULL,'structured_catalog_import',
 jsonb_build_object('source','UFES PPC 2019','review_status','approved','official_prerequisite',true)
FROM _ufes83_units u WHERE u.prerequisite IS NOT NULL
ON CONFLICT(parent_object_id,child_object_id,relation_type) DO NOTHING;

INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
SELECT md5('facodi:ufes:83:2019:source:'||u.code)::uuid,
 md5('facodi:ufes:83:2019:uc-object:'||u.code)::uuid,
 'document',u.code,'https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf','UFES — PPC Letras Inglês 2019',
 jsonb_build_object('document_section','Disciplinas do currículo','official_code',u.code,
  'source_institution','UFES','source_kind','official_curriculum_matrix')
FROM _ufes83_units u
ON CONFLICT(id) DO NOTHING;

INSERT INTO facodi.external_sources(
 id,learning_object_id,source_type,external_id,source_url,title,metadata)
VALUES(
 md5('facodi:ufes:83:2019:source:course')::uuid,
 md5('facodi:ufes:83:2019:course-object')::uuid,
 'document','83:2019','https://letras.ufes.br/sites/letras.ufes.br/files/field/anexo/ppc_lingua_e_literatura_inglesa_-_licenciaturaatual.pdf',
 'UFES — Projeto Pedagógico de Letras Inglês 2019',
 jsonb_build_object('document_section','Identificação, organização curricular e matriz',
 'official_source',true,'source_institution','UFES')
)
ON CONFLICT(id) DO NOTHING;

DO $final$ BEGIN
 IF (SELECT count(*) FROM facodi.courses WHERE code='UFES-LETRAS-ING-83-2019' AND published)<>1
 OR (SELECT count(*) FROM facodi.curricular_units WHERE course_id=
  md5('facodi:ufes:83:2019:course')::uuid AND published)<>75
 THEN RAISE EXCEPTION 'Incomplete UFES official curriculum publication'; END IF;
 IF (SELECT sum((metadata->>'official_hours')::int) FROM facodi.curricular_units
  WHERE course_id=md5('facodi:ufes:83:2019:course')::uuid
    AND metadata->>'curricular_category'='mandatory') <>1890
 THEN RAISE EXCEPTION 'Mandatory hours do not reconcile'; END IF;
END $final$;
