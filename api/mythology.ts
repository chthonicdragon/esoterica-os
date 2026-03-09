import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const name = String(req.query.name || '').trim()
  if (!name) {
    return res.status(400).json({ error: 'Missing name' })
  }

  const apiKey = (process.env.API_NINJAS_KEY || process.env.VITE_API_NINJAS_KEY || '').trim()
  if (!apiKey) {
    // No key on server; respond with 204 so client can use local fallback
    return res.status(204).send('')
  }

  try {
    const upstream = await fetch(`https://api.api-ninjas.com/v1/mythology?name=${encodeURIComponent(name)}`, {
      headers: { 'X-Api-Key': apiKey }
    })

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Upstream error' })
    }

    const data = await upstream.json()
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: 'Not found' })
    }

    const first = data[0]
    return res.status(200).json({
      name: first.name,
      pantheon: first.culture || first.pantheon,
      domain: first.topic || first.domain,
      description: first.text || first.description || ''
    })
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unknown error'
    return res.status(500).json({ error: msg })
  }
}

