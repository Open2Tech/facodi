import { unitPath } from '@/entities/course/course.paths';

/** One result per study mode, drawn exclusively from publicly linked content.
 * Existing relation/sequence order is preserved; no AI score or invented prerequisite.
 */
export type UnitHighlightKind = 'path' | 'sequence' | 'video' | 'playlist' | 'module' | 'reading';
export interface UnitHighlight {
  kind: UnitHighlightKind;
  title: string | null;
  href: string;
  count?: number;
}
type NamedAsset = { id?: string; slug: string; title: string };
type PublishedSequence = NamedAsset & { itemCount: number };

export function pickUnitHighlights({
  courseSlug, unitSlug, hasStudyPath, sequences, videos, playlists, modules, readings,
}: {
  courseSlug: string;
  unitSlug: string;
  hasStudyPath: boolean;
  sequences: readonly PublishedSequence[];
  videos: readonly (NamedAsset & { id: string })[];
  playlists: readonly NamedAsset[];
  modules: readonly NamedAsset[];
  readings: readonly NamedAsset[];
}): UnitHighlight[] {
  const highlights: UnitHighlight[] = [];
  // Prefer a genuinely authored path/sequence; an external playlist is not a FACODI sequence.
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
    });
    else if (videos.length) highlights.push({
      kind: 'video', title: videos[0].title,
      href: `${unitPath(courseSlug, unitSlug)}?v=${encodeURIComponent(videos[0].id)}#unit-resources`,
    });
  }
  // Modules are practice/reading guides; never imply an assessment or official course certification.
  if (modules.length) highlights.push({
    kind: 'module', title: modules[0].title,
    href: `/modules/${encodeURIComponent(modules[0].slug)}`,
  });
  // If the first card already leads to a video, leave space for a genuine reference.
  if (readings.length) highlights.push({
    kind: 'reading', title: readings[0].title,
    href: `/resources/${encodeURIComponent(readings[0].slug)}`,
  });
  // When there is a path or playlist, a standalone video is a useful alternative entry point.
  if (highlights.length < 3 && videos.length && !highlights.some(item => item.kind === 'video')) {
    highlights.push({
      kind: 'video', title: videos[0].title,
      href: `${unitPath(courseSlug, unitSlug)}?v=${encodeURIComponent(videos[0].id)}#unit-resources`,
    });
  }
  return highlights.slice(0, 3);
}
