import { useQuery } from '@tanstack/react-query';
import { getModule, listModules } from '@/entities/module/module.api';

export function useModules(page: number, search: string) {
  return useQuery({
    queryKey: ['facodi','modules','list',page,search],
    queryFn: ({ signal }) => listModules(page, search, signal),
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
