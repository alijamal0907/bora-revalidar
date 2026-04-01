"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Users, Plus, LogIn, Crown, ChevronDown, ChevronRight, Check, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getUserProfile } from "@/lib/storage-supabase"
import { 
  createGroupRoom, 
  joinGroupRoom, 
  debugGroupStudySetup, 
  getSubtemasByTema, 
  countQuestionsByFilters,
  type AreaSubtemaSelection 
} from "@/lib/group-study"
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
  
  // Estados para seleção de área e subtemas
  const [useAreaFilter, setUseAreaFilter] = useState(false)
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set())
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set())
  const [selectedSubtemas, setSelectedSubtemas] = useState<Map<string, Set<string>>>(new Map())
  const [subtemasByArea, setSubtemasByArea] = useState<Map<string, Array<{ subtema: string; subtema_slug: string }>>>(new Map())
  const [loadingSubtemas, setLoadingSubtemas] = useState<Set<string>>(new Set())
  const [availableQuestionCount, setAvailableQuestionCount] = useState<number | null>(null)
  const [countingQuestions, setCountingQuestions] = useState(false)

  // Grandes áreas disponíveis
  const GRANDES_AREAS = [
    "Clínica Médica",
    "Clínica Cirúrgica", 
    "Pediatria",
    "Ginecologia e Obstetrícia",
    "Medicina Preventiva"
  ]

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

    // Validar seleção se filtro estiver ativo
    if (useAreaFilter && selectedAreas.size === 0) {
      setError("Selecione pelo menos uma área para criar o simulado.")
      return
    }

    setLoading(true)
    setError("")

    // Construir filtros de seleção
    const selections = buildSelections()
    console.log("[v0] Iniciando criação de sala:", { userId, questionCount, selections })

    try {
      const result = await createGroupRoom(userId, questionCount, selections)

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

  // Função para expandir/colapsar uma área
  const toggleAreaExpand = async (area: string) => {
    const newExpanded = new Set(expandedAreas)
    
    if (newExpanded.has(area)) {
      newExpanded.delete(area)
    } else {
      newExpanded.add(area)
      
      // Carregar subtemas se ainda não carregou
      if (!subtemasByArea.has(area)) {
        setLoadingSubtemas(prev => new Set(prev).add(area))
        try {
          const subtemas = await getSubtemasByTema(area)
          setSubtemasByArea(prev => new Map(prev).set(area, subtemas))
        } catch (err) {
          console.error("Erro ao carregar subtemas:", err)
        } finally {
          setLoadingSubtemas(prev => {
            const next = new Set(prev)
            next.delete(area)
            return next
          })
        }
      }
    }
    
    setExpandedAreas(newExpanded)
  }

  // Função para selecionar/deselecionar uma área inteira
  const toggleAreaSelection = (area: string) => {
    const newSelected = new Set(selectedAreas)
    
    if (newSelected.has(area)) {
      newSelected.delete(area)
      // Limpar subtemas selecionados desta área
      setSelectedSubtemas(prev => {
        const next = new Map(prev)
        next.delete(area)
        return next
      })
    } else {
      newSelected.add(area)
    }
    
    setSelectedAreas(newSelected)
  }

  // Função para selecionar/deselecionar um subtema
  const toggleSubtemaSelection = (area: string, subtema: string) => {
    setSelectedSubtemas(prev => {
      const next = new Map(prev)
      const areaSubtemas = next.get(area) || new Set()
      const newAreaSubtemas = new Set(areaSubtemas)
      
      if (newAreaSubtemas.has(subtema)) {
        newAreaSubtemas.delete(subtema)
      } else {
        newAreaSubtemas.add(subtema)
      }
      
      if (newAreaSubtemas.size === 0) {
        next.delete(area)
      } else {
        next.set(area, newAreaSubtemas)
      }
      
      return next
    })
    
    // Garantir que a área está selecionada se tiver subtemas
    if (!selectedAreas.has(area)) {
      setSelectedAreas(prev => new Set(prev).add(area))
    }
  }

  // Construir seleções para a API
  const buildSelections = (): AreaSubtemaSelection[] => {
    if (!useAreaFilter || selectedAreas.size === 0) {
      return []
    }
    
    return Array.from(selectedAreas).map(area => ({
      tema: area,
      subtemas: Array.from(selectedSubtemas.get(area) || [])
    }))
  }

  // Contar questões disponíveis quando a seleção muda
  useEffect(() => {
    const updateCount = async () => {
      if (!useAreaFilter || selectedAreas.size === 0) {
        setAvailableQuestionCount(null)
        return
      }
      
      setCountingQuestions(true)
      try {
        const selections = buildSelections()
        const count = await countQuestionsByFilters(selections)
        setAvailableQuestionCount(count)
      } catch (err) {
        console.error("Erro ao contar questões:", err)
        setAvailableQuestionCount(null)
      } finally {
        setCountingQuestions(false)
      }
    }
    
    const timeoutId = setTimeout(updateCount, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [useAreaFilter, selectedAreas, selectedSubtemas])

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

            <div className="space-y-6">
              {/* Quantidade de Questões */}
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

              {/* Toggle para filtro por área */}
              <div className="border border-border rounded-lg p-4">
                <button
                  onClick={() => {
                    setUseAreaFilter(!useAreaFilter)
                    if (useAreaFilter) {
                      // Limpar seleções ao desativar
                      setSelectedAreas(new Set())
                      setSelectedSubtemas(new Map())
                      setExpandedAreas(new Set())
                      setAvailableQuestionCount(null)
                    }
                  }}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Selecionar por Área e Subtemas</p>
                      <p className="text-sm text-muted-foreground">
                        Escolha áreas e subtemas específicos
                      </p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors ${useAreaFilter ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${useAreaFilter ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </div>
                </button>
              </div>

              {/* Seleção de Áreas e Subtemas */}
              {useAreaFilter && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Grandes Áreas</p>
                    {countingQuestions ? (
                      <span className="text-xs text-muted-foreground">Contando...</span>
                    ) : availableQuestionCount !== null ? (
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {availableQuestionCount} questões disponíveis
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {GRANDES_AREAS.map((area) => {
                      const isExpanded = expandedAreas.has(area)
                      const isSelected = selectedAreas.has(area)
                      const areaSubtemas = subtemasByArea.get(area) || []
                      const selectedCount = selectedSubtemas.get(area)?.size || 0
                      const isLoading = loadingSubtemas.has(area)

                      return (
                        <div key={area} className="border border-border rounded-lg overflow-hidden">
                          {/* Cabeçalho da Área */}
                          <div className="flex items-center bg-muted/30">
                            <button
                              onClick={() => toggleAreaExpand(area)}
                              className="flex-1 flex items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="font-medium">{area}</span>
                              {selectedCount > 0 && (
                                <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                                  {selectedCount} subtema{selectedCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => toggleAreaSelection(area)}
                              className={`p-3 border-l border-border hover:bg-muted/50 transition-colors ${
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              }`}
                              title={isSelected ? 'Desmarcar área' : 'Marcar toda a área'}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </button>
                          </div>

                          {/* Lista de Subtemas */}
                          {isExpanded && (
                            <div className="border-t border-border bg-background">
                              {isLoading ? (
                                <div className="p-4 text-center">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
                                  <p className="text-xs text-muted-foreground mt-2">Carregando subtemas...</p>
                                </div>
                              ) : areaSubtemas.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  Nenhum subtema encontrado
                                </div>
                              ) : (
                                <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto">
                                  {areaSubtemas.map((subtema) => {
                                    const isSubtemaSelected = selectedSubtemas.get(area)?.has(subtema.subtema) || false
                                    
                                    return (
                                      <button
                                        key={subtema.subtema_slug}
                                        onClick={() => toggleSubtemaSelection(area, subtema.subtema)}
                                        className={`w-full flex items-center gap-2 p-2 rounded text-left text-sm transition-colors ${
                                          isSubtemaSelected 
                                            ? 'bg-primary/10 text-primary' 
                                            : 'hover:bg-muted/50 text-foreground'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                                          isSubtemaSelected 
                                            ? 'border-primary bg-primary' 
                                            : 'border-muted-foreground'
                                        }`}>
                                          {isSubtemaSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                        <span className="line-clamp-1">{subtema.subtema}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Resumo da seleção */}
                  {selectedAreas.size > 0 && (
                    <div className="bg-muted/30 rounded-lg p-3 text-sm">
                      <p className="font-medium mb-1">Seleção atual:</p>
                      <div className="space-y-1">
                        {Array.from(selectedAreas).map(area => {
                          const subtemas = selectedSubtemas.get(area)
                          return (
                            <div key={area} className="text-muted-foreground">
                              <span className="text-foreground">{area}</span>
                              {subtemas && subtemas.size > 0 ? (
                                <span> ({subtemas.size} subtema{subtemas.size > 1 ? 's' : ''})</span>
                              ) : (
                                <span> (todos os subtemas)</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Aviso se não há questões suficientes */}
              {useAreaFilter && availableQuestionCount !== null && availableQuestionCount < questionCount && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-600 dark:text-yellow-400">
                  Atenção: Há apenas {availableQuestionCount} questões disponíveis para a seleção atual. 
                  O simulado terá no máximo {availableQuestionCount} questões.
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    setMode("menu")
                    setUseAreaFilter(false)
                    setSelectedAreas(new Set())
                    setSelectedSubtemas(new Map())
                    setExpandedAreas(new Set())
                  }} 
                  variant="outline" 
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateRoom} 
                  disabled={loading || (useAreaFilter && selectedAreas.size === 0)} 
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
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
                  placeholder="Digite o código da sala"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
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
                  disabled={loading || roomCode.length === 0}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUpgradeModal && <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />}
    </div>
  )
}
