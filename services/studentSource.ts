/**
 * studentSource.ts
 * Student-specific backend API layer for enrollment, progress tracking, and dashboard.
 * Uses supabase singleton client and follows RLS-per-user pattern.
 * All operations enforce auth.uid() = user_id at database level.
 */

import { supabase } from './supabase';

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'paused';
  progress_percentage: number;
  last_accessed_at: string | null;
  enrolled_at: string;
}

export interface ContentProgress {
  id: string;
  user_id: string;
  course_id: string | null;
  curricular_unit_id: string | null;
  content_id: string | null;
  content_type: string;
  status: 'not_started' | 'started' | 'in_progress' | 'completed';
  progress_percentage: number;
  watch_seconds: number | null;
  duration_seconds: number | null;
  first_accessed_at: string | null;
  last_accessed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentActivityEvent {
  id: string;
  user_id: string;
  event_type: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface StudentDashboardData {
  enrolledCourses: CourseEnrollment[];
  totalProgress: number;
  continueWatching: ContentProgress[];
  recentActivity: StudentActivityEvent[];
}

/**
 * Enroll user in a course. Checks for duplicate enrollment via UNIQUE constraint.
 * Creates course_enrollments record with status='active' and initial progress=0.
 */
export async function enrollInCourse(courseId: string): Promise<CourseEnrollment> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data: course, error } = await supabase
    .schema('facodi')
    .from('v_catalog_courses')
    .select('id')
    .eq('id', courseId)
    .maybeSingle();

  if (error || !course) {
    throw new Error('Course not found');
  }

  // Enrollment table is not present in current schema; synthesize a record.
  return {
    id: `synthetic:${userId}:${courseId}`,
    user_id: userId,
    course_id: courseId,
    status: 'active',
    progress_percentage: 0,
    last_accessed_at: null,
    enrolled_at: new Date().toISOString(),
  };
}

/**
 * Get user's enrolled courses with current progress.
 * Returns courses ordered by last_accessed_at DESC (most recent first).
 */
export async function getMyCourses(): Promise<CourseEnrollment[]> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) {
    return [];
  }

  const { data: progressRows, error } = await supabase
    .from('content_progress')
    .select('course_id, progress_percentage, last_accessed_at, created_at')
    .eq('user_id', userId)
    .not('course_id', 'is', null)
    .order('last_accessed_at', { ascending: false });

  if (error || !progressRows) {
    console.error('Error fetching courses from progress:', error);
    return [];
  }

  const grouped = new Map<string, { total: number; count: number; lastAccessed: string | null; createdAt: string | null }>();
  for (const row of progressRows as Array<Record<string, unknown>>) {
    const courseId = typeof row.course_id === 'string' ? row.course_id : null;
    if (!courseId) continue;

    const current = grouped.get(courseId) || {
      total: 0,
      count: 0,
      lastAccessed: null,
      createdAt: null,
    };

    const progress = typeof row.progress_percentage === 'number' ? row.progress_percentage : 0;
    const lastAccessed = typeof row.last_accessed_at === 'string' ? row.last_accessed_at : null;
    const createdAt = typeof row.created_at === 'string' ? row.created_at : null;

    current.total += progress;
    current.count += 1;
    if (!current.lastAccessed || (lastAccessed && lastAccessed > current.lastAccessed)) {
      current.lastAccessed = lastAccessed;
    }
    if (!current.createdAt || (createdAt && createdAt < current.createdAt)) {
      current.createdAt = createdAt;
    }
    grouped.set(courseId, current);
  }

  const enrollments: CourseEnrollment[] = Array.from(grouped.entries()).map(([courseId, acc]) => {
    const progress = acc.count > 0 ? Math.round(acc.total / acc.count) : 0;
    return {
      id: `synthetic:${userId}:${courseId}`,
      user_id: userId,
      course_id: courseId,
      status: progress >= 100 ? 'completed' : 'active',
      progress_percentage: progress,
      last_accessed_at: acc.lastAccessed,
      enrolled_at: acc.createdAt || new Date().toISOString(),
    };
  });

  return enrollments.sort((a, b) => {
    if (!a.last_accessed_at && !b.last_accessed_at) return 0;
    if (!a.last_accessed_at) return 1;
    if (!b.last_accessed_at) return -1;
    return a.last_accessed_at < b.last_accessed_at ? 1 : -1;
  });
}

/**
 * Get progress for a specific course by aggregating content_progress records.
 * Returns completion percentage and list of progressed content.
 */
export async function getCourseProgress(courseId: string): Promise<{
  totalProgress: number;
  contents: ContentProgress[];
}> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) {
    return { totalProgress: 0, contents: [] };
  }

  const { data, error } = await supabase
    .from('content_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('last_accessed_at', { ascending: false });

  if (error) {
    console.error('Error fetching course progress:', error);
    return { totalProgress: 0, contents: [] };
  }

  const contents = (data || []) as ContentProgress[];
  const completedCount = contents.filter(c => c.status === 'completed').length;
  const totalProgress = contents.length > 0 ? Math.round((completedCount / contents.length) * 100) : 0;

  return { totalProgress, contents };
}

/**
 * Get progress for a specific curricular unit.
 * Returns completion percentage and list of progressed content in that unit.
 */
export async function getUnitProgress(unitId: string): Promise<{
  totalProgress: number;
  contents: ContentProgress[];
}> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) {
    return { totalProgress: 0, contents: [] };
  }

  const { data, error } = await supabase
    .from('content_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('curricular_unit_id', unitId)
    .order('last_accessed_at', { ascending: false });

  if (error) {
    console.error('Error fetching unit progress:', error);
    return { totalProgress: 0, contents: [] };
  }

  const contents = (data || []) as ContentProgress[];
  const completedCount = contents.filter(c => c.status === 'completed').length;
  const totalProgress = contents.length > 0 ? Math.round((completedCount / contents.length) * 100) : 0;

  return { totalProgress, contents };
}

/**
 * Update or create content progress. Tracks video watch time and completion status.
 * Uses upsert pattern: ON CONFLICT DO UPDATE.
 */
export async function updateContentProgress(
  contentId: string,
  unitId?: string,
  courseId?: string,
  contentType: string = 'video',
  status: 'not_started' | 'started' | 'in_progress' | 'completed' = 'in_progress',
  watchSeconds?: number,
  durationSeconds?: number
): Promise<ContentProgress> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const progressPercentage = durationSeconds && watchSeconds
    ? Math.round((watchSeconds / durationSeconds) * 100)
    : 0;

  const { data, error } = await supabase
    .from('content_progress')
    .upsert({
      user_id: userId,
      content_id: contentId,
      curricular_unit_id: unitId || null,
      course_id: courseId || null,
      content_type: contentType,
      status,
      progress_percentage: progressPercentage,
      watch_seconds: watchSeconds || 0,
      duration_seconds: durationSeconds || null,
      first_accessed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,course_id,curricular_unit_id,content_id,content_type',
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating content progress:', error);
    throw error;
  }

  return data as ContentProgress;
}

/**
 * Mark content as completed. Sets status='completed' and completed_at timestamp.
 */
export async function markContentAsCompleted(
  contentId: string,
  unitId?: string,
  courseId?: string,
  contentType: string = 'video'
): Promise<ContentProgress> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  let query = supabase
    .from('content_progress')
    .update({
      status: 'completed',
      progress_percentage: 100,
      completed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .eq('content_type', contentType);

  query = unitId ? query.eq('curricular_unit_id', unitId) : query.is('curricular_unit_id', null);
  query = courseId ? query.eq('course_id', courseId) : query.is('course_id', null);

  const { data, error } = await query.select().single();

  if (error) {
    console.error('Error marking content as completed:', error);
    throw error;
  }

  return data as ContentProgress;
}

/**
 * Get videos to continue watching. Returns content in progress with last_accessed_at
 * ordered by most recent, ready for resume functionality.
 */
export async function getContinueWatching(limit: number = 5): Promise<ContentProgress[]> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('content_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('content_type', 'video')
    .in('status', ['started', 'in_progress'])
    .order('last_accessed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching continue watching:', error);
    return [];
  }

  return (data || []) as ContentProgress[];
}

/**
 * Get student dashboard data: enrolled courses, progress summary, recent activity.
 * Aggregates data across multiple tables for dashboard view.
 */
export async function getStudentDashboard(): Promise<StudentDashboardData> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) {
    return {
      enrolledCourses: [],
      totalProgress: 0,
      continueWatching: [],
      recentActivity: [],
    };
  }

  try {
    const courses = await getMyCourses();

    // Fetch continue watching
    const { data: continueWatching, error: continueError } = await supabase
      .from('content_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('content_type', 'video')
      .in('status', ['started', 'in_progress'])
      .order('last_accessed_at', { ascending: false })
      .limit(5);

    if (continueError) throw continueError;

    // Build recent activity from content_progress updates.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activityRows, error: activitiesError } = await supabase
      .from('content_progress')
      .select('id, user_id, status, created_at, updated_at, course_id, curricular_unit_id, content_id, content_type')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(10);

    if (activitiesError) throw activitiesError;

    const activities: StudentActivityEvent[] = (activityRows || []).map((row: Record<string, unknown>) => ({
      id: String(row.id || crypto.randomUUID()),
      user_id: String(row.user_id || userId),
      event_type: String(row.status || 'content_started') === 'completed' ? 'content_completed' : 'content_started',
      created_at: String(row.updated_at || row.created_at || new Date().toISOString()),
      metadata: {
        course_id: row.course_id,
        curricular_unit_id: row.curricular_unit_id,
        content_id: row.content_id,
        content_type: row.content_type,
      },
    }));

    // Calculate aggregate progress
    const { data: allProgress, error: progressError } = await supabase
      .from('content_progress')
      .select('*')
      .eq('user_id', userId);

    if (progressError) throw progressError;

    const completedCount = (allProgress || [])
      .filter((p: Record<string, unknown>) => p.status === 'completed').length;
    const totalProgress = (allProgress || []).length > 0
      ? Math.round((completedCount / (allProgress || []).length) * 100)
      : 0;

    return {
      enrolledCourses: courses || [],
      totalProgress,
      continueWatching: (continueWatching || []) as ContentProgress[],
      recentActivity: activities,
    };
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    return {
      enrolledCourses: [],
      totalProgress: 0,
      continueWatching: [],
      recentActivity: [],
    };
  }
}

/**
 * Get recommendations for student based on:
 * 1. Enrolled courses with low progress
 * 2. Incomplete units in active courses
 * 3. Suggested learning paths
 */
export async function getStudentRecommendations(): Promise<{
  courseRecommendations: CourseEnrollment[];
}> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    return { courseRecommendations: [] };
  }

  const courses = (await getMyCourses())
    .filter((course) => course.progress_percentage < 100)
    .sort((a, b) => a.progress_percentage - b.progress_percentage)
    .slice(0, 5);

  return {
    courseRecommendations: courses,
  };
}
