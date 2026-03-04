import { useEffect, useState } from 'react'
import { LanguageProvider, useLang } from './contexts/LanguageContext'
import { useAuth } from './hooks/useAuth'
import { blink } from './blink/client'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { Dashboard } from './pages/Dashboard'
import { Altars } from './pages/Altars'
import { AIMentor } from './pages/AIMentor'
import { RitualTracker } from './pages/RitualTracker'
import { SigilLab } from './pages/SigilLab'
import { Journal } from './pages/Journal'
import { Marketplace } from './pages/Marketplace'
import { Settings } from './pages/Settings'

type Page = 'dashboard' | 'altars' | 'ai-mentor' | 'ritual-tracker' | 'sigil-lab' | 'journal' | 'marketplace' | 'settings'

const PAGE_TITLES: Record<Page, { en: string; ru: string }> = {
  dashboard: { en: 'Dashboard', ru: 'Главная' },
  altars: { en: 'Altars', ru: 'Алтари' },
  'ai-mentor': { en: 'AI Mentor', ru: 'ИИ Наставник' },
  'ritual-tracker': { en: 'Ritual Tracker', ru: 'Трекер Ритуалов' },
  'sigil-lab': { en: 'Sigil Lab', ru: 'Лаборатория Сигил' },
  journal: { en: 'Dream Journal', ru: 'Журнал Снов' },
  marketplace: { en: 'Marketplace', ru: 'Маркетплейс' },
  settings: { en: 'Settings', ru: 'Настройки' },
}

function AppContent() {
  const { user, loading } = useAuth()
  const { lang } = useLang()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-spin-slow" />
            <div className="absolute inset-2 rounded-full border border-[hsl(var(--neon))/20] animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">⭐</div>
          </div>
          <p className="text-sm text-muted-foreground font-cinzel tracking-widest">LOADING</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  const pageTitle = PAGE_TITLES[currentPage][lang]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as Page)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitle} userName={user.displayName || user.email} />
        <main className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && <Dashboard user={user} onNavigate={(p) => setCurrentPage(p as Page)} />}
          {currentPage === 'altars' && <Altars user={user} />}
          {currentPage === 'ai-mentor' && <AIMentor user={user} />}
          {currentPage === 'ritual-tracker' && <RitualTracker user={user} />}
          {currentPage === 'sigil-lab' && <SigilLab user={user} />}
          {currentPage === 'journal' && <Journal user={user} />}
          {currentPage === 'marketplace' && <Marketplace />}
          {currentPage === 'settings' && <Settings user={user} />}
        </main>
      </div>
    </div>
  )
}

function LandingPage() {
  const { lang, setLang } = useLang()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background sacred geometry */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50%" cy="50%" r="40%" fill="none" stroke="white" />
          <circle cx="50%" cy="50%" r="30%" fill="none" stroke="white" />
          <circle cx="50%" cy="50%" r="20%" fill="none" stroke="white" />
          <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="white" />
          <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="white" />
          <line x1="15%" y1="15%" x2="85%" y2="85%" stroke="white" />
          <line x1="85%" y1="15%" x2="15%" y2="85%" stroke="white" />
        </svg>
        {/* Radial gradient overlays */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[hsl(var(--neon))/0.05] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/10 blur-2xl" />
      </div>

      {/* Language toggle */}
      <div className="absolute top-6 right-6 flex gap-2">
        {(['en', 'ru'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              lang === l ? 'bg-primary/20 border border-primary/40 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {l === 'en' ? '🇬🇧 EN' : '🇷🇺 RU'}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-2xl animate-fade-in">
        {/* Logo mark */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-spin-slow" />
          <div className="absolute inset-3 rounded-full border border-[hsl(var(--neon))/0.3]" style={{ animation: 'spin-slow 15s linear infinite reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl sacred-glow">✦</div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-cinzel font-bold mb-2 tracking-widest gradient-text">
          ESOTERICA
        </h1>
        <div className="text-lg font-cinzel text-muted-foreground tracking-[0.4em] mb-6">OS</div>

        {/* Tagline */}
        <p className="text-lg text-foreground/80 mb-3 font-light">
          {lang === 'ru' ? 'Ваша операционная система личной трансформации' : 'Your personal transformation operating system'}
        </p>
        <p className="text-sm text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
          {lang === 'ru'
            ? 'Цифровые алтари · ИИ Наставник · Трекер ритуалов · Лаборатория сигил · Дневник снов'
            : 'Digital Altars · AI Mentor · Ritual Tracker · Sigil Lab · Dream Journal'
          }
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {[
            { en: 'Archetype AI', ru: 'Архетипный ИИ', emoji: '🤖' },
            { en: 'Moon Phases', ru: 'Фазы Луны', emoji: '🌙' },
            { en: 'Digital Altars', ru: 'Цифровые Алтари', emoji: '🕯️' },
            { en: 'Sigil Lab', ru: 'Лаборатория Сигил', emoji: '✨' },
            { en: 'EN / RU', ru: 'EN / RU', emoji: '🌐' },
          ].map(chip => (
            <div key={chip.en} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
              <span>{chip.emoji}</span>
              <span>{lang === 'ru' ? chip.ru : chip.en}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => blink.auth.login()}
          className="group relative px-10 py-4 rounded-2xl bg-gradient-to-r from-primary to-[hsl(267,60%,45%)] text-white font-semibold text-sm tracking-wider hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
        >
          <span className="relative z-10 font-cinzel tracking-widest">
            {lang === 'ru' ? 'ВОЙТИ В СИСТЕМУ' : 'ENTER THE SYSTEM'}
          </span>
        </button>

        <p className="text-xs text-muted-foreground mt-4">
          {lang === 'ru' ? 'Бесплатно · Безопасно · Ваши данные принадлежат вам' : 'Free · Secure · Your data belongs to you'}
        </p>
      </div>

      {/* Bottom decorative text */}
      <div className="absolute bottom-6 text-[10px] text-muted-foreground/40 tracking-widest font-cinzel">
        ✦ DIGITAL ECOSYSTEM FOR PERSONAL TRANSFORMATION ✦
      </div>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App
