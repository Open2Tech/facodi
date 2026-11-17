# AEO, GEO e crescimento: conteúdo legível sem JavaScript e próximos passos

**Data:** 2026-11-17
**Âmbito:** SEO, AEO (motores de resposta), GEO (motores generativos), UX/UI, comercial e marketing.

## O problema

A FACODI é uma SPA. Os snapshots de build já davam a cada página o seu `<head>` (título,
descrição, canonical, JSON-LD), mas o `<body>` chegava vazio: `<div id="root"></div>`.

O Googlebot executa JavaScript, mas com atraso e orçamento limitado. Os crawlers dos motores
de resposta e de IA (GPTBot, ClaudeBot, PerplexityBot, Bingbot em muitos casos) leem só o
HTML. Para eles, cada página da FACODI era um título sem texto e sem ligações, e o catálogo
só era descoberto pelo `sitemap.xml`.

## O que este PR muda

| Mudança | Onde | Para quê |
|---|---|---|
| Corpo estático em cada snapshot: breadcrumb, `<h1>`, descrição e ligações públicas | `renderSnapshotBody` em `src/shared/seo/snapshots.ts` | Crawlers sem JavaScript leem o conteúdo e seguem o catálogo. O `createRoot` substitui este HTML no primeiro render (há um teste para isso) |
| Página de curso lista as suas UCs; `/courses` lista os cursos; `/sequences` lista as sequências | `scripts/generate-seo-snapshots.mjs` | Ligações internas rastreáveis, além do sitemap |
| `/llms.txt` gerado no build (formato llmstxt.org) | `renderLlmsTxt` | Um mapa simples do projeto e do catálogo para modelos de linguagem |
| `FAQPage` em `/about`, com respostas copiadas do texto visível da página | `aboutMeta`, `ABOUT_FAQ` em `src/shared/seo/seo.ts` | Perguntas que as pessoas fazem aos assistentes ("a FACODI é gratuita?", "quem criou?") ficam com resposta estruturada |
| `Organization` com `description` e `sameAs` (Instagram @somosfacodi) | `organizationJsonLd`, `index.html` | Liga o perfil oficial ao site nos grafos de conhecimento |
| Ligação ao Instagram no rodapé, com `rel="me"` | `FacodiLayout.tsx` + 4 locales | Prova de identidade e caminho do site para a rede |

Nada foi inventado: as perguntas novas da FAQ estão nos quatro idiomas, e as respostas são
as frases que já aparecem em `/about`.

## Próximos passos sugeridos (fora deste PR)

### SEO, AEO e GEO

1. **Search Console e Bing Webmaster Tools.** Submeter o sitemap e verificar a cobertura
   depois do deploy. O Bing alimenta vários assistentes.
2. **FAQ visível.** Mostrar as quatro perguntas em `/about` como lista de perguntas e respostas,
   para o JSON-LD corresponder ao texto visível palavra por palavra.
3. **Respostas por UC.** Nas páginas de UC, um parágrafo curto do tipo "o que se estuda em
   [UC]" tende a ser a frase citada pelos motores de resposta. Usar o resumo editorial e
   nunca gerar texto sem revisão.
4. **Idiomas.** Quando houver URLs por idioma, acrescentar `hreflang`. Hoje o idioma muda só
   no cliente, na mesma URL.
5. **IndexNow** no deploy, para o Bing e os parceiros saberem logo das páginas novas.

### UX e UI

1. **Uma cor de destaque por peça.** Esta regra já foi proposta para o kit de divulgação v03.
   A cor de destaque aparece sobre o azul (#142846) e nunca como texto sobre o creme. O amarelo
   #EFFF00 sobre o creme tem contraste de 1,07:1.
2. **Texto mínimo.** No Instagram (peças de 1080 px), nenhum texto abaixo de 36 px. No site,
   confirmar que as legendas em `font-mono text-xs` mantêm contraste de 4,5:1 nos dois temas.

### Comercial e marketing

1. **Página "Para instituições"**, com o piloto gratuito para uma turma, o que a universidade
   recebe (percurso, workshop de arranque, relatório de uso) e um contacto. Sem preços: o
   projeto ainda não fatura.
2. **Captação para o Jornal** (newsletter). Um campo de email no rodapé e no fim das páginas de
   UC, quando houver serviço de envio com consentimento explícito.
3. **UTMs** nas ligações publicadas no Instagram e na newsletter, para saber de onde vêm as
   visitas sem cookies de terceiros.
