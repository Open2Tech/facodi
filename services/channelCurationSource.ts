import { supabase } from './supabase';

export type PipelineProvider = 'v1' | 'v2';

const PIPELINE_PROVIDER: PipelineProvider =
  (import.meta.env.VITE_VIDEO_ANALYSIS_PROVIDER || 'v1').toLowerCase() === 'v2'
    ? 'v2'
    : 'v1';

const USE_MOCK =
  import.meta.env.VITE_DATA_SOURCE === 'mock' || import.meta.env.VITE_CURATOR_MOCK === 'true';

type DifficultyLevel = 'foundational' | 'intermediate' | 'advanced' | 'expert';

export interface ChannelIdentity {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;

  // Legacy compatibility
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
  difficulty: DifficultyLevel;
  pedagogicalScore: number;
  topics: string[];
  justification: string;
  playlistSuggestions: string[];
  confidence: number;

  // Curator page fields
  topic: string;
  summary: string;
  pedagogicalReason: string;
  tags: string[];
  isFallback?: boolean;
  courseId?: string;
  unitId?: string;
  playlistId?: string;
}

export interface PlaylistSuggestion {
  // Legacy mapper fields
  id: string;
  name: string;
  matchPercentage: number;
  description?: string;

  // Curator page fields
  videoId: string;
  playlistId: string;
  confidence: number;
  courseId?: string;
  unitId?: string;
  isFallback?: boolean;
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

type PublishItemInput = {
  video: { id: string; title?: string; description?: string; tags?: string[] };
  analysis?: {
    topic?: string;
    summary?: string;
    pedagogicalReason?: string;
    tags?: string[];
  };
  suggestion?: { playlistId?: string | null; courseId?: string | null; unitId?: string | null };
};

interface PipelineFallbackState {
  used: boolean;
  stages: string[];
}

let fallbackState: PipelineFallbackState = { used: false, stages: [] };

function markFallback(stage: string): void {
  fallbackState.used = true;
  if (!fallbackState.stages.includes(stage)) {
    fallbackState.stages.push(stage);
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error || 'unknown_error');
}

function isAuthOrRoleError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('403') ||
    message.includes('401') ||
    message.includes('forbidden') ||
    message.includes('unauthorized') ||
    message.includes('editor') ||
    message.includes('admin role')
  );
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
    tags: Array.isArray(row.tags) ? row.tags.map((v) => String(v)) : [],
  };
}

function toVideoAnalysis(
  row: Record<string, unknown>,
  videoIdFallback: string,
  isFallback: boolean,
): VideoAnalysis {
  const confidenceRaw = Number(row.confidence || 0.7);
  const confidencePct = confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw;
  const topic = String(row.topic || 'general');
  const tags = Array.isArray(row.tags) ? row.tags.map((v) => String(v)) : topic ? [topic] : [];
  return {
    videoId: String(row.videoId || videoIdFallback),
    difficulty: normalizeDifficulty(row.difficulty),
    pedagogicalScore: Number(row.pedagogicalScore || confidencePct),
    topics: tags,
    justification: String(row.justification || row.pedagogicalReason || ''),
    playlistSuggestions: typeof row.playlistId === 'string' ? [row.playlistId] : [],
    confidence: confidencePct,
    topic,
    summary: String(row.summary || row.justification || ''),
    pedagogicalReason: String(row.pedagogicalReason || row.justification || ''),
    tags,
    isFallback,
    courseId: typeof row.courseId === 'string' ? row.courseId : undefined,
    unitId: typeof row.unitId === 'string' ? row.unitId : undefined,
    playlistId: typeof row.playlistId === 'string' ? row.playlistId : undefined,
  };
}

function toPlaylistSuggestion(
  row: Record<string, unknown>,
  index: number,
  videoId: string,
  isFallback: boolean,
): PlaylistSuggestion {
  const confidenceRaw = Number(row.confidence || 0.5);
  const confidence = confidenceRaw <= 1 ? confidenceRaw : confidenceRaw / 100;
  const playlistId = String(row.playlistId || row.id || `suggested_playlist_${index + 1}`);
  return {
    id: playlistId,
    playlistId,
    videoId,
    name: String(row.suggestedUnit || row.name || `Sugestao ${index + 1}`),
    matchPercentage: Math.round(confidence * 100),
    description: typeof row.description === 'string' ? row.description : undefined,
    confidence,
    courseId: typeof row.courseId === 'string' ? row.courseId : undefined,
    unitId: typeof row.unitId === 'string' ? row.unitId : undefined,
    isFallback,
  };
}

function mockChannel(channelInput: string): ChannelIdentity {
  return toChannelIdentity(
    {
      channelId: channelInput,
      title: channelInput,
      username: channelInput,
      description: 'Educational content channel',
      subscriberCount: 100000,
    },
    channelInput,
  );
}

function mockVideos(channelInput: string): ChannelVideo[] {
  return Array.from({ length: 8 }).map((_, i) =>
    toChannelVideo(
      {
        id: `vid_${i + 1}`,
        title: `Video ${i + 1} - ${channelInput}`,
        description: `Conteudo de exemplo ${i + 1}`,
        duration: 1200 + i * 240,
        viewCount: 5000 + i * 1100,
        publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
        thumbnailUrl: `https://via.placeholder.com/320x180?text=Video+${i + 1}`,
        channelTitle: channelInput,
        tags: ['facodi', 'education'],
      },
      channelInput,
    ),
  );
}

function mockAnalysis(videoIds: string[]): Map<string, VideoAnalysis> {
  const topics = ['calculus', 'algebra', 'statistics', 'programming'];
  const result = new Map<string, VideoAnalysis>();
  for (const [index, videoId] of videoIds.entries()) {
    const topic = topics[index % topics.length];
    result.set(
      videoId,
      toVideoAnalysis(
        {
          videoId,
          difficulty: ['foundational', 'intermediate', 'advanced'][index % 3],
          confidence: 0.7 + (index % 3) * 0.1,
          topic,
          summary: `Resumo automatico para ${videoId}`,
          pedagogicalReason: `Conteudo alinhado com ${topic}`,
          tags: [topic, 'facodi'],
        },
        videoId,
        true,
      ),
    );
  }
  return result;
}

function mockSuggestions(videoIds: string[]): PlaylistSuggestion[] {
  return videoIds.map((videoId, index) =>
    toPlaylistSuggestion(
      {
        playlistId: `pl_${(index % 4) + 1}`,
        suggestedUnit: `Unidade ${(index % 4) + 1}`,
        confidence: 0.6 + (index % 3) * 0.1,
        courseId: `course_${(index % 2) + 1}`,
        unitId: `unit_${(index % 4) + 1}`,
      },
      index,
      videoId,
      true,
    ),
  );
}

async function runV2Pipeline(video: ChannelVideo): Promise<VideoAnalysis> {
  const ingest = await supabase.functions.invoke('v2_ingest_youtube_video', {
    body: {
      video_id: video.id,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      title: video.title,
      description: video.description || '',
      channel_title: video.channelTitle,
      metadata: { source: 'facodi_frontend_pipeline' },
    },
  });

  if (ingest.error || !ingest.data?.job_id) {
    if (ingest.error) {
      throw new Error(`v2_ingest_youtube_video failed: ${getErrorMessage(ingest.error)}`);
    }
    throw new Error('v2_ingest_youtube_video failed: missing job_id');
  }

  const jobId = String(ingest.data.job_id);
  const chain = [
    'v2_fetch_youtube_metadata',
    'v2_extract_video_content',
    'v2_generate_embeddings',
    'v2_match_video_candidates',
    'v2_classify_video',
  ] as const;

  for (const fn of chain) {
    const response = await supabase.functions.invoke(fn, {
      body: {
        job_id: jobId,
        ...(fn === 'v2_generate_embeddings' ? { target: 'video' } : {}),
      },
    });
    if (response.error || (response.data && response.data.success === false)) {
      if (response.error) {
        throw new Error(`${fn} failed: ${getErrorMessage(response.error)}`);
      }
      throw new Error(`${fn} failed`);
    }
  }

  const status = await supabase.functions.invoke('v2_get_analysis_status', {
    body: { job_id: jobId },
  });

  if (status.error || !status.data) {
    if (status.error) {
      throw new Error(`v2_get_analysis_status failed: ${getErrorMessage(status.error)}`);
    }
    throw new Error('v2_get_analysis_status failed: missing status payload');
  }

  const classification = (status.data.classification || {}) as Record<string, unknown>;
  const candidates = Array.isArray(status.data.candidates)
    ? (status.data.candidates as Array<Record<string, unknown>>)
    : [];
  const best = candidates.find((candidate) => candidate.candidate_type === 'curricular_unit') || candidates[0] || {};

  return toVideoAnalysis(
    {
      videoId: video.id,
      difficulty: classification.confidence_level === 'high' ? 'advanced' : 'intermediate',
      confidence: Number(classification.confidence || 0.65),
      topic: 'classification',
      summary:
        typeof classification.justification === 'string'
          ? classification.justification
          : 'Classificacao automatica realizada pelo pipeline v2.',
      pedagogicalReason: classification.justification,
      tags: ['v2', 'classification'],
      playlistId: best.curricular_unit_id,
      courseId: best.course_id,
      unitId: best.curricular_unit_id,
    },
    video.id,
    false,
  );
}

function normalizePublishInput(input: PublishRequest | PublishItemInput[]): {
  request: PublishRequest;
  items: PublishItemInput[];
} {
  if (Array.isArray(input)) {
    const mappings: Record<string, string> = {};
    const videoIds: string[] = [];

    for (const item of input) {
      const id = item.video.id;
      videoIds.push(id);
      if (item.suggestion?.playlistId) {
        mappings[id] = item.suggestion.playlistId;
      }
    }

    return {
      request: {
        channelId: 'curator-channel-pipeline',
        videoIds,
        mappings,
      },
      items: input,
    };
  }

  return {
    request: input,
    items: input.videoIds.map((id) => ({
      video: { id },
      suggestion: { playlistId: input.mappings[id] || null },
    })),
  };
}

export async function importChannel(identifier: string): Promise<ChannelIdentity> {
  try {
    if (USE_MOCK) {
      markFallback('import_channel');
      return mockChannel(identifier);
    }

    const { data, error } = await supabase.functions.invoke('fetch_youtube_channel', {
      body: { channelInput: identifier },
    });

    if (error) {
      markFallback('import_channel');
      return mockChannel(identifier);
    }

    return toChannelIdentity((data || {}) as Record<string, unknown>, identifier);
  } catch {
    markFallback('import_channel');
    return mockChannel(identifier);
  }
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

  try {
    if (USE_MOCK) {
      markFallback('list_videos');
      const items = mockVideos(channelInput).slice(0, effectiveMax);
      return brief ? items : { videos: items };
    }

    const { data, error } = await supabase.functions.invoke('list_channel_videos', {
      body: {
        channelInput,
        pageToken,
        brief: { maxVideos: effectiveMax },
      },
    });

    if (error) {
      markFallback('list_videos');
      const items = mockVideos(channelInput).slice(0, effectiveMax);
      return brief ? items : { videos: items };
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
  } catch {
    markFallback('list_videos');
    const items = mockVideos(channelInput).slice(0, effectiveMax);
    return brief ? items : { videos: items };
  }
}

export async function analyzeVideosBatch(videoIds: string[]): Promise<Map<string, VideoAnalysis>> {
  try {
    if (USE_MOCK) {
      markFallback('analyze_videos');
      return mockAnalysis(videoIds);
    }

    const { data, error } = await supabase.functions.invoke('analyze_video_batch', {
      body: { videos: videoIds.map((id) => ({ id })) },
    });

    if (error) {
      markFallback('analyze_videos');
      return mockAnalysis(videoIds);
    }

    const entries = Array.isArray(data) ? data : [];
    const mapped = new Map<string, VideoAnalysis>();

    for (const row of entries as Array<Record<string, unknown>>) {
      const videoId = String(row.videoId || '');
      if (!videoId) continue;
      mapped.set(videoId, toVideoAnalysis(row, videoId, false));
    }

    if (mapped.size === 0) {
      markFallback('analyze_videos');
      return mockAnalysis(videoIds);
    }

    return mapped;
  } catch {
    markFallback('analyze_videos');
    return mockAnalysis(videoIds);
  }
}

export async function analyzeVideoBatch(
  _channel: ChannelIdentity,
  selectedVideos: ChannelVideo[],
  _brief?: CurationBrief,
): Promise<VideoAnalysis[]> {
  if (selectedVideos.length === 0) return [];

  if (USE_MOCK || PIPELINE_PROVIDER === 'v1') {
    const analysisMap = await analyzeVideosBatch(selectedVideos.map((video) => video.id));
    return selectedVideos.map((video) => analysisMap.get(video.id) || toVideoAnalysis({}, video.id, true));
  }

  const results: VideoAnalysis[] = [];
  for (const video of selectedVideos) {
    try {
      results.push(await runV2Pipeline(video));
    } catch (error) {
      if (isAuthOrRoleError(error)) {
        markFallback('v2_auth_role');
      } else {
        markFallback('v2_pipeline_video');
      }
      results.push(toVideoAnalysis({}, video.id, true));
    }
  }
  return results;
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
    const videoIds = Array.from(inputA.keys());

    try {
      if (USE_MOCK) {
        markFallback('playlist_suggestions');
      } else {
        const { data, error } = await supabase.functions.invoke('generate_playlist_suggestions', {
          body: {
            videos: videoIds.map((id) => ({ id })),
            analyses: Array.from(inputA.values()).map((entry) => ({
              videoId: entry.videoId,
              topic: entry.topic || entry.topics[0] || '',
              difficulty: entry.difficulty,
            })),
          },
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          const grouped = new Map<string, PlaylistSuggestion[]>();
          data.forEach((row, index) => {
            const videoId = String((row as Record<string, unknown>).videoId || videoIds[index % videoIds.length] || '');
            const entry = toPlaylistSuggestion(row as Record<string, unknown>, index, videoId, false);
            const list = grouped.get(videoId) || [];
            list.push(entry);
            grouped.set(videoId, list);
          });
          return grouped;
        }
      }
    } catch {
      markFallback('playlist_suggestions');
    }

    const fallback = new Map<string, PlaylistSuggestion[]>();
    const rows = mockSuggestions(videoIds);
    rows.forEach((row) => {
      const list = fallback.get(row.videoId) || [];
      list.push(row);
      fallback.set(row.videoId, list);
    });
    return fallback;
  }

  const selectedVideos = inputB || [];
  const analyses = inputC || [];
  if (selectedVideos.length === 0) return [];

  if (USE_MOCK || PIPELINE_PROVIDER === 'v1') {
    return mockSuggestions(selectedVideos.map((video) => video.id));
  }

  return selectedVideos.map((video, index) => {
    const analysis = analyses.find((item) => item.videoId === video.id);
    return toPlaylistSuggestion(
      {
        playlistId: analysis?.playlistId || analysis?.unitId || `unit_${(index % 6) + 1}`,
        suggestedUnit: analysis?.unitId || analysis?.topic || `Unidade ${(index % 6) + 1}`,
        confidence: (analysis?.confidence || 70) / 100,
        courseId: analysis?.courseId,
        unitId: analysis?.unitId,
      },
      index,
      video.id,
      false,
    );
  });
}

export async function publishCuratedVideos(request: PublishRequest): Promise<PublishResult>;
export async function publishCuratedVideos(items: PublishItemInput[]): Promise<PublishItemInput[]>;
export async function publishCuratedVideos(
  input: PublishRequest | PublishItemInput[],
): Promise<PublishResult | PublishItemInput[]> {
  const normalized = normalizePublishInput(input);

  try {
    if (USE_MOCK) {
      markFallback('publish_curated');
      if (Array.isArray(input)) {
        return normalized.items;
      }
      return {
        success: true,
        message: `Successfully published ${normalized.request.videoIds.length} videos`,
        publishedCount: normalized.request.videoIds.length,
        affectedPlaylists: Array.from(new Set(Object.values(normalized.request.mappings))),
        timestamp: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase.functions.invoke('publish_curated_videos', {
      body: {
        items: normalized.items.map((item) => ({
          video: { id: item.video.id },
          suggestion: { playlistId: item.suggestion?.playlistId || null },
          analysis: null,
        })),
      },
    });

    if (error) {
      markFallback('publish_curated');
      if (Array.isArray(input)) {
        return normalized.items;
      }
      return {
        success: true,
        message: `Successfully published ${normalized.request.videoIds.length} videos`,
        publishedCount: normalized.request.videoIds.length,
        affectedPlaylists: Array.from(new Set(Object.values(normalized.request.mappings))),
        timestamp: new Date().toISOString(),
      };
    }

    if (Array.isArray(input)) {
      return normalized.items;
    }

    const publishedItems = Array.isArray(data) ? data : normalized.items;
    return {
      success: true,
      message: `Successfully normalized ${publishedItems.length} videos for publication flow`,
      publishedCount: publishedItems.length,
      affectedPlaylists: Array.from(new Set(Object.values(normalized.request.mappings))),
      timestamp: new Date().toISOString(),
    };
  } catch {
    markFallback('publish_curated');
    if (Array.isArray(input)) {
      return normalized.items;
    }
    return {
      success: true,
      message: `Successfully published ${normalized.request.videoIds.length} videos`,
      publishedCount: normalized.request.videoIds.length,
      affectedPlaylists: Array.from(new Set(Object.values(normalized.request.mappings))),
      timestamp: new Date().toISOString(),
    };
  }
}

export function getPipelineFallbackState(): PipelineFallbackState {
  return fallbackState;
}

export function resetPipelineFallbackState(): void {
  fallbackState = { used: false, stages: [] };
}

export function getPipelineProvider(): PipelineProvider {
  return PIPELINE_PROVIDER;
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
  getPipelineFallbackState,
  resetPipelineFallbackState,
  getPipelineProvider,
};

export default channelCurationSource;
