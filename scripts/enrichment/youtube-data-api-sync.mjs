#!/usr/bin/env node
/**
 * Server-only, opt-in YouTube Data API metadata sync.
 *
 * Read-only preview is the default. Apply requires --apply and service credentials.
 * YouTube API data must be refreshed or removed within 30 days as applicable.
 * NEVER import or cache audiovisual files, video captions, or statistics here.
 *
 * Usage: node scripts/enrichment/youtube-data-api-sync.mjs --limit=50
 *        node scripts/enrichment/youtube-data-api-sync.mjs --apply --limit=50
 */
import { createClient } from '@supabase/supabase-js';
import { prepareYoutubePatch, youtubeDataApiFields } from './youtube-data-api-utils.mjs';

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const limitArg = argv.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 50;
if (!Number.isInteger(limit) || limit < 1 || limit > 940) {
  throw new Error('--limit must be an integer between 1 and 940');
}
const apiKey = process.env.YOUTUBE_API_KEY;
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!apiKey || !url || !serviceKey) {
  throw new Error('Server-only environment requires YOUTUBE_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY. No keys are bundled.');
}

const client = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const now = Date.now();
const db = client.schema('facodi');
const { data, error } = await db.from('youtube_videos')
  .select('id,youtube_video_id,description,duration_seconds,published_at,channel_id,channel_title,language,metadata,updated_at,status')
  .order('youtube_video_id')
  .limit(1000);
if (error) throw new Error('Supabase read failed: ' + error.message);

const pending = (data || []).filter(row => {
  const previous = row.metadata?.youtube_data_api_v3;
  const last = previous?.checked_at ? Date.parse(previous.checked_at) : 0;
  const stale = !Number.isFinite(last) || now - last > 25 * 86400000;
  return stale || !row.duration_seconds || !row.published_at || !row.description;
}).slice(0, limit);

let checked = 0, filled = 0, conflicted = 0, unavailable = 0;
for (let i = 0; i < pending.length; i += 50) {
  const batch = pending.slice(i, i + 50);
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos');
  endpoint.searchParams.set('part', 'snippet,contentDetails,status');
  endpoint.searchParams.set('id', batch.map(v => v.youtube_video_id).join(','));
  endpoint.searchParams.set('key', apiKey);
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) {
    // Never print URL, which contains the API key.
    throw new Error('YouTube API HTTP ' + response.status + '; no further updates attempted');
  }
  const parsed = await response.json();
  const items = new Map((Array.isArray(parsed.items) ? parsed.items : []).map(v => [v.id, v]));
  for (const previous of batch) {
    const video = items.get(previous.youtube_video_id);
    if (!video) {
      unavailable++;
      console.log('unavailable_from_public_api', previous.youtube_video_id);
      // Important: do NOT unpublish videos based on a single API miss.
      continue;
    }
    const fields = youtubeDataApiFields(video, new Date().toISOString());
    const patch = prepareYoutubePatch(previous, fields);
    if (!patch) continue;
    checked++;
    const additions = Object.keys(patch).filter(x => x !== 'metadata');
    console.log(apply ? 'apply' : 'preview', previous.youtube_video_id,
      'new_fields=' + (additions.join(',') || 'verification_only'),
      'license=' + (fields.license || 'unknown'),
      'embeddable=' + String(fields.embeddable));
    if (!apply) continue;
    // Protect against clobbering metadata from an editor working concurrently.
    const update = await db.from('youtube_videos')
      .update(patch)
      .eq('id', previous.id)
      .eq('updated_at', previous.updated_at)
      .select('id');
    if (update.error) throw new Error('Supabase write failed: ' + update.error.message);
    if (!update.data?.length) {
      conflicted++;
      console.log('stale_row_skipped', previous.youtube_video_id);
      continue;
    }
    filled += additions.length;
  }
}
console.log(JSON.stringify({
  mode: apply ? 'applied' : 'preview_only',
  requested: pending.length,
  checked, fields_filled: filled, unavailable, concurrency_skips: conflicted,
  note: 'Refresh public YouTube API metadata at least every 30 days; do not treat embedding permission as actual playable proof.',
}, null, 2));
