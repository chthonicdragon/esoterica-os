import { createClient } from '@supabase/supabase-js';

const urlFromEnv = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const keyFromEnv = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

if (!urlFromEnv || !keyFromEnv) {
  if (import.meta.env.DEV) {
    console.warn(
      '[supabaseClient] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. ' +
      'Auth features will be unavailable until env vars are configured.',
      { hasUrl: Boolean(urlFromEnv), hasAnonKey: Boolean(keyFromEnv) }
    );
  }
}

const supabaseUrl = urlFromEnv || 'https://placeholder.supabase.co';
const supabaseKey = keyFromEnv || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: { apikey: supabaseKey },
  },
});
