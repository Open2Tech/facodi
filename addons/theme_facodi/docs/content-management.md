# Governação de criadores, gestão de cursos e pipelines de enriquecimento no FACODI

## Diagnóstico executivo

**Sim, esta área merece atenção prioritária.** O FACODI já dispõe de uma base funcional razoável: o Odoo eLearning fornece um backoffice para criar cursos, adicionar conteúdos, gerir participantes, analisar visualizações, acompanhar conclusões e publicar cursos e aulas; além disso, distingue nativamente os níveis internos **Officer** e **Manager**. Contudo, a implementação FACODI atual ainda não constitui uma experiência completa de “painel do criador”, nem oferece uma governação editorial suficientemente granular para parceiros, docentes, revisores e responsáveis de publicação. citeturn0search0turn2view2

O ponto mais importante é que o Odoo standard já implementa uma separação parcial: um **Officer** pode ler todos os cursos e conteúdos, mas, pelas regras standard, apenas cria ou altera cursos sob a sua responsabilidade; um **Manager** possui acesso global. O problema é que isto não cobre adequadamente cenários FACODI como “docente de uma instituição parceira”, “coordenador editorial”, “revisor”, “publicador” e “operador de enriquecimento”. citeturn2view0

No código FACODI atual, `facodi_content` acrescenta uma instituição publicadora através de `partner_id` e classifica coleções como curso, unidade curricular, tópico, playlist ou percurso de aprendizagem. Porém, `partner_id` é apenas metadado: não existe uma regra FACODI que utilize esse campo para limitar quem pode criar, alterar, aprovar ou publicar os cursos dessa instituição. fileciteturn8file0L1-L7

Também já existe um fluxo inicial de enriquecimento, com os estados `new`, `queued`, `processing`, `ready`, `failed` e `applied`, e ações para enviar, atualizar e aplicar uma sugestão. Mas o próprio README identifica o componente como **Beta**, informa que não existe interface frontend ou portal dedicada e inclui no roadmap um dashboard de fila editorial, histórico de auditoria e testes com transporte simulado. Isto confirma que a infraestrutura atual deve ser tratada como um MVP, não como uma pipeline de produção completa. fileciteturn5file0L1-L7

A análise da instância Odoo através do MCP não pôde ser concluída porque a ligação configurada aponta para um hostname de staging não acessível externamente. Assim, não foi possível confirmar diretamente a distribuição atual de utilizadores pelos grupos Officer/Manager, os responsáveis associados a cada curso, a configuração dos cron jobs ou o estado dos parâmetros da pipeline. Esta verificação deve ser o primeiro gate operacional antes de qualquer alteração de permissões.

## Painéis de criação e modelo de permissões

### O que já existe no Odoo

O backoffice standard de eLearning já contém grande parte das operações de base. O formulário de curso permite gerir conteúdos e secções, definir o responsável, configurar visibilidade e política de inscrição, convidar ou adicionar participantes, consultar visualizações, conteúdos publicados, participantes, conclusões e avaliações. A vista kanban standard também apresenta estatísticas de convidados, utilizadores em curso, concluintes e total de participantes. citeturn2view2

O Odoo permite igualmente criar conteúdos do tipo artigo, vídeo, documento, imagem e quiz; associar recursos adicionais; definir duração, responsável e disponibilidade para preview; e publicar separadamente o curso e cada conteúdo. citeturn0search0

Isto significa que não é necessário reconstruir um LMS de gestão desde o início. A estratégia mais segura é **preservar os modelos, formulários e ações standard e acrescentar uma camada FACODI de governação, filas de trabalho e informação contextual**.

### Lacunas atuais

A primeira lacuna é a ausência de um verdadeiro conceito de **organização editorial**. Atualmente, o addon guarda uma entidade publicadora em `slide.channel.partner_id`, mas não define utilizadores autorizados por parceiro, coordenadores dessa instituição, equipas editoriais ou regras que restrinjam os cursos à entidade correspondente. fileciteturn8file0L1-L7

A segunda lacuna é que o addon não declara ficheiros de segurança próprios no manifesto. Carrega apenas o cron e duas extensões de views, dependendo integralmente dos grupos e das ACLs de `website_slides`. Isto reduz a complexidade inicial, mas também significa que ainda não existe um modelo de permissões FACODI. fileciteturn6file0L1-L7

A terceira lacuna está na própria interface de enriquecimento. Os botões estão limitados ao grupo Officer e os métodos repetem essa verificação no servidor, o que é positivo. Porém, os campos da secção de enriquecimento não têm restrição de grupo no modelo e a maioria também não tem restrição na view. Qualquer utilizador interno com acesso suficiente ao formulário e permissão de escrita sobre `slide.slide` poderá, potencialmente, visualizar ou alterar diretamente o estado, a referência do job ou a sugestão, mesmo não podendo executar os botões. fileciteturn13file0L1-L7

A quarta lacuna é a falta de separação entre **criação, revisão e publicação**. Atualmente, o mesmo Officer pode enviar o conteúdo para enriquecimento, atualizar o job e aplicar a sugestão diretamente à descrição. Não existe um estado de aprovação, um segundo revisor, uma justificação de rejeição nem um registo imutável do texto anterior e posterior. fileciteturn7file0L1-L7

### Modelo de funções recomendado

O FACODI deve manter os grupos Odoo standard e acrescentar funções editoriais específicas. A composição recomendada é:

| Função | Responsabilidade principal | Alcance recomendado |
|---|---|---|
| Administrador da plataforma | Configuração, segurança, integrações e incidentes | Todos os parceiros e conteúdos |
| eLearning Manager | Supervisão global de cursos e participantes | Toda a plataforma |
| Coordenador de parceiro | Gere docentes, cursos e revisão da sua instituição | Apenas parceiros autorizados |
| Criador ou docente | Cria cursos, secções, aulas, quizzes e recursos | Cursos próprios ou atribuídos |
| Revisor editorial | Revê metadados, enriquecimento, qualidade e proveniência | Fila atribuída ou parceiro |
| Publicador | Aprova e publica cursos e conteúdos | Cursos aprovados |
| Operador da pipeline | Monitoriza jobs, falhas e reprocessamentos | Infraestrutura, sem editar conteúdo pedagógico |
| Auditor | Consulta histórico, decisões, proveniência e métricas | Leitura apenas |

Odoo combina permissões por grupos de forma aditiva; as ACLs controlam operações CRUD sobre o modelo e as record rules restringem os registos concretos sobre os quais essas operações são permitidas. Por isso, adicionar vários grupos de forma pouco controlada pode ampliar involuntariamente os acessos. citeturn1search2turn1search4

Uma regra prática recomendada seria:

- o criador pode criar cursos associados a um dos seus parceiros autorizados;
- pode alterar apenas cursos de que seja responsável ou colaborador;
- não pode publicar;
- o revisor pode consultar e comentar, aceitar ou rejeitar sugestões, mas não alterar configurações de acesso;
- o publicador pode publicar apenas cursos com estado editorial aprovado;
- o coordenador do parceiro pode atribuir responsáveis dentro da sua instituição;
- o Manager mantém o acesso global standard.

Para suportar isto, deve ser adicionado ao utilizador ou ao contacto um campo semelhante a `facodi_partner_ids`, ou, preferencialmente, um modelo de associação explícito, por exemplo `facodi.editorial.membership`, contendo parceiro, utilizador, função, datas de validade e estado. A segunda alternativa é melhor para auditoria, expiração de permissões e utilizadores que trabalham com várias instituições.

### Utilizadores internos versus portal

Criadores que necessitam de utilizar o backoffice Odoo devem ser **utilizadores internos**. Os utilizadores Portal possuem permissões predefinidas e não permitem a seleção normal de direitos por aplicação. Transformar o portal numa área completa de autoria exigiria controllers, formulários, validação, regras de acesso e fluxos editoriais próprios. citeturn0search2

Uma área de autoria no portal só deve ser construída se existir uma razão comercial forte, como permitir a centenas de docentes externos criar conteúdos sem acesso ao backoffice. Essa opção não é uma simples personalização visual: é um produto adicional, com uma superfície de segurança considerável.

Para a primeira versão, a opção mais segura é criar um **Painel Editorial FACODI dentro do backend Odoo**, reutilizando as forms standard. O painel deve funcionar como uma entrada simplificada para:

- Os meus cursos;
- Cursos da minha instituição;
- Rascunhos;
- A aguardar enriquecimento;
- A aguardar revisão;
- Rejeitados com alterações pedidas;
- Prontos para publicação;
- Publicados;
- Falhas da pipeline;
- Pedidos de acesso e inscrições pendentes.

O visual pode adotar os mesmos tokens, tipografia e linguagem Neo-Technical Brutalism usados no website FACODI, sem copiar estilos de frontend indiscriminadamente para todo o backend. O design system atual define Electric Lime para ações e estados ativos, Space Grotesk para títulos, Inter para texto, JetBrains Mono para labels, bordas de 2 px e sombras rígidas. fileciteturn0file0

## Infraestrutura e pipeline de enriquecimento

### Capacidades existentes

O addon Odoo já mantém uma identidade externa estável por conteúdo, a referência do job, o estado, a sugestão, o erro e a última atualização. O cliente exige HTTPS, bearer token e timeout limitado entre 1 e 60 segundos. A sugestão é escapada antes de ser convertida em HTML, e a aplicação ao conteúdo é explícita, não automática. Estas são decisões de base positivas. fileciteturn7file0L1-L7

O cron procura até 50 conteúdos nos estados `queued` ou `processing`, consulta o serviço e continua a processar os restantes quando um job individual falha. fileciteturn21file0L1-L7

No serviço externo, a API FastAPI expõe um health check, um endpoint para criar ou reutilizar jobs e outro para consultar o respetivo estado. A autenticação é feita através de um token bearer. fileciteturn10file0L1-L7

O armazenamento atual utiliza SQLite e uma restrição que impede mais de um job ativo para a mesma URL. No arranque, jobs que estavam em `processing` são repostos em `queued`, proporcionando uma recuperação básica após interrupções. fileciteturn12file0L1-L7

### Problemas que devem ser tratados

#### Incompatibilidade com Google Drive

A configuração permite `drive.google.com` como host de vídeo, mas o processador apenas possui adaptadores oEmbed para YouTube e Vimeo. Um vídeo Google Drive passa pela validação inicial e falha depois com “No metadata provider is available”. Este é um defeito funcional concreto e deve ser corrigido ou removendo o host da allowlist ou implementando um adaptador suportado. fileciteturn17file0L1-L7 fileciteturn11file0L1-L7

#### Jobs não duráveis

O processamento utiliza `BackgroundTasks` da própria aplicação FastAPI. Isto funciona num único processo, mas não é uma fila durável: um reinício após a resposta HTTP pode interromper a tarefa, não há worker independente, reserva de capacidade, retries estruturados, dead-letter queue ou controlo de concorrência distribuído. fileciteturn10file0L1-L7

O mecanismo de recuperação no arranque volta a colocar jobs `processing` em `queued`, mas não existe no código atual um serviço que percorra automaticamente todos os jobs repostos e os execute. Eles dependem de uma nova chamada ou de lógica operacional externa, pelo que podem ficar presos. fileciteturn12file0L1-L7

#### Armazenamento e escalabilidade

O serviço usa um ficheiro SQLite num volume Docker local e publica diretamente a porta `8000`. O compose não define reverse proxy TLS, política de restart, health check Docker, limites de CPU/memória, múltiplos workers, backups, rede privada ou armazenamento externo. Isto é suficiente para desenvolvimento, mas frágil para produção. fileciteturn18file0L1-L7

#### Enriquecimento ainda muito básico

O atual “enriquecimento” consulta o oEmbed, extrai título e autor e gera uma frase curta com o domínio de origem. Não produz transcrição, resumo pedagógico, objetivos de aprendizagem, idioma, tópicos, nível de dificuldade, duração validada, thumbnail, palavras-chave, capítulos, acessibilidade ou informação de licença. fileciteturn11file0L1-L7

Assim, o nome “pipeline de enriquecimento” é hoje mais ambicioso do que a funcionalidade implementada. Não é necessariamente um problema para o MVP, desde que o produto apresente isto como **importação e normalização de metadados**, e não como enriquecimento pedagógico completo.

#### Falta de histórico e versionamento

Os resultados são guardados diretamente no próprio `slide.slide`. Um novo job substitui o estado e a sugestão anteriores, não existindo uma tabela de execuções, versão do processador, modelo utilizado, payload original, decisão do revisor ou comparação entre revisões. fileciteturn7file0L1-L7

A solução recomendada é introduzir `facodi.enrichment.job` e `facodi.enrichment.review`, mantendo uma relação One2many no conteúdo. Cada execução deve conservar:

- origem e identidade externa;
- hash ou versão da fonte;
- versão da pipeline;
- timestamps;
- tentativas;
- estado;
- resultados estruturados;
- erros;
- utilizador que pediu o job;
- utilizador que reviu;
- decisão;
- conteúdo anterior;
- conteúdo aplicado.

#### Cron não alinhado com o batching recomendado no Odoo 19

O cron atual limita a pesquisa a 50 registos, o que já reduz o risco de execuções demasiado longas. Contudo, não comunica progresso através de `ir.cron._commit_progress()`, não verifica o tempo restante da execução e não implementa locking de registos. O Odoo 19 recomenda processar lotes curtos, comunicar progresso e terminar quando o scheduler indicar que não resta tempo. citeturn1search0

#### Segurança e operação

A comparação do bearer token é simples e existe apenas um token global. Não há rotação, múltiplos clientes, data de expiração, rate limiting, mTLS, assinatura de payload, IP allowlist ou registo detalhado de acessos. A API também não apresenta correlation IDs, métricas, tracing ou endpoint de readiness. fileciteturn10file0L1-L7

O token não deve aparecer nas interfaces ou logs. No Odoo, os campos internos do enriquecimento devem receber `groups` no modelo, não apenas na view, porque as restrições de campo no ORM também removem o campo de `fields_get()` e impedem leituras e escritas explícitas por grupos não autorizados. citeturn1search2

## Arquitetura recomendada

### Camada editorial no Odoo

O Odoo deve permanecer como **fonte de verdade editorial**. Cursos, aulas, responsáveis, publicação, participantes e resultados devem continuar nos modelos standard `slide.channel` e `slide.slide`.

A extensão FACODI deve acrescentar, sem substituir esses modelos:

```text
slide.channel
├── partner_id
├── editorial_state
├── editorial_owner_id
├── reviewer_id
├── publisher_id
├── quality_score
├── provenance_complete
└── enrichment_job_ids

slide.slide
├── facodi_source_key
├── editorial_state
├── provenance fields
├── transcript fields
├── review fields
└── enrichment_job_ids

facodi.editorial.membership
├── user_id
├── partner_id
├── role
├── valid_from
├── valid_until
└── active

facodi.enrichment.job
├── slide_id
├── state
├── idempotency_key
├── provider
├── pipeline_version
├── payload/result
├── attempt_count
├── requested_by
├── reviewed_by
└── timestamps
```

O estado editorial deve ser separado do estado técnico do job. Uma sequência segura seria:

```text
Rascunho
  → Em preparação
  → Pronto para enriquecimento
  → Enriquecimento em curso
  → Pronto para revisão
  → Alterações pedidas / Aprovado
  → Pronto para publicação
  → Publicado
  → Arquivado
```

A publicação standard do Odoo deve continuar a usar `is_published`/`website_published`. O novo estado FACODI atua como uma condição de governação: o botão de publicar só deve ser apresentado ou permitido quando o conteúdo estiver aprovado.

### Camada de processamento

A pipeline de produção deve utilizar:

```text
Odoo
  → API autenticada
  → Base de jobs durável
  → Fila
  → Workers por capacidade
  → Adaptadores de fornecedores
  → Armazenamento de resultados
  → Callback/webhook ou polling
  → Revisão humana no Odoo
```

Para uma primeira versão robusta, PostgreSQL pode guardar jobs e resultados, enquanto Redis com RQ, Celery ou Dramatiq gere a fila. Não é obrigatório usar todos estes componentes; o essencial é separar a API dos workers e tornar o job recuperável após reinícios.

Os processadores devem ser independentes:

- normalização da URL;
- metadados e oEmbed;
- thumbnail;
- extração ou importação de legendas;
- deteção de idioma;
- resumo;
- objetivos de aprendizagem;
- tópicos e tags;
- nível de dificuldade;
- deteção de duplicados;
- verificação de licença e proveniência;
- validação de qualidade.

Cada capacidade deve poder falhar isoladamente. Um vídeo sem transcrição, por exemplo, pode manter metadados válidos e ser encaminhado para revisão em vez de marcar todo o job como falhado.

### Idempotência e proveniência

A chave idempotente não deve depender apenas da URL. Deve combinar, quando disponível:

```text
source_provider
+ external_source_id
+ source_version ou content_hash
+ pipeline_version
+ enrichment_profile
```

Isto permite reprocessar um vídeo quando a pipeline muda, sem criar duplicados acidentais.

Cada resultado deve conservar a sua proveniência: URL, fornecedor, ID externo, autor, data de consulta, licença declarada, idioma, modelo ou serviço que gerou a sugestão e versão da pipeline. A revisão humana nunca deve apagar o resultado bruto.

### Experiência do painel

O painel editorial inicial deve ser uma ação backend FACODI, com cards e listas orientados a trabalho:

```text
Resumo
├── Meus cursos ativos
├── Rascunhos
├── Conteúdos sem responsável
├── Jobs em curso
├── Jobs falhados
├── Sugestões por rever
├── Alterações pedidas
├── Prontos para publicação
└── Cursos com problemas de qualidade
```

Cada cartão deve abrir uma action standard filtrada, em vez de criar uma segunda interface que replique forms, listas e regras do Odoo.

## Plano de implementação recomendado

### Prioridade imediata

Antes de expandir funcionalidade, deve ser feita uma auditoria real da base de dados:

- módulos e versões instalados;
- utilizadores internos com eLearning Officer/Manager;
- responsáveis dos cursos;
- cursos sem responsável;
- cursos publicados com conteúdos não publicados;
- conteúdos sem origem;
- parâmetros `facodi.pipeline.*`;
- estado e utilizador do cron;
- jobs presos;
- permissões efetivas por utilizador de teste;
- configuração multiwebsite e multicompany.

Em paralelo, devem ser corrigidos o host Google Drive, as restrições de campos de enriquecimento, os testes das ações públicas, a progressão do cron e a configuração mínima de produção do container.

### Primeira fase funcional

A primeira fase deve entregar:

- grupos FACODI;
- associações utilizador–parceiro–função;
- record rules por parceiro e responsabilidade;
- separação entre criador, revisor e publicador;
- painel “O meu trabalho”;
- fila de enriquecimento;
- histórico de jobs;
- ação aceitar/rejeitar;
- bloqueio de publicação sem aprovação;
- testes de acesso com vários utilizadores.

### Segunda fase de infraestrutura

A segunda fase deve substituir `BackgroundTasks` e SQLite por uma fila durável, acrescentar retries com backoff, dead-letter queue, recuperação de jobs, métricas, logs estruturados, correlação entre Odoo e pipeline, backup e política de retenção.

### Fase de enriquecimento pedagógico

Só depois da governação e da infraestrutura deve ser expandido o processamento para transcrições, resumos pedagógicos, objetivos, tags, capítulos, acessibilidade, thumbnails e proveniência.

A prioridade correta é:

```text
Segurança e governação
→ Auditoria e histórico
→ Fiabilidade operacional
→ Experiência editorial
→ Enriquecimento avançado
```

Construir enriquecimento avançado antes de saber quem pode pedir, rever, aprovar e publicar o resultado aumentaria o risco operacional.

## Prompt para o agente em modo autónomo

```text
# Missão: governação editorial, painel de criadores e pipeline FACODI

Trabalha autonomamente no repositório FACODI, partindo da branch de staging vigente.

O objetivo é auditar e implementar, ponta a ponta, a área destinada aos utilizadores que criam e gerem cursos, bem como estabilizar toda a infraestrutura de enriquecimento associada.

Não te limites a produzir recomendações. Audita, documenta, implementa por fases, testa, publica em staging e valida com utilizadores de perfis diferentes.

Não alteres o core do Odoo.

## Fontes de verdade

Analisa integralmente:

- `addons/facodi_content`;
- `addons/theme_facodi`;
- `services/facodi-pipeline`;
- o módulo Odoo 19 `website_slides`;
- grupos, ACLs e record rules existentes;
- cursos, conteúdos, utilizadores, responsáveis e jobs existentes na base de staging;
- parâmetros `facodi.pipeline.*`;
- cron jobs;
- deployment e observabilidade.

Preserva os modelos standard `slide.channel` e `slide.slide`.

## Gate inicial obrigatório

Antes de alterar código:

1. Confirma a branch e o estado do repositório.
2. Confirma que staging contém o mesmo commit.
3. Consulta a base Odoo em modo read-only.
4. Inventaria:
   - módulos instalados e versões;
   - cursos e conteúdos;
   - responsáveis;
   - parceiros publicadores;
   - Officers e Managers;
   - utilizadores sem função clara;
   - jobs por estado;
   - jobs presos;
   - cron e última execução;
   - parâmetros da pipeline;
   - erros recentes.
5. Cria um relatório com evidências e riscos.
6. Não exponhas tokens, passwords ou dados pessoais no relatório.

Se o MCP Odoo não estiver acessível, tenta corrigir a ligação através da URL pública configurada. Se continuar bloqueado, documenta o bloqueio e avança com a auditoria de código, sem inventar resultados da base.

## Auditoria de permissões

Confirma o comportamento real de:

- eLearning Officer;
- eLearning Manager;
- Website Restricted Editor;
- Website Editor/Designer;
- utilizador interno sem eLearning;
- portal;
- público.

Cria utilizadores de teste ou fixtures com estas funções:

- administrador;
- manager global;
- coordenador de parceiro A;
- criador de parceiro A;
- revisor de parceiro A;
- publicador de parceiro A;
- criador de parceiro B;
- portal;
- público.

Verifica, para cada perfil:

- leitura;
- criação;
- alteração;
- eliminação;
- enriquecimento;
- revisão;
- publicação;
- participantes;
- relatórios;
- cursos de outros parceiros.

Nunca consideres a interface escondida como segurança suficiente. Testa também ORM/RPC.

## Modelo de governação

Implementa grupos FACODI separados:

- FACODI / Partner Coordinator;
- FACODI / Course Creator;
- FACODI / Editorial Reviewer;
- FACODI / Publisher;
- FACODI / Pipeline Operator;
- FACODI / Auditor.

Mantém os grupos standard Officer e Manager como base quando adequado.

Cria uma associação auditável entre utilizadores, parceiros e funções. Não uses apenas um Many2many opaco no utilizador se forem necessárias validade, estado ou histórico.

Aplica record rules para garantir que:

- criadores alteram apenas cursos próprios ou atribuídos;
- coordenadores gerem apenas as suas instituições;
- revisores só aprovam o âmbito autorizado;
- publicadores publicam apenas conteúdos aprovados;
- managers mantêm acesso global;
- parceiros diferentes não veem dados editoriais uns dos outros.

Testa explicitamente a composição aditiva dos grupos para evitar escalada involuntária.

## Workflow editorial

Separa o estado editorial do estado técnico da pipeline.

Implementa um workflow semelhante a:

- draft;
- preparing;
- enrichment_pending;
- enrichment_running;
- review;
- changes_requested;
- approved;
- ready_to_publish;
- published;
- archived.

Preserva `is_published`/`website_published` como mecanismo standard de publicação.

Bloqueia a publicação quando o conteúdo não está aprovado, exceto para Manager.

Regista:

- quem submeteu;
- quem reviu;
- decisão;
- comentário;
- datas;
- conteúdo anterior;
- conteúdo aplicado.

## Painel editorial

Cria um painel backend FACODI reutilizando actions e views standard.

O painel deve conter:

- Meus cursos;
- Cursos da minha instituição;
- Rascunhos;
- Conteúdos sem responsável;
- A aguardar enriquecimento;
- Jobs falhados;
- A aguardar revisão;
- Alterações pedidas;
- Aprovados;
- Prontos para publicação;
- Publicados;
- Alertas de qualidade.

Cada card deve abrir uma action filtrada. Não dupliques os formulários standard.

Aplica a identidade FACODI de forma localizada e acessível. Não introduzas estilos globais que prejudiquem o backend.

## Pipeline de enriquecimento

Audita e corrige imediatamente:

- Google Drive permitido sem adaptador;
- uso de FastAPI BackgroundTasks;
- jobs presos após reinício;
- SQLite como armazenamento único;
- ausência de retries e backoff;
- ausência de dead-letter queue;
- ausência de histórico;
- ausência de limpeza e retenção;
- ausência de observabilidade;
- exposição direta da porta;
- rotação e proteção do token;
- timeout e concorrência;
- idempotência.

Introduz um modelo `facodi.enrichment.job` no Odoo ou equivalente, com histórico completo.

A chave idempotente deve considerar:

- fornecedor;
- ID externo;
- versão/hash da fonte;
- versão da pipeline;
- perfil de enriquecimento.

Não substituas a pipeline inteira num único commit. Primeiro fecha os defeitos críticos e acrescenta testes. Depois migra para uma fila durável.

## Cron

Atualiza o cron para o padrão Odoo 19:

- lotes curtos;
- `_commit_progress`;
- locking quando necessário;
- limite configurável;
- continuação segura;
- logs estruturados;
- recuperação de falhas;
- teste por `method_direct_trigger`.

Não executes chamadas externas longas numa única transação sem controlo.

## Segurança

Adiciona `groups` nos campos sensíveis ao nível do modelo.

Mantém verificações server-side em todos os métodos públicos.

Não confies em botões invisíveis.

Não uses `sudo()` para contornar regras editoriais, exceto em operações técnicas estritamente justificadas.

Nunca guardes tokens em logs, chatter ou mensagens de erro.

Restringe URLs e fornecedores.

Valida redirects, tamanho de respostas, content type e timeouts.

## Testes obrigatórios

Cria:

- testes de ACL;
- testes de record rules;
- testes de isolamento entre parceiros;
- testes do workflow;
- testes de publicação;
- testes de ações RPC;
- testes do cron;
- testes da API;
- testes de idempotência;
- testes de restart/recovery;
- testes de timeout;
- testes de fornecedor não suportado;
- testes de HTML malicioso;
- testes de retries;
- web tour do painel.

Executa também:

- XML validation;
- SCSS compilation;
- Python lint;
- type checking da pipeline;
- pytest;
- testes Odoo;
- `git diff --check`;
- upgrade do módulo numa cópia da base;
- smoke test em staging.

## Implementação incremental

Usa commits pequenos e coerentes, por exemplo:

- `audit(facodi): document creator permissions and pipeline state`
- `feat(facodi_content): add editorial roles and memberships`
- `security(facodi_content): enforce partner-scoped course access`
- `feat(facodi_content): add editorial workflow`
- `feat(facodi_content): add creator work dashboard`
- `feat(facodi_content): add enrichment job history`
- `fix(facodi_pipeline): align supported provider adapters`
- `refactor(facodi_pipeline): introduce durable job execution`
- `test(facodi_content): cover role and partner isolation`
- `docs(facodi): document editorial operations`

Depois de cada grupo:

1. valida localmente;
2. faz push para staging;
3. atualiza os módulos;
4. aguarda assets/build;
5. testa com os perfis;
6. recolhe screenshots e logs;
7. marca o item como verificado apenas após staging.

## Restrições

Não apagues cursos ou utilizadores reais.

Não alteres permissões de produção sem matriz aprovada e testes.

Não atribuas Manager como solução rápida.

Não transformes utilizadores portal em autores através de ACLs improvisadas.

Não publiques automaticamente conteúdo enriquecido.

Não mistures alterações de tema sem relação com esta missão.

Não faças merge para produção enquanto existirem falhas de isolamento entre parceiros ou bypass de publicação.

## Entregáveis

Entrega:

- auditoria da base e do código;
- matriz de funções e permissões;
- diagrama do workflow;
- modelo de dados;
- painel editorial;
- histórico de jobs;
- pipeline estabilizada;
- testes;
- screenshots por perfil;
- manual operacional;
- runbook de incidentes;
- plano de rollback;
- relatório final com limitações reais.

A tarefa só termina quando:

- criadores conseguem gerir apenas o seu âmbito;
- parceiros estão isolados;
- revisão e publicação estão separadas;
- jobs são recuperáveis e auditáveis;
- o cron é seguro;
- todos os perfis foram testados;
- staging está validado;
- não existem regressões conhecidas.
```

A orientação essencial é não começar pela construção de um frontend complexo para docentes. O maior risco atual não é visual: é a combinação de permissões demasiado genéricas, ausência de isolamento editorial por parceiro, falta de separação entre revisão e publicação e uma pipeline ainda dependente de execução em processo e SQLite. O painel deve ser construído sobre uma política de acesso comprovada; a pipeline avançada deve ser construída sobre jobs duráveis e auditáveis.