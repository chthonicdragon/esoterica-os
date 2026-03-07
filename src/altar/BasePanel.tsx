import { ALTAR_BASES } from './catalog'
import { LEVEL_THRESHOLDS } from './types'
import type { AltarBaseId } from './types'
import { cn } from '../lib/utils'
import { useAudio } from '../contexts/AudioContext'

interface BasePanelProps {
  lang: 'en' | 'ru'
  unlockedLevel: number
  points: number
  selectedBaseId: AltarBaseId
  onSelectBase: (baseId: AltarBaseId) => void
}

export function BasePanel({ lang, unlockedLevel, points, selectedBaseId, onSelectBase }: BasePanelProps) {
  const { playUiSound } = useAudio()

  const title = lang === 'ru' ? 'Базы алтаря' : 'Altar Bases'
  const subtitle = lang === 'ru'
    ? 'Базовые алтари открываются с уровнем и XP.'
    : 'Base altars unlock with level and XP progression.'

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/90">{title}</h3>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1">
        {ALTAR_BASES.map((base) => {
          const locked = base.unlockLevel > unlockedLevel
          const isSelected = selectedBaseId === base.id
          const requiredXp = LEVEL_THRESHOLDS[base.unlockLevel - 1] ?? 0

          return (
            <button
              key={base.id}
              disabled={locked}
              onClick={() => {
                if (locked) {
                  playUiSound('error')
                  return
                }
                onSelectBase(base.id)
                playUiSound('success')
              }}
              className={cn(
                'relative rounded-xl border px-3 py-2 text-left transition-colors',
                locked
                  ? 'opacity-45 cursor-not-allowed border-border/20 bg-card/40'
                  : isSelected
                    ? 'border-primary/60 bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                    : 'border-border/40 bg-card hover:border-primary/35 hover:bg-primary/5'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg border border-white/10"
                  style={{
                    background: `linear-gradient(145deg, ${base.tint}, #171923)`,
                  }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {lang === 'ru' ? base.labelRu : base.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{base.preview}</p>
                </div>
              </div>

              <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Lv {base.unlockLevel}</span>
                {locked ? (
                  <span>
                    {lang === 'ru' ? 'Нужно XP:' : 'Need XP:'} {requiredXp.toLocaleString()}
                  </span>
                ) : (
                  <span>
                    {lang === 'ru' ? 'Текущий XP:' : 'Current XP:'} {points.toLocaleString()}
                  </span>
                )}
              </div>

              {locked && (
                <div className="absolute top-2 right-2 text-[9px] rounded bg-background/90 px-1 py-0.5 text-muted-foreground">
                  LOCK
                </div>
              )}
              {isSelected && (
                <div className="absolute inset-0 rounded-xl border border-primary/60 pointer-events-none" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
