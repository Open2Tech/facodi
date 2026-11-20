import type { LicenseClass, Provider, UnitOption } from '@/entities/suggestion/suggestion.types';
import { safeExternalUrl } from '@/shared/lib/navigation';

export interface Recognition {
  canonicalUrl: string;
  provider: Provider;
  youtubeId: string | null;
  /** `owner/repo` for GitHub repository URLs. */
  githubRepo: string | null;
  zenodoId: string | null;
  arxivId: string | null;
}

const YOUTUBE_HOSTS = ['youtube.com', 'youtu.be', 'music.youtube.com', 'youtube-nocookie.com'];
const PROVIDER_HOSTS: Record<string, Provider> = {
  'youtube.com': 'youtube', 'www.youtube.com': 'youtube', 'github.com': 'github', 'zenodo.org': 'zenodo',
  'openstax.org': 'openstax', 'doaj.org': 'doaj', 'arxiv.org': 'arxiv',
};
const GITHUB_RESERVED = new Set(['orgs', 'topics', 'features', 'marketplace', 'settings', 'sponsors', 'explore', 'collections', 'search', 'login']);
const TRACKING = /([?&])(utm_[a-z_]+|fbclid|gclid|mc_cid|mc_eid|si|ref_src)=[^&]*&?/gi;

/**
 * Mirrors `facodi.normalize_resource_url` so the page can preview what the database will recognise.
 * The database recomputes everything on insert; this is only a preview.
 */
export function canonicalResourceUrl(raw: string): string | null {
  const value = raw.trim();
  if (!safeExternalUrl(value) || !/^https?:\/\/[^/?#\s]+/i.test(value)) return null;
  const match = /^[a-z]+:\/\/([^/?#]+)(.*)$/i.exec(value.replace(/#.*$/, ''));
  if (!match) return null;
  const host = match[1].toLowerCase().replace(/^(www|m)\./, '').replace(/:443$/, '');
  if (!host || !/^[^.]+(?:\.[^.]+)+$/.test(host)) return null;
  const rest = match[2];
  if (YOUTUBE_HOSTS.includes(host)) {
    const video = /[?&]v=([A-Za-z0-9_-]{11})/.exec(rest)?.[1]
      ?? /^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/.exec(rest)?.[1]
      ?? (host === 'youtu.be' ? /^\/([A-Za-z0-9_-]{11})/.exec(rest)?.[1] : undefined);
    if (video) return `https://www.youtube.com/watch?v=${video}`;
  }
  let path = /^[^?]*/.exec(rest)![0].replace(/\/+$/, '');
  let query = /\?.*$/.exec(rest)?.[0] ?? '';
  if (host === 'github.com') path = path.replace(/\.git$/, '').toLowerCase();
  query = query.replace(TRACKING, '$1').replace(/[?&]+$/, '');
  return `https://${host}${path}${query}`;
}

export function recognizeUrl(raw: string): Recognition | null {
  const canonicalUrl = canonicalResourceUrl(raw);
  if (!canonicalUrl) return null;
  const { hostname, pathname } = new URL(canonicalUrl);
  const youtubeId = /^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})$/.exec(canonicalUrl)?.[1] ?? null;
  const provider: Provider = youtubeId ? 'youtube' : PROVIDER_HOSTS[hostname] ?? 'web';
  const repo = provider === 'github' ? /^\/([\w.-]+)\/([\w.-]+)/.exec(pathname) : null;
  return {
    canonicalUrl,
    provider,
    youtubeId,
    githubRepo: repo && !GITHUB_RESERVED.has(repo[1]) ? `${repo[1]}/${repo[2]}` : null,
    zenodoId: provider === 'zenodo' ? /^\/records?\/(\d+)/.exec(pathname)?.[1] ?? null : null,
    arxivId: provider === 'arxiv' ? /^\/(?:abs|pdf)\/([\w./-]+?)(?:\.pdf)?$/.exec(pathname)?.[1] ?? null : null,
  };
}

/** Mirrors `facodi.classify_resource_license`. */
export function classifyLicense(license: string | null | undefined): LicenseClass {
  const value = license?.trim() ?? '';
  if (!value) return 'unknown';
  if (/(\b(nc|nd)\b|non-?commercial|no-?deriv|all rights reserved)/i.test(value)) return 'restricted';
  if (/(cc[ -]?(by|0)|creative commons|public domain|domínio público|\b(mit|apache|gpl|lgpl|agpl|bsd|mpl|unlicense|ofl)\b)/i.test(value)) return 'open';
  return 'unknown';
}

const STOPWORDS = new Set([
  // pt / es / fr / en function words that would otherwise match every unit title
  'para', 'com', 'dos', 'das', 'uma', 'como', 'por', 'sobre', 'entre', 'que', 'seu', 'sua', 'nos', 'nas', 'aos',
  'del', 'los', 'las', 'con', 'una', 'des', 'les', 'pour', 'avec', 'dans', 'une', 'sur',
  'the', 'and', 'for', 'with', 'from', 'into', 'your', 'how', 'what', 'about', 'introduction', 'introducao',
  'intro', 'aula', 'curso', 'course', 'lesson', 'live', 'parte', 'part', 'video',
]);

/** Accent- and case-insensitive word stems; prefixes absorb plurals and verb forms (programação ~ programar). */
export function keywordStems(text: string): Set<string> {
  const words = text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().split(/[^a-z0-9]+/);
  return new Set(words.filter(word => word.length >= 3 && !STOPWORDS.has(word)).map(word => word.slice(0, 6)));
}

export interface UnitMatch { unit: UnitOption; score: number }

/**
 * Deterministic curricular-unit suggestions: cosine overlap between the resource's words and each
 * unit title, as a whole percentage. Nothing is inferred beyond shared words.
 */
export function rankUnits(text: string, units: UnitOption[], limit = 3): UnitMatch[] {
  const resource = keywordStems(text);
  if (!resource.size) return [];
  const matches: UnitMatch[] = [];
  for (const unit of units) {
    const stems = keywordStems(unit.title);
    if (!stems.size) continue;
    let overlap = 0;
    for (const stem of stems) if (resource.has(stem)) overlap += 1;
    if (overlap) matches.push({ unit, score: Math.round((100 * overlap) / Math.sqrt(resource.size * stems.size)) });
  }
  return matches
    .sort((a, b) => b.score - a.score || a.unit.title.localeCompare(b.unit.title) || a.unit.id.localeCompare(b.unit.id))
    .slice(0, limit);
}

/** Comma-separated tags, as the database stores them: lowercase, unique, at most 8 of up to 30 characters. */
export function parseSuggestionTags(value: string): string[] {
  const tags = value.split(',').map(tag => tag.trim().replace(/^#+/, '').replace(/\s+/g, ' ').toLowerCase().slice(0, 30)).filter(Boolean);
  return [...new Set(tags)].slice(0, 8);
}
