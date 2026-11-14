import { BookOpen, ExternalLink, FileText, Layers, PlayCircle, Shapes, type LucideIcon } from 'lucide-react';

export interface ContentTone { icon: LucideIcon; fill: string }

// One colour per content type, shared by every catalogue surface (see DESIGN.md). Fills always carry navy text.
const TONES: Record<string, ContentTone> = {
  course: { icon: BookOpen, fill: 'bg-primary' },
  curricular_unit: { icon: Layers, fill: 'bg-brand-orange' },
  video: { icon: PlayCircle, fill: 'bg-brand-pink' },
  document: { icon: FileText, fill: 'bg-brand-mint' },
  external_resource: { icon: ExternalLink, fill: 'bg-brand-cyan' },
};

export function contentTone(objectType: string): ContentTone {
  return TONES[objectType] ?? { icon: Shapes, fill: 'bg-brand-coral' };
}
