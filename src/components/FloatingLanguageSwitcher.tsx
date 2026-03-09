import React, { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe } from 'lucide-react'
import type { Lang } from '../i18n/translations'

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

export function FloatingLanguageSwitcher() {
  const { lang, setLang } = useLang()
  const [isOpen, setIsOpen] = useState(false)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest('.lang-switcher')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  return (
    <div className="fixed bottom-6 right-6 z-[9999] lang-switcher flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col gap-2 mb-2"
          >
            {LANGUAGES.filter(l => l.code !== lang).map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code)
                  setIsOpen(false)
                }}
                className="flex items-center gap-3 px-4 py-2 bg-background/95 backdrop-blur-md border border-primary/20 rounded-full shadow-lg hover:bg-primary/10 transition-colors text-sm font-medium group"
              >
                <span className="text-lg">{l.flag}</span>
                <span className="text-foreground/80 group-hover:text-primary transition-colors">{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full 
          bg-background/80 backdrop-blur-md border border-primary/30 
          shadow-xl hover:shadow-primary/20 hover:scale-105 hover:border-primary/60
          transition-all duration-300 group mb-16 lg:mb-0
          ${isOpen ? 'bg-primary/20 border-primary' : ''}
        `}
        title="Change Language"
      >
        <Globe className={`w-6 h-6 text-foreground/80 group-hover:text-primary transition-colors ${isOpen ? 'text-primary animate-spin-slow' : ''}`} />
      </button>
    </div>
  )
}
