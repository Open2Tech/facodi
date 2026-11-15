import { useQuery } from '@tanstack/react-query';
import { getModule, listModules } from '@/entities/module/module.api';

export function useModules(page: number, search: string, enabled = true, language = '', tag = '') {
  return useQuery({
    queryKey: ['facodi','modules','list',page,search,language,tag],
    queryFn: ({ signal }) => listModules(page, search, signal, language, tag),
    enabled,
    staleTime: 10 * 60_000,
  });
}

export function useModule(slug: string) {
  return useQuery({
    queryKey: ['facodi','modules','detail',slug],
    queryFn: ({ signal }) => getModule(slug, signal),
    enabled: !!slug,
    staleTime: 10 * 60_000,
  });
}
