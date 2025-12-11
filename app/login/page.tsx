"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInSupabase, signUpSupabase, sendPasswordResetOTP, verifyOTPAndResetPassword } from "@/lib/auth-supabase"
import { registerDeviceSession } from "@/lib/storage-supabase"
import { getDeviceInfo, storeDeviceId } from "@/lib/device-utils"
import Image from "next/image"
import { ArrowRight, Mail, Key, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)

  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError("Por favor, preencha todos os campos obrigatórios")
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres")
        setIsLoading(false)
        return
      }

      const user = await signUpSupabase(email, password)

      if (user) {
        try {
          const deviceInfo = getDeviceInfo()
          storeDeviceId(deviceInfo.deviceId)
          await registerDeviceSession(user.id, email, deviceInfo)
        } catch (err) {
          // Non-critical error, continue
        }

        setSuccessMessage("Conta criada com sucesso! Redirecionando para o painel...")
        setTimeout(() => router.push("/dashboard"), 1500)
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError("Por favor, preencha todos os campos")
        setIsLoading(false)
        return
      }

      const user = await signInSupabase(email, password)

      if (user) {
        try {
          const deviceInfo = getDeviceInfo()
          storeDeviceId(deviceInfo.deviceId)
          await registerDeviceSession(user.id, email, deviceInfo)
        } catch (err) {
          // Non-critical error, continue
        }

        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Falha na autenticação")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setForgotPasswordLoading(true)

    try {
      if (!forgotEmail) {
        setError("Por favor, insira seu e-mail")
        setForgotPasswordLoading(false)
        return
      }

      const result = await sendPasswordResetOTP(forgotEmail)

      if (result.success) {
        setOtpSent(true)
        setSuccessMessage("Código enviado para seu e-mail! Verifique sua caixa de entrada.")
      } else {
        setError(result.error || "Erro ao enviar código")
      }
    } catch (err: any) {
      setError(err.message || "Erro ao enviar código")
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleVerifyOTPAndReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setForgotPasswordLoading(true)

    try {
      if (!otpCode || !newPassword || !confirmPassword) {
        setError("Por favor, preencha todos os campos")
        setForgotPasswordLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setError("As senhas não coincidem")
        setForgotPasswordLoading(false)
        return
      }

      if (newPassword.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres")
        setForgotPasswordLoading(false)
        return
      }

      const result = await verifyOTPAndResetPassword(forgotEmail, otpCode, newPassword)

      if (result.success) {
        setSuccessMessage("Senha alterada com sucesso! Você pode fazer login agora.")
        setTimeout(() => {
          setShowForgotPassword(false)
          setOtpSent(false)
          setForgotEmail("")
          setOtpCode("")
          setNewPassword("")
          setConfirmPassword("")
          setSuccessMessage("")
        }, 2000)
      } else {
        setError(result.error || "Erro ao verificar código e alterar senha")
      }
    } catch (err: any) {
      setError(err.message || "Erro ao verificar código e alterar senha")
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const resetForgotPassword = () => {
    setShowForgotPassword(false)
    setOtpSent(false)
    setForgotEmail("")
    setOtpCode("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setSuccessMessage("")
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
            <p className="text-muted-foreground text-sm mt-1">Domine o aprendizado com repetição espaçada</p>
          </div>

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
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

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome (Opcional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Seu nome"
                />
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              {isSignUp && <p className="text-xs text-muted-foreground mt-1">Mínimo de 6 caracteres</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>Processando...</>
              ) : isSignUp ? (
                <>
                  <Mail className="w-4 h-4" />
                  Criar Conta
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border pt-6">
            {isSignUp ? (
              <>
                Já tem uma conta?{" "}
                <button
                  onClick={() => {
                    setIsSignUp(false)
                    setError("")
                    setSuccessMessage("")
                    setName("")
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Entrar
                </button>
              </>
            ) : (
              <>
                Não tem uma conta?{" "}
                <button
                  onClick={() => {
                    setIsSignUp(true)
                    setError("")
                    setSuccessMessage("")
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Criar Conta
                </button>
              </>
            )}
          </div>

          {!isSignUp && (
            <div className="mt-4 text-center">
              <button onClick={() => setShowForgotPassword(true)} className="text-sm text-primary hover:underline">
                Esqueceu sua senha?
              </button>
            </div>
          )}

          {/* Info message */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Importante:</strong> Apenas usuários que realizaram o pagamento na plataforma Cakto podem se
              cadastrar. Seu e-mail será validado automaticamente.
            </p>
          </div>
        </div>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl border border-border p-6 w-full max-w-md relative">
            <button
              onClick={resetForgotPassword}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-foreground mb-4">Recuperar Senha</h2>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-md text-accent text-sm">
                {successMessage}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="seu@email.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enviaremos um código de verificação para seu e-mail
                  </p>
                </div>

                <Button type="submit" disabled={forgotPasswordLoading} className="w-full">
                  {forgotPasswordLoading ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Código
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTPAndReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Código de Verificação</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="00000000"
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite o código de 8 dígitos enviado para {forgotEmail}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Mínimo de 6 caracteres</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOtpSent(false)}
                    disabled={forgotPasswordLoading}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button type="submit" disabled={forgotPasswordLoading} className="flex-1">
                    {forgotPasswordLoading ? (
                      <>Verificando...</>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
