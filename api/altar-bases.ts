import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // Load bases from shared catalog (build will transpile TS)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ALTAR_BASES } = await import('../src/altar/catalog')
      return res.status(200).json({ bases: ALTAR_BASES || [] })
    }
    // Mutations are not supported in serverless demo
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unknown error'
    return res.status(500).json({ error: msg })
  }
}
