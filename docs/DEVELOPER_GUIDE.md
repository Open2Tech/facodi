# Developer Guide

Guia rapido para contribuir no frontend FACODI.

## Stack

- React 19
- TypeScript
- Vite
- Supabase JS
- Playwright (E2E)

## Primeiros Passos

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

Aplicacao local: http://localhost:3000

## Arquitetura de Dados

Entrada unica de catalogo:

- `services/catalogSource.ts` -> `loadCatalogData()`

Regra:

- Componentes nao devem conhecer detalhes de schema.
- O catalogo canonico vem das views `facodi.v_catalog_*`.
- Mapeamento e normalizacao ficam em `services/`.
- Dominio de video/pipeline usa views `facodi` e Edge Functions `v2_*`; detalhes em `docs/FACODI_V2_VIDEO_PIPELINE.md`.

## Supabase

Cliente compartilhado:

- `services/supabase.ts`

Regras essenciais:

- Nao usar service role key no frontend.
- Nao acessar `auth.users` no cliente.
- Respeitar RLS para dados por usuario.
- Gerar tipos com `pnpm exec supabase gen types typescript --project-id wvkjainfwsyiyfcmbtid --schema public,facodi > services/supabase.types.ts`.

## Testes e Validacao

```bash
pnpm build
pnpm test:e2e
pnpm security:check-rls
```

Quando executar:

- `build`: sempre.
- `test:e2e`: alteracoes de fluxo, tela, auth ou navegacao.
- `security:check-rls`: alteracoes de schema, policy ou integracao de dados.

## Estrutura Recomendada

- `components/`: UI e composicao de paginas.
- `services/`: acesso a dados e integracoes.
- `contexts/`: estado global.
- `hooks/`: logica reutilizavel de dominio.
- `data/`: traducoes e conteudo estatico nao-catalogo.

## Convencoes para PR

- Explique o problema e o impacto funcional.
- Inclua evidencias de validacao.
- Documente riscos e eventual rollback.
- Atualize docs afetados pela mudanca.
