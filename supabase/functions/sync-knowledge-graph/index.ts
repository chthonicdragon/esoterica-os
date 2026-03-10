import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
// Note: per guidelines prefer Deno.serve but example uses std; adjust to Deno.serve
Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return new Response('Supabase env vars missing', { status: 500 });
    const body = await req.json();
    // basic validation
    if (!body || !body.type) return new Response(JSON.stringify({ error: 'invalid payload' }), { status: 400 });
    // For demo, just return received
    return new Response(JSON.stringify({ received: body }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});