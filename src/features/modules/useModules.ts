import { useQuery } from '@tanstack/react-query';
import { getModule } from '@/entities/module/module.api';

export function useModule(slug: string) {
  return useQuery({
    queryKey: ['facodi','modules','detail',slug],
    queryFn: ({ signal }) => getModule(slug, signal),
    enabled: !!slug,
    staleTime: 10 * 60_000,
  });
}
