# FACODI — Cloudflare Workers: branch `facodi`

**Data:** 15 de novembro de 2026  
**Repositório:** https://github.com/Open2Tech/facodi/tree/facodi  
**Ambiente associado pelo responsável:** https://facodi.marcelo-0d6.workers.dev/  
**Domínio público canónico:** https://www.facodi.com/

## 1. Verificação pública inicial

Os endereços `/`, `/about`, `/robots.txt` e `/sitemap.xml` responderam no Worker e apresentaram conteúdo FACODI. A navegação para `/community/join` e `/editor/email-templates` exigiu login. O `/sitemap.xml` referencia apenas URLs de `www.facodi.com`. O teste foi feito por leitura pública e não constitui verificação de sessão/autenticação com conta real.

A configuração existente `wrangler.jsonc` já define:

- `name=facodi`;
- `assets.directory=./dist`, correspondente ao resultado Vite;
- `assets.not_found_handling=single-page-application`, permitindo o fallback de rotas React Router;
- observabilidade ligada.

Portanto, não foi introduzido outro runtime de servidor, D1, KV, R2 ou secrets em `wrangler.jsonc`.

## 2. Proteção do ambiente de pré-visualização

Foi criado `public/_headers`, copiado pelo Vite para `dist/_headers`, com regras de Cloudflare Workers Static Assets:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`;
- **`X-Robots-Tag: noindex, nofollow, noarchive`** para `https://facodi.marcelo-0d6.workers.dev/*`, mantendo o ambiente navegável mas excluído da indexação;
- cache longa apenas para `/assets/*`, ficheiros com nomes versionados pelo Vite.

A gestão de `robots` no React `FacodiLayout` e `ProjectPageSeo` reconhece também o hostname Workers. Os URLs canónicos e a indexação pública ficam reservados a `www.facodi.com`. As regras `_headers` não configuram os cabeçalhos de respostas produzidas por código Worker/SSR, caso a arquitetura passe a usá-lo.

Documentação oficial: https://developers.cloudflare.com/workers/static-assets/headers/ e https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/ .

## 3. Supabase Auth e CORS da API FACODI

O frontend cria redirecionamentos de Auth com `window.location.origin`. Para permitir login e confirmação **no Worker**, a allowlist do Supabase Auth hospedado precisa de conter:

- `https://facodi.marcelo-0d6.workers.dev/auth/callback**`;
- `https://facodi.marcelo-0d6.workers.dev/auth/reset-password**`.

As duas entradas estão no `supabase/config.toml` do repositório, **mas o ficheiro versionado não garante que foram aplicadas à configuração Auth alojada**. Confirmar em https://supabase.com/dashboard/project/wvkjainfwsyiyfcmbtid/auth/url-configuration antes de testar links de email. Não mudar o `site_url=https://tube.open2.tech` enquanto o Auth continuar partilhado entre FACODI e Tube.

A função Edge `facodi-submit-playlist` foi atualizada no Supabase para **v3, ACTIVE, `verify_jwt=true`**, permitindo em CORS apenas a origem Workers exata `facodi.marcelo-0d6.workers.dev` em vez do sufixo geral `.marcelo-0d6.workers.dev`. As demais origens previstas na lógica existente foram preservadas. Não foi chamado nenhum endpoint de submissão nem criado conteúdo sintético.

## 4. Verificações e smoke tests

O `scripts/validate-facodi-project-pages.mjs` corre em cada build e verifica:

- configuração Wrangler e fallback SPA;
- `_headers` com `noindex` do preview e cabeçalhos de proteção;
- cache de assets Vite com hashes;
- presença dos callbacks Workers na configuração Supabase;
- preservação do `site_url` Tube;
- CORS FACODI restringido ao hostname Workers exato;
- ausência de secrets no `wrangler.jsonc`.

Foi acrescentado o comando de verificação pública, **somente leitura**:

```sh
bun run test:workers:smoke
```

Esse smoke test consulta rotas SPA, `robots.txt`, `sitemap.xml` e headers `noindex`/segurança depois do deployment. Não autentica, não envia emails, não altera dados e não chama APIs de escrita. Só deve ser considerado aprovado quando o commit atualizado estiver efetivamente publicado na Cloudflare.

## 5. Limites e boas práticas para release

1. Confirmar na dashboard Cloudflare o build com a branch `facodi` e o commit atual; a publicação automática pode ocorrer depois do CI.
2. Confirmar no ambiente Cloudflare **apenas variáveis públicas de build** `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`; nunca usar `service_role`, chaves secretas nem tokens de administração no Vite.
3. No Supabase hospedado, verificar as URLs de redirecionamento do Workers antes de iniciar login, confirmação ou recuperação por email.
4. Executar `bun run test:workers:smoke` depois do deploy. Caso falhe a header `X-Robots-Tag`, confirmar se `public/_headers` foi incluído nos assets e se o Worker serve assets estáticos diretamente.
5. Testar manualmente com uma conta real de editor/estudante as rotas protegidas, **sem disparar emails** nesta fase. Não usar registos de colaboradores sem consentimento para testes.
6. Manter `www.facodi.com` como o único domínio indexável; não adicionar `workers.dev` ao sitemap ou ao canonical.
7. Os 13 templates FACODI continuam num catálogo isolado de pré-visualização. O Auth partilhado com o Tube e o serviço de email global não foram alterados.

**Estado de publicação:** a acessibilidade das páginas no Workers foi confirmada inicialmente; os novos headers e metadados só estarão ativos depois do build do commit correspondente. A verificação externa final do `noindex` determina se esta atualização entrou efetivamente em produção no Worker.

## 6. Verificação após a publicação

Após o build bem-sucedido **GitHub Actions #248** (lint, TypeScript, testes, validação de email e Vite), foram consultadas as páginas públicas do Workers por URL absoluto:

- `/about`: conteúdo FACODI servido, robots meta `noindex, nofollow, noarchive`, canonical `https://www.facodi.com/about`.
- `/community`: conteúdo FACODI servido, robots meta `noindex, nofollow, noarchive`, canonical `https://www.facodi.com/community`.
- `/robots.txt`: devolve texto com sitemap do domínio canónico.
- `/sitemap.xml`: lista apenas `https://www.facodi.com/` e rotas públicas.

Uma ferramenta de navegação secundária não conseguiu ler os **headers HTTP brutos** e reportou incorretamente 404 em duas navegações relativas. A verificação independente por URLs absolutos devolveu o conteúdo normal dessas rotas. Consequentemente, a meta tag `noindex` foi confirmada em produção, mas `X-Robots-Tag` e os demais headers HTTP ainda dependem do smoke test `bun run test:workers:smoke`, executado num ambiente com acesso de rede. Não declarar esses headers testados apenas com base no código fonte.

O Auth alojado ainda não foi consultado para confirmar que as URLs de callback do Workers estão na allowlist. Nenhum email foi enviado ou agendado. Não se alterou o domínio canónico nem o DNS.
