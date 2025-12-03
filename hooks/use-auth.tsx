"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

let supabase: ReturnType<typeof createClient> | null = null

try {
  supabase = createClient()
} catch (error) {
  console.error("[useAuth] Failed to create Supabase client:", error)
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setError("Failed to initialize authentication")
      setIsLoading(false)
      return
    }

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("[useAuth] Error getting session:", err)
        setError("Failed to get session")
        setIsLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isLoading, error }
}
