import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LanguageContext'
import { useAudio } from '../contexts/AudioContext'
import { db } from '../lib/platformClient'
import { getMoonPhase, moonEmoji, moonEnergy, moonEnergyRu, type MoonPhase } from '../utils/moonPhase'
import { Plus, Moon, Trash2, TrendingUp, X } from 'lucide-react'
import SunCalc from 'suncalc'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'
import { extractAndMerge } from '../services/knowledgeGraphBridge'
import { eventBus } from '../lib/eventBus'
import { WeatherRitualsBanner } from '../components/WeatherRitualsBanner'
import { DailyGuidance } from '../components/DailyGuidance'

interface Ritual {
  id: string
  title: string
  type?: string
  description?: string
  source?: 'manual' | 'auto'
  deity?: string
  date?: string
  intention?: string
  moonPhase?: string
  moon_phase?: string
  planetary_hour?: string
  tools?: string
  outcome?: string
  energyLevel: number
  notes?: string
  result_rating?: number
  emotional_state?: string
  sensations_during?: string
  outcome_later?: string
  createdAt: string
}

interface FestivalDay {
  id: string
  nameRu: string
  nameEn: string
  date: string
  emoji: string
  infoRu: string
  infoEn: string
}

type PlanetKey = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn'

interface PlanetaryHour {
  planet: PlanetKey
  start: Date
  end: Date
  isDay: boolean
}

interface HecateDay {
  id: 'deipnon' | 'noumenia' | 'agathos-daimon'
  icon: string
  date: Date
  titleRu: string
  titleEn: string
  meaningRu: string
  meaningEn: string
  detailsRu: string
  detailsEn: string
}

interface MagicalHoliday {
  name: string
  nameRu: string
  date: string // MM-DD
  description: string
  descriptionRu: string
}

const CHALDEAN_ORDER: PlanetKey[] = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon']

const WEEKDAY_RULER: Record<number, PlanetKey> = {
  0: 'sun',
  1: 'moon',
  2: 'mars',
  3: 'mercury',
  4: 'jupiter',
  5: 'venus',
  6: 'saturn',
}

const PLANET_META: Record<PlanetKey, { symbol: string; en: string; ru: string; focusEn: string[]; focusRu: string[] }> = {
  sun: { symbol: '☉', en: 'Sun', ru: 'Солнце', focusEn: ['success', 'authority', 'vitality', 'clarity'], focusRu: ['успех', 'авторитет', 'жизненная сила', 'ясность'] },
  moon: { symbol: '☽', en: 'Moon', ru: 'Луна', focusEn: ['intuition', 'dreams', 'emotions', 'ancestral work'], focusRu: ['интуиция', 'сны', 'эмоции', 'работа с предками'] },
  mars: { symbol: '♂', en: 'Mars', ru: 'Марс', focusEn: ['courage', 'protection', 'discipline', 'boundaries'], focusRu: ['смелость', 'защита', 'дисциплина', 'границы'] },
  mercury: { symbol: '☿', en: 'Mercury', ru: 'Меркурий', focusEn: ['learning', 'communication', 'divination', 'logic'], focusRu: ['обучение', 'коммуникация', 'дивинация', 'логика'] },
  jupiter: { symbol: '♃', en: 'Jupiter', ru: 'Юпитер', focusEn: ['growth', 'luck', 'leadership', 'expansion'], focusRu: ['рост', 'удача', 'лидерство', 'экспансия'] },
  venus: { symbol: '♀', en: 'Venus', ru: 'Венера', focusEn: ['love', 'harmony', 'art', 'money magnetism'], focusRu: ['любовь', 'гармония', 'искусство', 'денежный магнетизм'] },
  saturn: { symbol: '♄', en: 'Saturn', ru: 'Сатурн', focusEn: ['structure', 'karma', 'endurance', 'banishing'], focusRu: ['структура', 'карма', 'выносливость', 'очищение'] },
}

const PLANET_ALERT_COPY: Record<PlanetKey, { ru: string; en: string }> = {
  sun: {
    ru: 'Этот час подходит для: власти, успеха и энергетических практик.',
    en: 'This hour is ideal for authority, success, and vitality workings.',
  },
  moon: {
    ru: 'Этот час подходит для: интуиции, снов и психической работы.',
    en: 'This hour supports intuition, dreams, and psychic work.',
  },
  mars: {
    ru: 'Этот час подходит для: силы, защиты и активных действий.',
    en: 'This hour supports strength, protection, and active operations.',
  },
  mercury: {
    ru: 'Этот час подходит для: знаний, магии и коммуникации.',
    en: 'This hour favors study, magic craft, and communication.',
  },
  jupiter: {
    ru: 'Этот час подходит для: денег, роста и удачи.',
    en: 'This hour favors money magic, growth, and luck.',
  },
  venus: {
    ru: 'Этот час подходит для: любви, гармонии, красоты и денежных практик.',
    en: 'This hour is ideal for love, harmony, beauty, and prosperity rites.',
  },
  saturn: {
    ru: 'Этот час подходит для: очищения, границ и завершения циклов.',
    en: 'This hour is good for cleansing, boundaries, and completion work.',
  },
}

const MAGICAL_HOLIDAYS: MagicalHoliday[] = [
  { name: 'Samhain', nameRu: 'Самайн', date: '10-31', description: 'festival of spirits and ancestors', descriptionRu: 'праздник духов и предков' },
  { name: 'Beltane', nameRu: 'Белтейн', date: '05-01', description: 'festival of life force and union', descriptionRu: 'праздник жизненной силы и союза' },
  { name: 'Imbolc', nameRu: 'Имболк', date: '02-01', description: 'festival of purification and sacred fire', descriptionRu: 'праздник очищения и священного огня' },
  { name: 'Lughnasadh', nameRu: 'Лугнасад', date: '08-01', description: 'first harvest and gratitude festival', descriptionRu: 'праздник первого урожая и благодарности' },
]

const RITUAL_META_STORAGE_KEY = 'esoterica_ritual_meta_v2'

const RESULT_LABELS_RU: Record<number, string> = {
  1: '1 - не сработал',
  2: '2 - слабый эффект',
  3: '3 - средний результат',
  4: '4 - сильный результат',
  5: '5 - очень мощный результат',
}

const RESULT_LABELS_EN: Record<number, string> = {
  1: '1 - no effect',
  2: '2 - weak effect',
  3: '3 - moderate result',
  4: '4 - strong result',
  5: '5 - very powerful result',
}

function generatePlanetaryHours(sunrise: Date, sunset: Date, nextSunrise: Date): PlanetaryHour[] {
  const dayLength = sunset.getTime() - sunrise.getTime()
  const nightLength = nextSunrise.getTime() - sunset.getTime()
  if (dayLength <= 0 || nightLength <= 0) return []

  const dayHour = dayLength / 12
  const nightHour = nightLength / 12
  const dayRuler = WEEKDAY_RULER[sunrise.getDay()]
  const firstIndex = CHALDEAN_ORDER.indexOf(dayRuler)

  const result: PlanetaryHour[] = []

  for (let i = 0; i < 12; i++) {
    const start = new Date(sunrise.getTime() + dayHour * i)
    const end = new Date(sunrise.getTime() + dayHour * (i + 1))
    const planet = CHALDEAN_ORDER[(firstIndex + i) % CHALDEAN_ORDER.length]
    result.push({ planet, start, end, isDay: true })
  }

  for (let i = 0; i < 12; i++) {
    const start = new Date(sunset.getTime() + nightHour * i)
    const end = new Date(sunset.getTime() + nightHour * (i + 1))
    const planet = CHALDEAN_ORDER[(firstIndex + 12 + i) % CHALDEAN_ORDER.length]
    result.push({ planet, start, end, isDay: false })
  }

  return result
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function getHecateDays(baseDate: Date): HecateDay[] {
  // Find nearest new moon by scanning around current date and minimizing illumination phase distance.
  let bestDate = startOfDay(baseDate)
  let bestDistance = Number.POSITIVE_INFINITY

  for (let i = -16; i <= 16; i++) {
    const candidate = addDays(baseDate, i)
    const phase = SunCalc.getMoonIllumination(candidate).phase
    const distanceToNewMoon = Math.min(phase, 1 - phase)
    if (distanceToNewMoon < bestDistance) {
      bestDistance = distanceToNewMoon
      bestDate = startOfDay(candidate)
    }
  }

  return [
    {
      id: 'deipnon',
      icon: '🗝',
      date: addDays(bestDate, -1),
      titleRu: 'Deipnon',
      titleEn: 'Deipnon',
      meaningRu: 'Очищение, подношения, закрытие циклов',
      meaningEn: 'Cleansing, offerings, and cycle closure',
      detailsRu: 'Вечер перед новолунием. В традиции Гекаты этот день посвящают очищению дома и алтаря, вынесению старого, защитным практикам и подношениям на перекрестке. Хорошее время для завершения незакрытых магических процессов.',
      detailsEn: 'The evening before the new moon. In Hecate practice this day is for cleansing home and altar, removing stale energy, protective work, and offerings at crossroads. It is ideal for closing unfinished magical cycles.',
    },
    {
      id: 'noumenia',
      icon: '✨',
      date: addDays(bestDate, 1),
      titleRu: 'Noumenia',
      titleEn: 'Noumenia',
      meaningRu: 'Новые начала',
      meaningEn: 'New beginnings',
      detailsRu: 'Первый день нового лунного цикла. Подходит для формулирования намерений, мягких стартов, благословения пространства и семейного очага. Лучше делать ясные, короткие ритуалы на рост и настройку курса.',
      detailsEn: 'The first day of the new lunar cycle. Excellent for intention-setting, gentle beginnings, blessing your space, and household harmony. Best used for clear, concise rites focused on growth and direction.',
    },
    {
      id: 'agathos-daimon',
      icon: '🜂',
      date: addDays(bestDate, 2),
      titleRu: 'Agathos Daimon',
      titleEn: 'Agathos Daimon',
      meaningRu: 'Благословение и защита',
      meaningEn: 'Blessing and protection',
      detailsRu: 'День доброго духа-хранителя после начала месяца. Фокус на укреплении защиты, подпитке удачи, благодарности и закреплении намерений Noumenia через практические шаги.',
      detailsEn: 'The day of the benevolent household spirit after the month begins. Focus on strengthening protection, nourishing luck, gratitude, and grounding Noumenia intentions into practical steps.',
    },
  ]
}

function getUpcomingHolidayDate(mmdd: string, now: Date): Date {
  const [mm, dd] = mmdd.split('-').map(Number)
  const thisYear = new Date(now.getFullYear(), mm - 1, dd)
  if (thisYear.getTime() >= now.getTime()) return thisYear
  return new Date(now.getFullYear() + 1, mm - 1, dd)
}

function readRitualMetaMap(): Record<string, Partial<Ritual>> {
  try {
    const raw = localStorage.getItem(RITUAL_META_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function writeRitualMeta(id: string, meta: Partial<Ritual>) {
  const current = readRitualMetaMap()
  current[id] = { ...(current[id] || {}), ...meta }
  localStorage.setItem(RITUAL_META_STORAGE_KEY, JSON.stringify(current))
}

const RITUAL_TYPES = ['banishing', 'invocation', 'manifestation', 'divination', 'healing', 'protection', 'gratitude', 'shadow-work']
const RITUAL_TYPES_RU: Record<string, string> = {
  banishing: 'Очищение',
  invocation: 'Призывание',
  manifestation: 'Проявление',
  divination: 'Дивинация',
  healing: 'Исцеление',
  protection: 'Защита',
  gratitude: 'Благодарность',
  'shadow-work': 'Работа с тенью',
}

const WHEEL_SLAVIC: FestivalDay[] = [
  {
    id: 'kolyada',
    nameRu: 'Коляда',
    nameEn: 'Kolyada',
    date: 'Dec 21',
    emoji: '☀️',
    infoRu: 'Праздник зимнего солнцестояния и рождения нового солнечного цикла. Время обновления клятв, очищения дома и призыва достатка.',
    infoEn: 'Winter solstice feast marking the rebirth of the solar cycle. A day for renewal vows, home cleansing, and prosperity rites.',
  },
  {
    id: 'maslenitsa',
    nameRu: 'Масленица',
    nameEn: 'Maslenitsa',
    date: 'Mar 1',
    emoji: '🌾',
    infoRu: 'Переход от зимы к весне, обрядовое прощание со старым. Подходит для ритуалов освобождения и призыва плодородия.',
    infoEn: 'Transition from winter to spring and ritual farewell to the old season. Ideal for release work and fertility intentions.',
  },
  {
    id: 'kupala',
    nameRu: 'Купала',
    nameEn: 'Kupala',
    date: 'Jun 21',
    emoji: '🔥',
    infoRu: 'Огненно-водный праздник летнего солнцестояния. День силы, очищения через стихии и любовно-защитной магии.',
    infoEn: 'Fire-and-water summer solstice celebration. A high-power day for elemental purification and love/protection work.',
  },
  {
    id: 'perun-day',
    nameRu: 'Перунов День',
    nameEn: "Perun's Day",
    date: 'Aug 2',
    emoji: '⚡',
    infoRu: 'Чествование громовержца и силы воли. Хорош для ритуалов защиты, дисциплины, справедливости и укрепления границ.',
    infoEn: 'Honors the thunder god and disciplined will. Strong timing for protection, justice, boundary-setting, and oath work.',
  },
]

const WHEEL_NEOPAGAN: FestivalDay[] = [
  {
    id: 'yule',
    nameRu: 'Йоль',
    nameEn: 'Yule',
    date: 'Dec 21',
    emoji: '🕯️',
    infoRu: 'Зимнее солнцестояние. Поворот колеса к свету, ритуалы надежды, восстановления и закладки намерений года.',
    infoEn: 'Winter solstice. The wheel turns toward light; ideal for hope, restoration, and year-seeding intentions.',
  },
  {
    id: 'imbolc',
    nameRu: 'Имболк',
    nameEn: 'Imbolc',
    date: 'Feb 1',
    emoji: '🕯',
    infoRu: 'Пробуждение огня и очищение пространства. День ясности, домашней магии и обновления духовной дисциплины.',
    infoEn: 'Awakening fire and purification. A day for clarity, hearth magic, and refreshing spiritual discipline.',
  },
  {
    id: 'ostara',
    nameRu: 'Остара',
    nameEn: 'Ostara',
    date: 'Mar 21',
    emoji: '🌱',
    infoRu: 'Весеннее равноденствие, баланс света и тьмы. Подходит для гармонизации сфер жизни и старта новых проектов.',
    infoEn: 'Spring equinox and light-dark balance. Great for harmonizing life areas and launching new projects.',
  },
  {
    id: 'beltane',
    nameRu: 'Белтейн',
    nameEn: 'Beltane',
    date: 'May 1',
    emoji: '🔥',
    infoRu: 'Праздник жизненной силы, творчества и союза. День усиления страсти, инициативы и плодотворных связей.',
    infoEn: 'Festival of vitality, creativity, and union. Boosts passion, initiative, and fertile partnerships.',
  },
  {
    id: 'litha',
    nameRu: 'Лита',
    nameEn: 'Litha',
    date: 'Jun 21',
    emoji: '☀️',
    infoRu: 'Летнее солнцестояние, пик солнечной силы. Время ритуалов успеха, укрепления энергии и защиты.',
    infoEn: 'Summer solstice and peak solar force. Favorable for success rites, empowerment, and protection.',
  },
  {
    id: 'lughnasadh',
    nameRu: 'Лугнасад',
    nameEn: 'Lughnasadh',
    date: 'Aug 1',
    emoji: '🌾',
    infoRu: 'Первый урожай и благодарность за результаты. Подходит для закрепления плодов труда и обрядов изобилия.',
    infoEn: 'First harvest and gratitude for results. Ideal for consolidating gains and abundance-focused work.',
  },
  {
    id: 'mabon',
    nameRu: 'Мабон',
    nameEn: 'Mabon',
    date: 'Sep 21',
    emoji: '🍂',
    infoRu: 'Осеннее равноденствие, подведение итогов и баланс обмена. Хорош для магии благодарности и завершений.',
    infoEn: 'Autumn equinox, harvest reflection, and exchange balance. Great for gratitude and completion rituals.',
  },
  {
    id: 'samhain',
    nameRu: 'Самайн',
    nameEn: 'Samhain',
    date: 'Oct 31',
    emoji: '🕸️',
    infoRu: 'Пороговый праздник предков и теневой работы. Сильное время для отпускания старого и глубокой внутренней магии.',
    infoEn: 'Threshold feast of ancestors and shadow work. Powerful for release, endings, and deep inner magic.',
  },
]

const WHEEL_HELLENIC: FestivalDay[] = [
  {
    id: 'noumenia',
    nameRu: 'Нумения',
    nameEn: 'Noumenia',
    date: 'Monthly New Moon',
    emoji: '🌑',
    infoRu: 'Начало нового лунного месяца в эллинской практике. День домашних подношений, порядка и настройки намерений.',
    infoEn: 'Start of the lunar month in Hellenic practice. A day for household offerings, order, and intention-setting.',
  },
  {
    id: 'anthesteria',
    nameRu: 'Антестерии',
    nameEn: 'Anthesteria',
    date: 'Feb / Mar',
    emoji: '🍷',
    infoRu: 'Праздник Диониса, вина и обновления жизни. Подходит для ритуалов творческого потока и освобождения эмоций.',
    infoEn: 'Festival of Dionysus, wine, and life renewal. Supports creative flow and emotional release rituals.',
  },
  {
    id: 'thargelia',
    nameRu: 'Фаргелии',
    nameEn: 'Thargelia',
    date: 'May / Jun',
    emoji: '🌿',
    infoRu: 'Праздник Аполлона и Артемиды, очищения и благодарности за плоды. День ритуалов здоровья и гармонии.',
    infoEn: 'Festival of Apollo and Artemis, purification and first fruits. Good for health and harmony workings.',
  },
  {
    id: 'kronia',
    nameRu: 'Кронии',
    nameEn: 'Kronia',
    date: 'Jul',
    emoji: '⏳',
    infoRu: 'Праздник Кроноса, времени и равенства. Время для ритуалов пересмотра циклов, договоренностей и обязанностей.',
    infoEn: 'Festival of Kronos, time, and social leveling. Useful for reviewing cycles, duties, and agreements.',
  },
  {
    id: 'panathenaia',
    nameRu: 'Панафинеи',
    nameEn: 'Panathenaia',
    date: 'Jul / Aug',
    emoji: '🦉',
    infoRu: 'Главный праздник Афины, мудрости и мастерства. Благоприятен для интеллектуальной магии, стратегий и ремесла.',
    infoEn: 'Major festival of Athena, wisdom, and craft. Great for strategic, scholarly, and craft-centered magic.',
  },
  {
    id: 'eleusinia',
    nameRu: 'Элевсинии',
    nameEn: 'Eleusinia',
    date: 'Sep',
    emoji: '🌾',
    infoRu: 'Праздники Деметры и Персефоны о циклах жизни и возвращения. Подходят для ритуалов трансформации и посвящения.',
    infoEn: 'Festivals of Demeter and Persephone about descent and return cycles. Strong for transformation and initiation.',
  },
]

interface RitualTrackerProps {
  user: { id: string }
}

export function RitualTracker({ user }: RitualTrackerProps) {
  const { t, lang } = useLang()
  const { playUiSound } = useAudio()
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeWheel, setActiveWheel] = useState<'slavic' | 'neopagan' | 'hellenic'>('slavic')
  const [selectedFestival, setSelectedFestival] = useState<FestivalDay | null>(null)
  const [selectedHecateDay, setSelectedHecateDay] = useState<HecateDay | null>(null)
  const [planetaryHours, setPlanetaryHours] = useState<PlanetaryHour[]>([])
  const [planetaryLoading, setPlanetaryLoading] = useState(true)
  const [planetaryError, setPlanetaryError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 42.7, lng: 23.3 })
  const notifiedRef = useRef<Set<string>>(new Set())
  const moonPhase = getMoonPhase()
  const energy = lang === 'ru' ? moonEnergyRu[moonPhase] : moonEnergy[moonPhase]

  const wheelOptions = [
    { id: 'slavic' as const, label: lang === 'ru' ? 'Славянское' : 'Slavic' },
    { id: 'neopagan' as const, label: lang === 'ru' ? 'Неоязыческое' : 'Neopagan' },
    { id: 'hellenic' as const, label: lang === 'ru' ? 'Эллинское' : 'Hellenic' },
  ]

  const activeWheelData = activeWheel === 'slavic'
    ? WHEEL_SLAVIC
    : activeWheel === 'neopagan'
      ? WHEEL_NEOPAGAN
      : WHEEL_HELLENIC

  useEffect(() => {
    const saved = localStorage.getItem('esoterica_geo_coords')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
          setCoords({ lat: parsed.lat, lng: parsed.lng })
        }
      } catch {
        // ignore invalid cache
      }
      return
    }

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCoords(nextCoords)
        localStorage.setItem('esoterica_geo_coords', JSON.stringify(nextCoords))
      },
      () => {
        // Keep default coordinates when denied.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 3600_000 }
    )
  }, [])

  useEffect(() => {
    const recalcPlanetaryHours = () => {
      setPlanetaryLoading(true)
      setPlanetaryError(null)

      try {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)

        const todayTimes = SunCalc.getTimes(today, coords.lat, coords.lng)
        const tomorrowTimes = SunCalc.getTimes(tomorrow, coords.lat, coords.lng)

        const sunrise = todayTimes.sunrise
        const sunset = todayTimes.sunset
        const nextSunrise = tomorrowTimes.sunrise

        if (!(sunrise instanceof Date) || !(sunset instanceof Date) || !(nextSunrise instanceof Date)) {
          throw new Error('sun_calc_invalid_times')
        }

        const hours = generatePlanetaryHours(sunrise, sunset, nextSunrise)
        if (!hours.length) {
          throw new Error('planetary_calc_error')
        }

        setPlanetaryHours(hours)
      } catch (error) {
        console.error('Planetary hours failed:', error)
        setPlanetaryError(lang === 'ru' ? 'Не удалось рассчитать планетарные часы' : 'Failed to calculate planetary hours')
        setPlanetaryHours([])
      } finally {
        setPlanetaryLoading(false)
      }
    }

    recalcPlanetaryHours()
    const timer = setInterval(recalcPlanetaryHours, 10 * 60 * 1000)
    return () => clearInterval(timer)
  }, [coords.lat, coords.lng, lang])

  const activePlanetaryInfo = useMemo(() => {
    if (!planetaryHours.length) return null

    const now = Date.now()
    const activeIndex = planetaryHours.findIndex(h => now >= h.start.getTime() && now < h.end.getTime())
    const safeIndex = activeIndex >= 0 ? activeIndex : 0
    const current = planetaryHours[safeIndex]
    const next = planetaryHours[(safeIndex + 1) % planetaryHours.length]
    const minutesToNext = Math.max(0, Math.round((next.start.getTime() - now) / 60000))

    return { current, next, minutesToNext }
  }, [planetaryHours])

  const formatHour = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const hecateDays = useMemo(() => getHecateDays(new Date()), [])

  const upcomingHolidays = useMemo(() => {
    const now = new Date()
    return MAGICAL_HOLIDAYS
      .map((h) => ({ ...h, nextDate: getUpcomingHolidayDate(h.date, now) }))
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
  }, [])

  const todayDayKey = startOfDay(new Date()).toDateString()

  useEffect(() => {
    if (!planetaryHours.length) return

    const ensurePermission = async () => {
      if (!('Notification' in window)) return
      if (Notification.permission === 'default') {
        try { await Notification.requestPermission() } catch {}
      }
    }
    void ensurePermission()

    const tick = () => {
      const now = Date.now()
      const activeIdx = planetaryHours.findIndex(h => now >= h.start.getTime() && now < h.end.getTime())
      if (activeIdx < 0) return

      const current = planetaryHours[activeIdx]
      const next = planetaryHours[(activeIdx + 1) % planetaryHours.length]
      const currentStartKey = `start:${current.start.toISOString()}`
      const preFiveKey = `pre5:${next.start.toISOString()}`

      if (!notifiedRef.current.has(currentStartKey)) {
        notifiedRef.current.add(currentStartKey)
        const title = lang === 'ru'
          ? `Начался час ${PLANET_META[current.planet].ru}`
          : `${PLANET_META[current.planet].en} hour has started`
        const body = lang === 'ru' ? PLANET_ALERT_COPY[current.planet].ru : PLANET_ALERT_COPY[current.planet].en
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body })
        }
        toast.success(`${title}. ${body}`)
      }

      const minToNext = (next.start.getTime() - now) / 60000
      if (minToNext <= 5 && minToNext > 0 && !notifiedRef.current.has(preFiveKey)) {
        notifiedRef.current.add(preFiveKey)
        const title = lang === 'ru'
          ? `Через 5 минут: час ${PLANET_META[next.planet].ru}`
          : `In ~5 minutes: ${PLANET_META[next.planet].en} hour`
        const body = lang === 'ru' ? PLANET_ALERT_COPY[next.planet].ru : PLANET_ALERT_COPY[next.planet].en
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body })
        }
        toast(title)
      }
    }

    tick()
    const timer = setInterval(tick, 15 * 1000)
    return () => clearInterval(timer)
  }, [planetaryHours, lang])

  const [form, setForm] = useState({
    title: '',
    description: '',
    deity: '',
    type: 'manifestation',
    intention: '',
    tools: '',
    notes: '',
    energyLevel: 7,
    planetaryHour: '',
    moonPhaseForRitual: moonPhase,
    emotionalState: '',
    sensationsDuring: '',
    outcome: '',
    outcomeLater: '',
    resultRating: 3,
  })

  const [showManualOnly, setShowManualOnly] = useState(false)
  const [manualFirst, setManualFirst] = useState(false)
  const [editing, setEditing] = useState<{ id: string; later: string; result: number } | null>(null)

  useEffect(() => { loadRituals() }, [user.id])

  async function loadRituals() {
    try {
      const data = await db.rituals.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 50,
      }) as Ritual[]
      const metaMap = readRitualMetaMap()
      const merged = data.map((ritual) => ({ ...metaMap[ritual.id], ...ritual }))
      setRituals(merged)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function saveRitual() {
    if (!form.title.trim() || (!form.intention.trim() && !form.description.trim())) return
    playUiSound('click')
    try {
      const ritual = await db.rituals.create({
        userId: user.id,
        title: form.title,
        type: form.type,
        intention: form.intention || form.description,
        moonPhase: moonPhase,
        energyLevel: form.energyLevel,
        outcome: form.outcome || null,
        notes: form.notes || null,
        createdAt: new Date().toISOString(),
      }) as Ritual

      const enrichedRitual: Ritual = {
        ...ritual,
        source: 'manual',
        description: form.description,
        deity: form.deity,
        moon_phase: form.moonPhaseForRitual,
        planetary_hour: form.planetaryHour,
        tools: form.tools,
        notes: form.notes,
        result_rating: form.resultRating,
        emotional_state: form.emotionalState,
        sensations_during: form.sensationsDuring,
        outcome: form.outcome,
        outcome_later: form.outcomeLater,
      }

      writeRitualMeta(ritual.id, {
        description: form.description,
        deity: form.deity,
        moon_phase: form.moonPhaseForRitual,
        planetary_hour: form.planetaryHour,
        tools: form.tools,
        notes: form.notes,
        result_rating: form.resultRating,
        emotional_state: form.emotionalState,
        sensations_during: form.sensationsDuring,
        outcome_later: form.outcomeLater,
      })

      setRituals(prev => [enrichedRitual, ...prev])

      // Update profile stats
      try {
        const profiles = await db.userProfiles.list({ where: { userId: user.id } })
        if (profiles.length > 0) {
          const p = profiles[0] as { id: string; totalRituals: number; practiceStreak: number; lastPracticeDate?: string }
          const today = new Date().toDateString()
          const lastDate = p.lastPracticeDate ? new Date(p.lastPracticeDate).toDateString() : null
          const newStreak = lastDate === today ? p.practiceStreak : p.practiceStreak + 1
          await db.userProfiles.update(p.id, {
            totalRituals: (p.totalRituals || 0) + 1,
            practiceStreak: newStreak,
            lastPracticeDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      } catch (_) {}

      setShowForm(false)
      setForm({
        title: '',
        description: '',
        deity: '',
        type: 'manifestation',
        intention: '',
        tools: '',
        notes: '',
        energyLevel: 7,
        planetaryHour: '',
        moonPhaseForRitual: moonPhase,
        emotionalState: '',
        sensationsDuring: '',
        outcome: '',
        outcomeLater: '',
        resultRating: 3,
      })
      playUiSound('success')
      toast.success(lang === 'ru' ? 'Ритуал записан' : 'Ritual logged')

      // Background: extract ritual entities into Knowledge Graph
      const ritualText = [
        form.title,
        form.description,
        form.intention,
        form.deity ? `Deity: ${form.deity}` : '',
        form.tools ? `Tools: ${form.tools}` : '',
        form.outcome || '',
      ].filter(Boolean).join('. ')

      if (ritualText.length > 10) {
        extractAndMerge(ritualText, lang as 'en' | 'ru', 'ritual', user.id).then(result => {
          if (result && result.added > 0) {
            toast.success(
              lang === 'ru'
                ? `🕸 Паутина: +${result.added} из ритуала`
                : `🕸 Web: +${result.added} from ritual`,
              { duration: 3000 }
            )
            eventBus.emit('knowledge:updated', { userId: user.id, addedNodes: result.added, source: 'ritual' })
          }
        })
      }

      eventBus.emit('ritual:completed', {
        userId: user.id,
        title: form.title,
        description: ritualText,
        pointsEarned: 0,
      })
    } catch (e) { toast.error(t.error) }
  }

  async function deleteRitual(id: string) {
    playUiSound('click')
    await db.rituals.delete(id)
    const map = readRitualMetaMap()
    if (map[id]) {
      delete map[id]
      localStorage.setItem(RITUAL_META_STORAGE_KEY, JSON.stringify(map))
    }
    setRituals(prev => prev.filter(r => r.id !== id))
  }

  const avgEnergy = rituals.length ? Math.round(rituals.reduce((s, r) => s + Number(r.energyLevel), 0) / rituals.length) : 0

  const analytics = useMemo(() => {
    const rated = rituals.filter(r => typeof r.result_rating === 'number')

    const byMoon: Record<string, { total: number; count: number }> = {}
    const byHour: Record<string, { total: number; count: number }> = {}
    const byDeity: Record<string, number> = {}

    rated.forEach((r) => {
      const rating = Number(r.result_rating)
      const moon = r.moon_phase || r.moonPhase || 'unknown'
      const hour = r.planetary_hour || 'unknown'

      if (!byMoon[moon]) byMoon[moon] = { total: 0, count: 0 }
      byMoon[moon].total += rating
      byMoon[moon].count += 1

      if (!byHour[hour]) byHour[hour] = { total: 0, count: 0 }
      byHour[hour].total += rating
      byHour[hour].count += 1

      if (r.deity?.trim()) {
        const key = r.deity.trim()
        byDeity[key] = (byDeity[key] || 0) + 1
      }
    })

    const topMoon = Object.entries(byMoon)
      .map(([key, v]) => ({ key, avg: v.total / v.count, count: v.count }))
      .sort((a, b) => b.avg - a.avg)[0]

    const topHour = Object.entries(byHour)
      .map(([key, v]) => ({ key, avg: v.total / v.count, count: v.count }))
      .sort((a, b) => b.avg - a.avg)[0]

    const topDeities = Object.entries(byDeity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    return { topMoon, topHour, topDeities, ratedCount: rated.length }
  }, [rituals])

  const hecateDetailsModal =
    selectedHecateDay && typeof document !== 'undefined'
      ? createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-8 sm:pt-12">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-primary/20 shadow-2xl p-4 animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl">{selectedHecateDay.icon}</span>
                <p className="text-sm font-semibold text-foreground truncate">
                  {lang === 'ru' ? selectedHecateDay.titleRu : selectedHecateDay.titleEn}
                </p>
              </div>
              <button
                onClick={() => setSelectedHecateDay(null)}
                className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-primary/80 mb-2">{selectedHecateDay.date.toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'ru' ? selectedHecateDay.detailsRu : selectedHecateDay.detailsEn}
            </p>
          </div>
        </div>,
        document.body
      )
      : null

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <WeatherRitualsBanner coords={{ lat: coords.lat, lng: coords.lng }} lang={lang as 'en' | 'ru'} />
      <DailyGuidance />

      {/* Moon energy */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-primary/20 p-5">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{moonEmoji[moonPhase]}</span>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t.moonEnergy}</p>
            <p className="text-lg font-semibold text-foreground">{t.moonPhases[moonPhase]}</p>
            <p className="text-sm text-muted-foreground italic mt-1">{energy}</p>
          </div>
        </div>
      </div>

      {/* Hecate Days */}
      <div className="rounded-2xl bg-card border border-border/40 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{lang === 'ru' ? 'Дни Гекаты' : 'Hecate Days'}</p>
          <span className="text-[11px] text-muted-foreground">🌑 🗝 ✨ 🜂</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {hecateDays.map((day) => {
            const isToday = startOfDay(day.date).toDateString() === todayDayKey
            return (
              <button
                type="button"
                key={day.id}
                onClick={() => setSelectedHecateDay(day)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/35',
                  isToday ? 'border-primary/40 bg-primary/10' : 'border-border/40 bg-background/20 hover:bg-background/30'
                )}
              >
                <p className="text-sm font-semibold text-foreground">{day.icon} {lang === 'ru' ? day.titleRu : day.titleEn}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{day.date.toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {lang === 'ru' ? day.meaningRu : day.meaningEn}
                </p>
                <p className="text-[11px] text-primary/80 mt-2">
                  {lang === 'ru' ? 'Нажми для подробного описания' : 'Tap for full description'}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {hecateDetailsModal}

      {/* Planetary Hours */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {lang === 'ru' ? 'Луна и время силы' : 'Moon & Time of Power'}
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            {lang === 'ru' ? `коорд.: ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}` : `coords: ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`}
          </p>
        </div>

        {planetaryLoading && (
          <p className="text-xs text-muted-foreground">{lang === 'ru' ? 'Расчет планетарных часов...' : 'Calculating planetary hours...'}</p>
        )}

        {!planetaryLoading && planetaryError && (
          <p className="text-xs text-destructive">{planetaryError}</p>
        )}

        {!planetaryLoading && !planetaryError && activePlanetaryInfo && (
          <>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {lang === 'ru' ? 'Сейчас активен' : 'Active Now'}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {PLANET_META[activePlanetaryInfo.current.planet].symbol} {lang === 'ru' ? PLANET_META[activePlanetaryInfo.current.planet].ru : PLANET_META[activePlanetaryInfo.current.planet].en}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {formatHour(activePlanetaryInfo.current.start)} - {formatHour(activePlanetaryInfo.current.end)}
              </p>
              <p className="text-[11px] text-primary mt-1">
                {lang === 'ru'
                  ? `Следующий час через ${activePlanetaryInfo.minutesToNext} мин.`
                  : `Next hour in ${activePlanetaryInfo.minutesToNext} min.`}
              </p>
            </div>

            <div className="rounded-xl border border-border/40 bg-background/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {lang === 'ru' ? 'Подходит для' : 'Good For'}
              </p>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {(lang === 'ru' ? PLANET_META[activePlanetaryInfo.current.planet].focusRu : PLANET_META[activePlanetaryInfo.current.planet].focusEn).join(' • ')}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {planetaryHours.slice(0, 8).map((hour, idx) => (
                <div key={`${hour.planet}-${idx}`} className="rounded-lg border border-border/40 bg-background/20 p-2">
                  <p className="text-[11px] text-foreground font-medium truncate">
                    {PLANET_META[hour.planet].symbol} {lang === 'ru' ? PLANET_META[hour.planet].ru : PLANET_META[hour.planet].en}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatHour(hour.start)} - {formatHour(hour.end)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Wheel of Year */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-xs text-muted-foreground">{t.wheelOfYear}</p>
          <div className="flex items-center gap-1 p-1 rounded-xl border border-border/40 bg-card">
            {wheelOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveWheel(option.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors',
                  activeWheel === option.id
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {activeWheelData.map((day) => (
            <button
              type="button"
              key={day.id}
              onClick={() => setSelectedFestival(day)}
              className="rounded-xl bg-card border border-border/40 p-3 text-center hover:border-primary/30 transition-colors"
            >
              <div className="text-2xl mb-1">{day.emoji}</div>
              <p className="text-xs font-medium text-foreground">{lang === 'ru' ? day.nameRu : day.nameEn}</p>
              <p className="text-[10px] text-muted-foreground">{day.date}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Magical Holidays (compact) */}
      <div className="rounded-xl bg-card border border-border/40 p-3">
        <p className="text-[10px] text-muted-foreground mb-1.5">{lang === 'ru' ? 'Календарь магических праздников' : 'Magical Holidays Calendar'}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {upcomingHolidays.map((holiday) => {
            const title = lang === 'ru' ? holiday.nameRu : holiday.name
            return (
              <div key={`${holiday.name}-${holiday.date}`} className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5 flex flex-col justify-center min-h-[40px]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-foreground truncate">{title}</p>
                  <p className="text-[9px] text-primary whitespace-nowrap">{holiday.nextDate.toLocaleDateString()}</p>
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1 leading-tight">
                  {lang === 'ru' ? holiday.descriptionRu : holiday.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {selectedFestival && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-primary/20 shadow-2xl p-4 animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl">{selectedFestival.emoji}</span>
                <p className="text-sm font-semibold text-foreground truncate">{lang === 'ru' ? selectedFestival.nameRu : selectedFestival.nameEn}</p>
              </div>
              <button
                onClick={() => setSelectedFestival(null)}
                className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-primary/80 mb-2">{selectedFestival.date}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'ru' ? selectedFestival.infoRu : selectedFestival.infoEn}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-card border border-border/40 p-3 text-center">
          <p className="text-2xl font-bold text-primary">{rituals.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{lang === 'ru' ? 'Ритуалов' : 'Rituals'}</p>
        </div>
        <div className="rounded-xl bg-card border border-border/40 p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{avgEnergy}/10</p>
          <p className="text-xs text-muted-foreground mt-1">{lang === 'ru' ? 'Средняя энергия' : 'Avg Energy'}</p>
        </div>
        <div className="rounded-xl bg-card border border-border/40 p-3 text-center">
          <p className="text-2xl font-bold text-green-400">
            {new Set(rituals.map(r => r.type)).size}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{lang === 'ru' ? 'Типов' : 'Types'}</p>
        </div>
      </div>

      {/* Ritual Analytics */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
        <p className="text-xs text-muted-foreground">{lang === 'ru' ? 'Аналитика ритуалов' : 'Ritual Analytics'}</p>
        {analytics.ratedCount === 0 ? (
          <p className="text-xs text-muted-foreground">
            {lang === 'ru'
              ? 'Добавьте оценки ритуалов, чтобы увидеть статистику по фазам луны и планетарным часам.'
              : 'Add ritual result ratings to see moon phase and planetary hour performance analytics.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-xl border border-border/40 bg-background/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {lang === 'ru' ? 'Лучшая фаза луны' : 'Best Moon Phase'}
              </p>
              <p className="text-sm text-foreground mt-1 font-semibold">
                {analytics.topMoon ? `${analytics.topMoon.key} (${analytics.topMoon.avg.toFixed(1)}/5)` : '-'}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {lang === 'ru' ? 'Лучший планетарный час' : 'Best Planetary Hour'}
              </p>
              <p className="text-sm text-foreground mt-1 font-semibold">
                {analytics.topHour ? `${analytics.topHour.key} (${analytics.topHour.avg.toFixed(1)}/5)` : '-'}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {lang === 'ru' ? 'Часто используемые силы' : 'Most Used Forces'}
              </p>
              <p className="text-sm text-foreground mt-1 font-semibold">
                {analytics.topDeities.length > 0
                  ? analytics.topDeities.map(([name, count]) => `${name} (${count})`).join(', ')
                  : '-'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Log ritual */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t.ritualHistory}</h3>
        <div className="hidden sm:flex items-center gap-3">
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={showManualOnly}
              onChange={(e) => setShowManualOnly(e.currentTarget.checked)}
            />
            {lang === 'ru' ? 'Только добавленные' : 'Manual only'}
          </label>
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={manualFirst}
              onChange={(e) => setManualFirst(e.currentTarget.checked)}
            />
            {lang === 'ru' ? 'Сначала добавленные' : 'Manual first'}
          </label>
        </div>
        <button
          onClick={() => { setShowForm(true); playUiSound('click') }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.logRitual}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl bg-card border border-primary/30 p-5 space-y-4 animate-fade-in">
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder={t.ritualTitle}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.deity}
              onChange={e => setForm(p => ({ ...p, deity: e.target.value }))}
              placeholder={lang === 'ru' ? 'Божество / сила' : 'Deity / force'}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50"
            />
            <input
              value={form.tools}
              onChange={e => setForm(p => ({ ...p, tools: e.target.value }))}
              placeholder={lang === 'ru' ? 'Инструменты (через запятую)' : 'Tools (comma separated)'}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
            >
              {RITUAL_TYPES.map(rt => (
                <option key={rt} value={rt}>{lang === 'ru' ? RITUAL_TYPES_RU[rt] : rt.charAt(0).toUpperCase() + rt.slice(1).replace('-', ' ')}</option>
              ))}
            </select>
            <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-2.5">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <input
                type="range" min="1" max="10" value={form.energyLevel}
                onChange={e => setForm(p => ({ ...p, energyLevel: Number(e.target.value) }))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm text-primary font-bold w-4">{form.energyLevel}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.moonPhaseForRitual}
              onChange={e => setForm(p => ({ ...p, moonPhaseForRitual: e.target.value as MoonPhase }))}
              className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
            >
              {Object.entries(t.moonPhases).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={form.planetaryHour}
              onChange={e => setForm(p => ({ ...p, planetaryHour: e.target.value }))}
              className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
            >
              <option value="">{lang === 'ru' ? 'Планетарный час (опц.)' : 'Planetary hour (optional)'}</option>
              {planetaryHours.map((hour, idx) => (
                <option key={`${hour.planet}-${idx}`} value={hour.planet}>
                  {PLANET_META[hour.planet].symbol} {lang === 'ru' ? PLANET_META[hour.planet].ru : PLANET_META[hour.planet].en} ({formatHour(hour.start)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{lang === 'ru' ? 'Текст ритуала (вставка или загрузка файла)' : 'Ritual text (paste or upload file)'}</p>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value, intention: p.intention || e.target.value }))}
              placeholder={lang === 'ru' ? 'Полный текст ритуала...' : 'Full ritual text...'}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 resize-none"
              rows={4}
            />
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 bg-background/30 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
              {lang === 'ru' ? 'Загрузить текст ритуала' : 'Upload ritual text'}
              <input
                type="file"
                accept=".txt,.md,.rtf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  setForm(p => ({ ...p, description: text, intention: p.intention || text }))
                }}
              />
            </label>
          </div>

          <textarea
            value={form.intention}
            onChange={e => setForm(p => ({ ...p, intention: e.target.value }))}
            placeholder={t.intention}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 resize-none"
            rows={2}
          />
          <input
            value={form.emotionalState}
            onChange={e => setForm(p => ({ ...p, emotionalState: e.target.value }))}
            placeholder={lang === 'ru' ? 'Эмоциональное состояние перед ритуалом' : 'Emotional state before ritual'}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50"
          />
          <textarea
            value={form.sensationsDuring}
            onChange={e => setForm(p => ({ ...p, sensationsDuring: e.target.value }))}
            placeholder={lang === 'ru' ? 'Ощущения во время ритуала' : 'Sensations during ritual'}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 resize-none"
            rows={2}
          />
          <textarea
            value={form.outcome}
            onChange={e => setForm(p => ({ ...p, outcome: e.target.value }))}
            placeholder={t.outcome}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 resize-none"
            rows={2}
          />
          <textarea
            value={form.outcomeLater}
            onChange={e => setForm(p => ({ ...p, outcomeLater: e.target.value }))}
            placeholder={lang === 'ru' ? 'Результат через время' : 'Outcome after time'}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 resize-none"
            rows={2}
          />

          <div className="rounded-xl border border-border/40 p-3">
            <p className="text-xs text-muted-foreground mb-2">{lang === 'ru' ? 'Оценка ритуала' : 'Ritual result rating'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, resultRating: value }))}
                  className={cn(
                    'px-2 py-1.5 rounded-lg border text-[11px] transition-colors',
                    form.resultRating === value
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'border-border/40 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {lang === 'ru' ? RESULT_LABELS_RU[value] : RESULT_LABELS_EN[value]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { saveRitual(); playUiSound('click') }} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">{t.save}</button>
            <button onClick={() => { setShowForm(false); playUiSound('click') }} className="px-4 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">{t.cancel}</button>
          </div>
        </div>
      )}

      {/* Ritual history */}
      {loading ? (
        <div className="text-muted-foreground text-sm">{t.loading}</div>
      ) : rituals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 p-8 text-center">
          <Moon className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t.noRituals}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(() => {
            let list = rituals.slice()
            if (showManualOnly) list = list.filter(r => r.source === 'manual')
            if (manualFirst) list = list.sort((a, b) => (b.source === 'manual' ? 1 : 0) - (a.source === 'manual' ? 1 : 0))
            return list
          })().map(ritual => (
            <div key={ritual.id} className="rounded-xl bg-card border border-border/40 p-4 hover:border-primary/20 transition-colors group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{moonEmoji[(ritual.moon_phase || ritual.moonPhase || 'new') as keyof typeof moonEmoji] || '🌑'}</span>
                    <p className="font-medium text-sm text-foreground truncate">{ritual.title}</p>
                    {ritual.type && (
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary')}>
                        {lang === 'ru' ? RITUAL_TYPES_RU[ritual.type] || ritual.type : ritual.type}
                      </span>
                    )}
                    {typeof ritual.result_rating === 'number' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {lang === 'ru' ? `Оценка ${ritual.result_rating}/5` : `Rating ${ritual.result_rating}/5`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{ritual.description || ritual.intention}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {ritual.deity && <span className="text-[10px] text-purple-300">{lang === 'ru' ? 'Сила:' : 'Force:'} {ritual.deity}</span>}
                    {ritual.planetary_hour && <span className="text-[10px] text-amber-300">{lang === 'ru' ? 'Час:' : 'Hour:'} {ritual.planetary_hour}</span>}
                    {ritual.emotional_state && <span className="text-[10px] text-cyan-300">{lang === 'ru' ? 'Состояние:' : 'State:'} {ritual.emotional_state}</span>}
                  </div>
                  {ritual.outcome && (
                    <p className="text-xs text-green-400/80 mt-1 line-clamp-1">→ {ritual.outcome}</p>
                  )}
                  {ritual.outcome_later && (
                    <p className="text-xs text-blue-300/80 mt-1 line-clamp-1">⏳ {ritual.outcome_later}</p>
                  )}
                  {/* Inline editor for outcome later & rating (visible on hover) */}
                  <div className="mt-2 hidden group-hover:flex items-center gap-2">
                    <select
                      value={(editing && editing.id === ritual.id ? editing.result : ritual.result_rating) || 3}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setEditing({ id: ritual.id, later: editing?.id === ritual.id ? editing.later : (ritual.outcome_later || ''), result: val })
                      }}
                      className="text-[11px] bg-background border border-border rounded px-2 py-1"
                    >
                      {[1,2,3,4,5].map(n => (
                        <option key={n} value={n}>{lang==='ru'?RESULT_LABELS_RU[n]:RESULT_LABELS_EN[n]}</option>
                      ))}
                    </select>
                    <input
                      value={(editing && editing.id === ritual.id ? editing.later : ritual.outcome_later) || ''}
                      onChange={(e) => {
                        setEditing({ id: ritual.id, later: e.target.value, result: editing?.id===ritual.id ? editing.result : (ritual.result_rating || 3) })
                      }}
                      placeholder={lang==='ru'?'Результат через время':'Outcome later'}
                      className="flex-1 text-[11px] bg-background border border-border rounded px-2 py-1"
                    />
                    <button
                      onClick={async () => {
                        try {
                          const later = editing?.id===ritual.id ? editing.later : (ritual.outcome_later || '')
                          const res = editing?.id===ritual.id ? editing.result : (ritual.result_rating || 3)
                          await db.rituals.update(ritual.id, { outcome_later: later, result_rating: res, updatedAt: new Date().toISOString() })
                          const map = readRitualMetaMap()
                          map[ritual.id] = { ...(map[ritual.id]||{}), outcome_later: later, result_rating: res }
                          localStorage.setItem(RITUAL_META_STORAGE_KEY, JSON.stringify(map))
                          setRituals(prev => prev.map(r => r.id === ritual.id ? { ...r, outcome_later: later, result_rating: res } : r))
                          setEditing(null)
                          toast.success(lang==='ru'?'Обновлено':'Updated')
                        } catch {
                          toast.error(lang==='ру'?'Ошибка':'Error')
                        }
                      }}
                      className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[11px] border border-emerald-500/30 hover:bg-emerald-500/30"
                    >
                      {lang==='ru'?'Сохранить':'Save'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-yellow-400 font-bold">⚡{ritual.energyLevel}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(ritual.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => deleteRitual(ritual.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

