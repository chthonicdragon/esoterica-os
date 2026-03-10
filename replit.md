# Esoterica OS

A Vite + React web application — an esoteric/spiritual OS interface with AI integrations, 3D visuals, astrology tools, and more.

## Stack

- **Frontend**: Vite 7, React, TypeScript, Tailwind CSS, Radix UI
- **Routing**: TanStack Router
- **State**: TanStack Query
- **3D**: Three.js via @react-three/fiber and @react-three/drei
- **Data viz**: D3, Recharts
- **Auth/DB**: Supabase
- **AI**: OpenRouter, Groq (via Vite dev proxy at `/_openrouter` and `/_groq`)
- **Package manager**: npm

## Running the App

```
npm run dev
```

Runs on port 5000 (required for Replit webview).

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_AUTH_REDIRECT_URL` | OAuth redirect URL |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key (proxied via Vite) |
| `VITE_GROQ_API_KEY` | Groq API key (proxied via Vite) |
| `VITE_AI_GATEWAY_MODE` | `direct` (default) or `gateway` |

## Replit Migration Notes

- Migrated from Vercel. Port changed from 3000 → 5000.
- The `api/*.ts` Vercel serverless functions are not active on Replit. The app uses `VITE_AI_GATEWAY_MODE=direct` (Vite proxy) by default, so they are not needed.
- Vite proxy routes (`/_openrouter`, `/_groq`, `/_mymemory`) handle API calls server-side during dev, keeping API keys out of browser network requests.

## Project Structure

- `src/` — React app source
- `api/` — Vercel serverless API routes (inactive on Replit)
- `public/` — Static assets
