import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface User {
  id: string
  email?: string
  displayName?: string
  archetype?: string
  tradition?: string
}

async function loadProfileMeta(userId: string) {
  try {
    const { data, error } = await supabase
      .from('userProfiles')
      .select('archetype, tradition')
      .eq('userId', userId)
      .maybeSingle()

    if (error) {
      console.warn('Failed to load profile meta:', error.message)
      return { archetype: undefined, tradition: undefined }
    }

    return {
      archetype: data?.archetype as string | undefined,
      tradition: data?.tradition as string | undefined,
    }
  } catch (error) {
    console.warn('Failed to load profile meta:', error)
    return { archetype: undefined, tradition: undefined }
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const buildBaseUser = (authUser: any): User => ({
      id: authUser.id,
      email: authUser.email,
      displayName:
        authUser.user_metadata?.display_name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split('@')[0],
    })

    const enrichWithProfileMeta = async (baseUser: User) => {
      const meta = await loadProfileMeta(baseUser.id)
      if (!mounted) return
      setUser({ ...baseUser, archetype: meta.archetype, tradition: meta.tradition })
    }

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!mounted) return

        if (error) {
          console.error('Failed to get Supabase session:', error)
          setUser(null)
          return
        }

        const authUser = data.session?.user
        if (!authUser) {
          setUser(null)
          return
        }

        const baseUser = buildBaseUser(authUser)
        setUser(baseUser)
        void enrichWithProfileMeta(baseUser)
      } catch (error) {
        console.error('Auth init failed:', error)
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
  }, [])

  return { user, loading, isAuthenticated: !!user }
}
