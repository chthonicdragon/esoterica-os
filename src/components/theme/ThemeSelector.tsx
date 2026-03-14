// src/components/theme/ThemeSelector.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette, Sparkles, Lock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { BUILTIN_THEMES, type ThemeDefinition } from '../../lib/themeRegistry';
import { useLang } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface ThemeSelectorProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeSelector({ open, onClose }: ThemeSelectorProps) {
  const { theme: activeTheme, setTheme } = useTheme();
  const { lang } = useLang();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-10 z-[101] bg-card border border-border/50 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/30 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20 text-primary">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-cinzel tracking-wider">
                    {lang === 'ru' ? 'Библиотека тем' : 'Theme Registry'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'ru' ? 'Выберите визуальную атмосферу для вашей ОС' : 'Choose your visual atmosphere'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BUILTIN_THEMES.map((t) => (
                  <ThemeCard
                    key={t.id}
                    theme={t}
                    isActive={activeTheme.id === t.id}
                    lang={lang as 'ru' | 'en'}
                    onSelect={() => {
                      setTheme(t);
                      // Don't close immediately so user can see selection
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border/30 bg-white/5 flex justify-end">
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all font-cinzel tracking-widest"
              >
                {lang === 'ru' ? 'ГОТОВО' : 'DONE'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ThemeCard({
  theme,
  isActive,
  lang,
  onSelect,
}: {
  theme: ThemeDefinition;
  isActive: boolean;
  lang: 'ru' | 'en';
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative group flex flex-col text-left rounded-2xl border transition-all duration-300 overflow-hidden',
        isActive
          ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)]'
          : 'border-border/40 bg-background/40 hover:border-primary/40 hover:bg-white/5'
      )}
    >
      {/* Preview area */}
      <div 
        className="h-24 w-full relative overflow-hidden"
        style={{ background: `hsl(${theme.colors.background})` }}
      >
        <div 
          className="absolute inset-0 opacity-30"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, hsl(${theme.colors.primary}) 0%, transparent 70%)` 
          }}
        />
        {/* Mock background animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl opacity-20 group-hover:scale-110 transition-transform duration-500">
            {theme.backgroundType === 'geometric' && '✦'}
            {theme.backgroundType === 'particles' && '✨'}
            {theme.backgroundType === 'nebula' && '☁️'}
            {theme.backgroundType === 'matrix' && '⊕'}
            {theme.backgroundType === 'waves' && '🌊'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold font-cinzel text-sm tracking-wide">
            {theme.name[lang]}
          </h3>
          {isActive && (
            <div className="bg-primary rounded-full p-1">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight mb-3 line-clamp-2">
          {theme.description[lang]}
        </p>

        {/* Color Strip */}
        <div className="mt-auto flex gap-1">
          {[theme.colors.primary, theme.colors.accent, theme.colors.neon].map((c, i) => (
            <div
              key={i}
              className="w-4 h-1.5 rounded-full"
              style={{ background: `hsl(${c})` }}
            />
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex gap-1">
        <div className="px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 text-[8px] uppercase tracking-tighter text-white/70">
          {theme.backgroundType}
        </div>
      </div>
    </button>
  );
}
