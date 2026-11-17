# /suggest: análise assistida e associação curricular simples

Estado: fase consultiva implementada e ativa (16/11/2026). Ver
[Implementação](#implementação) para o que foi entregue e o que difere do plano.
Data da investigação: 16/11/2026.

Base: `facodi`, commit `81a54852aec37817f8b538ac82c10e17476892e1`.
Entrega independente do PR #39 e de outras worktrees. As issues estão
desativadas; por decisão do utilizador, este plano vive num PR draft, sem
alterar a configuração do repositório.

## 1. Decisão recomendada

Aceitar a separação **analisar conteúdo / encontrar associações**, mas não a
recuperação integral do backend V2. Implementar uma fatia vertical pequena:

1. A submissão continua em `facodi.resource_suggestions`.
2. A mesma transação agenda um job FACODI idempotente.
3. Um único processador executa duas etapas internas, retomáveis: análise e
   associação. Não há duas novas APIs públicas nem chamadas encadeadas.
4. Uma chamada de IA estruturada por etapa, quando necessária, usa evidência
   identificada e candidatos reais. Não há agentes a discutir entre si.
5. Código determinístico valida a saída e aplica apenas decisões elegíveis.
   IA não recebe credenciais, ferramentas SQL nem poder de publicação.
6. O utilizador acompanha o resultado nas páginas existentes; fechar o browser
   não interrompe o trabalho.

**Autonomia proposta:** análise, seleção, preparação de rascunhos e associações
elegíveis a recursos já publicados não exigem confirmação humana por item.
Evidência fraca ou conflito produz abstenção, não uma aprovação fictícia nem uma
tarefa humana obrigatória. O editor pode corrigir ou resolver exceções, mas não
é um passo obrigatório do caminho normal.

**Limite do MVP:** recursos novos continuam em rascunho. A fase 2 (secção 8.1)
adotou depois a publicação automática, de forma restrita e com flags.

## 2. Estado verificado e qualidade do diagnóstico anexo

Verificações locais e consultas remotas apenas de leitura, no projeto
`wvkjainfwsyiyfcmbtid`. Não foram invocadas pipelines nem APIs de IA.

| Tema | Evidência atual | Consequência |
|---|---|---|
| Catálogo | 2.004 objetos no total, 1.963 publicados/ativos, 9 cursos públicos e 326 UCs públicas | Os 1.989 objetos do anexo são um snapshot antigo, não um requisito |
| Sugestões | 5 aprovadas | Amostra insuficiente para demonstrar precisão de IA |
| Pipeline | `analysis_jobs`, `analysis_results`, `semantic_matches` e `embeddings` têm zero linhas | Existência de tabelas não equivale a uma integração funcional |
| Reconhecimento | [metadata.ts](../src/entities/suggestion/metadata.ts) obtém título/autor YouTube via oEmbed; [recognition.ts](../src/entities/suggestion/recognition.ts) implementa `rankUnits()` lexical | Não existe análise audiovisual no fluxo atual |
| Formulário | [SuggestResource](../src/pages/SuggestResource.tsx) combina título, tags e descrição disponível; pré-seleciona UC com score lexical >= 50 | O score não é probabilidade nem comprovação pedagógica |
| Servidor | [Migração das sugestões](../supabase/migrations/20261114205704_facodi_resource_suggestions.sql) normaliza URL, faz triagem e limita submissões | Reutilizar, sem confundir licença declarada com verificada |
| Aprovação | A definição remota de `review_resource_suggestion` coincide com o fluxo local: cria rascunho ou reutiliza objeto e pode criar relação aprovada | Aprovação da sugestão, associação e publicação são operações diferentes |
| Backend versionado | Só há `facodi-submit-playlist` e `facodi-email-notifications` em [supabase/functions](../supabase/functions/) | As funções V2 remotas não são código mantido neste repositório |
| V2 remoto | `v2_analyze_video` apenas chama um helper que agenda `analyze_video` | Não garante execução posterior |
| Contratos V2 | Helpers remotos de extração/matching usam `video_artifacts`, `classification_candidates` e `v_catalog_playlists`, ausentes no schema | Não criar estruturas antigas só para satisfazer código legado |
| Classificação/eventos V2 | O helper usa `video_classifications.job_id`, inexistente; o logger envia campos ausentes de `analysis_job_events`, incluindo `step`, `status` e `requested_by` | A recuperação V2 tem mais incompatibilidades do que as duas funções sugeridas |
| Extensões | `vector`, `pgmq` e `pg_cron` instaladas; `pg_net` não consta da lista instalada consultada | Não presumir que o agendamento HTTP já está pronto |
| Acesso | Jobs permitem leitura pelo requerente/editor; resultados e matches têm políticas editoriais | O frontend do autor não pode simplesmente ler todos os resultados |

As incompatibilidades V2 foram confirmadas por inspeção de código remoto e
catálogo SQL, não por execução dessas funções. Não se auditou todo o legado
nem se comprovou disponibilidade de credenciais/modelos de IA ou transcrições.

## 3. Crítica à proposta original

### Manter

- Separar a evidência sobre o recurso da sua posição no currículo.
- Reutilizar recursos, UCs, módulos e sequências, sem hierarquia paralela.
- Distinguir `metadata_only`, `transcript` e `audiovisual`. Este último só pode
  existir quando houve efetivamente análise audiovisual comprovada.
- Persistir fonte, versão, modelo, decisão e justificação verificável.
- Processamento retomável, deduplicação e testes de concorrência.

### Simplificar ou rejeitar

- **Não tornar `public.videos` a origem canónica obrigatória.** Contraria a
  separação FACODI e acopla a proposta ao Tube O2. Deduplicar por URL/YouTube ID
  em `facodi.learning_objects` e `facodi.youtube_videos`, sem alterar `public`.
- **Não recuperar todas as funções V2.** Aproveitar conceitos/tabelas úteis;
  código remoto só é reutilizado depois de verificado, versionado e testado.
  Não alterar nem apagar endpoints usados por outros consumidores.
- **Não adicionar PGMQ e uma tabela de jobs como duas filas.** Para este volume,
  a tabela de jobs é a fila durável. Sem Redis, microserviços ou orquestrador.
- **Não começar por embeddings, pgvector ou pesos 35/25/20/10/10.** Não há
  avaliação que justifique essa complexidade. Usar recuperação textual/contextual
  e reordenação por IA; medir antes de adicionar pesquisa vetorial.
- **Não analisar audiovisual nem extrair transcrições por scraping no MVP.**
  oEmbed e a YouTube Data API não dão acesso geral ao texto de legendas de
  qualquer vídeo. Ausência de uma fonte autorizada é um resultado legítimo.
- **Não exigir segunda IA nem aprovação humana por cada decisão.** Validação
  estrutural, evidência, política explícita e abstenção são o controlo padrão.
  Uma segunda opinião pode repetir os mesmos erros; não é uma garantia.
- **Não criar módulos, cursos ou sequências automaticamente.** A primeira
  versão só propõe/aplica relações a entidades existentes; não altera ordenação.
- **Não adicionar flags `VITE_*`, dashboards novos, emails ou Realtime.**
  Ativar/desativar o processador no servidor e consultar estado com React Query.

## 4. Política de decisão e publicação

O produto atual exige curadoria humana e exclui pipelines de IA em
[PRODUCT.md](../PRODUCT.md). A aprovação desta proposta deverá autorizar
explicitamente a exceção limitada abaixo e a sua atualização documental.
Não reinterpretar silenciosamente as regras atuais.

| Situação | Ação automática proposta | Limite |
|---|---|---|
| Mesmo vídeo/URL em várias sugestões | Reutilizar análise válida; conservar o histórico de cada autor | Não revelar rascunhos ou sugestões de terceiros |
| Recurso novo e dados válidos | Preparar um único rascunho com proveniência de IA | `published=false`; não inventar origem manual, autor ou licença |
| Recurso já publicado + evidência suficiente + associação elegível | Criar/reutilizar relação aprovada com proveniência automática | Nunca reescrever relação editorial existente |
| Só metadados, empate, conteúdo ambíguo ou sem candidato | Guardar candidatos/justificação; `needs_review` | Sem nova relação pública; editor é opcional |
| Falha de IA, quota, timeout ou saída inválida | Estado explícito e tentativa limitada; manter a sugestão | Nunca «sucesso» sem resultado; formulário manual preservado |
| Rejeição/edição anterior por editor | Preservar a decisão; não reaplicar automaticamente | Reprocessamento não revoga decisões humanas |

«Evidência suficiente» exige texto obtido legitimamente, associação suportada
por excerto/referência verificável e regras de elegibilidade aprovadas nos testes.
Título, canal, escolha do autor e autoconfiança do modelo, isoladamente, não
autorizam associação pública. Se a integração só obtiver metadados, continuará a
ser útil para rascunhos, mas não promete essa automação pública.

Aceitar várias UCs quando suportadas, sem forçar exclusividade nem criar links
para todos os candidatos. Mostrar até três alternativas e, separadamente, as
associações efetivamente aplicadas. Não apresentar scores como «94% correto».

## 5. Desenho mínimo E2E

### Entrada, persistência e concorrência

- Manter autenticação, limite de submissões, normalização e declarações atuais.
  Disparar jobs depois da submissão persistida, não ao colar/escrever uma URL.
- Criar o job na mesma transação da sugestão, por caminho servidor dedicado,
  sem HTTP nem IA dentro do trigger SQL.
- Reutilizar `analysis_jobs` e `analysis_results`. Não é necessário usar
  `video_classifications`, `embeddings` ou `semantic_matches` no MVP.
  Candidatos ficam no payload estruturado de resultados; `semantic_matches`
  exige dois learning objects e não deve forçar a criação prematura de objetos.
- Migrar apenas lacunas comprovadas: vínculo à sugestão, chave idempotente,
  prazo de lease e próxima tentativa. Aproveitar `attempts`, `current_step`,
  timestamps e payloads já existentes. Índices/constraints devem suportar
  unicidade do trabalho e um resultado por job/etapa.
- Chave do trabalho combina sugestão, evidência de entrada, versão da análise
  e versão do contexto curricular. Deduplicação entre autores reutiliza a
  análise canónica, mas a autorização continua por sugestão.
- Claim atómico com bloqueio/lease; o worker só conclui o lease que possui.
  Timeout ou crash permite retoma; resultado obsoleto não aplica relações.
  No máximo três tentativas automáticas para falhas transitórias, com backoff;
  erros permanentes/configuração não provocam ciclos de retries.

### Execução

- Preferir **uma função nova, específica FACODI**, mantida neste repositório,
  com funções internas `analyze` e `match`; não reativar a pipeline V2 inteira.
- Invocação periódica autenticada por Cron. Confirmar suporte/configuração
  antes de habilitar `pg_net`; se necessário, a instalação é parte explícita
  da implementação aprovada, não uma capacidade supostamente existente.
- Um lote pequeno por execução e deadlines menores que o limite do runtime.
  Não usar `waitUntil` como substituto de uma fila durável.
- Reutilizar o provedor/modelo servidor existente **se disponível e adequado**;
  caso contrário, concluir contratos, mocks e interface sem fingir integração.
  Uma configuração inicial de credencial/modelo e teto de custo é inevitável;
  não inventar acesso gratuito ou consumo autorizado.
- Orçamento máximo diário e tamanho máximo de entrada são definidos uma vez
  na ativação; sem orçamento configurado, nenhuma chamada paga é permitida.
  Reservar quota atomicamente antes da chamada, incluindo concorrência/retries,
  e registar uso real. Sem novo serviço de billing.

### Etapa A: análise fundamentada

- Reutilizar identificação e metadados oficiais; título/autor editados pelo
  utilizador não passam a ser evidência do publicador.
- MVP aceita metadados e texto autorizado já disponível na FACODI, quando a
  proveniência o permita. Não introduzir uploads nem um coletor de legendas.
- Saída validada: `evidence_level`, fonte/data/hash, idioma conhecido ou
  desconhecido, resumo, tópicos, excertos/referências e limitações.
- Modelo/prompt/versão/uso ficam associados ao resultado. Não persistir
  raciocínio interno, dados de conta, tokens ou transcrições extensas sem base
  para armazenamento; guardar referências e excertos estritamente necessários.
- Texto externo é dado não confiável, não instrução. Ignorar comandos nele
  contidos; o modelo só devolve o contrato previsto.

### Etapa B: contexto e associação

- Recuperar candidatos por título, código, resumo, programa disponível,
  curso/UC e relações aprovadas. Usar texto normalizado e pesquisa PostgreSQL
  existente quando adequada; nunca mandar todo o catálogo para o modelo.
- Verificar recuperação com nomes como «Análise Matemática II», que são
  indistintos entre cursos sem contexto. Não tratar resumos editoriais como
  programas oficiais nem preencher programas inexistentes.
- IA reordena uma shortlist limitada e pode responder «nenhum». Validador
  aceita apenas IDs fornecidos e relações compatíveis; exige ligação entre
  evidência e contexto, não só uma pontuação.
- Sem candidato textual não implica irrelevância comprovada: abster e conservar
  a proposta. Testar recall antes de introduzir embeddings para resolver isso.
- Separar análise e matching no resultado permite rematching sem nova análise
  paga do mesmo conteúdo. Atualizar contexto não agenda o catálogo inteiro.

### Aplicação das decisões

- Implementar aplicação transacional específica, com permissões mínimas:
  revalidar job/lease, recurso, visibilidade e relação imediatamente antes da
  escrita; concorrência não pode criar recursos/links duplicados.
  Serializar a criação por chave canónica também entre sugestões de autores
  diferentes; a unicidade atual por autor/URL não resolve essa concorrência.
- Não chamar a RPC editorial fingindo um utilizador `editor` nem promover uma
  conta técnica. `reviewed_by` não recebe um humano fictício. Registar ator
  automático, mecanismo, versão, job e evidências em campos próprios/metadata.
- Separar a decisão sobre o recurso da decisão sobre cada associação.
  Preservar estados atuais da sugestão quando possível; estado de processamento
  deriva do job, sem inventar uma segunda máquina de estados na tabela.
- Relações públicas continuam sujeitas aos filtros/RLS existentes; o worker
  não publica pais/filhos privados para tornar um link visível.

### Interface e acesso

- Reutilizar [hooks](../src/features/suggestions/queries/useSuggestions.ts),
  reconhecimento, histórico e fila existentes. Não redesenhar `/suggest`.
- Mostrar: recebido, em processamento, concluído, evidência limitada ou falhou;
  distinguir análise feita de aprovação/publicação. Nada de progresso simulado.
- Polling apenas enquanto há trabalho ativo, com pausa em background e paragem
  em estado terminal; reabrir a página recupera o estado persistido.
- Leitura por autor através de projeção/RPC sanitizada, que verifica `auth.uid()`.
  Não abrir indiscriminadamente `analysis_results`, matches, payloads ou
  conteúdo editorial privado. Editor vê o detalhe necessário.
- Em `/editor/suggestions`, permitir corrigir associação/rejeitar/reprocessar
  numa única ação, sem dois diálogos de aprovação. Preservar a nota editorial.
- Quatro locales alinhados, acessibilidade, estados de erro e cache por conta.

## 6. Plano executável após uma única aprovação

Não implementar neste PR. Aprovação explícita do mantenedor no PR ou confirmação
do utilizador substitui a aprovação da issue que não pôde ser criada.
Abrir o draft, passar CI ou aprovar o texto com IA não autoriza por si só
execução remota nem gastos. Depois da aprovação de âmbito, executar os passos abaixo, sem
solicitar aprovação para cada migração, ficheiro, job ou sugestão dentro do escopo.
Credenciais indisponíveis ou mudança material de âmbito/custo são bloqueios
reais; não se contornam com segredos no browser ou decisões inventadas.

| Passo | Entrega | Critério de conclusão |
|---|---|---|
| 1. Contratos e política | Atualizar PRODUCT, regras diretamente afetadas e CODEBASE; documentar provedor/orçamento disponíveis; contratos de evidência e decisão | Limites claros; nenhuma regra antiga de curadoria humana contradiz a automação aprovada |
| 2. Backend vertical | Migração mínima, RLS/grants, enqueue atómico, claim/lease, resultados e worker versionado; análise/matching testáveis | Submissão gera trabalho durável; execução e aplicação idempotentes, sem dependência do V2 |
| 3. Integração UI | Acompanhamento e evidências nas páginas atuais, projeção privada e correção opcional pelo editor | Fechar/reabrir não perde estado; outro utilizador não vê o trabalho |
| 4. Validação e ativação | Testes SQL/IA simulada/E2E, avaliação offline, credencial e teto inicial; worker agendado só após os critérios | Caminho normal autónomo; abstenção segura; consumo limitado |

Preferir um PR de implementação vertical e focado; separar backend/frontend
apenas se a dimensão real exigir. Não abrir várias issues, ADRs, comités ou
branches por cada etapa. Não implementar dependências no PR #39.

## 7. Critérios de aceitação e testes

### Verificações obrigatórias

- [ ] Nenhuma leitura/escrita nova em `public`, Odoo ou endpoints V2 legados.
- [ ] Mesmo vídeo por formatos de URL/autores diferentes reutiliza conteúdo;
  submissão repetida, duas execuções simultâneas e retry não duplicam objeto/link.
- [ ] Falha entre commit da sugestão e execução não perde o job; crash após
  análise retoma o matching sem repetir desnecessariamente a chamada paga.
- [ ] Lease expirado, edição/rejeição editorial e evidência alterada impedem
  aplicação de uma decisão antiga.
- [ ] Metadados apenas nunca são rotulados como transcrição/audiovisual e não
  geram associação pública automática.
- [ ] IA que inventa UC, licença, timestamp, excerto ou campo inválido não escreve
  no catálogo; instruções maliciosas no título/transcrição não mudam a política.
- [ ] Recurso novo permanece privado; recurso existente não muda publicação,
  autoria ou licença; relação humana existente não é sobrescrita.
- [ ] `anon` não cria jobs/aplica decisões; utilizador A não lê B nem injeta
  `requested_by`; editor não obtém acesso a segredos; worker exige autenticação
  servidor e a RPC de aplicação não é executável por utilizadores comuns.
- [ ] Timeout, 429, indisponibilidade, ausência de modelo e limite de orçamento
  mostram o estado correto e mantêm o fluxo manual disponível.
- [ ] Orçamento é respeitado com duas execuções concorrentes e com retries.
- [ ] E2E cobre submissão -> job -> resultado -> rascunho/associação elegível ->
  consulta pública, além de reabertura, mobile, erro e correção editorial.
- [ ] Executar `bun run lint`, `bun run typecheck`, `bun run test`,
  `bun run build`, `bun run test:e2e` e os testes SQL novos com rollback numa
  base de teste. Não testar mutações criando sugestões falsas em produção.

### Avaliação pequena, sem plataforma de avaliação

Usar fixtures já disponíveis e exemplos sintéticos claramente identificados:
Análise Matemática I/II, Estatística, programação, Aprendizagem Automática,
recurso interdisciplinar, título enganador, evidência ausente e conteúdo sem UC.
Não reutilizar os cinco aprovados como prova estatística de qualidade.

Antes de permitir associações automáticas públicas, exigir pelo menos 30 casos
com referência editorial pré-existente ou verificação pontual por amostra;
incluir casos negativos e pares ambíguos. As referências não podem ser apenas
as respostas do mesmo modelo que está a ser avaliado. Sem referências suficientes,
o sistema funciona autonomamente em rascunho/proposta, sem alegar precisão.

Gate inicial proposto: zero aplicações indevidas nos casos negativos, nenhuma
violação de visibilidade/idempotência e pelo menos 95% de precisão nas
associações que a política decidiu aplicar. Reportar numerador/denominador,
abstenções, recall da shortlist, erros e custo por recurso; não arredondar uma
amostra mínima para uma garantia estatística. Estes são critérios propostos,
não resultados medidos. Se não forem atingidos, manter propostas privadas,
sem acrescentar rondas obrigatórias de aprovação humana.

## 8. Ativação, manutenção e reversão

- Uma aprovação de âmbito/política; uma configuração inicial de credencial e
  orçamento; nenhuma aprovação por item normal. IA ajuda a decidir pertinência,
  mas não autentica pessoas, autoriza gastos nem verifica juridicamente licenças.
- Primeiro validar com fixtures/testes e execução sem aplicação. Ativar
  aplicação elegível apenas com o gate cumprido; novos recursos ficam rascunho.
  O executor pode avançar entre estes passos sem nova aprovação humana.
- Não exigir nova infraestrutura paga. Se o provedor disponível não suportar
  o contrato/custo, entregar o fluxo degradado explicitamente e reportar o
  bloqueio em vez de integrar outro serviço silenciosamente.
- Interromper o Cron impede novo consumo. Jobs pendentes ficam retomáveis; o
  formulário e a revisão editorial atual continuam operacionais.
- Reverter só as relações criadas por esta versão/job, se ainda não tiverem
  edição posterior; não fazer hard deletes de recursos nem tocar na curadoria
  humana. Migrações aditivas podem permanecer sem processador ativo.
- Registar no PR de implementação o comando de ativação/paragem e como consultar
  falhas/uso nas tabelas existentes. Sem dashboard operacional novo.

## Implementação

Entregue como fatia vertical mínima e **apenas consultiva**:

- Migração `20261116233006_facodi_resource_suggestion_ai_analysis.sql`: fila em
  `facodi.analysis_jobs` (lease, `next_attempt_at`, um job por sugestão),
  trigger de enfileiramento, ranking SQL de UCs, orçamento diário,
  `retry_resource_suggestion_analysis` (editor) e o Cron
  `facodi-suggestion-analysis` (pg_net + Vault).
- Edge Function `facodi-suggestion-analysis` (sem JWT; segredo partilhado em
  `x-facodi-worker-secret`): Google Gemini (`gemini-2.5-flash`, endpoint
  compatível com OpenAI) com saída JSON estruturada, até 3 UCs com razão em
  português. O provedor mudou de OpenAI para Gemini porque a conta OpenAI não
  tinha créditos.
- Interface: o aluno vê o estado e as propostas no histórico; o editor vê a
  análise, pode reanalisar e escolhe a UC no diálogo de aprovação.

Diferenças deliberadas face às secções 4–5: não há aplicação automática de
associações nem gate de confiança; a etapa B fica para quando houver dados
que justifiquem. Limitações: só metadados (sem transcrição); títulos em inglês
podem não encontrar UCs, porque o ranking é textual sobre UCs em português.

Operação: falhas em `analysis_jobs` (`job_type = 'analyze_resource_suggestion'`,
`status`, `error_code`); uso diário em `analysis_job_events`
(`event_type = 'ai_call'`).

### 8.1 Fase 2 — publicação autónoma (implementada)

Migração `20261117002506_facodi_resource_suggestion_auto_publish.sql`.

- **Regra:** só vídeos do YouTube cuja submissão indicou uma UC; a análise
  procura entre as UCs desse curso (até 80) e publica quando há um match
  `strong` público no mesmo curso, sem licença restrita nem screening `reject`
  (duplicados são reanalisados e reutilizam o objeto público). Qualquer outra
  situação fica na fila com `result_payload.decision.reason`
  (`no_course`, `not_a_video`, `screening`, `no_strong_match_in_course`,
  `existing_not_public`, `auto_publish_disabled`, `no_candidates`).
- **Efeito:** `auto_publish_resource_suggestion` (só `service_role`) cria ou
  reutiliza o objeto publicado/ativo, cria a relação `contains` com
  `decided_by: automatic_analysis` e aprova a sugestão com `reviewed_by` nulo.
  Os editores veem os últimos 14 dias em `/editor/suggestions` e podem
  despublicar no editor.
- **IA:** Gemini `gemini-2.5-flash` (raciocínio baixo); em falha, OpenAI
  `FACODI_SUGGESTION_FALLBACK_MODEL` (padrão `gpt-5-mini`, ver §8.2). Os candidatos usam
  chaves curtas `u1..uN` porque o Gemini rejeita enums grandes de UUIDs.
- **Email:** Resend (`FACODI_RESEND_API_KEY`, `FACODI_EMAIL_FROM`), com
  idempotência por job e eventos `email_sent`/`email_failed`.
- **Flags** (`facodi.suggestion_pipeline_settings`, uma linha, editável no
  Studio): `auto_publish_enabled`, `ai_fallback_enabled`,
  `notification_email_enabled`, `notify_on_auto_publish`, `notify_on_review`,
  `notification_recipient`. Se a leitura falhar, o worker não publica nem envia
  emails.

### 8.2 Endurecimento (implementado)

Migrações `20261117012305_facodi_suggestion_pipeline_hardening.sql` e
`20261117015627_facodi_suggestion_notification_retry_grant.sql`.

- **Curso sem UC:** `resource_suggestions.course_id` (o trigger copia o curso
  da UC, quando há UC). Em `/suggest`, o aluno escolhe o curso e, opcionalmente,
  a UC; com curso, todas as UCs públicas desse curso são candidatas e a IA
  escolhe a melhor. Não se criam módulos nem tópicos.
- **Evidência:** `result_payload.evidence.level` distingue `content_video`
  (o Gemini viu os primeiros 5 minutos via `file_data`), `metadata_rich`
  (descrição/histórico do catálogo) e `metadata_only`. A página e a transcrição
  do YouTube não são acessíveis a partir da edge (bloqueio anti-bot), por isso
  não são usadas. Cada match `strong` tem de citar (`quote`) texto do recurso,
  não da UC nem do título dado pelo aluno.
- **Consenso:** antes de publicar, o segundo fornecedor (OpenAI `gpt-5-mini`)
  reavalia os candidatos `strong`; só se publica nas UCs em que ambos
  concordam (`confirmation.agreed_unit_ids`). Sem acordo, fica em revisão
  com o motivo `not_confirmed`. O `gpt-5-nano` foi trocado porque classificava
  como `partial` correspondências evidentes; custo por confirmação ≈ 0,002 USD.
- **Já no catálogo:** se o vídeo já está ligado a uma UC do curso indicado
  (`catalog_listed`), publica-se sem IA, reutilizando o objeto.
- **Idempotência e grafo:** `auto_publish_resource_suggestion` serializa por
  YouTube id (`pg_advisory_xact_lock`) e reutiliza o objeto, o
  `youtube_videos`, a `external_sources` e os `unit_videos` legados. Um vídeo
  produz 1 objeto, 1 registo YouTube, 1 fonte e uma relação `contains` por UC.
- **Recuperação:** o dispatch volta a enfileirar uma vez as análises
  concluídas sem decisão estruturada (versões 1 e 2) e acorda o worker
  também quando há emails em dívida.
- **Emails:** `claim_suggestion_notifications` reclama, sob advisory lock, os
  emails falhados (< 3 tentativas, últimos 2 dias); o reenvio usa a mesma
  chave de idempotência do Resend e nunca republica.

Validação E2E em produção (contas temporárias, depois removidas):
publicação com consenso, reutilização de vídeo legado, corrida de dois
workers sobre o mesmo vídeo (1 objeto), correspondência parcial, ausência de
curso, flag desligada, fallback real Gemini → OpenAI, retry de email e
despublicação pelo editor.

## 9. Deliberadamente adiado

Download/ASR, recolha geral de legendas, vetorização, pesquisa híbrida,
geração automática de módulos/percursos, publicação de recursos que não sejam
vídeos, comités de agentes e reprocessamento em massa. Só reconsiderar perante um problema medido que a solução
textual/contextual não resolva.

## Referências

- [Produto e limites atuais](../PRODUCT.md)
- [Arquitetura e fluxo de sugestões](CODEBASE.md)
- [Regras de backend](../.github/instructions/backend.instructions.md)
- [Sincronizador oficial YouTube existente](../scripts/enrichment/youtube-data-api-sync.mjs)
- [Agendar Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [Limites de execução](https://supabase.com/docs/guides/functions/limits)
- [YouTube captions.download: autorização e permissões](https://developers.google.com/youtube/v3/docs/captions/download)

Esta investigação confirma contratos e estado no momento indicado, não uma
pipeline a funcionar. Não alterou Supabase, Cloudflare, Auth, publicação,
dependências, código de aplicação ou configuração de issues.
