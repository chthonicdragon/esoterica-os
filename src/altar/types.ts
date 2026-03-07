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
  15: 18,
  30: 55,
  60: 120,
  90: 200,
}

export const LEVEL_THRESHOLDS = [0, 140, 380, 820, 1550, 2700, 4300, 6500, 9400, 13000]

// Mandatory multi-domain milestones for key progression.
// Index maps to level-1 (index 0 -> level 1 baseline).
export const KEY_LEVEL_REQUIREMENTS: KeyLevelRequirement[] = [
  { ritualXp: 0, journalXp: 0, knowledgeXp: 0, altarXp: 0 },
  { ritualXp: 20, journalXp: 15, knowledgeXp: 15, altarXp: 45 },
  { ritualXp: 55, journalXp: 40, knowledgeXp: 40, altarXp: 105 },
  { ritualXp: 110, journalXp: 80, knowledgeXp: 80, altarXp: 210 },
  { ritualXp: 180, journalXp: 130, knowledgeXp: 130, altarXp: 330 },
  { ritualXp: 270, journalXp: 200, knowledgeXp: 190, altarXp: 480 },
  { ritualXp: 380, journalXp: 280, knowledgeXp: 260, altarXp: 660 },
  { ritualXp: 510, journalXp: 370, knowledgeXp: 340, altarXp: 860 },
  { ritualXp: 660, journalXp: 480, knowledgeXp: 430, altarXp: 1080 },
  { ritualXp: 840, journalXp: 620, knowledgeXp: 550, altarXp: 1320 },
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
