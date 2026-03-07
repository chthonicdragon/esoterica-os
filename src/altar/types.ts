export type ObjectCategory = 'candles' | 'crystals' | 'statues' | 'herbs' | 'incense' | 'cups' | 'coins' | 'tools' | 'decor'

export type AltarTheme = 'stone' | 'wood' | 'obsidian' | 'mystical'

export type AltarBaseId =
  | 'base_wooden_table'
  | 'base_stone_altar'
  | 'base_psx_wooden'
  | 'base_sacrificial'
  | 'base_diana'

export interface CatalogItem {
  id: string
  category: ObjectCategory
  label: string
  labelRu: string
  color: string
  emissive: string
  emissiveIntensity: number
  geometry: 'cylinder' | 'box' | 'sphere' | 'cone' | 'torus' | 'custom'
  modelUrl?: string
  scale: [number, number, number]
  effect?: 'flicker' | 'glow' | 'smoke' | 'sparkle'
  placementYOffset?: number
  placementRotationX?: number
  placementRotationZ?: number
  unlockLevel: number
  points: number
}

export interface PlacedObject {
  id: string
  catalogId: string
  position: [number, number, number]
  rotationX?: number
  rotationY: number
  rotationZ?: number
  scale: number
}

export interface AltarLayout {
  id: string
  name: string
  theme: AltarTheme
  baseId: AltarBaseId
  objects: PlacedObject[]
  createdAt: string
  updatedAt: string
}

export interface Progression {
  points: number
  level: number
  streak: number
  lastPracticeDate: string | null
  totalRituals: number
  ritualXp: number
  journalXp: number
  knowledgeXp: number
  altarXp: number
}

export interface RitualSession {
  active: boolean
  mode: 'soft' | 'strict'
  durationMinutes: number
  startTime: number | null
  elapsed: number
  completed: boolean
  interrupted: boolean
}

export interface KeyLevelRequirement {
  ritualXp: number
  journalXp: number
  knowledgeXp: number
  altarXp: number
}

export const POINTS_PER_RITUAL: Record<number, number> = {
  15: 20,
  30: 42,
  60: 90,
  90: 130,
}

/** Interpolates XP reward for any duration, preventing exploits via custom timers. */
export function getRitualBasePoints(durationMinutes: number): number {
  if (POINTS_PER_RITUAL[durationMinutes] !== undefined) return POINTS_PER_RITUAL[durationMinutes]
  const bp = [15, 30, 60, 90]
  const vals = [20, 42, 90, 130]
  if (durationMinutes <= bp[0]) return Math.max(1, Math.round(durationMinutes * vals[0] / bp[0]))
  if (durationMinutes >= bp[bp.length - 1]) return Math.round(vals[vals.length - 1] + (durationMinutes - bp[bp.length - 1]) * 0.9)
  for (let i = 0; i < bp.length - 1; i++) {
    if (durationMinutes <= bp[i + 1]) {
      const t = (durationMinutes - bp[i]) / (bp[i + 1] - bp[i])
      return Math.round(vals[i] + t * (vals[i + 1] - vals[i]))
    }
  }
  return Math.round(durationMinutes * 1.45)
}

export const LEVEL_THRESHOLDS = [0, 120, 350, 720, 1300, 2150, 3350, 4950, 7050, 9750]

// Mandatory multi-domain milestones for key progression.
// Index maps to level-1 (index 0 -> level 1 baseline).
export const KEY_LEVEL_REQUIREMENTS: KeyLevelRequirement[] = [
  { ritualXp: 0,    journalXp: 0,   knowledgeXp: 0,   altarXp: 0 },
  { ritualXp: 42,   journalXp: 18,  knowledgeXp: 14,  altarXp: 14 },
  { ritualXp: 100,  journalXp: 40,  knowledgeXp: 30,  altarXp: 35 },
  { ritualXp: 175,  journalXp: 68,  knowledgeXp: 55,  altarXp: 70 },
  { ritualXp: 270,  journalXp: 105, knowledgeXp: 85,  altarXp: 115 },
  { ritualXp: 380,  journalXp: 150, knowledgeXp: 125, altarXp: 170 },
  { ritualXp: 510,  journalXp: 210, knowledgeXp: 180, altarXp: 235 },
  { ritualXp: 660,  journalXp: 280, knowledgeXp: 250, altarXp: 310 },
  { ritualXp: 840,  journalXp: 370, knowledgeXp: 335, altarXp: 400 },
  { ritualXp: 1050, journalXp: 480, knowledgeXp: 430, altarXp: 510 },
]

export function getLevelFromPoints(points: number): number {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) level = i + 1
  }
  return Math.min(level, LEVEL_THRESHOLDS.length)
}

export function getKeyLevelFromSources(progression: Pick<Progression, 'ritualXp' | 'journalXp' | 'knowledgeXp' | 'altarXp'>): number {
  let level = 1
  for (let i = 1; i < KEY_LEVEL_REQUIREMENTS.length; i++) {
    const req = KEY_LEVEL_REQUIREMENTS[i]
    const unlocked =
      progression.ritualXp >= req.ritualXp &&
      progression.journalXp >= req.journalXp &&
      progression.knowledgeXp >= req.knowledgeXp &&
      progression.altarXp >= req.altarXp
    if (!unlocked) break
    level = i + 1
  }
  return Math.min(level, KEY_LEVEL_REQUIREMENTS.length)
}

export function getEffectiveLevel(progression: Progression): number {
  const pointLevel = getLevelFromPoints(progression.points)
  const keyLevel = getKeyLevelFromSources(progression)
  return Math.min(pointLevel, keyLevel)
}

export function getKeyRequirementForLevel(level: number): KeyLevelRequirement {
  const clamped = Math.max(1, Math.min(level, KEY_LEVEL_REQUIREMENTS.length))
  return KEY_LEVEL_REQUIREMENTS[clamped - 1]
}

export function getStreakBonus(streak: number): number {
  if (streak >= 30) return 2.2
  if (streak >= 14) return 1.8
  if (streak >= 7) return 1.4
  if (streak >= 3) return 1.15
  return 1.0
}
