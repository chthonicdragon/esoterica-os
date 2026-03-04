import React from 'react'
import { useLang } from '../../contexts/LanguageContext'
import { getMoonPhase, moonEmoji } from '../../utils/moonPhase'

interface HeaderProps {
  title: string
  userName?: string
}

export function Header({ title, userName }: HeaderProps) {
  const { t } = useLang()
  const moonPhase = getMoonPhase()
  const moonPhaseLabel = t.moonPhases[moonPhase]

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <h1 className="text-lg font-semibold text-foreground font-cinzel tracking-wide">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Moon Phase Widget */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs">
          <span className="text-base">{moonEmoji[moonPhase]}</span>
          <span className="text-primary font-medium">{moonPhaseLabel}</span>
        </div>

        {/* User */}
        {userName && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--neon))] flex items-center justify-center text-xs font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
