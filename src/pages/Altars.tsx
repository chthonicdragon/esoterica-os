import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Trash2, Settings2, RotateCcw, Maximize2, Minimize2, List } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'
import { useLang } from '../contexts/LanguageContext'
import { useAudio } from '../contexts/AudioContext'
import { useIsMobile } from '../hooks/use-mobile'
import { AltarScene3D } from '../altar/AltarScene3D'
import { ObjectPanel } from '../altar/ObjectPanel'
import { RitualPanel } from '../altar/RitualPanel'
import { ProgressionPanel } from '../altar/ProgressionPanel'
import { CATALOG, ALTAR_THEMES } from '../altar/catalog'
import {
  loadLocalState,
  saveLocalState,
  createDefaultLayout,
  addObjectToLayout,
  updateObjectInLayout,
  removeObjectFromLayout,
  completeRitual,
  syncProgressionToDb,
  loadProgressionFromDb,
} from '../altar/altarStore'
import type { AltarLayout, AltarTheme, PlacedObject, RitualSession, Progression } from '../altar/types'

const ALTAR_THEMES_LIST: AltarTheme[] = ['stone', 'wood', 'obsidian', 'mystical']

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
  const [progression, setProgression] = useState<Progression>({ points: 0, level: 1, streak: 0, lastPracticeDate: null, totalRituals: 0 })
  const [lastPoints, setLastPoints] = useState(0)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTheme, setNewTheme] = useState<AltarTheme>('mystical')
  const [activeTab, setActiveTab] = useState<'objects' | 'ritual' | 'progress'>('objects')
  const [fullscreen, setFullscreen] = useState(false)
  const [showAltarList, setShowAltarList] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  // Load state on mount
  useEffect(() => {
    const local = loadLocalState()
    setLayouts(local.layouts)
    setActiveId(local.activeLayoutId)
    setProgression(local.progression)

    // Also sync from DB
    loadProgressionFromDb(user.id).then(dbProg => {
      if (dbProg) setProgression(dbProg)
    })
  }, [user.id])

  // Save whenever layouts or progression change
  useEffect(() => {
    saveLocalState({ layouts, activeLayoutId: activeId, progression })
  }, [layouts, activeId, progression])

  // Ritual timer tick
  useEffect(() => {
    if (session.active && !session.completed && !session.interrupted) {
      timerRef.current = setInterval(() => {
        setSession(s => ({ ...s, elapsed: s.elapsed + 1 }))
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session.active, session.completed, session.interrupted])

  // Strict mode: detect page visibility change
  useEffect(() => {
    if (!session.active || session.mode !== 'strict') return
    const handler = () => {
      if (document.hidden) {
        handleInterrupt()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [session.active, session.mode])

  const activeLayout = layouts.find(l => l.id === activeId) || null

  function createLayout() {
    if (!newName.trim()) return
    playUiSound('success')
    const layout = createDefaultLayout(newName.trim(), newTheme)
    const updated = [...layouts, layout]
    setLayouts(updated)
    setActiveId(layout.id)
    setShowCreateForm(false)
    setNewName('')
    toast.success(lang === 'ru' ? 'Алтарь создан' : 'Altar created')
  }

  function deleteLayout(id: string) {
    playUiSound('click')
    setLayouts(l => l.filter(x => x.id !== id))
    if (activeId === id) setActiveId(null)
    toast.success(lang === 'ru' ? 'Алтарь удалён' : 'Altar deleted')
  }

  function updateLayout(updated: AltarLayout) {
    setLayouts(l => l.map(x => x.id === updated.id ? updated : x))
  }

  function handleDropPlaced(pos: [number, number, number]) {
    if (!pendingDrop || !activeLayout) return

    // Clamp to altar surface bounds
    const clampedX = Math.max(-0.85, Math.min(0.85, pos[0]))
    const clampedZ = Math.max(-0.5, Math.min(0.5, pos[2]))

    const placed: PlacedObject = {
      id: `placed_${Date.now()}`,
      catalogId: pendingDrop,
      position: [clampedX, 0.05, clampedZ],
      rotationY: Math.random() * Math.PI * 2,
      scale: 1,
    }
    playUiSound('bell')
    updateLayout(addObjectToLayout(activeLayout, placed))
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
    setSelectedObjId(null)
    toast.success(lang === 'ru' ? 'Объект удалён' : 'Object removed', { duration: 1200 })
  }

  function rotateSelected() {
    if (!activeLayout || !selectedObjId) return
    const obj = activeLayout.objects.find(o => o.id === selectedObjId)
    if (!obj) return
    playUiSound('hover')
    updateLayout(updateObjectInLayout(activeLayout, {
      ...obj,
      rotationY: obj.rotationY + Math.PI / 4,
    }))
  }

  function scaleSelected(delta: number) {
    if (!activeLayout || !selectedObjId) return
    const obj = activeLayout.objects.find(o => o.id === selectedObjId)
    if (!obj) return
    const newScale = Math.max(0.4, Math.min(3.0, obj.scale + delta))
    playUiSound('hover')
    updateLayout(updateObjectInLayout(activeLayout, { ...obj, scale: newScale }))
  }

  function changeTheme(theme: AltarTheme) {
    if (!activeLayout) return
    playUiSound('success')
    updateLayout({ ...activeLayout, theme })
    setShowThemeMenu(false)
  }

  const handleStartRitual = useCallback((durationMinutes: number, mode: 'soft' | 'strict') => {
    playUiSound('bell')
    setSession({
      active: true,
      mode,
      durationMinutes,
      startTime: Date.now(),
      elapsed: 0,
      completed: false,
      interrupted: false,
    })
    setActiveTab('ritual')
    toast.success(lang === 'ru' ? '✦ Ритуал начат' : '✦ Ritual begun', { duration: 2000 })
  }, [lang])

  const handleCompleteRitual = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    // Award points
    const { progression: newProg, pointsEarned, bonusMultiplier } = completeRitual(progression, session.durationMinutes)
    setProgression(newProg)
    setLastPoints(pointsEarned)
    syncProgressionToDb(user.id, newProg)

    setSession(s => ({ ...s, active: false, completed: true }))
    playUiSound('success')

    const msg = bonusMultiplier > 1
      ? (lang === 'ru' ? `✦ Завершено! +${pointsEarned} очков (x${bonusMultiplier} бонус)` : `✦ Completed! +${pointsEarned} pts (x${bonusMultiplier} bonus)`)
      : (lang === 'ru' ? `✦ Завершено! +${pointsEarned} очков` : `✦ Completed! +${pointsEarned} pts`)
    toast.success(msg, { duration: 4000 })
  }, [progression, session.durationMinutes, user.id, lang])

  const handleInterrupt = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSession(s => ({ ...s, active: false, interrupted: true }))
    playUiSound('error')
    toast.error(lang === 'ru' ? 'Сессия прервана' : 'Session interrupted', { duration: 2000 })
  }, [lang])

  function resetSession() {
    setSession(DEFAULT_SESSION)
    setLastPoints(0)
  }

  const ritualProgress = session.active
    ? session.elapsed / (session.durationMinutes * 60)
    : 0

  const selectedObj = activeLayout?.objects.find(o => o.id === selectedObjId)
  const selectedCatalog = selectedObj ? CATALOG.find(c => c.id === selectedObj.catalogId) : null

  const t = {
    myAltars: lang === 'ru' ? 'Мои Алтари' : 'My Altars',
    create: lang === 'ru' ? 'Создать алтарь' : 'Create Altar',
    altarName: lang === 'ru' ? 'Название...' : 'Altar name...',
    theme: lang === 'ru' ? 'Тема' : 'Theme',
    save: lang === 'ru' ? 'Создать' : 'Create',
    cancel: lang === 'ru' ? 'Отмена' : 'Cancel',
    noAltars: lang === 'ru' ? 'Нет алтарей' : 'No altars yet',
    selectAltar: lang === 'ru' ? 'Выберите алтарь' : 'Select an altar',
    objects: lang === 'ru' ? 'Объекты' : 'Objects',
    ritual: lang === 'ru' ? 'Ритуал' : 'Ritual',
    progress: lang === 'ru' ? 'Прогресс' : 'Progress',
    clickToPlace: lang === 'ru' ? 'Нажмите на алтарь для размещения' : 'Click altar to place',
    selected: lang === 'ru' ? 'Выбрано:' : 'Selected:',
    delete: lang === 'ru' ? 'Удалить' : 'Delete',
    rotate: lang === 'ru' ? 'Повернуть' : 'Rotate',
    scaleUp: lang === 'ru' ? 'Больше' : 'Bigger',
    scaleDown: lang === 'ru' ? 'Меньше' : 'Smaller',
    changeTheme: lang === 'ru' ? 'Тема алтаря' : 'Altar Theme',
    list: lang === 'ru' ? 'Список' : 'List',
  }

  const renderAltarList = () => (
    <div className={cn(
      "flex flex-col h-full bg-background/95 backdrop-blur-md transition-all duration-300",
      isMobile ? "absolute inset-0 z-50" : "w-56 border-r border-border/30"
    )}>
      <div className="p-3 border-b border-border/30 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{t.myAltars}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowCreateForm(v => !v)}
            className="p-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {isMobile && (
            <button
              onClick={() => setShowAltarList(false)}
              className="p-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
            >
              <Maximize2 className="w-3.5 h-3.5 rotate-45" />
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="p-3 border-b border-border/30 space-y-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createLayout()}
            placeholder={t.altarName}
            autoFocus
            className="w-full bg-background border border-border/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary/50 text-foreground"
          />
          <select
            value={newTheme}
            onChange={e => setNewTheme(e.target.value as AltarTheme)}
            className="w-full bg-background border border-border/40 rounded-lg px-2.5 py-1.5 text-xs outline-none text-foreground"
          >
            {ALTAR_THEMES_LIST.map(th => (
              <option key={th} value={th}>
                {lang === 'ru' ? ALTAR_THEMES[th].nameRu : ALTAR_THEMES[th].name}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <button onClick={createLayout} className="flex-1 bg-primary text-primary-foreground rounded-lg py-1 text-xs font-medium hover:bg-primary/90">{t.save}</button>
            <button onClick={() => setShowCreateForm(false)} className="px-2 rounded-lg border border-border/40 text-muted-foreground text-xs hover:text-foreground">{t.cancel}</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layouts.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 text-center p-4">{t.noAltars}</p>
        ) : layouts.map(l => (
          <button
            key={l.id}
            onClick={() => { setActiveId(l.id); setSelectedObjId(null); if (isMobile) setShowAltarList(false); playUiSound('click') }}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all group',
              activeId === l.id
                ? 'bg-primary/10 border border-primary/30 text-foreground'
                : 'border border-transparent hover:bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <div>
              <p className="text-xs font-medium truncate max-w-[100px]">{l.name}</p>
              <p className="text-[10px] opacity-60">
                {lang === 'ru' ? ALTAR_THEMES[l.theme]?.nameRu : ALTAR_THEMES[l.theme]?.name}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); deleteLayout(l.id) }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className={cn(
      "flex h-full overflow-hidden bg-background",
      isMobile ? "flex-col" : "flex-row"
    )}>
      {/* Left panel — altar list */}
      {!fullscreen && !isMobile && renderAltarList()}
      {isMobile && showAltarList && renderAltarList()}

      {/* Center — 3D canvas */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeLayout ? (
          <>
            {/* Canvas toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-background/80 backdrop-blur-sm z-10">
              {isMobile && (
                <button
                  onClick={() => setShowAltarList(true)}
                  className="p-1.5 rounded-lg bg-card border border-border/40 text-muted-foreground"
                >
                  <List className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-sm font-cinzel text-foreground/90 flex-1 truncate">{activeLayout.name}</h2>

              {/* Theme picker */}
              <div className="relative">
                <button
                  onClick={() => setShowThemeMenu(v => !v)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border border-border/40 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings2 className="w-3 h-3" />
                  <span className="hidden sm:inline">{t.changeTheme}</span>
                </button>
                {showThemeMenu && (
                  <div className="absolute top-full mt-1 right-0 z-20 bg-card border border-border/50 rounded-xl shadow-lg p-1.5 min-w-[140px]">
                    {ALTAR_THEMES_LIST.map(th => (
                      <button
                        key={th}
                        onClick={() => changeTheme(th)}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                          activeLayout.theme === th
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        )}
                      >
                        {lang === 'ru' ? ALTAR_THEMES[th].nameRu : ALTAR_THEMES[th].name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {session.active && (
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] border animate-pulse',
                  session.mode === 'strict' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-primary/10 border-primary/30 text-primary'
                )}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {isMobile ? 'STR' : (session.mode === 'strict' ? 'STRICT' : 'SOFT')}
                </div>
              )}

              <button
                onClick={() => setFullscreen(v => !v)}
                className="p-1 rounded-lg bg-card border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
              >
                {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Object controls bar (when object selected) */}
            {selectedObjId && selectedCatalog && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border-b border-primary/10 text-xs z-10">
                <span className="text-muted-foreground hidden sm:inline">{t.selected}</span>
                <span className="text-foreground truncate max-w-[80px]">{lang === 'ru' ? selectedCatalog.labelRu : selectedCatalog.label}</span>
                <div className="flex gap-1 ml-auto">
                  <button onClick={rotateSelected} className="p-1.5 rounded-lg bg-card border border-border/40 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => scaleSelected(0.1)} className="px-2.5 py-1 rounded-lg bg-card border border-border/40 hover:border-primary/40 text-sm text-muted-foreground hover:text-foreground transition-colors">+</button>
                  <button onClick={() => scaleSelected(-0.1)} className="px-2.5 py-1 rounded-lg bg-card border border-border/40 hover:border-primary/40 text-sm text-muted-foreground hover:text-foreground transition-colors">−</button>
                  <button onClick={handleDeleteSelected} className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 3D Canvas */}
            <div
              className={cn(
                'flex-1 relative transition-all duration-500',
                isMobile ? 'h-[40vh]' : '',
                session.active && 'ring-1 ring-inset',
                session.active && session.mode === 'strict' ? 'ring-red-500/30' : session.active ? 'ring-primary/30' : ''
              )}
              style={{
                cursor: pendingDrop ? 'crosshair' : 'default',
              }}
            >
              {pendingDrop && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-background/90 border border-[hsl(var(--neon))/40] rounded-full px-3 py-1 text-[10px] text-[hsl(var(--neon))] pointer-events-none">
                  {t.clickToPlace}
                </div>
              )}
              <AltarScene3D
                layout={activeLayout}
                selectedId={selectedObjId}
                ritualActive={session.active}
                ritualProgress={ritualProgress}
                pendingDrop={pendingDrop}
                onSelect={(id) => { setSelectedObjId(id); if (id) { setPendingDrop(null); playUiSound('click') } }}
                onObjectMoved={handleObjectMoved}
                onDropPlaced={handleDropPlaced}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="text-5xl opacity-20">✦</div>
            <p className="text-sm text-muted-foreground/60">{t.selectAltar}</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.create}
            </button>
          </div>
        )}
      </div>

      {/* Right panel — tabs */}
      {!fullscreen && activeLayout && (
        <div className={cn(
          "flex-shrink-0 border-border/30 flex flex-col overflow-hidden transition-all duration-300 bg-background/50 backdrop-blur-sm",
          isMobile ? "w-full border-t h-[45vh]" : "w-64 border-l h-full"
        )}>
          {/* Tab bar */}
          <div className="flex border-b border-border/30">
            {(['objects', 'ritual', 'progress'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); playUiSound('click') }}
                className={cn(
                  'flex-1 py-3 text-[10px] font-semibold transition-colors uppercase tracking-widest',
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'objects' ? t.objects : tab === 'ritual' ? t.ritual : t.progress}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'objects' && (
              <ObjectPanel
                lang={lang}
                unlockedLevel={progression.level}
                pendingDrop={pendingDrop}
                onSelectForDrop={(id) => {
                  setPendingDrop(prev => prev === id ? null : id)
                  setSelectedObjId(null)
                }}
              />
            )}
            {activeTab === 'ritual' && (
              <div className="space-y-3">
                <RitualPanel
                  lang={lang}
                  session={session}
                  onStart={handleStartRitual}
                  onComplete={handleCompleteRitual}
                  onInterrupt={handleInterrupt}
                />
                {(session.completed || session.interrupted) && (
                  <button
                    onClick={resetSession}
                    className="w-full py-2 rounded-xl bg-card border border-border/40 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {lang === 'ru' ? 'Сбросить' : 'Reset'}
                  </button>
                )}
              </div>
            )}
            {activeTab === 'progress' && (
              <ProgressionPanel
                lang={lang}
                progression={progression}
                lastPointsEarned={lastPoints}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
