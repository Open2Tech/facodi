import { canonicalUrl, headTags, renderHeadTags, type PageMeta } from './seo';

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

export function renderSnapshotHtml(shell: string, page: PageMeta) {
  if (!SEO_BLOCK.test(shell)) throw new Error('SPA shell is missing its seo:start/end block.');
  const tags = renderHeadTags(headTags(page));
  return shell.replace(SEO_BLOCK, () => `<!-- seo:start · generated for ${page.path} -->\n    ${tags}\n    <!-- seo:end -->`);
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
