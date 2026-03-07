import type { Progression } from './types'
import { LEVEL_THRESHOLDS, getLevelFromPoints } from './types'
import { CATALOG } from './catalog'
import { Zap, Flame, Star, Trophy } from 'lucide-react'

interface ProgressionPanelProps {
  lang: 'en' | 'ru'
  progression: Progression
  lastPointsEarned?: number
}

const LEVEL_NAMES_EN = [
  'Seeker', 'Initiate', 'Apprentice', 'Adept', 'Mage',
  'Sorcerer', 'Thaumaturge', 'Archmage', 'Hierophant', 'Illumined',
]

const LEVEL_NAMES_RU = [
  'Искатель', 'Посвящённый', 'Ученик', 'Адепт', 'Маг',
  'Чародей', 'Теург', 'Архимаг', 'Иерофант', 'Просветлённый',
]

export function ProgressionPanel({ lang, progression, lastPointsEarned }: ProgressionPanelProps) {
  const level = progression.level
  const levelName = lang === 'ru' ? LEVEL_NAMES_RU[level - 1] : LEVEL_NAMES_EN[level - 1]
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const progressInLevel = progression.points - currentThreshold
  const neededForNext = nextThreshold - currentThreshold
  const levelProgress = Math.min(1, progressInLevel / neededForNext)

  // Unlockable objects at current level
  const nextUnlock = CATALOG.find(c => c.unlockLevel === level + 1)

  const t = {
    level: lang === 'ru' ? 'Уровень' : 'Level',
    points: lang === 'ru' ? 'Очки' : 'Points',
    streak: lang === 'ru' ? 'Серия' : 'Streak',
    rituals: lang === 'ru' ? 'Ритуалов' : 'Rituals',
    days: lang === 'ru' ? 'дней' : 'days',
    nextUnlock: lang === 'ru' ? 'Следующий разблок:' : 'Next unlock:',
    maxLevel: lang === 'ru' ? 'Макс. уровень' : 'Max Level',
    sources: lang === 'ru' ? 'Источники XP' : 'XP Sources',
    sourceRitual: lang === 'ru' ? 'Ритуалы' : 'Rituals',
    sourceJournal: lang === 'ru' ? 'Журнал снов' : 'Dream Journal',
    sourceKnowledge: lang === 'ru' ? 'Паутина знаний' : 'Knowledge Web',
    sourceAltars: lang === 'ru' ? 'Алтари' : 'Altars',
  }

  return (
    <div className="space-y-3">
      {/* Level badge */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm">
          {level}
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{levelName}</p>
          <p className="text-[10px] text-muted-foreground">{t.level} {level}</p>
        </div>
        {lastPointsEarned && lastPointsEarned > 0 && (
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs animate-pulse">
            <Zap className="w-3 h-3" />
            +{lastPointsEarned}
          </div>
        )}
      </div>

      {/* XP bar */}
      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>{progression.points.toLocaleString()} {t.points}</span>
          {level < LEVEL_THRESHOLDS.length
            ? <span>{nextThreshold.toLocaleString()} next</span>
            : <span>{t.maxLevel}</span>
          }
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--neon))] transition-all duration-500"
            style={{ width: `${levelProgress * 100}%`, boxShadow: '0 0 8px hsl(267 80% 60% / 0.6)' }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card border border-border/40">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-sm font-bold text-foreground">{progression.streak}</span>
          <span className="text-[10px] text-muted-foreground">{t.days}</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card border border-border/40">
          <Star className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-bold text-foreground">{progression.totalRituals}</span>
          <span className="text-[10px] text-muted-foreground">{t.rituals}</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card border border-border/40">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-sm font-bold text-foreground">{progression.points}</span>
          <span className="text-[10px] text-muted-foreground">{t.points}</span>
        </div>
      </div>

      {/* Next unlock hint */}
      {nextUnlock && (
        <div className="text-[10px] text-muted-foreground/70 border border-dashed border-border/30 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
          <span>🔒</span>
          <span>
            {t.nextUnlock} {lang === 'ru' ? nextUnlock.labelRu : nextUnlock.label} (Lv{nextUnlock.unlockLevel})
          </span>
        </div>
      )}

      <div className="rounded-xl border border-border/30 bg-card/40 p-2.5 space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.sources}</p>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div className="flex items-center justify-between rounded-lg bg-background/40 px-2 py-1">
            <span className="text-muted-foreground">{t.sourceRitual}</span>
            <span className="font-medium text-foreground">{progression.ritualXp}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background/40 px-2 py-1">
            <span className="text-muted-foreground">{t.sourceJournal}</span>
            <span className="font-medium text-foreground">{progression.journalXp}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background/40 px-2 py-1">
            <span className="text-muted-foreground">{t.sourceKnowledge}</span>
            <span className="font-medium text-foreground">{progression.knowledgeXp}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background/40 px-2 py-1">
            <span className="text-muted-foreground">{t.sourceAltars}</span>
            <span className="font-medium text-foreground">{progression.altarXp}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
