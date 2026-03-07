import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface User {
  id: string
  email?: string
  displayName?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        console.error('Failed to get Supabase session:', error)
      }
      const authUser = data.session?.user
      setUser(
        authUser
          ? {
              id: authUser.id,
              email: authUser.email,
              displayName:
                authUser.user_metadata?.display_name ||
                authUser.user_metadata?.full_name ||
                authUser.email?.split('@')[0],
            }
          : null
      )
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user
      setUser(
        authUser
          ? {
              id: authUser.id,
              email: authUser.email,
              displayName:
                authUser.user_metadata?.display_name ||
                authUser.user_metadata?.full_name ||
                authUser.email?.split('@')[0],
            }
          : null
      )
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, isAuthenticated: !!user }
}
