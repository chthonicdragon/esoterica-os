import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { hecateCrossroadsTheme, type PathId } from "@/lib/themeRegistry";

const theme = hecateCrossroadsTheme;

/* ── small helpers ────────────────────────────────────────────── */

function pct(n: number) {
  return `${n}%`;
}

/* ── Path Modal ────────────────────────────────────────────────── */

interface PathModalProps {
  pathId: PathId | null;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

function PathModal({ pathId, onClose, onNavigate }: PathModalProps) {
  const isOpen = pathId !== null;
  const path = pathId ? theme.paths[pathId] : null;

  return (
    <AnimatePresence>
      {isOpen && path && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Sheet panel */}
          <motion.div
            key="sheet"
            className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
            style={{
              borderRadius: "24px 24px 0 0",
              maxHeight: "82vh",
              background: `linear-gradient(170deg, ${path.gradientFrom} 0%, ${path.gradientTo} 100%)`,
              borderTop: `1px solid ${path.color}55`,
              boxShadow: `0 -8px 40px ${path.color}22`,
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="w-10 h-1 rounded-full opacity-40"
                style={{ background: path.color }}
              />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-3 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-3xl">{path.icon}</span>
                  <h2
                    className="text-xl font-bold tracking-widest"
                    style={{ fontFamily: "'Cinzel', serif", color: path.color }}
                  >
                    {path.name}
                  </h2>
                </div>
                <p className="text-xs tracking-[0.2em] uppercase opacity-60 ml-10">
                  {path.subtitle}
                </p>
              </div>
              <button
                data-testid="btn-modal-close"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 mt-1"
                style={{ background: `${path.color}18`, border: `1px solid ${path.color}33` }}
              >
                <X size={16} style={{ color: path.color }} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: `${path.color}25`, margin: "0 24px 16px" }} />

            {/* Page list */}
            <div className="overflow-y-auto px-5 pb-10" style={{ maxHeight: "calc(82vh - 130px)" }}>
              <div className="flex flex-col gap-3">
                {path.pages.map((page, i) => (
                  <motion.button
                    key={page.id}
                    data-testid={`btn-page-${page.id}`}
                    className="w-full text-left rounded-2xl px-5 py-4 transition-all active:scale-97"
                    style={{
                      background: `${path.color}0f`,
                      border: `1px solid ${path.color}2a`,
                    }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 + 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onNavigate(page.route)}
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
                        <p className="text-xs leading-relaxed opacity-60 line-clamp-2">
                          {page.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 opacity-40" style={{ color: path.color }}>
                        ›
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Coven Coming-Soon Modal ───────────────────────────────────── */

function CovenModal({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (r: string) => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="coven-backdrop"
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            key="coven-sheet"
            className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
            style={{
              borderRadius: "24px 24px 0 0",
              maxHeight: "70vh",
              background: "linear-gradient(170deg, rgba(60,30,5,0.97) 0%, rgba(15,8,2,0.99) 100%)",
              borderTop: "1px solid rgba(245,158,11,0.5)",
              boxShadow: "0 -8px 40px rgba(245,158,11,0.12)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full opacity-40 bg-amber-400" />
            </div>
            <div className="flex items-center justify-between px-6 pt-3 pb-4">
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-3xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  🔥
                </motion.span>
                <div>
                  <h2
                    className="text-lg font-bold tracking-widest text-amber-400"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Hecate's Blessing
                  </h2>
                  <p className="text-xs text-amber-400/50 tracking-[0.15em] uppercase">
                    Coven Central · Coming Soon
                  </p>
                </div>
              </div>
              <button
                data-testid="btn-coven-close"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}
              >
                <X size={16} className="text-amber-400" />
              </button>
            </div>
            <div style={{ height: "1px", background: "rgba(245,158,11,0.2)", margin: "0 24px 16px" }} />
            <div className="px-6 pb-8">
              <p className="text-sm text-amber-100/60 leading-relaxed mb-5">
                The goddess stands at the threshold. Coven Central — a sacred space for magical kinship, shared rituals, and virtual circles — is being woven into existence.
              </p>
              <button
                data-testid="btn-preview-coven"
                className="w-full rounded-2xl py-3.5 font-semibold tracking-widest text-sm transition-all active:scale-98"
                style={{
                  fontFamily: "'Cinzel', serif",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.12))",
                  border: "1px solid rgba(245,158,11,0.4)",
                  color: "#fcd34d",
                }}
                onClick={() => onNavigate("/coven")}
              >
                Preview the Vision →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Pulse Ring Overlay ──────────────────────────────────────────── */

function PulseRing({ color }: { color: string }) {
  return (
    <span
      className="absolute inset-0 rounded-[inherit] pointer-events-none"
      style={{
        boxShadow: `0 0 0 0 ${color}`,
        animation: "pulse-ring 2.5s ease-out infinite",
        borderRadius: "50%",
      }}
    />
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */

export default function HecateCrossroads() {
  const [activeModal, setActiveModal] = useState<PathId | null>(null);
  const [covenOpen, setCovenOpen] = useState(false);
  const [, setLocation] = useLocation();

  const openPath = useCallback((id: PathId) => {
    setActiveModal(id);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const navigate = useCallback(
    (route: string) => {
      setActiveModal(null);
      setCovenOpen(false);
      setTimeout(() => setLocation(route), 80);
    },
    [setLocation],
  );

  const z = theme.zones;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: "100dvh", maxHeight: "100dvh" }}
    >
      {/* ── Background image ── */}
      <motion.img
        src="/hecate-crossroads.jpg"
        alt="Hecate's Crossroads"
        className="absolute inset-0 w-full h-full object-cover object-top"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        draggable={false}
      />

      {/* ── Atmospheric overlays ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 70%), " +
            "linear-gradient(0deg, rgba(5,3,18,0.65) 0%, rgba(5,3,18,0.0) 40%, rgba(5,3,18,0.15) 100%)",
        }}
      />

      {/* ── Title header ── */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex flex-col items-center pt-12 z-10 pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <p
          className="text-[10px] tracking-[0.45em] uppercase text-amber-300/60 mb-1"
        >
          ✦ &nbsp; enter the sacred space &nbsp; ✦
        </p>
        <h1
          className="text-2xl font-black tracking-[0.25em] text-white drop-shadow-lg"
          style={{ fontFamily: "'Cinzel Decorative', 'Cinzel', serif", textShadow: "0 0 40px rgba(139,92,246,0.5)" }}
        >
          Hecate's Crossroads
        </h1>
      </motion.div>

      {/* ── Wisdom Path zone (upper center road) ── */}
      <motion.button
        data-testid="zone-wisdom-path"
        className="absolute"
        style={{
          left: pct(z.wisdomPath.xPct),
          top: pct(z.wisdomPath.yPct),
          width: pct(z.wisdomPath.wPct),
          height: pct(z.wisdomPath.hPct),
          borderRadius: "50%",
          border: "1.5px solid rgba(139,92,246,0.35)",
          background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 80%)",
        }}
        whileTap={{ scale: 0.94 }}
        onClick={() => openPath("wisdom")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <PulseRing color="rgba(139,92,246,0.5)" />
        {/* Label */}
        <motion.div
          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span
            className="text-[9px] tracking-[0.3em] uppercase font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: "#c4b5fd",
              background: "rgba(88,28,135,0.55)",
              border: "1px solid rgba(139,92,246,0.4)",
              backdropFilter: "blur(4px)",
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
          left: pct(z.practicePath.xPct),
          top: pct(z.practicePath.yPct),
          width: pct(z.practicePath.wPct),
          height: pct(z.practicePath.hPct),
          borderRadius: "50%",
          border: "1.5px solid rgba(59,130,246,0.35)",
          background: "radial-gradient(ellipse, rgba(59,130,246,0.14) 0%, transparent 80%)",
        }}
        whileTap={{ scale: 0.94 }}
        onClick={() => openPath("practice")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.35, duration: 0.6 }}
      >
        <PulseRing color="rgba(59,130,246,0.5)" />
        <motion.div
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.3, repeat: Infinity }}
        >
          <span
            className="text-[9px] tracking-[0.3em] uppercase font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: "#93c5fd",
              background: "rgba(10,30,80,0.6)",
              border: "1px solid rgba(59,130,246,0.4)",
              backdropFilter: "blur(4px)",
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
          left: pct(z.connectionPath.xPct),
          top: pct(z.connectionPath.yPct),
          width: pct(z.connectionPath.wPct),
          height: pct(z.connectionPath.hPct),
          borderRadius: "50%",
          border: "1.5px solid rgba(236,72,153,0.35)",
          background: "radial-gradient(ellipse, rgba(236,72,153,0.13) 0%, transparent 80%)",
        }}
        whileTap={{ scale: 0.94 }}
        onClick={() => openPath("connection")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <PulseRing color="rgba(236,72,153,0.5)" />
        <motion.div
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        >
          <span
            className="text-[9px] tracking-[0.3em] uppercase font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: "#f9a8d4",
              background: "rgba(70,10,50,0.6)",
              border: "1px solid rgba(236,72,153,0.4)",
              backdropFilter: "blur(4px)",
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
          left: pct(z.hecateStatue.xPct),
          top: pct(z.hecateStatue.yPct),
          width: pct(z.hecateStatue.wPct),
          height: pct(z.hecateStatue.hPct),
          borderRadius: "50%",
          background: "transparent",
        }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setCovenOpen(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}
      >
        {/* Golden aura ring */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: "1.5px solid rgba(251,191,36,0.35)",
            boxShadow: "0 0 20px rgba(251,191,36,0.12), inset 0 0 20px rgba(251,191,36,0.06)",
          }}
          animate={{
            boxShadow: [
              "0 0 20px rgba(251,191,36,0.12), inset 0 0 20px rgba(251,191,36,0.06)",
              "0 0 40px rgba(251,191,36,0.22), inset 0 0 30px rgba(251,191,36,0.10)",
              "0 0 20px rgba(251,191,36,0.12), inset 0 0 20px rgba(251,191,36,0.06)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* "Touch" label faint */}
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <span
            className="text-[8px] tracking-[0.35em] uppercase px-2 py-0.5 rounded-full"
            style={{
              color: "#fcd34d",
              background: "rgba(30,15,2,0.6)",
              border: "1px solid rgba(251,191,36,0.3)",
              backdropFilter: "blur(4px)",
              fontFamily: "'Cinzel', serif",
            }}
          >
            ✦ Hecate ✦
          </span>
        </motion.div>
      </motion.button>

      {/* ── Bottom road zone (enter/return prompt) ── */}
      <motion.div
        className="absolute flex items-center justify-center"
        style={{
          left: pct(z.bottomPath.xPct),
          top: pct(z.bottomPath.yPct),
          width: pct(z.bottomPath.wPct),
          height: pct(z.bottomPath.hPct),
          pointerEvents: "none",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
      >
        <motion.p
          className="text-[9px] tracking-[0.4em] uppercase text-center"
          style={{ color: "rgba(251,191,36,0.45)", fontFamily: "'Cinzel', serif" }}
          animate={{ opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          choose your path
        </motion.p>
      </motion.div>

      {/* ── Floating mist particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${30 + i * 15}px`,
              height: `${12 + i * 6}px`,
              background: "rgba(200,190,240,0.06)",
              left: `${10 + i * 18}%`,
              top: `${55 + (i % 3) * 8}%`,
              filter: "blur(6px)",
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.6, 0.3],
              x: [0, (i % 2 === 0 ? 8 : -8), 0],
            }}
            transition={{
              duration: 4 + i * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* ── Path Modal ── */}
      <PathModal pathId={activeModal} onClose={closeModal} onNavigate={navigate} />

      {/* ── Coven Modal ── */}
      <CovenModal open={covenOpen} onClose={() => setCovenOpen(false)} onNavigate={navigate} />
    </div>
  );
}
