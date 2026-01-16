"use client"

import type React from "react"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser, signOutSupabase } from "@/lib/auth-supabase"
import { checkSessionActive } from "@/lib/storage-supabase"
import { getStoredDeviceId } from "@/lib/device-utils"

interface SessionGuardProps {
  children: React.ReactNode
}

export function SessionGuard({ children }: SessionGuardProps) {
  const router = useRouter()

  const checkSession = useCallback(async () => {
    try {
      const user = await getSupabaseUser()
      if (!user) return

      const deviceId = getStoredDeviceId()
      if (!deviceId) return

      const isActive = await checkSessionActive(user.id, deviceId)

      if (!isActive) {
        // Sessão foi encerrada por outro dispositivo
        await signOutSupabase()
        router.push("/login?reason=session_expired")
      }
    } catch (error) {
      console.error("Error checking session:", error)
    }
  }, [router])

  useEffect(() => {
    // Verificar imediatamente ao montar
    checkSession()

    // Verificar a cada 30 segundos
    const interval = setInterval(checkSession, 30000)

    // Verificar quando a aba volta ao foco
    const handleFocus = () => {
      checkSession()
    }
    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
    }
  }, [checkSession])

  return <>{children}</>
}
