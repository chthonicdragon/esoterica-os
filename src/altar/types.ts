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

export const POINTS_PER_RITUAL: Record<number, number> = {
  15: 24,
  30: 85,
  60: 190,
  90: 320,
}

export const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000]

export function getLevelFromPoints(points: number): number {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) level = i + 1
  }
  return Math.min(level, LEVEL_THRESHOLDS.length)
}

export function getStreakBonus(streak: number): number {
  if (streak >= 30) return 2.2
  if (streak >= 14) return 1.8
  if (streak >= 7) return 1.4
  if (streak >= 3) return 1.15
  return 1.0
}
