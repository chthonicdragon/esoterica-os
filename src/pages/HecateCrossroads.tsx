import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'
import { useIsMobile } from '../hooks/use-mobile'

type AppPage =
  | 'dashboard'
  | 'altars'
  | 'ai-mentor'
  | 'ritual-tracker'
  | 'sigil-lab'
  | 'divination'
  | 'journal'
  | 'forum'
  | 'marketplace'
  | 'settings'
  | 'knowledge-graph'
  | 'chakra-intelligence'

interface HecateCrossroadsProps {
  onNavigate: (page: AppPage) => void
}

/* ── i18n ─────────────────────────────────────────────────────── */

const T = {
  ru: {
    enter: '✦  войди в священное пространство  ✦',
    title: 'Перекрёсток Гекаты',
    chooseYourPath: 'выбери свой путь',
    hecateLabel: '✦ Геката ✦',
    paths: {
      wisdom: {
        name: 'Путь Мудрости',
        subtitle: 'Просвети разум',
        label: 'Путь Мудрости',
        icon: '⚡' as const,
        pages: [
          { id: 'dashboard' as AppPage, name: 'Главная', icon: '🌙', description: 'Священный обзор — активность, фаза луны и ежедневное руководство.' },
          { id: 'knowledge-graph' as AppPage, name: 'Паутина знаний', icon: '🕸️', description: 'Живая сеть тайных знаний — символы, божества и традиции.' },
          { id: 'chakra-intelligence' as AppPage, name: 'Чакры', icon: '✨', description: 'Навигация по энергетическому телу — баланс, визуализация и активация чакр.' },
          { id: 'sigil-lab' as AppPage, name: 'Лаборатория Сигил', icon: '🔯', description: 'Создавай и заряжай личные сигилы с помощью сакральной геометрии и намерения.' },
        ],
      },
      practice: {
        name: 'Путь Практики',
        subtitle: 'Углуби работу',
        label: 'Путь Практики',
        icon: '🕯️' as const,
        pages: [
          { id: 'altars' as AppPage, name: 'Алтари', icon: '🏛️', description: 'Создавай и поддерживай священные пространства — подношения, объекты и стихийные соответствия.' },
          { id: 'ritual-tracker' as AppPage, name: 'Трекер Ритуалов', icon: '📿', description: 'Записывай и отражай свою ритуальную практику — время, намерение и результаты.' },
          { id: 'divination' as AppPage, name: 'Гадания', icon: '🔮', description: 'Обратись к оракулу — таро, руны, маятник и другие инструменты гадания.' },
          { id: 'journal' as AppPage, name: 'Журнал Снов', icon: '📖', description: 'Твой магический дневник — сны, видения, синхроничности и размышления.' },
        ],
      },
      connection: {
        name: 'Путь Связи',
        subtitle: 'Сплети паутину',
        label: 'Путь Связи',
        icon: '🌐' as const,
        pages: [
          { id: 'forum' as AppPage, name: 'Форум', icon: '💬', description: 'Собирайся в священном кругу — общайся, делись и учись у практиков со всего мира.' },
          { id: 'marketplace' as AppPage, name: 'Маркетплейс', icon: '🪬', description: 'Священные материалы от проверенных практиков — травы, кристаллы и инструменты.' },
          { id: 'ai-mentor' as AppPage, name: 'ИИ Наставник', icon: '🌟', description: 'Обратись к цифровому оракулу — персонализированное руководство от ИИ, обученного на мистических традициях.' },
          { id: 'settings' as AppPage, name: 'Настройки', icon: '⚙️', description: 'Персонализируй свою практику — уведомления, конфиденциальность, внешний вид и аккаунт.' },
        ],
      },
    },
    coven: {
      title: 'Благословение Гекаты',
      badge: 'Ковен · Скоро',
      body: 'Богиня стоит на пороге. Ковен — священное пространство для магического родства, совместных ритуалов и виртуальных кругов — ткётся прямо сейчас.',
      features: [
        'Виртуальные ритуальные круги',
        'Общий гримуар ковена',
        'Планирование лунных кругов',
        'Ступени Старейшины и Верховной Жрицы',
      ],
    },
  },
  en: {
    enter: '✦  enter the sacred space  ✦',
    title: "Hecate's Crossroads",
    chooseYourPath: 'choose your path',
    hecateLabel: '✦ Hecate ✦',
    paths: {
      wisdom: {
        name: 'Wisdom Path',
        subtitle: 'Illuminate the Mind',
        label: 'Wisdom Path',
        icon: '⚡' as const,
        pages: [
          { id: 'dashboard' as AppPage, name: 'Dashboard', icon: '🌙', description: 'Your sacred overview — recent activity, moon phase & daily guidance.' },
          { id: 'knowledge-graph' as AppPage, name: 'Knowledge Graph', icon: '🕸️', description: 'A living web of arcane knowledge — explore symbols, deities, and traditions.' },
          { id: 'chakra-intelligence' as AppPage, name: 'Chakra Intelligence', icon: '✨', description: 'Navigate your energy body — balance, visualize, and activate your chakras.' },
          { id: 'sigil-lab' as AppPage, name: 'Sigil Lab', icon: '🔯', description: 'Craft and charge personal sigils using sacred geometry and intention.' },
        ],
      },
      practice: {
        name: 'Practice Path',
        subtitle: 'Deepen the Work',
        label: 'Practice Path',
        icon: '🕯️' as const,
        pages: [
          { id: 'altars' as AppPage, name: 'Altars', icon: '🏛️', description: 'Build and tend your sacred spaces — offerings, objects, and elemental correspondences.' },
          { id: 'ritual-tracker' as AppPage, name: 'Ritual Tracker', icon: '📿', description: 'Record and reflect on your ritual practice — timing, intention, and results.' },
          { id: 'divination' as AppPage, name: 'Divination', icon: '🔮', description: 'Consult the oracle — tarot, runes, pendulum, and other divination tools.' },
          { id: 'journal' as AppPage, name: 'Journal', icon: '📖', description: 'Your magical diary — dreams, visions, synchronicities, and reflections.' },
        ],
      },
      connection: {
        name: 'Connection Path',
        subtitle: 'Weave the Web',
        label: 'Connection Path',
        icon: '🌐' as const,
        pages: [
          { id: 'forum' as AppPage, name: 'Forum', icon: '💬', description: 'Gather in the sacred circle — discuss, share, and learn with practitioners worldwide.' },
          { id: 'marketplace' as AppPage, name: 'Marketplace', icon: '🪬', description: 'Source sacred supplies from trusted practitioners — herbs, crystals, and tools.' },
          { id: 'ai-mentor' as AppPage, name: 'AI Mentor', icon: '🌟', description: 'Consult the digital oracle — personalized guidance from an AI trained in mystical traditions.' },
          { id: 'settings' as AppPage, name: 'Settings', icon: '⚙️', description: 'Personalize your practice — notifications, privacy, appearance, and account.' },
        ],
      },
    },
    coven: {
      title: "Hecate's Blessing",
      badge: 'Coven Central · Coming Soon',
      body: 'The goddess stands at the threshold. Coven Central — a sacred space for magical kinship, shared rituals, and virtual circles — is being woven into existence.',
      features: [
        'Virtual ritual circles',
        'Shared coven grimoire',
        'Moon circle planning',
        'Elder & High Priestess tiers',
      ],
    },
  },
}

/* ── Colour palette per path ──────────────────────────────────── */

const PATH_COLORS = {
  wisdom:     { color: '#8b5cf6', dotColor: '#a78bfa', gradientFrom: 'rgba(88, 28, 135, 0.97)', gradientTo: 'rgba(20, 8, 50, 0.99)'   },
  practice:   { color: '#3b82f6', dotColor: '#93c5fd', gradientFrom: 'rgba(10, 30, 80, 0.97)',  gradientTo: 'rgba(5, 12, 40, 0.99)'   },
  connection: { color: '#ec4899', dotColor: '#f9a8d4', gradientFrom: 'rgba(70, 10, 50, 0.97)',  gradientTo: 'rgba(25, 5, 20, 0.99)'   },
}

type PathId = keyof typeof PATH_COLORS

/* ── Glowing dot marker ──────────────────────────────────────── */

function PathMarker({
  label,
  color,
  dotColor,
  labelPos = 'below',
  pulseDelay = 0,
}: {
  label: string
  color: string
  dotColor: string
  labelPos?: 'above' | 'below'
  pulseDelay?: number
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 pointer-events-none select-none">
      {labelPos === 'above' && (
        <motion.span
          className="text-[9px] tracking-[0.22em] uppercase font-medium whitespace-nowrap"
          style={{ fontFamily: "'Cinzel', serif", color: dotColor, textShadow: `0 0 12px ${color}` }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 3, repeat: Infinity, delay: pulseDelay }}
        >
          {label}
        </motion.span>
      )}

      {/* Dot + rings */}
      <div className="relative flex items-center justify-center" style={{ width: 28, height: 28 }}>
        <motion.span
          className="absolute rounded-full"
          style={{ width: 28, height: 28, border: `1px solid ${color}` }}
          animate={{ opacity: [0, 0.35, 0], scale: [0.6, 1.5, 1.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: pulseDelay }}
        />
        <motion.span
          className="absolute rounded-full"
          style={{ width: 28, height: 28, border: `1px solid ${color}` }}
          animate={{ opacity: [0, 0.25, 0], scale: [0.6, 2.1, 2.1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: pulseDelay + 0.3 }}
        />
        <motion.span
          className="absolute rounded-full"
          style={{ width: 7, height: 7, background: dotColor, boxShadow: `0 0 10px 3px ${color}88` }}
          animate={{ opacity: [0.8, 1, 0.8], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: pulseDelay }}
        />
      </div>

      {labelPos === 'below' && (
        <motion.span
          className="text-[9px] tracking-[0.22em] uppercase font-medium whitespace-nowrap"
          style={{ fontFamily: "'Cinzel', serif", color: dotColor, textShadow: `0 0 12px ${color}` }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 3, repeat: Infinity, delay: pulseDelay }}
        >
          {label}
        </motion.span>
      )}
    </div>
  )
}

/* ── Path modal ──────────────────────────────────────────────── */

function PathModal({
  pathId,
  lang,
  onClose,
  onNavigate,
}: {
  pathId: PathId | null
  lang: 'ru' | 'en'
  onClose: () => void
  onNavigate: (page: AppPage) => void
}) {
  if (!pathId) return null
  const t = T[lang].paths[pathId]
  const colors = PATH_COLORS[pathId]

  return (
    <AnimatePresence>
      {pathId && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
            style={{
              borderRadius: '24px 24px 0 0',
              maxHeight: '82vh',
              background: `linear-gradient(170deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
              borderTop: `1px solid ${colors.color}55`,
              boxShadow: `0 -12px 50px ${colors.color}20`,
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full opacity-30" style={{ background: colors.color }} />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-3 pb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{t.icon}</span>
                  <h2
                    className="text-xl font-bold tracking-widest"
                    style={{ fontFamily: "'Cinzel', serif", color: colors.color }}
                  >
                    {t.name}
                  </h2>
                </div>
                <p className="text-xs tracking-[0.2em] uppercase opacity-55 ml-11">
                  {t.subtitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 mt-1 flex-shrink-0"
                style={{ background: `${colors.color}18`, border: `1px solid ${colors.color}33` }}
              >
                <X size={15} style={{ color: colors.color }} />
              </button>
            </div>

            <div style={{ height: '1px', background: `${colors.color}22`, margin: '0 24px 16px' }} />

            {/* Page list */}
            <div className="overflow-y-auto px-5 pb-12" style={{ maxHeight: 'calc(82vh - 130px)' }}>
              <div className="flex flex-col gap-3">
                {t.pages.map((page, i) => (
                  <motion.button
                    key={page.id}
                    className="w-full text-left rounded-2xl px-5 py-4 transition-all"
                    style={{
                      background: `${colors.color}0e`,
                      border: `1px solid ${colors.color}28`,
                    }}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 + 0.1, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      onClose()
                      setTimeout(() => onNavigate(page.id), 100)
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${colors.color}18`, border: `1px solid ${colors.color}30` }}
                      >
                        {page.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold tracking-wider text-sm mb-0.5"
                          style={{ fontFamily: "'Cinzel', serif", color: colors.color }}
                        >
                          {page.name}
                        </p>
                        <p className="text-xs leading-relaxed opacity-55 line-clamp-2" style={{ color: '#c4b5fd' }}>
                          {page.description}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-lg opacity-35" style={{ color: colors.color }}>›</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ── Coven modal ─────────────────────────────────────────────── */

function CovenModal({
  open,
  lang,
  onClose,
}: {
  open: boolean
  lang: 'ru' | 'en'
  onClose: () => void
}) {
  const tc = T[lang].coven

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="coven-backdrop"
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
          />
          <motion.div
            key="coven-sheet"
            className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
            style={{
              borderRadius: '24px 24px 0 0',
              maxHeight: '65vh',
              background: 'linear-gradient(170deg, rgba(50,25,5,0.98) 0%, rgba(12,6,2,0.99) 100%)',
              borderTop: '1px solid rgba(251,191,36,0.45)',
              boxShadow: '0 -12px 50px rgba(251,191,36,0.10)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full opacity-30 bg-amber-400" />
            </div>
            <div className="flex items-center justify-between px-6 pt-3 pb-4">
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-3xl"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  🔥
                </motion.span>
                <div>
                  <h2
                    className="text-lg font-bold tracking-widest text-amber-400"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {tc.title}
                  </h2>
                  <p className="text-xs text-amber-400/45 tracking-[0.18em] uppercase">
                    {tc.badge}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)' }}
              >
                <X size={15} className="text-amber-400" />
              </button>
            </div>

            <div style={{ height: '1px', background: 'rgba(251,191,36,0.18)', margin: '0 24px 16px' }} />

            <div className="px-6 pb-8">
              <p className="text-sm text-amber-100/55 leading-relaxed mb-5">
                {tc.body}
              </p>
              <div className="space-y-2">
                {tc.features.map((feature, i) => (
                  <motion.div
                    key={feature}
                    className="flex items-center gap-3 p-3 rounded-xl text-xs text-amber-100/50"
                    style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)' }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 + 0.25, duration: 0.32 }}
                  >
                    <span className="text-amber-400 text-sm">✦</span>
                    {feature}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ── Main component ──────────────────────────────────────────── */

export function HecateCrossroads({ onNavigate }: HecateCrossroadsProps) {
  const [activeModal, setActiveModal] = useState<PathId | null>(null)
  const [covenOpen, setCovenOpen] = useState(false)
  const { lang } = useLang()
  const isMobile = useIsMobile()

  const t = T[lang as 'ru' | 'en'] ?? T.ru

  const openPath = useCallback((id: PathId) => setActiveModal(id), [])
  const closeModal = useCallback(() => setActiveModal(null), [])
  const layout = isMobile
    ? {
        wisdom: { left: '50%', top: '43%', width: '42%', height: '12%', transform: 'translateX(-50%)' },
        practice: { left: '10%', top: '67%', width: '34%', height: '16%', transform: 'translate(-50%, -50%)' },
        connection: { right: '10%', top: '67%', width: '34%', height: '16%', transform: 'translate(50%, -50%)' },
        hecate: { left: '50%', top: '69%', width: '48%', height: '20%', transform: 'translate(-50%, -50%)' },
      }
    : {
        wisdom: { left: '50%', top: '43%', width: '220px', height: '95px', transform: 'translateX(-50%)' },
        practice: { left: '12%', top: '66%', width: '220px', height: '110px', transform: 'translate(-50%, -50%)' },
        connection: { right: '12%', top: '66%', width: '220px', height: '110px', transform: 'translate(50%, -50%)' },
        hecate: { left: '50%', top: '68%', width: '220px', height: '170px', transform: 'translate(-50%, -50%)' },
      }

  return (
    <>
      <style>{`
        @keyframes crossroads-float {
          0%,100% { transform: translateY(0);   opacity: 0.35; }
          50%      { transform: translateY(-9px); opacity: 0.6; }
        }
      `}</style>

      <div className="relative w-full overflow-hidden select-none bg-[#04020e]" style={{ height: '100dvh' }}>

        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative h-full max-h-[100dvh]" style={{ width: 'min(100vw, 56.25dvh)' }}>
            <motion.img
              src="/hecate-crossroads.jpg"
              alt="Hecate's Crossroads"
              className="absolute inset-0 w-full h-full object-cover object-center"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              draggable={false}
            />

        {/* Atmospheric gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.05) 0%, transparent 70%), ' +
              'linear-gradient(0deg, rgba(4,2,14,0.85) 0%, rgba(4,2,14,0.2) 50%, rgba(4,2,14,0.4) 100%)',
          }}
        />

        {/* ── Title ── */}
        <motion.div
          className="absolute top-0 left-0 right-0 flex flex-col items-center pt-8 md:pt-12 z-10 pointer-events-none"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[8px] md:text-[9px] tracking-[0.35em] uppercase text-amber-300/55 mb-1">
            {t.enter}
          </p>
          <h1
            className="text-xl md:text-2xl font-black tracking-[0.18em] text-white drop-shadow-lg text-center px-4"
            style={{
              fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
              textShadow: '0 0 40px rgba(139,92,246,0.55)',
            }}
          >
            {t.title}
          </h1>
        </motion.div>

            {/* ── Interaction Zones Container ── */}
            <div className="absolute inset-0 w-full h-full">
          {/* ── Wisdom Path zone (upper center) ── */}
          <motion.button
            data-testid="zone-wisdom-path"
            className="absolute flex items-center justify-center z-20"
            style={layout.wisdom}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => openPath('wisdom')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <PathMarker
              label={t.paths.wisdom.label}
              color={PATH_COLORS.wisdom.color}
              dotColor={PATH_COLORS.wisdom.dotColor}
              labelPos="above"
              pulseDelay={0}
            />
          </motion.button>

          {/* ── Practice Path zone (left road) ── */}
          <motion.button
            data-testid="zone-practice-path"
            className="absolute flex items-center justify-center z-20"
            style={layout.practice}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => openPath('practice')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.35, duration: 0.6 }}
          >
            <PathMarker
              label={t.paths.practice.label}
              color={PATH_COLORS.practice.color}
              dotColor={PATH_COLORS.practice.dotColor}
              labelPos="below"
              pulseDelay={0.5}
            />
          </motion.button>

          {/* ── Connection Path zone (right road) ── */}
          <motion.button
            data-testid="zone-connection-path"
            className="absolute flex items-center justify-center z-20"
            style={layout.connection}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => openPath('connection')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            <PathMarker
              label={t.paths.connection.label}
              color={PATH_COLORS.connection.color}
              dotColor={PATH_COLORS.connection.dotColor}
              labelPos="below"
              pulseDelay={1.0}
            />
          </motion.button>

          {/* ── Hecate statue zone (center) ── */}
          <motion.button
            data-testid="zone-hecate-statue"
            className="absolute flex items-center justify-center z-10"
            style={layout.hecate}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCovenOpen(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{
                boxShadow: [
                  'inset 0 0 0px rgba(251,191,36,0)',
                  'inset 0 0 40px rgba(251,191,36,0.08)',
                  'inset 0 0 0px rgba(251,191,36,0)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4.5, repeat: Infinity }}
            >
              <span
                className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase font-cinzel"
                style={{
                  color: '#fcd34d',
                  textShadow: '0 0 14px rgba(251,191,36,0.6)',
                }}
              >
                {t.hecateLabel}
              </span>
            </motion.div>
          </motion.button>
            </div>
          </div>
        </div>

        {/* ── Bottom "choose your path" label ── */}
        <motion.div
          className="absolute bottom-8 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <motion.p
            className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-center font-cinzel"
            style={{ color: 'rgba(251,191,36,0.45)' }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            {t.chooseYourPath}
          </motion.p>
        </motion.div>

        {/* ── Mist particles ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${40 + i * 20}px`,
                height: `${15 + i * 8}px`,
                background: 'rgba(200,190,240,0.03)',
                left: `${(i * 15) % 100}%`,
                top: `${45 + (i % 4) * 10}%`,
                filter: 'blur(12px)',
                animation: `crossroads-float ${5 + i * 0.8}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <PathModal
        pathId={activeModal}
        lang={lang as 'ru' | 'en'}
        onClose={closeModal}
        onNavigate={onNavigate}
      />
      <CovenModal
        open={covenOpen}
        lang={lang as 'ru' | 'en'}
        onClose={() => setCovenOpen(false)}
      />
    </>
  )
}
