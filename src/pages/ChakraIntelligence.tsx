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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Left: 3D Body */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 h-full"
        >
          <div className="h-full bg-gradient-to-b from-purple-900/10 to-transparent rounded-2xl border border-white/5 p-1 relative overflow-hidden group">
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

      {/* Bottom panel: Chakra editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-shrink-0 mx-6 mb-4 mt-3 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden"
        style={{ borderColor: `${chakraColor}30` }}
      >
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          {/* Chakra name + indicator */}
          <div
            className="flex items-center gap-3 px-5 py-4 md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10"
            style={{ borderColor: `${chakraColor}20` }}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
              style={{ backgroundColor: chakraColor, boxShadow: `0 0 10px ${chakraColor}80` }}
            />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">
                {lang === 'ru' ? 'Активная чакра' : 'Active chakra'}
              </div>
              <div className="text-sm font-medium text-white/90">
                {lang === 'ru' ? state.chakras[activeChakra].nameRu : state.chakras[activeChakra].name}
              </div>
            </div>
          </div>

          {/* Slider */}
          <div className="flex flex-col justify-center px-5 py-4 md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10 gap-1.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-widest text-white/40">
                {lang === 'ru' ? 'Уровень энергии' : 'Energy level'}
              </span>
              <span className="text-sm font-mono" style={{ color: chakraColor }}>
                {Math.round(draftLevel)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={draftLevel}
              onChange={(e) => { setDraftLevel(Number(e.target.value)); setSaved(false) }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: chakraColor }}
            />
            <div className="flex justify-between text-[9px] text-white/20">
              <span>{lang === 'ru' ? 'Заблок.' : 'Blocked'}</span>
              <span>{lang === 'ru' ? 'Баланс' : 'Balanced'}</span>
              <span>{lang === 'ru' ? 'Открыта' : 'Open'}</span>
            </div>
          </div>

          {/* Note textarea */}
          <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-white/10">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">
              {lang === 'ru' ? 'Описание ощущений' : 'Describe sensations'}
            </div>
            <textarea
              value={draftNote}
              onChange={(e) => { setDraftNote(e.target.value); setSaved(false) }}
              placeholder={lang === 'ru' ? 'Что вы ощущаете в этой зоне тела?...' : 'What do you feel in this area?...'}
              className="w-full h-14 resize-none bg-transparent text-[12px] text-white/80 placeholder:text-white/20 outline-none leading-relaxed"
            />
            <p className="text-[10px] text-white/20 mt-0.5">
              {lang === 'ru'
                ? '* Описание также добавится в энергетический дневник'
                : '* Description will also be saved to the energy journal'}
            </p>
          </div>

          {/* Save/Reset buttons */}
          <div className="flex md:flex-col gap-2 px-4 py-4 justify-center items-center flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: `${chakraColor}25`,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: `${chakraColor}50`,
                color: chakraColor,
              }}
            >
              <Save className="w-3.5 h-3.5" />
              {saved
                ? (lang === 'ru' ? '✓ Сохранено' : '✓ Saved')
                : (lang === 'ru' ? 'Сохранить' : 'Save')}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 hover:text-white/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {lang === 'ru' ? 'Сброс' : 'Reset'}
            </button>
          </div>
        </div>
      </motion.div>
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
