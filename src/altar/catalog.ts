import type { CatalogItem, AltarTheme } from './types'

export const CATALOG: CatalogItem[] = [
  // Candles
  { id: 'candle_white', category: 'candles', label: 'White Candle', labelRu: 'Белая свеча', color: '#f5f5e8', emissive: '#ff8c00', emissiveIntensity: 0.6, geometry: 'cylinder', scale: [0.08, 0.35, 0.08], effect: 'flicker', unlockLevel: 1, points: 5 },
  { id: 'candle_black', category: 'candles', label: 'Black Candle', labelRu: 'Чёрная свеча', color: '#1a1a1a', emissive: '#ff4400', emissiveIntensity: 0.5, geometry: 'cylinder', scale: [0.08, 0.35, 0.08], effect: 'flicker', unlockLevel: 1, points: 5 },
  { id: 'candle_red', category: 'candles', label: 'Red Candle', labelRu: 'Красная свеча', color: '#8b0000', emissive: '#ff2200', emissiveIntensity: 0.7, geometry: 'cylinder', scale: [0.08, 0.35, 0.08], effect: 'flicker', unlockLevel: 1, points: 5 },
  { id: 'candle_purple', category: 'candles', label: 'Purple Candle', labelRu: 'Фиолетовая свеча', color: '#4a0080', emissive: '#9400ff', emissiveIntensity: 0.6, geometry: 'cylinder', scale: [0.08, 0.35, 0.08], effect: 'flicker', unlockLevel: 2, points: 8 },
  { id: 'candle_gold', category: 'candles', label: 'Gold Candle', labelRu: 'Золотая свеча', color: '#b8860b', emissive: '#ffd700', emissiveIntensity: 0.7, geometry: 'cylinder', scale: [0.1, 0.4, 0.1], effect: 'flicker', unlockLevel: 3, points: 12 },

  // Crystals
  { id: 'crystal_amethyst', category: 'crystals', label: 'Amethyst', labelRu: 'Аметист', color: '#9b59b6', emissive: '#8e44ad', emissiveIntensity: 0.5, geometry: 'cone', scale: [0.12, 0.22, 0.12], effect: 'glow', unlockLevel: 1, points: 8 },
  { id: 'crystal_quartz', category: 'crystals', label: 'Clear Quartz', labelRu: 'Горный хрусталь', color: '#e8f4f8', emissive: '#00d4ff', emissiveIntensity: 0.4, geometry: 'cone', scale: [0.12, 0.22, 0.12], effect: 'glow', unlockLevel: 1, points: 8 },
  { id: 'crystal_obsidian', category: 'crystals', label: 'Obsidian', labelRu: 'Обсидиан', color: '#0a0a0a', emissive: '#220033', emissiveIntensity: 0.3, geometry: 'cone', scale: [0.14, 0.2, 0.14], effect: 'glow', unlockLevel: 2, points: 10 },
  { id: 'crystal_rose', category: 'crystals', label: 'Rose Quartz', labelRu: 'Розовый кварц', color: '#ffb3c1', emissive: '#ff69b4', emissiveIntensity: 0.5, geometry: 'sphere', scale: [0.12, 0.12, 0.12], effect: 'glow', unlockLevel: 2, points: 10 },
  { id: 'crystal_labradorite', category: 'crystals', label: 'Labradorite', labelRu: 'Лабрадорит', color: '#3a5f77', emissive: '#00aaff', emissiveIntensity: 0.6, geometry: 'box', scale: [0.16, 0.1, 0.1], effect: 'glow', unlockLevel: 4, points: 15 },

  // Statues
  { id: 'statue_hecate', category: 'statues', label: 'Hecate', labelRu: 'Геката', color: '#4a3728', emissive: '#220044', emissiveIntensity: 0.3, geometry: 'cylinder', scale: [0.12, 0.4, 0.12], unlockLevel: 1, points: 15 },
  { id: 'statue_anubis', category: 'statues', label: 'Anubis', labelRu: 'Анубис', color: '#2c1810', emissive: '#441100', emissiveIntensity: 0.2, geometry: 'box', scale: [0.18, 0.38, 0.12], unlockLevel: 3, points: 20 },
  { id: 'statue_moon', category: 'statues', label: 'Moon Goddess', labelRu: 'Лунная Богиня', color: '#c0c0c0', emissive: '#8888ff', emissiveIntensity: 0.4, geometry: 'cylinder', scale: [0.1, 0.45, 0.1], unlockLevel: 2, points: 18 },
  { id: 'statue_skull', category: 'statues', label: 'Crystal Skull', labelRu: 'Хрустальный Череп', color: '#d0e8f0', emissive: '#4488ff', emissiveIntensity: 0.5, geometry: 'sphere', scale: [0.18, 0.18, 0.18], effect: 'glow', unlockLevel: 5, points: 25 },

  // Herbs
  { id: 'herb_sage', category: 'herbs', label: 'Sage Bundle', labelRu: 'Шалфей', color: '#4a7c4e', emissive: '#224422', emissiveIntensity: 0.1, geometry: 'cylinder', scale: [0.08, 0.2, 0.08], unlockLevel: 1, points: 5 },
  { id: 'herb_lavender', category: 'herbs', label: 'Lavender', labelRu: 'Лаванда', color: '#7b68ee', emissive: '#4422aa', emissiveIntensity: 0.2, geometry: 'cylinder', scale: [0.06, 0.25, 0.06], unlockLevel: 1, points: 5 },
  { id: 'herb_mugwort', category: 'herbs', label: 'Mugwort', labelRu: 'Полынь', color: '#556b2f', emissive: '#223311', emissiveIntensity: 0.1, geometry: 'cylinder', scale: [0.07, 0.22, 0.07], unlockLevel: 2, points: 7 },
  { id: 'herb_belladonna', category: 'herbs', label: 'Belladonna', labelRu: 'Белладонна', color: '#800040', emissive: '#440022', emissiveIntensity: 0.3, geometry: 'sphere', scale: [0.08, 0.08, 0.08], unlockLevel: 4, points: 15 },

  // Incense
  { id: 'incense_stick', category: 'incense', label: 'Incense Stick', labelRu: 'Ароматическая палочка', color: '#4a3000', emissive: '#ff6600', emissiveIntensity: 0.2, geometry: 'cylinder', scale: [0.02, 0.3, 0.02], effect: 'smoke', unlockLevel: 1, points: 5 },
  { id: 'incense_cone', category: 'incense', label: 'Incense Cone', labelRu: 'Конус благовоний', color: '#5c3d11', emissive: '#ff8800', emissiveIntensity: 0.3, geometry: 'cone', scale: [0.08, 0.12, 0.08], effect: 'smoke', unlockLevel: 1, points: 5 },
  { id: 'incense_coil', category: 'incense', label: 'Dragon Coil', labelRu: 'Спираль дракона', color: '#3d1f00', emissive: '#aa4400', emissiveIntensity: 0.4, geometry: 'torus', scale: [0.1, 0.03, 0.1], effect: 'smoke', unlockLevel: 3, points: 10 },

  // Cups
  { id: 'cup_chalice', category: 'cups', label: 'Chalice', labelRu: 'Чаша', color: '#8b6914', emissive: '#aa8800', emissiveIntensity: 0.3, geometry: 'cylinder', scale: [0.14, 0.2, 0.14], unlockLevel: 1, points: 8 },
  { id: 'cup_cauldron', category: 'cups', label: 'Cauldron', labelRu: 'Котёл', color: '#1c1c1c', emissive: '#004400', emissiveIntensity: 0.4, geometry: 'sphere', scale: [0.18, 0.14, 0.18], effect: 'smoke', unlockLevel: 2, points: 12 },
  { id: 'cup_offering', category: 'cups', label: 'Offering Bowl', labelRu: 'Чаша для подношений', color: '#c4a747', emissive: '#886600', emissiveIntensity: 0.2, geometry: 'cylinder', scale: [0.16, 0.08, 0.16], unlockLevel: 1, points: 8 },

  // Coins
  { id: 'coin_gold', category: 'coins', label: 'Gold Coin', labelRu: 'Золотая монета', color: '#ffd700', emissive: '#cc9900', emissiveIntensity: 0.4, geometry: 'cylinder', scale: [0.1, 0.02, 0.1], effect: 'sparkle', unlockLevel: 1, points: 6 },
  { id: 'coin_silver', category: 'coins', label: 'Silver Coin', labelRu: 'Серебряная монета', color: '#c0c0c0', emissive: '#8888aa', emissiveIntensity: 0.3, geometry: 'cylinder', scale: [0.1, 0.02, 0.1], effect: 'sparkle', unlockLevel: 1, points: 6 },
  { id: 'coin_pentacle', category: 'coins', label: 'Pentacle Coin', labelRu: 'Монета пентакля', color: '#b8860b', emissive: '#884400', emissiveIntensity: 0.5, geometry: 'cylinder', scale: [0.12, 0.02, 0.12], effect: 'glow', unlockLevel: 3, points: 12 },

  // External 3D models (optimized GLB)
  { id: 'model_candles_set', category: 'models', label: 'Candles Set', labelRu: 'Набор свечей', color: '#d7c8a8', emissive: '#ff9b3d', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/candles.glb', scale: [0.16, 0.16, 0.16], effect: 'flicker', unlockLevel: 1, points: 14 },
  { id: 'model_artemis', category: 'models', label: 'Artemis', labelRu: 'Артемида', color: '#c8c9d2', emissive: '#7e89d6', emissiveIntensity: 0.25, geometry: 'custom', modelUrl: '/models/goddess_artemis.glb', scale: [0.28, 0.28, 0.28], unlockLevel: 3, points: 20 },
  { id: 'model_candle_holder', category: 'models', label: 'Candle Holder', labelRu: 'Подсвечник', color: '#c8b08b', emissive: '#ff9d4f', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/simple_candle_in_candle_holder.glb', scale: [0.14, 0.14, 0.14], effect: 'flicker', unlockLevel: 1, points: 16 },
  { id: 'model_venus', category: 'models', label: 'Venus Goddess', labelRu: 'Богиня Венера', color: '#d5c8b8', emissive: '#9c8ad6', emissiveIntensity: 0.25, geometry: 'custom', modelUrl: '/models/venus_goddess.glb', scale: [0.24, 0.24, 0.24], unlockLevel: 3, points: 22 },
  { id: 'model_hecate_triformis', category: 'models', label: 'Hecate Triformis', labelRu: 'Геката Триформида', color: '#b7b0a7', emissive: '#7b66bb', emissiveIntensity: 0.22, geometry: 'custom', modelUrl: '/models/hecate_triformis.glb', scale: [0.26, 0.26, 0.26], unlockLevel: 4, points: 26 },
  { id: 'model_bowl_of_candles', category: 'models', label: 'Bowl of Candles', labelRu: 'Чаша свечей', color: '#d9bf9e', emissive: '#ff9b3d', emissiveIntensity: 0.22, geometry: 'custom', modelUrl: '/models/bowl_of_candles.glb', scale: [0.22, 0.22, 0.22], effect: 'flicker', unlockLevel: 2, points: 18 },
  { id: 'model_candle_single', category: 'models', label: 'Single Candle', labelRu: 'Одиночная свеча', color: '#f5e9d6', emissive: '#ff9b3d', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/just_a_candle.glb', scale: [0.12, 0.12, 0.12], effect: 'flicker', unlockLevel: 1, points: 12 },
  { id: 'model_triple_moon', category: 'models', label: 'Triple Moon Emblem', labelRu: 'Тройная Луна', color: '#cfd4ef', emissive: '#7f94ff', emissiveIntensity: 0.25, geometry: 'custom', modelUrl: '/models/triple_moon_emblem.glb', scale: [0.2, 0.2, 0.2], effect: 'glow', unlockLevel: 2, points: 17 },
  { id: 'model_candle_holder_classic', category: 'models', label: 'Classic Candle Holder', labelRu: 'Классический подсвечник', color: '#d0b38b', emissive: '#ff9d4f', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/candle_holder.glb', scale: [0.16, 0.16, 0.16], effect: 'flicker', unlockLevel: 2, points: 15 },
]

export const CATEGORY_LABELS: Record<string, { en: string; ru: string; emoji: string }> = {
  candles:  { en: 'Candles',  ru: 'Свечи',     emoji: '🕯️' },
  crystals: { en: 'Crystals', ru: 'Кристаллы', emoji: '💎' },
  statues:  { en: 'Statues',  ru: 'Статуи',    emoji: '🗿' },
  herbs:    { en: 'Herbs',    ru: 'Травы',      emoji: '🌿' },
  incense:  { en: 'Incense',  ru: 'Благовония', emoji: '🌸' },
  cups:     { en: 'Cups',     ru: 'Чаши',       emoji: '🍷' },
  coins:    { en: 'Coins',    ru: 'Монеты',     emoji: '🪙' },
  models:   { en: '3D Models', ru: '3D модели', emoji: '🧩' },
}

export interface ThemeConfig {
  name: string
  nameRu: string
  altarColor: string
  altarRoughness: number
  altarMetalness: number
  floorColor: string
  fogColor: string
  ambientColor: string
  ambientIntensity: number
}

export const ALTAR_THEMES: Record<AltarTheme, ThemeConfig> = {
  stone: {
    name: 'Stone', nameRu: 'Камень',
    altarColor: '#5a5a5a', altarRoughness: 0.9, altarMetalness: 0.05,
    floorColor: '#2a2a2a', fogColor: '#1a1a2e', ambientColor: '#8888bb', ambientIntensity: 0.4,
  },
  wood: {
    name: 'Wood', nameRu: 'Дерево',
    altarColor: '#5c3317', altarRoughness: 0.85, altarMetalness: 0.0,
    floorColor: '#1a0e00', fogColor: '#1a0e00', ambientColor: '#cc9966', ambientIntensity: 0.3,
  },
  obsidian: {
    name: 'Obsidian', nameRu: 'Обсидиан',
    altarColor: '#0a0a14', altarRoughness: 0.1, altarMetalness: 0.9,
    floorColor: '#050510', fogColor: '#05050f', ambientColor: '#6622cc', ambientIntensity: 0.35,
  },
  mystical: {
    name: 'Mystical', nameRu: 'Мистический',
    altarColor: '#1a0a2e', altarRoughness: 0.3, altarMetalness: 0.5,
    floorColor: '#0a0514', fogColor: '#0a0514', ambientColor: '#aa44ff', ambientIntensity: 0.5,
  },
}
