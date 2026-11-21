#!/usr/bin/env node
/**
 * Incrementally expand already-published external YouTube playlists in FACODI.
 *
 * Dry-run by default. --apply links existing published videos.
 * --apply --import-new additionally registers PUBLIC, embeddable, creator-owned
 * videos found through the official YouTube API; no audiovisual content is copied.
 *
 * Server-only: YOUTUBE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Examples:
 *   node scripts/enrichment/youtube-playlist-items-sync.mjs --limit=3
 *   node scripts/enrichment/youtube-playlist-items-sync.mjs --playlist-id=PL... --apply
 *   node scripts/enrichment/youtube-playlist-items-sync.mjs --limit=3 --apply --import-new
 *
 * Refresh API-derived data within 30 days under YouTube API policies.
 */
import { createClient } from '@supabase/supabase-js';
import { parseYoutubeDuration } from './youtube-data-api-utils.mjs';
import { playlistIdFromUrl, parsePlaylistItemsPage, verifiedPublicVideo, orderedUniqueMembers } from './youtube-playlist-items-utils.mjs';

const argv = process.argv.slice(2);
const args = Object.fromEntries(argv.filter(v => v.startsWith('--') && v.includes('='))
  .map(v => { const at = v.indexOf('='); return [v.slice(2, at), v.slice(at + 1)]; }));
const flag = name => argv.includes('--' + name);
const apply = flag('apply');
const importNew = flag('import-new');
const limit = Number(args.limit ?? '3');
const maxPages = Number(args['max-pages'] ?? '3');
const allowed = new Set(['--apply', '--import-new']);
if (argv.some(v => !(allowed.has(v) || /^--(limit|max-pages|playlist-id)=/.test(v)))
  || !Number.isInteger(limit) || limit < 1 || limit > 30
  || !Number.isInteger(maxPages) || maxPages < 1 || maxPages > 10
  || (importNew && !apply)) {
  throw new Error('Usage: [--limit=1..30] [--max-pages=1..10] [--playlist-id=ID] [--apply [--import-new]]');
}
const apiKey = process.env.YOUTUBE_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!apiKey || !supabaseUrl || !serviceKey) {
  throw new Error('Set YOUTUBE_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in a private server environment');
}
const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
}).schema('facodi');

function requireData(result, operation) {
  if (result.error) throw new Error(operation + ': ' + result.error.message);
  return result.data ?? [];
}
async function youtubeGet(path, params) {
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/' + path);
  for (const [key, value] of Object.entries(params)) endpoint.searchParams.set(key, String(value));
  endpoint.searchParams.set('key', apiKey);
  // Never print the endpoint: the query string contains the API key.
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error('YouTube ' + path + ' HTTP ' + response.status);
  return response.json();
}

async function loadPlaylists() {
  const all = [];
  for (let start = 0; ; start += 500) {
    const data = requireData(await db.from('learning_objects')
      .select('id,slug,title,source_url,metadata,published,status')
      .eq('object_type', 'playlist').eq('published', true).eq('status', 'active')
      .like('source_url', '%youtube.com/playlist%')
      .order('id').range(start, start + 499), 'load playlists');
    all.push(...data);
    if (data.length < 500) break;
  }
  const eligible = all.flatMap(row => {
    const id = playlistIdFromUrl(row.source_url);
    if (!id || (row.metadata?.youtube_playlist_id && row.metadata.youtube_playlist_id !== id)) return [];
    return [{ ...row, youtubeId: id }];
  });
  if (args['playlist-id']) {
    const picked = eligible.filter(p => p.youtubeId === args['playlist-id']);
    if (picked.length !== 1) throw new Error('Playlist ID not found in the published FACODI catalogue');
    return picked;
  }
  // Prefer original playlists from channels already curated; small sets make
  // first imports quick and complete, rather than truncating very large lists.
  const preferred = new Set(['CrashCourse', 'UNIVESP', 'British Council | TeachingEnglish',
    'Me Salva! ENEM', 'MIT OpenCourseWare', 'Canal USP']);
  return eligible.sort((a, b) => {
    const pa = preferred.has(a.metadata?.source_channel) ? 0 : 1;
    const pb = preferred.has(b.metadata?.source_channel) ? 0 : 1;
    const va = Number(a.metadata?.video_count_at_verification ?? 1000);
    const vb = Number(b.metadata?.video_count_at_verification ?? 1000);
    return pa - pb || va - vb || a.title.localeCompare(b.title);
  }).slice(0, limit);
}

async function readPlaylist(playlistId) {
  const items = [];
  let token = null;
  let complete = false;
  for (let page = 0; page < maxPages; page++) {
    const response = await youtubeGet('playlistItems', {
      part: 'snippet,contentDetails,status', playlistId, maxResults: 50,
      ...(token ? { pageToken: token } : {}),
    });
    const parsed = parsePlaylistItemsPage(response, playlistId);
    items.push(...parsed.items);
    token = parsed.nextPageToken;
    if (!token) { complete = true; break; }
  }
  return { items, complete };
}
async function readAvailableVideos(ids) {
  const videos = [];
  for (let start = 0; start < ids.length; start += 50) {
    const response = await youtubeGet('videos', {
      part: 'snippet,status,contentDetails', id: ids.slice(start, start + 50).join(','),
    });
    for (const row of response.items ?? []) {
      const video = verifiedPublicVideo(row);
      if (video) videos.push(video);
    }
  }
  return videos;
}

async function knownVideoObjects(ids) {
  const rows = [];
  for (let start = 0; start < ids.length; start += 50) {
    rows.push(...requireData(await db.from('youtube_videos')
      .select('youtube_video_id,learning_object_id,status')
      .in('youtube_video_id', ids.slice(start, start + 50)), 'catalogue video lookup'));
  }
  const objectIds = [...new Set(rows.map(v => v.learning_object_id).filter(Boolean))];
  const published = new Set();
  for (let start = 0; start < objectIds.length; start += 50) {
    const objects = requireData(await db.from('learning_objects')
      .select('id,object_type,published,status')
      .in('id', objectIds.slice(start, start + 50)), 'published video lookup');
    for (const v of objects) {
      if (v.object_type === 'video' && v.published && v.status === 'active') published.add(v.id);
    }
  }
  return new Map(rows.flatMap(v => v.learning_object_id && v.status === 'published'
    && published.has(v.learning_object_id)
    ? [[v.youtube_video_id, v.learning_object_id]] : []));
}

async function createPublishedVideo(video, playlistId, position, checkedAt) {
  const url = 'https://www.youtube.com/watch?v=' + video.youtubeId;
  const slug = 'facodi-youtube-playlist-video-' + video.youtubeId;
  let created = await db.from('learning_objects').insert({
    object_type: 'video', title: video.title, slug,
    description: 'Vídeo do canal ' + (video.channelTitle || 'YouTube')
      + ', associado a uma playlist pública. Consulte a fonte original para o conteúdo.',
    language: video.language, status: 'active', published: true,
    source_type: 'youtube', source_id: video.youtubeId, source_url: url,
    metadata: {
      youtube_video_id: video.youtubeId, channel_name: video.channelTitle,
      youtube_channel_id: video.channelId, review_scope: 'title_and_channel_only',
      full_video_reviewed: false, playback_verified: false,
      license_verified: false, rehosting_rights: 'not_assumed',
      origin: 'youtube_data_api_v3_playlist_items',
      source_checked_at: checkedAt, not_official_course_material: true,
    },
  }).select('id').single();
  if (created.error?.code === '23505') {
    const existing = requireData(await db.from('learning_objects')
      .select('id,object_type,published,status')
      .eq('source_type', 'youtube').eq('source_id', video.youtubeId)
      .limit(1), 'resolve duplicate video source')[0];
    if (!existing || existing.object_type !== 'video' || !existing.published || existing.status !== 'active')
      throw new Error('Conflicting/unpublished video source; manual reconciliation required: ' + video.youtubeId);
    created = { data: existing, error: null };
  }
  if (created.error) throw new Error('new video learning object: ' + created.error.message);
  const id = created.data.id;
  const inserted = await db.from('youtube_videos').upsert({
    learning_object_id: id, youtube_video_id: video.youtubeId, canonical_url: url,
    title: video.title, channel_id: video.channelId, channel_title: video.channelTitle,
    duration_seconds: parseYoutubeDuration(video.duration), published_at: video.publishedAt,
    language: video.language, thumbnails: video.thumbnails,
    status: 'published', metadata: {
      source_playlist_id: playlistId, source_playlist_position: String(position),
      source_membership_checked_at: checkedAt,
      source: 'youtube_data_api_v3_playlist_items', content_license_verified: false,
      rights_to_rehost: 'not_assumed', audiovisual_content_copied: false,
    },
  }, { onConflict: 'youtube_video_id', ignoreDuplicates: true }).select('learning_object_id');
  if (inserted.error) throw new Error('new YouTube video row: ' + inserted.error.message);
  // On a concurrent insert, never point at an unrelated/orphan object.
  if (!inserted.data?.length) {
    const existing = requireData(await db.from('youtube_videos')
      .select('learning_object_id').eq('youtube_video_id', video.youtubeId).limit(1),
    'concurrent video insert')[0];
    if (existing?.learning_object_id !== id)
      throw new Error('Concurrent video collision; manual reconciliation required: ' + video.youtubeId);
  }
  return id;
}

async function linkMember(playlist, member, videoObjectId, checkedAt) {
  const metadata = {
    review_status: 'approved', review_scope: 'title_and_channel_only',
    source: 'youtube_data_api_v3_playlistItems.list',
    youtube_playlist_id: playlist.youtubeId, source_playlist_position: member.position,
    playlist_membership_checked_at: checkedAt,
    playlist_membership_verified_by: 'official_youtube_api',
    not_official_course_material: true, full_video_reviewed: false,
    rights_to_rehost: 'not_assumed',
  };
  const result = await db.from('learning_object_relations').upsert({
    parent_object_id: playlist.id, child_object_id: videoObjectId,
    relation_type: 'contains', position: member.position,
    confidence_score: 0.99, created_by_mechanism: 'youtube_data_api_playlist_items_sync',
    metadata,
  }, { onConflict: 'parent_object_id,child_object_id,relation_type', ignoreDuplicates: true })
    .select('id');
  if (result.error) throw new Error('add playlist member: ' + result.error.message);
  return (result.data ?? []).length > 0;
}

const checkedAt = new Date().toISOString();
const totals = { mode: apply ? (importNew ? 'apply_and_import' : 'apply_existing') : 'preview',
  playlist_count: 0, member_candidates: 0, published_members: 0, reusable_videos: 0,
  new_video_candidates: 0, videos_registered: 0, relations_added: 0, partial_lists: 0, errors: [] };
const playlists = await loadPlaylists();
for (const playlist of playlists) {
  try {
    const { items, complete } = await readPlaylist(playlist.youtubeId);
    if (!complete) totals.partial_lists++;
    const available = await readAvailableVideos([...new Set(items.map(i => i.youtubeId))]);
    const members = orderedUniqueMembers(items, available);
    const known = await knownVideoObjects(members.map(m => m.youtubeId));
    const toCreate = members.filter(m => !known.has(m.youtubeId)
      && m.playlistChannelId && m.playlistChannelId === m.video.channelId);
    const reusable = members.filter(m => known.has(m.youtubeId));
    totals.playlist_count++;
    totals.member_candidates += items.length;
    totals.published_members += members.length;
    totals.reusable_videos += reusable.length;
    totals.new_video_candidates += toCreate.length;
    console.log(JSON.stringify({ playlist: playlist.youtubeId, title: playlist.title,
      complete, discovered: items.length, public_embeddable: members.length,
      reusable: reusable.length, new_creator_owned: toCreate.length }));
    if (!apply) continue;
    const toImport = importNew ? toCreate : [];
    for (const member of [...reusable, ...toImport]) {
      const objectId = known.get(member.youtubeId) ?? await createPublishedVideo(
        member.video, playlist.youtubeId, member.position, checkedAt);
      if (!known.has(member.youtubeId)) totals.videos_registered++;
      if (await linkMember(playlist, member, objectId, checkedAt)) totals.relations_added++;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    totals.errors.push({ playlist: playlist.youtubeId, message });
    console.error('playlist_failed', playlist.youtubeId, message);
  }
}
console.log(JSON.stringify(totals, null, 2));
if (totals.errors.length) process.exitCode = 1;
