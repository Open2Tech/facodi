import type { Database } from '@/integrations/supabase/types';

export type ResourceSuggestionRow = Database['facodi']['Tables']['resource_suggestions']['Row'];
type AnalysisJobRow = Database['facodi']['Tables']['analysis_jobs']['Row'];
export type SuggestionDecision = 'approved' | 'rejected';
export type SuggestionStatus = 'pending' | 'duplicate' | 'approved' | 'rejected';

/** Providers the database recognises; anything else is screened as a generic web source. */
export const PROVIDERS = ['youtube', 'github', 'zenodo', 'openstax', 'doaj', 'arxiv', 'web'] as const;
export type Provider = (typeof PROVIDERS)[number];

/** Resource types a learner may propose; the database forces `video` for YouTube watch URLs. */
export const SUGGESTION_TYPES = ['video', 'document', 'external_resource'] as const;
export type SuggestionType = (typeof SUGGESTION_TYPES)[number];

export type LicenseClass = 'open' | 'restricted' | 'unknown';
export type Recommendation = 'fast_track' | 'review' | 'reject';

/** Server-computed screening stored by the `screen_resource_suggestion` trigger. */
export interface Screening {
  providerRecognized: boolean;
  secureSource: boolean;
  license: LicenseClass;
  unitSelected: boolean;
  recommendation: Recommendation;
  duplicate: { learningObjectId: string; slug: string; objectType: string } | null;
}

export interface UnitOption {
  id: string;
  code: string;
  title: string;
  slug: string;
  course: { code: string; title: string; slug: string };
}

/** Metadata recognised from the URL and, when available, a public metadata API. */
export interface ExtractedMetadata {
  title: string;
  author: string;
  license: string;
  thumbnail: string | null;
  objectType: SuggestionType;
  language: string;
  tags: string[];
  description: string;
}

export interface SuggestionInput {
  url: string;
  title: string;
  author: string;
  license: string;
  thumbnailUrl: string | null;
  objectType: SuggestionType;
  language: string;
  tags: string[];
  unitId: string;
  note: string;
}

export type SuggestionSummary = Pick<ResourceSuggestionRow,
  'id' | 'url' | 'canonical_url' | 'provider' | 'title' | 'author' | 'thumbnail_url' | 'license' | 'object_type'
  | 'language' | 'tags' | 'note' | 'status' | 'screening' | 'review_note' | 'reviewed_at' | 'created_at' | 'learning_object_id'>
  & { curricular_units: { id: string; code: string; title: string; slug: string; courses: { code: string; slug: string } | null } | null }
  & { analysis_jobs?: Pick<AnalysisJobRow, 'status' | 'error_code' | 'result_payload'>[] };

/** Unit proposed by the advisory analysis (see docs/suggest-ai-analysis-plan.md). */
export interface AnalysisMatch {
  unitId: string;
  code: string | null;
  title: string;
  unitSlug: string;
  courseCode: string | null;
  courseSlug: string;
  fit: 'strong' | 'partial';
  reason: string;
}

/** Learner- and editor-facing state of the automatic analysis; it never decides anything. */
export interface SuggestionAnalysis {
  state: 'pending' | 'waiting' | 'done' | 'failed';
  matches: AnalysisMatch[];
  topics: string[];
}
