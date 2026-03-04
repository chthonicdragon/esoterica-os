export type ObjectCategory = 'candles' | 'crystals' | 'statues' | 'herbs' | 'incense' | 'cups' | 'coins'

export type AltarTheme = 'stone' | 'wood' | 'obsidian' | 'mystical'

export interface CatalogItem {
  id: string
  category: ObjectCategory
  label: string
  labelRu: string
  color: string
  emissive: string
  emissiveIntensity: number
  geometry: 'cylinder' | 'box' | 'sphere' | 'cone' | 'torus' | 'custom'
  scale: [number, number, number]
  effect?: 'flicker' | 'glow' | 'smoke' | 'sparkle'
  unlockLevel: number
  points: number
}

export interface PlacedObject {
  id: string
  catalogId: string
  position: [number, number, number]
  rotationY: number
  scale: number
}

export interface AltarLayout {
  id: string
  name: string
  theme: AltarTheme
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
  15: 50,
  30: 120,
  60: 250,
  90: 400,
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
  if (streak >= 30) return 3.0
  if (streak >= 14) return 2.0
  if (streak >= 7) return 1.5
  if (streak >= 3) return 1.2
  return 1.0
}
