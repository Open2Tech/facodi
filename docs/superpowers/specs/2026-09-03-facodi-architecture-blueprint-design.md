# FACODI — Blueprint Arquitetural do Addon Odoo Community

**Versão conceptual:** 1.0  
**Data:** 3 de setembro de 2026  
**Estado:** proposta funcional para revisão  
**Âmbito:** arquitetura visual e funcional; não define classes Python, tabelas SQL, vistas XML ou contratos técnicos definitivos.

## Artefactos navegáveis

- **Lucidchart (17 páginas):** https://lucid.app/lucidchart/a4dd1b70-922c-416a-8390-3bd7886d8c7f/edit
- **Pasta FACODI no Google Drive:** https://drive.google.com/drive/folders/1f1LoZ6KeyWvG0aMzrl3verS7zTdmCEXm
- **Especificação no Google Drive:** https://drive.google.com/file/d/1MXZ1N7AZtERkrUwQUbikYi4D2nbqffGT/view
- **Branch documental no GitHub:** https://github.com/Open2Tech/facodi/tree/docs/facodi-architecture-blueprint

## 1. Propósito

Este blueprint descreve uma evolução simples e coerente do FACODI — Faculdade Comunitária Digital sobre Odoo Community. O FACODI organiza currículos universitários e relaciona-os com recursos educativos públicos ou abertos, preservando autoria, direitos, proveniência, revisão humana e publicação controlada.

O addon FACODI é uma camada de domínio, inteligência e curadoria sobre o ecossistema Odoo. Não constitui um LMS paralelo, um segundo sistema de utilizadores ou uma base de conteúdos concorrente.

## 2. Autoridade desta proposta

A proposta foi concebida de raiz a partir do briefing funcional atual do FACODI e dos mecanismos Standard disponíveis no Odoo Community. Documentação arquitetural anterior, modelos Supabase, pipelines experimentais e propostas de infraestrutura anteriores não são fontes desta arquitetura.

Elementos históricos do projeto servem apenas para confirmar o contexto institucional, a existência de currículos e a missão educativa. Não determinam os limites, nomes ou responsabilidades aqui propostos.

## 3. Princípios arquiteturais

1. **Odoo primeiro:** usar Standard, depois estender Standard, depois relacionar Standard e criar uma responsabilidade FACODI apenas quando o domínio não couber corretamente no núcleo.
2. **Uma fonte operacional de verdade:** Odoo conserva os estados editoriais, decisões humanas, publicação e identidade operacional.
3. **IA propõe, pessoas decidem:** nenhuma inferência publica, elimina ou altera conteúdo aprovado sem decisão humana.
4. **Conteúdo público não equivale a conteúdo livre:** cada recurso passa por verificação de direitos e por uma estratégia de utilização adequada.
5. **Proveniência ponta a ponta:** fonte, captura, análise, proposta, decisão, publicação e atualização permanecem relacionáveis.
6. **Sem duplicação semântica:** idiomas, versões e diferentes utilizações do mesmo recurso preservam uma identidade comum sempre que possível.
7. **Publicação nativa:** aquilo que o estudante utiliza é publicado através dos mecanismos do Odoo Website/eLearning.
8. **Arquitetura progressiva:** ingestão, curadoria e publicação podem começar de forma simples e receber automação adicional sem mudar o núcleo conceptual.

## 4. Núcleo funcional

O núcleo divide-se em cinco responsabilidades:

### 4.1 Odoo Standard

- Website e catálogo público;
- eLearning, cursos, secções, conteúdos, recursos adicionais e quizzes;
- contactos, utilizadores, grupos, portal, inscrições e progresso;
- chatter, mensagens, seguidores e atividades;
- anexos e ligações a ficheiros;
- etiquetas e taxonomias simples;
- tarefas operacionais quando o módulo Projetos for utilizado;
- processamento agendado através de cron.

### 4.2 Domínio FACODI

- instituições, programas académicos, versões curriculares e unidades curriculares;
- tópicos, objetivos de aprendizagem e competências com relações educativas explícitas;
- registo de fontes externas, versões e snapshots;
- propostas de análise produzidas por IA;
- correspondências entre recursos e currículo;
- avaliação de cobertura e lacunas;
- composições candidatas de playlists, módulos e percursos;
- decisões de curadoria, justificações e rastreabilidade da publicação.

### 4.3 Fontes externas

- YouTube, canais e playlists;
- websites e repositórios de recursos educativos abertos;
- PDFs, livros, artigos e documentos académicos;
- planos de estudos, fichas de unidades curriculares e bibliografias;
- conteúdos já existentes no Odoo;
- futuras APIs e catálogos externos.

### 4.4 Serviços de inteligência opcionais

- extração de texto ou metadados;
- deteção de idioma;
- resumo e classificação;
- extração de tópicos, objetivos, competências e pré-requisitos;
- comparação semântica, recomendações e identificação de lacunas.

Estes serviços podem executar fora do Odoo, mas devolvem resultados versionados ao fluxo controlado pelo Odoo. Não são fonte editorial de verdade.

### 4.5 Pessoas

- visitantes e estudantes;
- contribuidores;
- curadores;
- revisores de direitos;
- responsáveis curriculares;
- publicadores e administradores.

## 5. Learning Object

“Learning Object” é um papel conceptual comum, não a decisão antecipada de criar um modelo universal.

Podem desempenhar esse papel:

- um conteúdo eLearning nativo;
- uma coleção ou curso;
- um recurso externo ainda não publicado;
- uma unidade curricular;
- um tópico, objetivo ou competência;
- uma composição candidata.

Cada necessidade deverá reutilizar a entidade Standard adequada ou uma entidade FACODI específica. A abstração serve para compreender relações educativas comuns, não para copiar todos os objetos para uma tabela genérica.

## 6. Correspondência principal com Odoo Standard

| Necessidade FACODI | Base Standard preferencial | Limite da extensão FACODI |
| --- | --- | --- |
| Instituição, autor ou publicador | Contactos | Identidade externa e papel educativo quando necessário |
| Curador, estudante ou contribuidor | Utilizadores, Contactos, Portal e grupos | Papéis editoriais específicos e regras de aprovação |
| Curso ou coleção publicada | eLearning Course | Metadados curriculares e tipo educativo adicional |
| Secção ou módulo publicado | Secções do conteúdo eLearning | Relação com composição ou currículo aprovado |
| Vídeo, artigo, documento, imagem ou quiz publicado | Conteúdo eLearning | Proveniência, análise e associação curricular |
| Ficheiro ou ligação adicional | Recurso adicional e anexos | Direitos, snapshot e origem |
| Quiz | Questões e respostas eLearning | Relação com objetivo ou competência |
| Inscrição e progresso | Participação e progresso eLearning | Interpretação futura para reconhecimento de competências |
| Etiqueta simples | Tags de curso e conteúdo | Conceitos multilíngues, hierárquicos ou versionados |
| Discussão e revisão | Chatter, mensagens, seguidores e atividades | Decisão editorial estruturada |
| Publicação web | Website e eLearning | Gates FACODI antes da publicação |
| Verificação periódica | Cron | Estado, prioridade e resultado do ciclo FACODI |
| Trabalho operacional | Projetos e tarefas, quando instalados | Ligação opcional a campanhas de curadoria |

O módulo Documents não é pressuposto do baseline Community. Integrações documentais adicionais serão tratadas como opcionais; anexos e ligações Standard permanecem a base compatível.

## 7. Fluxo principal

1. Descobrir ou receber uma fonte.
2. Registar a identidade e a origem.
3. Verificar duplicados e elegibilidade de direitos.
4. Capturar apenas os metadados ou o conteúdo permitido.
5. Normalizar idioma, formato e estrutura.
6. Solicitar análises opcionais de IA.
7. Guardar as inferências como propostas, com evidência e confiança.
8. Sugerir correspondências com unidades curriculares.
9. Avaliar cobertura, redundância e lacunas.
10. Propor uma composição pedagógica.
11. Submeter à curadoria humana.
12. Aceitar, corrigir, rejeitar ou devolver para nova análise.
13. Preparar registos nativos do eLearning ainda não publicados.
14. Executar o gate final de direitos, qualidade, acessibilidade e idioma.
15. Publicar no Website/eLearning.
16. Observar utilização, feedback e alterações na fonte.
17. Criar uma nova análise ou revisão quando necessário.

## 8. Estados conceptuais comuns

Os fluxos utilizam um vocabulário comum sem obrigar todos os objetos a possuir os mesmos estados:

- **Descoberto:** referência identificada, ainda sem validação.
- **Capturado:** origem e metadados mínimos registados.
- **Normalizado:** formato e identidade reconciliados.
- **Analisado:** existe resultado automático versionado.
- **Proposto:** há uma recomendação que requer revisão.
- **Em revisão:** uma pessoa assumiu a análise.
- **Aceite:** decisão humana positiva.
- **Corrigido:** aceite com alterações humanas.
- **Rejeitado:** não será usado na finalidade avaliada.
- **Bloqueado:** direitos, erro técnico ou informação insuficiente impedem avanço.
- **Preparado:** estrutura nativa do eLearning criada em rascunho.
- **Publicado:** conteúdo disponível segundo a política definida.
- **Desatualizado:** uma mudança exige nova revisão.
- **Arquivado:** preservado para histórico, mas fora da utilização corrente.

## 9. IA e supervisão humana

Cada execução de IA produz um pacote de proposta separado dos dados da fonte e do conteúdo aprovado. O pacote identifica o propósito da análise, entrada utilizada, momento da execução, mecanismo ou modelo, resultado, confiança e evidência disponível.

O curador pode:

- aceitar integralmente;
- editar e aceitar;
- rejeitar com justificação;
- pedir nova análise;
- encaminhar para especialista curricular ou revisor de direitos.

Somente a decisão humana pode transformar uma proposta em relação curricular aprovada, composição aprovada ou conteúdo publicável.

## 10. Direitos e licenças

Cada recurso recebe uma classificação operacional:

- aberto e reutilizável;
- Creative Commons, com condições identificadas;
- permitido apenas por ligação externa;
- permitido por embed;
- apenas metadados;
- direitos desconhecidos ou em revisão;
- não elegível.

O tipo de utilização permitido controla a publicação. Conteúdo não elegível permanece bloqueado; direitos desconhecidos nunca são convertidos automaticamente em autorização.

## 11. Multilinguismo

- A identidade do recurso não depende do idioma da interface.
- Título, resumo e descrição editorial podem possuir traduções.
- O idioma original permanece registado.
- Conceitos e competências podem possuir rótulos equivalentes em vários idiomas sem perder a identidade semântica.
- Correspondência curricular pode atravessar idiomas.
- Tradução não cria automaticamente outro recurso educativo.
- Traduções automáticas são propostas sujeitas a revisão.

## 12. Currículo e cobertura

O currículo oficial segue a relação:

**Instituição → Programa → Versão curricular → Ano → Semestre → Unidade curricular → Tópicos, objetivos, competências e bibliografia.**

Uma unidade curricular relaciona-se com vários recursos e coleções; o mesmo recurso pode servir várias unidades. Cada correspondência expressa relevância, cobertura, nível, confiança, justificação, evidência e validação.

A cobertura é calculada sobre correspondências aceites. Propostas automáticas podem aparecer numa pré-visualização, mas não contam como cobertura validada.

Resultados possíveis:

- bem coberto;
- parcialmente coberto;
- sem cobertura;
- redundante;
- incerto ou em revisão.

Cada resultado conduz a uma ação: manter, procurar novo recurso, rever correspondência, melhorar composição ou arquivar redundância.

## 13. Composição pedagógica

Recursos aprovados podem ser combinados em playlists, módulos, cursos ou percursos. A ordenação considera pré-requisitos, dificuldade, duração, diversidade de formatos, idioma, direitos e cobertura dos objetivos.

Uma composição automática é sempre candidata. Depois da aprovação, a estrutura é materializada com cursos, secções, conteúdos, recursos e quizzes nativos do eLearning. A publicação continua separada da aprovação da composição.

## 14. Proveniência e rastreabilidade

A cadeia mínima é:

**Fonte → captura/snapshot → normalização → execução de análise → proposta → decisão humana → relação ou composição aprovada → publicação Odoo → utilização/feedback → revisão.**

O sistema preserva, conforme o tipo de objeto:

- URL, identificador externo, autor e instituição;
- data de captura e versão ou checksum;
- idioma e direitos conhecidos;
- entrada, resultado e versão da análise;
- confiança, evidência e justificação;
- utilizador e momento da decisão;
- registo Odoo publicado e versão resultante;
- alterações posteriores, retirada ou substituição.

O estado atual pode ser atualizado, mas os eventos relevantes da cadeia não são apagados para simular uma história mais simples.

## 15. Segurança e permissões

- Visitantes consultam apenas conteúdo público.
- Estudantes e utilizadores de portal acedem ao que lhes for permitido e mantêm progresso próprio.
- Contribuidores submetem sugestões sem poder publicá-las.
- Curadores analisam qualidade e correspondências dentro do seu âmbito.
- Revisores de direitos decidem elegibilidade jurídica/editorial.
- Responsáveis curriculares validam estrutura e cobertura académica.
- Publicadores executam o gate final e controlam a publicação.
- Administradores configuram integrações e permissões, sem substituir decisões especializadas.

As permissões devem seguir grupos e regras do Odoo, com segregação entre propor, rever e publicar.

## 16. Processamento e integrações

O baseline utiliza processamento agendado e estados explícitos. Operações externas são idempotentes sempre que possível, possuem limite de tentativas e produzem um resultado observável. Falhas técnicas não convertem propostas em aprovações e não publicam conteúdo.

Integrações externas comunicam por contratos pequenos e substituíveis. Credenciais permanecem protegidas, e o addon não depende de um fornecedor específico de IA.

## 17. Páginas do blueprint Lucid

### 00 — Índice, princípios e legenda

Apresenta a linguagem visual, os quatro princípios arquiteturais e a sequência das páginas.

### 01 — Visão geral do ecossistema FACODI

Mostra fontes, Odoo Community, addon FACODI, serviços opcionais, pessoas, Website/eLearning e ciclo de feedback.

### 02 — Pipeline geral de conteúdo

Representa a cadeia da descoberta à atualização, distinguindo dados da fonte, informação estruturada, inferência, decisão e publicação.

### 03 — Ingestão de conteúdos externos

Inclui identificação, deduplicação, verificação de direitos, captura permitida, normalização, quarentena e criação de candidato.

### 04 — Currículos universitários

Representa fonte oficial, snapshot, programa, versão curricular, períodos, unidades, componentes e validação académica.

### 05 — Enriquecimento e análise por IA

Mostra pedido, tarefas de análise, pacote de evidência, confiança, exceções e passagem obrigatória à revisão humana.

### 06 — Correspondência conteúdo e unidade curricular

Expõe a relação muitos-para-muitos e os atributos de relevância, cobertura, nível, confiança, justificação e validação.

### 07 — Avaliação de cobertura curricular

Agrega correspondências aceites por tópico e objetivo, classificando cobertura boa, parcial, lacuna, redundância e desatualização.

### 08 — Composição de playlists, módulos e cursos

Combina recursos aprovados, aplica regras pedagógicas, gera rascunho, recebe edição humana e materializa estrutura eLearning.

### 09 — Curadoria humana

Utiliza raias para fonte/evidência, FACODI/IA, curador/docente e Odoo/sistema, incluindo aceitação, correção, rejeição, escalamento e registo.

### 10 — Publicação no Odoo eLearning

Mostra o gate de publicação, a correspondência para objetos Standard, o rascunho nativo, a autorização final e o recibo de publicação.

### 11 — Ciclo contínuo de atualização

Representa verificação agendada, mudança na fonte ou currículo, análise de impacto, revisão e nova versão ou retirada.

### 12 — Proveniência e rastreabilidade

Apresenta a cadeia de linhagem, atores, eventos, snapshots, análises, decisões e publicação resultante.

### 13 — Mapa conceptual do domínio

Relaciona currículo, recursos, conceitos, competências, composições, curadores e publicações, mantendo Learning Object como papel conceptual.

### 14 — FACODI e modelos/módulos Standard do Odoo

Expõe as reutilizações Standard e as extensões mínimas necessárias, sem definir implementação.

### 15 — Boundary Map

Separa responsabilidades Odoo Standard, a zona de extensão/relação e as responsabilidades específicas mínimas do FACODI.

### 16 — Skills Recognition e percursos personalizados

Mostra uma visão futura baseada em progresso, evidência, competências, consentimento e validação humana ou institucional.

## 18. Não objetivos desta fase

- definir modelos ou campos definitivos;
- implementar addon, serviço ou integração;
- escolher fornecedor de IA;
- exigir Odoo Enterprise;
- migrar ou manter uma arquitetura Supabase;
- descarregar ou redistribuir recursos sem autorização;
- publicar conteúdo automaticamente;
- reconhecer formalmente competências apenas com inferência automática.

## 19. Critérios de aceitação do blueprint

- As 16 vistas solicitadas existem e possuem finalidade distinta.
- Odoo aparece como núcleo operacional e de publicação.
- Reutilização Standard é visível antes das responsabilidades FACODI.
- Dados de fonte, extração, inferência, decisão e publicação são distinguíveis.
- Curadoria humana aparece antes de qualquer publicação.
- Direitos e licenças funcionam como gate, não como nota lateral.
- Currículo e conteúdo possuem relação muitos-para-muitos com evidência.
- Cobertura curricular conduz a ações de descoberta ou revisão.
- Multilinguismo preserva identidade sem duplicação automática.
- Proveniência liga cada publicação à fonte e à decisão.
- A visão futura de competências permanece separada do núcleo inicial.
- O documento não depende conceitualmente de funcionalidades Enterprise.

## 20. Utilização posterior

Depois de validado, este blueprint poderá ser convertido por uma equipa técnica em inventários separados de modelos, campos, relações, estados, permissões, menus, jobs, serviços, integrações e testes. Essa derivação deverá respeitar novamente o princípio Odoo Standard-first e será uma fase própria, posterior à aprovação funcional.
