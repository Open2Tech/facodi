import type { Json } from '@/integrations/supabase/types';

export interface ComposedStudySection {
  id: string;
  labels: Record<'pt' | 'en' | 'es' | 'fr', string>;
  sequenceSlugs: string[];
}

export interface ComposedStudyPath {
  sections: ComposedStudySection[];
  supplementarySequenceSlugs: string[];
  guideModuleSlugs: string[];
}

type PublicAsset = { slug: string };
type PublicSequence = PublicAsset & { itemCount: number };
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const isSlug = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9][a-z0-9-]{2,180}$/.test(value);
const validSlugs = (value: unknown, max: number): value is string[] =>
  Array.isArray(value) && value.length <= max && value.every(isSlug)
    && new Set(value).size === value.length;

/** Pure, optional presentation metadata. It does not constitute a new learning object. */
export function parseComposedStudyPath(metadata: Json | null): ComposedStudyPath | null {
  if (!isRecord(metadata) || !isRecord(metadata.facodi_study_path_v2)) return null;
  const root = metadata.facodi_study_path_v2;
  if (root.version !== 2 || !Array.isArray(root.sections)
    || root.sections.length < 2 || root.sections.length > 20
    || !validSlugs(root.supplementary_sequence_slugs, 20)
    || !validSlugs(root.guide_module_slugs, 15)) return null;

  const sections: ComposedStudySection[] = [];
  const sectionIds = new Set<string>();
  const assigned = new Set<string>();
  for (const value of root.sections) {
    if (!isRecord(value) || !isSlug(value.id) || sectionIds.has(value.id)
      || !isRecord(value.labels) || !validSlugs(value.sequence_slugs, 10)
      || value.sequence_slugs.length === 0) return null;
    const labels = value.labels;
    if (!['pt', 'en', 'es', 'fr'].every(key =>
      typeof labels[key] === 'string' && (labels[key] as string).trim())) return null;
    const slugs = value.sequence_slugs;
    if (slugs.some(slug => assigned.has(slug))) return null;
    slugs.forEach(slug => assigned.add(slug));
    sectionIds.add(value.id);
    sections.push({
      id: value.id,
      labels: { pt: labels.pt as string, en: labels.en as string, es: labels.es as string, fr: labels.fr as string },
      sequenceSlugs: slugs,
    });
  }
  if (root.supplementary_sequence_slugs.some(slug => assigned.has(slug))) return null;
  return {
    sections,
    supplementarySequenceSlugs: root.supplementary_sequence_slugs,
    guideModuleSlugs: root.guide_module_slugs,
  };
}

/** Require a full 1:1 match with publicly linked playlists and modules.
 * Otherwise retain the legacy layout, preventing content from disappearing.
 */
export function canPresentComposedStudyPath(config: ComposedStudyPath,
  sequences: PublicSequence[], playlists: PublicAsset[], modules: PublicAsset[]): boolean {
  const configured = [
    ...config.sections.flatMap(section => section.sequenceSlugs),
    ...config.supplementarySequenceSlugs,
  ];
  const visible = sequences.filter(item => item.itemCount > 0).map(item => item.slug);
  if (configured.length !== visible.length || configured.length !== playlists.length) return false;
  const seen = new Set(configured);
  if (seen.size !== configured.length || visible.some(slug => !seen.has(slug))
    || playlists.some(item => !seen.has(item.slug))) return false;
  const guides = new Set(config.guideModuleSlugs);
  return guides.size === modules.length && modules.every(module => guides.has(module.slug));
}

/** Keep a configured path's legacy catalog hidden until its dependent queries settle. */
export function isComposedPathPending(
  config: ComposedStudyPath | null,
  status: readonly ('pending' | 'error' | 'success')[],
): boolean {
  return !!config && status.includes('pending');
}


/** Build the classroom from the public sequence list; preserve configured chapters
 * even when a new sequence is linked or an old one is unpublished. Unassigned
 * sequences remain discoverable, without claiming a new official syllabus. */
export function resolveClassroomPath<T extends PublicSequence & { title: string }>(
  config: ComposedStudyPath | null, sequences: readonly T[],
  playlists: readonly PublicAsset[], modules: readonly PublicAsset[],
): ComposedStudyPath | null {
  const visible = new Map(sequences.filter(item => item.itemCount > 0).map(item => [item.slug, item]));
  if (!visible.size) return null;
  const ordered = [...new Set([...playlists.map(item => item.slug), ...visible.keys()])].filter(slug => visible.has(slug));
  const used = new Set<string>();
  const take = (slugs: readonly string[]) => slugs.filter(slug => {
    if (!visible.has(slug) || used.has(slug)) return false;
    used.add(slug);
    return true;
  });
  const sections = (config?.sections ?? []).flatMap(section => {
    const sequenceSlugs = take(section.sequenceSlugs);
    return sequenceSlugs.length ? [{ ...section, sequenceSlugs }] : [];
  });
  const supplementarySequenceSlugs = take(config?.supplementarySequenceSlugs ?? []);
  if (sections.length) supplementarySequenceSlugs.push(...take(ordered));
  else {
    for (const slug of take(ordered)) {
      const title = visible.get(slug)!.title;
      sections.push({ id: slug, labels: { pt: title, en: title, es: title, fr: title }, sequenceSlugs: [slug] });
    }
    // If an old configuration only references supplemental sequences, keep
    // those visible as primary choices rather than leaving an empty classroom.
    if (!sections.length) {
      for (const slug of supplementarySequenceSlugs.splice(0)) {
        const title = visible.get(slug)!.title;
        sections.push({ id: slug, labels: { pt: title, en: title, es: title, fr: title }, sequenceSlugs: [slug] });
      }
    }
  }
  const guideModuleSlugs = [...new Set([...(config?.guideModuleSlugs ?? []), ...modules.map(item => item.slug)])]
    .filter(slug => modules.some(item => item.slug === slug));
  return { sections, supplementarySequenceSlugs, guideModuleSlugs };
}
