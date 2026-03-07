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

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return
      if (error) {
        console.error('Failed to get Supabase session:', error)
      }
      const authUser = data.session?.user
      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const meta = await loadProfileMeta(authUser.id)

      setUser({
        id: authUser.id,
        email: authUser.email,
        displayName:
          authUser.user_metadata?.display_name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split('@')[0],
        archetype: meta.archetype,
        tradition: meta.tradition,
      })
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user
      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const meta = await loadProfileMeta(authUser.id)
      setUser({
        id: authUser.id,
        email: authUser.email,
        displayName:
          authUser.user_metadata?.display_name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split('@')[0],
        archetype: meta.archetype,
        tradition: meta.tradition,
      })
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, isAuthenticated: !!user }
}
