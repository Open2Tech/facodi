# FACODI — templates de email de autenticação e segurança

> **Âmbito:** recursos versionados e prontos para configuração; **não foram aplicados globalmente ao Supabase Auth alojado**. O projeto Supabase `wvkjainfwsyiyfcmbtid` partilha a autenticação com o Tube O2, e substituir diretamente os templates globais pode afetar o outro produto.

## Inventário

Os templates estão em `supabase/email-templates/facodi/` e usam HTML de tabelas com estilos inline, sem scripts, ficheiros de fontes ou imagens externas. Identidade visual FACODI atual: azul Ink `#142846`, amarelo Sun `#EFFF00`, com tons de papel `#F9FAFB`; os estilos são incorporados para compatibilidade com clientes de email.

| Tipo Supabase | Ficheiro | Variável essencial |
| --- | --- | --- |
| Confirmação do registo | `confirmation.html` | `{{ .ConfirmationURL }}` |
| Convite | `invite.html` | `{{ .ConfirmationURL }}` |
| Recuperação da palavra-passe | `recovery.html` | `{{ .ConfirmationURL }}` |
| Magic link | `magic_link.html` | `{{ .ConfirmationURL }}` |
| Alteração de email | `email_change.html` | `{{ .ConfirmationURL }}` |
| Reautenticação | `reauthentication.html` | `{{ .Token }}` |
| Palavra-passe alterada | `password_changed.html` | Sem token |
| Email alterado | `email_changed.html` | Sem token |
| Telefone alterado | `phone_changed.html` | Sem token |
| Método de login associado/removido | `identity_linked.html`, `identity_unlinked.html` | Sem token |
| MFA adicionado/removido | `mfa_factor_enrolled.html`, `mfa_factor_unenrolled.html` | Sem token |

As notificações de segurança só são enviadas se **estiverem ativadas no projeto**; criar o HTML não as ativa.

## Particularidade do Supabase partilhado com Tube

O Auth GoTrue usa um conjunto global de templates por projeto; não existem dois conjuntos independentes de mensagens para o mesmo `auth.users` no painel de configuração.

**Não executar `supabase config push`** neste projeto sem rever primeiro as alterações. O `supabase/config.toml` legado ainda referencia templates Tube e tem `site_url = "https://tube.open2.tech"`; os caminhos acrescentados para `facodi.vercel.app` são uma **proposta de allow-list local**, não uma alteração confirmada da configuração remota.

Opções para integração segura, por ordem de isolamento:

1. **Projeto Supabase Auth dedicado à FACODI:** configurar estes templates em `Authentication → Email Templates`. Não requer lógica de marca; exige plano de migração de utilizadores.
2. **Auth partilhado:** manter os templates Tube como `else` e introduzir condições de *branding* baseadas na origem, antes de aplicar uma mudança global. O novo registo FACODI envia `options.data.client_app = 'facodi'`; esse atributo é apenas **apresentação**, editável pelo utilizador, nunca autorização. A recuperação pode incluir `redirectTo=https://facodi.vercel.app/auth/reset-password`; o fluxo de signup inclui `/auth/callback?next=...`. Ao construir um template condicional, garantir explicitamente o fallback Tube para sessões existentes e verificar o comportamento de mudança de email, convite e utilizadores legados.
3. **Auth Hook de envio de emails:** separar renderização por contexto sem alterar a origem dos tokens. Requer infraestrutura e testes de entrega próprios.

**O que não fazer:** aplicar estes 13 ficheiros como templates globais sem proteção para o Tube, modificar `site_url` do projeto para `facodi.vercel.app`, ou confiar em `user_metadata.client_app` para decidir direitos.

## Configuração dos seis emails de autenticação

Para um projeto Auth exclusivo (ou após validar um roteador multi-marca), usar os seguintes assuntos:

| Chave local | Assunto |
| --- | --- |
| `auth.email.template.confirmation` | FACODI · Confirme o seu email |
| `auth.email.template.invite` | FACODI · Convite de acesso |
| `auth.email.template.recovery` | FACODI · Redefinir palavra-passe |
| `auth.email.template.magic_link` | FACODI · Ligação para iniciar sessão |
| `auth.email.template.email_change` | FACODI · Confirmar alteração de email |
| `auth.email.template.reauthentication` | FACODI · Código de verificação |

O Supabase alojado permite alterações em `Authentication → Email Templates` ou através da [Management API](https://supabase.com/docs/guides/auth/auth-email-templates). O **conteúdo do repositório por si só não atualiza os templates remotos**.

**Preparação de produção:**

- Confirmar a allow-list Auth para a origem real `https://facodi.vercel.app`, `/auth/callback` e `/auth/reset-password`. As URLs constam do `config.toml` local, mas **não estão confirmadas no Auth remoto**.
- Configurar SMTP próprio com domínio verificado, SPF, DKIM e DMARC; o SMTP padrão Supabase tem limites e não serve para produção.
- Confirmar que `{{ .ConfirmationURL }}` contém a origem/redirect esperada, sem codificar tokens manualmente.
- Testar confirmação, convite, recuperação, alteração de email e reautenticação com contas de teste autorizadas e emails reais. Não iniciar testes em massa contra contas de utilizadores.
- Validar a renderização em Gmail, Outlook e mobile, com links de acessibilidade visíveis. Não utilizar pixels de tracking.
- Para enviar emails de marketing, usar infraestrutura distinta dos emails de segurança.

## Teste estático

Executar `bun scripts/validate-facodi-email-templates.mjs` (ou `node`), sem rede nem emails enviados. Confere nomes, tokens obrigatórios, estrutura, idioma e isolamento de branding. **Não** equivale a teste de envio ou da Management API.

Documentação oficial:
- [Supabase — Email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase — Customizing email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates)
- [Supabase — Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
