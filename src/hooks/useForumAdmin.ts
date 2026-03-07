import { useEffect, useState } from 'react'

export function useForumAdmin(userId: string | undefined) {
  const [isForumAdmin, setIsForumAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      console.log('useForumAdmin: No userId provided')
      setLoading(false)
      return
    }

    loadAdminStatus()
  }, [userId])

  async function loadAdminStatus() {
    try {
      console.log('🔍 Loading admin status for user:', userId)
      
      // Проверяем localStorage
      const isAdmin = localStorage.getItem(`forum_admin_${userId}`) === 'true'
      console.log(`👤 User ${userId} - Admin from localStorage: ${isAdmin}`)
      setIsForumAdmin(isAdmin)
    } catch (e: any) {
      console.error('❌ Failed to load admin status:', e)
      setIsForumAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  return { isForumAdmin, loading }
}

