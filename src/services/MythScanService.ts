import { db } from '../lib/platformClient'

export interface Epithet {
  name: string
  meaning: string
  type: 'cult_epithet' | 'mythological_epithet' | 'poetic_epithet' | 'title' | 'syncretic_name'
  confidence: number
}

export interface MythScanResult {
  entity: string
  pantheon: string
  symbols: string[]
  plants: string[]
  animals: string[]
  offerings: string[]
  colors: string[]
  elements: string[]
  planets: string[]
  days: string[]
  festivals: string[]
  associated_deities: string[]
  sacred_objects: string[]
  epithets: Epithet[]
}

const CACHE_PREFIX = 'esoterica_myth_scan_'

export const MythScanService = {
  async scanEntity(entity: string, pantheon?: string): Promise<MythScanResult> {
    const cacheKey = `${CACHE_PREFIX}${entity}_${pantheon || ''}`.toLowerCase()
    
    // 1. Check Local Cache
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (e) {
        localStorage.removeItem(cacheKey)
      }
    }

    // 2. Call API (serverless). If unavailable in dev (404) — fallback to client-side flow.
    try {
      const response = await fetch('/api/myth-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entity, pantheon })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem(cacheKey, JSON.stringify(data))
        return data
      }

      // If 404 or serverless not mounted locally — try client-side fallback
      if (response.status === 404) {
        const data = await this.scanEntityClientSide(entity, pantheon)
        localStorage.setItem(cacheKey, JSON.stringify(data))
        return data
      }

      // Other server errors
      let errMsg = 'Failed to scan myth'
      try {
        const err = await response.json()
        errMsg = err.error || errMsg
      } catch {}
      throw new Error(errMsg)
    } catch (error) {
      console.error('MythScanService error:', error)
      // Network-level failure — try client-side fallback
      try {
        const data = await this.scanEntityClientSide(entity, pantheon)
        localStorage.setItem(cacheKey, JSON.stringify(data))
        return data
      } catch (e) {
        throw error
      }
    }
  },

  clearCache(entity: string) {
    const key = Object.keys(localStorage).find(k => k.toLowerCase().includes(entity.toLowerCase()) && k.startsWith(CACHE_PREFIX))
    if (key) localStorage.removeItem(key)
  },

  async scanEntityClientSide(entity: string, pantheon?: string): Promise<MythScanResult> {
    const isCyrillic = /[а-яА-ЯёЁ]/.test(entity)
    const lang = isCyrillic ? 'ru' : 'en'
    
    // 1) Resolve a good Wikipedia page title via search
    // Try primary language first
    let pageTitle = entity
    let wikiText = ''
    
    try {
      const searchRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(entity + (pantheon ? ' ' + pantheon : ''))}&format=json&origin=*`)
      const searchData = await searchRes.json().catch(() => ({}))
      if (searchData?.query?.search?.length > 0) {
        pageTitle = searchData.query.search[0].title
      }
    } catch (e) {
      console.warn('Wiki search failed', e)
    }

    // 2) Fetch plain extract text
    try {
      const contentRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`)
      const contentData = await contentRes.json()
      const pages = contentData?.query?.pages || {}
      const pageId = Object.keys(pages)[0]
      if (pageId && pageId !== '-1') {
        wikiText = pages[pageId].extract || ''
      }
    } catch (e) {
      console.warn('Wiki extract failed', e)
    }

    // If failed and was Cyrillic, try English as fallback (simple transliteration or raw)
    if (!wikiText && isCyrillic) {
      try {
        const enSearchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(entity)}&format=json&origin=*`)
        const enSearchData = await enSearchRes.json()
        if (enSearchData?.query?.search?.length > 0) {
          const enTitle = enSearchData.query.search[0].title
          const enContentRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${encodeURIComponent(enTitle)}&format=json&origin=*`)
          const enContentData = await enContentRes.json()
          const enPages = enContentData?.query?.pages || {}
          const enPageId = Object.keys(enPages)[0]
          if (enPageId && enPageId !== '-1') {
             wikiText = enPages[enPageId].extract || ''
          }
        }
      } catch {}
    }

    if (!wikiText) {
      throw new Error('Could not fetch Wikipedia text (checked ' + lang + ' and en)')
    }

    console.log('Wiki text found, length:', wikiText.length)

    // 3) Call OpenRouter (proxied via Vite dev server) to Gemini
    const prompt = `You are an expert mythologist and occultist.
Analyze the following text about the entity "${entity}" (${pantheon || 'Unknown Pantheon'}).
Extract mythological correspondences into a structured JSON format.

IMPORTANT:
- If the entity name is in Russian (Cyrillic), ALL extracted values (symbols, plants, epithets, etc.) MUST be in Russian.
- Do NOT provide dual-language output like "Candle (Свеча)" or "Свеча/Candle". 
- Use ONLY the target language term.
- Keep the JSON structure keys in English (e.g. "symbols": ["Свеча", "Ключ"]).

Text:
${wikiText.slice(0, 25000)}

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
- No speculation, only what is in the text or well-attested historically.
- JSON only. No markdown.`

    // Helper to compose OpenAI-compatible body
    const body = JSON.stringify({
      model: 'google/gemini-2.0-flash-exp:free', // Use free tier if available
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    // Try Vite dev proxy first
    try {
      const aiRes = await fetch('/_openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (aiRes.ok) {
        // Try parse as JSON regardless of content-type
        try {
          const data = await aiRes.json()
          const content = data?.choices?.[0]?.message?.content || ''
          if (content) {
            return JSON.parse(content)
          }
        } catch {
          // Fallback: try text then parse JSON
          const txt = await aiRes.text()
          if (txt) {
            try {
              const parsed = JSON.parse(txt)
              const content = parsed?.choices?.[0]?.message?.content || ''
              if (content) return JSON.parse(content)
            } catch {}
          }
        }
      }
    } catch {}

    // Try serverless gateway if available
    try {
      const gw = await fetch('/api/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (gw.ok) {
        try {
          const gwData = await gw.json()
          const gwContent = gwData?.choices?.[0]?.message?.content || ''
          if (gwContent) return JSON.parse(gwContent)
        } catch {}
      }
    } catch {}

    // Try direct OpenRouter as a fallback (client-side) if proxies are not wired.
    const resolveClientKey = (): string => {
      let k = ''
      try {
        // @ts-ignore
        k = import.meta.env.VITE_OPENROUTER_API_KEY
      } catch {}
      if (k) return k
      
      if (typeof window !== 'undefined') {
        // @ts-ignore
        if (window.__VITE_OPENROUTER_KEY) return window.__VITE_OPENROUTER_KEY
        if (window.localStorage && window.localStorage.getItem('eos_openrouter_key')) {
          return window.localStorage.getItem('eos_openrouter_key') || ''
        }
      }
      return ''
    }

    const clientKey = resolveClientKey()
    if (!clientKey) {
      throw new Error('Missing OpenRouter API key in client (VITE_OPENROUTER_API_KEY / __VITE_OPENROUTER_KEY / localStorage:eos_openrouter_key)')
    }

    const direct = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientKey}`,
        'HTTP-Referer': (typeof window !== 'undefined' ? window.location.origin : 'https://esoterica-os.vercel.app'),
        'X-Title': 'Esoterica OS',
      },
      body,
    })

    if (!direct.ok) {
      const text = await direct.text().catch(() => '')
      throw new Error(`AI API error: ${text || direct.status}`)
    }

    const directData = await direct.json()
    const directContent = directData?.choices?.[0]?.message?.content || ''
    if (!directContent) throw new Error('Empty AI response')
    return JSON.parse(directContent)
  }
}
