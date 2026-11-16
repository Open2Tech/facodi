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
    || root.sections.length < 2 || root.sections.length > 8
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
