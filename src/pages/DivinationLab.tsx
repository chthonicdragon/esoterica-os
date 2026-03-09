
import React, { useState, useEffect } from 'react'
import { useLang } from '../contexts/LanguageContext'
import type { Lang } from '../i18n/translations'
import { useAudio } from '../contexts/AudioContext'
import { db } from '../lib/platformClient'
import { Magic8Ball } from '../components/Magic8Ball'
import { TarotReader } from '../components/TarotReader'
import { Search, Dice5, Sparkles, LayoutGrid, Eye } from 'lucide-react'
import { extractAndMerge } from '../services/knowledgeGraphBridge'
import { grantProgressionPoints, syncProgressionToDb } from '../altar/altarStore'
import toast from 'react-hot-toast'

interface DivinationLabProps {
  user: { id: string }
}

type DivinationMode = 'oracle' | 'tarot'

export function DivinationLab({ user }: DivinationLabProps) {
  const { t, lang } = useLang()
  const { playUiSound } = useAudio()
  
  const [mode, setMode] = useState<DivinationMode>('oracle')
  const [entitySearch, setEntitySearch] = useState('')
  const [showEntitySuggestions, setShowEntitySuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedEntity, setSelectedEntity] = useState<any | undefined>(undefined)

  // Real entity search from graph data
  useEffect(() => {
    if (entitySearch.length > 1) {
       const savedGraph = localStorage.getItem('esoteric_knowledge_web_v1')
       if (savedGraph) {
         try {
           const graph = JSON.parse(savedGraph)
           if (graph.nodes) {
             const matches = graph.nodes
               .filter((n: any) => {
                 const nameMatch = n.name.toLowerCase().includes(entitySearch.toLowerCase())
                 const typeMatch = n.type === 'deity' || n.type === 'spirit' || n.type === 'entity'
                 return nameMatch && typeMatch
               })
               .slice(0, 5)
             setSuggestions(matches)
             setShowEntitySuggestions(true)
           }
         } catch (e) { console.error('Error parsing graph for autocomplete', e) }
       }
    } else {
      setShowEntitySuggestions(false)
    }
  }, [entitySearch])

  const selectEntity = (entity: any) => {
    setEntitySearch(entity.name)
    setSelectedEntity(entity)
    setShowEntitySuggestions(false)
  }

  const selectRandomEntity = () => {
     const savedGraph = localStorage.getItem('esoteric_knowledge_web_v1')
     if (savedGraph) {
       try {
         const graph = JSON.parse(savedGraph)
         if (graph.nodes && graph.nodes.length > 0) {
           const spirits = graph.nodes.filter((n: any) => n.type === 'deity' || n.type === 'spirit' || n.type === 'entity')
           if (spirits.length > 0) {
             const randomNode = spirits[Math.floor(Math.random() * spirits.length)]
             selectEntity(randomNode)
           }
         }
       } catch (e) {}
     }
  }

  const handleSavePrediction = async (prediction: string, entityId?: string) => {
    playUiSound('success')
    
    try {
      // Create a simple ritual entry for the activity feed
      await db.rituals.create({
        userId: user.id,
        title: lang === 'ru' ? 'Пророчество Оракула' : 'Oracle Prophecy',
        type: 'divination',
        intention: selectedEntity ? `Channeling ${selectedEntity.name}` : 'General Guidance',
        outcome: prediction,
        deity: selectedEntity?.name || '',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        energyLevel: 50, // Default moderate energy
        notes: selectedEntity ? `Source: ${selectedEntity.name}` : 'Source: The Void'
      })
      
      // Grant XP
      const { pointsEarned, progression } = grantProgressionPoints(5, 'divination')
      syncProgressionToDb(user.id, progression)
      
      toast.success(
        lang === 'ru' 
          ? `Предсказание сохранено (+${pointsEarned} XP)` 
          : `Prophecy saved (+${pointsEarned} XP)`
      )
    } catch (e) {
      console.error(e)
      toast.error(lang === 'ru' ? "Не удалось сохранить" : "Failed to save prophecy")
    }
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-cinzel text-foreground bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          {lang === 'ru' ? 'Оракул Бездны' : 'Oracle of the Void'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {lang === 'ru' ? 'Спроси духов, и они ответят.' : 'Ask the spirits, and they shall answer.'}
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setMode('oracle')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              mode === 'oracle' ? 'bg-blue-500/20 text-blue-300 shadow-lg' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-4 h-4" />
            {lang === 'ru' ? 'Шар Судьбы' : 'Crystal Ball'}
          </button>
          <button
            onClick={() => setMode('tarot')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              mode === 'tarot' ? 'bg-purple-500/20 text-purple-300 shadow-lg' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            {lang === 'ru' ? 'Таро' : 'Tarot'}
          </button>
        </div>
      </div>

      {mode === 'oracle' ? (
        <>
          {/* Entity Selector */}
          <div className="relative z-20 max-w-md mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  value={entitySearch}
                  onChange={e => setEntitySearch(e.target.value)}
                  placeholder={lang === 'ru' ? 'Призвать сущность (поиск)...' : 'Channel an entity (search)...'}
                  className="w-full bg-background/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-blue-500/50 transition-all backdrop-blur-sm"
                />
                {showEntitySuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#0b0f19] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30">
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => selectEntity(s)}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm flex justify-between items-center border-b border-white/5 last:border-0 transition-colors"
                      >
                        <span className="font-bold text-foreground">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={selectRandomEntity}
                className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors bg-background/50 backdrop-blur-sm"
                title={lang === 'ru' ? 'Случайный дух' : 'Random Spirit'}
              >
                <Dice5 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* The 8-Ball */}
          <div className="flex justify-center py-8">
            <Magic8Ball entity={selectedEntity} onSave={handleSavePrediction} lang={lang} />
          </div>
        </>
      ) : (
        /* Tarot Mode */
        <div className="animate-fade-in">
           <TarotReader lang={lang as 'en' | 'ru'} />
        </div>
      )}
    </div>
  )
}
