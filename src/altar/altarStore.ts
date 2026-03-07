// import { blink } from '../blink/client' // removed
import type { AltarLayout, PlacedObject, Progression, AltarTheme } from './types'
import { getLevelFromPoints, getStreakBonus, POINTS_PER_RITUAL } from './types'

const STORAGE_KEY = 'esoterica_altar_v2'

export interface AltarStoreState {
  layouts: AltarLayout[]
  activeLayoutId: string | null
  progression: Progression
}

const DEFAULT_PROGRESSION: Progression = {
  points: 0,
  level: 1,
  streak: 0,
  lastPracticeDate: null,
  totalRituals: 0,
}

export function loadLocalState(): AltarStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { layouts: [], activeLayoutId: null, progression: DEFAULT_PROGRESSION }
}

export function saveLocalState(state: AltarStoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function createDefaultLayout(name: string, theme: AltarTheme = 'mystical'): AltarLayout {
  return {
    id: `layout_${Date.now()}`,
    name,
    theme,
    objects: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function addObjectToLayout(layout: AltarLayout, obj: PlacedObject): AltarLayout {
  return {
    ...layout,
    objects: [...layout.objects, obj],
    updatedAt: new Date().toISOString(),
  }
}

export function updateObjectInLayout(layout: AltarLayout, updatedObj: PlacedObject): AltarLayout {
  return {
    ...layout,
    objects: layout.objects.map(o => o.id === updatedObj.id ? updatedObj : o),
    updatedAt: new Date().toISOString(),
  }
}

export function removeObjectFromLayout(layout: AltarLayout, objId: string): AltarLayout {
  return {
    ...layout,
    objects: layout.objects.filter(o => o.id !== objId),
    updatedAt: new Date().toISOString(),
  }
}

export function completeRitual(
  progression: Progression,
  durationMinutes: number
): { progression: Progression; pointsEarned: number; bonusMultiplier: number } {
  const base = POINTS_PER_RITUAL[durationMinutes] || Math.round(durationMinutes * 4)
  const multiplier = getStreakBonus(progression.streak)
  const pointsEarned = Math.round(base * multiplier)

  const today = new Date().toDateString()
  const lastDate = progression.lastPracticeDate

  let newStreak = progression.streak
  if (lastDate) {
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (lastDate === yesterday) {
      newStreak += 1
    } else if (lastDate !== today) {
      newStreak = 1
    }
  } else {
    newStreak = 1
  }

  const newPoints = progression.points + pointsEarned
  const newLevel = getLevelFromPoints(newPoints)

  return {
    progression: {
      points: newPoints,
      level: newLevel,
      streak: newStreak,
      lastPracticeDate: today,
      totalRituals: progression.totalRituals + 1,
    },
    pointsEarned,
    bonusMultiplier: multiplier,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export async function syncProgressionToDb(userId: string, progression: Progression) {
  try {
    const profiles = await db.userProfiles.list({ where: { userId } })
    if (profiles.length > 0) {
      await db.userProfiles.update(profiles[0].id, {
        initiationLevel: progression.level,
        practiceStreak: progression.streak,
        lastPracticeDate: progression.lastPracticeDate || '',
        totalRituals: progression.totalRituals,
        updatedAt: new Date().toISOString(),
      })
    }
  } catch (e) {
    console.error('Failed to sync progression:', e)
  }
}

export async function loadProgressionFromDb(userId: string): Promise<Progression | null> {
  try {
    const profiles = await db.userProfiles.list({ where: { userId } })
    if (profiles.length > 0) {
      const p = profiles[0] as Record<string, unknown>
      return {
        points: (p.totalRituals as number || 0) * 50,
        level: (p.initiationLevel as number) || 1,
        streak: (p.practiceStreak as number) || 0,
        lastPracticeDate: (p.lastPracticeDate as string) || null,
        totalRituals: (p.totalRituals as number) || 0,
      }
    }
  } catch {}
  return null
}
