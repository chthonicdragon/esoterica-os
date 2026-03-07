import React, { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { useAudio } from '../contexts/AudioContext'
import { db } from '../lib/platformClient'
import { getMoonPhase, moonEmoji, moonEnergy, moonEnergyRu } from '../utils/moonPhase'
import { Plus, Moon, Trash2, TrendingUp, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'

interface Ritual {
  id: string
  title: string
  type: string
  intention: string
  moonPhase?: string
  outcome?: string
  energyLevel: number
  notes?: string
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

  const [form, setForm] = useState({
    title: '', type: 'manifestation', intention: '',
    energyLevel: 7, outcome: '', notes: '',
  })

  useEffect(() => { loadRituals() }, [user.id])

  async function loadRituals() {
    try {
      const data = await db.rituals.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 50,
      }) as Ritual[]
      setRituals(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function saveRitual() {
    if (!form.title.trim() || !form.intention.trim()) return
    playUiSound('click')
    try {
      const ritual = await db.rituals.create({
        userId: user.id,
        title: form.title,
        type: form.type,
        intention: form.intention,
        moonPhase: moonPhase,
        energyLevel: form.energyLevel,
        outcome: form.outcome || null,
        notes: form.notes || null,
        createdAt: new Date().toISOString(),
      }) as Ritual
      setRituals(prev => [ritual, ...prev])

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
      setForm({ title: '', type: 'manifestation', intention: '', energyLevel: 7, outcome: '', notes: '' })
      playUiSound('success')
      toast.success(lang === 'ru' ? 'Ритуал записан' : 'Ritual logged')
    } catch (e) { toast.error(t.error) }
  }

  async function deleteRitual(id: string) {
    playUiSound('click')
    await db.rituals.delete(id)
    setRituals(prev => prev.filter(r => r.id !== id))
  }

  const avgEnergy = rituals.length ? Math.round(rituals.reduce((s, r) => s + Number(r.energyLevel), 0) / rituals.length) : 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
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

      {/* Log ritual button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t.ritualHistory}</h3>
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
          <textarea
            value={form.intention}
            onChange={e => setForm(p => ({ ...p, intention: e.target.value }))}
            placeholder={t.intention}
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
          {rituals.map(ritual => (
            <div key={ritual.id} className="rounded-xl bg-card border border-border/40 p-4 hover:border-primary/20 transition-colors group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{moonEmoji[ritual.moonPhase as keyof typeof moonEmoji] || '🌑'}</span>
                    <p className="font-medium text-sm text-foreground truncate">{ritual.title}</p>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary')}>
                      {lang === 'ru' ? RITUAL_TYPES_RU[ritual.type] || ritual.type : ritual.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{ritual.intention}</p>
                  {ritual.outcome && (
                    <p className="text-xs text-green-400/80 mt-1 line-clamp-1">→ {ritual.outcome}</p>
                  )}
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

