# RFC — Cursos da Comunidade: piloto Odoo 19

> **Estado:** proposta para revisão. **Este PR contém documentação apenas.** Não altera frontend, Supabase, conteúdos publicados, permissões, deploy ou produção. Base de investigação: branch facodi e schema facodi, leituras em 21/11/2026.

## 1. Visão e decisão arquitetural

Criar uma porta de entrada visível para quem quer **aprender um assunto por etapas**, sem precisar de ingressar numa licenciatura, procurar uma unidade curricular ou reunir vídeos manualmente. A identidade pública recomendada é **Cursos da Comunidade**, com a expressão de apoio **Cursos livres, conhecimento partilhado**. Piloto: **Odoo 19**.

**Decisão recomendada: não criar um modelo persistente novo.** Um curso comunitário será uma apresentação editorial de um **learning object de tipo collection** existente, com filhos ligados por **learning_object_relations**: módulos, playlists, vídeos e referências reutilizáveis. Os registos de vídeos e módulos não são duplicados. As formações académicas continuam nas tabelas **courses** e **curricular_units**. Esta distinção preserva o significado de ECTS, instituição e plano curricular, que não se aplicam automaticamente aos cursos comunitários.

O termo "curso" neste contexto é uma promessa de **orientação pedagógica e uma ordem de descoberta**, não de diploma, certificação, ECTS ou curso oficial Odoo.

## 2. Estado verificado em 21/11/2026

### Frontend (branch facodi)
- **/courses** lista facodi.courses, com pesquisa, idioma, instituição e degree_type: src/pages/Courses.tsx, src/entities/course/course.catalog.ts e src/entities/course/course.api.ts.
- **/resources/:slug** já resolve collections e os seus filhos por tipo (module, playlist, video); **/modules/:slug** e **/sequences/:slug** têm experiências próprias.
- **/sequences** tem tracking próprio para sequências editoriais no schema facodi. Não se deve confundir objeto learning_objects do tipo playlist com uma linha efetiva de facodi.playlists.
- Os principais pontos de descoberta são src/pages/Home.tsx, src/components/learning/LearningPathGuide.tsx e src/components/layout/FacodiLayout.tsx.
- docs/facodi-identidade-v4.md estabelece paleta HSL e composição de cores; **não alterar a estrutura de variáveis HSL, os papéis semânticos, nem introduzir uma paleta concorrente**.

### Supabase (SQL estritamente de leitura)
- Existem **22 cursos** públicos ativos em facodi.courses. A pesquisa por "Odoo" em título, código e resumo de cursos não devolveu resultados.
- Existe a collection pública **Odoo — percursos práticos de ERP e gestão**, slug **facodi-odoo19-percursos-gestao**, com **21 relações contains: 7 modules e 14 playlists**.
- Entre os objetos públicos ativos identificados por tag/título Odoo estão **88 vídeos, 19 playlists, 7 modules, 6 external_resource e 1 collection**. A contagem descreve inventário, não validade científica nem equivalência a curso completo.
- As 14 playlists filhas possuem entre **2 e 10 vídeos públicos relacionados** cada uma.
- Não foram encontrados registos correspondentes a Odoo na pesquisa textual por título/descrição da tabela facodi.playlists. Portanto, **não prometer estado de conclusão, progresso de curso nem tracking de playlists learning_objects sem auditoria**.

## 3. Estrutura conceptual

| Conceito visível | Representação atual | URL/experiência |
| --- | --- | --- |
| Formação académica | facodi.courses + curricular_units | /courses/:slug |
| Curso da Comunidade | learning_objects (collection) com marcador editorial | /resources/:slug contextual |
| Módulo | learning_objects (module) | /modules/:slug ou destino canónico existente |
| Playlist de recursos | learning_objects (playlist) | /resources/:slug |
| Sequência editorial | facodi.playlists + playlists relacionadas, quando existente | /sequences/:slug |
| Vídeo ou referência | learning_objects (video, external_resource, document etc.) | /resources/:slug |

A collection original continua collection para a base de dados, e apenas as collections **expressamente selecionadas** recebem apresentação de curso. Outras collections permanecem normais. Uma mesma playlist/vídeo pode integrar vários cursos sem novos registos de conteúdo.

### Contrato editorial mínimo a discutir (não aplicado neste PR)

Usar um marcador opcional, validado e com fallback, dentro do **metadata JSONB já existente** de learning_objects:

    {
      "presentation": {
        "kind": "community_course",
        "topic": "odoo",
        "level": "beginner",
        "product_version": "19",
        "estimated_minutes": null
      }
    }

- A origem do tipo é o campo **presentation.kind**, não uma tag pesquisável ou um nome de slug.
- **topic** viabiliza filtro temático; **level** é opcional, apenas quando curado; **product_version** caracteriza o foco editorial, não garante que toda a fonte seja da versão 19.
- **estimated_minutes** só deve ser mostrado depois de somar durações comprovadas; null significa ocultar.
- Título, descrição, objetivos, idioma, tags, URL de fonte e relações permanecem nos campos já existentes. Não copiar para metadata.
- Apenas collections publicadas e em estados públicos autorizados entram no catálogo. O marcador nunca ultrapassa RLS, nem é alterável anonimamente.
- Reaproveitar qualquer convenção equivalente já implementada, em vez de multiplicar chaves editoriais.

**Alternativas não recomendadas:** criar tabela community_courses; inventar curricular_units para os cursos Odoo; transformar todos os tipos collection em cursos; usar uma tag simples como autorização editorial; duplicar vídeos; criar frontend/API própria de LMS.

## 4. Arquitetura de informação e navegação

### Entrada única de cursos
- Manter **/courses** e todos os links existentes, mas oferecer escolha acessível: **Formações académicas | Cursos da Comunidade**.
- URLs propostas: **/courses?kind=community** e **/courses?kind=community&topic=odoo**. A vista académica mantém comportamento atual e filtros próprios; a comunitária apresenta busca, idioma e (quando existirem escolhas) tema e nível.
- Na primeira versão, a seleção de collections é feita sobre consulta pública e filtrada **antes da paginação**, com respeito a RLS. Nunca ler uma página arbitrária do catálogo de recursos e filtrar depois, nem tentar misturar os dados de facodi.courses com collections como se fossem a mesma tabela.
- Manter a URL canónica **/resources/:slug** para a collection; ResourceDetails passa a renderizar um detalhe contextual de curso **quando** o marcador editorial é válido, sem duplicar rotas/SEO. /courses permanece a porta de descoberta.
- A navegação principal não precisa de mais uma entrada de primeiro nível: o submenu/aba em Cursos, um destaque na home e links no LearningPathGuide são suficientes para o piloto.

### Home e descoberta
- Criar faixa **Cursos da Comunidade** logo depois dos atalhos principais, sem prejudicar **Continuar a aprender**.
- Destacar 3 ou 4 experiências **reais e publicadas** com Odoo; CTA **Explorar cursos livres** e ligação **Ver cursos de Odoo**.
- Reaproveitar os padrões de loading/erro existentes; se não houver cursos aprovados, ocultar a faixa, sem cartões inventados.

### Cartões
- Título, promessa educativa clara, nível quando verificado, contagem verdadeira de módulos/recursos, idioma, ícone temático e CTA **Começar a aprender**.
- Não exibir instituição, ECTS, certificação, progresso, duração ou avaliação quando inexistentes.
- Estética college FACODI: cores fortes via tokens HSL atuais, ícone Odoo-temático, cartões com contraste, hover/focus e toque acessíveis. Não usar imagens de stock ou marcas externas como se fossem endosso.

### Página do curso comunitário
1. Breadcrumb: **Cursos → Cursos da Comunidade → Odoo → título**.
2. Hero: **Curso livre da comunidade**, título, objetivo, nível verificado, idioma e CTA **Começar pelo primeiro módulo**.
3. **O que vais aprender**: objetivos claros, pré-requisitos opcionais.
4. **O teu percurso**: etapas numeradas, em ordem explícita de learning_object_relations; links para módulos, playlists e referências.
5. **Aulas e playlists**: sem duplicar a mesma aula nas secções; mostrar a fonte original e respeitar canónicos.
6. **Fontes e aprofundamento**: Odoo Learn, documentação Odoo 19 e autores dos vídeos; notas sobre versões diferentes ou não verificadas.
7. **Relacionados**: módulos, sequências, outros cursos comunitários e, se pertinente, formação académica.
8. Aviso de independência: curadoria FACODI sobre temas Odoo; sem alegação de curso oficial, parceria ou certificação.

Texto conceptual de exemplo (não é conteúdo publicado):

    CURSOS DA COMUNIDADE / ODOO 19
    Odoo sem mistérios: começa pelo essencial
    Curso livre · Iniciante · Português
    Um caminho curto para entender o ERP e explorar módulos na prática.
    [Começar pelo primeiro módulo]   [Explorar materiais]

    O TEU PERCURSO
    01  O que é um ERP?             [Abrir módulo]
    02  Descobre o fluxo de trabalho [Material a validar]
    03  Aprofunda com vídeos         [Abrir playlist]

    Fontes originais · Guia independente FACODI

Os itens de exemplo não atestam revisão dos vídeos.

### Progresso
- Público sem conta consegue navegar e aprender.
- Notas continuam ligadas ao vídeo, no caderno existente.
- Exibir apenas progresso verdadeiramente suportado por **sequências editoriais identificadas e autenticadas**. Nenhuma barra de conclusão agregada de curso no MVP, a menos que um mecanismo existente seja demonstrado como correto. Não criar matrícula fictícia nem sistemas paralelos de progresso.

## 5. Comunicação, acessibilidade, licenças e confiança

- **Identidade:** respeitar docs/facodi-identidade-v4.md e DESIGN.md; preservar integralmente canais HSL, variáveis :root/.dark e Tailwind existentes. Usar bg-primary, bg-brand-cyan, bg-brand-orange, bg-brand-pink, bg-brand-mint, bg-card, bg-ink e respetivos papéis apropriados.
- **Tipografia:** Space Grotesk + IBM Plex Mono; títulos curtos, texto legível, boa hierarquia e zero poluição visual.
- **Voz:** clara, humana, em PT usando "tu"; traduções reais EN/ES/FR. Exemplos: **Aprende Odoo sem perder o fio à meada**, **Do primeiro clique ao teu primeiro fluxo**, **Explora o próximo módulo**.
- **Acessibilidade:** WCAG 2.2 AA, contraste medido na superfície real, foco visível, alvos táteis, teclado, 200% zoom, reduced motion, labels claros e conteúdo não dependente só de cor.
- **Fontes:** Odoo Learn e documentação Odoo 19 como referência. Nem todo tutorial publicado na Odoo Learn pode ser presumido v19; auditar origem e edição por recurso.
- **Copyright:** preferir ligações e embeds autorizados. Não copiar vídeos, thumbnails não autorizadas, slides ou transcrições integrais. Preservar créditos, autoria, licença e URL original.
- **Marcas:** Odoo é terceiro. Não usar "Curso oficial Odoo" para curadoria independente; logos só de acordo com regras aplicáveis. Não prometer certificado ou ECTS.
- **Curadoria:** revisão editorial leve (fonte, pertinência, ordem, link, duplicação, versão, copyright). Sem workflow de aprovações excessivo. IA apoia classificação, nunca inventa verificação.

## 6. Plano de implementação posterior (fora deste PR)

### Fase A — piloto editorial
- [ ] Verificar os 7 modules e as 14 playlists da collection base: autoria, links, ordem, idioma, versão, qualidade, durações e utilidade.
- [ ] Selecionar 3 percursos mínimos com módulos/referências suficientes e objetivos explícitos; ver [catálogo-semente-odoo19.md](./catalogo-semente-odoo19.md).
- [ ] Definir collections curadas por tema e reutilizar relações existentes sem duplicação.
- [ ] Atribuir marcador editorial apenas às collections aprovadas.
- [ ] Investigar mapeamento de playlists de recursos para sequências editoriais antes de exibir progresso.

### Fase B — UI de descoberta e aprendizagem
- [ ] Adicionar aba comunitária a /courses com filtros coerentes e estado na URL.
- [ ] Consulta pública específica às collections marcadas, filtrada antes de paginar e com estados de erro/vazio. Preferir query existente e RLS; RPC nova só com necessidade comprovada.
- [ ] Cartão + faixa da home + i18n PT/EN/ES/FR; sem mudar layout/paleta globais.
- [ ] Detalhe de collection contextual em /resources/:slug, por composição pequena sobre ResourceDetails, useLinkedCatalogAssets e módulos existentes.
- [ ] Links entre curso → módulo → playlist/vídeo → recursos relacionados; não duplicar componentes de player/progresso.
- [ ] Atualizar HowItWorks/LearningPathGuide com explicação simples e sem sugerir hierarquia rígida.

### Fase C — QA e publicação
- [ ] Testes unitários do marcador metadata, filtering, deduplicação, ordenação por position, fallbacks e canonical.
- [ ] Testes de integração de RLS/visibilidade pública, permissões, notas, URLs existentes e ausência de progresso fictício.
- [ ] E2E Playwright em mobile e desktop; teclado, contraste, reduced motion e quatro idiomas.
- [ ] bun install --frozen-lockfile; bun run lint; bun run typecheck; bun run test; bun run build.
- [ ] Validar no Worker de preview Cloudflare ligado à branch, mantendo X-Robots-Tag: noindex; sem deploy Vercel repetido.
- [ ] Publicar apenas após aprovação e verificação do conteúdo. Rollback: remover marcador editorial das collections piloto (sem eliminar vídeos, módulos ou URLs).

## 7. Aceitação e prevenção de regressões

- [ ] Qualquer visitante descobre cursos comunitários na home e em /courses, abre um item e chega ao primeiro módulo real em até dois cliques a partir do detalhe.
- [ ] Formações académicas atuais continuam a aparecer com URLs, filtros, dados e contagens intactos.
- [ ] Collections não marcadas continuam recursos normais; não há novos tipos/tabelas/migrations.
- [ ] O mesmo vídeo pode integrar vários cursos, mas existe uma única ficha e uma fonte creditada.
- [ ] O catálogo comunitário nunca mostra conteúdo privado nem permite burlar RLS.
- [ ] Duração, nível, versão, progresso e fontes refletem factos verificados; sem diplomas ou promessas sem base.
- [ ] Mobile, desktop, modo escuro/claro, i18n e SEO mantêm coerência e acessibilidade.
- [ ] Não há alteração à estrutura/papéis HSL v4, ao fluxo de Auth, notas, sequências existentes nem às URLs canónicas.
- [ ] Preview não é indexado; nenhuma chave service_role no cliente.

**Falha se**: cursos académicos forem substituídos por coleções; se /resources quebrar; se playlist de learning_objects for tomada como sequência rastreada sem prova; se forem criadas UCs fictícias; se o branding insinuar parceria oficial com Odoo.

## 8. Riscos, escolhas pendentes e extensibilidade

| Risco | Mitigação |
| --- | --- |
| Confusão entre curso, coleção e sequência | Nome editorial e páginas contextuais; uma só entidade persistida |
| Mistura académico/comunidade | Abas com filtros próprios e tipos de dados separados |
| Vídeo antigo apresentado como Odoo 19 | Verificar a versão por recurso; sinalizar desconhecida |
| Progresso impreciso | Sem progresso global; tracking apenas quando comprovado |
| Escala de consultas | Filtro de visibilidade e metadata antes de paginação; medir antes de criar RPC/índice |
| URL duplicada/SEO | Uma URL canónica por collection; filtros do catálogo sem páginas duplicadas |
| Marca/direitos | Fontes atribuídas, linguagem independente e links/embeds permitidos |
| Complexidade editorial | Curadoria leve, rollback simples, nada de aprovações em cascata |

**Decisões a validar:** nome principal **Cursos da Comunidade**; primeira leva com 3 cursos após revisão; collection generalista como hub Odoo ou primeiro percurso; eventual contribuição de utilizadores apenas numa fase posterior, aproveitando o fluxo de participação editorial já existente.

## 9. Fontes e artefactos relacionados

**Código:** [README](../../README.md), [CODEBASE](../CODEBASE.md), [identidade v4](../facodi-identidade-v4.md), [DESIGN](../../DESIGN.md), [Courses](../../src/pages/Courses.tsx), [course.api](../../src/entities/course/course.api.ts), [ResourceDetails](../../src/pages/ResourceDetails.tsx), [ModuleDetails](../../src/pages/ModuleDetails.tsx), [Sequences](../../src/pages/Sequences.tsx), [Home](../../src/pages/Home.tsx), [LearningPathGuide](../../src/components/learning/LearningPathGuide.tsx).

**Fontes oficiais:** [Odoo Learn](https://www.odoo.com/slides), [documentação Odoo 19](https://www.odoo.com/documentation/19.0/), [tutoriais de desenvolvimento Odoo 19](https://www.odoo.com/documentation/19.0/developer/tutorials.html), [contabilidade](https://www.odoo.com/documentation/19.0/applications/finance/accounting.html), [projetos](https://www.odoo.com/documentation/19.0/applications/services/project.html), [vendas](https://www.odoo.com/documentation/19.0/applications/sales/sales.html).

**Anexo operacional:** [Catálogo-semente Odoo 19](./catalogo-semente-odoo19.md).

---

Este PR serve para **rever/aprovar a proposta**. Implementação, dados, deploy e merge devem ocorrer apenas em trabalho posterior explícito.
