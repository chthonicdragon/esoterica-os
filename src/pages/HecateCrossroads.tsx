import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

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

/* ── Path config ─────────────────────────────────────────────── */

const PATHS = {
  wisdom: {
    id: 'wisdom',
    name: 'Wisdom Path',
    subtitle: 'Illuminate the Mind',
    icon: '⚡',
    color: '#8b5cf6',
    gradientFrom: 'rgba(88, 28, 135, 0.97)',
    gradientTo: 'rgba(20, 8, 50, 0.99)',
    pages: [
      { id: 'dashboard' as AppPage, name: 'Dashboard', icon: '🌙', description: 'Your sacred overview — recent activity, moon phase & daily guidance.' },
      { id: 'knowledge-graph' as AppPage, name: 'Knowledge Graph', icon: '🕸️', description: 'A living web of arcane knowledge — explore symbols, deities, and traditions.' },
      { id: 'chakra-intelligence' as AppPage, name: 'Chakra Intelligence', icon: '✨', description: 'Navigate your energy body — balance, visualize, and activate your chakras.' },
      { id: 'sigil-lab' as AppPage, name: 'Sigil Lab', icon: '🔯', description: 'Craft and charge personal sigils using sacred geometry and intention.' },
    ],
  },
  practice: {
    id: 'practice',
    name: 'Practice Path',
    subtitle: 'Deepen the Work',
    icon: '🕯️',
    color: '#3b82f6',
    gradientFrom: 'rgba(10, 30, 80, 0.97)',
    gradientTo: 'rgba(5, 12, 40, 0.99)',
    pages: [
      { id: 'altars' as AppPage, name: 'Altars', icon: '🏛️', description: 'Build and tend your sacred spaces — offerings, objects, and elemental correspondences.' },
      { id: 'ritual-tracker' as AppPage, name: 'Ritual Tracker', icon: '📿', description: 'Record and reflect on your ritual practice — timing, intention, and results.' },
      { id: 'divination' as AppPage, name: 'Divination', icon: '🔮', description: 'Consult the oracle — tarot, runes, pendulum, and other divination tools.' },
      { id: 'journal' as AppPage, name: 'Journal', icon: '📖', description: 'Your magical diary — dreams, visions, synchronicities, and reflections.' },
    ],
  },
  connection: {
    id: 'connection',
    name: 'Connection Path',
    subtitle: 'Weave the Web',
    icon: '🌐',
    color: '#ec4899',
    gradientFrom: 'rgba(70, 10, 50, 0.97)',
    gradientTo: 'rgba(25, 5, 20, 0.99)',
    pages: [
      { id: 'forum' as AppPage, name: 'Forum', icon: '💬', description: 'Gather in the sacred circle — discuss, share, and learn with practitioners worldwide.' },
      { id: 'marketplace' as AppPage, name: 'Marketplace', icon: '🪬', description: 'Source sacred supplies from trusted practitioners — herbs, crystals, and tools.' },
      { id: 'ai-mentor' as AppPage, name: 'AI Mentor', icon: '🌟', description: 'Consult the digital oracle — personalized guidance from an AI trained in mystical traditions.' },
      { id: 'settings' as AppPage, name: 'Settings', icon: '⚙️', description: 'Personalize your practice — notifications, privacy, appearance, and account.' },
    ],
  },
} as const

type PathId = keyof typeof PATHS

/* ── Pulse ring ──────────────────────────────────────────────── */

function PulseRing({ color }: { color: string }) {
  return (
    <span
      className="absolute inset-0 pointer-events-none"
      style={{
        borderRadius: '50%',
        animation: 'crossroads-pulse 2.8s ease-out infinite',
        boxShadow: `0 0 0 0 ${color}`,
      }}
    />
  )
}

/* ── Path modal ──────────────────────────────────────────────── */

function PathModal({
  pathId,
  onClose,
  onNavigate,
}: {
  pathId: PathId | null
  onClose: () => void
  onNavigate: (page: AppPage) => void
}) {
  const path = pathId ? PATHS[pathId] : null

  return (
    <AnimatePresence>
      {pathId && path && (
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
              background: `linear-gradient(170deg, ${path.gradientFrom} 0%, ${path.gradientTo} 100%)`,
              borderTop: `1px solid ${path.color}55`,
              boxShadow: `0 -12px 50px ${path.color}20`,
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full opacity-30" style={{ background: path.color }} />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-3 pb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{path.icon}</span>
                  <h2 className="text-xl font-bold tracking-widest" style={{ fontFamily: "'Cinzel', serif", color: path.color }}>
                    {path.name}
                  </h2>
                </div>
                <p className="text-xs tracking-[0.2em] uppercase opacity-55 ml-11">
                  {path.subtitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 mt-1 flex-shrink-0"
                style={{ background: `${path.color}18`, border: `1px solid ${path.color}33` }}
              >
                <X size={15} style={{ color: path.color }} />
              </button>
            </div>

            <div style={{ height: '1px', background: `${path.color}22`, margin: '0 24px 16px' }} />

            {/* Page list */}
            <div className="overflow-y-auto px-5 pb-12" style={{ maxHeight: 'calc(82vh - 130px)' }}>
              <div className="flex flex-col gap-3">
                {path.pages.map((page, i) => (
                  <motion.button
                    key={page.id}
                    className="w-full text-left rounded-2xl px-5 py-4 transition-all"
                    style={{
                      background: `${path.color}0e`,
                      border: `1px solid ${path.color}28`,
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
                        style={{ background: `${path.color}18`, border: `1px solid ${path.color}30` }}
                      >
                        {page.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold tracking-wider text-sm mb-0.5"
                          style={{ fontFamily: "'Cinzel', serif", color: path.color }}
                        >
                          {page.name}
                        </p>
                        <p className="text-xs leading-relaxed opacity-55 line-clamp-2" style={{ color: '#c4b5fd' }}>
                          {page.description}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-lg opacity-35" style={{ color: path.color }}>›</span>
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

function CovenModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
                  <h2 className="text-lg font-bold tracking-widest text-amber-400" style={{ fontFamily: "'Cinzel', serif" }}>
                    Hecate's Blessing
                  </h2>
                  <p className="text-xs text-amber-400/45 tracking-[0.18em] uppercase">Coven Central · Coming Soon</p>
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
                The goddess stands at the threshold. Coven Central — a sacred space for magical kinship, shared rituals, and virtual circles — is being woven into existence.
              </p>
              <div className="space-y-2">
                {[
                  'Virtual ritual circles',
                  'Shared coven grimoire',
                  'Moon circle planning',
                  'Elder & High Priestess tiers',
                ].map((feature, i) => (
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

  const openPath = useCallback((id: PathId) => setActiveModal(id), [])
  const closeModal = useCallback(() => setActiveModal(null), [])

  return (
    <>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes crossroads-pulse {
          0%   { box-shadow: 0 0 0 0 currentColor; opacity: 0.8; }
          70%  { box-shadow: 0 0 0 18px transparent; opacity: 0; }
          100% { box-shadow: 0 0 0 18px transparent; opacity: 0; }
        }
        @keyframes crossroads-float {
          0%,100% { transform: translateY(0);   opacity: 0.4; }
          50%      { transform: translateY(-9px); opacity: 0.7; }
        }
      `}</style>

      <div
        className="relative w-full overflow-hidden select-none"
        style={{ height: '100dvh' }}
      >
        {/* Background */}
        <motion.img
          src="/hecate-crossroads.jpg"
          alt="Hecate's Crossroads"
          className="absolute inset-0 w-full h-full object-cover object-top"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          draggable={false}
        />

        {/* Atmospheric gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 38% at 50% 0%, rgba(139,92,246,0.07) 0%, transparent 70%), ' +
              'linear-gradient(0deg, rgba(4,2,14,0.68) 0%, rgba(4,2,14,0.0) 38%, rgba(4,2,14,0.18) 100%)',
          }}
        />

        {/* Title */}
        <motion.div
          className="absolute top-0 left-0 right-0 flex flex-col items-center pt-12 z-10 pointer-events-none"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[9px] tracking-[0.45em] uppercase text-amber-300/55 mb-1">
            ✦ &nbsp; enter the sacred space &nbsp; ✦
          </p>
          <h1
            className="text-2xl font-black tracking-[0.22em] text-white drop-shadow-lg"
            style={{
              fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
              textShadow: '0 0 40px rgba(139,92,246,0.55)',
            }}
          >
            Hecate's Crossroads
          </h1>
        </motion.div>

        {/* ── Wisdom Path zone (upper center road) ── */}
        <motion.button
          data-testid="zone-wisdom-path"
          className="absolute"
          style={{
            left: '34%', top: '30%', width: '32%', height: '10%',
            borderRadius: '50%',
            border: '1.5px solid rgba(139,92,246,0.35)',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, transparent 80%)',
          }}
          whileTap={{ scale: 0.93 }}
          onClick={() => openPath('wisdom')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <PulseRing color="rgba(139,92,246,0.6)" />
          <motion.div
            className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span
              className="text-[9px] tracking-[0.3em] uppercase font-semibold px-2.5 py-1 rounded-full"
              style={{
                color: '#c4b5fd',
                background: 'rgba(88,28,135,0.58)',
                border: '1px solid rgba(139,92,246,0.45)',
                backdropFilter: 'blur(4px)',
                fontFamily: "'Cinzel', serif",
              }}
            >
              Wisdom
            </span>
          </motion.div>
        </motion.button>

        {/* ── Practice Path zone (left road) ── */}
        <motion.button
          data-testid="zone-practice-path"
          className="absolute"
          style={{
            left: '2%', top: '50%', width: '24%', height: '13%',
            borderRadius: '50%',
            border: '1.5px solid rgba(59,130,246,0.35)',
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.14) 0%, transparent 80%)',
          }}
          whileTap={{ scale: 0.93 }}
          onClick={() => openPath('practice')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.35, duration: 0.6 }}
        >
          <PulseRing color="rgba(59,130,246,0.6)" />
          <motion.div
            className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 3.3, repeat: Infinity }}
          >
            <span
              className="text-[9px] tracking-[0.3em] uppercase font-semibold px-2.5 py-1 rounded-full"
              style={{
                color: '#93c5fd',
                background: 'rgba(10,30,80,0.62)',
                border: '1px solid rgba(59,130,246,0.45)',
                backdropFilter: 'blur(4px)',
                fontFamily: "'Cinzel', serif",
              }}
            >
              Practice
            </span>
          </motion.div>
        </motion.button>

        {/* ── Connection Path zone (right road) ── */}
        <motion.button
          data-testid="zone-connection-path"
          className="absolute"
          style={{
            left: '74%', top: '50%', width: '24%', height: '13%',
            borderRadius: '50%',
            border: '1.5px solid rgba(236,72,153,0.35)',
            background: 'radial-gradient(ellipse, rgba(236,72,153,0.13) 0%, transparent 80%)',
          }}
          whileTap={{ scale: 0.93 }}
          onClick={() => openPath('connection')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <PulseRing color="rgba(236,72,153,0.6)" />
          <motion.div
            className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          >
            <span
              className="text-[9px] tracking-[0.3em] uppercase font-semibold px-2.5 py-1 rounded-full"
              style={{
                color: '#f9a8d4',
                background: 'rgba(70,10,50,0.62)',
                border: '1px solid rgba(236,72,153,0.45)',
                backdropFilter: 'blur(4px)',
                fontFamily: "'Cinzel', serif",
              }}
            >
              Connection
            </span>
          </motion.div>
        </motion.button>

        {/* ── Hecate statue zone (center) ── */}
        <motion.button
          data-testid="zone-hecate-statue"
          className="absolute"
          style={{
            left: '28%', top: '48%', width: '44%', height: '22%',
            borderRadius: '50%',
            background: 'transparent',
          }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCovenOpen(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
        >
          {/* Golden aura */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: '1.5px solid rgba(251,191,36,0.30)',
            }}
            animate={{
              boxShadow: [
                '0 0 18px rgba(251,191,36,0.10), inset 0 0 18px rgba(251,191,36,0.05)',
                '0 0 38px rgba(251,191,36,0.22), inset 0 0 28px rgba(251,191,36,0.10)',
                '0 0 18px rgba(251,191,36,0.10), inset 0 0 18px rgba(251,191,36,0.05)',
              ],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
            animate={{ opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <span
              className="text-[8px] tracking-[0.38em] uppercase px-2.5 py-1 rounded-full"
              style={{
                color: '#fcd34d',
                background: 'rgba(25,12,2,0.65)',
                border: '1px solid rgba(251,191,36,0.30)',
                backdropFilter: 'blur(4px)',
                fontFamily: "'Cinzel', serif",
              }}
            >
              ✦ Hecate ✦
            </span>
          </motion.div>
        </motion.button>

        {/* ── Bottom "choose your path" label ── */}
        <motion.div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{ left: '15%', top: '83%', width: '70%', height: '10%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
        >
          <motion.p
            className="text-[9px] tracking-[0.42em] uppercase text-center"
            style={{ color: 'rgba(251,191,36,0.40)', fontFamily: "'Cinzel', serif" }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4.5, repeat: Infinity }}
          >
            choose your path
          </motion.p>
        </motion.div>

        {/* ── Mist particles ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${32 + i * 14}px`,
                height: `${13 + i * 5}px`,
                background: 'rgba(200,190,240,0.05)',
                left: `${10 + i * 18}%`,
                top: `${56 + (i % 3) * 7}%`,
                filter: 'blur(7px)',
              }}
              animate={{
                y: [0, -(9 + i * 2), 0],
                opacity: [0.25, 0.55, 0.25],
                x: [0, i % 2 === 0 ? 8 : -8, 0],
              }}
              transition={{
                duration: 4 + i * 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.55,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Modals (portaled outside the overflow-hidden container) ── */}
      <PathModal pathId={activeModal} onClose={closeModal} onNavigate={onNavigate} />
      <CovenModal open={covenOpen} onClose={() => setCovenOpen(false)} />
    </>
  )
}
