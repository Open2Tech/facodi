import {
  corsHeaders,
  enforceRateLimit,
  ensurePostMethod,
  HttpError,
  json,
  requireEditorOrAdmin,
  toErrorResponse,
} from '../_shared/pipelineSecurity.ts';

const nowIso = () => new Date().toISOString();

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const xmlTag = (xml: string, tag: string): string | undefined => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1]?.trim();
};

const xmlDecode = (value: string): string =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");

const extractChannelIdFromInput = (input: string): string | null => {
  const trimmed = input.trim();
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return trimmed;
  }

  let url: URL | null = null;
  try {
    url = new URL(trimmed.startsWith('http') ? trimmed : `https://www.youtube.com/${trimmed.replace(/^\/+/, '')}`);
  } catch {
    return null;
  }

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'channel' && /^UC[a-zA-Z0-9_-]{22}$/.test(parts[1] || '')) {
    return parts[1];
  }
  return null;
};

const resolveChannelIdFromWeb = async (input: string): Promise<string | null> => {
  const direct = extractChannelIdFromInput(input);
  if (direct) {
    return direct;
  }

  const normalized = input.trim().startsWith('http')
    ? input.trim()
    : `https://www.youtube.com/${input.trim().replace(/^\/+/, '')}`;

  const response = await fetch(normalized, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
  });
  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const match = html.match(/"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/);
  return match?.[1] || null;
};

type RssVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  thumbnailUrl: string;
};

const parseRssEntries = (xml: string): RssVideo[] => {
  const entryMatches = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi));
  const videos: RssVideo[] = [];

  for (const match of entryMatches) {
    const entry = match[1] || '';
    const id = xmlTag(entry, 'yt:videoId') || '';
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      continue;
    }

    const title = xmlDecode(xmlTag(entry, 'title') || `Video ${videos.length + 1}`);
    const description = xmlDecode(xmlTag(entry, 'media:description') || '');
    const publishedAt = xmlTag(entry, 'published') || nowIso();
    const channelTitle = xmlDecode(xmlTag(entry, 'name') || 'YouTube');
    const thumbnailUrl = xmlTag(entry, 'media:thumbnail')
      ? ''
      : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

    videos.push({
      id,
      title,
      description,
      publishedAt,
      channelTitle,
      thumbnailUrl,
    });
  }

  return videos;
};

const fetchChannelVideos = async (channelInput: string, maxVideos: number): Promise<RssVideo[]> => {
  const channelId = await resolveChannelIdFromWeb(channelInput);
  if (!channelId) {
    return [];
  }

  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const rssResponse = await fetch(rssUrl, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/atom+xml,text/xml' },
  });
  if (!rssResponse.ok) {
    return [];
  }

  const rss = await rssResponse.text();
  return parseRssEntries(rss).slice(0, Math.max(1, Math.min(maxVideos, 30)));
};

const buildFallbackVideos = (channelInput: string, maxVideos = 10) => {
  const count = Math.max(1, Math.min(maxVideos, 30));
  return Array.from({ length: count }).map((_, index) => ({
    id: `dQw4w9WgXc${(index % 10).toString()}`,
    title: `Video ${index + 1} do canal ${channelInput}`,
    description: 'Conteudo coletado em modo MVP fallback.',
    publishedAt: nowIso(),
    durationSeconds: 900 + index * 60,
    channelTitle: channelInput,
    thumbnailUrl: '',
    tags: ['facodi', 'educacao-aberta'],
  }));
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    ensurePostMethod(req);
    const auth = await requireEditorOrAdmin(req);
    enforceRateLimit(`list_channel_videos:${auth.userId}`, 20, 60_000);

    const { channelInput, brief } = await req.json();
    const normalized = String(channelInput || '').trim();
    if (!normalized) {
      throw new HttpError(400, 'channel_input_required', 'Channel input is required.');
    }
    if (normalized.length > 200) {
      throw new HttpError(400, 'channel_input_too_long', 'Channel input exceeds max length.');
    }

    const maxVideos = Number(brief?.maxVideos || 10);
    if (!Number.isFinite(maxVideos) || maxVideos <= 0) {
      throw new HttpError(400, 'invalid_max_videos', 'maxVideos must be greater than 0.');
    }

    const liveVideos = await fetchChannelVideos(normalized, maxVideos);
    if (liveVideos.length > 0) {
      return json(liveVideos.map((video) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        publishedAt: video.publishedAt,
        durationSeconds: 0,
        channelTitle: video.channelTitle,
        thumbnailUrl: video.thumbnailUrl,
        tags: ['facodi', 'educacao-aberta'],
      })));
    }

    // Fallback remains available when YouTube blocks scraping or channel cannot be resolved.
    return json(buildFallbackVideos(normalized, maxVideos));
  } catch (error) {
    return toErrorResponse(error);
  }
});
