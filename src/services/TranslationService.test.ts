import { describe, it, expect, vi, beforeEach } from 'vitest'
import { translationService } from './TranslationService'

// Mock fetch globally
const fetch = vi.fn()
global.fetch = fetch

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('TranslationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    // Reset internal state if possible, or just create new instance if exported class
    // Since it's a singleton, we might need to reset private fields via 'any' casting or add reset method
    // But for simplicity, we'll just test the public interface and mocking
    ;(translationService as any).cache = new Map()
    ;(translationService as any).stats = {
      dailyChars: 0,
      totalChars: 0,
      lastReset: Date.now(),
      requestsToday: 0
    }
  })

  it('should translate text successfully using primary provider', async () => {
    const mockResponse = {
      responseData: {
        translatedText: 'Привет мир',
        match: 1
      },
      responseStatus: 200
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const result = await translationService.translate('Hello world', 'ru')
    expect(result).toBe('Привет мир')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('mymemory'), expect.any(Object))
  })

  it('should fallback to secondary provider on primary failure', async () => {
    // Primary fails
    fetch.mockRejectedValueOnce(new Error('Network error'))
    
    // Secondary succeeds
    const mockLingvaResponse = {
      translation: 'Привет мир'
    }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLingvaResponse
    })

    const result = await translationService.translate('Hello world', 'ru')
    expect(result).toBe('Привет мир')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('should cache translations', async () => {
    const mockResponse = {
      responseData: {
        translatedText: 'Cached',
        match: 1
      },
      responseStatus: 200
    }
    
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    })

    // First call
    await translationService.translate('Test', 'ru')
    expect(fetch).toHaveBeenCalledTimes(1)

    // Second call - should use cache
    const result = await translationService.translate('Test', 'ru')
    expect(result).toBe('Cached')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should respect daily limits', async () => {
    // Set stats to near limit
    ;(translationService as any).stats.dailyChars = 4995
    
    const mockResponse = {
      responseData: {
        translatedText: 'Limit',
        match: 1
      },
      responseStatus: 200
    }
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    })

    // This should pass (5 chars)
    await translationService.translate('12345', 'ru')
    
    // This should fail
    await expect(translationService.translate('Too much', 'ru')).rejects.toThrow('Daily limit reached')
  })
})
