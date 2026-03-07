import { createClient } from '@supabase/supabase-js';

const urlFromEnv = import.meta.env.VITE_SUPABASE_URL;
const keyFromEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!urlFromEnv || !keyFromEnv) {
  const message =
    'Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. ' +
    'Set them in Vercel Project Settings -> Environment Variables and redeploy.';

  if (import.meta.env.DEV) {
    console.error('[supabaseClient] ' + message, {
      hasUrl: Boolean(urlFromEnv),
      hasAnonKey: Boolean(keyFromEnv),
    });
  }

  throw new Error(message);
}

export const supabase = createClient(urlFromEnv, keyFromEnv);