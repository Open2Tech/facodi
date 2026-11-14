import type { Database } from '@/integrations/supabase/types';

export type Blueprint = Database['facodi']['Tables']['generated_structures']['Row'];
export type BlueprintStatus = 'draft' | 'accepted' | 'rejected';
export type BlueprintDecision = Exclude<BlueprintStatus, 'draft'>;
export type PlaylistDecision = 'approved' | 'rejected';

/** Response of the `facodi-submit-playlist` Edge Function. */
export interface PlaylistSubmission {
  playlist_id: string;
  review_status: string;
  import_status: string;
  playlist_video_count: number;
  linked_video_count: number;
  missing_video_count: number;
  title: string;
}

export interface PlaylistSubmissionInput {
  courseId: string;
  unitId: string;
  url: string;
  title: string;
  description: string;
  language: string;
  maxVideos: number;
  /** Optional fallback list of YouTube video IDs, separated by whitespace, commas or semicolons. */
  manualIds: string;
}

export interface CatalogOption { id: string; code: string; title: string }

export interface PlaylistSummary {
  id: string;
  title: string;
  description: string | null;
  source_url: string | null;
  status: string;
  import_status: string;
  language: string;
  submitted_at: string;
  review_note: string | null;
  courses: { code: string; title: string } | null;
  curricular_units: { code: string; title: string } | null;
}
