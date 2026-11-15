# FACODI — domínio, templates de autenticação e créditos de equipa

**Data:** 15 de novembro de 2026  
**Supabase:** projeto `wvkjainfwsyiyfcmbtid`, schema `facodi`  
**Frontend:** repositório `Open2Tech/facodi`, branch `facodi`

## Domínio verificado

A Vercel confirmou que `facodi.com` e `www.facodi.com` pertencem ao mesmo projeto FACODI, com redirecionamento 308 de `facodi.com` para `www.facodi.com`. Páginas `/about` e `/community` foram abertas no domínio novo e apresentam o frontend FACODI.

O canónico passou a ser **https://www.facodi.com** nas páginas `/about` e `/community`, no sitemap, no robots.txt, no README, nos URLs públicos relevantes do Supabase e nos 13 HTMLs dos modelos de email FACODI.

### Autenticação no domínio novo

A aplicação FACODI utiliza `window.location.origin` ao gerar `emailRedirectTo` e `redirectTo`, evitando callbacks presos a `facodi.vercel.app`.

O `supabase/config.toml` foi atualizado com URLs explícitos para:

- `https://www.facodi.com/auth/callback**`
- `https://www.facodi.com/auth/reset-password**`
- `https://facodi.com/auth/callback**`
- `https://facodi.com/auth/reset-password**`

As configurações anteriores do Tube permanecem. **Importante:** versionar `config.toml` não confirma que a lista alojada no Supabase Auth já tenha esses URLs. Como o conector disponível não permite editar/ler o Auth URL Configuration alojado, é necessária verificação no [Auth URL Configuration](https://supabase.com/dashboard/project/wvkjainfwsyiyfcmbtid/auth/url-configuration). Não alterar o `site_url` global do Tube sem isolar ou encaminhar corretamente as duas aplicações. Consultar [documentação Supabase sobre redirects](https://supabase.com/docs/guides/auth/redirect-urls).

## Treze emails com identidade FACODI — no Supabase, sem envio

Novas migrações:

- `facodi_email_template_catalog_isolated_no_delivery`
- `facodi_stage_thirteen_canonical_auth_and_security_templates`

A nova tabela **`facodi.email_template_catalog`** contém 13 templates portugueses versionados, com assunto e HTML. Há cinco templates de autenticação com ligações, um de código de verificação e sete notificações de segurança. Todos os HTMLs mantêm os placeholders Supabase corretos (e.g. `{{ .ConfirmationURL }}` e `{{ .Token }}`), e todos os rodapés usam `https://www.facodi.com`.

No momento da última verificação:

| Verificação | Resultado |
| --- | ---: |
| Templates FACODI | 13 |
| Templates com domínio canónico | 13 |
| Referências restantes a facodi.vercel.app | 0 |
| Modelos declarados `ready` | 13 |
| Modelos com envio ativado | 0 |

Os templates são acessíveis apenas a editores pela RLS; `anon` não tem `SELECT` e `authenticated` não tem `UPDATE`. Foi criada uma página editorial protegida em **`/editor/email-templates`** que apresenta o assunto e um preview HTML dentro de um `iframe sandbox` sem ação de envio.

**Limitação fundamental:** `facodi.email_template_catalog` é um catálogo de pré-visualização; Supabase Auth **não lê esta tabela**. O Supabase Auth partilhado tem `site_url=https://tube.open2.tech` e templates de autenticação globais. Substituí-los diretamente por FACODI quebraria a experiência do Tube. Os 13 templates **não foram instalados globalmente** na secção Auth Email Templates nem foi habilitado qualquer hook de envio.

Para colocar estes templates a funcionar **exclusivamente na FACODI**, é necessário primeiro adotar uma estratégia isolada (Auth separado, ou envio via hook com roteamento seguro para FACODI/Tube e testes de ambas as aplicações). A operação exige modificar configurações do Auth alojado, indisponíveis no conector nesta conversa. Nunca ativar notificações ou chamar disparadores apenas para testar os templates. Referência: https://supabase.com/docs/guides/auth/auth-email-templates.

## Cinco contribuidores propostos para a FACODI

A pedido do responsável do projeto, cinco pessoas estão na **fila privada** `facodi.project_profiles` e são consultáveis no editor `/editor/project-credits`:

| Nome de trabalho | Contexto a confirmar |
| --- | --- |
| Gustavo Cezar Scheidt | Comunicação, divulgação e preparação de materiais |
| Bilal Uddin | Planeamento, UI e colaboração em discussões do projeto |
| Andreia Cirne | Briefing/proposta de design e comunicação; entregas a confirmar |
| Sofia | Nome completo, papel e contributo a confirmar |
| Tércio | Nome completo, papel e contributo a confirmar |

As três primeiras pessoas já existiam em rascunho; Sofia e Tércio foram criados como novos rascunhos. Foi anotada a nomeação pelo responsável, **sem inferir consentimento das pessoas**. Nenhum nome foi publicado como crédito individual porque o fluxo existente exige confirmação do papel, fonte pública e consentimento. Quando uma pessoa é validada pela RPC `facodi.review_project_credit`, o componente `ProjectStorySections` já apresenta os perfis publicamente na secção *Pessoas com crédito confirmado*. A retirada posterior é auditável.

Não existem emails de contacto, telefones ou dados fiscais nestes perfis.

## Qualidade e publicação

A validação GitHub Actions [FACODI validation #216](https://github.com/Open2Tech/facodi/actions/runs/43707722385) passou em ESLint, TypeScript, Vitest, análise dos 13 templates e build Vite após uma pequena correção de compatibilidade ES2020.

Os últimos deployments consultados na Vercel para os commits recentes apresentavam `ERROR`; nenhum deploy mais recente foi confirmado `READY` nesta fase. **Não anunciar a página editorial de templates ou o novo SEO como publicado até existir deploy READY desse commit.** O frontend previamente publicado continua acessível no domínio migrado.

Nenhum email foi disparado, nenhum registo de utilizador foi criado e nenhuma aprovação fictícia foi gravada.
