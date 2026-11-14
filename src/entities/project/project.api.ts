import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import type { Json } from '@/integrations/supabase/types';

export async function listProjectDirectory() {
  const [profiles, milestones] = await Promise.all([
    supabase.from('project_profiles')
      .select('id,slug,entity_kind,relationship_kind,display_name,role_label,headline,description,website_url,public_source_url,translations,sort_order')
      .eq('publication_state', 'published').eq('verification_state', 'verified_public')
      .order('sort_order').order('slug'),
    supabase.from('project_milestones')
      .select('id,slug,event_date,date_label,title,summary,public_source_url,translations,sort_order')
      .eq('publication_state', 'published').eq('verification_state', 'verified_public')
      .order('sort_order').order('slug'),
  ]);
  if (profiles.error) throw new Error(getSupabaseErrorMessage(profiles.error));
  if (milestones.error) throw new Error(getSupabaseErrorMessage(milestones.error));
  return { profiles: profiles.data ?? [], milestones: milestones.data ?? [] };
}

export type ProjectDirectory = Awaited<ReturnType<typeof listProjectDirectory>>;
export type ProjectProfilePublic = ProjectDirectory['profiles'][number];
export type ProjectMilestonePublic = ProjectDirectory['milestones'][number];

export function useProjectDirectory() {
  return useQuery({
    queryKey: ['facodi', 'public-project-directory'],
    queryFn: listProjectDirectory,
    staleTime: 10 * 60_000,
  });
}

/** Translation provenance is stored alongside the approved text.
 * Missing translations fall back to the original approved Portuguese copy. */
export function projectText(
  item: { translations: Json },
  language: string,
  field: 'role_label' | 'headline' | 'description' | 'title' | 'summary',
  fallback: string,
): string {
  const translations = item.translations;
  const locale = language.split('-')[0].toLowerCase();
  if (locale === 'pt' || !translations || typeof translations !== 'object' || Array.isArray(translations)) return fallback;
  const translated = (translations as Record<string, Json | undefined>)[locale];
  if (!translated || typeof translated !== 'object' || Array.isArray(translated)) return fallback;
  const value = (translated as Record<string, Json | undefined>)[field];
  return typeof value === 'string' && value.trim() ? value : fallback;
}
