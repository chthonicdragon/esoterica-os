import { useEffect, useState, useCallback, Suspense } from 'react'
import { LanguageProvider, useLang } from './contexts/LanguageContext'
import { AudioProvider, useAudio } from './contexts/AudioContext'
import { useAuth } from './hooks/useAuth'
// import { blink } from './blink/client' // removed, migrated to Supabase
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { Sheet, SheetContent } from './components/ui/sheet'
import * as Pages from './pages'
import { PageLoader } from './components/PageLoader'
import { Maximize2 } from 'lucide-react'
import { useIsMobile } from './hooks/use-mobile'
import { supabase } from './lib/supabaseClient'

type Page = 'dashboard' | 'altars' | 'ai-mentor' | 'ritual-tracker' | 'sigil-lab' | 'journal' | 'forum' | 'marketplace' | 'settings' | 'knowledge-graph'

const PAGE_TITLES: Record<Page, { en: string; ru: string }> = {
  dashboard: { en: 'Dashboard', ru: 'Главная' },
  altars: { en: 'Altars', ru: 'Алтари' },
  'ai-mentor': { en: 'AI Mentor', ru: 'ИИ Наставник' },
  'ritual-tracker': { en: 'Ritual Tracker', ru: 'Трекер Ритуалов' },
  'sigil-lab': { en: 'Sigil Lab', ru: 'Лаборатория Сигил' },
  journal: { en: 'Dream Journal', ru: 'Журнал Снов' },
  forum: { en: 'Forum', ru: 'Форум' },
  marketplace: { en: 'Marketplace', ru: 'Маркетплейс' },
  settings: { en: 'Settings', ru: 'Настройки' },
  'knowledge-graph': { en: 'Knowledge Graph', ru: 'Паутина знаний' },
}

function AppContent() {
  const { user, loading } = useAuth()
  const { lang } = useLang()
  const isMobile = useIsMobile()
  const { isMuted, setIsMuted, playAmbient, playUiSound } = useAudio()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isLandscapeOnMobile, setIsLandscapeOnMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      if (isMobile) {
        setIsLandscapeOnMobile(window.innerWidth > window.innerHeight)
      } else {
        setIsLandscapeOnMobile(false)
      }
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [isMobile])

  // Start ambient on first interaction
  const handleInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true)
      setIsMuted(false)
      playAmbient(true)
      playUiSound('success')
    }
  }, [hasInteracted, setIsMuted, playAmbient, playUiSound])

  // Effect to handle navigation sounds
  useEffect(() => {
    if (hasInteracted) {
      playUiSound('whoosh')
    }
  }, [currentPage, hasInteracted, playUiSound])

  const handleNavigate = (page: Page) => {
    setCurrentPage(page)
    setIsSidebarOpen(false)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background" onClick={handleInteraction}>
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
    return (
      <div onClick={handleInteraction}>
        <LandingPage />
      </div>
    )
  }

  const pageTitle = PAGE_TITLES[currentPage][lang]

  return (
    <div className="flex h-screen overflow-hidden bg-background" onClick={handleInteraction}>
      {isLandscapeOnMobile && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-bounce">
            <Maximize2 className="w-8 h-8 text-primary rotate-90" />
          </div>
          <h2 className="text-xl font-cinzel font-bold mb-2">
            {lang === 'ru' ? 'Поверните устройство' : 'Rotate Device'}
          </h2>
          <p className="text-muted-foreground text-sm max-w-[200px]">
            {lang === 'ru' ? 'Пожалуйста, используйте портретный режим для лучшего опыта' : 'Please use portrait mode for the best experience'}
          </p>
        </div>
      )}

      {!isMobile && (
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} userId={user.id} />
      )}

      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64 bg-[hsl(var(--sidebar))] border-r border-border/40">
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} userId={user.id} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={pageTitle} 
          userName={user.displayName || user.email} 
          onMenuClick={isMobile ? () => setIsSidebarOpen(true) : undefined}
        />
        <main className={`flex-1 ${currentPage === 'altars' || currentPage === 'forum' || currentPage === 'knowledge-graph' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
          <Suspense fallback={<PageLoader />}>
            {currentPage === 'dashboard' && <Pages.Dashboard user={user} onNavigate={(p) => handleNavigate(p as Page)} />}
            {currentPage === 'altars' && <Pages.Altars user={user} />}
            {currentPage === 'ai-mentor' && <Pages.AIMentor user={user} />}
            {currentPage === 'ritual-tracker' && <Pages.RitualTracker user={user} />}
            {currentPage === 'sigil-lab' && <Pages.SigilLab user={user} />}
            {currentPage === 'journal' && <Pages.Journal user={user} />}
            {currentPage === 'forum' && <Pages.ForumPage user={user} />}
            {currentPage === 'marketplace' && <Pages.Marketplace />}
            {currentPage === 'settings' && <Pages.Settings user={user} />}
            {currentPage === 'knowledge-graph' && <div className="flex-1 p-4 overflow-hidden"><Pages.KnowledgeGraph user={user} /></div>}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

function LandingPage() {
  const { lang, setLang } = useLang()

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      console.error('Login error:', error)
    }
  }

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
          onClick={handleSignIn}
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
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </LanguageProvider>
  )
}

export default App
