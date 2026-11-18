// Pure page-metadata builders shared by <PageSeo> and the build-time snapshot
// script, so crawlers and the running app describe each page identically.
// Keep this module free of `@/` imports and browser APIs: Bun runs it at build.

import { studyTopics } from '../lib/topicTags';

export const SITE_ORIGIN = 'https://facodi.com';
export const SITE_NAME = 'FACODI';
export const DEFAULT_IMAGE = {
  url: `${SITE_ORIGIN}/social-preview-default.png?v=20261115`, width: 1200, height: 630, alt: 'FACODI — Um campus digital aberto',
};

type JsonLd = Record<string, unknown>;
export type HeadTag =
  | { tag: 'title'; text: string }
  | { tag: 'meta'; name?: string; property?: string; content: string }
  | { tag: 'link'; rel: string; href: string }
  | { tag: 'script'; type: 'application/ld+json'; text: string };

export interface PageMeta {
  title: string;
  description: string;
  /** Site path, e.g. `/courses/lesti`; query and hash are dropped. */
  path: string;
  type?: 'website' | 'article' | 'video.other';
  /** Content language (`pt`, `pt-BR`…); defaults to Portuguese. */
  language?: string | null;
  image?: { url: string; width?: number; height?: number; alt?: string } | null;
  noindex?: boolean;
  jsonLd?: JsonLd[];
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };

/** Collapses possibly-HTML text into one plain line; only used for metadata. */
export function plainLine(value: string | null | undefined) {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, key: string) => ENTITIES[key])
    .replace(/\s+/g, ' ').trim();
}

/** Plain description of at most `max` characters, cut on a word boundary. */
export function metaDescription(value: string | null | undefined, fallback = '', max = 160) {
  const text = plainLine(value) || plainLine(fallback);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).replace(/[\s,;:.–—-]+$/, '')}…`;
}

/**
 * Many catalogue descriptions are editorial boilerplate shared by dozens of pages ("Vídeo externo do canal…").
 * When the stored text never names the page subject, lead with the title so each snippet is unique and says
 * what the page is about. Uses only stored facts; nothing is generated.
 */
export function subjectDescription(title: string, description: string | null | undefined, fallback = '') {
  const text = plainLine(description);
  const subject = plainLine(title);
  if (!text || !subject || text.toLocaleLowerCase().includes(subject.toLocaleLowerCase())) return metaDescription(text, fallback);
  return metaDescription(`${subject}${/[.!?…]$/.test(subject) ? '' : '.'} ${text}`, fallback);
}

export const pageTitle = (title: string) => (title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`);

export function canonicalUrl(path: string) {
  const clean = path.split(/[?#]/)[0] || '/';
  return SITE_ORIGIN + (clean.startsWith('/') ? clean : `/${clean}`);
}

const OG_LOCALES: Record<string, string> = { pt: 'pt_PT', 'pt-br': 'pt_BR', en: 'en_US', es: 'es_ES', fr: 'fr_FR' };

export function ogLocale(language: string | null | undefined) {
  const value = (language ?? 'pt').toLowerCase();
  return OG_LOCALES[value] ?? OG_LOCALES[value.split('-')[0]] ?? 'pt_PT';
}

export function headTags(page: PageMeta): HeadTag[] {
  const url = canonicalUrl(page.path);
  const title = pageTitle(page.title);
  const image = page.image ?? DEFAULT_IMAGE;
  const tags: HeadTag[] = [
    { tag: 'title', text: title },
    { tag: 'meta', name: 'description', content: page.description },
  ];
  if (page.noindex) tags.push({ tag: 'meta', name: 'robots', content: 'noindex, follow' });
  else tags.push({ tag: 'link', rel: 'canonical', href: url });
  tags.push(
    { tag: 'meta', property: 'og:type', content: page.type ?? 'website' },
    { tag: 'meta', property: 'og:site_name', content: SITE_NAME },
    { tag: 'meta', property: 'og:title', content: title },
    { tag: 'meta', property: 'og:description', content: page.description },
    { tag: 'meta', property: 'og:url', content: url },
    { tag: 'meta', property: 'og:locale', content: ogLocale(page.language) },
    { tag: 'meta', property: 'og:image', content: image.url },
  );
  if (image.width && image.height) tags.push(
    { tag: 'meta', property: 'og:image:width', content: String(image.width) },
    { tag: 'meta', property: 'og:image:height', content: String(image.height) },
  );
  tags.push(
    { tag: 'meta', property: 'og:image:alt', content: image.alt ?? title },
    { tag: 'meta', name: 'twitter:card', content: 'summary_large_image' },
    { tag: 'meta', name: 'twitter:title', content: title },
    { tag: 'meta', name: 'twitter:description', content: page.description },
    { tag: 'meta', name: 'twitter:image', content: image.url },
  );
  for (const data of page.jsonLd ?? []) {
    // `<` is escaped so catalogue text can never close the script element.
    tags.push({ tag: 'script', type: 'application/ld+json', text: JSON.stringify(data).replace(/</g, '\\u003c') });
  }
  return tags;
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Marks static head tags so the app can drop them once React renders its own (see `removeStaticHeadTags`). */
export const STATIC_HEAD_ATTRIBUTE = 'data-seo-shell';

/** Serialises head tags for static HTML read by crawlers that do not run JavaScript. */
export function renderHeadTags(tags: HeadTag[]) {
  const mark = STATIC_HEAD_ATTRIBUTE;
  return tags.map(tag => {
    if (tag.tag === 'title') return `<title ${mark}>${escapeHtml(tag.text)}</title>`;
    if (tag.tag === 'link') return `<link ${mark} rel="${tag.rel}" href="${escapeHtml(tag.href)}" />`;
    if (tag.tag === 'script') return `<script ${mark} type="${tag.type}">${tag.text}</script>`;
    const key = tag.name ? `name="${tag.name}"` : `property="${tag.property}"`;
    return `<meta ${mark} ${key} content="${escapeHtml(tag.content)}" />`;
  }).join('\n    ');
}

// ---- Schema.org builders: only facts the catalogue actually stores. ----

const compact = (value: JsonLd): JsonLd =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== ''));

/** Official FACODI profiles; `sameAs` lets search and answer engines tie them to the site. */
export const SOCIAL_PROFILES = ['https://www.instagram.com/somosfacodi/'] as const;

export const organizationJsonLd = (description?: string): JsonLd => compact({
  '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization`,
  name: SITE_NAME, url: `${SITE_ORIGIN}/`, logo: `${SITE_ORIGIN}/pwa-512x512.png`,
  description, sameAs: [...SOCIAL_PROFILES],
});

/** Question/answer pairs taken verbatim from visible page copy, for answer engines. */
export function faqJsonLd(items: { question: string; answer: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question', name: plainLine(item.question),
      acceptedAnswer: { '@type': 'Answer', text: plainLine(item.answer) },
    })),
  };
}

export const websiteJsonLd = (description: string, language = 'pt'): JsonLd => ({
  '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_ORIGIN}/#website`,
  name: SITE_NAME, url: `${SITE_ORIGIN}/`, description, inLanguage: language,
  publisher: { '@id': `${SITE_ORIGIN}/#organization` },
  // Tells assistants and agents how to search the public library directly.
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_ORIGIN}/resources?search={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
});

export function breadcrumbJsonLd(items: { name: string; path?: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => compact({
      '@type': 'ListItem', position: index + 1, name: item.name, item: item.path ? canonicalUrl(item.path) : undefined,
    })),
  };
}

export function courseJsonLd(course: {
  path: string; title: string; description: string; code?: string | null; language?: string | null;
  institution?: string | null; ects?: number | null; partOf?: { title: string; path: string } | null;
}): JsonLd {
  return compact({
    '@context': 'https://schema.org', '@type': 'Course', '@id': canonicalUrl(course.path), url: canonicalUrl(course.path),
    name: course.title, description: course.description, courseCode: course.code, inLanguage: course.language,
    provider: course.institution ? { '@type': 'EducationalOrganization', name: course.institution } : undefined,
    numberOfCredits: course.ects ? { '@type': 'StructuredValue', value: course.ects, unitText: 'ECTS' } : undefined,
    isPartOf: course.partOf ? { '@type': 'Course', name: course.partOf.title, url: canonicalUrl(course.partOf.path) } : undefined,
  });
}

export function learningResourceJsonLd(resource: {
  path: string; title: string; description: string; type: string; language?: string | null; keywords?: string[];
}): JsonLd {
  return compact({
    '@context': 'https://schema.org', '@type': 'LearningResource', '@id': canonicalUrl(resource.path), url: canonicalUrl(resource.path),
    name: resource.title, description: resource.description, learningResourceType: resource.type,
    inLanguage: resource.language, keywords: resource.keywords?.length ? resource.keywords.join(', ') : undefined,
  });
}

export function videoJsonLd(video: {
  path: string; title: string; description: string; youtubeId: string; language?: string | null; durationSeconds?: number | null;
}): JsonLd {
  return compact({
    '@context': 'https://schema.org', '@type': 'VideoObject', '@id': canonicalUrl(video.path), url: canonicalUrl(video.path),
    name: video.title, description: video.description, inLanguage: video.language,
    thumbnailUrl: youtubeThumbnail(video.youtubeId),
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
    duration: video.durationSeconds ? `PT${Math.round(video.durationSeconds)}S` : undefined,
  });
}

export function itemListJsonLd(list: { path: string; title: string; description: string; items: { name: string; path?: string | null }[]; itemCount?: number }): JsonLd {
  return compact({
    '@context': 'https://schema.org', '@type': 'ItemList', '@id': canonicalUrl(list.path), url: canonicalUrl(list.path),
    name: list.title, description: list.description, numberOfItems: list.itemCount ?? list.items.length,
    itemListElement: list.items.length ? list.items.map((item, index) => compact({
      '@type': 'ListItem', position: index + 1, name: item.name, url: item.path ? canonicalUrl(item.path) : undefined,
    })) : undefined,
  });
}

/** YouTube's 480x360 still: the largest size guaranteed for every public video. */
export const youtubeThumbnail = (youtubeId: string) => `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
export const youtubeImage = (youtubeId: string, alt: string) => ({ url: youtubeThumbnail(youtubeId), width: 480, height: 360, alt });

// ---- Page descriptors per public entity: one definition for the app and the snapshots. ----

const enc = encodeURIComponent;
export const coursePath = (slug: string) => `/courses/${enc(slug)}`;
export const unitPagePath = (courseSlug: string, unitSlug: string) => `/courses/${enc(courseSlug)}/units/${enc(unitSlug)}`;
export const resourcePath = (slug: string) => `/resources/${enc(slug)}`;
/** Modules keep their own page; every other public object lives under /resources. */
export const publicResourcePath = (type: string, slug: string) => (type === 'module' ? `/modules/${enc(slug)}` : resourcePath(slug));
export const sequencePath = (slug: string) => `/sequences/${enc(slug)}`;

export interface CourseSeoInput {
  slug: string; title: string; summary?: string | null; description_html?: string | null; code?: string | null;
  language?: string | null; institution?: string | null; ects_total?: number | null;
}

export function courseMeta(course: CourseSeoInput, labels: { courses: string }): PageMeta {
  const path = coursePath(course.slug);
  const description = metaDescription(course.summary || course.description_html, [course.title, course.institution].filter(Boolean).join(' — '));
  return {
    title: course.title, description, path, language: course.language,
    jsonLd: [
      courseJsonLd({ path, title: course.title, description, code: course.code, language: course.language, institution: course.institution, ects: course.ects_total }),
      breadcrumbJsonLd([{ name: labels.courses, path: '/courses' }, { name: course.title, path }]),
    ],
  };
}

export function unitMeta(
  unit: { slug: string; title: string; summary?: string | null; description_html?: string | null; code?: string | null; language?: string | null; ects?: number | null },
  course: { slug: string; title: string; institution?: string | null },
  labels: { courses: string },
): PageMeta {
  const path = unitPagePath(course.slug, unit.slug);
  const description = metaDescription(unit.summary || unit.description_html, `${unit.title} — ${course.title}`);
  return {
    title: `${unit.title} · ${course.title}`, description, path, language: unit.language,
    jsonLd: [
      courseJsonLd({
        path, title: unit.title, description, code: unit.code, language: unit.language, institution: course.institution, ects: unit.ects,
        partOf: { title: course.title, path: coursePath(course.slug) },
      }),
      breadcrumbJsonLd([{ name: labels.courses, path: '/courses' }, { name: course.title, path: coursePath(course.slug) }, { name: unit.title, path }]),
    ],
  };
}

export function resourceMeta(
  resource: { slug: string; title: string; description?: string | null; object_type: string; language?: string | null; tags?: string[] | null },
  video: { youtubeId: string | null; durationSeconds: number | null } | null,
  labels: { resources: string; type: string },
): PageMeta {
  const path = publicResourcePath(resource.object_type, resource.slug);
  const description = subjectDescription(resource.title, resource.description, `${labels.type}: ${resource.title}`);
  const youtubeId = resource.object_type === 'video' ? video?.youtubeId ?? null : null;
  const typePath = `/resources?type=${enc(resource.object_type)}`;
  return {
    title: resource.title, description, path, language: resource.language,
    type: youtubeId ? 'video.other' : 'article',
    image: youtubeId ? youtubeImage(youtubeId, resource.title) : null,
    jsonLd: [
      youtubeId
        ? videoJsonLd({ path, title: resource.title, description, youtubeId, language: resource.language, durationSeconds: video?.durationSeconds })
        : learningResourceJsonLd({ path, title: resource.title, description, type: labels.type, language: resource.language, keywords: studyTopics(resource.tags) }),
      breadcrumbJsonLd([{ name: labels.resources, path: '/resources' }, { name: labels.type, path: typePath }, { name: resource.title, path }]),
    ],
  };
}

export function sequenceMeta(
  sequence: {
    slug: string; title: string; description?: string | null; language?: string | null;
    items: { title: string; slug: string | null; youtubeId: string | null }[];
    itemCount?: number; coverYoutubeId?: string | null;
  },
  labels: { sequences: string },
): PageMeta {
  const path = sequencePath(sequence.slug);
  const description = subjectDescription(sequence.title, sequence.description, sequence.title);
  const cover = sequence.coverYoutubeId ?? sequence.items.find(item => item.youtubeId)?.youtubeId;
  return {
    title: sequence.title, description, path, language: sequence.language,
    image: cover ? youtubeImage(cover, sequence.title) : null,
    jsonLd: [
      itemListJsonLd({
        path, title: sequence.title, description, itemCount: sequence.itemCount,
        items: sequence.items.map(item => ({ name: item.title, path: item.slug ? resourcePath(item.slug) : null })),
      }),
      breadcrumbJsonLd([{ name: labels.sequences, path: '/sequences' }, { name: sequence.title, path }]),
    ],
  };
}

/** Catalogue and project pages that exist regardless of data. */
export function homeMeta(labels: { title: string; description: string }): PageMeta {
  return { title: labels.title, description: labels.description, path: '/', jsonLd: [organizationJsonLd(labels.description), websiteJsonLd(labels.description)] };
}

/** i18n keys of the About FAQ: each answer is copy that is already visible on the page. */
export const ABOUT_FAQ = [
  { question: 'about.faq.free', answer: 'about.principles.open.text' },
  { question: 'about.faq.curated', answer: 'about.principles.curated.text' },
  { question: 'about.faq.origin', answer: 'about.seaeuText' },
  { question: 'about.faq.contribute', answer: 'about.contributeText' },
] as const;

/** The project page also answers the questions people ask about FACODI, using its own visible copy. */
export function aboutMeta(labels: { title: string; description: string }, faq: { question: string; answer: string }[]): PageMeta {
  const page = staticPageMeta('/about', labels);
  return faq.length ? { ...page, jsonLd: [...(page.jsonLd ?? []), faqJsonLd(faq)] } : page;
}

export function staticPageMeta(path: string, labels: { title: string; description: string }): PageMeta {
  return {
    title: labels.title, description: labels.description, path,
    jsonLd: [breadcrumbJsonLd([{ name: SITE_NAME, path: '/' }, { name: labels.title, path }])],
  };
}
