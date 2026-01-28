"use client"

export const dynamic = "force-dynamic"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggleButton } from "@/components/theme-toggle-button"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/login")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 relative">
      {/* Botão de alternância de tema no canto superior direito */}
      <div className="absolute top-4 right-4">
        <ThemeToggleButton />
      </div>

      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary">Bora Revalidar</h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
        <p className="text-muted-foreground mt-4">Redirecionando para login...</p>
      </div>
    </div>
  )
}
