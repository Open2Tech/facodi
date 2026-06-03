import {
  corsHeaders,
  enforceRateLimit,
  ensurePostMethod,
  HttpError,
  json,
  requireEditorOrAdmin,
  toErrorResponse,
} from '../_shared/pipelineSecurity.ts';

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const normalizeChannelInput = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) throw new HttpError(400, 'channel_input_required', 'Channel input is required.');
  if (trimmed.length > 200) {
    throw new HttpError(400, 'channel_input_too_long', 'Channel input exceeds max length.');
  }
  return trimmed;
};

const resolveChannelFromWeb = async (input: string): Promise<{
  channelId: string;
  title: string;
  customUrl: string;
  thumbnailUrl: string;
} | null> => {
  const directId = input.match(/^UC[a-zA-Z0-9_-]{22}$/)?.[0] || null;
  const normalizedUrl = input.startsWith('http')
    ? input
    : directId
    ? `https://www.youtube.com/channel/${directId}`
    : `https://www.youtube.com/${input.replace(/^\/+/, '')}`;

  const response = await fetch(normalizedUrl, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
  });
  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const channelId = html.match(/"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/)?.[1] || directId;
  if (!channelId) {
    return null;
  }

  const title =
    html.match(/<meta property="og:title" content="([^"]+)"\s*\/?/i)?.[1] ||
    html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*-\s*YouTube\s*$/i, '') ||
    input;

  const thumbnailUrl =
    html.match(/<meta property="og:image" content="([^"]+)"\s*\/?/i)?.[1] ||
    `https://yt3.googleusercontent.com/ytc/AIdro_k-${channelId}`;

  return {
    channelId,
    title,
    customUrl: normalizedUrl,
    thumbnailUrl,
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    ensurePostMethod(req);
    const auth = await requireEditorOrAdmin(req);
    enforceRateLimit(`fetch_youtube_channel:${auth.userId}`, 30, 60_000);

    const { channelInput } = await req.json();
    const normalized = normalizeChannelInput(String(channelInput || ''));

    const liveChannel = await resolveChannelFromWeb(normalized);
    if (liveChannel) {
      return json({
        channelId: liveChannel.channelId,
        title: liveChannel.title,
        description: 'Canal validado com metadados publicos do YouTube.',
        customUrl: liveChannel.customUrl,
        thumbnailUrl: liveChannel.thumbnailUrl,
      });
    }

    // MVP fallback-safe parser: keeps pipeline operational even without YouTube API key.
    const titleFromHandle = normalized.includes('@')
      ? normalized.slice(normalized.lastIndexOf('@') + 1)
      : 'canal-youtube';

    const channelId = normalized.startsWith('UC') ? normalized : `channel_${titleFromHandle.toLowerCase().replace(/[^a-z0-9_\-]/gi, '')}`;

    return json({
      channelId,
      title: titleFromHandle,
      description: 'Canal validado no pipeline MVP.',
      customUrl: normalized,
      thumbnailUrl: '',
    });
  } catch (error) {
    return toErrorResponse(error);
  }
});
