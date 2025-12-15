"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { Loader2 } from "lucide-react"

const ADMIN_EMAIL = "ali_jamal2002@hotmail.com"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAdmin() {
      try {
        const user = await getSupabaseUser()

        if (!user) {
          router.push("/login")
          return
        }

        if (user.email !== ADMIN_EMAIL) {
          router.push("/dashboard")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Error checking admin:", error)
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdmin()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
