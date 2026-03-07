import { createPortal } from 'react-dom'
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
    title: 'Great Knowledge Web',
    subtitle: 'A living map of your ritual ecosystem',
    overview: [
      'Knowledge Web is an interactive map of entities, rituals, and relationships in your practice. It turns notes and descriptions into a living network where every point is a node: deity, spirit, symbol, ritual, place of power, concept, or personal experience.',
      'Connections between nodes reveal influence and energetic flows. This helps you spot repeating patterns, hidden symbolic links, and the central forces of your magical system.',
      'The Web does not just store information. It visualizes structure so you can reflect, navigate, and plan your next practical steps.',
    ],
    workflowTitle: 'How The Web Works',
    steps: [
      'Enter text: deity name, ritual notes, symbol, dream fragment, observation, or place of power.',
      'Click Weave. AI extracts entities (nodes) and relationships (links), then integrates them into your current web.',
      'Use type filters to focus on specific layers: spirits, rituals, symbols, concepts, and more.',
      'Open Analytics to inspect central nodes, strongest links, and overall structure.',
      'Use Reorg. to merge duplicates, clean noisy links, and reorganize graph coherence.',
      'Export JSON/CSV/PNG for backup, deeper analysis, or sharing.',
    ],
    ritualsTitle: 'Rituals In The Web',
    ritualsBody:
      'You can create and preserve rituals as dedicated nodes. Mark an entry as ritual, and the system links it with mentioned entities: deities, spirits, symbols, objects, altars, and places of power. This exposes recurring forces and relation chains across practices.',
    ritualsLinks: ['Deities', 'Spirits', 'Symbols', 'Objects', 'Altars', 'Places of power'],
    tipsTitle: 'Practical Tips',
    tips: [
      'Start short and specific. Add context in later iterations.',
      'Enable ritual mode when describing ceremonial steps to preserve ritual contours.',
      'If the graph becomes noisy, run Reorg. and hide weak flows to focus on key links.',
      'Reset Web removes saved graph data in this browser.',
    ],
    close: 'Close',
  },
  ru: {
    title: 'Великая Паутина знаний',
    subtitle: 'Живая карта вашей магической практики',
    overview: [
      'Паутина знаний — это интерактивная карта сущностей, ритуалов и связей внутри вашей практики. Она превращает записи, заметки и описания в живую сеть, где каждая точка — это узел: божество, дух, символ, ритуал, место силы, концепт или личное переживание.',
      'Линии между узлами показывают связи, влияние и энергетические потоки между элементами вашей практики. Благодаря этому можно увидеть повторяющиеся паттерны, скрытые связи между символами и духами, а также понять, какие ритуалы или силы находятся в центре вашей магической системы.',
      'Паутина не просто хранит информацию — она визуализирует ее, помогая осознавать структуру знаний и планировать дальнейшую практику.',
    ],
    workflowTitle: 'Как работает Паутина',
    steps: [
      'Введите текст: это может быть имя божества, описание ритуала, символ, фрагмент сна, наблюдение или место силы.',
      'Нажмите Плести. ИИ анализирует текст, извлекает сущности (узлы) и отношения между ними (связи), после чего вплетает их в текущую паутину.',
      'Используйте фильтры типов, чтобы сосредоточиться на определенных элементах — духах, ритуалах, символах или концептах.',
      'Откройте Аналитику, чтобы увидеть центральные узлы, наиболее сильные связи и общую структуру паутины.',
      'Используйте Реорг., чтобы объединить дубликаты, очистить связи и упорядочить граф.',
      'При необходимости экспортируйте паутину в JSON, CSV или PNG для резервного копирования, анализа или обмена.',
    ],
    ritualsTitle: 'Ритуалы в паутине',
    ritualsBody:
      'В системе можно создавать и сохранять ритуалы как отдельные узлы. Вы можете написать текст ритуала, отметить запись как ритуал, и он автоматически появится в паутине. После этого система свяжет его со всеми упомянутыми элементами. Так ритуал становится частью сети и отображается вместе со всеми зависимыми связями.',
    ritualsLinks: ['Божества', 'Духи', 'Символы', 'Предметы', 'Алтари', 'Места силы'],
    tipsTitle: 'Практические советы',
    tips: [
      'Пишите сначала коротко и конкретно. Затем добавляйте контекст следующими итерациями.',
      'Включайте режим ритуала, когда описываете этапы практики, чтобы сохранить ритуальный контур связей.',
      'Если граф стал слишком сложным или шумным, используйте Реорг. и включите функцию Скрыть слабые потоки, чтобы сфокусироваться на главных связях.',
      'Имейте в виду, что сброс паутины удаляет все сохраненные данные графа в этом браузере.',
    ],
    close: 'Закрыть',
  },
} as const

export default function KnowledgeWebGuideModal({ open, lang, onClose }: KnowledgeWebGuideModalProps) {
  const text = CONTENT[lang]

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="fixed inset-0 z-[90] flex h-[100dvh] w-screen flex-col overflow-hidden rounded-none border-0 bg-[hsl(var(--sidebar))]/98 shadow-2xl sm:inset-auto sm:left-[48%] sm:top-[46%] sm:h-[90dvh] sm:max-h-[900px] sm:w-[95vw] sm:max-w-[920px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-white/15"
          >
            <div className="sticky top-0 z-10 border-b border-white/10 bg-[hsl(var(--sidebar))]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                    <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">{text.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground sm:text-sm">{text.subtitle}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <section className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary/80">Overview</p>
                <div className="space-y-3 text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
                  {text.overview.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary/80">{text.workflowTitle}</p>
                  <ol className="space-y-3 text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
                  {text.steps.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                      <span>{item}</span>
                    </li>
                  ))}
                  </ol>
                </section>

                <section className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary/80">{text.ritualsTitle}</p>
                  <p className="mb-3 text-sm leading-relaxed text-foreground/90 sm:text-[15px]">{text.ritualsBody}</p>
                  <div className="flex flex-wrap gap-2">
                    {text.ritualsLinks.map((item) => (
                      <span key={item} className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary/90">
                        {item}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              <section className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary/80">{text.tipsTitle}</p>
                <ul className="space-y-3 text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
                  {text.tips.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="sticky bottom-0 z-10 border-t border-white/10 bg-[hsl(var(--sidebar))]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
              <button
                onClick={onClose}
                className="w-full rounded-xl border border-primary/40 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 sm:ml-auto sm:w-auto"
              >
                {text.close}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    ,
    document.body
  )
}
