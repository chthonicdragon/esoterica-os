// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const urlFromEnv = import.meta.env.VITE_SUPABASE_URL;
const keyFromEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Diagnostic logs — safe: don't print full anon key
console.log('--- supabaseClient diagnostics start ---');
try {
  console.log('import.meta.env keys:', Object.keys(import.meta.env).slice(0, 50));
} catch (err) {
  console.warn('Could not list import.meta.env keys:', err);
}
console.log('VITE_SUPABASE_URL (raw) =', urlFromEnv);
console.log('VITE_SUPABASE_ANON_KEY present =', !!keyFromEnv);
if (typeof keyFromEnv === 'string') {
  // show only first 8 chars to avoid leaking full key
  console.log('VITE_SUPABASE_ANON_KEY prefix =', keyFromEnv.slice(0, 8) + '...');
}
console.log('cwd (for reference) =', typeof process !== 'undefined' ? process.cwd?.() : 'process not available');
console.log('--- supabaseClient diagnostics end ---');

if (!urlFromEnv || !keyFromEnv) {
  console.warn('Supabase env vars missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

// TEMPORARY fallback for local debugging only — replace with real env vars and remove before committing
const url = urlFromEnv || 'https://dgcuqrmxaghrchzpkadx.supabase.co';
const key = keyFromEnv || '<<REPLACE_WITH_ANON_KEY_FOR_LOCAL_DEBUG>>';

export const supabase = createClient(url, key);