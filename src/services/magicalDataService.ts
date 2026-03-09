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

export const AstrologyService = {
  async getDailyHoroscope(sign: string, day: 'today' | 'tomorrow' | 'yesterday' = 'today'): Promise<Horoscope | null> {
    const cacheKey = `${CACHE_PREFIX}astro_${sign}_${day}_${new Date().toDateString()}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)

    try {
      const response = await fetch(`https://aztro.sameerkumar.website/?sign=${sign}&day=${day}`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Astrology API failed')
      const data = await response.json()
      
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
  async getEntityInfo(name: string): Promise<MythologyEntity | null> {
    const key = name.toLowerCase()
    // 1. Check Local Cache
    const cached = localStorage.getItem(MYTH_CACHE_KEY + key)
    if (cached) return JSON.parse(cached)

    // 2. Check Local Fallback DB
    if (LOCAL_MYTH_DB[key]) return LOCAL_MYTH_DB[key]

    // 3. Try API (API Ninjas) - Requires Key
    // Note: We use a placeholder key. If it fails, we return null.
    // In a real app, this should be an env variable: import.meta.env.VITE_API_NINJAS_KEY
    const apiKey = import.meta.env.VITE_API_NINJAS_KEY
    if (apiKey) {
      try {
        const response = await fetch(`https://api.api-ninjas.com/v1/mythology?name=${name}`, {
          headers: { 'X-Api-Key': apiKey }
        })
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            const entity = {
              name: data[0].name,
              pantheon: data[0].culture || data[0].pantheon, // API Ninjas uses 'culture' sometimes
              domain: data[0].topic || data[0].domain,
              description: data[0].text
            }
            localStorage.setItem(MYTH_CACHE_KEY + key, JSON.stringify(entity))
            return entity
          }
        }
      } catch (e) {
        console.warn('Mythology API failed, using fallback/null')
      }
    }

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
  'aries': 'Овен', 'taurus': 'Телец', 'gemini': 'Близнецы', 'cancer': 'Рак',
  'leo': 'Лев', 'virgo': 'Дева', 'libra': 'Весы', 'scorpio': 'Скорпион',
  'sagittarius': 'Стрелец', 'capricorn': 'Козерог', 'aquarius': 'Водолей', 'pisces': 'Рыбы',
  'today': 'сегодня', 'tomorrow': 'завтра', 'yesterday': 'вчера',
  'compatibility': 'Совместимость', 'mood': 'Настроение', 'color': 'Цвет',
  'lucky_number': 'Число удачи', 'lucky_time': 'Время удачи',
  'focused': 'Сфокусированное', 'happy': 'Счастливое', 'calm': 'Спокойное',
  'energetic': 'Энергичное', 'lazy': 'Ленивое', 'creative': 'Творческое'
}

export const TranslationService = {
  translate(text: string, lang: 'en' | 'ru'): string {
    if (lang === 'en') return text
    const lower = text.toLowerCase()
    return DICTIONARY[lower] || text
  }
}
