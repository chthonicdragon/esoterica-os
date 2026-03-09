import type { VercelRequest, VercelResponse } from '@vercel/node'

type DayOpt = 'today' | 'tomorrow' | 'yesterday'

function normalizeFromOhmanda(sign: string, raw: any) {
  const description = raw?.horoscope || 'No data'
  const date = raw?.date || new Date().toDateString()
  return {
    description,
    date_range: date,
    current_date: new Date().toDateString(),
    mood: 'Mystical',
    color: 'Unknown',
    lucky_number: 'Unknown',
    lucky_time: 'Unknown',
    compatibility: 'Unknown',
    sign,
  }
}

function mapRuSignToEn(raw: string): string {
  const s = raw.toLowerCase()
  const ru: Record<string, string> = {
    'овен': 'aries',
    'телец': 'taurus',
    'близнецы': 'gemini',
    'рак': 'cancer',
    'лев': 'leo',
    'дева': 'virgo',
    'весы': 'libra',
    'скорпион': 'scorpio',
    'стрелец': 'sagittarius',
    'козерог': 'capricorn',
    'водолей': 'aquarius',
    'рыбы': 'pisces',
  }
  return ru[s] || s
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const inputSign = String(req.query.sign || '').toLowerCase()
    const sign = mapRuSignToEn(inputSign)
    const day = (String(req.query.day || 'today').toLowerCase() as DayOpt)
    const allowed = new Set([
      'aries','taurus','gemini','cancer','leo','virgo',
      'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
    ])
    if (!allowed.has(sign)) {
      return res.status(400).json({ error: 'Invalid sign' })
    }

    // Strategy 1: Ohmanda (GET)
    try {
      const upstream = await fetch(`https://ohmanda.com/api/horoscope/${sign}`, { method: 'GET' })
      if (upstream.ok) {
        const data = await upstream.json()
        return res.status(200).json(normalizeFromOhmanda(sign, data))
      }
    } catch {}

    // Strategy 2: Aztro (POST) — supports day param
    try {
      const upstream = await fetch(`https://aztro.sameerkumar.website/?sign=${sign}&day=${day}`, { method: 'POST' })
      if (upstream.ok) {
        const data = await upstream.json()
        // Data already matches our client structure closely
        return res.status(200).json({
          description: data.description,
          date_range: data.date_range || '',
          current_date: data.current_date || new Date().toDateString(),
          mood: data.mood || 'Mystical',
          color: data.color || 'Unknown',
          lucky_number: data.lucky_number || 'Unknown',
          lucky_time: data.lucky_time || 'Unknown',
          compatibility: data.compatibility || 'Unknown',
          sign,
        })
      }
    } catch {}

    // Fallback: Mock
    return res.status(200).json({
      description: 'The stars are veiled today. Trust your intuition. (Server Fallback)',
      date_range: 'N/A',
      current_date: new Date().toDateString(),
      mood: 'Introspective',
      color: 'Silver',
      lucky_number: '11',
      lucky_time: 'Midnight',
      compatibility: 'Self',
      sign,
    })
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unknown error'
    return res.status(500).json({ error: msg })
  }
}
