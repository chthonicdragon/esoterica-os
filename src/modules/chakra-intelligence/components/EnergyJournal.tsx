import React, { useMemo, useState } from 'react'
import { useChakra } from '../ChakraContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Sparkles, BrainCircuit } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { CHAKRA_INFO, ChakraName } from '../types'

export function EnergyJournal({ lang = 'en' }: { lang?: 'en' | 'ru' }) {
  const { addEntry, isAnalyzing, state } = useChakra()
  const [text, setText] = useState('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [chakraFilter, setChakraFilter] = useState<ChakraName | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'analysis' | 'chakra_note'>('all')

  const handleAnalyze = async () => {
    if (!text.trim()) return
    await addEntry(text)
    setText('')
  }

  const filteredEntries = useMemo(() => {
    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null
    const toTs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null

    return state.journal.filter((entry) => {
      const entryType = (entry.entryType || 'analysis') as 'analysis' | 'chakra_note'
      if (typeFilter !== 'all' && entryType !== typeFilter) return false

      const ts = new Date(entry.date).getTime()
      if (Number.isFinite(fromTs as number) && fromTs !== null && ts < fromTs) return false
      if (Number.isFinite(toTs as number) && toTs !== null && ts > toTs) return false

      if (chakraFilter !== 'all') {
        if (entryType === 'chakra_note') {
          return entry.chakra === chakraFilter
        }
        if (entry.chakra === chakraFilter) return true
        return typeof (entry.chakraImpact as any)?.[chakraFilter] === 'number'
      }

      return true
    })
  }, [chakraFilter, fromDate, state.journal, toDate, typeFilter])

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 z-10">
        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <BrainCircuit className="w-5 h-5 text-purple-300" />
        </div>
        <div>
          <h2 className="text-xl font-light text-white tracking-wider">{lang === 'ru' ? 'Энергетический дневник' : 'Energy Journal'}</h2>
          <p className="text-xs text-white/40">{lang === 'ru' ? 'Опишите состояние для анализа чакр' : 'Record your state for chakra analysis'}</p>
        </div>
      </div>

      <div className="z-10 mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white/80"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white/80"
        />
        <select
          value={chakraFilter}
          onChange={(e) => setChakraFilter(e.target.value as ChakraName | 'all')}
          className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white/80"
        >
          <option value="all">{lang === 'ru' ? 'Все чакры' : 'All chakras'}</option>
          {(Object.keys(CHAKRA_INFO) as ChakraName[]).map((key) => (
            <option key={key} value={key}>
              {lang === 'ru' ? CHAKRA_INFO[key].nameRu : CHAKRA_INFO[key].name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white/80"
        >
          <option value="all">{lang === 'ru' ? 'Все записи' : 'All entries'}</option>
          <option value="analysis">{lang === 'ru' ? 'Анализ' : 'Analysis'}</option>
          <option value="chakra_note">{lang === 'ru' ? 'Заметки' : 'Notes'}</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar z-10">
        <AnimatePresence mode="popLayout">
          {filteredEntries.map((entry) => {
            const entryType = (entry.entryType || 'analysis') as 'analysis' | 'chakra_note'
            const label = entry.chakra
              ? (lang === 'ru' ? CHAKRA_INFO[entry.chakra].nameRu : CHAKRA_INFO[entry.chakra].name)
              : ''
            return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-white/30 font-mono">
                  {new Date(entry.date).toLocaleDateString()} • {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {entryType === 'analysis' ? (
                  <div className="flex gap-1">
                    {entry.emotions.map(e => (
                      <span key={e} className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30">
                        {e}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {label ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] border border-emerald-500/25">
                        {label}
                      </span>
                    ) : null}
                    <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-white/60 text-[10px] border border-white/10">
                      {lang === 'ru' ? 'Заметка' : 'Note'}
                    </span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-white/80 mb-3 leading-relaxed font-light whitespace-pre-wrap">
                {entry.text}
              </p>

              {entry.aiAnalysis && (
                <div className="mt-3 p-3 rounded bg-purple-900/20 border border-purple-500/20 text-xs text-purple-200/80 italic flex gap-2">
                  <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-purple-400" />
                  {entry.aiAnalysis}
                </div>
              )}

              {/* Impact Indicators */}
              {entryType === 'analysis' && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(entry.chakraImpact).map(([chakra, val]) => (
                    <div key={chakra} className={cn(
                      "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border",
                      val > 0
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    )}>
                      <span className="capitalize">{chakra.replace('_', ' ')}</span>
                      <span className="font-mono">{val > 0 ? '+' : ''}{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )})}
        </AnimatePresence>
        
        {filteredEntries.length === 0 && (
          <div className="text-center py-10 text-white/20 text-sm italic">
            {lang === 'ru'
              ? 'Нет записей по выбранным фильтрам.'
              : 'No entries for selected filters.'}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={lang === 'ru'
            ? 'Что вы сейчас чувствуете? Например: тревога из-за работы, заземлённость на природе...'
            : 'How do you feel right now? (e.g. anxious about work, feeling grounded in nature...)'}
          className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 resize-none h-24 transition-all"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleAnalyze()
            }
          }}
        />
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !text.trim()}
          className="absolute bottom-3 right-3 p-2 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white shadow-lg shadow-purple-900/20"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
