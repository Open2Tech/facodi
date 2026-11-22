import { normalizeCourseMaterialTerm } from '@/entities/course/courseLearningAssets';
import { unitPath } from '@/entities/course/course.paths';

/** Highlights link to public items only; they never imply independent review or certification. */
export type UnitHighlightKind = 'path' | 'sequence' | 'video' | 'playlist' | 'module' | 'reading';
export interface UnitHighlight {
  kind: UnitHighlightKind;
  title: string | null;
  href: string;
  count?: number;
  /** Neutral provenance, not a verification/quality badge. */
  sourceHost?: string;
}
type NamedAsset = {
  id?: string; slug: string; title: string;
  sourceUrl?: string | null;
  source_url?: string | null;
};
type PublishedSequence = NamedAsset & { itemCount: number };

const STOP_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'um', 'uma', 'para', 'com',
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'a', 'o', 'as', 'os', 'the', 'and', 'of', 'to', 'for']);
const GATEWAY_TITLE = /\b(portal|catalogo|biblioteca|diretorio|indice|homepage)\b|referencia da rede|lista de formacao/i;
const SPECIFIC_DOCUMENT = /\b(codigo|fuc|ficha|manual|livro|curso|capitulo|aula|volume|normas)\b/i;
const STRUCTURED_MATERIAL = /\b(curso|course|livro|book|textbook|volume|capitulo|chapter|fuc|ficha da unidade curricular)\b/i;

function urlOf(asset: NamedAsset): string | null {
  const value = asset.sourceUrl ?? asset.source_url;
  return typeof value === 'string' && value.startsWith('https://') ? value : null;
}

/** Domain is an objective source cue; we do not claim the host reviewed the UC. */
export function highlightSourceHost(asset: NamedAsset): string | undefined {
  const value = urlOf(asset);
  if (!value) return undefined;
  try {
    const host = new URL(value).hostname.replace(/^www\./i, '');
    return host || undefined;
  } catch {
    return undefined;
  }
}
function provenance(asset: NamedAsset): Pick<UnitHighlight, 'sourceHost'> {
  const host = highlightSourceHost(asset);
  return host ? { sourceHost: host } : {};
}
function isGeneralGateway(asset: NamedAsset): boolean {
  const title = normalizeCourseMaterialTerm(asset.title);
  const url = urlOf(asset);
  return (GATEWAY_TITLE.test(title) && !SPECIFIC_DOCUMENT.test(title)) ||
    (url != null && /\/(?:dr\/home|home|homepage|index)(?:\/?$|[?#])/i.test(url));
}
function hasMatchingTopic(title: string, unitTitle: string): boolean {
  const source = normalizeCourseMaterialTerm(title);
  const words = normalizeCourseMaterialTerm(unitTitle).split(/[^a-z0-9]+/).filter(word => word.length > 4 && !STOP_WORDS.has(word));
  return words.some(word => source.includes(word) || (word.startsWith('bio') && word.length > 7 && source.includes(word.slice(3))));
}
function isStructuredMaterial(asset: NamedAsset): boolean {
  const title = normalizeCourseMaterialTerm(asset.title);
  if (STRUCTURED_MATERIAL.test(title)) return true;
  const url = urlOf(asset);
  if (!url) return false;
  try {
    return /\/(books|courses|course|chapters|chapter)\//.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/** Prefer a focused course/chapter/ficha over a broad index when both are linked to a UC.
 * The complete reading list keeps its original editorial order and every source.
 * If evidence is insufficient, retain the first existing reading, not a guessed "best" source.
 */
export function chooseUnitHighlightReading<T extends NamedAsset>(
  readings: readonly T[],
  unitTitle: string,
): T | undefined {
  if (!readings.length) return undefined;
  const specific = readings.filter(item => !isGeneralGateway(item));
  return specific.find(item => hasMatchingTopic(item.title, unitTitle) && isStructuredMaterial(item))
    ?? specific.find(item => hasMatchingTopic(item.title, unitTitle))
    ?? specific.find(item => isStructuredMaterial(item))
    ?? specific[0]
    ?? readings[0];
}

export function pickUnitHighlights({
  courseSlug, unitSlug, unitTitle = '', hasStudyPath, sequences, videos, playlists, modules, readings,
}: {
  courseSlug: string;
  unitSlug: string;
  unitTitle?: string;
  hasStudyPath: boolean;
  sequences: readonly PublishedSequence[];
  videos: readonly (NamedAsset & { id: string })[];
  playlists: readonly NamedAsset[];
  modules: readonly NamedAsset[];
  readings: readonly NamedAsset[];
}): UnitHighlight[] {
  const highlights: UnitHighlight[] = [];
  // A FACODI editorial sequence is distinct from a third-party YouTube playlist.
  if (hasStudyPath) highlights.push({ kind: 'path', title: null, href: '#unit-study-path' });
  else {
    const sequence = sequences.find(item => item.itemCount > 0);
    if (sequence) highlights.push({
      kind: 'sequence', title: sequence.title,
      href: `/sequences/${encodeURIComponent(sequence.slug)}`, count: sequence.itemCount,
    });
    else if (playlists.length) highlights.push({
      kind: 'playlist', title: playlists[0].title,
      href: `/resources/${encodeURIComponent(playlists[0].slug)}`,
      ...provenance(playlists[0]),
    });
    else if (videos.length) highlights.push({
      kind: 'video', title: videos[0].title,
      href: `${unitPath(courseSlug, unitSlug)}?v=${encodeURIComponent(videos[0].id)}#unit-resources`,
      ...provenance(videos[0]),
    });
  }
  if (modules.length) highlights.push({
    kind: 'module', title: modules[0].title,
    href: `/modules/${encodeURIComponent(modules[0].slug)}`,
  });
  const reading = chooseUnitHighlightReading(readings, unitTitle);
  if (reading) highlights.push({
    kind: 'reading', title: reading.title,
    href: `/resources/${encodeURIComponent(reading.slug)}`,
    ...provenance(reading),
  });
  if (!hasStudyPath && highlights.length < 3 && videos.length && !highlights.some(item => item.kind === 'video')) {
    highlights.push({
      kind: 'video', title: videos[0].title,
      href: `${unitPath(courseSlug, unitSlug)}?v=${encodeURIComponent(videos[0].id)}#unit-resources`,
      ...provenance(videos[0]),
    });
  }
  return highlights.slice(0, 3);
}
