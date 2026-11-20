import { useQuery } from '@tanstack/react-query';
import { getCourseLearningAssets, type CourseUnitAssetParent } from '@/entities/course/courseLearningAssets.api';

/** Course materials are drawn from published course/UC composition under RLS. */
export function useCourseLearningAssets(courseObjectId: string | null | undefined, units: readonly CourseUnitAssetParent[]) {
  const parentIds = units.map(unit => unit.learningObjectId ?? '');
  return useQuery({
    queryKey: ['facodi', 'course-learning-assets', courseObjectId ?? '', ...parentIds],
    queryFn: ({ signal }) => getCourseLearningAssets(courseObjectId ?? null, units, signal),
    enabled: Boolean(courseObjectId || parentIds.some(Boolean)),
    staleTime: 10 * 60_000,
  });
}
