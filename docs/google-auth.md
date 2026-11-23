# Google no FACODI

O formulário `/login` oferece **Continuar com Google** tanto para entrar como
para criar conta. O email e palavra-passe continuam disponíveis.

A chamada `signInWithGoogle()` usa o cliente Supabase existente (`flowType:
'pkce'`, deteção automática de códigos desligada). O Supabase mantém o
verificador no navegador e `/auth/callback` troca o código pela sessão uma vez.
O destino passa por `safeReturnPath()` antes da saída e depois do regresso;
páginas de estudo mantêm a query e a âncora. As falhas removem os parâmetros
do fornecedor do histórico e oferecem uma nova tentativa no mesmo destino.
Não são pedidas permissões adicionais de Gmail, Drive, contactos ou YouTube.

## Configuração alojada

Verificado em 23/11/2026: `/auth/v1/settings` anuncia `external.google = true`
e `/auth/v1/authorize?provider=google` responde com um redirecionamento HTTP 302
para `accounts.google.com`, com o callback abaixo e apenas os scopes de identidade
`email` e `profile`.

| Local | Configuração |
| --- | --- |
| Google Auth Platform → cliente OAuth Web | URI de redirecionamento autorizado: `https://wvkjainfwsyiyfcmbtid.supabase.co/auth/v1/callback` |
| Supabase → Authentication → Sign In / Providers → Google | Client ID e secret do cliente OAuth, já configurados no projeto |
| Supabase → Authentication → URL Configuration | Site URL: `https://facodi.com`; autorizar `/auth/callback` e as suas queries em cada origem usada pela app |
| App | `redirectTo` é a origem atual + `/auth/callback?next=…` |

O callback Google → Supabase é diferente do callback Supabase → app.
As credenciais Google ficam no Supabase, nunca no frontend ou no git. Não
executar um push global de `supabase/config.toml` para configurar este fornecedor:
a autenticação do projeto é partilhada e há definições remotas que devem ser
preservadas.

O logótipo está alojado na própria app em `public/media/auth/google.svg`, obtido
do [asset oficial Google](https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg).
A página de entrada não carrega o SDK Google, scripts ou fontes desse fornecedor.

## Verificação

Os testes cobrem início sem preencher email, estados pendentes, recuperação de
erros, callback PKCE, recusa/cancelamento, códigos expirados e destinos externos.
A política de privacidade descreve os dados de identidade nos quatro idiomas.

Antes da publicação, confirmar no navegador que o botão abre o seletor de conta
Google. Para validar o percurso integral, usar uma conta Google de teste e
confirmar o regresso a `/suggest` ou a uma aula com `?notes=open`. A verificação
HTTP do fornecedor e os testes simulados não confirmam a emissão de uma sessão
Google real nem o estado de publicação/consentimento do cliente no Google.

Referência: [Sign in with Google — Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).
