import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLang } from '../contexts/LanguageContext'
import { useAudio } from '../contexts/AudioContext'
import { useIsMobile } from '../hooks/use-mobile'
import { supabase } from '../lib/supabaseClient'
import { Plus, BookOpen, Trash2, ChevronLeft, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'
import { ACTION_POINTS, grantProgressionPoints, syncProgressionToDb } from '../altar/altarStore'
import { extractAndMerge } from '../services/knowledgeGraphBridge'
import { ImageGenerationService, type ImageGenerationStyle } from '../services/ImageGenerationService'

interface JournalEntry {
  id: string
  title: string
  content: string
  type: string
  mood?: string
  createdAt: string
}

const MOODS = ['✨', '🌙', '🔥', '🌊', '⚡', '🌿', '🌑', '☀️']
const JOURNAL_META_STORAGE_KEY = 'esoterica_journal_meta_v1'

function readJournalMetaMap(): Record<string, { generatedImage?: string; imageStyle?: ImageGenerationStyle }> {
  try {
    const raw = localStorage.getItem(JOURNAL_META_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function writeJournalMeta(id: string, meta: { generatedImage?: string; imageStyle?: ImageGenerationStyle }) {
  const current = readJournalMetaMap()
  current[id] = { ...(current[id] || {}), ...meta }
  localStorage.setItem(JOURNAL_META_STORAGE_KEY, JSON.stringify(current))
}

interface JournalProps {
  user: { id: string }
}

export default function Journal({ user }: JournalProps) {
  const { t, lang } = useLang()
  const { playUiSound } = useAudio()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [metaTick, setMetaTick] = useState(0)
  const journalMeta = useMemo(() => readJournalMetaMap(), [metaTick])
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'dream',
    mood: '🌙',
    generatedImage: '',
    imageStyle: '' as ImageGenerationStyle | '',
  })

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: ['journals', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data as JournalEntry[]) || []
    },
  })

  const saveEntryMutation = useMutation({
    mutationFn: async (payload: { title: string; content: string; type: string; mood: string }) => {
      const { data: entry, error } = await supabase
        .from('journals')
        .insert([{ userId: user.id, title: payload.title, content: payload.content, type: payload.type, mood: payload.mood, symbols: JSON.stringify([]), createdAt: new Date().toISOString() }])
        .select()
        .single()
      if (error) throw error
      return entry as JournalEntry
    },
  })

  async function saveEntry() {
    if (!form.title.trim() || !form.content.trim()) return
    playUiSound('click')
    const snapshot = { ...form }
    try {
      const entry = await saveEntryMutation.mutateAsync({
        title: snapshot.title,
        content: snapshot.content,
        type: snapshot.type,
        mood: snapshot.mood,
      })
      queryClient.setQueryData<JournalEntry[]>(['journals', user.id], (prev = []) => [entry, ...prev])
      setShowForm(false)
      setSelectedEntry(entry)
      if (snapshot.generatedImage) {
        writeJournalMeta(entry.id, {
          generatedImage: snapshot.generatedImage,
          imageStyle: snapshot.imageStyle || undefined,
        })
        setMetaTick(x => x + 1)
      }
      const lengthBonus = Math.min(6, Math.floor(snapshot.content.length / 350))
      const typeBonus = snapshot.type === 'dream' ? ACTION_POINTS.dreamEntryBonus : 2
      const pointsAward = ACTION_POINTS.journalEntryBase + typeBonus + lengthBonus
      const { pointsEarned, progression } = grantProgressionPoints(pointsAward, 'journal')
      syncProgressionToDb(user.id, progression)
      setForm({ title: '', content: '', type: 'dream', mood: '🌙', generatedImage: '', imageStyle: '' })
      playUiSound('success')
      toast.success(lang === 'ru' ? `Запись сохранена (+${pointsEarned} XP)` : `Entry saved (+${pointsEarned} XP)`)
      const fullText = `${snapshot.title}. ${snapshot.content}`
      extractAndMerge(fullText, lang as 'en' | 'ru', snapshot.type === 'dream' ? 'dream' : 'journal', user.id).then(result => {
        if (result && result.added > 0) {
          toast.success(lang === 'ru' ? `🕸 Паутина: +${result.added} ${result.added === 1 ? 'символ' : 'символов'}` : `🕸 Web: +${result.added} ${result.added === 1 ? 'symbol' : 'symbols'}`, { duration: 3000 })
        }
      })
    } catch {
      toast.error(t.error)
    }
  }

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('journals').delete().eq('id', id)
      if (error) throw error
      return id
    },
  })

  async function deleteEntry(id: string) {
    playUiSound('click')
    try {
      await deleteEntryMutation.mutateAsync(id)
      queryClient.setQueryData<JournalEntry[]>(['journals', user.id], (prev = []) => prev.filter(e => e.id !== id))
      if (selectedEntry?.id === id) setSelectedEntry(null)
    } catch {
      toast.error(t.error)
    }
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
                    {journalMeta[entry.id]?.generatedImage && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border/40">
                        <img src={journalMeta[entry.id]!.generatedImage} alt="Preview" className="w-full h-auto object-cover max-h-24" />
                      </div>
                    )}
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
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-1 rounded-xl border border-border/40 bg-card">
                    {(['surreal_dream', 'divine_portrait', 'dark_ritual'] as ImageGenerationStyle[]).map(style => (
                      <button
                        key={style}
                        onClick={() => setForm(p => ({ ...p, imageStyle: style }))}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors',
                          form.imageStyle === style
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {lang === 'ru'
                          ? style === 'surreal_dream' ? 'Сон' : style === 'divine_portrait' ? 'Портрет' : 'Ритуал'
                          : style.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={async () => {
                      const style = form.imageStyle || (form.type === 'ritual' ? 'dark_ritual' : 'surreal_dream')
                      const img = await ImageGenerationService.generateImage(`${form.title}. ${form.content}`, style)
                      if (img) {
                        setForm(p => ({ ...p, generatedImage: img, imageStyle: style }))
                        playUiSound('success')
                      } else {
                        playUiSound('error')
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs hover:bg-primary/20 transition-colors"
                  >
                    <Wand2 className="w-4 h-4" />
                    {lang === 'ru' ? 'Сгенерировать изображение' : 'Generate image'}
                  </button>
                </div>
                {form.generatedImage && (
                  <div className="rounded-xl overflow-hidden border border-border/40">
                    <img src={form.generatedImage} alt="Visualization" className="w-full h-auto object-cover max-h-72" />
                  </div>
                )}
              </div>

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
                {journalMeta[selectedEntry.id]?.generatedImage && (
                  <div className="mb-6 rounded-2xl overflow-hidden border border-border/40">
                    <img src={journalMeta[selectedEntry.id]!.generatedImage} alt="Visualization" className="w-full h-auto object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-6">
                  <button
                    onClick={async () => {
                      const current = journalMeta[selectedEntry.id] || {}
                      const style = current.imageStyle || (selectedEntry.type === 'ritual' ? 'dark_ritual' : 'surreal_dream')
                      const img = await ImageGenerationService.generateImage(`${selectedEntry.title}. ${selectedEntry.content}`, style)
                      if (img) {
                        writeJournalMeta(selectedEntry.id, { generatedImage: img, imageStyle: style })
                        setMetaTick(x => x + 1)
                        toast.success(lang === 'ru' ? 'Изображение обновлено' : 'Image updated')
                      } else {
                        toast.error(lang === 'ru' ? 'Не удалось сгенерировать' : 'Failed to generate')
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs hover:bg-primary/20 transition-colors"
                  >
                    <Wand2 className="w-4 h-4" />
                    {lang === 'ru' ? 'Перегенерировать' : 'Regenerate'}
                  </button>
                  <span className="text-[10px] text-muted-foreground">
                    {lang === 'ru' ? 'Изображение хранится локально для этой записи' : 'Image is stored locally for this entry'}
                  </span>
                </div>
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
