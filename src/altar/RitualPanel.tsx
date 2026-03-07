import { useState, useEffect, useRef, useCallback } from 'react'
import { Flame, Timer, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAudio } from '../contexts/AudioContext'
import type { RitualSession } from './types'

const DURATION_OPTIONS = [15, 30, 60, 90]

interface RitualPanelProps {
  lang: 'en' | 'ru'
  session: RitualSession
  onStart: (durationMinutes: number, mode: 'soft' | 'strict') => void
  onComplete: () => void
  onInterrupt: () => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Circular progress SVG
function CircularProgress({ progress, size = 120, stroke = 6, color = '#a855f7' }: {
  progress: number; size?: number; stroke?: number; color?: string
}) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)))

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(258 40% 10%)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease', filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  )
}

export function RitualPanel({ lang, session, onStart, onComplete, onInterrupt }: RitualPanelProps) {
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [selectedMode, setSelectedMode] = useState<'soft' | 'strict'>('soft')
  const [customDuration, setCustomDuration] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const { playUiSound } = useAudio()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const elapsed = session.elapsed
  const totalSeconds = session.durationMinutes * 60
  const remaining = Math.max(0, totalSeconds - elapsed)
  const progress = elapsed / totalSeconds

  // Auto-complete when timer hits zero
  useEffect(() => {
    if (session.active && remaining <= 0) {
      onComplete()
    }
  }, [remaining, session.active, onComplete])

  const handleStart = useCallback(() => {
    playUiSound('click')
    setShowConfirm(true)
  }, [playUiSound])

  const confirmStart = useCallback(() => {
    const dur = customDuration ? parseInt(customDuration) : selectedDuration
    setShowConfirm(false)
    onStart(isNaN(dur) || dur < 1 ? 30 : dur, selectedMode)
  }, [customDuration, selectedDuration, selectedMode, onStart])

  const t = {
    beginRitual: lang === 'ru' ? 'Начать ритуал' : 'Begin Ritual',
    endRitual: lang === 'ru' ? 'Завершить' : 'End Ritual',
    interrupt: lang === 'ru' ? 'Прервать' : 'Interrupt',
    duration: lang === 'ru' ? 'Продолжительность' : 'Duration',
    focusMode: lang === 'ru' ? 'Режим фокуса' : 'Focus Mode',
    soft: lang === 'ru' ? 'Мягкий' : 'Soft',
    strict: lang === 'ru' ? 'Строгий' : 'Strict',
    softDesc: lang === 'ru' ? 'Пауза при выходе, прогресс сохраняется' : 'Pause on exit, progress saved',
    strictDesc: lang === 'ru' ? 'Выход отменяет сессию, очки не начисляются' : 'Exit cancels session, no points awarded',
    confirmQ: lang === 'ru' ? 'Вы полностью готовы к этой практике?' : 'Are you fully committed to this practice session?',
    yes: lang === 'ru' ? 'Да, я готов' : 'Yes, I am ready',
    no: lang === 'ru' ? 'Нет, позже' : 'Not yet',
    completed: lang === 'ru' ? 'Сессия завершена ✓' : 'Session Completed ✓',
    interrupted: lang === 'ru' ? 'Сессия прервана' : 'Session Interrupted',
    remaining: lang === 'ru' ? 'осталось' : 'remaining',
    minutes: lang === 'ru' ? 'мин' : 'min',
    custom: lang === 'ru' ? 'Своё' : 'Custom',
  }

  // Show completion / interruption state
  if (session.completed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        <CheckCircle2 className="w-10 h-10 text-green-400" />
        <p className="text-sm font-medium text-green-400">{t.completed}</p>
        <p className="text-xs text-muted-foreground">
          {session.durationMinutes} {t.minutes}
        </p>
      </div>
    )
  }

  if (session.interrupted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        <XCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm font-medium text-destructive">{t.interrupted}</p>
      </div>
    )
  }

  // Pre-ritual confirmation
  if (showConfirm) {
    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <AlertTriangle className="w-8 h-8 text-[hsl(var(--neon))]" />
        <p className="text-sm text-center text-foreground/90 leading-snug">{t.confirmQ}</p>
        <div className="flex gap-2 w-full">
          <button
            onClick={() => { confirmStart(); playUiSound('click') }}
            className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t.yes}
          </button>
          <button
            onClick={() => { setShowConfirm(false); playUiSound('click') }}
            className="flex-1 py-2 rounded-xl bg-card border border-border/40 text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            {t.no}
          </button>
        </div>
      </div>
    )
  }

  // Active ritual state
  if (session.active) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <CircularProgress progress={progress} size={100} stroke={5} color={session.mode === 'strict' ? '#ef4444' : '#a855f7'} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-mono font-bold text-foreground">{formatTime(remaining)}</span>
            <span className="text-[10px] text-muted-foreground">{t.remaining}</span>
          </div>
        </div>

        <div className={cn(
          'text-[10px] px-2 py-0.5 rounded-full border',
          session.mode === 'strict'
            ? 'text-red-400 border-red-500/30 bg-red-500/10'
            : 'text-primary border-primary/30 bg-primary/10'
        )}>
          {session.mode === 'strict' ? '⚡ Strict' : '✦ Soft'} Mode
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={() => { onComplete(); playUiSound('success') }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-xs hover:bg-green-500/25 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.endRitual}
          </button>
          {session.mode === 'soft' && (
            <button
              onClick={() => { onInterrupt(); playUiSound('click') }}
              className="px-3 py-2 rounded-xl bg-card border border-border/40 text-muted-foreground text-xs hover:text-foreground transition-colors"
            >
              {t.interrupt}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Setup state
  return (
    <div className="flex flex-col gap-3">
      {/* Duration */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">{t.duration}</p>
        <div className="grid grid-cols-4 gap-1">
          {DURATION_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => { setSelectedDuration(d); setCustomDuration(''); playUiSound('click') }}
              className={cn(
                'py-1.5 rounded-lg text-xs border transition-all',
                selectedDuration === d && !customDuration
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-card border-border/40 text-muted-foreground hover:text-foreground'
              )}
            >
              {d}m
            </button>
          ))}
        </div>
        <input
          type="number"
          min="1"
          max="240"
          placeholder={`${t.custom}...`}
          value={customDuration}
          onChange={e => { setCustomDuration(e.target.value); playUiSound('click') }}
          className="mt-1.5 w-full bg-card border border-border/40 rounded-lg px-2 py-1 text-xs text-foreground outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Mode */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">{t.focusMode}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(['soft', 'strict'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => { setSelectedMode(mode); playUiSound('click') }}
              className={cn(
                'flex flex-col gap-0.5 p-2 rounded-xl border text-left transition-all',
                selectedMode === mode
                  ? mode === 'strict'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border/40 text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-xs font-medium">{mode === 'soft' ? t.soft : t.strict}</span>
              <span className="text-[9px] leading-tight opacity-70">
                {mode === 'soft' ? t.softDesc : t.strictDesc}
              </span>
            </button>
          ))}
        </div>
        {/* Explanation of rules */}
        <p className="mt-1 text-[9px] text-muted-foreground leading-snug">
          {lang === 'ru' 
            ? 'Мягкий: можно прервать сессию и продолжить позже. Строгий: выход отменяет сессию, очки не начисляются.' 
            : 'Soft: you can pause and resume later. Strict: exiting cancels session, no points awarded.'}
        </p>
      </div>

      {/* Begin button */}
      <button
        onClick={() => { handleStart(); playUiSound('click') }}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-700 text-white text-sm font-medium hover:opacity-90 transition-all hover:shadow-[0_0_20px_hsl(267_80%_60%/0.4)]"
      >
        <Flame className="w-4 h-4" />
        {t.beginRitual}
      </button>

      {/* Create Altar button */}
      <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm hover:bg-primary/20 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-4 h-4" aria-hidden="true">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
        Создать алтарь
      </button>
    </div>
  )
}
