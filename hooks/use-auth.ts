'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseUser, listenToAuthStateChange } from '@/lib/auth-supabase'

interface User {
  id: string
  email: string
  usuario_id?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let subscription: any

    const initAuth = async () => {
      try {
        // First, try to get existing session
        const currentUser = await getSupabaseUser()
        if (mounted) {
          setUser(currentUser)
        }
      } catch (err) {
        console.error('[v0] Auth init error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Auth error')
        }
      }

      // Then subscribe to future changes
      subscription = listenToAuthStateChange((authUser) => {
        if (mounted) {
          setUser(authUser)
          setIsLoading(false)
        }
      })
    }

    initAuth()

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  return { user, isLoading, error }
}
