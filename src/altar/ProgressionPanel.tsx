import type { Progression } from './types'
import { LEVEL_THRESHOLDS, getKeyLevelFromSources, getKeyRequirementForLevel, getLevelFromPoints } from './types'
import { ALTAR_BASES, CATALOG, CATEGORY_LABELS, getRequiredBaseUnlockLevel, getRequiredUnlockLevel } from './catalog'
import { Zap, Flame, Star, Trophy, CheckCircle2, Circle } from 'lucide-react'

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
  const pointsLevel = getLevelFromPoints(progression.points)
  const keyLevel = getKeyLevelFromSources(progression)
  const nextKeyLevel = Math.min(LEVEL_THRESHOLDS.length, keyLevel + 1)
  const nextKeyReq = getKeyRequirementForLevel(nextKeyLevel)
  const levelName = lang === 'ru' ? LEVEL_NAMES_RU[level - 1] : LEVEL_NAMES_EN[level - 1]
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const progressInLevel = progression.points - currentThreshold
  const neededForNext = nextThreshold - currentThreshold
  const levelProgress = Math.min(1, progressInLevel / neededForNext)

  const immediateObjectReward = CATALOG
    .map(item => ({ item, requiredLevel: getRequiredUnlockLevel(item) }))
    .filter(x => x.requiredLevel === level + 1)
    .sort((a, b) => a.item.points - b.item.points)[0]

  const immediateBaseReward = ALTAR_BASES
    .map(base => ({ base, requiredLevel: getRequiredBaseUnlockLevel(base.id) }))
    .filter(x => x.requiredLevel === level + 1)
    .sort((a, b) => a.requiredLevel - b.requiredLevel)[0]

  const nextObjectReward = CATALOG
    .map(item => ({ item, requiredLevel: getRequiredUnlockLevel(item) }))
    .filter(x => x.requiredLevel > level)
    .sort((a, b) => {
      const byLevel = a.requiredLevel - b.requiredLevel
      if (byLevel !== 0) return byLevel
      return a.item.points - b.item.points
    })[0]

  const nextBaseReward = ALTAR_BASES
    .map(base => ({ base, requiredLevel: getRequiredBaseUnlockLevel(base.id) }))
    .filter(x => x.requiredLevel > level)
    .sort((a, b) => a.requiredLevel - b.requiredLevel)[0]

  const nextReward = (() => {
    if (immediateObjectReward && immediateBaseReward) {
      return immediateObjectReward.item.points <= 16
        ? { type: 'object' as const, ...immediateObjectReward }
        : { type: 'base' as const, ...immediateBaseReward }
    }
    if (immediateObjectReward) return { type: 'object' as const, ...immediateObjectReward }
    if (immediateBaseReward) return { type: 'base' as const, ...immediateBaseReward }

    if (nextObjectReward && nextBaseReward) {
      return nextObjectReward.requiredLevel <= nextBaseReward.requiredLevel
        ? { type: 'object' as const, ...nextObjectReward }
        : { type: 'base' as const, ...nextBaseReward }
    }
    if (nextObjectReward) return { type: 'object' as const, ...nextObjectReward }
    if (nextBaseReward) return { type: 'base' as const, ...nextBaseReward }
    return null
  })()

  const t = {
    level: lang === 'ru' ? 'Уровень' : 'Level',
    points: lang === 'ru' ? 'Очки' : 'Points',
    streak: lang === 'ru' ? 'Серия' : 'Streak',
    rituals: lang === 'ru' ? 'Ритуалов' : 'Rituals',
    days: lang === 'ru' ? 'дней' : 'days',
    nextReward: lang === 'ru' ? 'Следующий приз' : 'Next reward',
    rewardObject: lang === 'ru' ? 'Предмет' : 'Object',
    rewardBase: lang === 'ru' ? 'База алтаря' : 'Altar base',
    keyLevel: lang === 'ru' ? 'Ключевой уровень' : 'Key level',
    mandatoryTodo: lang === 'ru' ? 'Обязательные задачи к следующему уровню' : 'Mandatory tasks for next level',
    pointsGateHint: lang === 'ru' ? 'Чтобы поднять уровень, выполните обязательные задачи по разделам.' : 'To level up, complete the mandatory cross-section tasks.',
    completed: lang === 'ru' ? 'выполнено' : 'completed',
    maxLevel: lang === 'ru' ? 'Макс. уровень' : 'Max Level',
    sources: lang === 'ru' ? 'Источники XP' : 'XP Sources',
    sourceRitual: lang === 'ru' ? 'Ритуалы' : 'Rituals',
    sourceJournal: lang === 'ru' ? 'Журнал снов' : 'Dream Journal',
    sourceKnowledge: lang === 'ru' ? 'Паутина знаний' : 'Knowledge Web',
    sourceAltars: lang === 'ru' ? 'Алтари' : 'Altars',
  }

  const todoRows = [
    { key: 'ritual', label: t.sourceRitual, current: progression.ritualXp, required: nextKeyReq.ritualXp },
    { key: 'journal', label: t.sourceJournal, current: progression.journalXp, required: nextKeyReq.journalXp },
    { key: 'knowledge', label: t.sourceKnowledge, current: progression.knowledgeXp, required: nextKeyReq.knowledgeXp },
    { key: 'altar', label: t.sourceAltars, current: progression.altarXp, required: nextKeyReq.altarXp },
  ]

  const completedCount = todoRows.filter(row => row.current >= row.required).length

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

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.keyLevel}</p>
          <span className="text-[10px] text-primary font-semibold">{keyLevel}</span>
        </div>
        {pointsLevel > keyLevel && (
          <p className="text-[10px] text-amber-300/90">{t.pointsGateHint}</p>
        )}
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

      {/* Next reward hint */}
      {nextReward && (
        <div className="text-[10px] text-muted-foreground/80 border border-dashed border-border/30 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
          {nextReward.type === 'object' ? (
            <span>{CATEGORY_LABELS[nextReward.item.category].emoji}</span>
          ) : (
            <span>🪵</span>
          )}
          <span>
            {t.nextReward}: {nextReward.type === 'object' ? t.rewardObject : t.rewardBase} {' '}
            {nextReward.type === 'object'
              ? (lang === 'ru' ? nextReward.item.labelRu : nextReward.item.label)
              : (lang === 'ru' ? nextReward.base.labelRu : nextReward.base.label)}{' '}
            (Lv{nextReward.requiredLevel})
          </span>
        </div>
      )}

      {keyLevel < LEVEL_THRESHOLDS.length && (
        <div className="rounded-xl border border-border/30 bg-card/40 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.mandatoryTodo}</p>
            <span className="text-[10px] text-muted-foreground">{completedCount}/4 {t.completed}</span>
          </div>
          <div className="space-y-1">
            {todoRows.map(row => {
              const done = row.current >= row.required
              return (
                <div key={row.key} className="flex items-center justify-between rounded-lg bg-background/40 px-2 py-1 text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {done ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-muted-foreground" />}
                    <span className="text-muted-foreground truncate">{row.label}</span>
                  </div>
                  <span className="font-medium text-foreground">{Math.min(row.current, row.required)}/{row.required}</span>
                </div>
              )
            })}
          </div>
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
