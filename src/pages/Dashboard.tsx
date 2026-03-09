import React, { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import type { Lang } from '../i18n/translations'
import { getMoonPhase, moonEmoji, moonEnergy, moonEnergyRu } from '../utils/moonPhase'
import { db } from '../lib/platformClient'
import { FlameKindling, Sparkles, BookOpen, Moon, TrendingUp, Star, Zap, MessageSquare, ChevronUp, ChevronDown, Activity, Bell, X, Trophy, Compass } from 'lucide-react'
import { SpiderWebIcon } from '../components/icons/SpiderWebIcon'
import { ProgressionPanel } from '../altar/ProgressionPanel'
import { loadLocalState } from '../altar/altarStore'
import { supabase } from '../lib/supabaseClient'
import { loadGraph } from '../services/knowledgeGraphBridge'
import { ACHIEVEMENTS, getUnlockedAchievements } from '../lib/achievements'
import { eventBus } from '../lib/eventBus'
import {
  clearUnlockNotifications,
  getUnlockNotifications,
  getUnlockUnreadCount,
  markAllUnlockNotificationsRead,
  registerGlobalAnnouncement,
  syncAltarUnlockNotifications,
  unlockNotificationsEvent,
  type UnlockNotification,
} from '../lib/unlockNotifications'

const RELEASE_ANNOUNCEMENT_ID = 'release-2026-03-07'
const RELEASE_ANNOUNCEMENT = {
  title: 'Update: New Altar Content',
  titleRu: 'Обновление: Новый контент алтаря',
  preview: 'Added: notification center, new altar models and categories. Improved: model optimization, placement, render stability, and object interaction.',
  previewRu: 'Добавлено: центр уведомлений, новые модели и категории алтаря. Улучшено: оптимизация моделей, размещение, стабильность рендера и взаимодействие с объектами.',
}

interface Profile {
  initiationLevel: number
  practiceStreak: number
  totalRituals: number
  archetype: string
  displayName?: string
}

interface Ritual {
  id: string
  title: string
  type: string
  createdAt: string
  energyLevel: number
}

interface FeedItem {
  id: string
  icon: string
  label: string
  detail: string
  date: string
  color: string
}

interface DashboardProps {
  user: { id: string; email?: string; displayName?: string }
  onNavigate: (page: string) => void
}

const INITIATION_LEVELS = [
  { level: 1, name: 'Seeker', nameRu: 'Искатель', min: 0 },
  { level: 2, name: 'Apprentice', nameRu: 'Ученик', min: 5 },
  { level: 3, name: 'Practitioner', nameRu: 'Практик', min: 15 },
  { level: 4, name: 'Adept', nameRu: 'Адепт', min: 30 },
  { level: 5, name: 'Initiate', nameRu: 'Посвящённый', min: 60 },
  { level: 6, name: 'Magister', nameRu: 'Магистр', min: 100 },
]

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const { t, lang } = useLang()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recentRituals, setRecentRituals] = useState<Ritual[]>([])
  const [activityFeed, setActivityFeed] = useState<FeedItem[]>([])
  const [notifications, setNotifications] = useState<UnlockNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'feature' | 'item' | 'base'>('all')
  const [showProgression, setShowProgression] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<string[]>([])
  const moonPhase = getMoonPhase()
  const energy = lang === 'ru' ? moonEnergyRu[moonPhase] : moonEnergy[moonPhase]
  const altarState = loadLocalState()
  const progression = altarState.progression

  useEffect(() => {
    loadData()
    refreshNotifications()
    setUnlockedAchievementIds(getUnlockedAchievements(user.id))
  }, [user.id])

  // Listen for achievement unlocks to refresh badge display
  useEffect(() => {
    const unsub = eventBus.on('achievement:unlocked', () => {
      setUnlockedAchievementIds(getUnlockedAchievements(user.id))
    })
    return unsub
  }, [user.id])

  useEffect(() => {
    const handleUpdate = () => refreshNotifications()
    window.addEventListener(unlockNotificationsEvent, handleUpdate)
    window.addEventListener('focus', handleUpdate)
    return () => {
      window.removeEventListener(unlockNotificationsEvent, handleUpdate)
      window.removeEventListener('focus', handleUpdate)
    }
  }, [user.id])

  function refreshNotifications() {
    registerGlobalAnnouncement(
      user.id,
      RELEASE_ANNOUNCEMENT_ID,
      RELEASE_ANNOUNCEMENT.title,
      RELEASE_ANNOUNCEMENT.titleRu,
      RELEASE_ANNOUNCEMENT.preview,
      RELEASE_ANNOUNCEMENT.previewRu,
    )
    syncAltarUnlockNotifications(user.id)
    setNotifications(getUnlockNotifications(user.id))
    setUnreadCount(getUnlockUnreadCount(user.id))
  }

  function openNotifications() {
    setShowNotifications(true)
    markAllUnlockNotificationsRead(user.id)
    refreshNotifications()
  }

  function clearNotifications() {
    clearUnlockNotifications(user.id)
    refreshNotifications()
  }

  async function loadData() {
    try {
      const profiles = await db.userProfiles.list({ where: { userId: user.id } }) as Profile[]
      if (profiles.length > 0) {
        setProfile(profiles[0])
      } else {
        // Create default profile
        const newProfile = await db.userProfiles.create({
          userId: user.id,
          displayName: user.displayName || user.email?.split('@')[0] || 'Seeker',
          archetype: 'seeker',
          tradition: 'eclectic',
          language: 'en',
          initiationLevel: 1,
          practiceStreak: 0,
          totalRituals: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        setProfile(newProfile as Profile)
      }

      const rituals = await db.rituals.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 5,
      }) as Ritual[]
      setRecentRituals(rituals)

      // Build unified activity feed
      const feed: FeedItem[] = []

      // Rituals
      for (const r of rituals) {
        feed.push({
          id: `r-${r.id}`,
          icon: '🌙',
          label: r.title || (lang === 'ru' ? 'Ритуал' : 'Ritual'),
          detail: `⚡ ${r.energyLevel}/10`,
          date: r.createdAt,
          color: 'text-blue-400',
        })
      }

      // Journals
      try {
        const { data: journals } = await supabase
          .from('journals')
          .select('id, title, type, createdAt')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
          .limit(5)
        if (journals) {
          for (const j of journals) {
            feed.push({
              id: `j-${j.id}`,
              icon: j.type === 'dream' ? '💭' : '📓',
              label: j.title || (lang === 'ru' ? 'Запись' : 'Entry'),
              detail: j.type === 'dream'
                ? (lang === 'ru' ? 'Сон' : 'Dream')
                : (lang === 'ru' ? 'Заметка' : 'Note'),
              date: j.createdAt,
              color: 'text-green-400',
            })
          }
        }
      } catch { /* journals table may not exist */ }

      // Sigils
      try {
        const sigils = await db.sigils.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          limit: 3,
        }) as { id: string; intention: string; isCharged: number; createdAt: string }[]
        for (const s of sigils) {
          feed.push({
            id: `s-${s.id}`,
            icon: '✨',
            label: s.intention?.slice(0, 40) || (lang === 'ru' ? 'Сигил' : 'Sigil'),
            detail: s.isCharged ? (lang === 'ru' ? 'Заряжен' : 'Charged') : (lang === 'ru' ? 'Создан' : 'Created'),
            date: s.createdAt,
            color: 'text-yellow-400',
          })
        }
      } catch { /* sigils table may not exist */ }

      // Knowledge Graph stats
      const graph = loadGraph()
      if (graph.nodes.length > 0) {
        feed.push({
          id: 'kg-stats',
          icon: '🕸',
          label: lang === 'ru' ? 'Паутина знаний' : 'Knowledge Web',
          detail: `${graph.nodes.length} ${lang === 'ru' ? 'узлов' : 'nodes'} · ${graph.links.length} ${lang === 'ru' ? 'связей' : 'links'}`,
          date: new Date().toISOString(),
          color: 'text-cyan-400',
        })
      }

      // Sort by date descending, take 10
      feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setActivityFeed(feed.slice(0, 10))
    } catch (err) {
      console.error(err)
    }
  }

  const currentLevel = INITIATION_LEVELS.find(l => l.level === (profile?.initiationLevel || 1)) || INITIATION_LEVELS[0]
  const nextLevel = INITIATION_LEVELS.find(l => l.level === (profile?.initiationLevel || 1) + 1)

  const quickActions = [
    { icon: Moon, label: t.newRitual, action: () => onNavigate('ritual-tracker'), color: 'text-blue-400' },
    { icon: BookOpen, label: t.newJournal, action: () => onNavigate('journal'), color: 'text-green-400' },
    { icon: Sparkles, label: t.generateSigil, action: () => onNavigate('sigil-lab'), color: 'text-yellow-400' },
    { icon: FlameKindling, label: t.openAltar, action: () => onNavigate('altars'), color: 'text-orange-400' },
    { icon: MessageSquare, label: (t as any).forum || 'Forum', action: () => onNavigate('forum'), color: 'text-purple-400' },
    { icon: SpiderWebIcon, label: (t as any).knowledgeGraph || 'Knowledge Graph', action: () => onNavigate('knowledge-graph'), color: 'text-cyan-400' },
  ]

  const filteredNotifications = notifications.filter(note => {
    if (notificationFilter === 'all') return true
    return note.type === notificationFilter
  })

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-[hsl(var(--neon))/10] border border-primary/20 p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={openNotifications}
            className={`relative inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
              unreadCount > 0
                ? 'border-primary/60 bg-primary/20 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.35)]'
                : 'border-border/40 bg-background/70 text-muted-foreground hover:text-foreground'
            }`}
            title={lang === 'ru' ? 'Открыть уведомления' : 'Open notifications'}
          >
            <Bell className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Уведомления' : 'Notifications'}</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
        <div className="relative">
          <p className="text-[10px] sm:text-sm text-muted-foreground mb-1 uppercase tracking-widest font-medium opacity-70">{t.welcomeBack}</p>
          <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-foreground mb-2 truncate">
            {profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Seeker'}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/25 text-sm w-fit">
              <span className="text-base sm:text-xl">{moonEmoji[moonPhase]}</span>
              <span className="text-primary font-medium">{t.moonPhases[moonPhase]}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground italic max-w-xs leading-relaxed">{energy}</p>
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className="rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-sm p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === 'ru' ? 'Новые открытия' : 'New Unlocks'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={clearNotifications}
                className="rounded-lg border border-border/40 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                {lang === 'ru' ? 'Очистить' : 'Clear'}
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="rounded-lg border border-border/40 p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {([
              { key: 'all', en: 'All', ru: 'Все' },
              { key: 'feature', en: 'Features', ru: 'Функции' },
              { key: 'item', en: 'Items', ru: 'Предметы' },
              { key: 'base', en: 'Bases', ru: 'Базы' },
            ] as const).map(filter => (
              <button
                key={filter.key}
                onClick={() => setNotificationFilter(filter.key)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors ${
                  notificationFilter === filter.key
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-border/40 bg-background/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {lang === 'ru' ? filter.ru : filter.en}
              </button>
            ))}
          </div>

          {filteredNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {lang === 'ru' ? 'Нет уведомлений для выбранного фильтра.' : 'No notifications for selected filter.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredNotifications.map(note => (
                <div
                  key={note.id}
                  className={`rounded-xl border p-3 ${note.read ? 'border-border/30 bg-background/40' : 'border-primary/30 bg-primary/10'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {lang === 'ru' ? note.titleRu : note.title}
                    </p>
                    {!note.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === 'ru' ? note.previewRu : note.preview}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-2">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t.initiationLevel, value: currentLevel ? (lang === 'ru' ? currentLevel.nameRu : currentLevel.name) : '—', icon: Star, color: 'text-primary' },
          { label: t.currentStreak, value: `${profile?.practiceStreak || 0} ${t.days}`, icon: Zap, color: 'text-yellow-400' },
          { label: t.totalRituals, value: profile?.totalRituals || 0, icon: TrendingUp, color: 'text-green-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-card border border-border/40 p-4 hover:border-primary/30 transition-colors flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary sm:bg-transparent">
              <stat.icon className={`w-5 h-5 sm:w-4 sm:h-4 ${stat.color}`} />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progression Button + Panel */}
      <div className="rounded-xl bg-card border border-border/40 p-4">
        <button
          onClick={() => setShowProgression(prev => !prev)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
              {progression.level}
            </div>
            <div className="text-left">
              <span className="text-sm font-medium text-foreground">
                {lang === 'ru' ? 'Прогресс практики' : 'Practice Progress'}
              </span>
              <p className="text-[10px] text-muted-foreground">{progression.points} XP · {lang === 'ru' ? 'Уровень' : 'Level'} {progression.level}</p>
            </div>
          </div>
          {showProgression
            ? <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          }
        </button>
        {showProgression && (
          <div className="mt-4 border-t border-border/30 pt-4">
            <ProgressionPanel lang={lang as 'en' | 'ru'} progression={progression} />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{t.quickActions}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group text-left"
            >
              <action.icon className={`w-5 h-5 ${action.color} group-hover:scale-110 transition-transform`} />
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Practice Suggestion */}
      <DailyPracticeSuggestion moonPhase={moonPhase} lang={lang} progression={progression} onNavigate={onNavigate} />

      {/* Achievements */}
      <div className="rounded-xl bg-card border border-border/40 p-4">
        <button
          onClick={() => setShowAchievements(prev => !prev)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div className="text-left">
              <span className="text-sm font-medium text-foreground">
                {lang === 'ru' ? 'Достижения' : 'Achievements'}
              </span>
              <p className="text-[10px] text-muted-foreground">
                {unlockedAchievementIds.length}/{ACHIEVEMENTS.length} {lang === 'ru' ? 'открыто' : 'unlocked'}
              </p>
            </div>
          </div>
          {showAchievements
            ? <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          }
        </button>
        {showAchievements && (
          <div className="mt-4 border-t border-border/30 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ACHIEVEMENTS.map(a => {
              const unlocked = unlockedAchievementIds.includes(a.id)
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    unlocked
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/20 bg-background/30 opacity-50 grayscale'
                  }`}
                >
                  <span className="text-2xl block mb-1">{a.icon}</span>
                  <p className="text-xs font-medium text-foreground truncate">{lang === 'ru' ? a.titleRu : a.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{lang === 'ru' ? a.descriptionRu : a.description}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {lang === 'ru' ? 'Лента активности' : 'Activity Feed'}
        </h3>
        {activityFeed.length === 0 ? (
          <div className="rounded-xl bg-card border border-dashed border-border/40 p-8 text-center">
            <Moon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{lang === 'ru' ? 'Начните практику, чтобы увидеть активность' : 'Start practicing to see activity'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activityFeed.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-colors">
                <span className="text-base">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs ${item.color}`}>{item.detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Daily Practice Suggestion — context-aware recommendations based on moon phase, XP sources, and streak */
interface DailyPracticeSuggestionProps {
  moonPhase: string
  lang: Lang
  progression: any
  onNavigate: (page: any) => void
}

function DailyPracticeSuggestion({ moonPhase, lang, progression, onNavigate }: DailyPracticeSuggestionProps) {
  // Determine which practice area the user has neglected most
  const sources = [
    { key: 'ritual-tracker', xp: progression.ritualXp, en: 'Log a ritual to deepen your practice', ru: 'Запишите ритуал для углубления практики', icon: '🌙' },
    { key: 'journal', xp: progression.journalXp, en: 'Write a journal entry — dreams reveal hidden truths', ru: 'Напишите в журнал — сны раскрывают скрытые истины', icon: '📖' },
    { key: 'knowledge-graph', xp: progression.knowledgeXp, en: 'Expand your Knowledge Web with new entities', ru: 'Расширьте Паутину знаний новыми сущностями', icon: '🕸' },
    { key: 'altars', xp: progression.altarXp, en: 'Refine your altar — sacred space amplifies intent', ru: 'Украсьте алтарь — священное пространство усиливает намерение', icon: '🔥' },
  ]

  // Sort by least XP → suggest the weakest area
  sources.sort((a, b) => a.xp - b.xp)

  // Moon-phase-aware suggestion
  const moonTip = (() => {
    if (moonPhase === 'new') return lang === 'ru' ? 'Новолуние — время для постановки намерений и начала новых практик.' : 'New Moon — set intentions and begin new practices.'
    if (moonPhase === 'full') return lang === 'ru' ? 'Полнолуние — энергия на пике. Идеальное время для мощных ритуалов и зарядки сигил.' : 'Full Moon — peak energy. Perfect for powerful rituals and sigil charging.'
    if (moonPhase === 'waxing') return lang === 'ru' ? 'Растущая луна — наращивайте силу. Привлекающие ритуалы, рост знаний.' : 'Waxing Moon — build momentum. Attraction rituals, growth, and learning.'
    return lang === 'ru' ? 'Убывающая луна — отпускайте старое. Очищение, защита, завершение.' : 'Waning Moon — release and let go. Cleansing, protection, closure.'
  })()

  const today = new Date().toDateString()
  const practicedToday = progression.lastPracticeDate === today

  return (
    <div className="rounded-xl bg-gradient-to-r from-[hsl(280,60%,12%)] to-card border border-primary/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Compass className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-medium text-foreground">
          {lang === 'ru' ? 'Практика дня' : 'Daily Practice'}
        </h3>
        {practicedToday && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400">
            {lang === 'ru' ? '✓ Практика сегодня' : '✓ Practiced today'}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground italic">{moonTip}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.slice(0, 2).map(s => (
          <button
            key={s.key}
            onClick={() => onNavigate(s.key)}
            className="flex items-center gap-2 p-3 rounded-xl border border-border/40 bg-background/40 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
          >
            <span className="text-lg">{s.icon}</span>
            <span className="text-xs text-foreground">{lang === 'ru' ? s.ru : s.en}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
