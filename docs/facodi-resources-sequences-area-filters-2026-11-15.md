# Explorar por área — Recursos e Sequências

**Escopo:** React + Vite, branch `feature/facodi-topic-facets-resources-sequences`, 15/11/2026.

## Objetivo e UX
- Barra compacta de seis áreas no catálogo `/resources` e no índice `/sequences`: Matemática e estatística, Tecnologia e computação, Ciências e astronomia, Gestão e negócios, Línguas e comunicação, Educação e ensino.
- Layout horizontal com scroll no telemóvel e quebra de linha no desktop; botões acessíveis (`aria-pressed`), focos visíveis e indicação ativa.
- Todas as áreas + pesquisa + idioma + tipo + etiquetas podem ser combinados. Os filtros persistem no URL (`?area=...`) e podem ser partilhados/removidos individualmente; mudança de filtro reinicia a paginação.
- `/sequences` mostra contagens por área calculadas sobre a lista publicada, depois de pesquisa e idioma, **antes** de paginar; só mostra áreas disponíveis. Um percurso pode surgir em mais do que uma área.
- `/resources` não apresenta contagens fictícias: a pesquisa é paginada no Supabase e as contagens temáticas não são devolvidas pela API.
- Labels e descrições disponíveis em PT, EN, ES e FR. Mantido o tom visual FACODI, sem novos serviços, frameworks ou dependências.

## Critério editorial e limites
A taxonomia **não é uma classificação curricular homologada**. É uma ajuda à descoberta baseada nos títulos e etiquetas de recursos publicados e nos títulos/descrições de sequências. Um conteúdo pode integrar várias áreas, e outros podem não corresponder a nenhuma; o filtro «Todas as áreas» continua a mostrar o catálogo completo. As seis expressões de classificação da função SQL `facodi.search_public_resources_v4` e do helper `studyAreas.ts` devem ser mantidas em sincronia. Não se inferem créditos, atribuições ou novas associações académicas.

## Backend
A RPC `facodi.search_public_resources_v4` é **aditiva**, mantém `v3` para consumidores anteriores, replica as regras de visibilidade já existentes e utiliza `SECURITY INVOKER`. O novo parâmetro `p_area` é opcional, analisado após texto/idioma/etiquetas e **antes** da paginação. Ordenação por relevância e limites de `page_size` permanecem inalterados. As contagens por tipo continuam a refletir os filtros, excluindo apenas o próprio tipo.

Migrada diretamente no projeto Supabase existente, sem Supabase Branch, com versionamento `20261115212207_facodi_search_resources_area_facets_v4.sql` no Git. A `v3` permaneceu intacta. Não se alteraram tabelas, políticas RLS, storage, Auth ou dados.

## Verificação
- Comparar `v3` e `v4` com `p_area` vazio (mesmo total e critérios de ordenação).
- Confirmar áreas ativas, parâmetros combinados, resultados vazios e `?page=2`.
- Testar seleção/reseleção no mobile e desktop, remoção via chips e links partilhados.
- `bun run lint && bun run typecheck && bun run test && bun run build`.

**Nota:** a associação temática é uma curadoria editorial aproximativa, não um mecanismo de classificação por machine learning.
