import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const apiKey = (process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '').trim()
    if (!apiKey) {
      return res.status(400).json({ error: 'Missing DeepSeek API key on server' })
    }

    const upstream = 'https://api.deepseek.com/chat/completions'
    const upstreamRes = await fetch(upstream, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    })

    const text = await upstreamRes.text()
    res.status(upstreamRes.status)
    res.setHeader('Content-Type', upstreamRes.headers.get('Content-Type') || 'application/json')
    return res.send(text)
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unknown error'
    return res.status(500).json({ error: msg })
  }
}
