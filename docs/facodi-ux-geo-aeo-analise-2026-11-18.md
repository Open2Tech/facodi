# UX, GEO e AEO: análise do site publicado e correções

**Data:** 2026-11-18
**Base:** facodi.com depois do PR #58, build local com o catálogo real (9 cursos, 328 UCs,
1 997 objetos de aprendizagem, 137 sequências) e navegação no site em desktop e em telemóvel (375 px).

## Como a FACODI é lida hoje

| Leitor | O que encontra |
|---|---|
| Pessoa no browser | Uma SPA rica: cada vídeo mostra a UC, a trilha da unidade, as sequências e o vídeo seguinte |
| Googlebot (executa JS, com atraso) | O mesmo, quando chega a renderizar |
| GPTBot, ClaudeBot, PerplexityBot, Bing em muitos casos (não executam JS) | Desde o #58: título, descrição e breadcrumb. Mas as páginas de UC, vídeo e sequência **não ligavam a nada**: o grafo do catálogo só existia depois do JavaScript |

## Diagnóstico

### GEO e AEO

1. **Grafo do catálogo invisível sem JavaScript.** As páginas de UC não listavam os vídeos, os vídeos
   não apontavam para a UC nem para as sequências, e as sequências não listavam as aulas. O
   `ItemList` das sequências saía sem `itemListElement` no HTML estático (no browser tinha).
2. **Descrições repetidas.** 443 das 2 011 páginas (22%) partilhavam a mesma meta description. São textos
   editoriais de aviso ("Vídeo externo disponibilizado pelo canal Odoo. Selecionado para consulta
   académica…"), iguais em dezenas de vídeos, e nunca dizem de que trata a página. É exatamente esse texto
   que os motores de resposta citam.
3. **FAQ só nos dados estruturados.** As quatro perguntas do `FAQPage` de `/about` não apareciam na página.
   O Google pede que o conteúdo marcado esteja visível.
4. **Nenhuma ação de pesquisa declarada.** Assistentes e agentes não tinham como saber que a biblioteca se
   pesquisa em `/resources?search=`.

### UX

5. **A pesquisa da página inicial leva a uma página vazia.** "O que queres compreender a seguir?" enviava
   para `/units?search=`, que só procura títulos e códigos de UC. Por exemplo, "derivadas" dá 0 UCs, mas
   na biblioteca dá 23 resultados.
6. **Etiquetas internas como "temas em destaque".** A home mostrava `ualg`, `facodi`, `uc`, `guia-estudo`
   e `recurso-externo`. São marcas do processo editorial, não temas de estudo.

## O que este PR muda

| # | Mudança | Onde |
|---|---|---|
| 1 | Cada snapshot ganha grupos de ligações com título. **UC** → vídeos da trilha aprovada, pela ordem curada, e sequências da UC. **Vídeo** → UC(s) e sequências onde aparece. **Sequência** → aulas por ordem e UCs relacionadas. **Módulo** → materiais. **Curso** → UCs | `scripts/generate-seo-snapshots.mjs`, `renderSnapshotBody` |
| 2 | O `ItemList` estático das sequências passa a ter as aulas, igual ao que o browser mostra | idem |
| 3 | Uma descrição que não nomeia o assunto passa a começar pelo título ("Derivadas. Vídeo externo do canal…"). Duplicados: 443 → 10 (os 10 que restam são vídeos repetidos no catálogo) | `subjectDescription` em `seo.ts` |
| 4 | FAQ visível em `/about`, com o mesmo texto do JSON-LD. No snapshot, o FAQ sai também como HTML | `About.tsx`, `renderSnapshotBody` |
| 5 | `SearchAction` no `WebSite` | `websiteJsonLd`, `index.html` |
| 6 | A pesquisa da home vai para a biblioteca, e uma pesquisa de UCs sem resultados oferece "Procurar «termo» nos vídeos e recursos" | `Home.tsx`, `Units.tsx`, 4 locales |
| 7 | Os temas da home passam a usar o mesmo vocabulário curado do filtro da biblioteca (`list_public_resource_topics_v1`) | `listTopics` |

Regras mantidas:
- **Público é o que o site já mostra.** Os dados vêm das mesmas leituras públicas que o site faz: as trilhas de UC usam só ligações `approved`, e os materiais de módulo usam as ligações visíveis por RLS.
- **Nada é gerado.** Todo o texto vem do catálogo ou dos ficheiros de tradução.
- **O build continua a falhar se faltarem dados.**

O build passa a fazer 137 chamadas ao RPC das sequências (6 em paralelo) e leva cerca de 15 s a mais.

## Números depois do PR (build local)

- 2 010 snapshots. 1 429 já têm pelo menos uma ligação para outra página do catálogo (antes do PR: só o índice de cursos, as páginas de curso e o índice de sequências).
- 478 páginas de recurso não estão em nenhuma UC nem sequência; só são encontradas pelo sitemap e pela pesquisa.
- 92 das 328 UCs não têm vídeos aprovados nem sequências.

## Próximos passos (fora deste PR)

### Dados e curadoria (equipa editorial)

1. **Reescrever as descrições de aviso.** O aviso legal pode ficar no corpo da página. A descrição deve dizer o que se aprende ("Exercícios resolvidos de derivadas: regra da cadeia, produto e quociente"). É a mudança com mais impacto em AEO.
2. **Títulos em maiúsculas.** 113 páginas, sobretudo UCs importadas sem acentos ("SOCIOLOGIA DA EDUCACAO").
3. **Vocabulário de temas.** O vocabulário curado hoje é dominado por `gestao`, `erp` e `odoo` (104 recursos). Vale alargá-lo às áreas com mais conteúdo (psicologia, matemática, design) para a home refletir o catálogo.
4. **Etiquetas internas.** `apoio-ao-estudo`, `recurso-externo`, `video` e `youtube` aparecem como chips nos cartões e nas páginas de recurso. Podem passar para `metadata` ou ser filtradas na interface.
5. **Os 478 recursos órfãos.** Ligá-los a uma UC ou sequência, ou rever se devem continuar públicos.

### UX

1. **Vídeo no telemóvel.** Num ecrã de 812 px, o leitor começa a 853 px, abaixo da dobra. O botão principal é "Ver no YouTube", que tira a pessoa da FACODI. Sugestão: o leitor logo depois do título e "Ver no YouTube" como ação secundária.
2. **Breadcrumb do recurso** mostra o código da UC ("19411002") em vez do nome.
3. **Avisos repetidos.** A página de UC tem três avisos antes do conteúdo. Um aviso curto, com ligação para "Como funciona", chega.

### SEO técnico

1. **Soft 404.** Qualquer URL inexistente responde 200 (`not_found_handling: single-page-application`). A página 404 já tem `noindex`, mas só depois do JavaScript. Um Worker que responda 404 às rotas desconhecidas resolve.
2. **Home sem corpo estático.** `/` é o `index.html`, que também serve de fallback do SPA. Pôr lá o conteúdo da home faria esse texto aparecer em todas as rotas desconhecidas. A solução depende do ponto anterior.
3. **`uploadDate` nos vídeos.** O Google exige-o para resultados de vídeo. O catálogo não guarda a data de publicação do YouTube; pode ser preenchida pela YouTube Data API, que o projeto já usa.
4. **Search Console e Bing Webmaster Tools.** Submeter o sitemap e acompanhar a cobertura (continua pendente desde o #58).
