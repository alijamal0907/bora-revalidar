"use client"

import { useState } from "react"
import Link from "next/link"

export default function AdminUpgradeUser() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleUpgrade = async () => {
    if (!email || !email.includes("@")) {
      setMessage("❌ Email inválido")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/webhook-cakto/sync-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          secret: "admin-upgrade",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(
          `✅ Usuário ${email} atualizado para PREMIUM com sucesso! O usuário precisa fazer logout e login novamente.`,
        )
        setEmail("")
      } else {
        setMessage(`❌ Erro: ${data.error}`)
      }
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-primary hover:underline">
            ← Voltar ao Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Admin - Atualizar Usuário para Premium</h1>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email do Usuário</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Atualizando..." : "Atualizar para Premium"}
          </button>

          {message && (
            <div className="p-4 bg-muted rounded-lg border border-border">
              <p className="text-foreground">{message}</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
          <h2 className="text-lg font-bold text-yellow-600 mb-2">⚠️ Importante - Webhook Configurado</h2>
          <p className="text-sm text-foreground mb-2">
            O webhook da Cakto já está configurado e funcionando automaticamente em:
          </p>
          <code className="block bg-background p-2 rounded text-sm mb-2 text-primary">
            {typeof window !== "undefined"
              ? `${window.location.origin}/api/webhook-cakto`
              : "https://seu-dominio.vercel.app/api/webhook-cakto"}
          </code>
          <p className="text-sm text-muted-foreground">
            Novos pagamentos atualizarão automaticamente o plano para premium. Use esta página apenas para corrigir
            usuários que pagaram antes do webhook ser configurado.
          </p>
        </div>
      </div>
    </div>
  )
}
