import { useMemo, useState } from 'react'
import { CATALOG, CATEGORY_LABELS } from './catalog'
import type { ObjectCategory } from './types'
import { cn } from '../lib/utils'
import { useAudio } from '../contexts/AudioContext'

interface ObjectPanelProps {
  lang: 'en' | 'ru'
  unlockedLevel: number
  pendingDrop: string | null
  onSelectForDrop: (catalogId: string) => void
}

export function ObjectPanel({ lang, unlockedLevel, pendingDrop, onSelectForDrop }: ObjectPanelProps) {
  const [activeCategory, setActiveCategory] = useState<ObjectCategory>('candles')
  const { playUiSound } = useAudio()

  const categories = Object.keys(CATEGORY_LABELS) as ObjectCategory[]

  const items = useMemo(() => {
    const filtered = CATALOG.filter(c => c.category === activeCategory)
    if (activeCategory !== 'models') {
      return [...filtered].sort((a, b) => {
        const byLevel = a.unlockLevel - b.unlockLevel
        if (byLevel !== 0) return byLevel
        return a.label.localeCompare(b.label)
      })
    }

    const candlePriority = (id: string, label: string) => {
      const key = `${id} ${label}`.toLowerCase()
      // In 3D Models tab: show candle-related 3D assets before statues/other props.
      return /(candle|candles|holder|bowl)/.test(key) ? 0 : 1
    }

    return [...filtered].sort((a, b) => {
      const byCandle = candlePriority(a.id, a.label) - candlePriority(b.id, b.label)
      if (byCandle !== 0) return byCandle

      const byLevel = a.unlockLevel - b.unlockLevel
      if (byLevel !== 0) return byLevel

      return a.label.localeCompare(b.label)
    })
  }, [activeCategory])

  const sectionLabel = {
    symbolic: lang === 'ru' ? 'Символические (базовые формы)' : 'Symbolic (Basic Shapes)',
    detailed: lang === 'ru' ? 'Детализированные 3D' : 'Detailed 3D',
    modelCandles: lang === 'ru' ? 'Свечи и свет' : 'Candles & Light',
    modelTools: lang === 'ru' ? 'Ритуальные инструменты' : 'Ritual Tools',
    modelMythic: lang === 'ru' ? 'Мифологические статуи' : 'Mythic Statues',
    modelDecor: lang === 'ru' ? 'Декор и прочее' : 'Decor & Other',
  }

  const sections = useMemo(() => {
    if (activeCategory === 'models') {
      const sectionForModel = (id: string, label: string) => {
        const key = `${id} ${label}`.toLowerCase()
        if (/(candle|candles|holder|bowl)/.test(key)) return 'modelCandles'
        if (/(knife|book|ball|table|cloth|incense|cauldron)/.test(key)) return 'modelTools'
        if (/(zeus|veles|perun|mercur|arachne|falcon|persephone|statuette|artemis|venus|hecate)/.test(key)) return 'modelMythic'
        return 'modelDecor'
      }

      const grouped: Record<string, typeof items> = {
        modelCandles: [],
        modelTools: [],
        modelMythic: [],
        modelDecor: [],
      }

      items.forEach(item => {
        grouped[sectionForModel(item.id, item.label)].push(item)
      })

      return (Object.keys(grouped) as Array<keyof typeof grouped>)
        .filter(key => grouped[key].length > 0)
        .map(key => ({ key, title: sectionLabel[key], items: grouped[key] }))
    }

    const symbolic = items.filter(item => item.geometry !== 'custom')
    const detailed = items.filter(item => item.geometry === 'custom')
    const result = [] as Array<{ key: string; title: string; items: typeof items }>
    if (symbolic.length > 0) result.push({ key: 'symbolic', title: sectionLabel.symbolic, items: symbolic })
    if (detailed.length > 0) result.push({ key: 'detailed', title: sectionLabel.detailed, items: detailed })
    return result
  }, [activeCategory, items, lang])

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); playUiSound('click') }}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all',
              activeCategory === cat
                ? 'bg-primary/20 border border-primary/40 text-primary'
                : 'bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <span>{CATEGORY_LABELS[cat].emoji}</span>
            <span className="hidden sm:inline">{lang === 'ru' ? CATEGORY_LABELS[cat].ru : CATEGORY_LABELS[cat].en}</span>
          </button>
        ))}
      </div>

      {/* Help text */}
      <p className="text-[10px] text-muted-foreground mb-2">
        {pendingDrop
          ? (lang === 'ru' ? '↑ Нажмите на алтарь для размещения' : '↑ Click on the altar to place')
          : (lang === 'ru' ? 'Нажмите на объект, затем на алтарь' : 'Click object, then click altar')}
      </p>

      {/* Items grid */}
      <div className="overflow-y-auto flex-1 pr-1 space-y-2">
        {sections.map(section => (
          <div key={section.key} className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 px-0.5">{section.title}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {section.items.map(item => {
          const locked = item.unlockLevel > unlockedLevel
          const isSelected = pendingDrop === item.id

          return (
            <button
              key={item.id}
              disabled={locked}
              onClick={() => {
                if (!locked) {
                  onSelectForDrop(item.id)
                  playUiSound('click')
                } else {
                  playUiSound('error')
                }
              }}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-left relative',
                locked
                  ? 'opacity-40 cursor-not-allowed border-border/20 bg-card/40'
                  : isSelected
                    ? 'border-[hsl(var(--neon))/60] bg-[hsl(var(--neon))/0.08] shadow-[0_0_12px_hsl(var(--neon)/0.3)]'
                    : 'border-border/40 bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
              )}
            >
              {/* Color swatch */}
              <div
                className="w-7 h-7 rounded-lg shadow-inner"
                style={{
                  background: `radial-gradient(circle, ${item.emissive}44, ${item.color})`,
                  boxShadow: isSelected ? `0 0 10px ${item.emissive}88` : undefined,
                }}
              />
              <span className="text-[10px] text-center leading-tight text-muted-foreground">
                {lang === 'ru' ? item.labelRu : item.label}
              </span>
              {locked && (
                <div className="absolute top-1 right-1 text-[8px] text-muted-foreground/60 bg-background/80 rounded px-0.5">
                  Lv{item.unlockLevel}
                </div>
              )}
              {isSelected && (
                <div className="absolute inset-0 rounded-xl border-2 border-[hsl(var(--neon))] pointer-events-none animate-pulse" />
              )}
            </button>
          )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
