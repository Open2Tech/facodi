# FACODI v4 — Design e voz

A FACODI tem a energia de uma boa conversa de estudo. Começa com uma pergunta, mostra ligações e ajuda a escolher por onde pegar. O kit v03, aprovado em 15 de novembro de 2026, inspira a v4 com papel quente, tinta azul-escura, um marcador amarelo vivo, Space Grotesk e cantos retos. A composição técnica segue o [sistema de design FACODI](../DESIGN.md).

## Cor em HSL

Os valores abaixo são os que a aplicação usa. O [CSS](../src/index.css) guarda os canais HSL nas variáveis de `:root` e `.dark`. O [Tailwind](../tailwind.config.ts) expõe as classes de cada papel, com suporte a modificadores de opacidade. Nos componentes, escolhe o papel da cor e deixa o tema escolher o valor.

| Papel | Valor HSL | Aplicação |
| --- | --- | --- |
| Papel | `hsl(50 60% 98%)` | Fundo claro. `bg-background` adapta-se ao tema. `bg-brand-paper` aplica o papel de marca. |
| Tinta | `hsl(216 56% 18%)` | Texto escuro sobre papel no tema claro, via `text-foreground`. Sobre marcadores vivos, usa `text-brand-ink`. |
| Sol | `hsl(64 100% 50%)` | Ação principal, seleção ou destaque. Usa `bg-primary text-primary-foreground`. |
| Sol pressionado | `hsl(64 100% 46%)` | Hover da ação primária, via `hover:bg-primary-hover`. |
| Ciano | `hsl(188 63% 52%)` | Etiqueta de referências externas, com texto de tinta. |
| Menta | `hsl(141 59% 78%)` | Etiqueta de módulos e documentos, com texto de tinta. |
| Laranja | `hsl(36 100% 60%)` | Etiqueta de unidades curriculares, com texto de tinta. |
| Rosa | `hsl(337 100% 72%)` | Etiqueta de vídeos e sequências, com texto de tinta. |
| Coral | `hsl(7 100% 74%)` | Etiqueta de tipos mistos ou sem categoria definida, com texto de tinta. |
| Azul | `hsl(213 57% 50%)` | Marca gráfica ou ícone. Dá ao rótulo associado uma cor de texto com contraste suficiente. |

Os tipos de conteúdo usam [`contentTone`](../src/components/catalog/contentTone.ts). Os estados editoriais usam [`statusTone`](../src/components/editorial/statusTone.ts). Para cada tipo ou estado, usa também o rótulo visível.

### Composição

- Dá espaço às cores vivas. Num bloco de leitura, deixa papel e tinta carregar o conteúdo e guarda o Sol para o passo que queres destacar.
- Mantém a cor das etiquetas ligada ao significado. Curso, unidade, sequência, vídeo, documento e referência devem ser reconhecíveis pelo texto e pelo ícone.
- Usa `bg-card text-card-foreground` para conteúdo em cartão e `bg-ink text-ink-foreground` para as bandas escuras. O tema escuro usa fundo `hsl(222 54% 9%)` e superfície `hsl(219 52% 14%)`.
- Mantém a estrutura de `:root`, `.dark` e Tailwind em propostas de cor. Se for mesmo necessário afinar um tom, revê os canais HSL do token existente e mede o contraste nos estados que o usam.

### Contraste

| Combinação em superfície opaca | Relação |
| --- | ---: |
| Tinta sobre Papel | 14,22:1 |
| Tinta sobre Sol | 13,18:1 |
| Tinta sobre Ciano | 6,53:1 |
| Tinta sobre Menta | 10,37:1 |
| Tinta sobre Rosa | 5,66:1 |
| Azul sobre Papel | 4,35:1 |
| Texto do tema escuro sobre o fundo do tema | 16,70:1 |

Para texto normal, usa 4,5:1 como mínimo. Para texto grande e para contornos ou sinais necessários a identificar controlos, usa 3:1 segundo os critérios aplicáveis. Em fundos translúcidos, mede o resultado sobre a superfície real. Testa também teclado, foco visível, a 200% de zoom e com movimento reduzido. Consulta a [WCAG 2.2 sobre texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) e [contraste não textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## Tipografia, marca e imagem

Space Grotesk leva títulos, corpo e controlos. IBM Plex Mono acompanha códigos, durações e contagens. Usa maiúsculas com parcimónia e deixa títulos longos quebrar de forma natural em telemóvel. As famílias vêm do [CSS da aplicação](../src/index.css).

Nas peças v03, parte do wordmark ou do símbolo **F.** conforme o espaço. O wordmark funciona em cartazes, apresentações e capas. O símbolo funciona no favicon e no avatar, com margem para o recorte circular. Conserva a proporção do master e usa [os ativos web versionados](facodi-brand-media-and-email-canonical-2026-11-15.md#media-ativos) no site. Para recursos educativos, mostra a imagem que ajuda a identificar a fonte e credita a autoria original.

## Voz próxima, com ritmo Monynha

Usa «tu» em PT. Faz perguntas que alguém teria mesmo enquanto estuda. Põe o verbo no botão e a personalidade na frase à volta. Um título pode ter ritmo. Uma instrução precisa de ser logo entendida. Em EN, ES e FR, adapta a intenção e valida a terminologia do catálogo no respetivo idioma.

| Momento | Como pode soar | Ação |
| --- | --- | --- |
| Descobrir | «O que queres perceber melhor hoje?» | **Explorar recursos** |
| Retomar | «Ficaste a meio? Pega na aula onde paraste.» | **Continuar a estudar** |
| Sugerir | «Encontraste aquela aula que fez tudo encaixar? Partilha o link.» | **Sugerir recurso** |
| Pesquisa vazia | «Este tema ainda tem espaço na estante. Tens um link que ajude?» | **Sugerir recurso** |
| Confirmação | «Recebemos a tua sugestão. Podes acompanhar a decisão no histórico.» | **Ver histórico** |
| Erro com recuperação | «O link precisa de uma nova análise. Confirma o endereço e tenta outra vez.» | **Analisar link** |

Usa «Aprender muda tudo» em campanha. No campus, aponta para um curso, uma unidade, uma aula ou uma ação real. Apresenta a FACODI como um campus digital aberto e independente. Confirma factos e autorizações antes de publicar créditos ou mencionar vínculos institucionais e condições académicas.

## Da peça ao clique

| Canal | Revisão antes de publicar |
| --- | --- |
| Web | Liga o contexto ao [catálogo](https://facodi.com/resources), às [sequências](https://facodi.com/sequences), às [sugestões](https://facodi.com/suggest) ou à [comunidade](https://facodi.com/community). Confirma o destino e o percurso de login quando aplicável. |
| Social | Usa o master e o idioma corretos. Testa a zona segura nas capas e o recorte circular no avatar. Stories e Reels v03 têm 1080 × 1920 px. Usa texto alternativo e o sticker de ligação nos Stories. |
| Email | Mantém uma ação clara, ligação absoluta para facodi.com e uma fonte de sistema como alternativa. Para emails operacionais, consulta [os templates versionados](../supabase/email-templates/facodi/). |
| Apresentação e impressão | Parte dos editáveis. Os impressos v03 incluem versões com sangria de 3 mm. Confirma perfil de cor, prova e legibilidade do QR com a gráfica. |

As referências editoriais consultadas no Google Drive foram o **FACODI Media Kit v03**, o `Guia_Instagram_Gustavo_v03.pdf`, as peças sociais, a apresentação PT e o email de boas-vindas PT v03.
