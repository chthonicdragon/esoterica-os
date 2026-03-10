import { supabase } from '../lib/supabaseClient'
import type { AltarLayout, PlacedObject, Progression, AltarTheme, AltarBaseId } from './types'
import { getEffectiveLevel, getStreakBonus, getRitualBasePoints } from './types'

const STORAGE_KEY = 'esoterica_altar_v2'
export type ProgressSource = 'ritual' | 'journal' | 'knowledge' | 'altar'

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
  ritualXp: 0,
  journalXp: 0,
  knowledgeXp: 0,
  altarXp: 0,
}

const DEFAULT_BASE_ID: AltarBaseId = 'base_wooden_table'

function normalizeLayout(raw: Partial<AltarLayout>): AltarLayout | null {
  if (!raw.id || !raw.name || !raw.theme) return null
  return {
    id: raw.id,
    name: raw.name,
    theme: raw.theme,
    baseId: raw.baseId || DEFAULT_BASE_ID,
    objects: Array.isArray(raw.objects) ? raw.objects : [],
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

function normalizeProgression(raw?: Partial<Progression>): Progression {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROGRESSION
  const normalized: Progression = {
    points: Number(raw.points || 0),
    level: Number(raw.level || 1),
    streak: Number(raw.streak || 0),
    lastPracticeDate: raw.lastPracticeDate || null,
    totalRituals: Number(raw.totalRituals || 0),
    ritualXp: Number(raw.ritualXp || 0),
    journalXp: Number(raw.journalXp || 0),
    knowledgeXp: Number(raw.knowledgeXp || 0),
    altarXp: Number(raw.altarXp || 0),
  }
  return {
    ...normalized,
    level: getEffectiveLevel(normalized),
  }
}

export function recalculateProgressionLevel(progression: Progression): Progression {
  return {
    ...progression,
    level: getEffectiveLevel(progression),
  }
}

function withSourceXp(progression: Progression, source: ProgressSource, pointsEarned: number): Progression {
  if (pointsEarned <= 0) return progression
  if (source === 'ritual') return { ...progression, ritualXp: progression.ritualXp + pointsEarned }
  if (source === 'journal') return { ...progression, journalXp: progression.journalXp + pointsEarned }
  if (source === 'knowledge') return { ...progression, knowledgeXp: progression.knowledgeXp + pointsEarned }
  return { ...progression, altarXp: progression.altarXp + pointsEarned }
}

export const ACTION_POINTS = {
  createAltar: 15,
  placeFirstObject: 5,
  placeObjectBase: 2,
  deleteObject: 1,
  journalEntryBase: 16,
  dreamEntryBonus: 4,
  knowledgeWeaveBase: 12,
} as const

export function getXpGainFactorForLevel(level: number): number {
  if (level <= 1) return 1
  if (level === 2) return 0.9
  if (level === 3) return 0.82
  if (level === 4) return 0.75
  if (level === 5) return 0.69
  if (level === 6) return 0.64
  if (level === 7) return 0.6
  if (level === 8) return 0.57
  if (level === 9) return 0.54
  return 0.5
}

export function loadLocalState(): AltarStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AltarStoreState>
      if (!parsed || !Array.isArray(parsed.layouts)) {
        return { layouts: [], activeLayoutId: null, progression: DEFAULT_PROGRESSION }
      }

      const progression = normalizeProgression(parsed.progression)

      const layouts = parsed.layouts
        .map(layout => normalizeLayout(layout))
        .filter((layout): layout is AltarLayout => layout !== null)

      return {
        layouts,
        activeLayoutId: parsed.activeLayoutId || null,
        progression,
      }
    }
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
    baseId: DEFAULT_BASE_ID,
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
  durationMinutes: number,
  mode: 'soft' | 'strict' = 'soft'
): {
  progression: Progression
  pointsEarned: number
  bonusMultiplier: number
  basePoints: number
  streakMultiplier: number
  modeMultiplier: number
} {
  const base = getRitualBasePoints(durationMinutes)
  const longSession = durationMinutes >= 30
  const modeMultiplier = mode === 'strict' ? 1.2 : 1
  // Short sessions still benefit from streak but at a reduced rate.
  const streakMultiplier = longSession
    ? getStreakBonus(progression.streak)
    : Math.max(0.7, getStreakBonus(progression.streak) * 0.6)
  const multiplier = streakMultiplier * modeMultiplier
  const levelFactor = getXpGainFactorForLevel(progression.level)
  const today = new Date().toDateString()
  const isFirstToday = progression.lastPracticeDate !== today
  const dailyBonus = isFirstToday ? 5 : 0
  const pointsEarned = Math.round(base * multiplier * levelFactor) + dailyBonus

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

  const progressed = {
    ...withSourceXp(progression, 'ritual', pointsEarned),
    points: newPoints,
    streak: newStreak,
    lastPracticeDate: today,
    totalRituals: progression.totalRituals + 1,
  }
  const leveled = recalculateProgressionLevel(progressed)

  return {
    progression: leveled,
    pointsEarned,
    bonusMultiplier: multiplier,
    basePoints: base,
    streakMultiplier,
    modeMultiplier,
  }
}

export function addProgressPoints(
  progression: Progression,
  rawPoints: number,
  source: ProgressSource = 'altar'
): { progression: Progression; pointsEarned: number } {
  const levelFactor = getXpGainFactorForLevel(progression.level)
  const pointsEarned = Math.max(0, Math.round(rawPoints * levelFactor))
  const newPoints = progression.points + pointsEarned
  const withSource = withSourceXp(progression, source, pointsEarned)
  const leveled = recalculateProgressionLevel({
    ...withSource,
    points: newPoints,
  })

  return {
    progression: leveled,
    pointsEarned,
  }
}

export function grantProgressionPoints(
  rawPoints: number,
  source: ProgressSource = 'altar'
): { progression: Progression; pointsEarned: number } {
  const state = loadLocalState()
  const result = addProgressPoints(state.progression, rawPoints, source)
  saveLocalState({
    ...state,
    progression: result.progression,
  })
  return result
}

export function getKnowledgeWeavePoints(nodeCount: number, linkCount: number, ritualMode = false): number {
  const complexity = nodeCount * 2 + linkCount
  const cappedComplexity = Math.min(14, complexity)
  const ritualBonus = ritualMode ? 3 : 0
  return ACTION_POINTS.knowledgeWeaveBase + cappedComplexity + ritualBonus
}

export async function syncProgressionToDb(userId: string, progression: Progression) {
  try {
    const { data: profiles } = await supabase
      .from('userProfiles')
      .select('id')
      .eq('userId', userId)
      .limit(1)
    if (profiles && profiles.length > 0) {
      await supabase.from('userProfiles').update({
        initiationLevel: progression.level,
        practiceStreak: progression.streak,
        lastPracticeDate: progression.lastPracticeDate || '',
        totalRituals: progression.totalRituals,
        updatedAt: new Date().toISOString(),
      }).eq('id', profiles[0].id)
    }
  } catch (e) {
    console.error('Failed to sync progression:', e)
  }
}

export async function loadProgressionFromDb(userId: string): Promise<Progression | null> {
  try {
    const { data: profiles } = await supabase
      .from('userProfiles')
      .select('initiationLevel, practiceStreak, lastPracticeDate, totalRituals')
      .eq('userId', userId)
      .limit(1)
    if (profiles && profiles.length > 0) {
      const p = profiles[0] as Record<string, unknown>
      const estimatedTotal = Math.round((p.totalRituals as number || 0) * 28)
      const merged: Progression = {
        ...DEFAULT_PROGRESSION,
        points: estimatedTotal,
        level: (p.initiationLevel as number) || 1,
        streak: (p.practiceStreak as number) || 0,
        lastPracticeDate: (p.lastPracticeDate as string) || null,
        totalRituals: (p.totalRituals as number) || 0,
        ritualXp: Math.round(estimatedTotal * 0.5),
        journalXp: Math.round(estimatedTotal * 0.18),
        knowledgeXp: Math.round(estimatedTotal * 0.12),
        altarXp: Math.round(estimatedTotal * 0.2),
      }
      return recalculateProgressionLevel(merged)
    }
  } catch {}
  return null
}
