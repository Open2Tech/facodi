import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import type { Json } from '@/integrations/supabase/types';
import { canonicalResourceUrl } from '@/entities/suggestion/recognition';
import type {
  AnalysisMatch, EvidenceLevel, LicenseClass, Recommendation, Screening, SuggestionAnalysis, SuggestionDecision, SuggestionInput,
  SuggestionSummary, UnitOption,
} from '@/entities/suggestion/suggestion.types';

// RLS shows analysis jobs to the learner who suggested the resource and to editors.
const SUMMARY_FIELDS = 'id,url,canonical_url,provider,title,author,thumbnail_url,license,object_type,language,tags,note,status,screening,review_note,reviewed_at,created_at,learning_object_id,course_id,courses(code,title,slug),curricular_units(id,code,title,slug,courses(code,slug)),analysis_jobs(status,error_code,result_payload)';
/** Database error codes raised by the screening trigger and constraints, mapped to locale keys. */
const ERROR_CODES: Record<string, string> = { '23505': 'already_suggested', '54000': 'daily_limit', '42501': 'forbidden' };

function suggestionError(error: { code?: string | null; message?: string | null }) {
  return new Error(ERROR_CODES[error.code ?? ''] ?? getSupabaseErrorMessage(error));
}

/** Units follow the public catalogue rule (active, inside a published and active course). */
export async function listSuggestionUnits(signal?: AbortSignal): Promise<UnitOption[]> {
  const { data, error } = await supabase.from('curricular_units').select('id,code,title,slug,courses!inner(id,code,title,slug)')
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
    course_id: input.courseId || null,
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

/** Suggestions the pipeline published by itself (no reviewer) in the last two weeks, newest first. */
export async function listAutoPublishedSuggestions(signal?: AbortSignal): Promise<SuggestionSummary[]> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString();
  const { data, error } = await supabase.from('resource_suggestions').select(SUMMARY_FIELDS)
    .eq('status', 'approved').is('reviewed_by', null).gte('reviewed_at', since)
    .order('reviewed_at', { ascending: false }).limit(20).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data;
}

/** Approval returns the draft learning object created (or reused) for the suggestion; `unitId` overrides the learner's unit. */
export async function reviewSuggestion(id: string, decision: SuggestionDecision, note: string, unitId?: string): Promise<string> {
  const { data, error } = await supabase.rpc('review_resource_suggestion', {
    p_suggestion_id: id, p_decision: decision, p_review_note: note.trim() || undefined,
    ...(unitId ? { p_curricular_unit_id: unitId } : {}),
  });
  if (error) throw suggestionError(error);
  return data;
}

/** Editors queue a fresh analysis, e.g. after a failure or for suggestions made before the feature existed. */
export async function retrySuggestionAnalysis(id: string): Promise<void> {
  const { error } = await supabase.rpc('retry_resource_suggestion_analysis', { p_suggestion_id: id });
  if (error) throw suggestionError(error);
}

const LICENSES: LicenseClass[] = ['open', 'restricted', 'unknown'];
const RECOMMENDATIONS: Recommendation[] = ['fast_track', 'review', 'reject'];
const EVIDENCE_LEVELS: EvidenceLevel[] = ['content_video', 'metadata_rich', 'metadata_only'];

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

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === 'string' ? value : null;

/** Reads the worker's job defensively; no job (older suggestions) or a cancelled one shows nothing. */
export function parseAnalysis(jobs: SuggestionSummary['analysis_jobs']): SuggestionAnalysis | null {
  const job = jobs?.[0];
  if (!job) return null;
  const empty = { matches: [], topics: [], published: null, reviewReason: null, evidence: null, confirmed: null };
  if (job.status === 'failed') return { state: 'failed', ...empty };
  if (job.status !== 'succeeded') {
    if (!['queued', 'running', 'retrying'].includes(job.status)) return null;
    const waiting = job.status === 'queued' && (job.error_code === 'budget_exhausted' || job.error_code === 'ai_quota');
    return { state: waiting ? 'waiting' : 'pending', ...empty };
  }
  const payload = record(job.result_payload);
  const matching = record(payload.matching);
  const decision = record(payload.decision);
  const objectSlug = text(decision.object_slug);
  const matches = (Array.isArray(matching.matches) ? matching.matches : []).flatMap((item): AnalysisMatch[] => {
    const match = record(item);
    const unitId = text(match.unit_id), title = text(match.title), unitSlug = text(match.slug);
    const courseSlug = text(match.course_slug), reason = text(match.reason);
    if (!unitId || !title || !unitSlug || !courseSlug || !reason) return [];
    return [{ unitId, title, unitSlug, courseSlug, reason, code: text(match.code), courseCode: text(match.course_code),
      fit: match.fit === 'strong' ? 'strong' : 'partial', quote: text(match.quote) || null }];
  }).slice(0, 3);
  const level = text(record(payload.evidence).level);
  const confirmation = record(payload.confirmation);
  const agreed = confirmation.agreed_unit_ids;
  const topics = (Array.isArray(matching.topics) ? matching.topics : []).filter((topic): topic is string => typeof topic === 'string').slice(0, 5);
  return {
    state: 'done', matches, topics,
    published: decision.outcome === 'published' && objectSlug ? { objectSlug } : null,
    reviewReason: decision.outcome === 'review' ? text(decision.reason) : null,
    evidence: EVIDENCE_LEVELS.find(item => item === level) ?? null,
    confirmed: Array.isArray(agreed) ? agreed.length > 0 : null,
  };
}
