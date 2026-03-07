import React, { useEffect, useState } from 'react'
import { useLang } from '../contexts/LanguageContext'
import { useAudio } from '../contexts/AudioContext'
import { useIsMobile } from '../hooks/use-mobile'
// import { blink } from '../blink/client' // removed
import { Plus, BookOpen, Trash2, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'

interface JournalEntry {
  id: string
  title: string
  content: string
  type: string
  mood?: string
  createdAt: string
}

const MOODS = ['✨', '🌙', '🔥', '🌊', '⚡', '🌿', '🌑', '☀️']

interface JournalProps {
  user: { id: string }
}

export function Journal({ user }: JournalProps) {
  const { t, lang } = useLang()
  const { playUiSound } = useAudio()
  const isMobile = useIsMobile()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', content: '', type: 'dream', mood: '🌙' })

  useEffect(() => { loadEntries() }, [user.id])

  async function loadEntries() {
    try {
      const data = await blink.db.journals.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 50,
      }) as JournalEntry[]
      setEntries(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function saveEntry() {
    if (!form.title.trim() || !form.content.trim()) return
    playUiSound('click')
    try {
      const entry = await blink.db.journals.create({
        userId: user.id,
        title: form.title,
        content: form.content,
        type: form.type,
        mood: form.mood,
        symbols: JSON.stringify([]),
        createdAt: new Date().toISOString(),
      }) as JournalEntry
      setEntries(prev => [entry, ...prev])
      setShowForm(false)
      setSelectedEntry(entry)
      setForm({ title: '', content: '', type: 'dream', mood: '🌙' })
      playUiSound('success')
      toast.success(lang === 'ru' ? 'Запись сохранена' : 'Entry saved')
    } catch (e) { toast.error(t.error) }
  }

  async function deleteEntry(id: string) {
    playUiSound('click')
    await blink.db.journals.delete(id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (selectedEntry?.id === id) setSelectedEntry(null)
  }

  const typeColors: Record<string, string> = {
    dream: 'text-blue-400 bg-blue-400/10',
    ritual: 'text-orange-400 bg-orange-400/10',
    vision: 'text-purple-400 bg-purple-400/10',
    meditation: 'text-green-400 bg-green-400/10',
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Entry list */}
      {(!isMobile || (!selectedEntry && !showForm)) && (
        <div className={cn(
          "flex-shrink-0 border-r border-border/40 flex flex-col",
          isMobile ? "w-full" : "w-72"
        )}>
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{t.dreamJournal}</h2>
            <button
              onClick={() => { setShowForm(true); setSelectedEntry(null); playUiSound('click') }}
              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">{t.loading}</div>
            ) : entries.length === 0 ? (
              <div className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t.noEntries}</p>
              </div>
            ) : entries.map(entry => (
              <div
                key={entry.id}
                onClick={() => { setSelectedEntry(entry); setShowForm(false); playUiSound('click') }}
                className={cn(
                  'rounded-xl p-3 cursor-pointer transition-all group',
                  selectedEntry?.id === entry.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/5 border border-transparent'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{entry.mood || '🌙'}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', typeColors[entry.type] || 'text-muted-foreground bg-muted')}>
                        {(t.types as Record<string, string>)[entry.type] || entry.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{entry.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 opacity-70 leading-relaxed">{entry.content}</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">{new Date(entry.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteEntry(entry.id) }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entry detail / form */}
      {(!isMobile || (selectedEntry || showForm)) && (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {showForm ? (
            <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isMobile && (
                    <button onClick={() => { setShowForm(false); playUiSound('click') }} className="p-2 -ml-2 text-muted-foreground">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <h3 className="text-sm font-semibold text-foreground">{t.newEntry}</h3>
                </div>
                <button onClick={() => { setShowForm(false); playUiSound('click') }} className="text-xs text-muted-foreground hover:text-foreground">{t.cancel}</button>
              </div>

              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder={t.entryTitle}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={form.type}
                  onChange={e => { setForm(p => ({ ...p, type: e.target.value })); playUiSound('click') }}
                  className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  {Object.entries(t.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  {MOODS.map(m => (
                    <button
                      key={m}
                      onClick={() => { setForm(p => ({ ...p, mood: m })); playUiSound('click') }}
                      className={cn('w-9 h-9 flex-shrink-0 rounded-lg text-lg transition-all', form.mood === m ? 'bg-primary/20 border border-primary/40' : 'bg-card border border-border/40 hover:bg-white/5')}
                    >{m}</button>
                  ))}
                </div>
              </div>

              <textarea
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder={t.journalContent}
                className="flex-1 w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 resize-none min-h-[300px]"
              />

              <button
                onClick={() => { saveEntry(); playUiSound('click') }}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 text-sm font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              >
                {t.save}
              </button>
            </div>
          ) : selectedEntry ? (
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                  {isMobile && (
                    <button onClick={() => { setSelectedEntry(null); playUiSound('click') }} className="p-2 -ml-2 text-muted-foreground">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <span className="text-2xl">{selectedEntry.mood || '🌙'}</span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold', typeColors[selectedEntry.type] || 'text-muted-foreground bg-muted')}>
                    {(t.types as Record<string, string>)[selectedEntry.type] || selectedEntry.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto uppercase tracking-widest">{new Date(selectedEntry.createdAt).toLocaleString()}</span>
                </div>
                <h2 className="text-2xl font-bold font-cinzel text-foreground mb-6 leading-tight">{selectedEntry.title}</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedEntry.content}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div className="max-w-xs">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4 opacity-50">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lang === 'ru' ? 'Выберите запись или создайте новую для вашего путешествия' : 'Select an entry or create a new one for your journey'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}