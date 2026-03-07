import type { CatalogItem, AltarTheme, AltarBaseId } from './types'

export interface AltarBaseOption {
  id: AltarBaseId
  label: string
  labelRu: string
  modelUrl: string
  unlockLevel: number
  preview: string
  tint: string
  targetSpan: number
}

export const ALTAR_BASES: AltarBaseOption[] = [
  {
    id: 'base_wooden_table',
    label: 'Wooden Table',
    labelRu: 'Деревянный стол',
    modelUrl: '/models/psx_wooden_table.glb',
    unlockLevel: 1,
    preview: 'Wood',
    tint: '#745237',
    targetSpan: 2.0,
  },
  {
    id: 'base_stone_altar',
    label: 'Stone Altar',
    labelRu: 'Каменный алтарь',
    modelUrl: '/models/stone_altar.glb',
    unlockLevel: 1,
    preview: 'Stone',
    tint: '#6d7077',
    targetSpan: 2.05,
  },
  {
    id: 'base_psx_wooden',
    label: 'Wooden Altar',
    labelRu: 'Деревянный алтарь',
    modelUrl: '/models/wooden_table.glb',
    unlockLevel: 3,
    preview: 'Refined Wood',
    tint: '#6e4a2f',
    targetSpan: 2.0,
  },
  {
    id: 'base_sacrificial',
    label: 'Sacrificial Altar',
    labelRu: 'Ритуальный алтарь',
    modelUrl: '/models/sacrificial_altar.glb',
    unlockLevel: 4,
    preview: 'Ritual',
    tint: '#4f4140',
    targetSpan: 2.05,
  },
  {
    id: 'base_diana',
    label: 'Diana Grand Altar',
    labelRu: 'Великий алтарь Дианы',
    modelUrl: '/models/altar_for_diana.glb',
    unlockLevel: 6,
    preview: 'Grand',
    tint: '#807467',
    targetSpan: 2.2,
  },
]

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
  { id: 'crystal_amethyst_cut', category: 'crystals', label: 'Amethyst Cut', labelRu: 'Аметист (огранка)', color: '#a872de', emissive: '#7d4cb8', emissiveIntensity: 0.45, geometry: 'custom', modelUrl: '/models/amethyst_1.glb', scale: [0.18, 0.18, 0.18], effect: 'glow', unlockLevel: 2, points: 13 },
  { id: 'crystal_cluster_free', category: 'crystals', label: 'Crystal Cluster', labelRu: 'Кристаллический кластер', color: '#93b7d5', emissive: '#69a7ff', emissiveIntensity: 0.42, geometry: 'custom', modelUrl: '/models/crystal_cluster_2_free.glb', scale: [0.2, 0.2, 0.2], effect: 'glow', unlockLevel: 3, points: 16 },
  { id: 'crystal_amethyst_geode', category: 'crystals', label: 'Amethyst Geode', labelRu: 'Аметистовая жеода', color: '#8d63c9', emissive: '#7b56dd', emissiveIntensity: 0.48, geometry: 'custom', modelUrl: '/models/amethyst_geode.glb', scale: [0.24, 0.24, 0.24], effect: 'glow', unlockLevel: 4, points: 20 },
  { id: 'crystal_labradorite', category: 'crystals', label: 'Labradorite', labelRu: 'Лабрадорит', color: '#3a5f77', emissive: '#00aaff', emissiveIntensity: 0.6, geometry: 'box', scale: [0.16, 0.1, 0.1], effect: 'glow', unlockLevel: 4, points: 15 },

  // Statues
  { id: 'statue_hecate', category: 'statues', label: 'Hecate', labelRu: 'Геката', color: '#4a3728', emissive: '#220044', emissiveIntensity: 0.3, geometry: 'cylinder', scale: [0.12, 0.4, 0.12], unlockLevel: 1, points: 15 },
  { id: 'statue_anubis', category: 'statues', label: 'Anubis', labelRu: 'Анубис', color: '#2c1810', emissive: '#441100', emissiveIntensity: 0.2, geometry: 'box', scale: [0.18, 0.38, 0.12], unlockLevel: 3, points: 20 },
  { id: 'statue_moon', category: 'statues', label: 'Moon Goddess', labelRu: 'Лунная Богиня', color: '#c0c0c0', emissive: '#8888ff', emissiveIntensity: 0.4, geometry: 'cylinder', scale: [0.1, 0.45, 0.1], unlockLevel: 2, points: 18 },
  { id: 'statue_skull', category: 'statues', label: 'Crystal Skull', labelRu: 'Хрустальный Череп', color: '#d0e8f0', emissive: '#4488ff', emissiveIntensity: 0.5, geometry: 'sphere', scale: [0.18, 0.18, 0.18], effect: 'glow', unlockLevel: 5, points: 25 },
  { id: 'statue_veles', category: 'statues', label: 'Veles', labelRu: 'Велес', color: '#6f6458', emissive: '#4e3f2f', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/veles.glb', scale: [0.24, 0.24, 0.24], unlockLevel: 4, points: 24 },
  { id: 'statue_falcon_guardian', category: 'statues', label: 'Falcon Guardian', labelRu: 'Соколиный страж', color: '#a8926f', emissive: '#80684a', emissiveIntensity: 0.24, geometry: 'custom', modelUrl: '/models/egyptian_falcon_guardian.glb', scale: [0.24, 0.24, 0.24], placementYOffset: 0.07, unlockLevel: 4, points: 25 },
  { id: 'statue_perun', category: 'statues', label: 'Perun', labelRu: 'Перун', color: '#6f6a62', emissive: '#4a3f35', emissiveIntensity: 0.22, geometry: 'custom', modelUrl: '/models/perun.glb', scale: [0.24, 0.24, 0.24], unlockLevel: 5, points: 28 },
  { id: 'statue_zeus', category: 'statues', label: 'Zeus', labelRu: 'Зевс', color: '#b5aea2', emissive: '#6f6658', emissiveIntensity: 0.24, geometry: 'custom', modelUrl: '/models/zeus.glb', scale: [0.24, 0.24, 0.24], unlockLevel: 5, points: 29 },
  { id: 'statue_caduceus_old', category: 'statues', label: 'Old Caduceus Statuette', labelRu: 'Старинная статуэтка кадуцея', color: '#8f7a5e', emissive: '#6a583f', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/old_caduceus_statuette.glb', scale: [0.22, 0.22, 0.22], unlockLevel: 5, points: 27 },
  { id: 'statue_arachne', category: 'statues', label: 'Arachne Weaver', labelRu: 'Арахна-ткачиха', color: '#82776e', emissive: '#5a4f46', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/arachne_weaver_of_the_gods.glb', scale: [0.24, 0.24, 0.24], unlockLevel: 6, points: 31 },
  { id: 'statue_persephone_abduction', category: 'statues', label: 'Persephone Abduction', labelRu: 'Похищение Персефоны', color: '#8b8175', emissive: '#5f564a', emissiveIntensity: 0.22, geometry: 'custom', modelUrl: '/models/persephone_abduction.glb', scale: [0.25, 0.25, 0.25], unlockLevel: 6, points: 32 },
  { id: 'statue_mercure_bronze', category: 'statues', label: 'Mercure Bronze', labelRu: 'Бронзовый Меркурий', color: '#8d6f4e', emissive: '#6d543a', emissiveIntensity: 0.23, geometry: 'custom', modelUrl: '/models/mercure_gaulois_bronze.glb', scale: [0.24, 0.24, 0.24], unlockLevel: 6, points: 30 },
  { id: 'statue_mercury', category: 'statues', label: 'Mercury', labelRu: 'Меркурий', color: '#9d8a72', emissive: '#705f4d', emissiveIntensity: 0.24, geometry: 'custom', modelUrl: '/models/mercury.glb', scale: [0.25, 0.25, 0.25], unlockLevel: 7, points: 36 },

  // Herbs
  { id: 'herb_sage', category: 'herbs', label: 'Sage Bundle', labelRu: 'Шалфей', color: '#4a7c4e', emissive: '#224422', emissiveIntensity: 0.1, geometry: 'cylinder', scale: [0.08, 0.2, 0.08], unlockLevel: 1, points: 5 },
  { id: 'herb_lavender', category: 'herbs', label: 'Lavender', labelRu: 'Лаванда', color: '#7b68ee', emissive: '#4422aa', emissiveIntensity: 0.2, geometry: 'cylinder', scale: [0.06, 0.25, 0.06], unlockLevel: 1, points: 5 },
  { id: 'herb_colorful_sage', category: 'herbs', label: 'Colorful Sage', labelRu: 'Разноцветный шалфей', color: '#72a37e', emissive: '#3e7a56', emissiveIntensity: 0.12, geometry: 'custom', modelUrl: '/models/colorful_sage.glb', scale: [0.2, 0.2, 0.2], placementYOffset: 0.01, placementRotationX: Math.PI / 2, unlockLevel: 2, points: 11 },
  { id: 'herb_dried_sagebrush', category: 'herbs', label: 'Dried Sagebrush', labelRu: 'Сушёный шалфей', color: '#6f8a62', emissive: '#38503a', emissiveIntensity: 0.12, geometry: 'custom', modelUrl: '/models/dried_sagebrush.glb', scale: [0.2, 0.2, 0.2], placementYOffset: 0.01, placementRotationX: Math.PI / 2, unlockLevel: 2, points: 12 },
  { id: 'herb_dried_lavender', category: 'herbs', label: 'Dried Lavender Flowers', labelRu: 'Сушёная лаванда', color: '#8d78c7', emissive: '#5f4a8a', emissiveIntensity: 0.16, geometry: 'custom', modelUrl: '/models/dried_lavender_flowers.glb', scale: [0.22, 0.22, 0.22], placementYOffset: 0.01, placementRotationX: Math.PI / 2, unlockLevel: 3, points: 15 },
  { id: 'herb_mugwort', category: 'herbs', label: 'Mugwort', labelRu: 'Полынь', color: '#556b2f', emissive: '#223311', emissiveIntensity: 0.1, geometry: 'cylinder', scale: [0.07, 0.22, 0.07], unlockLevel: 2, points: 7 },
  { id: 'herb_belladonna', category: 'herbs', label: 'Belladonna', labelRu: 'Белладонна', color: '#800040', emissive: '#440022', emissiveIntensity: 0.3, geometry: 'sphere', scale: [0.08, 0.08, 0.08], unlockLevel: 4, points: 15 },

  // Incense
  { id: 'incense_stick', category: 'incense', label: 'Incense Stick', labelRu: 'Ароматическая палочка', color: '#4a3000', emissive: '#ff6600', emissiveIntensity: 0.2, geometry: 'cylinder', scale: [0.02, 0.3, 0.02], effect: 'smoke', unlockLevel: 1, points: 5 },
  { id: 'incense_cone', category: 'incense', label: 'Incense Cone', labelRu: 'Конус благовоний', color: '#5c3d11', emissive: '#ff8800', emissiveIntensity: 0.3, geometry: 'cone', scale: [0.08, 0.12, 0.08], effect: 'smoke', unlockLevel: 1, points: 5 },
  { id: 'incense_coil', category: 'incense', label: 'Dragon Coil', labelRu: 'Спираль дракона', color: '#3d1f00', emissive: '#aa4400', emissiveIntensity: 0.4, geometry: 'torus', scale: [0.1, 0.03, 0.1], effect: 'smoke', unlockLevel: 3, points: 10 },
  { id: 'incense_resin_bundle', category: 'incense', label: 'Resin Incense', labelRu: 'Смоляное благовоние', color: '#7a4c25', emissive: '#d57f2d', emissiveIntensity: 0.18, geometry: 'custom', modelUrl: '/models/incense_1.glb', scale: [0.2, 0.2, 0.2], effect: 'smoke', unlockLevel: 2, points: 12 },
  { id: 'incense_burner_bronze', category: 'incense', label: 'Bronze Incense Burner', labelRu: 'Бронзовая курильница', color: '#9a6e44', emissive: '#c68236', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/incense_burner.glb', scale: [0.22, 0.22, 0.22], effect: 'smoke', unlockLevel: 3, points: 16 },
  { id: 'incense_burner_qianlong', category: 'incense', label: 'Qianlong Incense Burner', labelRu: 'Курильница Цяньлун', color: '#8d7350', emissive: '#b08955', emissiveIntensity: 0.22, geometry: 'custom', modelUrl: '/models/qianlong_emporer_incense_burner.glb', scale: [0.24, 0.24, 0.24], effect: 'smoke', unlockLevel: 5, points: 24 },

  // Cups
  { id: 'cup_chalice', category: 'cups', label: 'Chalice', labelRu: 'Чаша', color: '#8b6914', emissive: '#aa8800', emissiveIntensity: 0.3, geometry: 'cylinder', scale: [0.14, 0.2, 0.14], unlockLevel: 1, points: 8 },
  { id: 'cup_cauldron', category: 'cups', label: 'Cauldron', labelRu: 'Котёл', color: '#1c1c1c', emissive: '#004400', emissiveIntensity: 0.4, geometry: 'sphere', scale: [0.18, 0.14, 0.18], effect: 'smoke', unlockLevel: 2, points: 12 },
  { id: 'cup_cauldron_model', category: 'cups', label: 'Cauldron Vessel', labelRu: 'Ритуальный котёл', color: '#3c3835', emissive: '#4f4a45', emissiveIntensity: 0.22, geometry: 'custom', modelUrl: '/models/cauldron.glb', scale: [0.22, 0.22, 0.22], effect: 'smoke', unlockLevel: 3, points: 18 },
  { id: 'cup_offering', category: 'cups', label: 'Offering Bowl', labelRu: 'Чаша для подношений', color: '#c4a747', emissive: '#886600', emissiveIntensity: 0.2, geometry: 'cylinder', scale: [0.16, 0.08, 0.16], unlockLevel: 1, points: 8 },
  { id: 'cup_goblet_ritual', category: 'cups', label: 'Ritual Goblet', labelRu: 'Ритуальный кубок', color: '#b98a4f', emissive: '#9b6d2f', emissiveIntensity: 0.22, geometry: 'custom', modelUrl: '/models/goblet_01.glb', scale: [0.18, 0.18, 0.18], unlockLevel: 2, points: 14 },
  { id: 'cup_goblet_lowpoly', category: 'cups', label: 'Lowpoly Goblet', labelRu: 'Лоуполи кубок', color: '#9e7651', emissive: '#7a5a3c', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/goblet_gameready_lowpoly.glb', scale: [0.18, 0.18, 0.18], unlockLevel: 3, points: 16 },
  { id: 'cup_goblet_wolnir', category: 'cups', label: 'Wolnir Goblet', labelRu: 'Кубок Волнира', color: '#b7a37c', emissive: '#8a7754', emissiveIntensity: 0.24, geometry: 'custom', modelUrl: '/models/wolnirs_goblet.glb', scale: [0.2, 0.2, 0.2], unlockLevel: 4, points: 20 },

  // Coins
  { id: 'coin_gold', category: 'coins', label: 'Gold Coin', labelRu: 'Золотая монета', color: '#ffd700', emissive: '#cc9900', emissiveIntensity: 0.4, geometry: 'cylinder', scale: [0.1, 0.02, 0.1], effect: 'sparkle', unlockLevel: 1, points: 6 },
  { id: 'coin_silver', category: 'coins', label: 'Silver Coin', labelRu: 'Серебряная монета', color: '#c0c0c0', emissive: '#8888aa', emissiveIntensity: 0.3, geometry: 'cylinder', scale: [0.1, 0.02, 0.1], effect: 'sparkle', unlockLevel: 1, points: 6 },
  { id: 'coin_pentacle_sigil', category: 'coins', label: 'Pentacle Sigil', labelRu: 'Пентакль-сигил', color: '#b88947', emissive: '#825d2b', emissiveIntensity: 0.35, geometry: 'custom', modelUrl: '/models/pentacle.glb', scale: [0.2, 0.2, 0.2], effect: 'glow', unlockLevel: 2, points: 14 },
  { id: 'coin_pentacle', category: 'coins', label: 'Pentacle Coin', labelRu: 'Монета пентакля', color: '#b8860b', emissive: '#884400', emissiveIntensity: 0.5, geometry: 'cylinder', scale: [0.12, 0.02, 0.12], effect: 'glow', unlockLevel: 3, points: 12 },
  { id: 'coin_pentagram_mark', category: 'coins', label: 'Pentagram Mark', labelRu: 'Пентаграмма', color: '#b8884b', emissive: '#8d5f30', emissiveIntensity: 0.36, geometry: 'custom', modelUrl: '/models/pentacle_pentagram.glb', scale: [0.18, 0.18, 0.18], effect: 'glow', unlockLevel: 3, points: 15 },

  // Custom GLB objects distributed by semantic categories
  { id: 'model_candles_set', category: 'candles', label: 'Candles Set', labelRu: 'Набор свечей', color: '#d7c8a8', emissive: '#ff9b3d', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/candles.glb', scale: [0.16, 0.16, 0.16], effect: 'flicker', unlockLevel: 1, points: 14 },
  { id: 'model_candle_holder', category: 'candles', label: 'Candle Holder', labelRu: 'Подсвечник', color: '#c8b08b', emissive: '#ff9d4f', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/simple_candle_in_candle_holder.glb', scale: [0.14, 0.14, 0.14], effect: 'flicker', unlockLevel: 1, points: 16 },
  { id: 'model_bowl_of_candles', category: 'candles', label: 'Bowl of Candles', labelRu: 'Чаша свечей', color: '#d9bf9e', emissive: '#ff9b3d', emissiveIntensity: 0.22, geometry: 'custom', modelUrl: '/models/bowl_of_candles.glb', scale: [0.22, 0.22, 0.22], effect: 'flicker', unlockLevel: 2, points: 18 },
  { id: 'model_candle_single', category: 'candles', label: 'Single Candle', labelRu: 'Одиночная свеча', color: '#f5e9d6', emissive: '#ff9b3d', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/just_a_candle.glb', scale: [0.12, 0.12, 0.12], effect: 'flicker', unlockLevel: 1, points: 12 },
  { id: 'model_candle_holder_classic', category: 'candles', label: 'Classic Candle Holder', labelRu: 'Классический подсвечник', color: '#d0b38b', emissive: '#ff9d4f', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/candle_holder.glb', scale: [0.16, 0.16, 0.16], effect: 'flicker', unlockLevel: 2, points: 15 },

  { id: 'model_artemis', category: 'statues', label: 'Artemis', labelRu: 'Артемида', color: '#c8c9d2', emissive: '#7e89d6', emissiveIntensity: 0.25, geometry: 'custom', modelUrl: '/models/goddess_artemis.glb', scale: [0.28, 0.28, 0.28], unlockLevel: 3, points: 20 },
  { id: 'model_venus', category: 'statues', label: 'Venus Goddess', labelRu: 'Богиня Венера', color: '#d5c8b8', emissive: '#9c8ad6', emissiveIntensity: 0.25, geometry: 'custom', modelUrl: '/models/venus_goddess.glb', scale: [0.24, 0.24, 0.24], unlockLevel: 3, points: 22 },
  { id: 'model_hecate_triformis', category: 'statues', label: 'Hecate Triformis', labelRu: 'Геката Триформида', color: '#b7b0a7', emissive: '#7b66bb', emissiveIntensity: 0.22, geometry: 'custom', modelUrl: '/models/hecate_triformis.glb', scale: [0.26, 0.26, 0.26], unlockLevel: 4, points: 26 },

  { id: 'model_crystal_ball', category: 'crystals', label: 'Crystal Ball', labelRu: 'Хрустальный шар', color: '#9dc1e8', emissive: '#6caeff', emissiveIntensity: 0.35, geometry: 'custom', modelUrl: '/models/crystal_ball.glb', scale: [0.2, 0.2, 0.2], effect: 'glow', placementYOffset: 0.02, unlockLevel: 4, points: 22 },
  { id: 'model_triple_moon', category: 'coins', label: 'Triple Moon Emblem', labelRu: 'Тройная Луна', color: '#cfd4ef', emissive: '#7f94ff', emissiveIntensity: 0.25, geometry: 'custom', modelUrl: '/models/triple_moon_emblem.glb', scale: [0.2, 0.2, 0.2], effect: 'glow', unlockLevel: 2, points: 17 },

  { id: 'model_spell_book', category: 'tools', label: 'Spell Book', labelRu: 'Книга заклинаний', color: '#4d3a2a', emissive: '#6f4e37', emissiveIntensity: 0.2, geometry: 'custom', modelUrl: '/models/spell_book.glb', scale: [0.2, 0.2, 0.2], placementYOffset: -0.015, placementRotationX: 0, placementRotationZ: 0, unlockLevel: 3, points: 18 },
  { id: 'model_obsidian_knife', category: 'tools', label: 'Obsidian Knife', labelRu: 'Обсидиановый нож', color: '#15161d', emissive: '#2c2f3d', emissiveIntensity: 0.18, geometry: 'custom', modelUrl: '/models/obsidian_knife.glb', scale: [0.2, 0.2, 0.2], placementYOffset: 0.018, placementRotationX: 0, placementRotationZ: Math.PI / 2, unlockLevel: 4, points: 21 },
]

export const CATEGORY_LABELS: Record<string, { en: string; ru: string; emoji: string }> = {
  candles:  { en: 'Candles',  ru: 'Свечи',     emoji: '🕯️' },
  crystals: { en: 'Crystals', ru: 'Кристаллы', emoji: '💎' },
  statues:  { en: 'Statues',  ru: 'Статуи',    emoji: '🗿' },
  herbs:    { en: 'Herbs',    ru: 'Травы',      emoji: '🌿' },
  incense:  { en: 'Incense',  ru: 'Благовония', emoji: '🌸' },
  cups:     { en: 'Cups',     ru: 'Чаши',       emoji: '🍷' },
  coins:    { en: 'Coins',    ru: 'Монеты',     emoji: '🪙' },
  tools:    { en: 'Tools',    ru: 'Инструменты', emoji: '🗡️' },
  decor:    { en: 'Decor',    ru: 'Декор',      emoji: '🏺' },
}

export function getRequiredUnlockLevel(item: CatalogItem): number {
  // Detailed GLB models and very high-value artifacts unlock slightly later.
  const detailedBias = item.geometry === 'custom' ? 1 : 0
  const rarityBias = item.points >= 24 ? 1 : 0
  return Math.min(10, item.unlockLevel + detailedBias + rarityBias)
}

export function isCatalogItemUnlocked(item: CatalogItem, userLevel: number): boolean {
  return userLevel >= getRequiredUnlockLevel(item)
}

export function getRequiredBaseUnlockLevel(baseId: AltarBaseId): number {
  const base = ALTAR_BASES.find(x => x.id === baseId)
  if (!base) return 1
  // Keep grand/large altar bases for deeper progression.
  if (base.id === 'base_diana') return Math.min(10, base.unlockLevel + 1)
  return base.unlockLevel
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
