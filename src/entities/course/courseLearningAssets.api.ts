import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import {
  composeCourseLearningAssets, emptyCourseLearningAssets,
  type CourseAssetRelation, type CourseAssetObject,
} from '@/entities/course/courseLearningAssets';

export interface CourseUnitAssetParent {
  learningObjectId: string | null;
  title: string;
}

const PARENT_BATCH = 20;
const OBJECT_BATCH = 60;

/** Resolve the course and its units in curriculum order, rather than requiring
 * editors to duplicate every reference as a direct course-level relation.
 * Every relation and object is still filtered by the caller's Supabase RLS. */
export async function getCourseLearningAssets(
  courseObjectId: string | null,
  units: readonly CourseUnitAssetParent[],
  signal?: AbortSignal,
) {
  const labels = new Map<string, string>();
  if (courseObjectId) labels.set(courseObjectId, '');
  for (const unit of units) if (unit.learningObjectId) labels.set(unit.learningObjectId, unit.title);
  const parentIds = [...labels.keys()];
  if (!parentIds.length) return emptyCourseLearningAssets();

  // Batch parent IDs so even large programmes do not hit PostgREST URL limits.
  const relationQueries = [];
  for (let start = 0; start < parentIds.length; start += PARENT_BATCH) {
    relationQueries.push(supabase.from('learning_object_relations')
      .select('parent_object_id, child_object_id, position')
      .in('parent_object_id', parentIds.slice(start, start + PARENT_BATCH))
      .eq('relation_type', 'contains')
      .order('position', { nullsFirst: false })
      .limit(1000)
      .abortSignal(signal));
  }
  const relationReplies = await Promise.all(relationQueries);
  for (const reply of relationReplies) if (reply.error) throw new Error(getSupabaseErrorMessage(reply.error));
  const relations: CourseAssetRelation[] = relationReplies.flatMap(reply => reply.data ?? []);
  const childIds = [...new Set(relations.map(relation => relation.child_object_id))];
  if (!childIds.length) return emptyCourseLearningAssets();

  const objectQueries = [];
  for (let start = 0; start < childIds.length; start += OBJECT_BATCH) {
    objectQueries.push(supabase.from('learning_objects')
      .select('id, slug, title, description, source_url, object_type, metadata')
      .in('id', childIds.slice(start, start + OBJECT_BATCH))
      .in('object_type', ['video', 'playlist', 'external_resource', 'document'])
      .eq('published', true)
      .in('status', ['active', 'published'])
      .abortSignal(signal));
  }
  const replies = await Promise.all(objectQueries);
  for (const reply of replies) if (reply.error) throw new Error(getSupabaseErrorMessage(reply.error));
  const objects: CourseAssetObject[] = replies.flatMap(reply => reply.data ?? []);
  return composeCourseLearningAssets(parentIds, labels, relations, objects);
}
