import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, AlertCircle, Loader2, Save, Trash2 } from 'lucide-react'
import type { MythScanResult, Epithet } from '../services/MythScanService'
import { useLang } from '../contexts/LanguageContext'
import { AutoTranslate } from './AutoTranslate'

interface Props {
  result: MythScanResult
  onClose: () => void
  onSave: (approvedData: Partial<MythScanResult>) => void
}

export function MythReviewUI({ result, onClose, onSave }: Props) {
  const { lang } = useLang()
  const [approved, setApproved] = useState<MythScanResult>(result)
  const [activeTab, setActiveTab] = useState<'correspondences' | 'epithets'>('correspondences')

  const toggleItem = (category: keyof MythScanResult, item: string | Epithet) => {
    setApproved(prev => {
      const list = prev[category] as any[]
      if (category === 'epithets') {
        const ep = item as Epithet
        const exists = list.find((e: Epithet) => e.name === ep.name)
        return {
          ...prev,
          [category]: exists 
            ? list.filter((e: Epithet) => e.name !== ep.name)
            : [...list, ep]
        }
      } else {
        const str = item as string
        return {
          ...prev,
          [category]: list.includes(str)
            ? list.filter((i: string) => i !== str)
            : [...list, str]
        }
      }
    })
  }

  const isSelected = (category: keyof MythScanResult, item: string | Epithet) => {
    const list = approved[category] as any[]
    if (category === 'epithets') {
      return !!list.find((e: Epithet) => e.name === (item as Epithet).name)
    }
    return list.includes(item as string)
  }

  const handleSave = () => {
    onSave(approved)
    onClose()
  }

  const categories = [
    'symbols', 'plants', 'animals', 'offerings', 'colors', 
    'elements', 'planets', 'days', 'festivals', 
    'associated_deities', 'sacred_objects'
  ] as const

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-background border border-primary/20 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border/40 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl">🏛️</span>
            </div>
            <div>
              <h2 className="text-lg font-cinzel font-bold flex items-center gap-2">
                <AutoTranslate>{result.entity}</AutoTranslate>
                <span className="text-xs font-sans font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <AutoTranslate>{result.pantheon}</AutoTranslate>
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {lang === 'ru' ? 'Обзор мифологических соответствий' : 'Review mythological correspondences'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/40">
          <button
            onClick={() => setActiveTab('correspondences')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'correspondences' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            {lang === 'ru' ? 'Соответствия' : 'Correspondences'}
          </button>
          <button
            onClick={() => setActiveTab('epithets')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'epithets' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            {lang === 'ru' ? 'Эпитеты' : 'Epithets'}
            <span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
              {result.epithets.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'correspondences' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <AutoTranslate>{cat}</AutoTranslate>
                    <span className="text-[10px] opacity-50">({(result[cat] as string[]).length})</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(result[cat] as string[]).filter(Boolean).map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleItem(cat, item)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm border transition-all text-left
                          ${isSelected(cat, item) 
                            ? 'bg-primary/15 border-primary/40 text-primary hover:bg-primary/25' 
                            : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 opacity-60'}
                        `}
                      >
                        <AutoTranslate>{item}</AutoTranslate>
                      </button>
                    ))}
                    {(result[cat] as string[]).filter(Boolean).length === 0 && (
                      <span className="text-xs text-muted-foreground/40 italic">None found</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'epithets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.epithets.map((ep) => (
                <div 
                  key={ep.name}
                  onClick={() => toggleItem('epithets', ep)}
                  className={`
                    cursor-pointer p-4 rounded-xl border transition-all relative group
                    ${isSelected('epithets', ep)
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-foreground">
                      <AutoTranslate>{ep.name}</AutoTranslate>
                    </h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isSelected('epithets', ep) ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/10 border-white/20 text-muted-foreground'}`}>
                      {Math.round(ep.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-2">
                    "<AutoTranslate>{ep.meaning}</AutoTranslate>"
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider opacity-60">
                      <AutoTranslate>{ep.type.replace('_', ' ')}</AutoTranslate>
                    </span>
                  </div>
                  
                  {isSelected('epithets', ep) && (
                    <div className="absolute top-2 right-2 text-primary">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {result.epithets.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  No epithets found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 bg-background/50 backdrop-blur-md flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 text-muted-foreground transition-colors"
          >
            {lang === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {lang === 'ru' ? 'Сохранить выбранное' : 'Save Selected'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
