import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ ok: true, env: process.env.VERCEL ? 'vercel' : 'unknown' })
}
