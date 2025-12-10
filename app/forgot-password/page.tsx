"use client"

import type React from "react"
import { useState } from "react"
import { resetPasswordForEmail } from "@/lib/auth-supabase"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

export const dynamic = "force-dynamic"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      if (!email) {
        setError("Por favor, insira seu e-mail")
        setIsLoading(false)
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError("Por favor, insira um e-mail válido")
        setIsLoading(false)
        return
      }

      await resetPasswordForEmail(email)

      setSuccessMessage(
        "Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha em alguns minutos. Verifique também sua caixa de spam.",
      )
      setEmail("")
    } catch (err: any) {
      setError("Não foi possível enviar o e-mail de recuperação. Tente novamente em alguns instantes.")
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
            <h1 className="text-2xl font-bold text-foreground mb-2">Esqueceu a senha?</h1>
            <p className="text-muted-foreground text-sm">
              Insira seu e-mail e enviaremos instruções para redefinir sua senha
            </p>
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
              <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>Enviando...</>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Enviar E-mail de Recuperação
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center border-t border-border pt-6">
            <Link
              href="/login"
              className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
