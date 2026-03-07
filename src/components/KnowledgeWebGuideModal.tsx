import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, X } from 'lucide-react'

type Lang = 'en' | 'ru'

interface KnowledgeWebGuideModalProps {
  open: boolean
  lang: Lang
  onClose: () => void
}

const CONTENT = {
  en: {
    title: 'How Knowledge Web Works',
    intro:
      'Knowledge Web turns your notes into a living map of entities and connections. It helps you track patterns across rituals, symbols, and practices.',
    steps: [
      '1. Enter text in the input area: deity, ritual, symbol, dream fragment, or place of power.',
      '2. Click Weave. AI extracts entities (nodes) and relationships (links) and merges them into your existing web.',
      '3. Use filters by type to focus on spirits, rituals, symbols, concepts, and more.',
      '4. Open Analytics to inspect central nodes and structural balance of your web.',
      '5. Use Reorg to merge near-duplicates and rebuild cleaner relations.',
      '6. Export to JSON/CSV/PNG for backup, analysis, or sharing.',
    ],
    tipsTitle: 'Practical Tips',
    tips: [
      'Write short, specific entries first. Then add deeper context in the next weave.',
      'Use ritual mode when entering ceremony steps to preserve ritual-centered links.',
      'If graph quality degrades, run Reorg and hide weak flows to regain clarity.',
      'Reset Web removes all saved graph data from this browser for this account session.',
    ],
    close: 'Close',
  },
  ru: {
    title: 'Как работает Паутина знаний',
    intro:
      'Паутина знаний превращает ваши записи в живую карту сущностей и связей. Это помогает видеть повторяющиеся паттерны в ритуалах, символах и практике.',
    steps: [
      '1. Введите текст: божество, ритуал, символ, фрагмент сна или место силы.',
      '2. Нажмите Плести. ИИ извлечет сущности (узлы) и отношения (связи) и объединит их с текущей паутиной.',
      '3. Используйте фильтры по типам, чтобы сфокусироваться на духах, ритуалах, символах и концептах.',
      '4. Откройте Аналитику, чтобы увидеть центральные узлы и структуру паутины.',
      '5. Используйте Реорг., чтобы объединить дубликаты и очистить связи.',
      '6. Экспортируйте JSON/CSV/PNG для резервной копии, анализа или обмена.',
    ],
    tipsTitle: 'Практические советы',
    tips: [
      'Сначала пишите коротко и конкретно. Затем добавляйте контекст следующими итерациями.',
      'Включайте режим ритуала, когда описываете этапы практики, чтобы сохранить ритуальный контур связей.',
      'Если граф стал шумным, запустите Реорг. и включите Скрыть слабые потоки.',
      'Сброс паутины удаляет все сохраненные данные графа в этом браузере.',
    ],
    close: 'Закрыть',
  },
} as const

export default function KnowledgeWebGuideModal({ open, lang, onClose }: KnowledgeWebGuideModalProps) {
  const text = CONTENT[lang]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="fixed left-1/2 top-1/2 z-[60] w-[92%] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[hsl(var(--sidebar))]/95 p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{text.title}</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-sm text-foreground/90">{text.intro}</p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary/80">Workflow</p>
                <ul className="space-y-2 text-sm text-foreground/90">
                  {text.steps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary/80">{text.tipsTitle}</p>
                <ul className="space-y-2 text-sm text-foreground/90">
                  {text.tips.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-xl border border-primary/40 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                {text.close}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
