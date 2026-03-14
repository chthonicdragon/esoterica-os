import { useEffect, useState, useCallback, Suspense } from 'react'
import { useLang } from './contexts/LanguageContext'
import { useAudio } from './contexts/AudioContext'
import { useUser } from './contexts/UserContext'
// import { blink } from './blink/client' // removed, migrated to Supabase
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { Sheet, SheetContent } from './components/ui/sheet'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import * as Pages from './pages'
import { getNavTheme, getCrossroadsSidebarMode } from './lib/navTheme'
import { PageLoader } from './components/PageLoader'
import { Maximize2 } from 'lucide-react'
import { useIsMobile } from './hooks/use-mobile'
import { supabase } from './lib/supabaseClient'
import { registerFeatureOpened } from './lib/unlockNotifications'
import { initAchievementListener } from './lib/achievements'
import { eventBus } from './lib/eventBus'
import toast from 'react-hot-toast'
import { FloatingLanguageSwitcher } from './components/FloatingLanguageSwitcher'
import { ThemeBackground } from './components/theme/ThemeBackground'
import { soundManager } from './lib/soundManager'

type Page = 'crossroads' | 'dashboard' | 'altars' | 'ai-mentor' | 'ritual-tracker' | 'sigil-lab' | 'divination' | 'journal' | 'forum' | 'marketplace' | 'settings' | 'knowledge-graph' | 'chakra-intelligence'
const PAGE_STORAGE_KEY = 'esoterica_current_page_v1'

const ALL_PAGES: Page[] = [
  'crossroads',
  'dashboard',
  'altars',
  'ai-mentor',
  'ritual-tracker',
  'sigil-lab',
  'divination',
  'journal',
  'forum',
  'marketplace',
  'settings',
  'knowledge-graph',
  'chakra-intelligence',
]

const isValidPage = (value: string | null | undefined): value is Page => {
  return !!value && ALL_PAGES.includes(value as Page)
}

const getPageFromHash = (): Page | null => {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash || ''
  const looksLikeAuthHash = hash.includes('access_token=') || hash.includes('refresh_token=') || hash.includes('error_description=')
  if (looksLikeAuthHash) return null
  const normalized = hash.startsWith('#/') ? hash.slice(2) : hash.startsWith('#') ? hash.slice(1) : hash
  return isValidPage(normalized) ? normalized : null
}

const isAuthCallbackInProgress = () => {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash || ''
  const search = window.location.search || ''
  return (
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('error_description=') ||
    search.includes('code=') ||
    search.includes('error=')
  )
}

const isSafeModeRequested = () => {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('safe') === '1'
}

const PAGE_TITLES: Record<Page, { en: string; ru: string }> = {
  crossroads: { en: "Hecate's Crossroads", ru: 'Перекрёсток Гекаты' },
  dashboard: { en: 'Dashboard', ru: 'Главная' },
  altars: { en: 'Altars', ru: 'Алтари' },
  'ai-mentor': { en: 'AI Mentor', ru: 'ИИ Наставник' },
  'ritual-tracker': { en: 'Ritual Tracker', ru: 'Трекер Ритуалов' },
  'sigil-lab': { en: 'Sigil Lab', ru: 'Лаборатория Сигил' },
  divination: { en: 'Divination', ru: 'Гадания' },
  journal: { en: 'Dream Journal', ru: 'Журнал Снов' },
  forum: { en: 'Forum', ru: 'Форум' },
  marketplace: { en: 'Marketplace', ru: 'Маркетплейс' },
  settings: { en: 'Settings', ru: 'Настройки' },
  'knowledge-graph': { en: 'Knowledge Graph', ru: 'Паутина знаний' },
  'chakra-intelligence': { en: 'Chakra Intelligence', ru: 'Чакры' },
}

function AppContent() {
  const { user, loading } = useUser()
  const { lang } = useLang()
  const isMobile = useIsMobile()
  const { setIsMuted, playAmbient, playUiSound } = useAudio()
  const safeModeRequested = isSafeModeRequested()
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    if (isSafeModeRequested()) return 'dashboard'
    const pageFromHash = getPageFromHash()
    if (pageFromHash) return pageFromHash
    if (typeof window !== 'undefined') {
      const storedPage = window.localStorage.getItem(PAGE_STORAGE_KEY)
      if (isValidPage(storedPage)) return storedPage
    }
    return getNavTheme() === 'crossroads' ? 'crossroads' : 'dashboard'
  })
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isLandscapeOnMobile, setIsLandscapeOnMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showLandscapeHint, setShowLandscapeHint] = useState(true)
  const [navTheme, setNavThemeState] = useState(() => getNavTheme())
  const [crossroadsSidebarMode, setCrossroadsSidebarMode] = useState<'show' | 'hide'>(getCrossroadsSidebarMode())

  useEffect(() => {
    if (typeof window === 'undefined' || !safeModeRequested) return
    window.localStorage.setItem(PAGE_STORAGE_KEY, 'dashboard')
    if (currentPage !== 'dashboard') setCurrentPage('dashboard')
    if (window.location.hash !== '#/dashboard') {
      window.history.replaceState(null, '', '#/dashboard')
    }
  }, [safeModeRequested, currentPage])

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

  // Initialize achievement system and sync Knowledge Graph when user is logged in
  useEffect(() => {
    if (!user) return
    // Sync Knowledge Graph from Supabase
    import('./services/knowledgeGraphSync').then(({ syncGraph }) => {
      syncGraph(user.id).catch(() => {})
    })
    // Achievements
    const cleanup = initAchievementListener(user.id)
    const unsubAchievement = eventBus.on('achievement:unlocked', (payload) => {
      toast.success(
        `🏆 ${lang === 'ru' ? payload.titleRu : payload.title}`,
        { duration: 4000 }
      )
      playUiSound('bell')
    })
    return () => {
      cleanup()
      unsubAchievement()
    }
  }, [user?.id, lang, playUiSound])

  // Effect to handle navigation sounds
  useEffect(() => {
    if (hasInteracted) {
      playUiSound('whoosh')
    }
  }, [currentPage, hasInteracted, playUiSound])

  // Keep current page stable across reloads and allow direct open via hash URL.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (loading) return
    if (isAuthCallbackInProgress()) return
    window.localStorage.setItem(PAGE_STORAGE_KEY, currentPage)
    const desiredHash = `#/${currentPage}`
    if (window.location.hash !== desiredHash) {
      window.history.replaceState(null, '', desiredHash)
    }
  }, [currentPage, loading])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onHashChange = () => {
      if (isAuthCallbackInProgress()) return
      const pageFromHash = getPageFromHash()
      if (pageFromHash) {
        setCurrentPage(prev => (prev === pageFromHash ? prev : pageFromHash))
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const syncSidebarMode = () => setCrossroadsSidebarMode(getCrossroadsSidebarMode())
    const syncNavTheme = () => setNavThemeState(getNavTheme())
    const syncThemeState = () => {
      syncSidebarMode()
      syncNavTheme()
    }
    syncThemeState()
    window.addEventListener('crossroads-sidebar-mode-changed', syncSidebarMode)
    window.addEventListener('nav-theme-changed', syncNavTheme)
    window.addEventListener('storage', syncSidebarMode)
    window.addEventListener('storage', syncNavTheme)
    window.addEventListener('focus', syncThemeState)
    window.addEventListener('pageshow', syncThemeState)
    return () => {
      window.removeEventListener('crossroads-sidebar-mode-changed', syncSidebarMode)
      window.removeEventListener('nav-theme-changed', syncNavTheme)
      window.removeEventListener('storage', syncSidebarMode)
      window.removeEventListener('storage', syncNavTheme)
      window.removeEventListener('focus', syncThemeState)
      window.removeEventListener('pageshow', syncThemeState)
    }
  }, [])

  useEffect(() => {
    const nextTrack = navTheme === 'crossroads' ? '/sounds/Crossroads of Hecate.mp3' : '/sounds/ambient.mp3'
    soundManager.setMusicTrack(nextTrack)
  }, [navTheme])

  const handleNavigate = (page: Page) => {
    if (page !== 'dashboard' && user) {
      const title = PAGE_TITLES[page]
      registerFeatureOpened(user.id, page, title.en, title.ru)
    }
    setCurrentPage(page)
    setIsSidebarOpen(false)
  }

  const recoverFromAltarCrash = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('esoterica_altar_v2')
      window.localStorage.setItem(PAGE_STORAGE_KEY, 'dashboard')
      window.history.replaceState(null, '', '#/dashboard')
    }
    setCurrentPage('dashboard')
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
          <p className="text-sm text-muted-foreground font-cinzel tracking-widest">{lang === 'ru' ? 'ЗАГРУЗКА' : 'LOADING'}</p>
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

  // ── Crossroads full-screen (no sidebar/header) ──
  if (currentPage === 'crossroads') {
    return (
      <div onClick={handleInteraction}>
        <HecateCrossroads onNavigate={(page) => handleNavigate(page as Page)} />
      </div>
    )
  }

  const effectiveNavTheme = typeof window !== 'undefined' ? getNavTheme() : navTheme
  const effectiveCrossroadsSidebarMode = typeof window !== 'undefined' ? getCrossroadsSidebarMode() : crossroadsSidebarMode
  const pageTitleObj = PAGE_TITLES[currentPage]
  const pageTitle = (pageTitleObj as any)[lang] || pageTitleObj.en

  return (
    <div className="flex h-screen overflow-hidden bg-background" onClick={handleInteraction}>
      <ThemeBackground />
      
      {isLandscapeOnMobile && showLandscapeHint && (
        <div className="pointer-events-auto fixed top-3 left-1/2 -translate-x-1/2 z-[60] px-3 py-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur text-xs text-muted-foreground flex items-center gap-2">
          <Maximize2 className="w-3.5 h-3.5 text-primary rotate-90" />
          <span>{lang === 'ru' ? 'Оптимально в портретном режиме' : 'Portrait gives best experience'}</span>
          <button
            onClick={() => setShowLandscapeHint(false)}
            aria-label="Dismiss orientation hint"
            className="ml-1 p-1 rounded hover:bg-white/10 text-foreground/70"
          >
            ×
          </button>
        </div>
      )}

      {!isMobile && user && (effectiveNavTheme !== 'crossroads' || effectiveCrossroadsSidebarMode === 'show') && (
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} userId={user.id} />
      )}

      {isMobile && user && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64 bg-[hsl(var(--sidebar))] border-r border-border/40">
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} userId={user.id} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {user && (
          <Header 
            title={pageTitle} 
            userName={user.displayName || user.email} 
            userArchetype={user.archetype}
            userTradition={user.tradition}
            onMenuClick={isMobile ? () => setIsSidebarOpen(true) : undefined}
            onCrossroads={effectiveNavTheme === 'crossroads' ? () => handleNavigate('crossroads') : undefined}
          />
        )}
        <FloatingLanguageSwitcher />

        <main className={`flex-1 ${currentPage === 'altars' || currentPage === 'forum' || currentPage === 'knowledge-graph' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
          <Suspense fallback={<PageLoader />}>
            {currentPage === 'dashboard' && <Pages.Dashboard user={user} onNavigate={(p) => handleNavigate(p as Page)} />}
            {currentPage === 'altars' && (
              <RouteErrorBoundary
                fallback={({ reset }) => (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-5 space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        {lang === 'ru' ? 'Алтарь временно недоступен' : 'Altar temporarily unavailable'}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {lang === 'ru'
                          ? 'Похоже, 3D-сцена перегрузила устройство. Вы можете восстановиться и вернуться на главную.'
                          : 'The 3D scene appears overloaded on this device. You can recover and return to dashboard.'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            reset()
                            recoverFromAltarCrash()
                          }}
                          className="rounded-xl bg-primary/15 border border-primary/30 text-primary px-3 py-2 text-xs font-medium hover:bg-primary/20 transition-colors"
                        >
                          {lang === 'ru' ? 'Сбросить алтарь и выйти' : 'Reset altar and exit'}
                        </button>
                        <button
                          onClick={() => {
                            reset()
                            handleNavigate('dashboard')
                          }}
                          className="rounded-xl border border-border/40 text-foreground px-3 py-2 text-xs font-medium hover:bg-white/5 transition-colors"
                        >
                          {lang === 'ru' ? 'На главную' : 'Go dashboard'}
                        </button>
                        <button
                          onClick={() => {
                            reset()
                            if (typeof window !== 'undefined') {
                              window.location.reload()
                            }
                          }}
                          className="rounded-xl border border-border/40 text-foreground px-3 py-2 text-xs font-medium hover:bg-white/5 transition-colors"
                        >
                          {lang === 'ru' ? 'Перезагрузить' : 'Reload'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              >
                <Pages.Altars user={user} />
              </RouteErrorBoundary>
            )}
            {currentPage === 'ai-mentor' && <Pages.AIMentor user={user} />}
            {currentPage === 'ritual-tracker' && <Pages.RitualTracker user={user} />}
            {currentPage === 'sigil-lab' && <Pages.SigilLab user={user} />}
            {currentPage === 'divination' && <Pages.DivinationLab user={user} />}
            {currentPage === 'journal' && <Pages.Journal user={user} />}
            {currentPage === 'forum' && <Pages.ForumPage user={user} />}
            {currentPage === 'marketplace' && <Pages.Marketplace />}
            {currentPage === 'settings' && <Pages.Settings user={user} />}
            {currentPage === 'knowledge-graph' && <div className="flex-1 p-4 overflow-hidden"><Pages.KnowledgeGraph user={user} /></div>}
            {currentPage === 'chakra-intelligence' && <Pages.ChakraIntelligence onBack={() => handleNavigate('dashboard')} />}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

import { HecateCrossroads } from './pages/HecateCrossroads'
import AuthForm from './components/AuthForm';

function LandingPage() {
  const { lang, setLang } = useLang()
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async () => {
    if (isSigningIn) return
    setAuthError(null)
    setIsSigningIn(true)

    const rawRedirect = (import.meta.env as any).VITE_AUTH_REDIRECT_URL?.trim()
    const hasPlaceholder = !!rawRedirect && (rawRedirect.includes('<') || rawRedirect.includes('>'))

    if (hasPlaceholder) {
      setAuthError(
        lang === 'ru'
          ? 'VITE_AUTH_REDIRECT_URL содержит шаблон. Укажи реальный URL, например: https://your-domain.vercel.app/'
          : 'VITE_AUTH_REDIRECT_URL contains a placeholder. Set a real URL, e.g. https://your-domain.vercel.app/'
      )
      setIsSigningIn(false)
      return
    }

    const normalizeRedirect = (candidate: string) => {
      const parsed = new URL(candidate, window.location.origin)
      parsed.pathname = '/'
      parsed.search = ''
      parsed.hash = ''
      return parsed.toString()
    }

    let redirectTo = `${window.location.origin}/`
    if (rawRedirect) {
      try {
        const parsed = new URL(rawRedirect)
        // Prevent stale deploy domains or hash routes from breaking OAuth callback flow.
        if (parsed.origin === window.location.origin) {
          redirectTo = normalizeRedirect(rawRedirect)
        } else {
          console.warn('Ignoring VITE_AUTH_REDIRECT_URL with different origin:', parsed.origin)
        }
      } catch {
        redirectTo = normalizeRedirect(rawRedirect)
      }
    }

    try {
      // Validate URL format early so user gets a clear error before OAuth request.
      new URL(redirectTo)
    } catch {
      setAuthError(
        lang === 'ru'
          ? `Некорректный VITE_AUTH_REDIRECT_URL: ${redirectTo}`
          : `Invalid VITE_AUTH_REDIRECT_URL: ${redirectTo}`
      )
      setIsSigningIn(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      })

      if (error) {
        throw error
      }

      if (!data?.url) {
        throw new Error('OAuth URL was not returned by Supabase')
      }

      window.location.assign(data.url)
    } catch (error: any) {
      console.error('Login error:', error)
      setAuthError(
        lang === 'ru'
          ? `Не удалось начать вход: ${error?.message || 'неизвестная ошибка'}`
          : `Failed to start sign-in: ${error?.message || 'unknown error'}`
      )
      setIsSigningIn(false)
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
            ? '3D-Алтари · ИИ Наставник · Трекер ритуалов · Лаборатория сигил · Дневник снов · Паутина знаний · Форум · Система прогрессии'
            : 'Digital Altars · AI Mentor · Ritual Tracker · Sigil Lab · Dream Journal · Knowledge Web · Forum · Progression System'
          }
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {[
            { en: 'Archetype AI', ru: 'Архетипный ИИ', emoji: '🤖' },
            { en: 'Moon Phases', ru: 'Фазы Луны', emoji: '🌙' },
            { en: '3D Altars', ru: '3D Алтари', emoji: '🕯️' },
            { en: 'Sigil Lab', ru: 'Лаборатория Сигил', emoji: '✨' },
            { en: 'Knowledge Web', ru: 'Паутина знаний', emoji: '🕸' },
            { en: 'Dream Journal', ru: 'Дневник снов', emoji: '📓' },
            { en: 'Forum', ru: 'Форум', emoji: '💬' },
            { en: 'Progression & XP', ru: 'Прогрессия и XP', emoji: '📈' },
            { en: 'EN / RU', ru: 'EN / RU', emoji: '🌐' },
          ].map(chip => (
            <div key={chip.en} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
              <span>{chip.emoji}</span>
              <span>{lang === 'ru' ? chip.ru : chip.en}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-6 mb-6">
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="group relative px-10 py-4 rounded-2xl bg-gradient-to-r from-primary to-[hsl(267,60%,45%)] text-white font-semibold text-sm tracking-wider hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
          >
            <span className="relative z-10 font-cinzel tracking-widest">
              {isSigningIn
                ? (lang === 'ru' ? 'ПЕРЕНАПРАВЛЕНИЕ...' : 'REDIRECTING...')
                : (lang === 'ru' ? 'ВОЙТИ В СИСТЕМУ' : 'ENTER THE SYSTEM')}
            </span>
          </button>
          <div className="w-full max-w-xs mx-auto">
            <AuthForm />
          </div>
        </div>

        {authError && (
          <p className="mt-4 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 inline-block max-w-md">
            {authError}
          </p>
        )}

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
  return <AppContent />
}

export default App
