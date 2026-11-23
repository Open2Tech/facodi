import type { Json } from '@/integrations/supabase/types';
import { matchesStudyArea } from '@/shared/catalog/studyAreas';
import { plainText } from '@/shared/lib/text';

/** A FACODI-owned editorial sequence: an ordered, reviewed list of external YouTube lessons. */
export interface SequenceSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  language: string | null;
  itemCount: number;
  unitCodes: string[];
  /** Thumbnail of the first lesson, used as the sequence cover. */
  cover: string | null;
}

export interface SequenceItem {
  position: number;
  videoId: string;
  /** Catalogue slug of the video resource, when the learner can open its page. */
  slug: string | null;
  youtubeId: string | null;
  title: string;
  channel: string | null;
  language: string | null;
  youtubeUrl: string | null;
  thumbnail: string | null;
  metadataVerified: boolean;
  /** Optional FACODI editorial exercise associated with this lesson. */
  activity?: string | null;
}

export interface SequenceUnit {
  unitCode: string;
  unitSlug: string;
  unitTitle: string;
  courseCode: string;
  courseSlug: string;
}

export interface Sequence {
  id: string;
  slug: string;
  title: string;
  description: string;
  language: string | null;
  verifiedCount: number;
  items: SequenceItem[];
  units: SequenceUnit[];
}

export interface VideoProgress {
  videoId: string;
  completedAt: string | null;
  lastPosition: number;
  updatedAt: string;
}

export interface SequenceProgressSummary {
  slug: string;
  title: string;
  total: number;
  started: number;
  completed: number;
  updatedAt: string;
}

const record = (value: Json | undefined): Record<string, Json | undefined> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = (value: Json | undefined) => (typeof value === 'string' && value.trim() ? value.trim() : null);

/** Same size the rest of the catalogue uses; the stored maxres URL is heavy and missing for some videos. */
export function youtubeThumbnail(youtubeId: string | null) {
  return youtubeId && /^[\w-]{11}$/.test(youtubeId) ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null;
}

function foldText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Search visible sequence content and unit codes; base-language filters include regional variants. */
export function filterSequences(sequences: SequenceSummary[], search: string, language: string, area = '') {
  const term = foldText(search.trim());
  return sequences.filter(sequence => {
    const baseLanguage = sequence.language?.split('-')[0].toLowerCase();
    if (language && baseLanguage !== language.toLowerCase()) return false;
    if (area && !matchesStudyArea(sequence.title + ' ' + plainText(sequence.description), area)) return false;
    if (!term) return true;
    return [sequence.title, plainText(sequence.description), ...sequence.unitCodes]
      .some(value => foldText(value).includes(term));
  });
}

export function parseSequenceItems(value: Json): Omit<SequenceItem, 'slug' | 'activity'>[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(entry => {
    const item = record(entry);
    const videoId = text(item.video_id);
    const title = text(item.title);
    if (!videoId || !title) return [];
    const youtubeId = text(item.youtube_id);
    return [{
      position: typeof item.position === 'number' ? item.position : 0,
      videoId,
      youtubeId,
      title,
      channel: text(item.channel),
      language: text(item.language),
      youtubeUrl: text(item.youtube_url),
      thumbnail: youtubeThumbnail(youtubeId) ?? text(item.thumbnail_url),
      metadataVerified: item.metadata_verified === true,
    }];
  });
}

export function parseSequenceUnits(value: Json): SequenceUnit[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(entry => {
    const unit = record(entry);
    const unitSlug = text(unit.unit_slug);
    const courseSlug = text(unit.course_slug);
    if (!unitSlug || !courseSlug) return [];
    return [{
      unitCode: text(unit.unit_code) ?? unitSlug,
      unitSlug,
      unitTitle: text(unit.unit_title) ?? unitSlug,
      courseCode: text(unit.course_code) ?? courseSlug,
      courseSlug,
    }];
  });
}

/** Where to pick up: the first lesson not yet completed, or the first lesson once everything is done. */
export function nextItem(items: SequenceItem[], progress: ReadonlyMap<string, VideoProgress>) {
  return items.find(item => !progress.get(item.videoId)?.completedAt) ?? items[0] ?? null;
}

export function completedCount(items: SequenceItem[], progress: ReadonlyMap<string, VideoProgress>) {
  return items.filter(item => progress.get(item.videoId)?.completedAt).length;
}

/** Whole-number percentage that only reads 100 when every lesson is done. */
export function completionPercent(completed: number, total: number) {
  if (total <= 0) return 0;
  return completed >= total ? 100 : Math.min(99, Math.floor((completed / total) * 100));
}

/** A public sequence that contains a given lesson, with that lesson's place in it. */
export interface VideoSequence {
  id: string;
  slug: string;
  title: string;
  position: number;
  total: number;
}
