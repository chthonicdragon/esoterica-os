export type ChakraName =
  | 'root'
  | 'sacral'
  | 'solar_plexus'
  | 'heart'
  | 'throat'
  | 'third_eye'
  | 'crown'

export interface ChakraData {
  id: ChakraName
  name: string
  nameRu: string
  color: string
  description: string
  descriptionRu: string
  level: number // 0-100
  blockedBy: string[] // emotions that block this chakra
  note?: string
}

export interface JournalEntry {
  id: string
  date: string
  text: string
  emotions: string[]
  chakraImpact: Partial<Record<ChakraName, number>> // e.g. { root: -10, heart: +5 }
  aiAnalysis: string
  generatedImage?: string
  imageStyle?: 'dark_ritual' | 'surreal_dream' | 'divine_portrait'
}

export interface ChakraState {
  chakras: Record<ChakraName, ChakraData>
  history: { date: string; levels: Record<ChakraName, number> }[]
  journal: JournalEntry[]
  lastAnalysis: string | null
}

export const CHAKRA_INFO: Record<ChakraName, Omit<ChakraData, 'level' | 'blockedBy'>> = {
  root: {
    id: 'root',
    name: 'Root Chakra',
    nameRu: 'Муладхара',
    color: '#ff0000',
    description: 'Survival, stability, grounding.',
    descriptionRu: 'Выживание, стабильность, заземление.',
  },
  sacral: {
    id: 'sacral',
    name: 'Sacral Chakra',
    nameRu: 'Свадхистана',
    color: '#ff7f00',
    description: 'Creativity, sexuality, pleasure.',
    descriptionRu: 'Творчество, сексуальность, удовольствие.',
  },
  solar_plexus: {
    id: 'solar_plexus',
    name: 'Solar Plexus',
    nameRu: 'Манипура',
    color: '#ffff00',
    description: 'Power, will, confidence.',
    descriptionRu: 'Сила, воля, уверенность.',
  },
  heart: {
    id: 'heart',
    name: 'Heart Chakra',
    nameRu: 'Анахата',
    color: '#00ff00',
    description: 'Love, compassion, healing.',
    descriptionRu: 'Любовь, сострадание, исцеление.',
  },
  throat: {
    id: 'throat',
    name: 'Throat Chakra',
    nameRu: 'Вишудха',
    color: '#00ffff',
    description: 'Communication, expression, truth.',
    descriptionRu: 'Общение, самовыражение, правда.',
  },
  third_eye: {
    id: 'third_eye',
    name: 'Third Eye',
    nameRu: 'Аджна',
    color: '#0000ff',
    description: 'Intuition, insight, vision.',
    descriptionRu: 'Интуиция, прозрение, видение.',
  },
  crown: {
    id: 'crown',
    name: 'Crown Chakra',
    nameRu: 'Сахасрара',
    color: '#8b00ff',
    description: 'Spirituality, connection, enlightenment.',
    descriptionRu: 'Духовность, связь с космосом, просветление.',
  },
}
