import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		'Missing Supabase env vars: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.'
	)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	global: {
		// Ensure REST calls always carry apikey (required by Supabase PostgREST).
		headers: { apikey: supabaseAnonKey },
	},
})
