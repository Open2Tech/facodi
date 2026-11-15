import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courseKeys } from '@/entities/course/course.keys';
import { getResourceContext, listChannelVideos, listFeaturedVideos, listContainedVideos, changePublication, findContentOptions, getCatalogCounts, getCourse, getObjectTypeFacets, getOverview, getUnit, getUnitFacets, getResource, listCourses, listEditorial, listResources, listTopics, listUnits, saveContent } from '@/entities/course/course.api';
import type { CatalogParams, ContentKind } from '@/entities/course/course.types';
import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';

export function useCourses(params: CatalogParams) {
  return useQuery({ queryKey: courseKeys.catalog(params), queryFn: ({ signal }) => listCourses(params, signal), placeholderData: keepPreviousData });
}
export function useUnits(params: CatalogParams) {
  return useQuery({ queryKey: courseKeys.units(params), queryFn: ({ signal }) => listUnits(params, signal), placeholderData: keepPreviousData });
}
export function useUnitFacets() {
  return useQuery({ queryKey: courseKeys.unitFacets(), queryFn: ({ signal }) => getUnitFacets(signal), staleTime: 5 * 60_000 });
}
export function useUnit(courseSlug: string, unitSlug: string) {
  return useQuery({ queryKey: courseKeys.unit(courseSlug, unitSlug), queryFn: ({ signal }) => getUnit(courseSlug, unitSlug, signal) });
}
export function useResources(params: CatalogParams) {
  return useQuery({ queryKey: courseKeys.resources(params), queryFn: ({ signal }) => listResources(params, signal), placeholderData: keepPreviousData });
}
export function useResourceContext(resource: { id: string; object_type: string } | null | undefined) {
  return useQuery({
    queryKey: courseKeys.resourceContext(resource?.id ?? ''),
    queryFn: ({ signal }) => getResourceContext(resource!, signal),
    enabled: !!resource,
  });
}
export function useUnitVideos(learningObjectId: string | null | undefined) {
  return useQuery({
    queryKey: courseKeys.unitVideos(learningObjectId ?? ''),
    queryFn: ({ signal }) => listContainedVideos(learningObjectId!, signal),
    enabled: !!learningObjectId,
  });
}
export function useChannelVideos(channel: string | null, excludeId: string) {
  return useQuery({
    queryKey: courseKeys.channelVideos(channel ?? '', excludeId),
    queryFn: ({ signal }) => listChannelVideos(channel!, excludeId, signal),
    enabled: !!channel && !!excludeId,
  });
}
export function useFeaturedVideos(limit = 8, parentObjectIds: string[] = [], enabled = true) {
  return useQuery({
    queryKey: courseKeys.featuredVideos(limit, parentObjectIds),
    queryFn: ({ signal }) => listFeaturedVideos(limit, parentObjectIds, signal),
    enabled,
    staleTime: 10 * 60_000,
  });
}
export function useCatalogCounts() {
  return useQuery({ queryKey: courseKeys.counts(), queryFn: ({ signal }) => getCatalogCounts(signal) });
}
export function useTopics() {
  return useQuery({ queryKey: courseKeys.topics(), queryFn: ({ signal }) => listTopics(6, signal) });
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
    // Only bridge refetches within the same kind and account; actions on a row must never target another table.
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[2] === (user?.id ?? '') && previousQuery.queryKey[3] === kind ? previous : undefined,
    enabled: !!user && canAccessFacodiRoute(role, 'editor'),
  });
}
export function useObjectTypeFacets(enabled: boolean) {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: courseKeys.objectTypes(user?.id ?? ''),
    queryFn: ({ signal }) => getObjectTypeFacets(signal),
    enabled: enabled && !!user && canAccessFacodiRoute(role, 'editor'),
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
