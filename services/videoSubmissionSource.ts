import { supabase } from './supabase';

export type VideoSubmissionJob = {
  id: string;
  video_id: string | null;
  youtube_video_id: string | null;
  input_url: string | null;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'needs_review' | 'cancelled';
  current_step: string;
  requested_by: string | null;
  error_code: string | null;
  error_message: string | null;
  result_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type VideoSubmissionVideo = {
  id: string;
  youtube_video_id: string;
  canonical_url: string;
  title: string | null;
  description: string | null;
  channel_title: string | null;
  thumbnail_url: string | null;
  status: string;
};

export type VideoSubmissionClassification = {
  id: string;
  status: string;
  needs_review: boolean;
  confidence: number;
  confidence_level: string;
  justification: string | null;
  course_id: string | null;
  curricular_unit_id: string | null;
  reviewed_at: string | null;
  metadata: Record<string, unknown>;
};

export type VideoSubmissionStatus = {
  job: VideoSubmissionJob;
  video: VideoSubmissionVideo | null;
  classification: VideoSubmissionClassification | null;
  candidates: Array<Record<string, unknown>>;
  artifacts: Array<Record<string, unknown>>;
};

export type SubmitVideoInput = {
  url: string;
  description?: string;
  language?: string;
};

export type SubmitVideoResult = {
  jobId: string;
  videoId: string;
  youtubeVideoId: string;
  canonicalUrl: string;
  status: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getFunctionError(prefix: string, error: unknown, data?: unknown): Error {
  const payload = asRecord(data);
  const message =
    error instanceof Error
      ? error.message
      : typeof payload.message === 'string'
        ? payload.message
        : typeof payload.error === 'string'
          ? payload.error
          : 'Erro Supabase.';
  return new Error(`${prefix}: ${message}`);
}

export async function submitVideo(input: SubmitVideoInput): Promise<SubmitVideoResult> {
  const { data, error } = await supabase.functions.invoke('v2_submit_youtube_video', {
    body: {
      url: input.url,
      description: input.description || undefined,
      language: input.language || undefined,
    },
  });

  if (error || !data || data.success === false) {
    throw getFunctionError('[videoSubmissionSource:v2_submit_youtube_video]', error, data);
  }

  return {
    jobId: String(data.job_id),
    videoId: String(data.video_id),
    youtubeVideoId: String(data.youtube_video_id),
    canonicalUrl: String(data.canonical_url),
    status: String(data.status || 'queued'),
  };
}

export async function getVideoSubmissionStatus(jobId: string): Promise<VideoSubmissionStatus> {
  const { data, error } = await supabase.functions.invoke('v2_get_video_submission_status', {
    body: { job_id: jobId },
  });

  if (error || !data || data.success === false) {
    throw getFunctionError('[videoSubmissionSource:v2_get_video_submission_status]', error, data);
  }

  return {
    job: data.job as VideoSubmissionJob,
    video: (data.video ?? null) as VideoSubmissionVideo | null,
    classification: (data.classification ?? null) as VideoSubmissionClassification | null,
    candidates: Array.isArray(data.candidates) ? data.candidates : [],
    artifacts: Array.isArray(data.artifacts) ? data.artifacts : [],
  };
}
