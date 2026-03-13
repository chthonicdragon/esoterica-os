import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

// Remove trailing slash from URL if present
const urlFromEnv = rawUrl?.replace(/\/$/, '');
const keyFromEnv = rawKey;

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

export const supabase = createClient(supabaseUrl, supabaseKey);
