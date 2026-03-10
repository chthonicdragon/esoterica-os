import React, { useState } from 'react'
import { useChakra } from '../ChakraContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Sparkles, BrainCircuit } from 'lucide-react'
import { cn } from '../../../lib/utils'

export function EnergyJournal({ lang = 'en' }: { lang?: 'en' | 'ru' }) {
  const { addEntry, isAnalyzing, state } = useChakra()
  const [text, setText] = useState('')

  const handleAnalyze = async () => {
    if (!text.trim()) return
    await addEntry(text)
    setText('')
  }

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

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar z-10">
        <AnimatePresence mode="popLayout">
          {state.journal.map((entry) => (
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
                <div className="flex gap-1">
                  {entry.emotions.map(e => (
                    <span key={e} className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30">
                      {e}
                    </span>
                  ))}
                </div>
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
            </motion.div>
          ))}
        </AnimatePresence>
        
        {state.journal.length === 0 && (
          <div className="text-center py-10 text-white/20 text-sm italic">
            {lang === 'ru'
              ? 'Пока нет записей. Опишите свои ощущения для анализа энергопотока.'
              : 'No entries yet. Write about your feelings to analyze energy flow.'}
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
