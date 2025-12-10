"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { updatePassword } from "@/lib/auth-supabase"
import Image from "next/image"
import { ArrowRight, Lock } from "lucide-react"

export const dynamic = "force-dynamic"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      if (!password || !confirmPassword) {
        setError("Por favor, preencha todos os campos")
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres")
        setIsLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError("As senhas não coincidem")
        setIsLoading(false)
        return
      }

      await updatePassword(password)

      setSuccessMessage("Sua senha foi redefinida com sucesso! Redirecionando para o login...")
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: any) {
      const errorMessage =
        err.message?.includes("session") || err.message?.includes("token") || err.message?.includes("autenticado")
          ? "Link inválido ou expirado. Solicite uma nova recuperação de senha."
          : err.message || "Erro ao alterar senha. Tente novamente."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <Image
                src="/images/logo.png"
                alt="Bora Revalidar"
                width={300}
                height={120}
                className="mx-auto"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Criar Nova Senha</h1>
            <p className="text-muted-foreground text-sm">Insira sua nova senha abaixo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-md text-accent text-sm">
                {successMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nova Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">Mínimo de 6 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>Processando...</>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Alterar Senha
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
