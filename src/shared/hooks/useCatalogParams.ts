import { useSearchParams } from 'react-router-dom';

/** URL-backed catalogue state (`search`, `language`, `tag`, `page`) shared by the public listings. */
export function useCatalogParams() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Math.min(100000, Math.floor(Number(params.get('page')) || 1)));
  const search = params.get('search') ?? '';
  const language = params.get('language') ?? '';
  const tag = params.get('tag') ?? '';
  function filter(key: 'search' | 'language' | 'page' | 'tag', value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  }
  return { page, search, language, tag, filter, filtered: Boolean(search || language || tag || page > 1) };
}
