# FACODI — Participação da comunidade e créditos auditáveis

**Data:** 15 de novembro de 2026  
**Repositório:** `Open2Tech/facodi`, branch `facodi`  
**Supabase:** projeto `wvkjainfwsyiyfcmbtid`, schema `facodi`

## Objetivos e limites

A FACODI pode agora receber manifestações de interesse para colaborar, sem criar membros ou créditos fictícios e sem disparar qualquer email. A inscrição é voluntária e privada, não confere matrícula, posição na equipa, permissões adicionais ou direito à publicação de nome ou imagens.

A evolução aproveita o portal e a identidade FACODI já existentes, preservando a separação entre a FACODI e a Monynha e não alterando as tabelas nem os mecanismos de email do Tube.

## 1. Remoção do bypass de aprovação de créditos

**Migração:** `20261115074008_facodi_lock_down_credit_publication_to_audited_rpc.sql`

A análise ao banco identificou que `authenticated` ainda tinha permissões SQL diretas de `INSERT, UPDATE, DELETE` em `facodi.project_profiles` e `INSERT` nos registos privados de aprovação/revogação. Um editor podia usar a API direta, marcar um perfil como publicado e preencher o consentimento sem criar a auditoria prevista.

Foi retirada toda essa capacidade de alteração direta. A aprovação ou retirada de créditos passa por **duas RPCs muito restritas**:

- `facodi.review_project_credit(...)`: apenas utilizadores com `auth.uid()` e papel `editor/admin` na `app_metadata`, sobre um candidato em rascunho, com fonte HTTPS, papel descrito e fundamento de consentimento. Grava a aprovação e o perfil na mesma transação.
- `facodi.revoke_project_credit(...)`: apenas editor/admin, apenas crédito individual anteriormente aprovado, com justificação privada. Arquiva e retira o consentimento na mesma transação.

As RPCs foram convertidas para `SECURITY DEFINER` **por uma razão controlada**: a permissão DML direta foi revogada a todos os utilizadores da API. As funções têm `search_path=pg_catalog,pg_temp`, tabelas schema-qualified, contratos fechados, autorização explícita e `EXECUTE` concedido apenas a `authenticated`. É uma exceção deliberada ao padrão invoker, sujeita ao aviso do Security Advisor. Não foram alteradas funções compartilhadas do Tube.

**Testes reversíveis:** um editor conseguiu aprovar e retirar um crédito numa transação que terminou em `ROLLBACK`. O acesso direto de atualização ficou negado e um utilizador comum não conseguiu aprovar. Registos reais permanecem inalterados: 8 perfis públicos, 3 candidatos privados e zero aprovações ou revogações de créditos.

## 2. Propostas privadas de participação

**Migração:** `20261115074225_facodi_private_opt_in_community_participation_queue.sql`

A nova tabela `facodi.community_participation_requests` recolhe apenas:

- `submitted_by` (UID da conta autenticada);
- área de interesse: aprender, docência, curadoria, desenvolvimento, design, tradução/acessibilidade ou organização;
- breve proposta de contribuição e um endereço HTTPS opcional de portefólio;
- consentimento explícito para avaliação/contacto através da conta;
- estado de revisão, justificação e autor/data da decisão.

Não existe campo de email para a nova aplicação, ligação a `email_outbox` nem envio automático. A revisão é feita exclusivamente no próprio site.

A RLS deixa cada proponente ver apenas as suas propostas; os editores podem ver a fila completa. Um visitante anónimo não tem acesso. A criação exige `submitted_by=auth.uid()`, estado `pending` e consentimento. Os editores só podem alterar `review_status` e `review_note`; os metadados de autoria e data da revisão são preenchidos pelo trigger.

O limite de segurança é de **três pedidos por sete dias por utilizador** e apenas um pedido pendente por tipo de interesse. A validação é aplicada na base de dados, não apenas na interface.

**Teste SQL reversível:** envio como estudante, tentativa de revisão por estudante sem linhas afetadas, revisão por editor com `reviewed_by` e `reviewed_at`, limite de três por semana, e confirmação de acesso anónimo negado.

## 3. O direito de retirar o interesse

**Migração:** `20261115074742_facodi_community_member_self_withdrawal.sql`

O proponente pode apagar a sua própria manifestação de interesse, independentemente do estado, sem precisar de justificar ou contactar administradores. A política `DELETE` limita a operação ao próprio `submitted_by`.

A interface pede uma confirmação antes da remoção. Teste transacional: o estudante criou e apagou o próprio pedido; a contagem caiu para zero antes do `ROLLBACK`.

## 4. Performance e permissões

**Migração:** `20261115075103_facodi_community_policy_and_credit_audit_indexes.sql`

- Consolidação das duas políticas permissivas `SELECT` na tabela de propostas num único predicado `submitted_by=auth.uid() OR facodi.is_facodi_editor()`.
- Índices das chaves de autoria da revisão e das relações dos registos privados de consentimento, sem afetar o catálogo de vídeos partilhado.

**Verificação final:** `anon` não lê a fila de propostas, `authenticated` pode submeter e apagar as suas próprias, não consegue alterar `submitted_by`, e não possui `UPDATE` direto sobre os créditos públicos. No momento da última auditoria havia **0 propostas reais** na nova fila; nenhuma inscrição fictícia persistiu.

## 5. Experiência na aplicação

- `/community`: chamada para participação voluntária.
- `/community/join` (login obrigatório): proposta, declaração de consentimento, histórico privado e retirada do pedido.
- `/editor/community` (editor obrigatório): fila de avaliação, proposta, portefólio opcional e decisão fundamentada. A aprovação não publica nomes, não concede permissões e não envia emails.

Textos e estados disponíveis em PT/EN/ES/FR, com controlo de acesso duplicado no router e no PostgreSQL.

O script `scripts/validate-facodi-project-pages.mjs` verifica a existência dessas rotas, requisitos de consentimento, exclusão de email nas interfaces e o fluxo de eliminação da proposta. Executa-se em cada `build` juntamente com o validador dos templates transacionais, sem provocar qualquer envio.

## 6. Limites operacionais e próximos testes

- **Não foram enviados emails**, criadas campanhas ou ativados disparadores de comunicação. A configuração global de emails do Supabase Auth continua partilhada com o Tube e não foi alterada.
- As migrações de base de dados estão aplicadas e versionadas. A publicação das novas páginas requer confirmação de um deploy Vercel `READY` que contenha os respetivos commits.
- Um teste completo com conta real de estudante e conta real de editor, nas páginas da aplicação, ainda deve ser efetuado antes de anunciar o fluxo como plenamente validado.
- O aviso do Security Advisor sobre RPCs `SECURITY DEFINER` acessíveis a `authenticated` é deliberado e foi minimizado com autorizações explícitas e revogação das operações SQL diretas.
- Não publicar contagens de colaboradores como membros do projeto antes de confirmações voluntárias e consentidas.
