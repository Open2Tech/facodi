import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';

/**
 * "Desafio do mês": one published sequence in the spotlight each month, with a collective goal.
 * Editorial choice: add a line per month. Months without an entry show nothing.
 */
export const MONTHLY_CHALLENGES: readonly { month: string; slug: string; goal: number }[] = [
  { month: '2026-12', slug: 'facodi-gestao-sequencia-estatistica-i', goal: 300 },
  { month: '2027-01', slug: 'facodi-math-otimizacao-economia', goal: 300 },
];

export interface MonthlyChallenge { month: string; slug: string; goal: number; from: Date; to: Date }

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/** The challenge running on this date (local calendar month), or null. */
export function challengeFor(date: Date): MonthlyChallenge | null {
  const entry = MONTHLY_CHALLENGES.find(item => item.month === monthKey(date));
  if (!entry) return null;
  return { ...entry, from: new Date(date.getFullYear(), date.getMonth(), 1), to: new Date(date.getFullYear(), date.getMonth() + 1, 1) };
}

/** Share of the goal reached, 0–100. */
export function goalPercent(total: number | null, goal: number) {
  if (!total || goal <= 0) return 0;
  return Math.min(100, Math.round((total / goal) * 100));
}

type CommunityRpc = (fn: string, args: Record<string, string>) => { abortSignal: (signal?: AbortSignal) => PromiseLike<{ data: unknown; error: { message: string } | null }> };

/** Anonymous community total of lessons finished in the sequence this period; null when it is below 10. */
export async function getCommunityCompletions(challenge: MonthlyChallenge, signal?: AbortSignal): Promise<number | null> {
  // Not yet in the generated types (new migration); same client and schema.
  const rpc = supabase.rpc.bind(supabase) as unknown as CommunityRpc;
  const { data, error } = await rpc('get_public_sequence_community_completions_v1', {
    p_slug: challenge.slug, p_from: challenge.from.toISOString(), p_to: challenge.to.toISOString(),
  }).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error as never));
  return typeof data === 'number' ? data : null;
}
