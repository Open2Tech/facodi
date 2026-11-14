# Frontend FACODI

React + Vite SPA, Bun, TypeScript e Supabase. Ver [operação e limites](../README.md).

## Camadas

- [src/App.tsx](../src/App.tsx): rotas lazy e guardas de acesso.
- [src/app/providers](../src/app/providers): QueryClient, i18n, Auth, tema, metadata e notificações.
- [src/integrations/supabase](../src/integrations/supabase): cliente único e tipos
  gerados do schema remoto `facodi`, reexportados pelo módulo shared.
- [src/entities/course](../src/entities/course): tipos, APIs e keys do catálogo,
  incluindo as unidades e os objetos educativos associados.
- [src/entities/facodi](../src/entities/facodi): autorização por `app_metadata.role`.
- [src/entities/auth](../src/entities/auth): chamadas ao Supabase Auth nativo.
- [src/features/auth](../src/features/auth): Auth nativo, hidratação, PKCE e
  invalidação de cache na mudança de identidade/papel.
- [src/features/courses/queries](../src/features/courses/queries): TanStack Query
  para catálogo público, conteúdo editorial e contagens administrativas.
- [src/components](../src/components): apresentação, formulários e primitivas shadcn.
- [src/pages](../src/pages): composição das páginas, sem acesso direto a dados.
- [src/shared/lib/validation.ts](../src/shared/lib/validation.ts): validação
  centralizada com Zod; formulários usam React Hook Form.
- [src/i18n/locales](../src/i18n/locales): quatro idiomas, um único conjunto de keys.

Consultas públicas têm filtros explícitos mesmo em sessões editoriais.
Consultas editoriais têm keys com identidade, cancelamento e limpeza de cache.
Writes exigem uma linha devolvida; uma atualização sem linha não é tratada como
sucesso. Apenas publicação/arquivamento mudam estados; edição não apaga campos
avançados que não estejam no formulário.

HTML é sanitizado com DOMPurify e allowlist de elementos de texto, sem scripts,
frames, estilos ou eventos. Links para recursos externos só aceitam HTTP(S).

## Verificação

Testes co-localizados cobrem rotas/papéis, hidratação e limpeza de cache,
contratos Data API, validação, navegação e HTML. MSW simula respostas HTTP,
sem necessidade de utilizadores remotos. Playwright cobre navegação e
responsividade. Estes testes não substituem a matriz RLS com sessões reais.

## Histórico

O frontend social Tube O2 e o adaptador Odoo foram retirados da árvore ativa.
Documentos em `docs/features/facodi-curriculum*`, assets antigos e o servidor
de metadata descrevem a integração anterior, não a arquitetura FACODI atual.
Não executar/publicar configurações históricas em produção.
