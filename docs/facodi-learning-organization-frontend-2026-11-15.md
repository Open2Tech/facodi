# FACODI — Modelo de conteúdos e navegação pedagógica

**Data:** 15/11/2026  
**Aplicação:** React 19 + TypeScript + Vite + React Router + TanStack Query + Supabase `facodi`  
**Branch:** `facodi` em https://github.com/Open2Tech/facodi

## Porque esta reorganização?

O catálogo já tinha **6 cursos publicados**, **256 UCs publicadas**, **42 módulos públicos** (objetos `learning_objects.object_type='module'`) e **53 sequências/objetos editoriais do tipo playlist** na consulta de 15/11/2026. No entanto, os módulos ainda não tinham uma página própria na aplicação, e a distinção entre percurso académico e materiais de estudo era pouco explícita.

O novo guia apresenta o percurso conceptual:

**Curso → Unidade Curricular → Módulo**, com **Sequências e Recursos** como componentes reutilizáveis.

Esta é uma apresentação pedagógica para o estudante, **não uma regra rígida da base de dados**: uma sequência ou vídeo pode apoiar várias UCs e módulos.

| Elemento | Conceito | Fonte de dados | Onde navegar |
| --- | --- | --- | --- |
| Curso | Referência ao plano e à estrutura de formação | `facodi.courses` | `/courses` e `/courses/:slug` |
| UC | Componente curricular dentro de um curso | `facodi.curricular_units` | `/units`, `/courses/:slug/units/:unit` |
| Módulo | Guia editorial focado num tema, com atividades opcionais | `facodi.learning_objects` de tipo `module` | `/modules` e `/modules/:slug` |
| Sequência | Lista editorial de vídeos/aulas externos na ordem de estudo sugerida | `facodi.learning_objects` de tipo `playlist`, consultado pelas RPCs públicas editoriais existentes | `/sequences` e `/sequences/:slug` |
| Recurso | Vídeo, documento, leitura, tópico ou referência reutilizável | `facodi.learning_objects` | `/resources` e `/resources/:slug` |

**Detalhe importante:** nem todos os objetos `playlist` são sequências editoriais que aparecem na rota `/sequences`; a apresentação de sequências continua a depender das RPCs editoriais existentes. Uma associação dentro de um módulo nunca cria uma sequência automaticamente.

## Intervenções no frontend

- `src/components/learning/LearningPathGuide.tsx` reúne um guia acessível e uma explicação contextual curta. Reutiliza o mesmo vocabulário em todas as páginas.
- `/how-it-works`: mapa dos conceitos, comparação módulo vs sequência, recursos partilhados e aviso contra confusão com certificação académica.
- `/modules`: catálogo público de módulos com pesquisa e paginação.
- `/modules/:slug`: materiais publicados ligados ao módulo, por categoria, com ordem editorial, link para UC quando esta relação existe, proposta de atividade, entregável e critérios de autorrevisão quando o módulo tem esses metadados.
- O cabeçalho, o rodapé e a página inicial passaram a dar acesso à nova organização.
- Em Cursos, UCs, Recursos e Sequências (listas e detalhes) há uma explicação curta e um link para o guia completo.
- Na página de uma UC, os módulos realmente associados aparecem na secção própria, sem inferir relações a partir de títulos ou palavras-chave.

## Segurança e integridade dos dados

- **Nenhuma tabela, dado ou permissão do Supabase foi alterado** nesta intervenção.
- `src/entities/module/module.api.ts` consulta somente `learning_objects` com `object_type='module'`, `published=true`, `status='active'` e respeita RLS.
- Os materiais de cada módulo são recolhidos de relações reais `learning_object_relations(relation_type='contains')`; apenas filhos publicados/ativos são apresentados.
- Os links para UCs dependem de associações reais, de UC ativa e de curso publicado/ativo.
- A API usa `AbortSignal` do TanStack Query, paginação e lista limitada; não usa `service_role` nem escreve na base de dados.
- Nenhum progresso é assinalado como certificado. As sequências continuam a usar progresso autoassinalado e privado; os módulos mostram apenas guias e atividades, sem insinuar avaliação automática.
- Os avisos não qualificam módulos como conteúdos oficiais do Ifes/UAlg ou como habilitações académicas. A curadoria pode usar títulos e fontes sem revisão integral de todos os vídeos.
- Sem envio de emails ou alteração de Auth/DNS/Workers.

## Qualidade e acessibilidade

- Rotas React Router lazy loaded, seguindo o padrão existente;
- queries tipadas e cache/staleTime pelo TanStack Query;
- estados loading/error/empty com PageState;
- links semânticos, headings hierárquicos, listas e navegação por teclado;
- layout responsivo, sem dependências adicionais;
- conteúdo em português, inglês, espanhol e francês;
- entradas públicas em `sitemap.xml` e smoke test de Workers;
- verificações estáticas no script `scripts/validate-facodi-project-pages.mjs` executado durante cada build.

## Verificações operacionais após o CI

1. Confirmar lint, TypeScript, testes e build na última execução GitHub Actions da branch `facodi`.
2. Abrir `/how-it-works`, `/modules` e um módulo real em `/modules/ifes-adm26-estudo-3-matematica` no Worker.
3. Navegar a partir da UC respetiva até ao módulo; confirmar que apenas relações presentes na base são exibidas.
4. Confirmar a navegação em mobile, modo escuro e teclado.
5. Não anunciar alterações como disponíveis em Workers antes de confirmar a publicação da branch atual.
