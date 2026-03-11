import { createClient } from '@supabase/supabase-js';

const urlFromEnv = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const keyFromEnv = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

if (!urlFromEnv || !keyFromEnv) {
  console.warn(
    '[supabaseClient] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. ' +
    'Add these secrets to enable authentication and database features.'
  );
}

const SUPABASE_URL = urlFromEnv || 'https://placeholder.supabase.co';
const SUPABASE_KEY = keyFromEnv || 'placeholder-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: { apikey: SUPABASE_KEY },
  },
});

export const isSupabaseConfigured = Boolean(urlFromEnv && keyFromEnv);
