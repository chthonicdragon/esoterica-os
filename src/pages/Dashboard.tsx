import React, { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { getMoonPhase, moonEmoji, moonEnergy, moonEnergyRu } from '../utils/moonPhase'
import { blink } from '../blink/client'
import { FlameKindling, Sparkles, BookOpen, Moon, TrendingUp, Star, Zap, MessageSquare } from 'lucide-react'

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
  const moonPhase = getMoonPhase()
  const energy = lang === 'ru' ? moonEnergyRu[moonPhase] : moonEnergy[moonPhase]

  useEffect(() => {
    loadData()
  }, [user.id])

  async function loadData() {
    try {
      const profiles = await blink.db.userProfiles.list({ where: { userId: user.id } }) as Profile[]
      if (profiles.length > 0) {
        setProfile(profiles[0])
      } else {
        // Create default profile
        const newProfile = await blink.db.userProfiles.create({
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

      const rituals = await blink.db.rituals.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 5,
      }) as Ritual[]
      setRecentRituals(rituals)
    } catch (err) {
      console.error(err)
    }
  }

  const currentLevel = INITIATION_LEVELS.find(l => l.level === (profile?.initiationLevel || 1)) || INITIATION_LEVELS[0]
  const nextLevel = INITIATION_LEVELS.find(l => l.level === (profile?.initiationLevel || 1) + 1)
  const progress = nextLevel ? Math.min(100, ((profile?.totalRituals || 0) - currentLevel.min) / (nextLevel.min - currentLevel.min) * 100) : 100

  const quickActions = [
    { icon: Moon, label: t.newRitual, action: () => onNavigate('ritual-tracker'), color: 'text-blue-400' },
    { icon: BookOpen, label: t.newJournal, action: () => onNavigate('journal'), color: 'text-green-400' },
    { icon: Sparkles, label: t.generateSigil, action: () => onNavigate('sigil-lab'), color: 'text-yellow-400' },
    { icon: FlameKindling, label: t.openAltar, action: () => onNavigate('altars'), color: 'text-orange-400' },
    { icon: MessageSquare, label: (t as any).forum || 'Forum', action: () => onNavigate('forum'), color: 'text-purple-400' },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-[hsl(var(--neon))/10] border border-primary/20 p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_60%)]" />
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

      {/* Initiation Progress */}
      <div className="rounded-xl bg-card border border-border/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">{t.initiationLevel}: {lang === 'ru' ? currentLevel.nameRu : currentLevel.name}</span>
          {nextLevel && (
            <span className="text-xs text-muted-foreground">→ {lang === 'ru' ? nextLevel.nameRu : nextLevel.name}</span>
          )}
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--neon))] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{profile?.totalRituals || 0} / {nextLevel?.min || '∞'} rituals</p>
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

      {/* Recent Rituals */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{t.recentRituals}</h3>
        {recentRituals.length === 0 ? (
          <div className="rounded-xl bg-card border border-dashed border-border/40 p-8 text-center">
            <Moon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t.noRituals}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRituals.map((ritual) => (
              <div key={ritual.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ritual.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(ritual.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-xs text-primary">⚡ {ritual.energyLevel}/10</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
