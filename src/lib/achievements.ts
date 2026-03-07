/**
 * Achievement system — tracks milestones across all features.
 * Uses EventBus to listen for cross-feature events and checks achievement
 * conditions. Achievements are persisted in localStorage per user.
 */
import { eventBus } from './eventBus'
import { loadGraph } from '../services/knowledgeGraphBridge'
import { loadLocalState } from '../altar/altarStore'

export interface Achievement {
  id: string
  icon: string
  title: string
  titleRu: string
  description: string
  descriptionRu: string
  condition: () => boolean
}

interface AchievementState {
  unlockedIds: string[]
  unlockedAt: Record<string, string>
}

const STORAGE_PREFIX = 'esoterica_achievements_v1_'

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function loadState(userId: string): AchievementState {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return { unlockedIds: [], unlockedAt: {} }
    return JSON.parse(raw)
  } catch {
    return { unlockedIds: [], unlockedAt: {} }
  }
}

function saveState(userId: string, state: AchievementState) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
}

/** All available achievements */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_ritual',
    icon: '🔥',
    title: 'First Flame',
    titleRu: 'Первое пламя',
    description: 'Complete your first ritual',
    descriptionRu: 'Завершите свой первый ритуал',
    condition: () => loadLocalState().progression.totalRituals >= 1,
  },
  {
    id: 'ritual_adept',
    icon: '⚡',
    title: 'Ritual Adept',
    titleRu: 'Адепт ритуалов',
    description: 'Complete 10 rituals',
    descriptionRu: 'Завершите 10 ритуалов',
    condition: () => loadLocalState().progression.totalRituals >= 10,
  },
  {
    id: 'ritual_master',
    icon: '🌟',
    title: 'Ritual Master',
    titleRu: 'Мастер ритуалов',
    description: 'Complete 50 rituals',
    descriptionRu: 'Завершите 50 ритуалов',
    condition: () => loadLocalState().progression.totalRituals >= 50,
  },
  {
    id: 'knowledge_seeker',
    icon: '🕸',
    title: 'Knowledge Seeker',
    titleRu: 'Искатель знаний',
    description: 'Add 10 nodes to the Knowledge Web',
    descriptionRu: 'Добавьте 10 узлов в Паутину знаний',
    condition: () => loadGraph().nodes.length >= 10,
  },
  {
    id: 'web_weaver',
    icon: '🌐',
    title: 'Web Weaver',
    titleRu: 'Ткач паутины',
    description: 'Add 50 nodes to the Knowledge Web',
    descriptionRu: 'Добавьте 50 узлов в Паутину знаний',
    condition: () => loadGraph().nodes.length >= 50,
  },
  {
    id: 'knowledge_architect',
    icon: '🏛',
    title: 'Knowledge Architect',
    titleRu: 'Архитектор знаний',
    description: 'Reach 100 nodes in the Knowledge Web',
    descriptionRu: '100 узлов в Паутине знаний',
    condition: () => loadGraph().nodes.length >= 100,
  },
  {
    id: 'streak_3',
    icon: '🔥',
    title: 'Three-Day Flame',
    titleRu: 'Трёхдневное пламя',
    description: 'Maintain a 3-day practice streak',
    descriptionRu: 'Серия практик 3 дня подряд',
    condition: () => loadLocalState().progression.streak >= 3,
  },
  {
    id: 'streak_7',
    icon: '🌙',
    title: 'Lunar Devotion',
    titleRu: 'Лунная преданность',
    description: 'Maintain a 7-day practice streak',
    descriptionRu: 'Серия практик 7 дней подряд',
    condition: () => loadLocalState().progression.streak >= 7,
  },
  {
    id: 'streak_30',
    icon: '☀️',
    title: 'Solar Discipline',
    titleRu: 'Солнечная дисциплина',
    description: '30-day unbroken practice streak',
    descriptionRu: 'Серия практик 30 дней подряд',
    condition: () => loadLocalState().progression.streak >= 30,
  },
  {
    id: 'level_3',
    icon: '⭐',
    title: 'Practitioner',
    titleRu: 'Практик',
    description: 'Reach level 3',
    descriptionRu: 'Достигните 3-го уровня',
    condition: () => loadLocalState().progression.level >= 3,
  },
  {
    id: 'level_5',
    icon: '💫',
    title: 'Initiate',
    titleRu: 'Посвящённый',
    description: 'Reach level 5',
    descriptionRu: 'Достигните 5-го уровня',
    condition: () => loadLocalState().progression.level >= 5,
  },
  {
    id: 'journal_10',
    icon: '📖',
    title: 'Dream Keeper',
    titleRu: 'Хранитель снов',
    description: 'Write 10 journal entries',
    descriptionRu: 'Напишите 10 записей в журнале',
    condition: () => loadLocalState().progression.journalXp >= 160, // ~10 entries × 16 base XP
  },
  {
    id: 'cross_feature',
    icon: '🔮',
    title: 'Connected Practice',
    titleRu: 'Связанная практика',
    description: 'Earn XP from all 4 sources: ritual, journal, knowledge, altar',
    descriptionRu: 'Получите XP из всех 4 источников',
    condition: () => {
      const p = loadLocalState().progression
      return p.ritualXp > 0 && p.journalXp > 0 && p.knowledgeXp > 0 && p.altarXp > 0
    },
  },
]

/**
 * Check all achievements and return newly unlocked ones.
 * Automatically persists newly unlocked achievements.
 */
export function checkAchievements(userId: string): Achievement[] {
  const state = loadState(userId)
  const newlyUnlocked: Achievement[] = []

  for (const achievement of ACHIEVEMENTS) {
    if (state.unlockedIds.includes(achievement.id)) continue
    try {
      if (achievement.condition()) {
        state.unlockedIds.push(achievement.id)
        state.unlockedAt[achievement.id] = new Date().toISOString()
        newlyUnlocked.push(achievement)
      }
    } catch {
      // Condition evaluation failed — skip
    }
  }

  if (newlyUnlocked.length > 0) {
    saveState(userId, state)
    for (const a of newlyUnlocked) {
      eventBus.emit('achievement:unlocked', {
        achievementId: a.id,
        title: a.title,
        titleRu: a.titleRu,
      })
    }
  }

  return newlyUnlocked
}

/** Get all unlocked achievement IDs for a user */
export function getUnlockedAchievements(userId: string): string[] {
  return loadState(userId).unlockedIds
}

/** Get unlock timestamp for a specific achievement */
export function getAchievementUnlockDate(userId: string, achievementId: string): string | null {
  return loadState(userId).unlockedAt[achievementId] ?? null
}

/**
 * Initialize the achievement listener. Call once at app startup.
 * Listens to EventBus events and checks achievements after relevant actions.
 */
export function initAchievementListener(userId: string): () => void {
  const check = () => checkAchievements(userId)

  const unsubs = [
    eventBus.on('ritual:completed', check),
    eventBus.on('journal:saved', check),
    eventBus.on('knowledge:updated', check),
    eventBus.on('sigil:created', check),
    eventBus.on('progression:xp-granted', check),
  ]

  // Initial check on startup
  check()

  return () => unsubs.forEach(unsub => unsub())
}
