// Built-in object catalog — no external JSON URL required
export type ObjectCategory = 'candles' | 'crystals' | 'statues' | 'incense' | 'cups' | 'coins' | 'herbs'

export interface CatalogObject {
  id: string
  category: ObjectCategory
  label: string
  labelRu: string
  emoji: string
  color: string
  emissive?: string
  geometry: 'candle' | 'crystal' | 'sphere' | 'cylinder' | 'cone' | 'box' | 'torus' | 'dodecahedron'
  defaultScale: [number, number, number]
  effect?: 'flicker' | 'glow' | 'smoke' | 'none'
  unlockLevel: number
}

export const CATALOG: CatalogObject[] = [
  // Candles
  { id: 'candle-white', category: 'candles', label: 'White Candle', labelRu: 'Белая свеча', emoji: '🕯️', color: '#f5f0e8', emissive: '#ff8800', geometry: 'candle', defaultScale: [1,1,1], effect: 'flicker', unlockLevel: 1 },
  { id: 'candle-black', category: 'candles', label: 'Black Candle', labelRu: 'Чёрная свеча', emoji: '🕯️', color: '#1a1a1a', emissive: '#ff6600', geometry: 'candle', defaultScale: [1,1,1], effect: 'flicker', unlockLevel: 1 },
  { id: 'candle-red', category: 'candles', label: 'Red Candle', labelRu: 'Красная свеча', emoji: '🕯️', color: '#cc2200', emissive: '#ff4400', geometry: 'candle', defaultScale: [1,1,1], effect: 'flicker', unlockLevel: 1 },
  { id: 'candle-purple', category: 'candles', label: 'Purple Candle', labelRu: 'Фиолетовая свеча', emoji: '🕯️', color: '#6600cc', emissive: '#8800ff', geometry: 'candle', defaultScale: [1,1,1], effect: 'flicker', unlockLevel: 2 },
  { id: 'candle-green', category: 'candles', label: 'Green Candle', labelRu: 'Зелёная свеча', emoji: '🕯️', color: '#006622', emissive: '#00ff44', geometry: 'candle', defaultScale: [1,1,1], effect: 'flicker', unlockLevel: 2 },
  // Crystals
  { id: 'crystal-amethyst', category: 'crystals', label: 'Amethyst', labelRu: 'Аметист', emoji: '💎', color: '#9966cc', emissive: '#6600aa', geometry: 'crystal', defaultScale: [1,1.4,1], effect: 'glow', unlockLevel: 1 },
  { id: 'crystal-quartz', category: 'crystals', label: 'Clear Quartz', labelRu: 'Горный хрусталь', emoji: '💎', color: '#e8f4ff', emissive: '#88aaff', geometry: 'crystal', defaultScale: [1,1.6,1], effect: 'glow', unlockLevel: 1 },
  { id: 'crystal-obsidian', category: 'crystals', label: 'Obsidian', labelRu: 'Обсидиан', emoji: '🪨', color: '#1a1010', emissive: '#440022', geometry: 'dodecahedron', defaultScale: [0.8,0.8,0.8], effect: 'glow', unlockLevel: 2 },
  { id: 'crystal-selenite', category: 'crystals', label: 'Selenite', labelRu: 'Селенит', emoji: '💎', color: '#f0ecff', emissive: '#ccccff', geometry: 'crystal', defaultScale: [0.7,2.2,0.7], effect: 'glow', unlockLevel: 3 },
  { id: 'crystal-labradorite', category: 'crystals', label: 'Labradorite', labelRu: 'Лабрадорит', emoji: '💎', color: '#224466', emissive: '#00aaff', geometry: 'crystal', defaultScale: [1,1.2,0.8], effect: 'glow', unlockLevel: 3 },
  // Statues
  { id: 'statue-hecate', category: 'statues', label: 'Hecate', labelRu: 'Геката', emoji: '🗿', color: '#8a7a6a', emissive: '#220044', geometry: 'box', defaultScale: [0.6,1.8,0.6], effect: 'none', unlockLevel: 2 },
  { id: 'statue-skull', category: 'statues', label: 'Skull', labelRu: 'Череп', emoji: '💀', color: '#d4c9b0', emissive: '#330011', geometry: 'sphere', defaultScale: [1,1,1], effect: 'none', unlockLevel: 1 },
  { id: 'statue-serpent', category: 'statues', label: 'Serpent Idol', labelRu: 'Идол Змея', emoji: '🐍', color: '#3a6a2a', emissive: '#004400', geometry: 'torus', defaultScale: [1,1,0.4], effect: 'none', unlockLevel: 3 },
  { id: 'statue-moon', category: 'statues', label: 'Moon Goddess', labelRu: 'Богиня Луны', emoji: '🌙', color: '#c8c0d8', emissive: '#8888cc', geometry: 'cone', defaultScale: [0.8,2,0.8], effect: 'glow', unlockLevel: 4 },
  // Incense
  { id: 'incense-stick', category: 'incense', label: 'Incense Stick', labelRu: 'Благовоние', emoji: '🌿', color: '#8B6914', emissive: '#442200', geometry: 'cylinder', defaultScale: [0.08,3,0.08], effect: 'smoke', unlockLevel: 1 },
  { id: 'incense-coil', category: 'incense', label: 'Coil Incense', labelRu: 'Спираль', emoji: '🌿', color: '#5c4011', emissive: '#331100', geometry: 'torus', defaultScale: [0.8,0.8,0.15], effect: 'smoke', unlockLevel: 2 },
  { id: 'incense-cone', category: 'incense', label: 'Incense Cone', labelRu: 'Конус', emoji: '🌿', color: '#7a5520', emissive: '#442200', geometry: 'cone', defaultScale: [0.5,0.7,0.5], effect: 'smoke', unlockLevel: 1 },
  // Cups
  { id: 'cup-chalice', category: 'cups', label: 'Chalice', labelRu: 'Чаша', emoji: '🍷', color: '#b08020', emissive: '#442200', geometry: 'cylinder', defaultScale: [0.6,1.2,0.6], effect: 'none', unlockLevel: 1 },
  { id: 'cup-cauldron', category: 'cups', label: 'Cauldron', labelRu: 'Котёл', emoji: '🫙', color: '#222222', emissive: '#004400', geometry: 'sphere', defaultScale: [1.2,0.9,1.2], effect: 'smoke', unlockLevel: 2 },
  { id: 'cup-offering', category: 'cups', label: 'Offering Bowl', labelRu: 'Жертвенная чаша', emoji: '🥣', color: '#9a7050', emissive: '#220000', geometry: 'cylinder', defaultScale: [1,0.5,1], effect: 'none', unlockLevel: 1 },
  // Coins
  { id: 'coin-gold', category: 'coins', label: 'Gold Coin', labelRu: 'Золотая монета', emoji: '🪙', color: '#ffd700', emissive: '#885500', geometry: 'cylinder', defaultScale: [0.7,0.08,0.7], effect: 'none', unlockLevel: 1 },
  { id: 'coin-silver', category: 'coins', label: 'Silver Coin', labelRu: 'Серебряная монета', emoji: '🪙', color: '#c0c0c0', emissive: '#334455', geometry: 'cylinder', defaultScale: [0.7,0.08,0.7], effect: 'none', unlockLevel: 1 },
  { id: 'coin-rune', category: 'coins', label: 'Rune Stone', labelRu: 'Руна', emoji: '🔮', color: '#667788', emissive: '#001133', geometry: 'box', defaultScale: [0.6,0.1,0.8], effect: 'glow', unlockLevel: 2 },
  // Herbs
  { id: 'herb-sage', category: 'herbs', label: 'Sage Bundle', labelRu: 'Шалфей', emoji: '🌿', color: '#8aaa66', emissive: '#223300', geometry: 'cylinder', defaultScale: [0.4,0.9,0.4], effect: 'smoke', unlockLevel: 1 },
  { id: 'herb-lavender', category: 'herbs', label: 'Lavender', labelRu: 'Лаванда', emoji: '💐', color: '#8866aa', emissive: '#331155', geometry: 'cylinder', defaultScale: [0.3,1.1,0.3], effect: 'none', unlockLevel: 1 },
  { id: 'herb-mugwort', category: 'herbs', label: 'Mugwort', labelRu: 'Полынь', emoji: '🌱', color: '#556633', emissive: '#112200', geometry: 'cone', defaultScale: [0.5,1.2,0.5], effect: 'smoke', unlockLevel: 2 },
]

export const CATEGORIES: { id: ObjectCategory; label: string; labelRu: string; emoji: string }[] = [
  { id: 'candles', label: 'Candles', labelRu: 'Свечи', emoji: '🕯️' },
  { id: 'crystals', label: 'Crystals', labelRu: 'Кристаллы', emoji: '💎' },
  { id: 'statues', label: 'Statues', labelRu: 'Статуи', emoji: '🗿' },
  { id: 'incense', label: 'Incense', labelRu: 'Ладан', emoji: '🌿' },
  { id: 'cups', label: 'Cups', labelRu: 'Чаши', emoji: '🍷' },
  { id: 'coins', label: 'Coins', labelRu: 'Монеты', emoji: '🪙' },
  { id: 'herbs', label: 'Herbs', labelRu: 'Травы', emoji: '🌱' },
]

export const ALTAR_THEMES = [
  { id: 'stone', label: 'Stone', labelRu: 'Камень', surfaceColor: '#666055', woodColor: '#555045', ambientColor: '#334455' },
  { id: 'wood', label: 'Wood', labelRu: 'Дерево', surfaceColor: '#8b5a2b', woodColor: '#6b3a1b', ambientColor: '#3a2210' },
  { id: 'obsidian', label: 'Obsidian', labelRu: 'Обсидиан', surfaceColor: '#111118', woodColor: '#0a0a12', ambientColor: '#110033' },
  { id: 'mystical', label: 'Mystical', labelRu: 'Мистический', surfaceColor: '#1a0d2e', woodColor: '#120820', ambientColor: '#220066' },
]

export const PROGRESSION_LEVELS = [
  { level: 1, name: 'Seeker', nameRu: 'Искатель', minPoints: 0, unlocksObjectCount: 8 },
  { level: 2, name: 'Apprentice', nameRu: 'Ученик', minPoints: 100, unlocksObjectCount: 14 },
  { level: 3, name: 'Practitioner', nameRu: 'Практик', minPoints: 300, unlocksObjectCount: 18 },
  { level: 4, name: 'Adept', nameRu: 'Адепт', minPoints: 700, unlocksObjectCount: 22 },
  { level: 5, name: 'Magister', nameRu: 'Магистр', minPoints: 1500, unlocksObjectCount: 26 },
]
