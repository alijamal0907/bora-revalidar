"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const router = useRouter()
  const { user, isLoading, error } = useAuth()

  useEffect(() => {
    if (error) {
      console.error("[Home] Auth error:", error)
      router.push("/login")
      return
    }

    if (!isLoading) {
      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, isLoading, error, router])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Erro de Inicialização</h1>
          <p className="text-muted-foreground mb-4">
            Não foi possível inicializar o aplicativo. Verifique sua conexão e tente novamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Recarregar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-orange-600 dark:text-orange-400">Bora Revalidar</h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></div>
        </div>
        <p className="text-muted-foreground mt-4">Carregando...</p>
      </div>
    </div>
  )
}
