import type { VercelRequest, VercelResponse } from '@vercel/node'

interface MythScanRequest {
  entity: string
  pantheon?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { entity, pantheon } = req.body as MythScanRequest

    if (!entity) {
      return res.status(400).json({ error: 'Entity name is required' })
    }

    // 1. Fetch from Wikipedia
    // Using the summary API for speed and relevance, or the full content if needed.
    // The user suggested: https://en.wikipedia.org/api/rest_v1/page/mobile-sections/{entity}
    // But noted it might be decommissioned. We'll use the standard REST API for summary/content.
    // We'll try to get the full HTML or intro text.
    let wikiText = ''
    try {
      // Search for the page first to get the correct title
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(entity + (pantheon ? ' ' + pantheon : ''))}&format=json`)
      const searchData = await searchRes.json()
      const pageTitle = searchData.query?.search?.[0]?.title || entity

      // Get content
      const contentRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json`)
      const contentData = await contentRes.json()
      const pages = contentData.query?.pages
      const pageId = Object.keys(pages || {})[0]
      if (pageId && pageId !== '-1') {
        wikiText = pages[pageId].extract
      }
    } catch (e) {
      console.error('Wikipedia fetch failed:', e)
    }

    // 2. Fetch from Wikidata (Optional but useful for IDs)
    // We can skip this for now to keep it simple, or just use the text from Wikipedia which usually contains the myths.
    // The prompt says "Optionally fetch structured data". We'll stick to Wikipedia text for the LLM context to save time/complexity.

    if (!wikiText) {
      return res.status(404).json({ error: 'Could not find entity in public sources' })
    }

    // 3. Call Gemini via OpenRouter
    const apiKey = (process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '').trim()
    const siteUrl = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://esoterica-os.vercel.app').trim()
    const siteTitle = (process.env.VITE_SITE_TITLE || process.env.SITE_TITLE || 'Esoterica OS').trim()

    const prompt = `
      You are an expert mythologist and occultist.
      Analyze the following text about the entity "${entity}" (${pantheon || 'Unknown Pantheon'}).
      Extract mythological correspondences into a structured JSON format.

      Text:
      ${wikiText.slice(0, 15000)} // Limit context size

      Categories to extract:
      - symbols
      - plants
      - animals
      - offerings
      - colors
      - elements
      - planets
      - days
      - festivals
      - associated_deities
      - sacred_objects
      - epithets (include name, meaning, type, confidence)

      Epithet types: cult_epithet, mythological_epithet, poetic_epithet, title, syncretic_name.

      Return ONLY valid JSON matching this structure:
      {
        "entity": "${entity}",
        "pantheon": "${pantheon || ''}",
        "symbols": [],
        "plants": [],
        "animals": [],
        "offerings": [],
        "colors": [],
        "elements": [],
        "planets": [],
        "days": [],
        "festivals": [],
        "associated_deities": [],
        "sacred_objects": [],
        "epithets": [
          { "name": "", "meaning": "", "type": "", "confidence": 0.0 }
        ]
      }

      Rules:
      - Max 10-15 items per category.
      - Confidence 0-1.
      - No speculation, only what is in the text or generally known historical facts associated with this specific entity.
      - JSON only. No markdown.
    `

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': siteTitle,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001', // Using a high-quality Gemini model
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      throw new Error(`AI API error: ${err}`)
    }

    const aiData = await aiRes.json()
    const content = aiData.choices?.[0]?.message?.content
    
    if (!content) {
      throw new Error('No content received from AI')
    }

    const json = JSON.parse(content)
    return res.status(200).json(json)

  } catch (e: any) {
    console.error('Myth scan error:', e)
    return res.status(500).json({ error: e.message })
  }
}
