# Identidade FACODI v03

A v03 é a referência aprovada em 15 de novembro de 2026 para a comunicação da FACODI. A identidade parte do campus digital aberto e da ideia de «caderno marcado» do [sistema de design](../DESIGN.md). Papel quente, tinta azul-escura, um destaque amarelo e formas planas ligam o site, as redes, os emails e os impressos.

## Cor e contraste

| Cor | sRGB | Aplicação |
| --- | --- | --- |
| Paper | `#FDFCF7` | Fundo de leitura. Na web, `bg-background` adapta-se ao tema e `bg-brand-paper` mantém o tom de marca. |
| Ink | `#142846` | Texto em superfícies claras, texto sobre marcadores e fundo de marca. Usa `text-foreground` para texto de leitura e `text-brand-ink` sobre um preenchimento de marca. |
| Sun | `#EFFF00` | Ação principal, seleção e destaque. Na UI, usa `bg-primary text-primary-foreground`. Em divulgação, pode ocupar um bloco de composição. |
| Cyan | `#37BED2` | Acento, referências externas no catálogo e pormenores de marca. Usa texto Ink sobre preenchimento Cyan. |
| Mint | `#A7E8BE` | Acento para módulos e documentos. Usa texto Ink sobre preenchimento Mint. |
| Blue | `#3979C8` | Marcas gráficas e ícones. Usa Ink para os rótulos. |

Paper, Ink e Sun estão especificados no kit aprovado. Cyan está presente no email v03. Mint e Blue complementam a identidade no [sistema web](../DESIGN.md). Os tons laranja, rosa e coral, os estados e as superfícies escuras têm funções de interface.

| Texto / fundo | Contraste sRGB |
| --- | ---: |
| Ink / Paper | 14,38:1 |
| Ink / Sun | 13,35:1 |
| Ink / Cyan | 6,65:1 |
| Ink / Mint | 10,50:1 |
| Blue / Paper | 4,31:1 |
| Branco / Sun | 1,11:1 |

Aplica os limiares de [contraste WCAG 2.2 AA](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) ao par efetivamente renderizado. Usa 4,5:1 para texto normal e 3:1 para texto grande. Elementos visuais necessários para identificar controlos ou estados seguem o [critério de contraste não textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Confirma o contraste de transparências, estados de foco e seleção em ambos os temas. Usa ícone e rótulo para os tipos de conteúdo e texto explícito para os estados.

Os valores executados estão em [`src/index.css`](../src/index.css). O [Tailwind](../tailwind.config.ts) expõe os papéis semânticos da interface. As variantes de marca mantêm o seu valor sRGB nos dois temas.

## Marca, tipo e imagens

- Usa o wordmark FACODI dos masters da v03 em peças institucionais. Reserva o símbolo **F.** para usos compactos, como ícone, avatar e favicon. Mantém as proporções e testa o recorte circular no avatar.
- Usa **Space Grotesk** para títulos e corpo. Na interface, **IBM Plex Mono** acompanha códigos, contagens, durações e etiquetas. Os templates HTML de divulgação usam Arial como alternativa compatível com clientes de email.
- Mantém blocos planos, linhas claras e cantos retos. Para editar, usa o master SVG com texto ou o PowerPoint. Para preservar a aparência da exportação numa máquina sem a fonte, usa a versão SVG em curvas.
- Escolhe thumbnails de recursos reais e credita o autor original. Usa apenas marcas institucionais com autorização de uso. Conserva uma versão editável e uma exportação final por formato e idioma.

## Voz e ligações

Fala com proximidade e curiosidade. Usa «tu» em PT, frases curtas e verbos que indicam o próximo passo. «Aprender muda tudo» é a assinatura de campanha. Em páginas e emails, a ação deve dizer o que se encontra depois do clique.

| Intenção | Ação em PT | Destino |
| --- | --- | --- |
| Conhecer o campus | Conhecer a FACODI | [Página inicial](https://facodi.com/) |
| Encontrar uma aula, leitura ou módulo | Explorar o catálogo | [Recursos](https://facodi.com/resources) |
| Seguir aulas ordenadas | Explorar sequências | [Sequências](https://facodi.com/sequences) |
| Partilhar uma aula ou referência | Sugerir recurso | [Sugestões](https://facodi.com/suggest) |
| Conhecer formas de colaborar | Conhecer a comunidade | [Comunidade](https://facodi.com/community) |

A consulta do catálogo é pública. As submissões pedem conta. A FACODI organiza percursos independentes e liga as pessoas às fontes originais. Em comunicação institucional, confirma nomes, papéis e autorizações antes de publicar. Evita promessas de matrículas, notas, equivalências, ECTS ou certificação.

## Aplicação por canal

| Canal | Especificação |
| --- | --- |
| Site e partilhas | Usa [os ativos em `public/`](../public/) para favicon e PWA. O [preview Open Graph](../public/social-preview-default.png) mede 1200 × 630 px. Se o substituíres, atualiza o metadado, a versão de cache e testa o recorte. |
| Instagram | Feed e carrosséis em PT ou EN, com texto alternativo por peça. Mantém a ordem dos cinco slides de cada carrossel. Stories e Reels medem 1080 × 1920 px. Testa o recorte das capas e usa o sticker nativo de link quando necessário. |
| Apresentação e email | Usa os editáveis v03. Confirma leitura em ecrã pequeno, título e ação inequívocos. Usa ligações completas para `https://facodi.com`. Para emails transacionais, consulta [os templates versionados](../supabase/email-templates/facodi/) e [a documentação de Auth](facodi-auth-email-templates.md). |
| Impressão | Parte do PDF correto para A3, A6, autocolante ou roll-up. O kit tem variantes com sangria de 3 mm. Confirma as especificações, o perfil de cor e a prova com a gráfica. Escaneia o QR no tamanho impresso. |

Antes de publicar, verifica legibilidade em telemóvel, recorte, texto alternativo, autoria, idioma e destino da ação. Na aplicação, testa teclado, foco visível, modo escuro e movimento reduzido. Se uma peça mudar, atualiza o master e a exportação correspondente.

## Referências da v03

O conjunto aprovado está na pasta **08 — FACODI Media Kit v03** do Google Drive. Para produção, consulta `Guia_Instagram_Gustavo_v03.pdf` e `COMECA_AQUI_Gustavo.txt`. Para exemplos por canal, consulta `FACODI_Pecas_Sociais_v03.pdf`, `FACODI_Apresentacao_PT_v03.pdf` e `FACODI_welcome_PT_v03.html`. A nota de aprovação e os três valores base constam da atualização de 15/11/2026 em **02 — FACODI | Criativos e copies PT-EN — Feed e Stories**.
