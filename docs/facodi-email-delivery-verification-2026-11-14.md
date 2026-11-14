# FACODI — email, autenticação e notificações: verificação de produção

Data: 2026-11-14  
Projeto: Supabase `wvkjainfwsyiyfcmbtid`, schema `facodi`  
Código: `Open2Tech/facodi`, branch `facodi`  
Aplicação de referência: `https://facodi.vercel.app`

## Âmbito efetivamente auditado

| Fluxo | Implementação | Verificação conseguida | Limite |
| --- | --- | --- | --- |
| Registo e confirmação | `auth.signUp`, PKCE, `/auth/callback` | Código e testes automatizados | Mensagem real/SMTP do projeto partilhado não comprovados |
| Reenviar confirmação | `auth.resend({ type: 'signup' })` | Implementado; validação de redirect e erro do provider | Sem inbox de teste para entrega |
| Recuperar password | `auth.resetPasswordForEmail`, `/auth/reset-password` | Código e teste de callback | Mensagem real/SMTP não comprovados |
| Alterar email/perfil | `auth.updateUser` com callback `/profile` | Teste do email-change vs. edição só de nome | Mensagem real/SMTP não comprovados |
| Alterar password | `auth.updateUser({ password })` | Teste de integração no cliente | Notificação security só se ativada no Supabase Auth |
| Convites, magic link, MFA e eventos de segurança | 13 templates HTML no repositório | Verificações estáticas, link/token e design | Templates da FACODI ainda não configurados no Auth remoto |
| Playlist submetida | Trigger `facodi.enqueue_playlist_mail` e Edge Function autenticada | Migração aplicada, função ativa, UI ligada | Transporte FACODI depende de segredo/remetente verificados |
| Playlist aprovada ou rejeitada | Mesmo trigger `AFTER UPDATE OF status` + worker | Trigger de revisão, RLS e frontend | Entrega real não testada |

## Estado confirmado e restrições

1. O código frontend usa **PKCE** com `flowType: 'pkce'`, `detectSessionInUrl: false`, callback de código `exchangeCodeForSession` e caminhos de retorno permitidos.
2. Os `auth_logs` das últimas 24 horas registavam autenticações, mas **não havia um evento recente de envio de email** que permitisse confirmar entrega. A consulta agregada encontrou apenas dois erros históricos de refresh token; não são evidência de falha SMTP.
3. As contagens de contas `auth.users` com `raw_user_meta_data.client_app='facodi'` e de registos criados nos 30 dias anteriores eram **zero** na inspeção. Não é possível inferir entregabilidade sem um teste real com uma conta autorizada.
4. O ficheiro `supabase/config.toml` continua com o `site_url='https://tube.open2.tech'` e templates globais Tube O2. Não foi enviado `config push` e nenhuma configuração remota de SMTP/Auth foi alterada por esta intervenção.
5. Foram criados 13 templates FACODI consistentes com o design atual: Ink `#142846`, Sun `#EFFF00`, CSS inline e textos em PT-PT. **Versionados não equivale a ativos no Auth alojado**.
6. O build e as pipelines CI e FACODI validation passaram para os fluxos frontend e HTML. A validação estática é obrigatória no comando `build`.
7. O projeto Auth é **partilhado com Tube O2**. A alteração unilateral de templates, SMTP ou Auth Send Email Hook seria global; exige teste de routing e fallback do Tube.

## Notificações FACODI, sem tocar no Auth partilhado

### Base de dados

Migração: `supabase/migrations/20261114182940_facodi_transactional_playlist_email_outbox.sql`

Tabela `facodi.email_outbox`:
- Eventos: `playlist_received`, `playlist_approved`, `playlist_rejected`.
- Campos de idempotência, remetente lógico `recipient_user_id`, estado, tentativas, erro sintético, ID de mensagem do fornecedor e instantes.
- **Não armazena endereço de email** nem credenciais SMTP.
- O destinatário é sempre o autor real da playlist; nunca é recebido em texto livre do browser.
- Os eventos são inseridos por trigger `SECURITY DEFINER` com `EXECUTE` revogado a `anon` e `authenticated`; a tabela tem RLS sem políticas de leitura pública, `SELECT`/escrita apenas para `service_role`.
- Os eventos são **não bloqueantes**: uma falha de enfileiramento não desfaz a submissão/revisão curricular.

### Worker de envio

Código: `supabase/functions/facodi-email-notifications/index.ts`

- Edge Function **ativa** no Supabase com `verify_jwt=true`.
- Confirma o token do utilizador, a identidade do autor da playlist ou papel `editor/admin` em `app_metadata`, e seleciona apenas os eventos que o servidor criou.
- HTTPS, CORS restrito, validação UUID, HTML escapado, variante texto e HTML, chaves de idempotência.
- O envio usa a API do Resend, guardando apenas o identificador de aceitação. **Estado `sent` significa aceite pelo fornecedor, não entregue na caixa de entrada**.
- Não utiliza o remetente/reserva de outras marcas.
- Em caso de timeout/429/5xx, guarda estado `retry` e `next_attempt_at`, com backoff. O processamento é por invocação da função a partir de ações do site; **não existe ainda um serviço recorrente para reprocessar automaticamente todos os eventos antigos**. Locks abandonados há mais de 15 minutos são recuperados quando o worker é novamente invocado para a playlist.
- Sem `FACODI_RESEND_API_KEY` e `FACODI_EMAIL_FROM` configurados, responde `503` e mantém o evento pendente (sem recorrer a Monynha ou Tube).

A aplicação solicita esse processamento depois de submissões de playlists e decisões editoriais, sem comprometer o sucesso da operação principal se a notificação não puder ser enviada.

## Configuração externa indispensável para garantir o envio real

Na área **Supabase → Edge Functions → Secrets**, configurar:

- `FACODI_RESEND_API_KEY`: chave própria do projeto FACODI, com permissões mínimas de envio.
- `FACODI_EMAIL_FROM`: remetente verificado com o formato `FACODI <noreply@facodi.com>`, após validação do domínio no fornecedor.

Configurar SPF, DKIM e DMARC do domínio de envio, respeitando as indicações do fornecedor. Sem DNS/domínio verificado, a API pode rejeitar o remetente. Não colocar qualquer segredo no GitHub, na interface Web ou em tabelas públicas.

Para **emails do Supabase Auth** (registo, recuperação, convites, mudança de email), é necessária uma destas alternativas:

1. **Auth FACODI isolado** noutro projeto Supabase, com SMTP, URL de site e templates próprios, sujeito a migração de contas e eventual custo adicional.
2. **Auth partilhado com routing seguro multimarcas** usando Auth Send Email Hook com assinatura verificada, fornecedor de envio configurado e fallback explicitamente testado para Tube. A escolha da marca pode considerar o contexto de origem ou `user_metadata.client_app` para **apresentação apenas**, nunca como autorização. É preciso tratar utilizadores legados, recuperação sem sessão e links em browsers diferentes.

**Não ativar hooks globais nem substituir emails Tube apenas com templates FACODI.**

## Checklist para aceitação de envio end-to-end

- [ ] Verificar domínio e remetente FACODI na plataforma de envio.
- [ ] Configurar e testar segredos da Edge Function, sem os expor.
- [ ] Testar submissão de playlist de conta de teste autorizada: evento único `playlist_received`, Resend aceite, email recebido e botão abre a playlist.
- [ ] Testar aprovação e rejeição com nota: email uma vez por mudança real de estado, escapa HTML não confiável.
- [ ] Testar retry de erro 429/5xx e recuperar fila com intervenção controlada; configurar agendamento seguro se for necessário SLA automático.
- [ ] No Auth, inspecionar SMTP real e URL allow-list para `facodi.vercel.app` e origem final de produção.
- [ ] Testar signup, resend, recovery, convite, mudança de email, magic link e MFA usando caixas de correio de teste consentidas, links PKCE no navegador original e cenário de link expirado.
- [ ] Confirmar inexistência de regressões para Tube O2 e mensagens dos dois produtos antes de aplicar qualquer hook global.
- [ ] Confirmar logs do fornecedor incluindo aceite, entregue, bounce e reclamações. As respostas API não provam entrega.

Referências:
- [Supabase Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
- [Supabase Edge Functions — Send Emails](https://supabase.com/docs/guides/functions/examples/send-emails)

**Conclusão:** infraestrutura e rotas da FACODI aplicadas; emails Auth com design preparado; entrega SMTP/Resend ao destinatário ainda **não demonstrada**. Não declarar garantia de entrega antes de completar os testes externos.
