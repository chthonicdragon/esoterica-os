import { PageShell } from "./PageShell";
import { motion } from "framer-motion";

export default function Coven() {
  return (
    <PageShell
      title="Coven Central"
      subtitle="Coming soon — the sacred gathering place"
      icon="🔥"
      accentColor="#f59e0b"
    >
      <div className="text-center max-w-xs">
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl"
          style={{ background: "rgba(245,158,11,0.12)", border: "2px solid rgba(245,158,11,0.4)" }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🔥
        </motion.div>
        <h2
          className="text-2xl font-bold mb-3 tracking-widest"
          style={{ fontFamily: "'Cinzel', serif", color: "#f59e0b" }}
        >
          Coven Central
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          The goddess Hecate guards this threshold. Soon, this space will unite covens across the veil — virtual circles, shared grimoires, and sacred collaboration await.
        </p>
        <div className="space-y-2">
          {[
            "Virtual ritual circles",
            "Shared coven grimoire",
            "Moon circle planning",
            "Elder & High Priestess tiers",
            "Coven membership portals",
          ].map((feature, i) => (
            <motion.div
              key={feature}
              className="flex items-center gap-3 p-3 rounded-xl text-sm"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.4 }}
            >
              <span className="text-amber-400">✦</span>
              <span className="text-muted-foreground tracking-wide">{feature}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
