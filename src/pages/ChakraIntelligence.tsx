import React, { useState } from 'react'
import { ChakraProvider, useChakra } from '../modules/chakra-intelligence/ChakraContext'
import { EnergyBody3D } from '../modules/chakra-intelligence/components/EnergyBody3D'
import { EnergyJournal } from '../modules/chakra-intelligence/components/EnergyJournal'
import { EnergyMap } from '../modules/chakra-intelligence/components/EnergyMap'
import { RitualGenerator } from '../modules/chakra-intelligence/components/RitualGenerator'
import type { ChakraName } from '../modules/chakra-intelligence/types'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, User, Users } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'

interface ChakraDashboardProps {
  onBack?: () => void
}

function ChakraDashboard({ onBack }: ChakraDashboardProps) {
  const { state, updateChakra } = useChakra()
  const { lang } = useLang()
  const [scanTrigger, setScanTrigger] = useState(0)
  const [bodyVariant, setBodyVariant] = useState<'male' | 'female'>('male')
  const [activeChakra, setActiveChakra] = useState<ChakraName>('heart')
  const [draftLevel, setDraftLevel] = useState<number>(state.chakras.heart.level)
  const [draftNote, setDraftNote] = useState<string>((state.chakras.heart as any).note || '')

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-purple-500/30">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <h1 className="text-3xl font-light tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200 animate-gradient">
              {lang === 'ru' ? 'Система чакр' : 'Chakra Intelligence'}
            </h1>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">
              {lang === 'ru' ? 'Анализ и баланс энергетического тела' : 'Energy Body Analysis & Alignment'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-xs text-white/30">
          <span>v1.0.0</span>
          <span>•</span>
          <span>{lang === 'ru' ? 'Система активна' : 'System Active'}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        {/* Left Column: 3D Body Visualization */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 h-full flex flex-col gap-6"
        >
          <div className="flex-1 bg-gradient-to-b from-purple-900/10 to-transparent rounded-2xl border border-white/5 p-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-14 left-3 z-20 flex items-center gap-1 p-1 rounded-lg bg-black/35 border border-white/10 backdrop-blur">
              <button
                onClick={() => setBodyVariant('male')}
                className={`px-2 py-1 rounded-md text-[11px] transition-colors ${bodyVariant === 'male' ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                <User className="w-3.5 h-3.5 inline-block mr-1" />
                {lang === 'ru' ? 'М' : 'M'}
              </button>
              <button
                onClick={() => setBodyVariant('female')}
                className={`px-2 py-1 rounded-md text-[11px] transition-colors ${bodyVariant === 'female' ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                <Users className="w-3.5 h-3.5 inline-block mr-1" />
                {lang === 'ru' ? 'Ж' : 'F'}
              </button>
            </div>
            <button
              onClick={() => setScanTrigger(x => x + 1)}
              className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs hover:bg-indigo-500/30 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'ru' ? 'Энерго-скан' : 'Energy Scan'}</span>
            </button>
            <EnergyBody3D
              chakras={state.chakras}
              lang={lang === 'ru' ? 'ru' : 'en'}
              scanTrigger={scanTrigger}
              bodyVariant={bodyVariant}
              onChakraClick={(chakra) => {
                setActiveChakra(chakra)
                setDraftLevel(state.chakras[chakra].level)
                setDraftNote((state.chakras[chakra] as any).note || '')
              }}
            />
            <div className="absolute bottom-3 right-3 z-20 w-[240px] rounded-xl bg-neutral-900 border border-white/20 p-3 shadow-2xl">
              <div className="text-[10px] uppercase tracking-widest text-white/50 mb-1">
                {lang === 'ru' ? 'Состояние чакры' : 'Chakra state'}
              </div>
              <div className="text-sm text-white/85 mb-2">
                {lang === 'ru' ? state.chakras[activeChakra].nameRu : state.chakras[activeChakra].name}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={draftLevel}
                  onChange={(e) => setDraftLevel(Number(e.target.value))}
                  className="flex-1 accent-indigo-400"
                />
                <span className="text-[11px] font-mono text-white/70 w-10 text-right">{Math.round(draftLevel)}%</span>
              </div>
              <textarea
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder={lang === 'ru' ? 'Опишите ощущения…' : 'Describe sensations…'}
                className="w-full h-16 resize-none bg-neutral-800 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-indigo-400/40"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    updateChakra(activeChakra, { level: draftLevel, note: draftNote })
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs hover:bg-indigo-500/30 transition-colors"
                >
                  {lang === 'ru' ? 'Сохранить' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setDraftLevel(state.chakras[activeChakra].level)
                    setDraftNote((state.chakras[activeChakra] as any).note || '')
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors"
                >
                  {lang === 'ru' ? 'Сброс' : 'Reset'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Middle Column: Stats & Journal */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 h-full flex flex-col gap-6"
        >
          <div className="h-[45%]">
            <EnergyMap lang={lang === 'ru' ? 'ru' : 'en'} />
          </div>
          <div className="h-[55%]">
            <EnergyJournal lang={lang === 'ru' ? 'ru' : 'en'} />
          </div>
        </motion.div>

        {/* Right Column: Ritual Suggestions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 h-full"
        >
          <RitualGenerator lang={lang === 'ru' ? 'ru' : 'en'} />
        </motion.div>
      </div>
    </div>
  )
}

export default function ChakraIntelligence({ onBack }: { onBack?: () => void }) {
  return (
    <ChakraProvider>
      <ChakraDashboard onBack={onBack} />
    </ChakraProvider>
  )
}
