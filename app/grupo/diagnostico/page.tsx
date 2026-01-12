"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function DiagnosticoPage() {
  const router = useRouter()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostic = async () => {
    setLoading(true)
    const diagnostico: any = {
      authenticated: false,
      userId: null,
      userEmail: null,
      tablesExist: {},
      canInsert: {},
      realtimeEnabled: false,
      errors: [],
    }

    try {
      const supabase = createClient()

      // 1. Verificar autenticação
      const {
        data: { session },
      } = await supabase.auth.getSession()
      diagnostico.authenticated = !!session
      diagnostico.userId = session?.user?.id || null
      diagnostico.userEmail = session?.user?.email || null

      // 2. Verificar tabelas
      const tables = [
        "group_study_rooms",
        "group_study_participants",
        "group_study_room_questions",
        "group_study_chat",
        "group_study_answers",
      ]
      for (const table of tables) {
        const { error } = await supabase.from(table).select("id").limit(1)
        const shortName = table.replace("group_study_", "")
        diagnostico.tablesExist[shortName] = !error
        if (error) diagnostico.errors.push(`Tabela ${table}: ${error.message}`)
      }

      // 3. Testar inserção de sala
      if (session?.user?.id) {
        const testCode = "TEST" + Math.random().toString(36).substring(2, 4).toUpperCase()
        const { data: room, error: roomError } = await supabase
          .from("group_study_rooms")
          .insert({ room_code: testCode, host_user_id: session.user.id, question_count: 25, status: "open" })
          .select()
          .single()

        diagnostico.canInsert.rooms = !roomError
        if (roomError) diagnostico.errors.push(`Insert rooms: ${roomError.message}`)

        // 4. Testar inserção de participante
        if (room?.id) {
          const userName = session.user.email?.split("@")[0] || "Usuario"
          const { error: participantError } = await supabase
            .from("group_study_participants")
            .insert({ room_id: room.id, user_id: session.user.id, user_name: userName, is_host: true })

          diagnostico.canInsert.participants = !participantError
          if (participantError) diagnostico.errors.push(`Insert participants: ${participantError.message}`)

          // Limpar dados de teste
          await supabase.from("group_study_participants").delete().eq("room_id", room.id)
          await supabase.from("group_study_rooms").delete().eq("id", room.id)
        }
      }

      // 5. Verificar Realtime
      const channel = supabase.channel("test-realtime")
      diagnostico.realtimeEnabled = !!channel
      supabase.removeChannel(channel)
    } catch (err: any) {
      diagnostico.errors.push(`Erro crítico: ${err.message}`)
    }

    setResults(diagnostico)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Diagnóstico - Estudo em Grupo</h1>

        <div className="flex gap-4 mb-8">
          <Button onClick={runDiagnostic} disabled={loading}>
            {loading ? "Executando..." : "Executar Diagnóstico"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/grupo")}>
            Voltar
          </Button>
        </div>

        {results && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Resultados:</h2>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">{JSON.stringify(results, null, 2)}</pre>

            {results.errors.length === 0 && results.canInsert.rooms && results.canInsert.participants && (
              <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
                <p className="text-green-500 font-semibold">Tudo funcionando corretamente!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Você pode criar e entrar em salas de estudo em grupo.
                </p>
              </div>
            )}

            {results.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-500 font-semibold">Problemas encontrados:</p>
                <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
                  {results.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
