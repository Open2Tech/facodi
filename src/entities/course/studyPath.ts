import type { Json } from '@/integrations/supabase/types';
import type { Sequence, SequenceItem } from '@/entities/sequence/sequence';

export interface StudyPathSection {
  id: string;
  labels: Record<'pt' | 'en' | 'es' | 'fr', string>;
  youtubeIds: string[];
}

export interface StudyPathConfig {
  sequenceSlug: string;
  guideModuleSlug: string;
  sections: StudyPathSection[];
  supplementarySequenceSlugs: string[];
  standaloneResourceSlugs: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const isSlug = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9][a-z0-9-]{2,180}$/.test(value);
const isYoutubeId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value);

/** An optional, editorial presentation config on a curricular unit.
 * This does not create or merge learning objects. The playlist still owns lesson order.
 */
export function parseStudyPath(metadata: Json | null): StudyPathConfig | null {
  if (!isRecord(metadata) || !isRecord(metadata.facodi_study_path_v1)) return null;
  const raw = metadata.facodi_study_path_v1;
  if (raw.version !== 1 || !isSlug(raw.sequence_slug) || !isSlug(raw.guide_module_slug)
    || !Array.isArray(raw.sections) || raw.sections.length === 0 || raw.sections.length > 12
    || !Array.isArray(raw.supplementary_sequence_slugs) || !Array.isArray(raw.standalone_resource_slugs)) return null;

  const sections: StudyPathSection[] = [];
  const seenIds = new Set<string>();
  const seenVideos = new Set<string>();
  for (const entry of raw.sections) {
    if (!isRecord(entry) || !isSlug(entry.id) || seenIds.has(entry.id)
      || !isRecord(entry.labels) || !Array.isArray(entry.youtube_ids) || entry.youtube_ids.length === 0) return null;
    const labels = entry.labels;
    if (!['pt', 'en', 'es', 'fr'].every(locale => typeof labels[locale] === 'string' && (labels[locale] as string).trim())) return null;
    if (!entry.youtube_ids.every(isYoutubeId)) return null;
    const youtubeIds = entry.youtube_ids as string[];
    if (youtubeIds.some(id => seenVideos.has(id))) return null;
    youtubeIds.forEach(id => seenVideos.add(id));
    seenIds.add(entry.id);
    sections.push({
      id: entry.id,
      labels: { pt: labels.pt as string, en: labels.en as string, es: labels.es as string, fr: labels.fr as string },
      youtubeIds,
    });
  }
  const extras = raw.supplementary_sequence_slugs;
  if (!extras.every(isSlug) || new Set(extras).size !== extras.length || extras.includes(raw.sequence_slug)) return null;
  if (!raw.standalone_resource_slugs.every(isSlug) || new Set(raw.standalone_resource_slugs).size !== raw.standalone_resource_slugs.length) return null;
  return {
    sequenceSlug: raw.sequence_slug,
    guideModuleSlug: raw.guide_module_slug,
    sections,
    supplementarySequenceSlugs: extras,
    standaloneResourceSlugs: raw.standalone_resource_slugs,
  };
}

/** Fail closed if the curated configuration and public sequence diverge.
 * Lesson IDs/positions remain owned by the existing editorial playlist and progress system.
 */
export function groupStudyPathLessons(config: StudyPathConfig, sequence: Sequence):
  { id: string; labels: StudyPathSection['labels']; items: SequenceItem[] }[] | null {
  const configured = new Set(config.sections.flatMap(section => section.youtubeIds));
  if (sequence.items.length !== configured.size
    || sequence.items.some(item => !item.youtubeId || !configured.has(item.youtubeId))) return null;
  const byYoutubeId = new Map(sequence.items.map(item => [item.youtubeId, item]));
  return config.sections.map(section => ({
    id: section.id,
    labels: section.labels,
    items: section.youtubeIds.map(id => byYoutubeId.get(id)!).filter(Boolean),
  }));
}
