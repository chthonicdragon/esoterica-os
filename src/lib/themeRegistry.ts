// src/lib/themeRegistry.ts
// Single source of truth for the Esoterica OS Theme Engine

export type ThemeBackgroundType = 'geometric' | 'particles' | 'nebula' | 'matrix' | 'waves';

export interface ThemeColors {
  background: string;     // HSL triplet: "253 38% 3%"
  foreground: string;     // HSL triplet: "270 20% 88%"
  primary: string;        // HSL triplet: "267 80% 60%"
  accent: string;         // HSL triplet: "172 100% 36%"
  muted: string;          // HSL triplet: "255 25% 9%"
  border: string;         // HSL triplet: "258 30% 14%"
  card: string;           // HSL triplet: "255 30% 6%"
  sidebar: string;        // HSL triplet: "255 35% 5%"
  neon: string;           // HSL triplet: "172 100% 45%"
}

export interface ThemeDefinition {
  id: string;
  name: { en: string; ru: string };
  description: { en: string; ru: string };
  colors: ThemeColors;
  backgroundType: ThemeBackgroundType;
  musicTrack?: string;
  isPremium?: boolean;
}

export const BUILTIN_THEMES: ThemeDefinition[] = [
  {
    id: 'void',
    name: { en: 'Void', ru: 'Пустота' },
    description: { en: 'Deep violet high-tech mysticism', ru: 'Глубокий фиолетовый хай-тек мистицизм' },
    backgroundType: 'geometric',
    musicTrack: '/sounds/ambient.mp3',
    colors: {
      background: '253 38% 3%',
      foreground: '270 20% 88%',
      primary: '267 80% 60%',
      accent: '172 100% 36%',
      muted: '255 25% 9%',
      border: '258 30% 14%',
      card: '255 30% 6%',
      sidebar: '255 35% 5%',
      neon: '172 100% 45%',
    },
  },
  {
    id: 'crimson-abyss',
    name: { en: 'Crimson Abyss', ru: 'Багровая бездна' },
    description: { en: 'Fiery intensity and dark ritual', ru: 'Огненная страсть и темные ритуалы' },
    backgroundType: 'particles',
    musicTrack: '/sounds/whisper.mp3',
    colors: {
      background: '0 50% 3%',
      foreground: '0 30% 90%',
      primary: '0 80% 50%',
      accent: '20 100% 60%',
      muted: '0 20% 10%',
      border: '0 40% 15%',
      card: '0 40% 7%',
      sidebar: '0 45% 4%',
      neon: '0 100% 60%',
    },
  },
  {
    id: 'lunar-veil',
    name: { en: 'Lunar Veil', ru: 'Лунная вуаль' },
    description: { en: 'Ethereal silver and midnight blue', ru: 'Эфирное серебро и полночный синий' },
    backgroundType: 'nebula',
    musicTrack: '/sounds/wind.mp3',
    colors: {
      background: '220 40% 4%',
      foreground: '210 20% 90%',
      primary: '210 50% 70%',
      accent: '190 80% 60%',
      muted: '220 20% 12%',
      border: '210 30% 18%',
      card: '220 35% 8%',
      sidebar: '220 40% 5%',
      neon: '190 100% 70%',
    },
  },
  {
    id: 'emerald-grove',
    name: { en: 'Emerald Grove', ru: 'Изумрудная роща' },
    description: { en: 'Nature magic and ancient forests', ru: 'Магия природы и древние леса' },
    backgroundType: 'waves',
    musicTrack: '/sounds/ambient.mp3',
    colors: {
      background: '140 40% 3%',
      foreground: '140 20% 90%',
      primary: '142 70% 45%',
      accent: '120 80% 60%',
      muted: '140 20% 10%',
      border: '140 30% 15%',
      card: '140 35% 7%',
      sidebar: '140 40% 4%',
      neon: '120 100% 55%',
    },
  },
  {
    id: 'solar-forge',
    name: { en: 'Solar Forge', ru: 'Солнечная кузница' },
    description: { en: 'Radiant power and golden alchemy', ru: 'Сияющая мощь и золотая алхимия' },
    backgroundType: 'particles',
    musicTrack: '/sounds/ritual-start.mp3',
    colors: {
      background: '35 40% 4%',
      foreground: '40 20% 92%',
      primary: '45 90% 50%',
      accent: '50 100% 60%',
      muted: '35 20% 12%',
      border: '40 30% 18%',
      card: '35 35% 8%',
      sidebar: '35 40% 5%',
      neon: '50 100% 65%',
    },
  },
  {
    id: 'abyssal-tide',
    name: { en: 'Abyssal Tide', ru: 'Бездна прилива' },
    description: { en: 'Oceanic mysteries and deep currents', ru: 'Океанические тайны и глубокие течения' },
    backgroundType: 'waves',
    musicTrack: '/sounds/ambient.mp3',
    colors: {
      background: '200 50% 3%',
      foreground: '200 20% 90%',
      primary: '199 80% 45%',
      accent: '185 100% 50%',
      muted: '200 20% 10%',
      border: '200 30% 15%',
      card: '200 35% 7%',
      sidebar: '200 40% 4%',
      neon: '185 100% 55%',
    },
  },
  {
    id: 'sigil-matrix',
    name: { en: 'Sigil Matrix', ru: 'Матрица сигил' },
    description: { en: 'The rain of ancient code', ru: 'Дождь из древнего кода' },
    backgroundType: 'matrix',
    musicTrack: '/sounds/whisper.mp3',
    colors: {
      background: '160 50% 2%',
      foreground: '160 20% 90%',
      primary: '162 100% 40%',
      accent: '160 100% 50%',
      muted: '160 20% 8%',
      border: '160 30% 12%',
      card: '160 35% 5%',
      sidebar: '160 40% 3%',
      neon: '160 100% 45%',
    },
  },
];

export const DEFAULT_THEME = BUILTIN_THEMES[0];

/* ── TEMPLATE for adding new themes ──────────────────────────────────────────
{
  id: 'unique-id',
  name: { en: 'Name', ru: 'Название' },
  description: { en: 'Description', ru: 'Описание' },
  backgroundType: 'geometric' | 'particles' | 'nebula' | 'matrix' | 'waves',
  musicTrack: '/sounds/your-track.mp3',
  colors: {
    background: 'H S L', // e.g. "253 38% 3%"
    foreground: 'H S L',
    primary: 'H S L',
    accent: 'H S L',
    muted: 'H S L',
    border: 'H S L',
    card: 'H S L',
    sidebar: 'H S L',
    neon: 'H S L',
  },
},
───────────────────────────────────────────────────────────────────────────── */
