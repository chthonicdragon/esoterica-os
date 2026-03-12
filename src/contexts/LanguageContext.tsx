import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Lang, Translations } from '../i18n/translations'

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('esoterica-lang') as Lang | null
    return saved && saved in translations ? saved : 'en'
  })

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('esoterica-lang', newLang)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang
    }
    window.dispatchEvent(new CustomEvent('eos-language-changed', { detail: { lang: newLang } }))
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'esoterica-lang' || !e.newValue) return
      if (e.newValue in translations) {
        setLangState(e.newValue as Lang)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const t = translations[lang]

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
