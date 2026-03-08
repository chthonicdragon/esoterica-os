export type AppLang = 'en' | 'ru'
export type AiContext = 'mentor' | 'knowledge'

interface MessageSet {
  missingKey: string
  circuitOpen: string
  timeout: string
  rateLimit: string
  malformedData: string
  fallback: string
}

const MESSAGES: Record<AppLang, Record<AiContext, MessageSet>> = {
  ru: {
    mentor: {
      missingKey: 'ИИ не настроен: отсутствует API ключ. Сообщите администратору проекта.',
      circuitOpen: 'ИИ временно перегружен. Подождите около минуты и повторите запрос.',
      timeout: 'ИИ не успел ответить вовремя. Попробуйте еще раз или сократите запрос.',
      rateLimit: 'Лимит моделей временно исчерпан. Подождите немного и повторите запрос.',
      malformedData: 'ИИ вернул неполный ответ. Повторите запрос с более короткой формулировкой.',
      fallback: 'ИИ наставник временно недоступен. Проверьте подключение и попробуйте еще раз через 10-20 секунд.',
    },
    knowledge: {
      missingKey: 'ИИ для Паутины не настроен: отсутствует API ключ. Сообщите администратору проекта.',
      circuitOpen: 'ИИ временно перегружен. Подождите около минуты и повторите попытку.',
      timeout: 'Сетевая ошибка или таймаут. Проверьте соединение и попробуйте снова.',
      rateLimit: 'Лимит запросов временно исчерпан. Подождите 20-60 секунд и повторите.',
      malformedData: 'ИИ вернул поврежденный ответ. Повторите запрос с более коротким описанием.',
      fallback: 'Не удалось извлечь сущности. Проверьте API ключ и повторите попытку.',
    },
  },
  en: {
    mentor: {
      missingKey: 'AI is not configured: API key is missing. Please contact the project admin.',
      circuitOpen: 'AI is temporarily overloaded. Please wait about a minute and retry.',
      timeout: 'AI request timed out. Please retry or shorten your prompt.',
      rateLimit: 'Model rate limit was reached. Please wait a bit and retry.',
      malformedData: 'AI returned an incomplete response. Retry with a shorter prompt.',
      fallback: 'AI Mentor is temporarily unavailable. Check your connection and try again in 10-20 seconds.',
    },
    knowledge: {
      missingKey: 'Knowledge Web AI is not configured: API key is missing. Please contact the project admin.',
      circuitOpen: 'AI is temporarily overloaded. Please wait about a minute and retry.',
      timeout: 'Network error or timeout. Check your connection and retry.',
      rateLimit: 'Rate limit reached. Wait 20-60 seconds and try again.',
      malformedData: 'AI returned malformed data. Retry with a shorter, more specific prompt.',
      fallback: 'Failed to extract entities. Check your API key and try again.',
    },
  },
}

export function mapAiErrorMessage(
  reason: string,
  lang: AppLang,
  context: AiContext,
  fallback?: string
): string {
  const lower = reason.toLowerCase()
  const set = MESSAGES[lang][context]

  if (lower.includes('missing api key')) return set.missingKey
  if (lower.includes('circuit breaker open')) return set.circuitOpen
  if (lower.includes('429') || lower.includes('all models unavailable')) return set.rateLimit
  if (lower.includes('timeout') || lower.includes('failed to fetch') || lower.includes('network')) return set.timeout
  if (lower.includes('referer') || lower.includes('origin not allowed') || lower.includes('not approved') || lower.includes('x-title')) {
    return lang === 'ru'
      ? 'Домен не одобрен у провайдера ИИ. Откройте проект с доверенного URL или задайте VITE_SITE_URL.'
      : 'Site origin not approved by AI provider. Open from an approved URL or set VITE_SITE_URL.'
  }
  if (lower.includes('invalid json') || lower.includes('unable to recover valid graph json') || lower.includes('empty_ai_response')) {
    return set.malformedData
  }

  return fallback || set.fallback
}
