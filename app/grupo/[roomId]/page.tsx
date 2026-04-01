"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Users, Clock, Copy, Send, Trophy, CheckCircle, XCircle, ArrowLeft, Play, BookOpen } from "lucide-react"
import { getSupabaseClient } from "@/lib/auth-supabase"
import {
  getRoomParticipants,
  startGroupRoom,
  saveGroupAnswer,
  sendChatMessage,
  getChatMessages,
  getRoomRanking,
  getUserWrongAnswers,
  getRandomQuestions,
  getQuestionsByFilters,
  type AreaSubtemaSelection,
} from "@/lib/group-study"
import { MessageCircle } from "lucide-react"

interface Question {
  pk: string
  id: string
  enunciado: string
  alternativaA: string
  alternativaB: string
  alternativaC: string
  alternativaD: string
  correta: string
  explicacao?: string
  materia?: string
  tema?: string
}

export default function GroupRoomPage() {
  const params = useParams()
  const roomId = params?.roomId as string
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [roomStatus, setRoomStatus] = useState<"open" | "closed" | "finished">("open")
  const [participants, setParticipants] = useState<any[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [roomQuestionCount, setRoomQuestionCount] = useState(10)
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<any[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [timer, setTimer] = useState(0)
  const [hostUserId, setHostUserId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [visitorName, setVisitorName] = useState<string | null>(null)
  const [localCorrect, setLocalCorrect] = useState(0)
  const [localWrong, setLocalWrong] = useState(0)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)

  const [isReviewMode, setIsReviewMode] = useState(false)
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewSelectedAnswer, setReviewSelectedAnswer] = useState<string | null>(null)
  const [reviewShowExplanation, setReviewShowExplanation] = useState(false)
  const [reviewCorrect, setReviewCorrect] = useState(0)
  const [reviewWrong, setReviewWrong] = useState(0)
  const [reviewFinished, setReviewFinished] = useState(false)
  const [isLoadingReview, setIsLoadingReview] = useState(false)
  const [filterSelections, setFilterSelections] = useState<AreaSubtemaSelection[] | null>(null)

  const isHost = useMemo(() => {
    return userId && hostUserId && userId === hostUserId
  }, [userId, hostUserId])

  useEffect(() => {
    async function getUser() {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || null)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    async function loadLobby() {
      const supabase = getSupabaseClient()

      if (!supabase) {
        setLoading(false)
        return
      }

      const { data: roomData, error: roomError } = await supabase
        .from("group_study_rooms")
        .select("status, host_user_id, question_count, room_code, filter_selections")
        .eq("id", roomId)
        .single()

      if (roomError || !roomData) {
        router.push("/grupo")
        return
      }

      setRoomStatus(roomData.status)
      setHostUserId(roomData.host_user_id)
      setRoomQuestionCount(roomData.question_count || 10)
      setRoomCode(roomData.room_code || roomId)
      
      // Carregar filtros se existirem
      if (roomData.filter_selections) {
        try {
          const selections = JSON.parse(roomData.filter_selections)
          setFilterSelections(selections)
          console.log("[v0] Filtros carregados:", selections)
        } catch (e) {
          console.error("[v0] Erro ao parsear filtros:", e)
        }
      }

      const roomParticipants = await getRoomParticipants(roomId)
      setParticipants(roomParticipants)

      setLoading(false)
    }

    loadLobby()
  }, [roomId, router])

  useEffect(() => {
    if (!userId) return

    const supabase = getSupabaseClient()

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_study_participants",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const updated = await getRoomParticipants(roomId)
          setParticipants(updated)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_study_rooms",
          filter: `id=eq.${roomId}`,
        },
        async (payload: any) => {
          if (payload.new?.status) {
            setRoomStatus(payload.new.status)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_study_chat",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const msgs = await getChatMessages(roomId)
          setChatMessages(msgs)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, roomId])

  const loadSimulationQuestions = useCallback(async () => {
    console.log("[v0] loadSimulationQuestions - Iniciando para sala:", roomId)
    setIsLoadingQuestions(true)
    const supabase = getSupabaseClient()

    const { data: roomQuestions, error: rqError } = await supabase
      .from("group_study_room_questions")
      .select("question_pk, question_order")
      .eq("room_id", roomId)
      .order("question_order", { ascending: true })

    console.log("[v0] roomQuestions:", { roomQuestions, rqError })

    if (rqError || !roomQuestions || roomQuestions.length === 0) {
      console.log("[v0] Nenhuma questão encontrada para a sala ou erro:", rqError)
      setIsLoadingQuestions(false)
      return
    }

    const pks = roomQuestions.map((rq) => rq.question_pk)
    console.log("[v0] PKs das questões:", pks)

    const { data: questionsData, error: qError } = await supabase.from("questoes").select("*").in("pk", pks)

    console.log("[v0] questionsData:", { count: questionsData?.length, qError })

    if (qError || !questionsData) {
      console.log("[v0] Erro ao buscar questões:", qError)
      setIsLoadingQuestions(false)
      return
    }

    const orderedQuestions = pks
      .map((pk) => questionsData.find((q) => q.pk === pk))
      .filter((q): q is Question => q !== undefined)

    console.log("[v0] orderedQuestions:", orderedQuestions.length)

    setQuestions(orderedQuestions)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setIsLoadingQuestions(false)
  }, [roomId])

  useEffect(() => {
    if (roomStatus === "closed" && questions.length === 0 && !isLoadingQuestions) {
      console.log(
        "[v0] useEffect disparado - Status:",
        roomStatus,
        "Questions:",
        questions.length,
        "Loading:",
        isLoadingQuestions,
      )
      loadSimulationQuestions()
    }
  }, [roomStatus, questions.length, isLoadingQuestions, loadSimulationQuestions])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (roomStatus === "closed") {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [roomStatus])

  const handleAnswer = async (questionPk: string, answer: string) => {
    if (!userId || !answer) return

    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = answer.toLowerCase() === currentQuestion.correta?.toLowerCase()

    if (isCorrect) {
      setLocalCorrect((prev) => prev + 1)
    } else {
      setLocalWrong((prev) => prev + 1)
    }

    const effectiveUserId = userId || visitorId || ""
    await saveGroupAnswer(roomId, effectiveUserId, questionPk, answer, isCorrect)
    setAnsweredQuestions((prev) => new Set([...prev, questionPk]))

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
    } else {
      const ranking = await getRoomRanking(roomId)
      setProgress(ranking)
      setRoomStatus("finished")
    }
  }

  const handleSendMessage = async () => {
    if (!userId || !newMessage.trim()) return

    await sendChatMessage(roomId, userId, newMessage)
    setNewMessage("")

    const updated = await getChatMessages(roomId)
    setChatMessages(updated)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode || roomId)
    alert("Código copiado!")
  }

  const handleReviewWrongAnswers = async () => {
    if (!roomId || isLoadingReview) return

    setIsLoadingReview(true)

    try {
      const effectiveUserId = userId || visitorId
      if (!effectiveUserId) {
        alert("Usuário não identificado")
        setIsLoadingReview(false)
        return
      }

      const wrongIds = await getUserWrongAnswers(roomId, effectiveUserId)

      if (wrongIds.length === 0) {
        alert("Parabéns! Você não errou nenhuma questão!")
        setIsLoadingReview(false)
        return
      }

      const supabase = getSupabaseClient()
      const { data: wrongQuestionsData, error } = await supabase.from("questoes").select("*").in("pk", wrongIds)

      if (error || !wrongQuestionsData || wrongQuestionsData.length === 0) {
        alert("Erro ao carregar questões para revisão")
        setIsLoadingReview(false)
        return
      }

      // Configurar modo de revisão
      setReviewQuestions(wrongQuestionsData)
      setReviewIndex(0)
      setReviewSelectedAnswer(null)
      setReviewShowExplanation(false)
      setReviewCorrect(0)
      setReviewWrong(0)
      setReviewFinished(false)
      setIsReviewMode(true)
    } catch (err) {
      console.error("Erro na revisão:", err)
      alert("Erro ao iniciar revisão")
    } finally {
      setIsLoadingReview(false)
    }
  }

  const handleReviewAnswer = (answer: string) => {
    if (reviewShowExplanation) return

    const currentQuestion = reviewQuestions[reviewIndex]
    const isCorrect = answer.toLowerCase() === currentQuestion.correta?.toLowerCase()

    setReviewSelectedAnswer(answer)
    setReviewShowExplanation(true)

    if (isCorrect) {
      setReviewCorrect((prev) => prev + 1)
    } else {
      setReviewWrong((prev) => prev + 1)
    }
  }

  const handleNextReview = () => {
    if (reviewIndex + 1 >= reviewQuestions.length) {
      setReviewFinished(true)
    } else {
      setReviewIndex((prev) => prev + 1)
      setReviewSelectedAnswer(null)
      setReviewShowExplanation(false)
    }
  }

  const handleBackToResults = () => {
    setIsReviewMode(false)
    setReviewQuestions([])
    setReviewIndex(0)
    setReviewSelectedAnswer(null)
    setReviewShowExplanation(false)
    setReviewCorrect(0)
    setReviewWrong(0)
    setReviewFinished(false)
  }

  const handleStartSimulation = async () => {
    if (!userId || !isHost || isStarting) {
      return
    }

    setIsStarting(true)
    console.log("[v0] Iniciando sala:", roomId, "com", roomQuestionCount, "questões", "filtros:", filterSelections)

    try {
      // Buscar IDs dos participantes para priorização inteligente
      const participantIds = participants.map(p => p.user_id)
      
      // Usar filtros se existirem, senão buscar aleatoriamente
      let randomQuestions
      if (filterSelections && filterSelections.length > 0) {
        console.log("[v0] Usando filtros de área/subtema")
        randomQuestions = await getQuestionsByFilters(filterSelections, roomQuestionCount, participantIds)
      } else {
        console.log("[v0] Usando busca aleatória padrão")
        randomQuestions = await getRandomQuestions(roomQuestionCount, participantIds)
      }

      if (!randomQuestions || randomQuestions.length === 0) {
        throw new Error("Não foi possível buscar questões para os filtros selecionados")
      }

      console.log("[v0] Questões encontradas:", randomQuestions.length)

      const questionIds = randomQuestions.map((q) => q.pk)
      await startGroupRoom(roomId, userId, questionIds)
      console.log("[v0] Sala iniciada com sucesso!")
      // Aguardar um pouco para o Realtime disparar
      await new Promise((resolve) => setTimeout(resolve, 500))
      await loadSimulationQuestions()
    } catch (error) {
      console.error("[v0] Erro ao iniciar sala:", error)
      alert("Erro ao iniciar o simulado. Tente novamente.")
    } finally {
      setIsStarting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Renderização condicional - LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Carregando sala...</p>
        </div>
      </div>
    )
  }

  if (isReviewMode) {
    const reviewPercentage =
      reviewCorrect + reviewWrong > 0 ? Math.round((reviewCorrect / (reviewCorrect + reviewWrong)) * 100) : 0

    // Tela de resultado da revisão
    if (reviewFinished) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card">
              <CardHeader className="text-center">
                <div
                  className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    reviewPercentage >= 70
                      ? "bg-green-500/20"
                      : reviewPercentage >= 50
                        ? "bg-yellow-500/20"
                        : "bg-red-500/20"
                  }`}
                >
                  <Trophy
                    className={`w-10 h-10 ${
                      reviewPercentage >= 70
                        ? "text-green-500"
                        : reviewPercentage >= 50
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  />
                </div>
                <CardTitle className="text-2xl">Revisão Concluída!</CardTitle>
                <CardDescription>Veja como você se saiu revisando as questões que errou</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-green-500/10 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-green-500">{reviewCorrect}</div>
                    <div className="text-sm text-muted-foreground">Acertos</div>
                  </div>
                  <div className="bg-red-500/10 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-red-500">{reviewWrong}</div>
                    <div className="text-sm text-muted-foreground">Erros</div>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${reviewPercentage >= 70 ? "bg-green-500/10" : reviewPercentage >= 50 ? "bg-yellow-500/10" : "bg-red-500/10"}`}
                  >
                    <div
                      className={`text-3xl font-bold ${reviewPercentage >= 70 ? "text-green-500" : reviewPercentage >= 50 ? "text-yellow-500" : "text-red-500"}`}
                    >
                      {reviewPercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">Aproveitamento</div>
                  </div>
                </div>

                <div className="text-center text-lg">
                  {reviewPercentage >= 70 ? (
                    <p className="text-green-500">Excelente! Você dominou as questões que errou antes!</p>
                  ) : reviewPercentage >= 50 ? (
                    <p className="text-yellow-500">Bom progresso! Continue revisando para melhorar.</p>
                  ) : (
                    <p className="text-red-500">Continue estudando! A prática leva à perfeição.</p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      setReviewIndex(0)
                      setReviewSelectedAnswer(null)
                      setReviewShowExplanation(false)
                      setReviewCorrect(0)
                      setReviewWrong(0)
                      setReviewFinished(false)
                    }}
                    variant="outline"
                  >
                    Revisar Novamente
                  </Button>
                  <Button onClick={handleBackToResults} variant="outline">
                    Voltar aos Resultados
                  </Button>
                  <Button onClick={() => router.push("/dashboard")}>Ir para o Dashboard</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // Tela de revisão de questões
    const currentReviewQuestion = reviewQuestions[reviewIndex]
    const reviewAlternatives = [
      { key: "A", text: currentReviewQuestion?.alternativaA },
      { key: "B", text: currentReviewQuestion?.alternativaB },
      { key: "C", text: currentReviewQuestion?.alternativaC },
      { key: "D", text: currentReviewQuestion?.alternativaD },
    ].filter((alt) => alt.text)

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={handleBackToResults}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="text-sm text-muted-foreground">
              Revisão: {reviewIndex + 1} de {reviewQuestions.length}
            </div>
          </div>

          <Progress value={((reviewIndex + 1) / reviewQuestions.length) * 100} className="mb-6" />

          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="px-2 py-1 bg-primary/10 rounded">{currentReviewQuestion?.materia}</span>
                {currentReviewQuestion?.tema && (
                  <span className="px-2 py-1 bg-secondary/50 rounded">{currentReviewQuestion.tema}</span>
                )}
              </div>
              <CardTitle className="text-lg leading-relaxed">{currentReviewQuestion?.enunciado}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviewAlternatives.map((alt) => {
                const isSelected = reviewSelectedAnswer === alt.key
                const isCorrectAnswer = alt.key.toLowerCase() === currentReviewQuestion?.correta?.toLowerCase()
                const showResult = reviewShowExplanation

                let bgClass = "bg-background hover:bg-muted/50"
                if (showResult) {
                  if (isCorrectAnswer) {
                    bgClass = "bg-green-500/20 border-green-500"
                  } else if (isSelected && !isCorrectAnswer) {
                    bgClass = "bg-red-500/20 border-red-500"
                  }
                } else if (isSelected) {
                  bgClass = "bg-primary/20 border-primary"
                }

                return (
                  <button
                    key={alt.key}
                    onClick={() => handleReviewAnswer(alt.key)}
                    disabled={reviewShowExplanation}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${bgClass} ${reviewShowExplanation ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          showResult && isCorrectAnswer
                            ? "bg-green-500 text-white"
                            : showResult && isSelected && !isCorrectAnswer
                              ? "bg-red-500 text-white"
                              : "bg-muted"
                        }`}
                      >
                        {alt.key}
                      </span>
                      <span className="flex-1">{alt.text}</span>
                      {showResult && isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {showResult && isSelected && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  </button>
                )
              })}

              {/* Explicação */}
              {reviewShowExplanation && currentReviewQuestion?.explicacao && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Explicação
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentReviewQuestion.explicacao}</p>
                </div>
              )}

              {/* Botão próxima */}
              {reviewShowExplanation && (
                <Button onClick={handleNextReview} className="w-full mt-4">
                  {reviewIndex + 1 >= reviewQuestions.length ? "Ver Resultado" : "Próxima Questão"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Renderização condicional - SALA ABERTA (LOBBY)
  if (roomStatus === "open") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Sala de Estudo em Grupo</h1>
            <p className="text-muted-foreground">Aguardando participantes entrarem...</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Código da Sala e Botão Iniciar */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Código da Sala */}
              <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">Código da Sala</p>
                <div className="text-4xl sm:text-5xl font-bold text-primary mb-4 tracking-wider">{roomCode}</div>
                <Button variant="outline" onClick={handleCopyCode} className="w-full sm:w-auto bg-transparent">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código
                </Button>
              </div>

              {/* Filtros Selecionados */}
              {filterSelections && filterSelections.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                  <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                    Filtros do Simulado
                  </h3>
                  <div className="space-y-2">
                    {filterSelections.map((selection, idx) => (
                      <div key={idx} className="bg-muted/30 rounded-lg p-3">
                        <div className="font-medium text-foreground">{selection.tema}</div>
                        {selection.subtemas && selection.subtemas.length > 0 ? (
                          <div className="text-sm text-muted-foreground mt-1">
                            {selection.subtemas.length} subtema{selection.subtemas.length > 1 ? 's' : ''}: {selection.subtemas.slice(0, 3).join(', ')}
                            {selection.subtemas.length > 3 && ` e mais ${selection.subtemas.length - 3}`}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground mt-1">Todos os subtemas</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão Iniciar Simulado */}
              {isHost ? (
                <Button
                  onClick={handleStartSimulation}
                  disabled={isStarting || participants.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg sm:text-xl font-bold shadow-lg"
                >
                  {isStarting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 mr-3" />
                      Iniciar Simulado ({roomQuestionCount} questões)
                    </>
                  )}
                </Button>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
                  <p className="text-yellow-500 font-medium">Aguardando o host iniciar o simulado...</p>
                </div>
              )}
            </div>

            {/* Lista de Participantes */}
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participantes ({participants.length})
              </h2>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">
                      {participant.user_name || participant.user_id?.slice(0, 8)}
                      {participant.is_host && " 👑"}
                    </span>
                    {participant.user_id === userId && <span className="text-xs text-muted-foreground">(você)</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Renderização condicional - SIMULADO FINALIZADO
  if (roomStatus === "finished") {
    const myStats = progress.find((p) => p.user_id === userId || p.visitorId === visitorId)
    const myCorrect = myStats?.correct ?? localCorrect
    const myTotal = myStats?.total ?? (localCorrect + localWrong || questions.length)
    const myWrong = myTotal - myCorrect
    const myPercentage = myTotal > 0 ? Math.round((myCorrect / myTotal) * 100) : 0

    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl mx-auto px-4 py-8">
          <Button onClick={() => router.push("/dashboard")} variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <div className="bg-card border border-border rounded-xl p-8 text-center mb-6">
            <div
              className={`w-20 h-20 ${myPercentage >= 70 ? "bg-green-500/10" : myPercentage >= 50 ? "bg-yellow-500/10" : "bg-red-500/10"} rounded-full flex items-center justify-center mx-auto mb-6`}
            >
              <Trophy
                className={`w-10 h-10 ${myPercentage >= 70 ? "text-green-500" : myPercentage >= 50 ? "text-yellow-500" : "text-red-500"}`}
              />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {myPercentage >= 70 ? "Excelente!" : myPercentage >= 50 ? "Bom trabalho!" : "Continue praticando!"}
            </h1>
            <p className="text-muted-foreground mb-4">
              {myPercentage >= 70
                ? "Você teve um ótimo desempenho!"
                : myPercentage >= 50
                  ? "Você está no caminho certo!"
                  : "Revise as questões que errou para melhorar."}
            </p>

            {/* Estatísticas do usuário */}
            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Seu Resultado</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{myCorrect}</div>
                  <div className="text-sm text-muted-foreground">Acertos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500">{myWrong}</div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${myPercentage >= 70 ? "text-green-500" : myPercentage >= 50 ? "text-yellow-500" : "text-red-500"}`}
                  >
                    {myPercentage}%
                  </div>
                  <div className="text-sm text-muted-foreground">Aproveitamento</div>
                </div>
              </div>
            </div>

            {/* Ranking dos participantes */}
            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Ranking da Sala
              </h2>
              <div className="space-y-3">
                {progress
                  .sort((a, b) => (b.correct || 0) - (a.correct || 0))
                  .map((participant, index) => {
                    const isMe = participant.visitorId === visitorId || participant.user_id === userId
                    const pCorrect = participant.correct || 0
                    const pTotal = participant.total || questions.length
                    const pPercentage = pTotal > 0 ? Math.round((pCorrect / pTotal) * 100) : 0

                    return (
                      <div
                        key={participant.visitorId || participant.user_id || index}
                        className={`flex items-center justify-between p-3 rounded-lg ${isMe ? "bg-primary/10 border border-primary" : "bg-background"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? "bg-yellow-500 text-yellow-950"
                                : index === 1
                                  ? "bg-gray-300 text-gray-700"
                                  : index === 2
                                    ? "bg-amber-600 text-amber-50"
                                    : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className="font-medium">
                            {isMe ? "Você" : participant.user_name || `Participante ${index + 1}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {pCorrect}/{pTotal}
                          </div>
                          <div className="text-xs text-muted-foreground">{pPercentage}%</div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {myWrong > 0 && (
                <Button
                  onClick={handleReviewWrongAnswers}
                  disabled={isLoadingReview}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  {isLoadingReview ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Carregando...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Revisar Erros ({myWrong} questões)
                    </>
                  )}
                </Button>
              )}
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Renderização condicional - SIMULADO EM ANDAMENTO
  if (roomStatus === "closed" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex]

    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto p-4">
          {/* Header com Timer e Progresso */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Questão {currentQuestionIndex + 1} de {questions.length}
              </span>
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-32" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timer)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Questão */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="mb-6">
                  <p className="text-lg text-foreground font-medium leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.enunciado}
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "A", value: currentQuestion.alternativaA },
                    { key: "B", value: currentQuestion.alternativaB },
                    { key: "C", value: currentQuestion.alternativaC },
                    { key: "D", value: currentQuestion.alternativaD },
                  ].map((alt) => (
                    <button
                      key={alt.key}
                      onClick={() => setSelectedAnswer(alt.key)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedAnswer === alt.key
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card"
                      } cursor-pointer`}
                    >
                      <span className="font-semibold">{alt.key}.</span> {alt.value}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <Button
                    onClick={() => handleAnswer(currentQuestion.pk, selectedAnswer || "")}
                    disabled={!selectedAnswer}
                    className="w-full"
                    size="lg"
                  >
                    Confirmar Resposta
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 bg-card border border-border rounded-lg p-4 flex flex-col h-[calc(100vh-200px)]">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Progresso
              </h3>
              <div className="mb-4 space-y-2">
                {participants.map((participant) => {
                  const participantProgress = answeredQuestions.size
                  return (
                    <div key={participant.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">
                        {participant.user_id === userId ? "Você" : "Part."}
                        {participant.is_host && " 👑"}
                      </span>
                      <span className="text-muted-foreground">
                        {participantProgress}/{questions.length}
                      </span>
                    </div>
                  )
                })}
              </div>

              <h3 className="font-semibold mb-3 flex items-center gap-2 border-t pt-3">
                <MessageCircle className="w-4 h-4" />
                Chat
              </h3>

              <div className="flex-1 overflow-y-auto mb-3 space-y-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-xs">
                    <span className="font-semibold text-primary">{msg.user_id === userId ? "Você" : "P"}:</span>{" "}
                    <span className="text-foreground">{msg.message}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Estado de carregamento enquanto aguarda questões
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Carregando questões...</p>
      </div>
    </div>
  )
}
