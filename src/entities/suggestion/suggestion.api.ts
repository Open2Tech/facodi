import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import type { Json } from '@/integrations/supabase/types';
import { canonicalResourceUrl } from '@/entities/suggestion/recognition';
import type {
  LicenseClass, Recommendation, Screening, SuggestionDecision, SuggestionInput, SuggestionSummary, UnitOption,
} from '@/entities/suggestion/suggestion.types';

const SUMMARY_FIELDS = 'id,url,canonical_url,provider,title,author,thumbnail_url,license,object_type,language,tags,note,status,screening,review_note,reviewed_at,created_at,learning_object_id,curricular_units(code,title,slug,courses(code,slug))';
/** Database error codes raised by the screening trigger and constraints, mapped to locale keys. */
const ERROR_CODES: Record<string, string> = { '23505': 'already_suggested', '54000': 'daily_limit', '42501': 'forbidden' };

function suggestionError(error: { code?: string | null; message?: string | null }) {
  return new Error(ERROR_CODES[error.code ?? ''] ?? getSupabaseErrorMessage(error));
}

/** Units follow the public catalogue rule (active, inside a published and active course). */
export async function listSuggestionUnits(signal?: AbortSignal): Promise<UnitOption[]> {
  const { data, error } = await supabase.from('curricular_units').select('id,code,title,slug,courses!inner(code,title,slug)')
    .eq('status', 'active').eq('courses.published', true).eq('courses.status', 'active')
    .order('title').limit(1000).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data.map(({ courses, ...unit }) => ({ ...unit, course: courses }));
}

export async function submitSuggestion(input: SuggestionInput): Promise<SuggestionSummary> {
  const { data, error } = await supabase.from('resource_suggestions').insert({
    url: input.url.trim(),
    // The screening trigger recomputes the canonical form; this preview only satisfies the column type.
    canonical_url: canonicalResourceUrl(input.url) ?? input.url.trim(),
    title: input.title.trim(),
    author: input.author.trim() || null,
    license: input.license.trim() || null,
    thumbnail_url: input.thumbnailUrl,
    object_type: input.objectType,
    language: input.language || null,
    tags: input.tags,
    curricular_unit_id: input.unitId || null,
    note: input.note.trim() || null,
    license_declared: true,
    attribution_declared: true,
  }).select(SUMMARY_FIELDS).single();
  if (error) throw suggestionError(error);
  return data;
}

export async function listMySuggestions(userId: string, signal?: AbortSignal): Promise<SuggestionSummary[]> {
  const { data, error } = await supabase.from('resource_suggestions').select(SUMMARY_FIELDS)
    .eq('submitted_by', userId).order('created_at', { ascending: false }).limit(20).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data;
}

/** Editor queue: suggestions not yet decided, oldest first. */
export async function listSuggestionQueue(signal?: AbortSignal): Promise<SuggestionSummary[]> {
  const { data, error } = await supabase.from('resource_suggestions').select(SUMMARY_FIELDS)
    .in('status', ['pending', 'duplicate']).order('created_at', { ascending: true }).limit(80).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data;
}

/** Approval returns the draft learning object created (or reused) for the suggestion. */
export async function reviewSuggestion(id: string, decision: SuggestionDecision, note: string): Promise<string> {
  const { data, error } = await supabase.rpc('review_resource_suggestion', {
    p_suggestion_id: id, p_decision: decision, p_review_note: note.trim() || undefined,
  });
  if (error) throw suggestionError(error);
  return data;
}

const LICENSES: LicenseClass[] = ['open', 'restricted', 'unknown'];
const RECOMMENDATIONS: Recommendation[] = ['fast_track', 'review', 'reject'];

/** Reads the trigger's screening defensively; unknown values fall back to "needs review". */
export function parseScreening(value: Json): Screening {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const duplicate = data.duplicate && typeof data.duplicate === 'object' && !Array.isArray(data.duplicate) ? data.duplicate : null;
  return {
    providerRecognized: data.provider_recognized === true,
    secureSource: data.secure_source === true,
    license: LICENSES.find(item => item === data.license) ?? 'unknown',
    unitSelected: data.unit_selected === true,
    recommendation: RECOMMENDATIONS.find(item => item === data.recommendation) ?? 'review',
    duplicate: duplicate && typeof duplicate.slug === 'string' && typeof duplicate.learning_object_id === 'string'
      ? { learningObjectId: duplicate.learning_object_id, slug: duplicate.slug, objectType: typeof duplicate.object_type === 'string' ? duplicate.object_type : '' }
      : null,
  };
}
