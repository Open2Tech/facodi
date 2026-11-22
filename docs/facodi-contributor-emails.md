# Emails para quem contribui com conteúdos

Ativação: 22 de novembro de 2026. Projeto `wvkjainfwsyiyfcmbtid`, apenas schema `facodi`.

Quem sugere um recurso em `/suggest` ou envia uma playlist recebe:

1. Um agradecimento a confirmar que a sugestão foi recebida e que haverá um email com a decisão.
2. Um resultado após aprovação ou rejeição, com a nota da revisão quando existir. A aprovação automática também gera este email.

A triagem que deteta uma possível duplicação não é uma decisão editorial: nesse momento só se envia o agradecimento. A aprovação editorial pode criar um recurso em rascunho; o email explica que a publicação pode estar em preparação. O botão abre diretamente o recurso apenas quando ele está publicado e ativo. Nos restantes casos abre as sugestões do utilizador. As playlists mantêm `/playlists/submit` como destino.

Os emails têm HTML responsivo com as cores FACODI e uma alternativa em texto simples. A língua usa `user_metadata.locale` ou `user_metadata.language` (apenas apresentação), com suporte para PT, EN, ES e FR e fallback para PT. Não se confunde o idioma do conteúdo sugerido com a preferência do destinatário.

## Funcionamento e segurança

- O trigger `enqueue_resource_suggestion_mail` alarga a fila privada existente `email_outbox`. O autor verdadeiro é o destinatário; pedidos HTTP nunca definem o endereço, o template ou o HTML.
- A fila identifica exatamente uma sugestão ou playlist por evento. Alterações de metadados ou atualizações sem mudança de estado não criam novos emails.
- A inserção da sugestão e o enfileiramento fazem parte da mesma transação. Não se criam eventos para sugestões rejeitadas pelo banco de dados. Uma falha do enfileiramento regista um aviso sem invalidar a contribuição.
- O cron `facodi-contributor-email` verifica a fila a cada minuto. O envio não depende de manter o site aberto, do orçamento de IA, nem dos emails administrativos da análise.
- A função `facodi-email-notifications` valida sessões e propriedade nas invocações existentes do frontend. O cron autentica-se com `FACODI_SUGGESTION_WORKER_SECRET`, já guardado em Vault. `verify_jwt=false` permite o cron; a autenticação é obrigatória no código antes de qualquer acesso à fila.
- Há claim atómico por evento, recuperação de locks abandonados após 15 minutos, idempotência no fornecedor e até cinco tentativas com backoff. Falhas de consulta de uma contribuição não impedem processar as restantes.
- A reserva na fila não inicia a janela do fornecedor. Imediatamente antes do primeiro pedido ao Resend, a função persiste `first_attempt_at` e o corpo JSON completo como string em `event_payload._delivery_request`, na fila privada existente. A string preserva exatamente os bytes enviados, incluindo remetente, destinatário, assunto, HTML e texto. Uma falha ao gravar impede o envio; falhas de consulta anteriores mantêm o instante a `null`.
- As repetições reutilizam esse corpo e a mesma chave de idempotência, sem reconstruir o email com um endereço, idioma, template, revisão ou slug entretanto alterado. Uma ligação para um recurso que deixe de ser público mantém-se no pedido original; a aplicação continua a negar acesso ao conteúdo privado. Repetir recupera o resultado do envio original, não promete o estado atual da publicação.
- HTTP 409 `concurrent_idempotent_requests` é temporário e usa o mesmo backoff e limite de cinco tentativas. `invalid_idempotent_request` e outros conflitos 409 são definitivos.
- Falhas definitivas ficam visíveis no banco de dados. Não se repetem envios ambíguos após 23 horas desde `first_attempt_at`, respeitando a janela de idempotência de 24 horas do Resend. Tentativas antigas com instante registado mas sem o corpo original ficam em `delivery_snapshot_missing` para inspeção manual, sem reconstrução ou reenvio automático. Na verificação anterior à publicação, a fila continha apenas três eventos já enviados, sem eventos pendentes nestas condições.
- Um agradecimento continua válido depois de uma revisão rápida; antes do primeiro pedido ao fornecedor, decisões já ultrapassadas são ignoradas. Depois desse pedido, a repetição reconcilia o envio original congelado.
- A tabela tem RLS e acesso exclusivo do serviço. As funções internas não têm `EXECUTE` para `anon`/`authenticated`. O serviço recebeu somente `SELECT (id,submitted_by,status)` na tabela de playlists, permissão em falta no fluxo anterior.
- Mantêm-se `FACODI_RESEND_API_KEY` e `FACODI_EMAIL_FROM`, sem fallback para remetentes de outros produtos. Nenhum hook ou configuração do Auth partilhado foi alterado.
- Não foi feito backfill de sugestões históricas. Os três eventos de playlists que já estavam pendentes foram processados.

## Validação realizada

- `bun run test:email`: 15 modelos estáticos e 56 testes do handler, entrega e apresentação, incluindo autenticação, destinatário real, concorrência, falha do transporte, backoff, recuperação, início da janela após falhas de consulta, persistência antes do envio e repetição do pedido original após timeout. O comando inclui os testes `.test.ts` e `.spec.ts`, executados no CI.
- `bun run test`: 443 testes Vitest e 7 testes Node passaram.
- `bun run lint`, `bun run typecheck`, `deno check` da Edge Function e build de produção sem credenciais passaram.
- `supabase/tests/contributor_email_lifecycle.sql` passou no banco alojado. Verifica agradecimento, aprovação manual, aprovação automática, rejeição, duplicados e isolamento das permissões. Todos os dados de teste foram revertidos na mesma transação; não geraram emails.
- Diagnóstico autenticado em produção confirmou transporte configurado.
- O processamento real devolveu HTTP 200 com `sent=3, skipped=0, failed=0`. Os três eventos ficaram em `sent`, cada um com ID do fornecedor e uma tentativa.

**`sent` significa que o fornecedor aceitou a mensagem. Não comprova a chegada à caixa de entrada.**

## Operação

```sql
-- Diagnóstico sem envio e sem alteração dos eventos.
select facodi.dispatch_contributor_email(true);

-- Processar apenas os eventos que já estão elegíveis.
select facodi.dispatch_contributor_email();

-- Verificar a fila, sem expor endereços ou títulos.
select template_name,state,failure_code,count(*)
from facodi.email_outbox
group by 1,2,3;

-- Pausar somente o envio automático.
select cron.alter_job((select jobid from cron.job where jobname='facodi-contributor-email'),active:=false);
```

A resposta de `dispatch_contributor_email` é um identificador `pg_net`, consultável em `net._http_response`. Nunca colocar credenciais nas consultas ou nos comandos cron. Não repor eventos `sent` para `pending`; verificar o ID do fornecedor antes de qualquer reenvio manual.

Referências: [envio de emails em Edge Functions](https://supabase.com/docs/guides/functions/examples/send-emails), [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net), [idempotência Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).
