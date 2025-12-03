"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

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

const AssinaturasContent = dynamic(() => import("./assinaturas-content"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando assinaturas...</p>
      </div>
    </div>
  ),
})

export default function AssinaturasPage() {
  return <AssinaturasContent />
}
