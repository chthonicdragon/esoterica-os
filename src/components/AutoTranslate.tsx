import React, { useState, useEffect, useRef } from 'react'
import { translationService } from '../services/TranslationService'
import { useLang } from '../contexts/LanguageContext'
import { Skeleton } from './ui/skeleton'

interface Props {
  children: string | null | undefined
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4'
  className?: string
  maxLength?: number
}

export function AutoTranslate({ children, as: Component = 'span', className, maxLength = 1000 }: Props) {
  const { lang } = useLang()
  const [translated, setTranslated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const mountedRef = useRef(true)
  const originalText = children || ''

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!originalText || lang === 'en') {
      setTranslated(null)
      setLoading(false)
      return
    }

    // Determine target language
    // Our app supports 'en' (default), 'ru', and we are adding 'es'
    const targetLang = lang

    const translate = async () => {
      setLoading(true)
      setError(false)
      try {
        // If text is too long, truncate or don't translate
        if (originalText.length > maxLength) {
          console.warn('Text too long for auto-translation:', originalText.length)
          setTranslated(null)
          return
        }

        const result = await translationService.translate(originalText, targetLang)
        if (mountedRef.current) {
          setTranslated(result)
        }
      } catch (e) {
        console.error('AutoTranslate failed', e)
        if (mountedRef.current) setError(true)
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    translate()
  }, [originalText, lang, maxLength])

  if (!originalText) return null

  if (lang === 'en') {
    return <Component className={className}>{originalText}</Component>
  }

  if (loading) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span className="opacity-50">{originalText}</span>
        <span className="w-3 h-3 rounded-full border border-primary/30 border-t-primary animate-spin" />
      </span>
    )
  }

  if (error || !translated) {
    return <Component className={className}>{originalText}</Component>
  }

  return (
    <Component className={className} title={originalText}>
      {translated}
    </Component>
  )
}
