import { toast } from 'sonner'

export interface TranslationStats {
  dailyChars: number
  totalChars: number
  lastReset: number
  requestsToday: number
}

interface CacheEntry {
  translation: string
  timestamp: number
  sourceLang: string
}

const CACHE_KEY = 'translation_cache'
const STATS_KEY = 'translation_stats'
const DAILY_CHAR_LIMIT = 5000 // Conservative limit for free tier
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 1 week

class TranslationService {
  private cache: Map<string, CacheEntry> = new Map()
  private stats: TranslationStats = {
    dailyChars: 0,
    totalChars: 0,
    lastReset: Date.now(),
    requestsToday: 0
  }
  
  constructor() {
    this.loadCache()
    this.loadStats()
  }

  private loadCache() {
    try {
      const saved = localStorage.getItem(CACHE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        this.cache = new Map(Object.entries(parsed))
      }
    } catch (e) {
      console.error('Failed to load translation cache', e)
    }
  }

  private saveCache() {
    try {
      // Prune old entries if too large
      if (this.cache.size > 1000) {
        const entries = Array.from(this.cache.entries())
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
        this.cache = new Map(entries.slice(0, 800))
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(this.cache)))
    } catch (e) {
      console.error('Failed to save translation cache', e)
    }
  }

  private loadStats() {
    try {
      const saved = localStorage.getItem(STATS_KEY)
      if (saved) {
        this.stats = JSON.parse(saved)
        // Check if day changed
        const lastDate = new Date(this.stats.lastReset).toDateString()
        const today = new Date().toDateString()
        if (lastDate !== today) {
          this.stats.dailyChars = 0
          this.stats.requestsToday = 0
          this.stats.lastReset = Date.now()
          this.saveStats()
        }
      }
    } catch (e) {
      console.error('Failed to load translation stats', e)
    }
  }

  private saveStats() {
    localStorage.setItem(STATS_KEY, JSON.stringify(this.stats))
  }

  private getCacheKey(text: string, to: string, from?: string): string {
    return `${text}:${from || 'auto'}:${to}`
  }

  async translate(text: string, to: string = 'ru', from?: string): Promise<string> {
    if (!text?.trim()) return ''
    
    // Check cache
    const cacheKey = this.getCacheKey(text, to, from)
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.translation
    }

    // Skip translation if target language is same as source (if known)
    if (from && from === to) return text
    
    // Check limits
    if (this.stats.dailyChars + text.length > DAILY_CHAR_LIMIT) {
      console.warn('Daily translation limit reached')
      // toast.error('Daily translation limit reached') // Suppress toast to avoid spam
      throw new Error('Daily limit reached')
    }

    try {
      // Try primary provider (MyMemory)
      let result = await this.translateMyMemory(text, to, from)
      
      if (!result) {
        // Fallback to Lingva
        result = await this.translateLingva(text, to, from)
      }

      if (!result) {
        console.warn('All translation providers failed, returning original text')
        return text
      }

      // Update stats
      this.stats.dailyChars += text.length
      this.stats.totalChars += text.length
      this.stats.requestsToday++
      this.saveStats()

      // Update cache
      this.cache.set(cacheKey, {
        translation: result,
        timestamp: Date.now(),
        sourceLang: from || 'auto'
      })
      this.saveCache()

      return result
    } catch (error) {
      console.error('Translation failed:', error)
      return text
    }
  }

  private async translateMyMemory(text: string, to: string, from?: string): Promise<string | null> {
    try {
      const source = from || 'autodetect'
      const langPair = `${source}|${to}`
      // Use direct URL if proxy not available, or just fail over to Lingva
      // Since we don't have a backend proxy for mymemory yet, let's try direct but it might CORS.
      // Better to rely on Lingva or just return null to fallback.
      return null 
    } catch (error) {
      return null
    }
  }

  private async translateLingva(text: string, to: string, from?: string): Promise<string | null> {
    try {
      const source = from || 'auto'
      // Use public Lingva instance
      const url = `https://lingva.ml/api/v1/${source}/${to}/${encodeURIComponent(text)}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.translation
    } catch (error) {
      // console.warn('Lingva translation failed:', error)
      return null
    }
  }
}

export const translationService = new TranslationService()
