import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getEnv } from '@/shared/config/env';

const { VITE_SUPABASE_URL: SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY: SUPABASE_PUBLISHABLE_KEY } = getEnv();

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database, 'facodi'>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: 'facodi' },
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
    detectSessionInUrl: false,
  }
});