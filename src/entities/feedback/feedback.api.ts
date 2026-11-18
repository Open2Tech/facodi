import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';

/**
 * facodi.resource_feedback was added after the last generated Supabase types snapshot, so this module reads
 * it through the untyped client (same runtime instance and schema). RLS limits every call to the signed-in
 * learner's own answer.
 */
const db = () => supabase as unknown as SupabaseClient;

/** The learner's answer for a resource: true, false, or null when not answered yet. */
export async function getMyFeedback(learningObjectId: string, signal?: AbortSignal): Promise<boolean | null> {
  let query = db().from('resource_feedback').select('helpful').eq('learning_object_id', learningObjectId);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ? Boolean((data as { helpful: boolean }).helpful) : null;
}

/** One answer per learner and resource; answering again changes it. `owner_id` comes from the session. */
export async function saveMyFeedback(learningObjectId: string, helpful: boolean): Promise<boolean> {
  const { data, error } = await db().from('resource_feedback')
    .upsert({ learning_object_id: learningObjectId, helpful }, { onConflict: 'owner_id,learning_object_id' }).select('helpful');
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const rows = (data ?? []) as { helpful: boolean }[];
  if (!rows.length) throw new Error('feedback_not_saved');
  return rows[0].helpful;
}
