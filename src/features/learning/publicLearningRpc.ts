import { z } from 'zod';
import { supabase } from '@/shared/api/supabase/supabaseClient';

/**
 * Read-only FACODI RPC bridge. The live functions were added after the last
 * generated Supabase types snapshot; validate each response at runtime.
 * Calls use the configured 'facodi' schema and the visitor's own RLS role.
 */
export async function publicLearningRows<T extends z.ZodTypeAny>(
  functionName: string,
  arguments_: Record<string, unknown>,
  rowSchema: T,
): Promise<z.infer<T>[]> {
  const rpcClient = supabase as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  };
  const { data, error } = await rpcClient.rpc(functionName, arguments_);
  if (error) throw new Error(error.message);
  return z.array(rowSchema).parse(data ?? []);
}
