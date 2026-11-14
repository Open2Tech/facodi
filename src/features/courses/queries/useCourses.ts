import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courseKeys } from '@/entities/course/course.keys';
import { changePublication, findContentOptions, getCourse, getOverview, getResource, listCourses, listEditorial, saveContent } from '@/entities/course/course.api';
import type { CatalogParams, ContentKind } from '@/entities/course/course.types';
import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';

export function useCourses(params: CatalogParams) {
  return useQuery({ queryKey: courseKeys.catalog(params), queryFn: ({ signal }) => listCourses(params, signal) });
}
export function useCourse(slug: string) {
  return useQuery({ queryKey: courseKeys.detail(slug), queryFn: ({ signal }) => getCourse(slug, signal) });
}
export function useResource(slug: string) {
  return useQuery({ queryKey: courseKeys.resource(slug), queryFn: ({ signal }) => getResource(slug, signal) });
}
export function useEditorial(kind: ContentKind, params: CatalogParams) {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: courseKeys.editor(user?.id ?? '', kind, params),
    queryFn: ({ signal }) => listEditorial(kind, params, signal),
    enabled: !!user && canAccessFacodiRoute(role, 'editor'),
  });
}
export function useContentOptions(kind: ContentKind, search: string, enabled: boolean) {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: courseKeys.options(user?.id ?? '', kind, search),
    queryFn: ({ signal }) => findContentOptions(kind, search, signal),
    enabled: enabled && !!user && canAccessFacodiRoute(role, 'editor'),
  });
}
export function useOverview() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: courseKeys.overview(user?.id ?? ''),
    queryFn: ({ signal }) => getOverview(signal),
    enabled: !!user && role === 'admin',
  });
}
export function useContentMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: courseKeys.all });
  const save = useMutation({ mutationFn: saveContent, onSuccess: invalidate });
  const publish = useMutation({
    mutationFn: ({ kind, id, action }: { kind: ContentKind; id: string; action: 'publish' | 'archive' | 'draft' }) => changePublication(kind, id, action),
    onSuccess: invalidate,
  });
  return { save, publish };
}
