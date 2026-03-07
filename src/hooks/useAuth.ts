import { useState, useEffect } from 'react'
// import { blink } from '../blink/client' // removed

interface User {
  id: string
  email?: string
  displayName?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // const unsubscribe = blink.auth.onAuthStateChanged((state) => { // removed
      setUser(state.user as User | null)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  return { user, loading, isAuthenticated: !!user }
}
