import type { Recognition } from '@/entities/suggestion/recognition';
import type { ExtractedMetadata, SuggestionType } from '@/entities/suggestion/suggestion.types';

const TIMEOUT_MS = 8000;
const ZENODO_LANGUAGES: Record<string, string> = { eng: 'en', por: 'pt', spa: 'es', fra: 'fr' };
const ZENODO_TYPES: Record<string, SuggestionType> = { video: 'video', publication: 'document', lesson: 'document', presentation: 'document' };

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const words = (value: unknown) => Array.isArray(value) ? value.map(text).filter(Boolean) : [];
const plain = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? '';

/** Defaults inferred from the URL alone, used whenever no public metadata API answers. */
export function baseMetadata(recognition: Recognition): ExtractedMetadata {
  const { provider, youtubeId, githubRepo, arxivId } = recognition;
  return {
    title: githubRepo?.split('/')[1] ?? (arxivId ? `arXiv:${arxivId}` : ''),
    author: githubRepo?.split('/')[0] ?? '',
    license: '',
    thumbnail: youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null,
    objectType: youtubeId ? 'video' : ['arxiv', 'openstax', 'doaj', 'zenodo'].includes(provider) ? 'document' : 'external_resource',
    language: '',
    tags: [],
    description: '',
  };
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = window.setTimeout(abort, TIMEOUT_MS);
  try {
    // Only the pasted URL leaves the browser; no credentials or referrer are sent.
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`metadata_${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

/**
 * Public, CORS-enabled metadata for YouTube (oEmbed), GitHub and Zenodo. Other providers are
 * recognised from the URL only. Returns `null` when the provider has no API or it did not answer.
 */
export async function fetchPublicMetadata(recognition: Recognition, signal?: AbortSignal): Promise<ExtractedMetadata | null> {
  const base = baseMetadata(recognition);
  if (recognition.youtubeId) {
    const data = record(await getJson(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(recognition.canonicalUrl)}`, signal));
    return { ...base, title: text(data.title), author: text(data.author_name) };
  }
  if (recognition.githubRepo) {
    const data = record(await getJson(`https://api.github.com/repos/${recognition.githubRepo}`, signal));
    const owner = record(data.owner);
    const avatar = text(owner.avatar_url);
    const spdx = text(record(data.license).spdx_id);
    return {
      ...base,
      title: text(data.name) || base.title,
      author: text(owner.login) || base.author,
      license: spdx && spdx !== 'NOASSERTION' ? spdx : '',
      thumbnail: avatar.startsWith('https://avatars.githubusercontent.com/') ? avatar : null,
      tags: words(data.topics).slice(0, 8),
      description: text(data.description),
    };
  }
  if (recognition.zenodoId) {
    const meta = record(record(await getJson(`https://zenodo.org/api/records/${recognition.zenodoId}`, signal)).metadata);
    const creator = record(Array.isArray(meta.creators) ? meta.creators[0] : null);
    return {
      ...base,
      title: text(meta.title),
      author: text(creator.name),
      license: text(record(meta.license).id).toUpperCase(),
      objectType: ZENODO_TYPES[text(record(meta.resource_type).type)] ?? 'external_resource',
      language: ZENODO_LANGUAGES[text(meta.language)] ?? '',
      tags: words(meta.keywords).slice(0, 8),
      description: plain(text(meta.description)).slice(0, 600),
    };
  }
  return null;
}
