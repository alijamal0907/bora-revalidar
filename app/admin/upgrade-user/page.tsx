"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

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
      // Verifica se já existe assinatura
      const { data: existente } = await supabase.from("assinaturas").select("*").eq("email", email).single()

      if (existente) {
        // Atualiza para premium
        const { error: updateError } = await supabase
          .from("assinaturas")
          .update({
            status: "ativo",
            plano: "premium",
            data_pagamento: new Date().toISOString(),
          })
          .eq("email", email)

        if (updateError) {
          setMessage(`❌ Erro ao atualizar: ${updateError.message}`)
        } else {
          setMessage(`✅ Usuário ${email} atualizado para PREMIUM com sucesso!`)
        }
      } else {
        // Cria nova assinatura premium
        const { error: insertError } = await supabase.from("assinaturas").insert({
          email,
          nome: email.split("@")[0],
          status: "ativo",
          plano: "premium",
          data_cadastro: new Date().toISOString(),
          data_pagamento: new Date().toISOString(),
        })

        if (insertError) {
          setMessage(`❌ Erro ao criar: ${insertError.message}`)
        } else {
          setMessage(`✅ Nova assinatura PREMIUM criada para ${email}!`)
        }
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
        <h1 className="text-3xl font-bold text-foreground mb-8">Admin - Atualizar Usuário para Premium</h1>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email do Usuário</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
            />
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Atualizando..." : "Atualizar para Premium"}
          </button>

          {message && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-foreground">{message}</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
          <h2 className="text-lg font-bold text-yellow-600 mb-2">⚠️ Importante - Configurar Webhook da Cakto</h2>
          <p className="text-sm text-foreground mb-2">Para o upgrade automático funcionar, configure na Cakto:</p>
          <code className="block bg-background p-2 rounded text-sm mb-2">
            {typeof window !== "undefined"
              ? `${window.location.origin}/api/webhook-cakto`
              : "https://seu-dominio.vercel.app/api/webhook-cakto"}
          </code>
          <p className="text-sm text-muted-foreground">
            Após configurar, os pagamentos atualizarão automaticamente o plano para premium.
          </p>
        </div>
      </div>
    </div>
  )
}
