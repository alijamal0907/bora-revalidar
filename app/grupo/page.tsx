"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Users, Plus, LogIn, Crown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getUserProfile } from "@/lib/storage-supabase"
import { createGroupRoom, joinGroupRoom, debugGroupStudySetup } from "@/lib/group-study"
import { UpgradeModal } from "@/components/upgrade-modal"

export default function GrupoPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu")
  const [questionCount, setQuestionCount] = useState(50)
  const [roomCode, setRoomCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    async function loadUser() {
      const profile = await getUserProfile()
      if (!profile) {
        router.push("/login")
        return
      }
      setUserId(profile.id)
      setIsPremium(profile.plan === "premium")
    }
    loadUser()
  }, [router])

  const handleCreateRoom = async () => {
    if (!isPremium) {
      setShowUpgradeModal(true)
      return
    }

    if (!userId) {
      setError("Usuário não identificado. Faça login novamente.")
      return
    }

    setLoading(true)
    setError("")

    console.log("[v0] Iniciando criação de sala:", { userId, questionCount })

    try {
      const result = await createGroupRoom(userId, questionCount)

      console.log("[v0] Resultado da criação:", result)

      if (result && result.room && result.code) {
        console.log("[v0] Navegando para sala:", `/grupo/${result.room.id}?code=${result.code}`)
        router.push(`/grupo/${result.room.id}?code=${result.code}`)
      } else {
        console.error("[v0] Resultado inválido:", result)
        setError("Erro ao criar sala. Verifique se as tabelas do banco de dados existem.")
        setLoading(false)
      }
    } catch (err) {
      console.error("[v0] Exceção ao criar sala:", err)
      setError("Erro inesperado ao criar sala. Tente novamente.")
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!isPremium) {
      setShowUpgradeModal(true)
      return
    }

    if (!userId || !roomCode.trim()) {
      setError("Digite o código da sala")
      return
    }

    setLoading(true)
    setError("")

    const room = await joinGroupRoom(userId, roomCode)

    if (room) {
      router.push(`/grupo/${room.id}`)
    } else {
      setError("Sala não encontrada ou já fechada")
    }

    setLoading(false)
  }

  const handleDebug = async () => {
    console.log("[v0] Iniciando diagnóstico...")
    const info = await debugGroupStudySetup()
    setDebugInfo(info)
    console.log("[v0] Diagnóstico completo:", info)
    alert(JSON.stringify(info, null, 2))
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <Button onClick={handleDebug} variant="outline" className="mb-4 w-full bg-transparent">
          🔍 Diagnóstico de Problemas
        </Button>

        {!isPremium && (
          <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-1">Recurso Premium</p>
                <p className="text-sm text-muted-foreground">
                  O Estudo em Grupo está disponível apenas para usuários Premium
                </p>
              </div>
              <Button
                onClick={() => setShowUpgradeModal(true)}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              >
                Upgrade
              </Button>
            </div>
          </div>
        )}

        {mode === "menu" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Estudo em Grupo</h1>
              <p className="text-muted-foreground">Estude com amigos em tempo real</p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setMode("create")}
                className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Criar Sala</h3>
                    <p className="text-sm text-muted-foreground">Inicie uma nova sessão de estudo</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode("join")}
                className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LogIn className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Entrar em Sala</h3>
                    <p className="text-sm text-muted-foreground">Junte-se a uma sessão existente</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === "create" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Criar Nova Sala</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantidade de Questões</label>
                <Input
                  type="number"
                  min="25"
                  max="100"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Entre 25 e 100 questões</p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setMode("menu")} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateRoom} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
                  {loading ? "Criando..." : "Criar Sala"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Entrar em Sala</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Código da Sala</label>
                <Input
                  type="text"
                  placeholder="Digite o código de 6 caracteres"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full text-center text-2xl font-mono tracking-widest"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setMode("menu")} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleJoinRoom}
                  disabled={loading || roomCode.length !== 6}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  )
}
