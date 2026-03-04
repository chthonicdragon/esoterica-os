import React from 'react'
import { useLang } from '../../contexts/LanguageContext'
import { useAudio } from '../../contexts/AudioContext'
import { getMoonPhase, moonEmoji } from '../../utils/moonPhase'
import { Volume2, VolumeX, Menu } from 'lucide-react'

interface HeaderProps {
  title: string
  userName?: string
  onMenuClick?: () => void
}

export function Header({ title, userName, onMenuClick }: HeaderProps) {
  const { t } = useLang()
  const { isMuted, setIsMuted, playUiSound } = useAudio()
  const moonPhase = getMoonPhase()
  const moonPhaseLabel = t.moonPhases[moonPhase]

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newMuted = !isMuted
    setIsMuted(newMuted)
    if (!newMuted) {
      playUiSound('click')
    }
  }

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border/40 bg-background/80 backdrop-blur-sm z-20">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg bg-secondary border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-sm sm:text-lg font-semibold text-foreground font-cinzel tracking-wide truncate max-w-[120px] sm:max-w-none">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Audio Toggle */}
        <button
          onClick={toggleMute}
          className="p-2 rounded-lg bg-secondary border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Moon Phase Widget */}
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] sm:text-xs">
          <span className="text-sm sm:text-base">{moonEmoji[moonPhase]}</span>
          <span className="text-primary font-medium hidden xs:inline">{moonPhaseLabel}</span>
        </div>

        {/* User */}
        {userName && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--neon))] flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_hsl(var(--primary)/0.3)]">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
