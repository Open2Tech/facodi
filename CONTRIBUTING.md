# Contributing to FACODI

Obrigado por contribuir com a FACODI.

## Fluxo Recomendado

1. Crie uma branch a partir da branch alvo do projeto.
2. Atualize o ambiente local e valide build.
3. Execute os testes e checks relacionados ao escopo da mudanca.
4. Abra PR com contexto, evidencias e risco residual.

## Setup Local

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

## Matriz de Validacao

Rode sempre antes do PR:

```bash
pnpm build
```

Rode quando houver impacto em UI, navegacao, autenticacao ou fluxos:

```bash
pnpm test:e2e
```

Rode quando houver impacto em schema, RLS ou integracao Supabase:

```bash
pnpm security:check-rls
```

## Regras de Arquitetura

- Use `pnpm` para manter lockfile consistente.
- Mantenha catalogo centralizado em `services/catalogSource.ts`.
- Nao coloque detalhes de banco/provedor em componentes.
- **Reutilize o cliente unico em `services/supabase.ts`** — nunca crie novas instancias com `createClient()`.
- Falhas de catalogo remoto devem aparecer explicitamente; nao reintroduza fallback local de catalogo.
- Fluxos FACODI de video devem chamar apenas Edge Functions `v2_*`. Functions antigas podem existir para compatibilidade, mas nao sao dependencias do frontend novo.

### Supabase-Specific Rules
- ✅ Frontend catalog/video reads use `facodi` read models.
- ✅ Never expose `service_role` or secret keys in client code.
- ✅ All data access through shared client singleton.
- ✅ Use RLS policies for row-level access control (not frontend-side auth).
- ✅ Query `public.profiles` for user data (not `auth.users`).
- ✅ Edge functions authenticate via Bearer token and enforce rate limiting.

## Contratos de Dados Obrigatorios

- `Course.id` estavel e unico.
- `CurricularUnit.courseId` deve apontar para `Course.id` existente.
- `Playlist.units` deve seguir como `string[]` de ids validos.
- Ordenacao de playlists deve ser deterministica.
- Submissoes de video usam `/videos/submit` e status em `/videos/submit/:jobId`.

## Ambiente e Seguranca

- Nunca commite `.env` ou `.env.local`.
- Nao use service role key no frontend.
- Use apenas chave publicavel no cliente (`VITE_SUPABASE_PUBLISHABLE_KEY`).
- Nao consulte `auth.users` no frontend; use `public.profiles`.

## Checklist de Pull Request

- Problema e escopo descritos objetivamente.
- Solucao explicada em termos de impacto funcional.
- Evidencias de validacao anexadas (build, E2E, RLS quando aplicavel).
- Capturas de tela para mudancas visuais relevantes.
- Riscos conhecidos, mitigacao e plano de rollback (quando aplicavel).

## Convencoes de Documentacao

- Atualize `README.md` quando comandos, setup ou arquitetura mudarem.
- Atualize `docs/` quando houver mudanca de processo, roadmap ou baseline tecnico.
- Se alterar guardrails, atualize `AGENTS.md` e instrucoes em `.github/instructions/`.

## Canais

- Envio de conteudo audiovisual: `/videos/submit`
- Contato institucional: https://open2.tech/contact
