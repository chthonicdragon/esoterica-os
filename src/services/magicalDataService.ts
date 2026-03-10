import { db } from '../lib/platformClient'

// --- Types ---

export interface Horoscope {
  date_range: string
  current_date: string
  description: string
  compatibility: string
  mood: string
  color: string
  lucky_number: string
  lucky_time: string
}

export interface MythologyEntity {
  name: string
  pantheon?: string
  domain?: string
  description?: string
  symbol?: string
  source?: 'local' | 'api' | 'wikipedia' | 'deepseek'
  sourceUrl?: string
}

export interface NumerologyProfile {
  lifePathNumber: number
  personalYear: number
  energyToday: string
}

// --- Astrology Service (Aztro) ---

const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
]

const CACHE_PREFIX = 'esoterica_magical_cache_'

// Use a CORS proxy if direct access fails (e.g., allorigins or similar, or local fallback)
// Ideally, this should be a backend function. For now, we try direct then fallback.
const PROXY_URL = 'https://api.allorigins.win/raw?url='

export const AstrologyService = {
  async getDailyHoroscope(sign: string, day: 'today' | 'tomorrow' | 'yesterday' = 'today'): Promise<Horoscope | null> {
    const cacheKey = `${CACHE_PREFIX}astro_${sign}_${day}_${new Date().toDateString()}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)

    const fetchWithProxy = async () => {
       // Strategy 0: Serverless proxy (Vercel) to avoid CORS in production
       try {
         const serverRes = await fetch(`/api/horoscope?sign=${encodeURIComponent(sign)}&day=${encodeURIComponent(day)}`)
         if (serverRes.ok) {
           const serverData = await serverRes.json()
           return serverData
         }
       } catch (e) {}
       // Strategy 1: Horoscope App API (GET) - usually reliable
       try {
         const targetUrl = `https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${sign}&day=${day}`
         // Try direct first (CORS might allow it)
         const response = await fetch(targetUrl)
         if (response.ok) {
           const data = await response.json()
           if (data.data) {
             return {
               description: data.data.horoscope_data,
               date_range: data.data.date,
               current_date: new Date().toDateString(),
               mood: "Mystical",
               color: "Unknown",
               lucky_number: "Unknown",
               lucky_time: "Unknown",
               compatibility: "Unknown"
             }
           }
         }
       } catch (e) {
         console.warn('Strategy 1 failed', e)
       }

       // Strategy 2: Aztro (POST) - Direct
       try {
         const baseUrl = `https://aztro.sameerkumar.website/?sign=${sign}&day=${day}`
         const response = await fetch(baseUrl, { method: 'POST' })
         if (!response.ok) throw new Error('Aztro Direct Failed')
         return await response.json()
       } catch (e) {
         // Strategy 3: Ohmanda (GET) via Proxy
         try {
            const ohmandaUrl = `https://ohmanda.com/api/horoscope/${sign}`
            const proxyResp = await fetch(`${PROXY_URL}${encodeURIComponent(ohmandaUrl)}`)
            if (!proxyResp.ok) throw new Error('Ohmanda Proxy Failed')
            const raw = await proxyResp.json()
            // AllOrigins wraps response in 'contents' sometimes, but using /raw endpoint returns direct body
            // If raw is string, parse it
            const data = typeof raw === 'string' ? JSON.parse(raw) : raw
            
            return {
              description: data.horoscope,
              date_range: data.date,
              current_date: new Date().toDateString(),
              mood: 'Mysterious',
              color: 'Unknown',
              lucky_number: '7',
              lucky_time: '12:00',
              compatibility: 'Unknown'
            }
         } catch (e2) {
            console.warn('All Astrology APIs failed, using mock')
            // Fallback Mock
            return {
              description: "The stars are veiled today. Trust your intuition and proceed with caution. (Offline Mode)",
              date_range: "N/A",
              current_date: new Date().toDateString(),
              mood: "Introspective",
              color: "Silver",
              lucky_number: "11",
              lucky_time: "Midnight",
              compatibility: "Self"
            }
         }
       }
    }

    try {
      const data = await fetchWithProxy()
      localStorage.setItem(cacheKey, JSON.stringify(data))
      return data
    } catch (e) {
      console.error('AstrologyService Error:', e)
      return null
    }
  }
}

// --- Mythology Service (API Ninjas + Fallback) ---

const MYTH_CACHE_KEY = `${CACHE_PREFIX}mythology_`

// Small local fallback DB for common entities to save API calls or if key is missing
const LOCAL_MYTH_DB: Record<string, MythologyEntity> = {
  'hecate': { name: 'Hecate', pantheon: 'Greek', domain: 'Magic, Crossroads, Ghosts', symbol: 'Key, Torch' },
  'odin': { name: 'Odin', pantheon: 'Norse', domain: 'Wisdom, War, Poetry', symbol: 'Valknut, Raven' },
  'thoth': { name: 'Thoth', pantheon: 'Egyptian', domain: 'Writing, Magic, Wisdom', symbol: 'Ibis, Scroll' },
  'kali': { name: 'Kali', pantheon: 'Hindu', domain: 'Destruction, Time, Change', symbol: 'Sword, Garland' },
  'lilith': { name: 'Lilith', pantheon: 'Mesopotamian', domain: 'Night, Freedom, Storms', symbol: 'Owl, Snake' },
}

export const MythologyService = {
  async getWikipediaFullText(name: string): Promise<{ title: string; extract: string; url: string; lang: 'en' | 'ru' } | null> {
    const isCyrillic = /[а-яА-ЯёЁ]/.test(name)
    const primaryLang: 'en' | 'ru' = isCyrillic ? 'ru' : 'en'

    const fetchForLang = async (lang: 'en' | 'ru') => {
      const searchRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*`)
      const searchData = await searchRes.json().catch(() => ({}))
      const pageTitle = searchData?.query?.search?.[0]?.title
      if (!pageTitle) return null

      const contentRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`)
      const contentData = await contentRes.json().catch(() => ({}))
      const pages = contentData?.query?.pages || {}
      const pageId = Object.keys(pages)[0]
      if (!pageId || pageId === '-1') return null

      const extract = pages[pageId]?.extract || ''
      if (!extract) return null

      const url = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`
      return { title: pageTitle, extract, url, lang }
    }

    try {
      const primary = await fetchForLang(primaryLang)
      if (primary) return primary
    } catch {}

    if (primaryLang === 'ru') {
      try {
        const en = await fetchForLang('en')
        if (en) return en
      } catch {}
    }

    return null
  },

  async getEntityInfo(name: string): Promise<MythologyEntity | null> {
    const key = name.toLowerCase()
    // 1. Check Local Cache
    const cached = localStorage.getItem(MYTH_CACHE_KEY + key)
    if (cached) return JSON.parse(cached)

    // 2. Check Local Fallback DB
    if (LOCAL_MYTH_DB[key]) return { ...LOCAL_MYTH_DB[key], source: 'local' }

    // 3. Try Serverless API (skip in local dev to avoid noisy 404/HTML)
    // Actually, in local dev we want to fallback to Wikipedia if serverless is missing
    const isLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)/.test(window.location.hostname)
    
    if (!isLocal) {
      try {
        const serverRes = await fetch(`/api/mythology?name=${encodeURIComponent(name)}`)
        if (serverRes.ok) {
          const entity = await serverRes.json()
          if (entity && entity.name) {
            const normalized = { ...(entity as any), source: 'api' } as MythologyEntity
            localStorage.setItem(MYTH_CACHE_KEY + key, JSON.stringify(normalized))
            return normalized
          }
        }
      } catch {}
    }

    // 4. Fallback: Wikipedia Summary (Client-side)
    try {
      // Try Russian Wiki first if Cyrillic
      const isCyrillic = /[а-яА-ЯёЁ]/.test(name)
      const lang = isCyrillic ? 'ru' : 'en'
      
      const searchRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*`)
      const searchData = await searchRes.json()
      const pageTitle = searchData?.query?.search?.[0]?.title

      if (pageTitle) {
        const contentRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`)
        const contentData = await contentRes.json()
        const pages = contentData?.query?.pages || {}
        const pageId = Object.keys(pages)[0]
        if (pageId && pageId !== '-1') {
          const extract = pages[pageId].extract
          if (extract) {
            const entity: MythologyEntity = {
              name: pageTitle,
              pantheon: 'Unknown', // Hard to extract reliably without AI, but better than nothing
              description: extract.slice(0, 300) + '...',
              domain: 'Mythology',
              source: 'wikipedia',
              sourceUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`
            }
            localStorage.setItem(MYTH_CACHE_KEY + key, JSON.stringify(entity))
            return entity
          }
        }
      }
    } catch (e) {
      console.warn('Wiki fallback failed', e)
    }

    // 5. Last resort: DeepSeek quick summary (serverless or direct)
    try {
      const prompt = `Give a concise mythological summary for "${name}". 
Return JSON with keys: name, pantheon, domain, description (max 260 chars), symbol (one or two).`
      // Try serverless first
      const dsRes = await fetch('/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      })
      if (dsRes.ok) {
        const dsJson = await dsRes.json().catch(() => null)
        const content = dsJson?.choices?.[0]?.message?.content || ''
        if (content) {
          const entity = JSON.parse(content)
          if (entity?.name) {
            const normalized = { ...(entity as any), source: 'deepseek' } as MythologyEntity
            localStorage.setItem(MYTH_CACHE_KEY + key, JSON.stringify(normalized))
            return normalized
          }
        }
      }
      // Try direct client call if serverless failed and key exists
      const deepseekKey = (import.meta as any)?.env?.VITE_DEEPSEEK_API_KEY || ''
      if (deepseekKey) {
        const dsDirect = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        })
        if (dsDirect.ok) {
          const dj = await dsDirect.json().catch(() => null)
          const c = dj?.choices?.[0]?.message?.content || ''
          if (c) {
            const entity = JSON.parse(c)
            if (entity?.name) {
              const normalized = { ...(entity as any), source: 'deepseek' } as MythologyEntity
              localStorage.setItem(MYTH_CACHE_KEY + key, JSON.stringify(normalized))
              return normalized
            }
          }
        }
      }
    } catch {}

    return null
  }
}

// --- Numerology Service (Local Calculation) ---

export const NumerologyService = {
  calculateLifePath(birthDate: string): number {
    // Format YYYY-MM-DD
    const digits = birthDate.replace(/\D/g, '').split('').map(Number)
    let sum = digits.reduce((a, b) => a + b, 0)
    
    // Reduce to single digit or master number (11, 22, 33)
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0)
    }
    return sum
  },

  calculatePersonalYear(birthDate: string): number {
    const now = new Date()
    const currentYear = now.getFullYear()
    const [_, month, day] = birthDate.split('-').map(Number) // Assumes YYYY-MM-DD
    
    let sum = day + month + currentYear
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0)
    }
    return sum
  },

  getDailyEnergy(lifePath: number): string {
    // Simple cyclical energy based on day of year + life path
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const cycle = (dayOfYear + lifePath) % 9 + 1
    
    const energies: Record<number, string> = {
      1: 'New Beginnings, Initiative',
      2: 'Cooperation, Balance',
      3: 'Creativity, Expression',
      4: 'Stability, Hard Work',
      5: 'Change, Freedom',
      6: 'Harmony, Family',
      7: 'Reflection, Spirituality',
      8: 'Power, Achievement',
      9: 'Completion, Letting Go'
    }
    return energies[cycle] || 'Mystery'
  }
}

// --- Translation Helper (Simple Dictionary) ---

const DICTIONARY: Record<string, string> = {
  'aries': 'Овен|Aries', 'taurus': 'Телец|Tauro', 'gemini': 'Близнецы|Géminis', 'cancer': 'Рак|Cáncer',
  'leo': 'Лев|Leo', 'virgo': 'Дева|Virgo', 'libra': 'Весы|Libra', 'scorpio': 'Скорпион|Escorpio',
  'sagittarius': 'Стрелец|Sagitario', 'capricorn': 'Козерог|Capricornio', 'aquarius': 'Водолей|Acuario', 'pisces': 'Рыбы|Piscis',
  'today': 'сегодня|hoy', 'tomorrow': 'завтра|mañana', 'yesterday': 'вчера|ayer',
  'compatibility': 'Совместимость|Compatibilidad', 'mood': 'Настроение|Estado de ánimo', 'color': 'Цвет|Color',
  'lucky_number': 'Число удачи|Número de la suerte', 'lucky_time': 'Время удачи|Hora de la suerte',
  'focused': 'Сфокусированное|Enfocado', 'happy': 'Счастливое|Feliz', 'calm': 'Спокойное|Calmado',
  'energetic': 'Энергичное|Energético', 'lazy': 'Ленивое|Perezoso', 'creative': 'Творческое|Creativo'
}

export const TranslationService = {
  translate(text: string, lang: 'en' | 'ru' | 'es'): string {
    if (lang === 'en') return text
    const lower = text.toLowerCase()
    const entry = DICTIONARY[lower]
    if (!entry) return text
    
    const [ru, es] = entry.split('|')
    if (lang === 'ru') return ru || text
    if (lang === 'es') return es || ru || text
    return text
  }
}
