import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  icon: string;
  accentColor: string;
  children?: React.ReactNode;
}

export function PageShell({ title, subtitle, icon, accentColor, children }: PageShellProps) {
  const [, setLocation] = useLocation();

  return (
    <motion.div
      className="min-h-screen bg-background text-foreground flex flex-col"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-30%", opacity: 0 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div
        className="relative flex items-center px-4 pt-12 pb-6"
        style={{
          background: `linear-gradient(180deg, ${accentColor}22 0%, transparent 100%)`,
          borderBottom: `1px solid ${accentColor}33`,
        }}
      >
        <button
          data-testid="btn-back"
          onClick={() => setLocation("/")}
          className="mr-4 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
        >
          <ArrowLeft size={18} style={{ color: accentColor }} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h1
              className="text-xl font-bold tracking-widest"
              style={{ fontFamily: "'Cinzel', serif", color: accentColor }}
            >
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 ml-8 tracking-wider">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {children ?? (
          <div className="text-center max-w-xs">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
              style={{ background: `${accentColor}18`, border: `2px solid ${accentColor}44` }}
            >
              {icon}
            </div>
            <p
              className="text-2xl font-bold mb-2 tracking-wide"
              style={{ fontFamily: "'Cinzel', serif", color: accentColor }}
            >
              {title}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This sacred space is being prepared. Return when the stars align.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl opacity-30"
                  style={{
                    background: `${accentColor}22`,
                    border: `1px solid ${accentColor}33`,
                    animation: `shimmer-glow ${2 + i * 0.4}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
