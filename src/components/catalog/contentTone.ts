import { BookOpen, BookOpenCheck, ExternalLink, FileText, Layers, ListVideo, PlayCircle, Shapes, type LucideIcon } from 'lucide-react';
import type { ContentKind } from '@/entities/course/course.types';

export interface ContentTone { icon: LucideIcon; fill: string }

// One colour per content type, shared by every catalogue surface (see DESIGN.md). Fills always carry navy text.
const TONES: Record<string, ContentTone> = {
  course: { icon: BookOpen, fill: 'bg-primary' },
  curricular_unit: { icon: Layers, fill: 'bg-brand-orange' },
  module: { icon: BookOpenCheck, fill: 'bg-brand-mint' },
  video: { icon: PlayCircle, fill: 'bg-brand-pink' },
  // A sequence is an ordered run of videos, so it shares the video fill with its own icon.
  playlist: { icon: ListVideo, fill: 'bg-brand-pink' },
  document: { icon: FileText, fill: 'bg-brand-mint' },
  external_resource: { icon: ExternalLink, fill: 'bg-brand-cyan' },
};

export function contentTone(objectType: string): ContentTone {
  return TONES[objectType] ?? { icon: Shapes, fill: 'bg-brand-coral' };
}

const KIND_TYPES: Record<ContentKind, string> = { courses: 'course', curricular_units: 'curricular_unit', learning_objects: 'learning_object' };

/** Tone for an editorial table; learning objects as a whole use the fallback "mixed types" tone. */
export function kindTone(kind: ContentKind): ContentTone {
  return contentTone(KIND_TYPES[kind]);
}
