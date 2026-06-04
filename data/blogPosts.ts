/**
 * Blog posts data and functions for FACODI
 *
 * Source of truth for blog post metadata. Content mirrors content/blog/*.md frontmatter.
 */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  content?: string;
  published?: boolean;
}

const blogPosts: Record<string, BlogPost> = {
  'design-tecnologia-inclusiva': {
    slug: 'design-tecnologia-inclusiva',
    title: 'Design e Tecnologia Inclusiva',
    excerpt: 'A tecnologia é mais humana quando é feita para todas as pessoas, não apenas para quem tem acesso fácil a ela.',
    date: '2025-01-17',
    author: 'Monynha Softwares',
    category: 'Design e Tecnologia',
    tags: ['acessibilidade', 'design', 'inclusao', 'tecnologia'],
    published: true,
    content: `Sempre acreditei que design e acessibilidade não são pontos opostos num espectro, mas duas linguagens que, quando dialogam, traduzem o verdadeiro sentido da inovação. A estética só é completa quando é compreensível. O belo só é belo quando é acessível.

Na Monynha Softwares, cada interface nasce de um princípio simples: **empatia como arquitetura**. Criar não é só desenhar pixels; é entender contextos, reconhecer diferenças e garantir que ninguém fique de fora da experiência digital.

Implementamos contrastes adequados, hierarquias visuais claras e navegação por teclado desde o primeiro protótipo. Evitamos animações que possam causar desconforto a pessoas sensíveis ao movimento, respeitando o \`prefers-reduced-motion\`. Cada componente é pensado para ser útil, não apenas bonito.

Mais do que cumprir normas da WCAG, tratamos acessibilidade como expressão de respeito. Cada *alt-text* é um convite à inclusão; cada *aria-label* é um gesto de empatia codificado.

## Acessibilidade como postura, não como checklist

A maioria das equipes trata acessibilidade como uma etapa final, algo que se "adiciona" ao produto pronto. Nós pensamos diferente. Quando acessibilidade é arquitetura, ela aparece nas primeiras decisões: contraste de cores, hierarquia de cabeçalhos, semântica HTML e textos alternativos.

Isso significa:

- Escolher paletas que respeitem utilizadoras e utilizadores com baixa visão cromática.
- Garantir que todos os fluxos críticos funcionem apenas com teclado.
- Escrever textos alternativos descritivos e significativos, não genéricos.
- Usar roles ARIA apenas quando necessário, e de forma correta.

## O design inclusivo é político

O design inclusivo não é um diferencial competitivo, é um ato político e ético. Porque se a tecnologia é feita por pessoas, para pessoas, então ela deve abraçar todas as formas de existir.

Quando uma interface exclui, ela faz uma escolha. Quando inclui, também. Cada decisão de produto é, no fundo, uma declaração sobre quem você acredita que merece participar da vida digital.

Na FACODI, esse compromisso se traduz em educação aberta e acessível: currículos organizados, playlists sem barreiras, comunidade que cuida de quem aprende. Tecnologia a serviço de quem precisa, não de quem já tem tudo.`,
  },
  'por-tras-da-monynha': {
    slug: 'por-tras-da-monynha',
    title: 'Por trás da Monynha',
    excerpt: 'Mais do que software: um movimento de orgulho, diversidade e resistência digital.',
    date: '2025-02-02',
    author: 'Monynha Softwares',
    category: 'Comunidade',
    tags: ['monynha', 'diversidade', 'open-source', 'comunidade'],
    published: true,
    content: `A **Monynha Softwares** nasceu de um sonho coletivo: provar que tecnologia e afeto podem coexistir. Que inovação também vem da margem. Que a web pode ser um espaço de acolhimento, criação e resistência.

O nome carrega essa essência. *"Mona"*, palavra de resistência do Pajuba, e o sufixo *"-nynha"*, expressão carinhosa e periférica, simbolizam a mistura de ternura, humor e coragem que definem quem somos. Criamos com amor, mas também com propósito: cada projeto é uma forma de dizer que estamos aqui e não vamos voltar pro armário da tecnologia.

## Nosso manifesto

Nosso manifesto é simples: **democratizar o digital, celebrar a diferença e hackear o sistema com orgulho.** Através de software livre, design acessível e comunidades diversas, buscamos transformar o que antes era privilégio em possibilidade.

De apps e plataformas open source a iniciativas culturais e educacionais, cada linha de código escrita pela Monynha é um gesto de resistência criativa.

## Os projetos que nos movem

Nossos produtos, como o **BotecoPro**, o **FACODI** e a **AssisTina**, não são apenas soluções tecnológicas; são manifestações vivas de empatia, inclusão e representatividade.

Cada projeto parte de uma pergunta: *quem está sendo deixado de fora?* E então trabalhamos para abrir a porta.

- **FACODI**: Faculdade Comunitária Digital, com currículos universitários abertos, playlists e materiais livres para quem quer aprender sem barreiras financeiras.
- **BotecoPro**: Gestão descomplicada para botecos, bares e pequenos negócios da periferia.
- **AssisTina**: Assistente de IA acolhedora, pensada para comunidades que precisam de tecnologia com afeto.

## Por que diversidade é performance

Ser Monynha é entender que tecnologia é linguagem, e linguagem é poder. Que cada pessoa que se vê num produto é mais do que usuária: é protagonista. E por isso seguimos criando, dia após dia, com a certeza de que **diversidade também é performance.**

Acreditamos que o que une tecnologia e comunidade não é o código, é o cuidado. E cuidado, a Monynha tem de sobra.`,
  },
};

/**
 * Get a blog post by its slug
 * @param slug The blog post slug
 * @returns The blog post or undefined if not found
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts[slug];
}

/**
 * Get all published blog posts
 * @returns Array of all published blog posts
 */
export function getPublishedPosts(): BlogPost[] {
  return Object.values(blogPosts).filter(post => post.published !== false);
}

/**
 * Get all blog posts
 * @returns Array of all blog posts
 */
export function getAllPosts(): BlogPost[] {
  return Object.values(blogPosts);
}

/**
 * Add a blog post (used for runtime additions)
 * @param post The blog post to add
 */
export function addPost(post: BlogPost): void {
  blogPosts[post.slug] = post;
}
