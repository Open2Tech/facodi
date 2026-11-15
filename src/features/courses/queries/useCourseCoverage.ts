import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Server-side grouped counts are SECURITY INVOKER and respect the same RLS as resource pages. */
export function useCourseCoverage(courseId: string | undefined) {
  return useQuery({
    queryKey: ['facodi', 'course-unit-coverage', courseId ?? ''],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.from('course_unit_content_coverage')
        .select('curricular_unit_id, video_count, reading_count, coverage_status')
        .eq('course_id', courseId!)
        .order('curricular_unit_id')
        .abortSignal(signal);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!courseId,
    staleTime: 5 * 60_000,
  });
}
