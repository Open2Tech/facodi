import { supabase } from './supabase';

export type PipelineProvider = 'v2';

type DifficultyLevel = 'foundational' | 'intermediate' | 'advanced' | 'expert';

export interface ChannelIdentity {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  channelId: string;
  username: string;
  title: string;
}

export interface ChannelVideo {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  duration: number;
  durationSeconds: number;
  viewCount: number;
  publishedAt: string;
  thumbnailUrl?: string;
  thumbnail: string;
  channelName: string;
  channelTitle: string;
  tags?: string[];
}

export interface VideoAnalysis {
  videoId: string;
  classificationId?: string;
  difficulty: DifficultyLevel;
  pedagogicalScore: number;
  topics: string[];
  justification: string;
  playlistSuggestions: string[];
  confidence: number;
  topic: string;
  summary: string;
  pedagogicalReason: string;
  tags: string[];
  courseId?: string;
  unitId?: string;
  playlistId?: string;
}

export interface PlaylistSuggestion {
  id: string;
  name: string;
  matchPercentage: number;
  description?: string;
  videoId: string;
  playlistId: string;
  confidence: number;
  courseId?: string;
  unitId?: string;
}

export interface PublishRequest {
  channelId: string;
  videoIds: string[];
  mappings: Record<string, string>;
  curatorNotes?: string;
}

export interface PublishResult {
  success: boolean;
  message: string;
  publishedCount: number;
  affectedPlaylists: string[];
  timestamp: string;
  notes?: string;
}

export interface ChannelPipelineJob {
  videoId: string;
  youtubeVideoId: string;
  jobId: string;
  status: string;
}

export interface CurationBrief {
  channelName?: string;
  videosCount?: number;
  playlistsCount?: number;
  estimatedHours?: number;
  maxVideos?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  language?: string;
  includeShorts?: boolean;
}

export type PublishItemInput = {
  video: { id: string; title?: string; description?: string; tags?: string[] };
  analysis?: VideoAnalysis;
  suggestion?: { playlistId?: string | null; courseId?: string | null; unitId?: string | null };
};

const terminalStatuses = new Set(['succeeded', 'failed', 'needs_review', 'cancelled']);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error || 'unknown_error');
}

function normalizeDifficulty(value: unknown): DifficultyLevel {
  const raw = String(value || 'intermediate').toLowerCase();
  if (raw === 'foundational' || raw === 'beginner') return 'foundational';
  if (raw === 'advanced') return 'advanced';
  if (raw === 'expert') return 'expert';
  return 'intermediate';
}

function toChannelIdentity(payload: Record<string, unknown>, fallback: string): ChannelIdentity {
  const id = String(payload.channelId || payload.id || fallback);
  const title = String(payload.title || payload.name || fallback);
  const username = String(payload.username || payload.handle || title.toLowerCase().replace(/\s+/g, '-'));
  return {
    id,
    channelId: id,
    name: title,
    title,
    username,
    description: typeof payload.description === 'string' ? payload.description : undefined,
    thumbnailUrl: typeof payload.thumbnailUrl === 'string' ? payload.thumbnailUrl : undefined,
    subscriberCount: typeof payload.subscriberCount === 'number' ? payload.subscriberCount : undefined,
  };
}

function toChannelVideo(row: Record<string, unknown>, fallbackChannel: string): ChannelVideo {
  const id = String(row.id || row.videoId || '');
  const channelTitle = String(row.channelTitle || row.channelName || fallbackChannel);
  const duration = Number(row.durationSeconds || row.duration || 0);
  const thumbnail = typeof row.thumbnailUrl === 'string' ? row.thumbnailUrl : '';
  return {
    id,
    videoId: id,
    title: String(row.title || ''),
    description: typeof row.description === 'string' ? row.description : undefined,
    duration,
    durationSeconds: duration,
    viewCount: Number(row.viewCount || 0),
    publishedAt: String(row.publishedAt || new Date().toISOString()),
    thumbnailUrl: thumbnail || undefined,
    thumbnail,
    channelName: channelTitle,
    channelTitle,
    tags: Array.isArray(row.tags) ? row.tags.map((value) => String(value)) : [],
  };
}

function toPlaylistSuggestion(row: Record<string, unknown>, index: number, videoId: string): PlaylistSuggestion {
  const confidenceRaw = Number(row.confidence || 0.5);
  const confidence = confidenceRaw <= 1 ? confidenceRaw : confidenceRaw / 100;
  const playlistId = String(row.playlistId || row.id || row.curricular_unit_id || `classification_${index + 1}`);
  return {
    id: playlistId,
    playlistId,
    videoId,
    name: String(row.suggestedUnit || row.name || row.curricular_unit_title || `Sugestao ${index + 1}`),
    matchPercentage: Math.round(confidence * 100),
    description: typeof row.description === 'string' ? row.description : undefined,
    confidence,
    courseId: typeof row.courseId === 'string' ? row.courseId : typeof row.course_id === 'string' ? row.course_id : undefined,
    unitId: typeof row.unitId === 'string' ? row.unitId : typeof row.curricular_unit_id === 'string' ? row.curricular_unit_id : undefined,
  };
}

async function runV2Pipeline(video: ChannelVideo): Promise<VideoAnalysis> {
  const { jobs } = await submitChannelVideos([video], video.channelTitle || video.channelName || 'facodi');
  if (!jobs[0]) {
    throw new Error('v2_submit_channel_videos did not return a job.');
  }
  return pollAnalysisJob(jobs[0].jobId, video);
}

async function getAnalysisStatus(jobId: string): Promise<Record<string, unknown>> {
  const status = await supabase.functions.invoke('v2_get_analysis_status', {
    body: { job_id: jobId },
  });
  if (status.error || !status.data || status.data.success === false) {
    throw new Error(`v2_get_analysis_status failed: ${getErrorMessage(status.error || status.data?.error)}`);
  }
  return status.data as Record<string, unknown>;
}

async function pollAnalysisJob(jobId: string, video: ChannelVideo): Promise<VideoAnalysis> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const data = await getAnalysisStatus(jobId);
    const job = (data.job || {}) as Record<string, unknown>;
    const jobStatus = String(job.status || '');
    if (terminalStatuses.has(jobStatus)) {
      if (jobStatus === 'failed' || jobStatus === 'cancelled') {
        throw new Error(String(job.error_message || `Pipeline ${jobStatus} for ${video.title || video.id}.`));
      }
      return statusToVideoAnalysis(data, video);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 3000));
  }
  throw new Error(`Pipeline timeout for ${video.title || video.id}.`);
}

function statusToVideoAnalysis(statusData: Record<string, unknown>, video: ChannelVideo): VideoAnalysis {
  const classification = (statusData.classification || {}) as Record<string, unknown>;
  const candidates = Array.isArray(statusData.candidates)
    ? (statusData.candidates as Array<Record<string, unknown>>)
    : [];
  const best = candidates.find((candidate) => candidate.candidate_type === 'curricular_unit') || candidates[0] || {};
  const confidence = Number(classification.confidence || best.confidence || 0.65);
  const unitId = typeof best.curricular_unit_id === 'string'
    ? best.curricular_unit_id
    : typeof classification.curricular_unit_id === 'string'
      ? classification.curricular_unit_id
      : undefined;
  const courseId = typeof best.course_id === 'string'
    ? best.course_id
    : typeof classification.course_id === 'string'
      ? classification.course_id
      : undefined;

  return {
    videoId: video.id,
    classificationId: typeof classification.id === 'string' ? classification.id : undefined,
    difficulty: normalizeDifficulty(classification.confidence_level === 'high' ? 'advanced' : 'intermediate'),
    pedagogicalScore: Math.round(confidence * 100),
    topics: ['v2', 'classification'],
    justification: String(classification.justification || best.justification || ''),
    playlistSuggestions: unitId ? [unitId] : [],
    confidence: confidence * 100,
    topic: 'classification',
    summary:
      typeof classification.justification === 'string'
        ? classification.justification
        : 'Classificacao automatica realizada pelo pipeline v2.',
    pedagogicalReason: String(classification.justification || best.justification || ''),
    tags: ['v2', 'classification'],
    playlistId: unitId,
    courseId,
    unitId,
  };
}

export async function submitChannelVideos(
  selectedVideos: ChannelVideo[],
  channelInput: string,
): Promise<{ jobs: ChannelPipelineJob[] }> {
  const { data, error } = await supabase.functions.invoke('v2_submit_channel_videos', {
    body: {
      channel_input: channelInput,
      start_processing: true,
      videos: selectedVideos.map((video) => ({
        video_id: video.id,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        title: video.title,
        description: video.description || undefined,
        channel_title: video.channelTitle || video.channelName,
        thumbnail_url: video.thumbnailUrl || video.thumbnail || undefined,
        published_at: video.publishedAt,
        tags: video.tags || [],
      })),
    },
  });
  if (error || !data || data.success === false) {
    throw new Error(`v2_submit_channel_videos failed: ${getErrorMessage(error || data?.error)}`);
  }
  const rows = Array.isArray(data.jobs) ? data.jobs as Array<Record<string, unknown>> : [];
  return {
    jobs: rows.map((row) => ({
      videoId: String(row.video_id || ''),
      youtubeVideoId: String(row.youtube_video_id || ''),
      jobId: String(row.job_id || ''),
      status: String(row.status || 'queued'),
    })),
  };
}

export async function importChannel(identifier: string): Promise<ChannelIdentity> {
  const { data, error } = await supabase.functions.invoke('v2_fetch_youtube_channel', {
    body: { channel_input: identifier },
  });

  if (error) {
    throw new Error(`v2_fetch_youtube_channel failed: ${error.message}`);
  }

  return toChannelIdentity((data || {}) as Record<string, unknown>, identifier);
}

export async function listChannelVideos(
  channelInput: string,
  brief: CurationBrief,
): Promise<ChannelVideo[]>;
export async function listChannelVideos(
  channelInput: string,
  pageToken?: string,
  maxResults?: number,
): Promise<{ videos: ChannelVideo[]; nextPageToken?: string }>;
export async function listChannelVideos(
  channelInput: string,
  pageTokenOrBrief?: string | CurationBrief,
  maxResults = 50,
): Promise<ChannelVideo[] | { videos: ChannelVideo[]; nextPageToken?: string }> {
  const brief =
    typeof pageTokenOrBrief === 'object' && pageTokenOrBrief !== null
      ? pageTokenOrBrief
      : undefined;
  const pageToken = typeof pageTokenOrBrief === 'string' ? pageTokenOrBrief : undefined;
  const effectiveMax = brief?.maxVideos || maxResults;

  const { data, error } = await supabase.functions.invoke('v2_list_channel_videos', {
    body: {
      channel_input: channelInput,
      pageToken,
      brief: { maxVideos: effectiveMax },
    },
  });

  if (error) {
    throw new Error(`v2_list_channel_videos failed: ${error.message}`);
  }

  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.videos)
      ? ((data as Record<string, unknown>).videos as unknown[])
      : [];
  const videos = rows.map((row) => toChannelVideo(row as Record<string, unknown>, channelInput));
  const nextPageToken =
    typeof (data as Record<string, unknown>)?.nextPageToken === 'string'
      ? String((data as Record<string, unknown>).nextPageToken)
      : undefined;

  return brief ? videos : { videos, nextPageToken };
}

export async function analyzeVideosBatch(videoIds: string[]): Promise<Map<string, VideoAnalysis>> {
  const videos = videoIds.map((id) => toChannelVideo({ id, title: id }, 'facodi'));
  const analyses = await analyzeVideoBatch({ id: 'batch', channelId: 'batch', name: 'batch', title: 'batch', username: 'batch' }, videos);
  return new Map(analyses.map((analysis) => [analysis.videoId, analysis]));
}

export async function analyzeVideoBatch(
  _channel: ChannelIdentity,
  selectedVideos: ChannelVideo[],
  _brief?: CurationBrief,
): Promise<VideoAnalysis[]> {
  if (selectedVideos.length === 0) {
    return [];
  }
  const { jobs } = await submitChannelVideos(
    selectedVideos,
    _channel.channelId || _channel.id || _channel.title,
  );
  return Promise.all(
    jobs.map((job) => {
      const video = selectedVideos.find((item) => item.id === job.youtubeVideoId) || selectedVideos[0];
      return pollAnalysisJob(job.jobId, video);
    }),
  );
}

export async function generatePlaylistSuggestions(
  videoAnalyses: Map<string, VideoAnalysis>,
): Promise<Map<string, PlaylistSuggestion[]>>;
export async function generatePlaylistSuggestions(
  _channel: ChannelIdentity,
  selectedVideos: ChannelVideo[],
  analyses: VideoAnalysis[],
): Promise<PlaylistSuggestion[]>;
export async function generatePlaylistSuggestions(
  inputA: Map<string, VideoAnalysis> | ChannelIdentity,
  inputB?: ChannelVideo[],
  inputC?: VideoAnalysis[],
): Promise<Map<string, PlaylistSuggestion[]> | PlaylistSuggestion[]> {
  if (inputA instanceof Map) {
    const grouped = new Map<string, PlaylistSuggestion[]>();
    Array.from(inputA.entries()).forEach(([videoId, analysis], index) => {
      grouped.set(videoId, [toPlaylistSuggestion(analysis as unknown as Record<string, unknown>, index, videoId)]);
    });
    return grouped;
  }

  const selectedVideos = inputB || [];
  const analyses = inputC || [];
  return selectedVideos
    .map((video, index) => {
      const analysis = analyses.find((item) => item.videoId === video.id);
      if (!analysis?.unitId) return null;
      return toPlaylistSuggestion(
        {
          playlistId: analysis.unitId,
          suggestedUnit: analysis.unitId,
          confidence: (analysis.confidence || 70) / 100,
          courseId: analysis.courseId,
          unitId: analysis.unitId,
        },
        index,
        video.id,
      );
    })
    .filter((item): item is PlaylistSuggestion => Boolean(item));
}

export async function publishCuratedVideos(request: PublishRequest): Promise<PublishResult>;
export async function publishCuratedVideos(items: PublishItemInput[]): Promise<PublishItemInput[]>;
export async function publishCuratedVideos(
  input: PublishRequest | PublishItemInput[],
): Promise<PublishResult | PublishItemInput[]> {
  if (Array.isArray(input)) {
    for (const item of input) {
      if (!item.analysis?.classificationId) {
        throw new Error(`Missing classification for ${item.video.title || item.video.id}.`);
      }
      const { error, data } = await supabase.functions.invoke('v2_review_classification', {
        body: {
          classification_id: item.analysis.classificationId,
          action: 'accept',
          notes: 'Accepted from FACODI channel pipeline.',
        },
      });
      if (error || data?.success === false) {
        throw new Error(`v2_review_classification failed: ${getErrorMessage(error || data?.error)}`);
      }
    }
    return input;
  }

  throw new Error('Publishing requires classification ids from the v2 review flow.');
}

export function getPipelineProvider(): PipelineProvider {
  return 'v2';
}

export const fetchYouTubeChannel = importChannel;

const channelCurationSource = {
  importChannel,
  listChannelVideos,
  analyzeVideosBatch,
  analyzeVideoBatch,
  fetchYouTubeChannel,
  generatePlaylistSuggestions,
  publishCuratedVideos,
  getPipelineProvider,
};

export default channelCurationSource;
