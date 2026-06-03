import { supabase } from './supabase';
import type { Database, Json } from './supabase.types';

type ClassificationRow = Database['facodi']['Views']['v_admin_video_classifications']['Row'];

export type VideoClassificationStatus = 'draft' | 'accepted' | 'rejected' | 'corrected' | 'needs_review';

export type VideoClassificationReview = {
  id: string;
  videoId: string;
  youtubeVideoId: string;
  videoTitle: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  courseId?: string;
  courseTitle?: string;
  unitId?: string;
  unitTitle?: string;
  unitCode?: string;
  confidence: number;
  confidenceLevel: string;
  status: VideoClassificationStatus;
  needsReview: boolean;
  justification?: string;
  evidence: Json | null;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClassificationFilters = {
  status?: VideoClassificationStatus;
  needsReview?: boolean;
  limit?: number;
  offset?: number;
};

function mapClassificationRow(row: ClassificationRow): VideoClassificationReview {
  if (!row.id || !row.video_id || !row.youtube_video_id || !row.video_title) {
    throw new Error('[classificationReviewSource:facodi] Invalid classification row.');
  }

  return {
    id: row.id,
    videoId: row.video_id,
    youtubeVideoId: row.youtube_video_id,
    videoTitle: row.video_title,
    channelTitle: row.channel_title ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    courseId: row.course_id ?? undefined,
    courseTitle: row.course_title ?? undefined,
    unitId: row.curricular_unit_id ?? undefined,
    unitTitle: row.unit_title ?? undefined,
    unitCode: row.unit_code ?? undefined,
    confidence: Number(row.confidence) || 0,
    confidenceLevel: row.confidence_level || 'low',
    status: (row.status || 'draft') as VideoClassificationStatus,
    needsReview: Boolean(row.needs_review),
    justification: row.justification ?? undefined,
    evidence: row.evidence,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
  };
}

export async function listVideoClassifications(
  filters: ClassificationFilters = {},
): Promise<{ classifications: VideoClassificationReview[]; total: number }> {
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  let query = supabase
    .schema('facodi')
    .from('v_admin_video_classifications')
    .select('*', { count: 'exact' })
    .order('needs_review', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (typeof filters.needsReview === 'boolean') {
    query = query.eq('needs_review', filters.needsReview);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`[classificationReviewSource:facodi] list: ${error.message}`);
  }

  return {
    classifications: (data || []).map(mapClassificationRow),
    total: count || 0,
  };
}

export async function reviewVideoClassification(
  classificationId: string,
  action: 'accept' | 'reject' | 'correct',
  options: { courseId?: string | null; unitId?: string | null; notes?: string } = {},
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('v2_review_classification', {
    body: {
      classification_id: classificationId,
      action,
      course_id: options.courseId ?? null,
      curricular_unit_id: options.unitId ?? null,
      notes: options.notes,
    },
  });

  if (error) {
    throw new Error(`[classificationReviewSource:facodi] review: ${error.message}`);
  }
  if (data && data.success === false) {
    throw new Error(`[classificationReviewSource:facodi] review: ${data.error || 'review_failed'}`);
  }
}
