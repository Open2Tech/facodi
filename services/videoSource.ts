import { PublicPlaylist, VideoCategory, VideoItem } from '../types';
import { supabase } from './supabase';
import type { Database } from './supabase.types';

type PublicVideoRow = Database['facodi']['Views']['v_public_videos']['Row'];
type PlaylistVideoRow = Database['facodi']['Views']['v_playlist_videos']['Row'];
type CatalogPlaylistRow = Database['facodi']['Views']['v_catalog_playlists']['Row'];

export type VideoQueryParams = {
  search?: string;
  categoryId?: string;
  playlistId?: string;
  language?: string;
  durationRange?: 'short' | 'medium' | 'long';
  courseId?: string;
  unitId?: string;
  limit?: number;
  offset?: number;
};

function mapVideoRow(row: PublicVideoRow | PlaylistVideoRow): VideoItem {
  if (!row.id || !row.youtube_id || !row.title) {
    throw new Error('[videoSource:facodi] Invalid video row.');
  }

  const playlistRow = row as PlaylistVideoRow;

  return {
    id: row.id,
    youtubeId: row.youtube_id,
    title: row.title,
    description: row.description || '',
    channelName: row.channel_name || 'FACODI',
    durationSeconds: row.duration_seconds ?? undefined,
    thumbnailUrl: row.thumbnail_url || `https://i.ytimg.com/vi/${row.youtube_id}/hqdefault.jpg`,
    language: row.language || 'pt',
    courseId: row.course_id ?? undefined,
    unitId: row.unit_id ?? undefined,
    classificationStatus: row.classification_status ?? undefined,
    confidence: row.confidence ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    playlistId: playlistRow.playlist_id ?? undefined,
    playlistName: playlistRow.playlist_title ?? undefined,
    playlistSlug: playlistRow.playlist_slug ?? undefined,
    position: playlistRow.position ?? undefined,
  };
}

function mapPlaylistRow(row: CatalogPlaylistRow): PublicPlaylist {
  if (!row.id || !row.title || !row.slug) {
    throw new Error('[videoSource:facodi] Invalid playlist row.');
  }

  return {
    id: row.id,
    name: row.title,
    slug: row.slug,
    description: row.description || '',
    courseCode: row.course_code ?? undefined,
    unitCode: row.unit_code ?? undefined,
    videoCount: row.video_count || 0,
    totalDurationSeconds: row.total_duration_seconds ?? undefined,
  };
}

export async function listPublicCategories(): Promise<VideoCategory[]> {
  return [];
}

export async function listPublicPlaylists(): Promise<PublicPlaylist[]> {
  const { data, error } = await supabase
    .schema('facodi')
    .from('v_catalog_playlists')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    throw new Error(`[videoSource:facodi] playlists: ${error.message}`);
  }

  return (data || []).map(mapPlaylistRow);
}

export async function listPlaylistVideos(playlistId: string): Promise<VideoItem[]> {
  const { data, error } = await supabase
    .schema('facodi')
    .from('v_playlist_videos')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`[videoSource:facodi] playlist_videos: ${error.message}`);
  }

  return (data || []).map(mapVideoRow);
}

function matchesQueryParams(video: VideoItem, params: VideoQueryParams): boolean {
  if (params.search) {
    const value = params.search.replace(/[,;%]/g, ' ').trim().toLowerCase();
    const haystack = `${video.title} ${video.description} ${video.channelName} ${video.youtubeId}`.toLowerCase();
    if (value && !haystack.includes(value)) {
      return false;
    }
  }

  if (params.language && video.language !== params.language) {
    return false;
  }

  if (params.courseId && video.courseId !== params.courseId) {
    return false;
  }

  if (params.unitId && video.unitId !== params.unitId) {
    return false;
  }

  if (params.durationRange) {
    const duration = video.durationSeconds || 0;
    if (params.durationRange === 'short' && duration > 900) return false;
    if (params.durationRange === 'medium' && (duration <= 900 || duration > 2400)) return false;
    if (params.durationRange === 'long' && duration <= 2400) return false;
  }

  return true;
}

export async function listPublicVideos(params: VideoQueryParams = {}): Promise<VideoItem[]> {
  if (params.playlistId) {
    const playlistVideos = await listPlaylistVideos(params.playlistId);
    return playlistVideos.filter((video) => matchesQueryParams(video, params));
  }

  const limit = params.limit ?? 24;
  const offset = params.offset ?? 0;

  let query = supabase
    .schema('facodi')
    .from('v_public_videos')
    .select('*')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.search) {
    const value = params.search.replace(/[,;%]/g, ' ').trim();
    if (value) {
      query = query.or(`title.ilike.%${value}%,description.ilike.%${value}%,channel_name.ilike.%${value}%,youtube_id.ilike.%${value}%`);
    }
  }

  if (params.language) {
    query = query.eq('language', params.language);
  }

  if (params.courseId) {
    query = query.eq('course_id', params.courseId);
  }

  if (params.unitId) {
    query = query.eq('unit_id', params.unitId);
  }

  if (params.durationRange === 'short') {
    query = query.lte('duration_seconds', 900);
  }

  if (params.durationRange === 'medium') {
    query = query.gt('duration_seconds', 900).lte('duration_seconds', 2400);
  }

  if (params.durationRange === 'long') {
    query = query.gt('duration_seconds', 2400);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[videoSource:facodi] videos: ${error.message}`);
  }

  return (data || []).map(mapVideoRow);
}

export async function getPublicVideoById(videoId: string): Promise<VideoItem | null> {
  const { data, error } = await supabase
    .schema('facodi')
    .from('v_public_videos')
    .select('*')
    .eq('id', videoId)
    .maybeSingle();

  if (error) {
    throw new Error(`[videoSource:facodi] video detail: ${error.message}`);
  }

  if (!data) return null;

  const video = mapVideoRow(data);

  const { data: playlistData, error: playlistError } = await supabase
    .schema('facodi')
    .from('v_playlist_videos')
    .select('playlist_id, playlist_title, playlist_slug, position')
    .eq('id', videoId)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!playlistError && playlistData?.playlist_id) {
    video.playlistId = playlistData.playlist_id;
    video.playlistName = playlistData.playlist_title ?? undefined;
    video.playlistSlug = playlistData.playlist_slug ?? undefined;
    video.position = playlistData.position ?? undefined;
  }

  return video;
}

export async function listRelatedVideos(currentVideo: VideoItem, limit = 4): Promise<VideoItem[]> {
  const { data, error } = await supabase
    .schema('facodi')
    .from('v_public_videos')
    .select('*')
    .neq('id', currentVideo.id)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`[videoSource:facodi] related videos: ${error.message}`);
  }

  return (data || []).map(mapVideoRow);
}
