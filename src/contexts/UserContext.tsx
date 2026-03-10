import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface AppUser {
  id: string
  email?: string
  displayName?: string
  archetype?: string
  tradition?: string
}

interface UserContextType {
  user: AppUser | null
  loading: boolean
  isAuthenticated: boolean
  /** Refresh profile metadata (archetype, tradition, displayName) from Supabase */
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

async function loadProfileMeta(userId: string) {
  try {
    const { data, error } = await supabase
      .from('userProfiles')
      .select('archetype, tradition, displayName')
      .eq('userId', userId)
      .maybeSingle()
    if (error) return {}
    return {
      archetype: data?.archetype as string | undefined,
      tradition: data?.tradition as string | undefined,
      displayName: data?.displayName as string | undefined,
    }
  } catch {
    return {}
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const buildBaseUser = (authUser: any): AppUser => ({
    id: authUser.id,
    email: authUser.email,
    displayName:
      authUser.user_metadata?.display_name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0],
  })

  const enrichWithProfileMeta = useCallback(async (baseUser: AppUser) => {
    const meta = await loadProfileMeta(baseUser.id)
    setUser(prev => {
      if (!prev || prev.id !== baseUser.id) return prev
      return {
        ...prev,
        archetype: meta.archetype ?? prev.archetype,
        tradition: meta.tradition ?? prev.tradition,
        displayName: meta.displayName ?? prev.displayName,
      }
    })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await enrichWithProfileMeta(user)
  }, [user, enrichWithProfileMeta])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!mounted) return
        if (error) { setUser(null); return }

        const authUser = data.session?.user
        if (!authUser) { setUser(null); return }

        const baseUser = buildBaseUser(authUser)
        setUser(baseUser)
        void enrichWithProfileMeta(baseUser)
      } catch {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user
      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }
      const baseUser = buildBaseUser(authUser)
      setUser(baseUser)
      void enrichWithProfileMeta(baseUser)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [enrichWithProfileMeta])

  return (
    <UserContext.Provider value={{ user, loading, isAuthenticated: !!user, refreshProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
