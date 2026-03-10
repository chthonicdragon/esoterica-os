import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ChakraState, ChakraName, CHAKRA_INFO, JournalEntry, ChakraData } from './types'
import { analyzeChakras } from '../../services/openRouterService'
import { useLang } from '../../contexts/LanguageContext'

const STORAGE_KEY = 'esoterica_chakra_v1'

const DEFAULT_STATE: ChakraState = {
  chakras: (Object.keys(CHAKRA_INFO) as ChakraName[]).reduce((acc, key) => ({
    ...acc,
    [key]: { ...CHAKRA_INFO[key], level: 50, blockedBy: [] }
  }), {} as Record<ChakraName, ChakraData>),
  history: [],
  journal: [],
  lastAnalysis: null
}

interface ChakraContextType {
  state: ChakraState
  addEntry: (text: string) => Promise<void>
  updateChakra: (chakra: ChakraName, patch: Partial<Pick<ChakraData, 'level' | 'blockedBy' | 'note'>>) => void
  isAnalyzing: boolean
}

const ChakraContext = createContext<ChakraContextType | undefined>(undefined)

export function ChakraProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ChakraState>(DEFAULT_STATE)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const { lang } = useLang()

  // Load from local storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ChakraState> | null
        const mergedChakras = (Object.keys(CHAKRA_INFO) as ChakraName[]).reduce((acc, key) => {
          const saved = (parsed as any)?.chakras?.[key] as Partial<ChakraData> | undefined
          const level = typeof saved?.level === 'number' ? saved.level : DEFAULT_STATE.chakras[key].level
          const blockedBy = Array.isArray(saved?.blockedBy) ? saved.blockedBy : DEFAULT_STATE.chakras[key].blockedBy
          const note = typeof saved?.note === 'string' ? saved.note : undefined
          acc[key] = { ...CHAKRA_INFO[key], level, blockedBy, note }
          return acc
        }, {} as Record<ChakraName, ChakraData>)

        setState({
          ...DEFAULT_STATE,
          ...parsed,
          chakras: mergedChakras,
          history: Array.isArray((parsed as any)?.history) ? ((parsed as any).history as ChakraState['history']) : DEFAULT_STATE.history,
          journal: Array.isArray((parsed as any)?.journal) ? ((parsed as any).journal as ChakraState['journal']) : DEFAULT_STATE.journal,
          lastAnalysis: typeof (parsed as any)?.lastAnalysis === 'string' || (parsed as any)?.lastAnalysis === null
            ? ((parsed as any).lastAnalysis as ChakraState['lastAnalysis'])
            : DEFAULT_STATE.lastAnalysis,
        })
      }
    } catch (e) {
      console.error("Failed to load chakra state", e)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    setState(prev => {
      const fixed = (Object.keys(CHAKRA_INFO) as ChakraName[]).reduce((acc, key) => {
        const cur = prev.chakras?.[key]
        const level = typeof cur?.level === 'number' ? cur.level : DEFAULT_STATE.chakras[key].level
        const blockedBy = Array.isArray(cur?.blockedBy) ? cur.blockedBy : DEFAULT_STATE.chakras[key].blockedBy
        const note = typeof cur?.note === 'string' ? cur.note : undefined
        acc[key] = { ...CHAKRA_INFO[key], level, blockedBy, note }
        return acc
      }, {} as Record<ChakraName, ChakraData>)

      const changed = (Object.keys(fixed) as ChakraName[]).some(k => prev.chakras?.[k]?.color !== fixed[k].color)
        || (Object.keys(fixed) as ChakraName[]).some(k => prev.chakras?.[k]?.name !== fixed[k].name)
        || (Object.keys(fixed) as ChakraName[]).some(k => prev.chakras?.[k]?.nameRu !== fixed[k].nameRu)

      if (!changed) return prev
      return { ...prev, chakras: fixed }
    })
  }, [])

  // Save to local storage
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const addEntry = useCallback(async (text: string) => {
    setIsAnalyzing(true)
    try {
      const analysis = await analyzeChakras(text)
      
      const newEntry: JournalEntry = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `chakra_${Date.now()}`,
        date: new Date().toISOString(),
        text,
        emotions: analysis.emotions || [],
        chakraImpact: analysis.chakraImpact || {},
        aiAnalysis: analysis.analysis || "No analysis provided."
      }

      setState(prev => {
        const newChakras = { ...prev.chakras }
        
        // Apply impact
        Object.entries(newEntry.chakraImpact).forEach(([key, val]) => {
          const chakra = key as ChakraName
          if (newChakras[chakra]) {
            let newLevel = newChakras[chakra].level + (val || 0)
            newLevel = Math.max(0, Math.min(100, newLevel))
            newChakras[chakra] = {
              ...newChakras[chakra],
              level: newLevel
            }
          }
        })

        // Add history point
        const historyPoint = {
          date: newEntry.date,
          levels: (Object.keys(newChakras) as ChakraName[]).reduce((acc, key) => ({
            ...acc,
            [key]: newChakras[key].level
          }), {} as Record<ChakraName, number>)
        }

        return {
          ...prev,
          chakras: newChakras,
          journal: [newEntry, ...prev.journal],
          history: [...prev.history, historyPoint].slice(-30), // Keep last 30 points
          lastAnalysis: newEntry.aiAnalysis
        }
      })
    } catch (e) {
      console.error("Chakra analysis failed", e)
    } finally {
      setIsAnalyzing(false)
    }
  }, [lang])

  const updateChakra = useCallback((chakra: ChakraName, patch: Partial<Pick<ChakraData, 'level' | 'blockedBy' | 'note'>>) => {
    setState(prev => {
      const current = prev.chakras[chakra]
      if (!current) return prev
      const nextLevel = typeof patch.level === 'number' ? Math.max(0, Math.min(100, patch.level)) : current.level
      const nextBlockedBy = Array.isArray(patch.blockedBy) ? patch.blockedBy : current.blockedBy
      const nextNote = typeof patch.note === 'string' ? patch.note : current.note
      return {
        ...prev,
        chakras: {
          ...prev.chakras,
          [chakra]: {
            ...current,
            level: nextLevel,
            blockedBy: nextBlockedBy,
            note: nextNote,
          }
        }
      }
    })
  }, [])

  return (
    <ChakraContext.Provider value={{ state, addEntry, updateChakra, isAnalyzing }}>
      {children}
    </ChakraContext.Provider>
  )
}

export function useChakra() {
  const ctx = useContext(ChakraContext)
  if (!ctx) throw new Error('useChakra must be used within ChakraProvider')
  return ctx
}
