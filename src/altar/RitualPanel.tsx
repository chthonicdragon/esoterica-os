import { useState, useCallback } from 'react'
import { Flame, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react'
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

// --- Circular progress component ---
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

// --- Main panel ---
export function RitualPanel({ lang, session, onStart, onComplete, onInterrupt }: RitualPanelProps) {
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [selectedMode, setSelectedMode] = useState<'soft' | 'strict'>('soft')
  const [customDuration, setCustomDuration] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const { playUiSound } = useAudio()

  const elapsed = session.elapsed
  const totalSeconds = session.durationMinutes * 60
  const remaining = Math.max(0, totalSeconds - elapsed)
  const progress = elapsed / totalSeconds

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
    rulesTitle: lang === 'ru' ? 'Правила ритуала' : 'Ritual Rules',
    rulesBtn: lang === 'ru' ? 'О ритуале и правилах' : 'About ritual rules',
    rulesIntro: lang === 'ru'
      ? 'Цифровой алтарь - это символическая копия вашего реального пространства практики. Ритуал начинается здесь, но выполняется в реальной жизни.'
      : 'The digital altar is a symbolic copy of your real practice space. The ritual starts here, but is performed in real life.',
    rulesGoal: lang === 'ru'
      ? 'После нажатия "Начать ритуал" рекомендуется отложить телефон и практиковать офлайн. Это сделано, чтобы поддерживать реальную дисциплину, а не экранный таймер.'
      : 'After pressing "Begin Ritual", it is recommended to put your phone away and practice offline. The system is designed to reward real discipline, not screen time.',
    rulesSoft: lang === 'ru'
      ? 'Soft режим: поддерживающий формат. Вы можете вернуться к экрану без жёсткого сброса.'
      : 'Soft mode: a supportive format. You can return to the screen without a hard reset.',
    rulesStrict: lang === 'ru'
      ? 'Strict режим: формат аскезы. При выходе из приложения/вкладки ритуал прерывается и прогресс сессии сбрасывается.'
      : 'Strict mode: an ascetic format. Leaving the app/tab interrupts the ritual and resets session progress.',
    rulesPoints: lang === 'ru'
      ? 'Очки начисляются за все разделы, но основной вклад в прокачку даёт завершённый ритуал (особенно в strict/hard режиме).'
      : 'Points are granted across all sections, but completed rituals provide the main progression boost (especially in strict/hard mode).',
    confirmQ: lang === 'ru' ? 'Вы полностью готовы к этой практике?' : 'Are you fully committed to this practice session?',
    yes: lang === 'ru' ? 'Да, я готов' : 'Yes, I am ready',
    no: lang === 'ru' ? 'Нет, позже' : 'Not yet',
    completed: lang === 'ru' ? 'Сессия завершена ✓' : 'Session Completed ✓',
    interrupted: lang === 'ru' ? 'Сессия прервана' : 'Session Interrupted',
    remaining: lang === 'ru' ? 'осталось' : 'remaining',
    minutes: lang === 'ru' ? 'мин' : 'min',
    custom: lang === 'ru' ? 'Своё' : 'Custom',
  }

  // --- Show session completion ---
  if (session.completed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        <CheckCircle2 className="w-10 h-10 text-green-400" />
        <p className="text-sm font-medium text-green-400">{t.completed}</p>
        <p className="text-xs text-muted-foreground">{session.durationMinutes} {t.minutes}</p>
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

  // --- Pre-ritual confirmation ---
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

  if (showRules) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-foreground">{t.rulesTitle}</p>
        </div>
        <p className="text-xs text-foreground/90 leading-relaxed">{t.rulesIntro}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{t.rulesGoal}</p>
        <div className="rounded-xl border border-border/40 bg-card/50 p-2.5 space-y-1.5">
          <p className="text-[11px] text-foreground">• {t.rulesSoft}</p>
          <p className="text-[11px] text-foreground">• {t.rulesStrict}</p>
          <p className="text-[11px] text-muted-foreground">• {t.rulesPoints}</p>
        </div>
        <button
          onClick={() => { setShowRules(false); playUiSound('click') }}
          className="mt-1 py-2 rounded-xl bg-primary/10 border border-primary/25 text-primary text-sm hover:bg-primary/20 transition-colors"
        >
          {lang === 'ru' ? 'Понятно' : 'Got it'}
        </button>
      </div>
    )
  }

  // --- Active ritual state ---
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

  // --- Setup / selection state ---
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => { setShowRules(true); playUiSound('click') }}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/40 text-muted-foreground text-xs hover:text-foreground hover:border-primary/30 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        {t.rulesBtn}
      </button>

      {/* Duration selection */}
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

      {/* Mode selection */}
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
              <span className="text-[9px] leading-tight opacity-70">{mode === 'soft' ? t.softDesc : t.strictDesc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Begin ritual button */}
      <button
        onClick={() => { handleStart(); playUiSound('click') }}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-700 text-white text-sm font-medium hover:opacity-90 transition-all hover:shadow-[0_0_20px_hsl(267_80%_60%/0.4)]"
      >
        <Flame className="w-4 h-4" />
        {t.beginRitual}
      </button>
    </div>
  )
}