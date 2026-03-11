import React, { useState } from 'react'
import { ChakraProvider, useChakra } from '../modules/chakra-intelligence/ChakraContext'
import { EnergyBody3D } from '../modules/chakra-intelligence/components/EnergyBody3D'
import { EnergyJournal } from '../modules/chakra-intelligence/components/EnergyJournal'
import { EnergyMap } from '../modules/chakra-intelligence/components/EnergyMap'
import { RitualGenerator } from '../modules/chakra-intelligence/components/RitualGenerator'
import type { ChakraName } from '../modules/chakra-intelligence/types'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, User, Users, Save, RotateCcw } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'

interface ChakraDashboardProps {
  onBack?: () => void
}

function ChakraDashboard({ onBack }: ChakraDashboardProps) {
  const { state, updateChakra, addEntry, isAnalyzing } = useChakra()
  const { lang } = useLang()
  const [scanTrigger, setScanTrigger] = useState(0)
  const [bodyVariant, setBodyVariant] = useState<'male' | 'female'>('male')
  const [activeChakra, setActiveChakra] = useState<ChakraName>('heart')
  const [draftLevel, setDraftLevel] = useState<number>(state.chakras.heart.level)
  const [draftNote, setDraftNote] = useState<string>((state.chakras.heart as any).note || '')
  const [saved, setSaved] = useState(false)

  const handleSelectChakra = (chakra: ChakraName) => {
    setActiveChakra(chakra)
    setDraftLevel(state.chakras[chakra].level)
    setDraftNote((state.chakras[chakra] as any).note || '')
    setSaved(false)
  }

  const handleSave = async () => {
    updateChakra(activeChakra, { level: draftLevel, note: draftNote })
    if (draftNote.trim()) {
      const chakraLabel = lang === 'ru'
        ? state.chakras[activeChakra].nameRu
        : state.chakras[activeChakra].name
      await addEntry(`[${chakraLabel}] ${draftNote.trim()}`)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setDraftLevel(state.chakras[activeChakra].level)
    setDraftNote((state.chakras[activeChakra] as any).note || '')
    setSaved(false)
  }

  const chakraColor = state.chakras[activeChakra].color

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-purple-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <h1 className="text-2xl font-light tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200">
              {lang === 'ru' ? 'Система чакр' : 'Chakra Intelligence'}
            </h1>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">
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

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 pb-4 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Left: 3D Body + Chakra editor below */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 h-full flex flex-col gap-3"
        >
          {/* 3D viewer */}
          <div className="flex-1 bg-gradient-to-b from-purple-900/10 to-transparent rounded-2xl border border-white/5 p-1 relative overflow-hidden min-h-0">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

            {/* Gender toggle */}
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

            {/* Energy scan button */}
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
              onChakraClick={handleSelectChakra}
            />
          </div>

          {/* Chakra editor — directly under the 3D model */}
          <div
            className="flex-shrink-0 rounded-2xl border bg-black/60 backdrop-blur-md p-4"
            style={{ borderColor: `${chakraColor}35` }}
          >
            {/* Header row: chakra name + dot */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: chakraColor, boxShadow: `0 0 8px ${chakraColor}90` }}
              />
              <span className="text-xs font-medium text-white/80">
                {lang === 'ru' ? state.chakras[activeChakra].nameRu : state.chakras[activeChakra].name}
              </span>
              <span className="ml-auto text-xs font-mono" style={{ color: chakraColor }}>
                {Math.round(draftLevel)}%
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={100}
              value={draftLevel}
              onChange={(e) => { setDraftLevel(Number(e.target.value)); setSaved(false) }}
              className="w-full mb-1 cursor-pointer"
              style={{ accentColor: chakraColor }}
            />
            <div className="flex justify-between text-[9px] text-white/20 mb-3">
              <span>{lang === 'ru' ? 'Заблок.' : 'Blocked'}</span>
              <span>{lang === 'ru' ? 'Баланс' : 'Balanced'}</span>
              <span>{lang === 'ru' ? 'Открыта' : 'Open'}</span>
            </div>

            {/* Textarea */}
            <textarea
              value={draftNote}
              onChange={(e) => { setDraftNote(e.target.value); setSaved(false) }}
              placeholder={lang === 'ru' ? 'Опишите ощущения…' : 'Describe sensations…'}
              className="w-full h-16 resize-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white/80 placeholder:text-white/25 outline-none focus:border-indigo-400/40 mb-3"
            />

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isAnalyzing}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                style={{
                  backgroundColor: `${chakraColor}20`,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: `${chakraColor}50`,
                  color: chakraColor,
                }}
              >
                <Save className="w-3.5 h-3.5" />
                {saved ? (lang === 'ru' ? '✓ Сохранено' : '✓ Saved') : (lang === 'ru' ? 'Сохранить' : 'Save')}
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Middle: Map + Journal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 h-full flex flex-col gap-4"
        >
          <div className="h-[45%]">
            <EnergyMap lang={lang === 'ru' ? 'ru' : 'en'} />
          </div>
          <div className="h-[55%]">
            <EnergyJournal lang={lang === 'ru' ? 'ru' : 'en'} />
          </div>
        </motion.div>

        {/* Right: Rituals */}
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
