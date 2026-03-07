import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Plus, Trash2, Settings2, Maximize2, Minimize2, List, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'
import { useLang } from '../contexts/LanguageContext'
import { useAudio } from '../contexts/AudioContext'
import { useIsMobile } from '../hooks/use-mobile'
import { AltarScene3D } from '../altar/AltarScene3D'
import { ObjectPanel } from '../altar/ObjectPanel'
import { RitualPanel } from '../altar/RitualPanel'
import { ProgressionPanel } from '../altar/ProgressionPanel'
import { CATALOG } from '../altar/catalog'
import {
  loadLocalState,
  saveLocalState,
  createDefaultLayout,
  addObjectToLayout,
  updateObjectInLayout,
  removeObjectFromLayout,
  completeRitual,
  addProgressPoints,
  ACTION_POINTS,
  syncProgressionToDb,
  loadProgressionFromDb,
} from '../altar/altarStore'
import type { AltarLayout, AltarTheme, PlacedObject, RitualSession, Progression } from '../altar/types'

const ALTAR_THEMES_LIST: AltarTheme[] = ['stone', 'wood', 'obsidian', 'mystical']
type AltarVisualPreset = 'soft' | 'cinematic'

interface AltarsProps {
  user: { id: string; displayName?: string | null; email?: string }
}

const DEFAULT_SESSION: RitualSession = {
  active: false,
  mode: 'soft',
  durationMinutes: 30,
  startTime: null,
  elapsed: 0,
  completed: false,
  interrupted: false,
}

export function Altars({ user }: AltarsProps) {
  const { lang } = useLang()
  const { playUiSound } = useAudio()
  const isMobile = useIsMobile()

  const [layouts, setLayouts] = useState<AltarLayout[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null)
  const [pendingDrop, setPendingDrop] = useState<string | null>(null)
  const [session, setSession] = useState<RitualSession>(DEFAULT_SESSION)
  const [progression, setProgression] = useState<Progression>({
    points: 0, level: 1, streak: 0, lastPracticeDate: null, totalRituals: 0,
    ritualXp: 0, journalXp: 0, knowledgeXp: 0, altarXp: 0,
  })
  const [lastPoints, setLastPoints] = useState(0)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTheme, setNewTheme] = useState<AltarTheme>('mystical')
  const [activeTab, setActiveTab] = useState<'objects' | 'ritual' | 'progress'>('objects')
  const [fullscreen, setFullscreen] = useState(false)
  const [showAltarList, setShowAltarList] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [visualPreset, setVisualPreset] = useState<AltarVisualPreset>('cinematic')
  const [hydrated, setHydrated] = useState(false)
  const [safeRenderMode, setSafeRenderMode] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const altarBackdropStyle = useMemo(() => ({
    backgroundImage: visualPreset === 'cinematic'
      ? (isMobile
        ? "radial-gradient(120% 70% at 50% 35%, rgba(116, 88, 202, 0.18) 0%, rgba(5, 8, 24, 0) 58%), linear-gradient(180deg, rgba(4, 7, 22, 0.38) 0%, rgba(4, 7, 22, 0.62) 62%, rgba(4, 7, 22, 0.84) 100%), url('/altar-background.jpg')"
        : "radial-gradient(100% 68% at 50% 32%, rgba(118, 92, 208, 0.14) 0%, rgba(5, 7, 22, 0) 60%), linear-gradient(rgba(3, 6, 20, 0.38), rgba(3, 6, 20, 0.68)), url('/altar-background.jpg')")
      : (isMobile
        ? "radial-gradient(110% 66% at 50% 32%, rgba(96, 146, 220, 0.12) 0%, rgba(5, 8, 24, 0) 62%), linear-gradient(180deg, rgba(5, 8, 22, 0.3) 0%, rgba(5, 8, 22, 0.54) 64%, rgba(5, 8, 22, 0.74) 100%), url('/altar-background.jpg')"
        : "radial-gradient(96% 62% at 50% 30%, rgba(96, 146, 220, 0.1) 0%, rgba(5, 8, 24, 0) 64%), linear-gradient(rgba(4, 7, 20, 0.3), rgba(4, 7, 20, 0.58)), url('/altar-background.jpg')"),
    backgroundSize: isMobile ? '170% auto' : '122% auto',
    backgroundPosition: isMobile ? '50% 20%' : '50% 16%',
    backgroundRepeat: 'no-repeat',
  }), [isMobile, visualPreset])

  // ── Load state ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const local = loadLocalState()
    setLayouts(local.layouts)
    setActiveId(local.activeLayoutId)
    setProgression(local.progression)
    loadProgressionFromDb(user.id).then(dbProg => {
      if (dbProg) {
        setProgression(prev => {
          const points = Math.max(prev.points, dbProg.points)
          return {
            points,
            level: Math.max(prev.level, dbProg.level),
            streak: Math.max(prev.streak, dbProg.streak),
            lastPracticeDate: prev.lastPracticeDate || dbProg.lastPracticeDate,
            totalRituals: Math.max(prev.totalRituals, dbProg.totalRituals),
            ritualXp: Math.max(prev.ritualXp, dbProg.ritualXp),
            journalXp: Math.max(prev.journalXp, dbProg.journalXp),
            knowledgeXp: Math.max(prev.knowledgeXp, dbProg.knowledgeXp),
            altarXp: Math.max(prev.altarXp, dbProg.altarXp),
          }
        })
      }
    })
    setHydrated(true)
  }, [user.id])

  useEffect(() => {
    if (!hydrated) return
    saveLocalState({ layouts, activeLayoutId: activeId, progression })
  }, [layouts, activeId, progression, hydrated])

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (session.active && !session.completed && !session.interrupted) {
      timerRef.current = setInterval(() => {
        setSession(s => ({ ...s, elapsed: s.elapsed + 1 }))
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session.active, session.completed, session.interrupted])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const activeLayout = layouts.find(l => l.id === activeId) ?? null
  const selectedObj = activeLayout?.objects.find(o => o.id === selectedObjId)
  const selectedCatalog = selectedObj ? CATALOG.find(c => c.id === selectedObj.catalogId) : null
  const ritualProgress = session.active ? session.elapsed / (session.durationMinutes * 60) : 0
  const objectCount = activeLayout?.objects.length || 0
  const autoSafeRender = isMobile || objectCount >= 14 || safeRenderMode

  const handleSceneContextLost = useCallback(() => {
    setSafeRenderMode(true)
    toast.error(lang === 'ru' ? 'Включен облегченный режим алтаря' : 'Switched altar to safe render mode')
  }, [lang])

  // ── Layout mutations ────────────────────────────────────────────────────────
  function updateLayout(updated: AltarLayout) {
    setLayouts(l => l.map(x => x.id === updated.id ? updated : x))
  }

  function createLayout() {
    if (!newName.trim()) return
    playUiSound('success')
    const layout = createDefaultLayout(newName.trim(), newTheme)
    setLayouts(prev => [...prev, layout])
    setActiveId(layout.id)
    setProgression(prev => addProgressPoints(prev, ACTION_POINTS.createAltar, 'altar').progression)
    setShowCreateForm(false)
    setShowAltarList(false)
    setNewName('')
    toast.success(lang === 'ru' ? 'Алтарь создан' : 'Altar created')
  }

  function deleteLayout(id: string) {
    playUiSound('click')
    setLayouts(l => l.filter(x => x.id !== id))
    if (activeId === id) setActiveId(null)
    toast.success(lang === 'ru' ? 'Алтарь удалён' : 'Altar deleted')
  }

  function changeTheme(theme: AltarTheme) {
    if (!activeLayout) return
    playUiSound('success')
    updateLayout({ ...activeLayout, theme })
    setShowThemeMenu(false)
  }

  // ── Object interactions ─────────────────────────────────────────────────────
  function handleDropPlaced(pos: [number, number, number]) {
    if (!pendingDrop || !activeLayout) return
    const cat = CATALOG.find(c => c.id === pendingDrop)
    const isFirstObject = activeLayout.objects.length === 0
    const placed: PlacedObject = {
      id: `placed_${Date.now()}`,
      catalogId: pendingDrop,
      position: [
        Math.max(-0.85, Math.min(0.85, pos[0])),
        0.05,
        Math.max(-0.5, Math.min(0.5, pos[2])),
      ],
      rotationY: Math.random() * Math.PI * 2,
      scale: 1,
    }
    playUiSound('bell')
    updateLayout(addObjectToLayout(activeLayout, placed))
    setProgression(prev => {
      const reward = ACTION_POINTS.placeObjectBase + (cat?.points || 0) * 0.35 + (isFirstObject ? ACTION_POINTS.placeFirstObject : 0)
      return addProgressPoints(prev, reward, 'altar').progression
    })
    setPendingDrop(null)
    toast.success(lang === 'ru' ? 'Объект размещён' : 'Object placed', { duration: 1500 })
  }

  function handleObjectMoved(id: string, newPos: [number, number, number]) {
    if (!activeLayout) return
    const obj = activeLayout.objects.find(o => o.id === id)
    if (!obj) return
    updateLayout(updateObjectInLayout(activeLayout, { ...obj, position: newPos }))
  }

  function handleDeleteSelected() {
    if (!activeLayout || !selectedObjId) return
    playUiSound('click')
    updateLayout(removeObjectFromLayout(activeLayout, selectedObjId))
    setProgression(prev => addProgressPoints(prev, ACTION_POINTS.deleteObject, 'altar').progression)
    setSelectedObjId(null)
    toast.success(lang === 'ru' ? 'Объект удалён' : 'Object removed', { duration: 1200 })
  }

  function rotateSelected() {
    if (!activeLayout || !selectedObjId) return
    const obj = activeLayout.objects.find(o => o.id === selectedObjId)
    if (!obj) return
    playUiSound('hover')
    updateLayout(updateObjectInLayout(activeLayout, { ...obj, rotationY: obj.rotationY + Math.PI / 4 }))
  }

  function scaleSelected(delta: number) {
    if (!activeLayout || !selectedObjId) return
    const obj = activeLayout.objects.find(o => o.id === selectedObjId)
    if (!obj) return
    const newScale = Math.max(0.4, Math.min(3.0, obj.scale + delta))
    playUiSound('hover')
    updateLayout(updateObjectInLayout(activeLayout, { ...obj, scale: newScale }))
  }

  // ── Ritual handlers ─────────────────────────────────────────────────────────
  const handleStartRitual = useCallback((durationMinutes: number, mode: 'soft' | 'strict') => {
    playUiSound('bell')
    setSession({ active: true, mode, durationMinutes, startTime: Date.now(), elapsed: 0, completed: false, interrupted: false })
    setActiveTab('ritual')
    toast.success(lang === 'ru' ? '✦ Ритуал начат' : '✦ Ritual begun', { duration: 2000 })
  }, [lang, playUiSound])

  const handleCompleteRitual = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const {
      progression: newProg,
      pointsEarned,
      bonusMultiplier,
      basePoints,
      streakMultiplier,
      modeMultiplier,
    } = completeRitual(progression, session.durationMinutes, session.mode)
    setProgression(newProg)
    setLastPoints(pointsEarned)
    syncProgressionToDb(user.id, newProg)
    setSession(s => ({ ...s, active: false, completed: true }))
    playUiSound('success')
    const breakdown = lang === 'ru'
      ? `база ${basePoints} × серия ${streakMultiplier.toFixed(2)} × режим ${modeMultiplier.toFixed(2)}`
      : `base ${basePoints} × streak ${streakMultiplier.toFixed(2)} × mode ${modeMultiplier.toFixed(2)}`
    const msg = bonusMultiplier > 1
      ? (lang === 'ru' ? `✦ Завершено! +${pointsEarned} очков (${breakdown})` : `✦ Completed! +${pointsEarned} pts (${breakdown})`)
      : (lang === 'ru' ? `✦ Завершено! +${pointsEarned} очков (${breakdown})` : `✦ Completed! +${pointsEarned} pts (${breakdown})`)
    toast.success(msg, { duration: 4000 })
  }, [progression, session.durationMinutes, session.mode, user.id, lang, playUiSound])

  const handleInterrupt = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSession(s => ({ ...s, active: false, interrupted: true }))
    playUiSound('error')
    toast.error(lang === 'ru' ? 'Сессия прервана' : 'Session interrupted', { duration: 2000 })
  }, [lang, playUiSound])

  function resetSession() {
    setSession(DEFAULT_SESSION)
    setLastPoints(0)
  }

  // Strict mode enforces offline focus: leaving the page interrupts ritual.
  useEffect(() => {
    if (!session.active || session.mode !== 'strict') return

    const handleVisibility = () => {
      if (document.hidden) {
        handleInterrupt()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [session.active, session.mode, handleInterrupt])

  // ── Translations ────────────────────────────────────────────────────────────
  const t = {
    myAltars:     lang === 'ru' ? 'Мои Алтари'                        : 'My Altars',
    create:       lang === 'ru' ? 'Создать алтарь'                    : 'Create Altar',
    altarName:    lang === 'ru' ? 'Название алтаря...'                : 'Altar name...',
    save:         lang === 'ru' ? 'Создать'                           : 'Create',
    cancel:       lang === 'ru' ? 'Отмена'                            : 'Cancel',
    noAltars:     lang === 'ru' ? 'Нет алтарей'                       : 'No altars yet',
    selectAltar:  lang === 'ru' ? 'Выберите или создайте алтарь'      : 'Select or create an altar',
    objects:      lang === 'ru' ? 'Объекты'                           : 'Objects',
    ritual:       lang === 'ru' ? 'Ритуал'                            : 'Ritual',
    progress:     lang === 'ru' ? 'Прогресс'                          : 'Progress',
    clickToPlace: lang === 'ru' ? 'Нажмите на алтарь для размещения'  : 'Click altar to place',
    selected:     lang === 'ru' ? 'Выбрано:'                          : 'Selected:',
    delete:       lang === 'ru' ? 'Удалить'                           : 'Delete',
    rotate:       lang === 'ru' ? 'Повернуть'                         : 'Rotate',
    scaleUp:      lang === 'ru' ? 'Больше'                            : 'Bigger',
    scaleDown:    lang === 'ru' ? 'Меньше'                            : 'Smaller',
    list:         lang === 'ru' ? 'Список'                            : 'List',
  }

  // ── Altar list sidebar ──────────────────────────────────────────────────────
  const renderAltarList = () => (
    <div className={cn(
      'flex flex-col bg-background/95 backdrop-blur-md border-border/30',
      isMobile ? 'absolute inset-0 z-50' : 'w-56 border-r h-full shrink-0',
    )}>
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/30 shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.myAltars}</h2>
        {isMobile && (
          <button onClick={() => setShowAltarList(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layouts.map(l => (
          <div
            key={l.id}
            onClick={() => { setActiveId(l.id); if (isMobile) setShowAltarList(false) }}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors border',
              l.id === activeId
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'border-transparent hover:bg-white/5 text-foreground/80',
            )}
          >
            <span className="flex-1 truncate">{l.name}</span>
            <button
              onClick={e => { e.stopPropagation(); deleteLayout(l.id) }}
              className={cn(
                'p-0.5 rounded text-muted-foreground hover:text-destructive transition-all shrink-0',
                isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {layouts.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-8">{t.noAltars}</p>
        )}
      </div>

      <div className="p-2 border-t border-border/30 shrink-0">
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.create}
        </button>
      </div>
    </div>
  )

  // ── Create form modal ───────────────────────────────────────────────────────
  const renderCreateForm = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-background border border-border/40 rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">{t.create}</h3>
        <input
          type="text"
          placeholder={t.altarName}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createLayout()}
          className="w-full px-3 py-2.5 rounded-xl border border-border/40 text-sm outline-none focus:border-primary/50 bg-white/5 transition-colors"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-2">
          {ALTAR_THEMES_LIST.map(theme => (
            <button
              key={theme}
              onClick={() => setNewTheme(theme)}
              className={cn(
                'px-3 py-2 rounded-xl text-sm border transition-colors capitalize',
                newTheme === theme
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-white/5 border-border/30 text-muted-foreground hover:bg-primary/10',
              )}
            >
              {theme}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={createLayout}
            disabled={!newName.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {t.save}
          </button>
          <button
            onClick={() => { setShowCreateForm(false); setNewName('') }}
            className="flex-1 py-2.5 rounded-xl border border-border/40 text-sm hover:bg-white/5 transition-colors"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Right panel with tabs ───────────────────────────────────────────────────
  const renderRightPanel = () => (
    <div className={cn(
      'flex-shrink-0 flex flex-col border-border/30 bg-background/50 backdrop-blur-sm overflow-hidden',
      isMobile ? 'w-full border-t h-60' : 'w-64 border-l h-full',
    )}>
      {/* Tab bar */}
      <div className="flex border-b border-border/30 shrink-0">
        {(['objects', 'ritual', 'progress'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab === 'objects' ? t.objects : tab === 'ritual' ? t.ritual : t.progress}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'objects' && (
          <ObjectPanel
            lang={lang as 'en' | 'ru'}
            unlockedLevel={progression.level}
            pendingDrop={pendingDrop}
            onSelectForDrop={setPendingDrop}
          />
        )}
        {activeTab === 'ritual' && (
          <RitualPanel
            lang={lang as 'en' | 'ru'}
            session={session}
            onStart={handleStartRitual}
            onComplete={handleCompleteRitual}
            onInterrupt={handleInterrupt}
          />
        )}
        {activeTab === 'progress' && (
          <ProgressionPanel
            lang={lang as 'en' | 'ru'}
            progression={progression}
            lastPointsEarned={lastPoints}
          />
        )}
      </div>
    </div>
  )

  // ── Active altar view ───────────────────────────────────────────────────────
  const renderAltarView = () => (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-background/80 backdrop-blur-sm shrink-0">
        {/* Mobile: open altar list */}
        {isMobile && (
          <button
            onClick={() => setShowAltarList(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
        )}

        <span className="text-sm font-medium text-foreground truncate flex-1">{activeLayout!.name}</span>

        <button
          onClick={() => setShowCreateForm(true)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors"
          title={lang === 'ru' ? 'Создать новый алтарь' : 'Create new altar'}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => deleteLayout(activeLayout!.id)}
          className="p-1.5 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
          title={lang === 'ru' ? 'Удалить текущий алтарь' : 'Delete current altar'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1 bg-white/5 border border-border/20 rounded-lg p-0.5">
          <button
            onClick={() => { setVisualPreset('soft'); playUiSound('click') }}
            className={cn(
              'px-2 py-1 text-[10px] rounded-md transition-colors',
              visualPreset === 'soft' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            title={lang === 'ru' ? 'Мягкий мистический пресет' : 'Soft mystical preset'}
          >
            Soft
          </button>
          <button
            onClick={() => { setVisualPreset('cinematic'); playUiSound('click') }}
            className={cn(
              'px-2 py-1 text-[10px] rounded-md transition-colors',
              visualPreset === 'cinematic' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            title={lang === 'ru' ? 'Кинематографичный ритуальный пресет' : 'Cinematic ritual preset'}
          >
            Cine
          </button>
        </div>

        {/* Theme picker */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(v => !v)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs bg-white/5 border border-border/20 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="w-3 h-3" />
            {!isMobile && <span className="capitalize">{activeLayout!.theme}</span>}
          </button>
          {showThemeMenu && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-background border border-border/30 rounded-xl shadow-2xl p-1 min-w-[130px]">
              {ALTAR_THEMES_LIST.map(th => (
                <button
                  key={th}
                  onClick={() => changeTheme(th)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-xs text-left transition-colors capitalize',
                    activeLayout!.theme === th
                      ? 'bg-primary/15 text-primary'
                      : 'hover:bg-white/5 text-foreground/80',
                  )}
                >
                  {th}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setFullscreen(v => !v)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors"
        >
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Drop hint */}
      {pendingDrop && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-primary/90 text-primary-foreground text-xs px-4 py-2 rounded-full shadow-lg pointer-events-none">
          {t.clickToPlace}
        </div>
      )}

      {/* Selected object toolbar */}
      {selectedObj && !session.active && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 flex-wrap justify-center bg-background/95 backdrop-blur-sm border border-border/30 rounded-2xl px-3 py-2 shadow-2xl max-w-[95vw]">
          <span className="text-xs text-muted-foreground">{t.selected}</span>
          <span className="text-xs font-medium text-foreground">{selectedCatalog?.label ?? ''}</span>
          <div className="w-px h-4 bg-border/40 mx-0.5" />
          <button onClick={rotateSelected}           className="px-2 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-foreground/80 transition-colors">{t.rotate}</button>
          <button onClick={() => scaleSelected(0.1)}  className="px-2 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-foreground/80 transition-colors">{t.scaleUp}</button>
          <button onClick={() => scaleSelected(-0.1)} className="px-2 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-foreground/80 transition-colors">{t.scaleDown}</button>
          <div className="w-px h-4 bg-border/40 mx-0.5" />
          <button onClick={handleDeleteSelected} className="px-2 py-1 rounded-lg text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors">{t.delete}</button>
        </div>
      )}

      {/* 3D Scene */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={altarBackdropStyle}
        />
        <div className="relative z-10 h-full">
          <AltarScene3D
            layout={activeLayout!}
            visualPreset={visualPreset}
            renderQuality={autoSafeRender ? 'safe' : 'high'}
            selectedId={selectedObjId}
            ritualActive={session.active}
            ritualProgress={ritualProgress}
            pendingDrop={pendingDrop}
            onSelect={setSelectedObjId}
            onObjectMoved={handleObjectMoved}
            onDropPlaced={handleDropPlaced}
            onContextLost={handleSceneContextLost}
          />
        </div>
      </div>
    </>
  )

  // ── Empty state ─────────────────────────────────────────────────────────────
  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm text-muted-foreground/70 text-center">{t.selectAltar}</p>
      <button
        onClick={() => setShowCreateForm(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t.create}
      </button>
    </div>
  )

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden bg-background relative">
      {/* Sidebar: always visible on desktop, slide-over on mobile */}
      {!isMobile && renderAltarList()}
      {isMobile && showAltarList && renderAltarList()}

      {/* Content area */}
      <div className={cn(
        'flex flex-1 overflow-hidden',
        isMobile || fullscreen ? 'flex-col' : 'flex-row',
      )}>
        {/* Center: scene or empty state */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
          {activeLayout ? renderAltarView() : renderEmptyState()}
        </div>

        {/* Right panel: only when altar selected and not fullscreen */}
        {activeLayout && !fullscreen && renderRightPanel()}
      </div>

      {/* Create form overlay */}
      {showCreateForm && renderCreateForm()}
    </div>
  )
}
