import { SITE_NAME, SITE_ORIGIN, canonicalUrl, headTags, renderHeadTags, STATIC_HEAD_ATTRIBUTE, type PageMeta } from './seo';

const SEO_BLOCK = /<!-- seo:start[^>]*-->[\s\S]*?<!-- seo:end -->/;
const SNAPSHOT_SEGMENT = /^[A-Za-z0-9._~%-]+$/;

function safeSegments(path: string) {
  const segments = path.split('/').filter(Boolean);
  if (!segments.length || segments.some(segment => {
    if (!SNAPSHOT_SEGMENT.test(segment)) return true;
    try {
      const decoded = decodeURIComponent(segment);
      return decoded === '.' || decoded === '..' || /[/\\\0]/.test(decoded);
    } catch {
      return true;
    }
  })) throw new Error(`Unsafe SEO snapshot path: ${path}`);
  return segments.map(segment => decodeURIComponent(segment));
}

/** Workers maps `/courses/example` to this extensionless HTML asset without redirecting. */
export function snapshotFilePath(outputDirectory: string, route: string) {
  const segments = safeSegments(route);
  const last = segments[segments.length - 1];
  if (!last) throw new Error(`SEO snapshot route must not be root: ${route}`);
  const suffix = [...segments.slice(0, -1), `${last}.html`].join('/');
  return `${outputDirectory.replace(/[\\/]+$/, '')}/${suffix}`;
}

export type SnapshotLink = { name: string; path: string };

const ROOT_ELEMENT = '<div id="root"></div>';
const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function breadcrumbLinks(page: PageMeta): SnapshotLink[] {
  const list = page.jsonLd?.find(item => item['@type'] === 'BreadcrumbList');
  const items = Array.isArray(list?.itemListElement) ? list.itemListElement as { name?: unknown; item?: unknown }[] : [];
  return items.flatMap(item => (typeof item.name === 'string' && typeof item.item === 'string' && item.item.startsWith(SITE_ORIGIN)
    ? [{ name: item.name, path: item.item.slice(SITE_ORIGIN.length) || '/' }]
    : []));
}

const anchor = (link: SnapshotLink) => `<a href="${escapeText(link.path)}">${escapeText(link.name)}</a>`;

/**
 * Plain HTML for crawlers and answer engines that never run JavaScript: the page heading,
 * its description, the breadcrumb and the public pages it links to. React's createRoot
 * replaces it on the first render, so people only see it until the app loads.
 */
export function renderSnapshotBody(page: PageMeta, links: SnapshotLink[] = []) {
  const crumbs = [{ name: SITE_NAME, path: '/' }, ...breadcrumbLinks(page).filter(link => link.path !== '/' && link.path !== page.path)];
  const list = links.length ? `\n      <ul>${links.map(link => `<li>${anchor(link)}</li>`).join('')}</ul>` : '';
  return [
    `<main ${STATIC_HEAD_ATTRIBUTE} style="max-width:72ch;margin:3rem auto;padding:0 1.25rem;font-family:system-ui,sans-serif;line-height:1.5">`,
    `      <nav aria-label="breadcrumb">${crumbs.map(anchor).join(' › ')}</nav>`,
    `      <h1>${escapeText(page.title)}</h1>`,
    `      <p>${escapeText(page.description)}</p>${list}`,
    '    </main>',
  ].join('\n');
}

export function renderSnapshotHtml(shell: string, page: PageMeta, links: SnapshotLink[] = []) {
  if (!SEO_BLOCK.test(shell)) throw new Error('SPA shell is missing its seo:start/end block.');
  const tags = renderHeadTags(headTags(page));
  const html = shell.replace(SEO_BLOCK, () => `<!-- seo:start · generated for ${page.path} -->\n    ${tags}\n    <!-- seo:end -->`);
  return html.includes(ROOT_ELEMENT)
    ? html.replace(ROOT_ELEMENT, () => `<div id="root">\n    ${renderSnapshotBody(page, links)}\n    </div>`)
    : html;
}

export type LlmsSection = { title: string; links: (SnapshotLink & { note?: string })[] };

/** `/llms.txt` (llmstxt.org): a plain map of the public catalogue for language models. */
export function renderLlmsTxt(intro: { summary: string; details: string[] }, sections: LlmsSection[]) {
  const line = (value: string) => value.replace(/\s+/g, ' ').trim();
  const blocks = sections.filter(section => section.links.length).map(section => [
    `## ${line(section.title)}`,
    '',
    ...section.links.map(link => `- [${line(link.name).replace(/[[\]]/g, '')}](${canonicalUrl(link.path)})${link.note ? `: ${line(link.note)}` : ''}`),
  ].join('\n'));
  return [`# ${SITE_NAME}`, '', `> ${line(intro.summary)}`, '', intro.details.map(line).join('\n\n'), '', blocks.join('\n\n'), ''].join('\n');
}

export function exactSnapshotCount(contentRange: string | null, label: string) {
  const count = contentRange?.match(/^(?:\d+-\d+|\*)\/(\d+)$/);
  const total = count ? Number(count[1]) : NaN;
  if (!Number.isSafeInteger(total)) throw new Error(`Cannot verify the exact count of ${label}.`);
  return total;
}

export function assertCompleteSequenceSnapshot(sequences: unknown, contentRange: string | null) {
  if (!Array.isArray(sequences)) throw new Error('Unexpected response while reading public editorial sequences.');
  const total = exactSnapshotCount(contentRange, 'public editorial sequences');
  if (total >= 500) {
    throw new Error('Public editorial sequence RPC reached its 500-row limit; sitemap completeness cannot be guaranteed.');
  }
  if (sequences.length !== total) {
    throw new Error(`Public editorial sequence response is incomplete (${sequences.length}/${total}).`);
  }
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Produces a deterministic sitemap from canonical public paths only. */
export function renderSitemap(paths: string[]) {
  const canonicalPaths = [...new Set(paths.map(canonicalUrl))];
  const locations = canonicalPaths.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locations,
    '</urlset>',
    '',
  ].join('\n');
}
