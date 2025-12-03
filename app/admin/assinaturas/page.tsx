"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"

interface Assinatura {
  id: string
  email: string
  nome: string | null
  status: string
  data_cadastro: string
  data_pagamento: string | null
  transaction_id: string | null
  created_at: string
}

export default function AssinaturasPage() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [migrationSuccess, setMigrationSuccess] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    const initSupabase = async () => {
      const { createClient } = await import("@/lib/supabase/client")
      setSupabase(createClient())
    }
    initSupabase()
  }, [])

  const loadAssinaturas = async () => {
    if (!supabase) return

    setLoading(true)
    setError("")

    try {
      const { data, error: fetchError } = await supabase
        .from("assinaturas")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        setError("Erro ao carregar assinaturas: " + fetchError.message)
        return
      }

      setAssinaturas(data || [])
      setMigrationSuccess(true)
    } catch (err: any) {
      setError("Erro ao carregar assinaturas: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (supabase) {
      loadAssinaturas()
    }
  }, [supabase])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("pt-BR")
  }

  const getPlanBadge = (assinatura: Assinatura) => {
    if (assinatura.transaction_id || assinatura.data_pagamento) {
      return <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">PREMIUM</span>
    }
    return <span className="px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded">FREE</span>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Assinaturas Cadastradas</h1>
          </div>
          <button
            onClick={loadAssinaturas}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {migrationSuccess && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-green-600 mb-2">✅ Migração Concluída com Sucesso!</h3>
            <p className="text-green-700 text-sm">
              Todos os usuários existentes foram adicionados à tabela assinaturas. Novos cadastros serão automaticamente
              registrados com plano FREE.
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Carregando assinaturas...</p>
          </div>
        ) : assinaturas.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                Total de usuários cadastrados: <span className="font-bold text-foreground">{assinaturas.length}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Usuários FREE:{" "}
                <span className="font-bold text-foreground">
                  {assinaturas.filter((a) => !a.transaction_id && !a.data_pagamento).length}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Usuários PREMIUM:{" "}
                <span className="font-bold text-foreground">
                  {assinaturas.filter((a) => a.transaction_id || a.data_pagamento).length}
                </span>
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Plano</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Data Cadastro
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Data Pagamento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Transaction ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {assinaturas.map((assinatura) => (
                      <tr key={assinatura.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground">{assinatura.email}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{assinatura.nome || "-"}</td>
                        <td className="px-4 py-3 text-sm">{getPlanBadge(assinatura)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              assinatura.status === "ativo"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            {assinatura.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(assinatura.data_cadastro)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(assinatura.data_pagamento)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono text-xs">
                          {assinatura.transaction_id || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
