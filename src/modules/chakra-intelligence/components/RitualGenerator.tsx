import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useChakra } from '../ChakraContext'
import { CHAKRA_INFO, ChakraName } from '../types'
import { Flame, Droplets, Wind, Leaf, Eye, Crown, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAudio } from '../../../contexts/AudioContext'

const RITUAL_SUGGESTIONS: Record<
  ChakraName,
  {
    title: string
    titleRu: string
    description: string
    descriptionRu: string
    icon: React.ComponentType<{ className?: string }>
    duration: string
  }
> = {
  root: {
    title: 'Grounding Walk',
    titleRu: 'Практика заземления',
    description: 'Walk barefoot on grass or soil. Focus on the connection between your feet and the Earth. Visualize red roots growing from your soles.',
    descriptionRu: 'Пройдитесь босиком по траве или земле. Сфокусируйтесь на контакте стоп с Землёй. Представляйте красные корни от ступней.',
    icon: Leaf,
    duration: '15 min'
  },
  sacral: {
    title: 'Water Flow Meditation',
    titleRu: 'Медитация потока воды',
    description: 'Sit near water or visualize a flowing river. Focus on your lower abdomen. Allow emotions to flow like water without judgment.',
    descriptionRu: 'Сядьте рядом с водой или представьте поток реки. Сфокусируйтесь на нижней части живота. Позвольте эмоциям течь без оценки.',
    icon: Droplets,
    duration: '20 min'
  },
  solar_plexus: {
    title: 'Fire Breathing',
    titleRu: 'Огненное дыхание',
    description: 'Practice Kapalabhati or rapid diaphragm breathing. Visualize a yellow sun in your solar plexus burning away doubt.',
    descriptionRu: 'Практикуйте капалабхати или быстрое диафрагмальное дыхание. Представляйте жёлтое солнце в солнечном сплетении.',
    icon: Flame,
    duration: '10 min'
  },
  heart: {
    title: 'Loving Kindness',
    titleRu: 'Медитация любящей доброты',
    description: 'Place hands on heart. Send love to yourself, then a loved one, then a stranger, then an enemy. Visualize green light expanding.',
    descriptionRu: 'Положите руки на сердце. Направьте любовь себе, близкому, незнакомцу и сложному человеку. Представляйте расширяющийся зелёный свет.',
    icon: Wind,
    duration: '15 min'
  },
  throat: {
    title: 'Chanting Om',
    titleRu: 'Пропевание мантры',
    description: 'Hum or chant "HAM" (throat mantra). Focus on the vibration in your throat. Speak your truth aloud in a safe space.',
    descriptionRu: 'Напевайте или пропевайте «ХАМ» (мантра горловой чакры). Сфокусируйтесь на вибрации в горле и проговорите свою правду.',
    icon: Wind,
    duration: '10 min'
  },
  third_eye: {
    title: 'Candle Gazing',
    titleRu: 'Созерцание свечи',
    description: 'Trataka meditation. Gaze steadily at a candle flame without blinking until tears form. Close eyes and see the afterimage.',
    descriptionRu: 'Практика Тратака. Смотрите на пламя свечи без моргания до слёз, затем закройте глаза и удерживайте послесвечение.',
    icon: Eye,
    duration: '10 min'
  },
  crown: {
    title: 'Silent Sitting',
    titleRu: 'Тихое созерцание',
    description: 'Sit in absolute silence. Visualize a violet lotus opening at the crown of your head, connecting to universal light.',
    descriptionRu: 'Сядьте в полной тишине. Представьте фиолетовый лотос на макушке, раскрывающий связь с универсальным светом.',
    icon: Crown,
    duration: '30 min'
  }
}

export function RitualGenerator({ lang = 'en' }: { lang?: 'en' | 'ru' }) {
  const { state } = useChakra()
  const { playUiSound } = useAudio()
  const [active, setActive] = useState(false)
  const [remainingSec, setRemainingSec] = useState<number | null>(null)
  const timerRef = useRef<number | null>(null)

  const lowestChakra: ChakraName | null = useMemo(() => {
    const entries = Object.entries(state.chakras) as [ChakraName, { level: number }][]
    if (!entries.length) return null
    const [minName] = entries.reduce<[ChakraName, number]>(
      (acc, [name, data]) => (data.level < acc[1] ? [name, data.level] : acc),
      [entries[0][0], entries[0][1].level],
    )
    return minName ?? null
  }, [state.chakras])

  if (!lowestChakra) return null

  const suggestion = RITUAL_SUGGESTIONS[lowestChakra]
  const info = CHAKRA_INFO[lowestChakra]
  const Icon = suggestion?.icon ?? Crown
  const totalSec = useMemo(() => {
    const mins = Number(String(suggestion.duration).split(' ')[0]) || 10
    return Math.max(60, mins * 60)
  }, [suggestion.duration])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const start = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    setActive(true)
    setRemainingSec(totalSec)
    playUiSound('ritual-start')
    timerRef.current = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev == null) return prev
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          timerRef.current = null
          setActive(false)
          playUiSound('ritual-end')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stop = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
    setActive(false)
    setRemainingSec(null)
    playUiSound('click')
  }

  const mm = remainingSec == null ? null : Math.floor(remainingSec / 60)
  const ss = remainingSec == null ? null : remainingSec % 60
  const progress = remainingSec == null ? 0 : Math.max(0, Math.min(1, 1 - remainingSec / totalSec))

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-hidden h-full flex flex-col justify-center">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Icon className="w-32 h-32" />
      </div>

      <div className="relative z-10">
        <div className="text-xs text-white/50 uppercase tracking-widest mb-2">{lang === 'ru' ? 'Рекомендованная практика' : 'Recommended Practice'}</div>
        <h2 className="text-2xl font-light text-white mb-1">{lang === 'ru' ? suggestion.titleRu : suggestion.title}</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
            {lang === 'ru' ? `Для баланса: ${info.nameRu}` : `For ${info.name} Balance`}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
            {suggestion.duration}
          </span>
        </div>
        
        <p className="text-sm text-white/80 leading-relaxed mb-6 max-w-md">
          {lang === 'ru' ? suggestion.descriptionRu : suggestion.description}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => (active ? stop() : start())}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all group w-full"
          >
            <span className="text-sm">{active ? (lang === 'ru' ? 'Остановить' : 'Stop') : (lang === 'ru' ? 'Начать ритуал' : 'Start Ritual')}</span>
            <ArrowRight className={`w-4 h-4 transition-transform ${active ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
          </button>
          {active && remainingSec != null && (
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{lang === 'ru' ? 'В процессе' : 'In progress'}</span>
              <span className="font-mono">{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</span>
            </div>
          )}
          {active && remainingSec != null && (
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(progress * 100)}%` }}
                className="h-full rounded-full"
                style={{ backgroundColor: info.color }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-white/10">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs text-white/40 mb-1">{lang === 'ru' ? 'Текущий уровень' : 'Current Level'}</div>
            <div className="text-3xl font-light" style={{ color: info.color }}>
              {Math.round(state.chakras[lowestChakra].level)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/40 mb-1">{lang === 'ru' ? 'Цель' : 'Target'}</div>
            <div className="text-xl font-light text-white/80">75%</div>
          </div>
        </div>
        
        <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${state.chakras[lowestChakra].level}%` }}
            className="h-full rounded-full"
            style={{ backgroundColor: info.color }}
          />
        </div>
      </div>
    </div>
  )
}
