import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  loadLocalState,
  saveLocalState,
  addProgressPoints,
  syncProgressionToDb,
  type ProgressSource,
  type AltarStoreState,
} from '../altar/altarStore'
import type { Progression } from '../altar/types'
import { useUser } from './UserContext'

/** Fired on window whenever progression changes, so non-React code can listen */
export const PROGRESSION_UPDATED_EVENT = 'esoterica-progression-updated'

interface ProgressionContextType {
  progression: Progression
  /** Grant XP and persist to localStorage + Supabase. Returns actual points earned. */
  grantXp: (rawPoints: number, source: ProgressSource) => number
  /** Force re-read progression from localStorage (e.g. after altar ritual completes) */
  reload: () => void
}

const ProgressionContext = createContext<ProgressionContextType | undefined>(undefined)

export function ProgressionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [progression, setProgression] = useState<Progression>(() => loadLocalState().progression)

  // Sync from localStorage when user changes or on mount
  useEffect(() => {
    setProgression(loadLocalState().progression)
  }, [user?.id])

  const reload = useCallback(() => {
    setProgression(loadLocalState().progression)
  }, [])

  // Listen for external progression changes (e.g. from altarStore direct calls)
  useEffect(() => {
    const handler = () => setProgression(loadLocalState().progression)
    window.addEventListener(PROGRESSION_UPDATED_EVENT, handler)
    return () => window.removeEventListener(PROGRESSION_UPDATED_EVENT, handler)
  }, [])

  const grantXp = useCallback((rawPoints: number, source: ProgressSource): number => {
    const state = loadLocalState()
    const result = addProgressPoints(state.progression, rawPoints, source)
    const newState: AltarStoreState = { ...state, progression: result.progression }
    saveLocalState(newState)
    setProgression(result.progression)

    // Persist to DB in background
    if (user?.id) {
      syncProgressionToDb(user.id, result.progression).catch(() => {})
    }

    // Notify external listeners
    window.dispatchEvent(new Event(PROGRESSION_UPDATED_EVENT))

    return result.pointsEarned
  }, [user?.id])

  return (
    <ProgressionContext.Provider value={{ progression, grantXp, reload }}>
      {children}
    </ProgressionContext.Provider>
  )
}

export function useProgression() {
  const ctx = useContext(ProgressionContext)
  if (!ctx) throw new Error('useProgression must be used within ProgressionProvider')
  return ctx
}
