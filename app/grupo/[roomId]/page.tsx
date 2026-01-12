"use client"

import { useState, useEffect, useRef, Suspense, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Users, Clock, Trophy, MessageCircle, Send, Copy, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getUserProfile } from "@/lib/storage-supabase"
import {
  getRoomParticipants,
  getRoomProgress,
  finishGroupStudy,
  getRoomRanking,
  startGroupRoom,
  sendChatMessage,
  getChatMessages,
  getUserWrongAnswers,
  deleteGroupRoom,
} from "@/lib/group-study"
import { createClient } from "@/lib/supabase/client"
import { QuestionStudyMode } from "@/components/question-study-mode"

type Question = {
  pk: string // UUID da questão
  enunciado: string // Nome correto da coluna de texto da questão
  alternativaA: string
  alternativaB: string
  alternativaC: string
  alternativaD: string
  correta: string
  explicacao?: string
  tema: string
}

type RoomStatus = "open" | "started" | "finished" | "review"

function GroupRoomContent({ params }: { params: { roomId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomCode = searchParams.get("code")

  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [roomId] = useState(params.roomId)
  const [roomStatus, setRoomStatus] = useState<RoomStatus>("open")
  const [participants, setParticipants] = useState<any[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<any[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [timer, setTimer] = useState(0)
  const [roomQuestionCount, setRoomQuestionCount] = useState(50)
  const [hostUserId, setHostUserId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")

  const isHost = useMemo(() => {
    const result = userId && hostUserId && userId === hostUserId
    console.log("[v0] isHost calculado:", {
      userId,
      hostUserId,
      isHost: result,
      userEmail,
    })
    return result
  }, [userId, hostUserId, userEmail])

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
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
      console.log("[v0] ===== INICIANDO CARREGAMENTO DO LOBBY =====")
      console.log("[v0] Room ID:", roomId)

      const supabase = createClient()

      console.log("[v0] Buscando dados da sala no banco...")
      const { data: roomData, error: roomError } = await supabase
        .from("group_study_rooms")
        .select("status, question_count, host_user_id")
        .eq("id", roomId)
        .single()

      console.log("[v0] Resposta do banco:", { roomData, roomError })

      if (roomError) {
        console.error("[v0] ERRO ao buscar sala:", roomError)
        console.error("[v0] Detalhes do erro:", {
          message: roomError.message,
          code: roomError.code,
          details: roomError.details,
          hint: roomError.hint,
        })
      }

      if (!roomData) {
        console.error("[v0] SALA NÃO ENCONTRADA - Redirecionando para /grupo")
        console.error("[v0] Possível causa: RLS bloqueando leitura ou sala não existe")
        router.push("/grupo")
        return
      }

      console.log("[v0] Sala encontrada com sucesso:", roomData)
      setRoomStatus(roomData.status)
      setRoomQuestionCount(roomData.question_count)
      setHostUserId(roomData.host_user_id)

      console.log("[v0] Buscando perfil do usuário...")
      const profile = await getUserProfile()

      if (!profile) {
        console.error("[v0] Usuário não autenticado - Redirecionando para /login")
        router.push("/login")
        return
      }

      console.log("[v0] Usuário autenticado:", { id: profile.id, email: profile.email })
      setUserId(profile.id)

      console.log("[v0] Buscando participantes da sala...")
      const roomParticipants = await getRoomParticipants(roomId)
      console.log("[v0] Participantes encontrados:", roomParticipants.length)
      setParticipants(roomParticipants)

      setLoading(false)
      console.log("[v0] ===== LOBBY CARREGADO COM SUCESSO =====")
    }

    loadLobby()
  }, [roomId, router])

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

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
        async (payload) => {
          if (payload.new && (payload.new as any).status === "closed") {
            await loadSimulationQuestions()
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_study_answers",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const updated = await getRoomProgress(roomId)
          setProgress(updated)
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
        async (payload) => {
          setChatMessages((prev) => [...prev, payload.new])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, roomId])

  useEffect(() => {
    async function loadChat() {
      const messages = await getChatMessages(roomId)
      setChatMessages(messages)
    }

    loadChat()
  }, [roomId])

  useEffect(() => {
    if (roomStatus !== "started" || timer === 0) return

    const interval = setInterval(() => {
      setTimer(timer - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timer, roomStatus])

  const loadSimulationQuestions = async () => {
    console.log("[v0] loadSimulationQuestions INICIADO")
    setLoading(true)

    try {
      const supabase = createClient()
      console.log("[v0] Buscando questões da sala:", roomId)

      const { data: roomQuestions, error: roomError } = await supabase
        .from("group_study_room_questions")
        .select("question_pk")
        .eq("room_id", roomId)
        .order("question_order", { ascending: true })

      console.log("[v0] Questões da sala retornadas:", { count: roomQuestions?.length, error: roomError })

      if (!roomQuestions || roomQuestions.length === 0) {
        console.log("[v0] ERRO: Nenhuma questão encontrada na sala")
        setLoading(false)
        return
      }

      const questionPks = roomQuestions.map((q) => q.question_pk)
      console.log("[v0] PKs das questões:", questionPks)

      const { data: fullQuestions, error: questionsError } = await supabase
        .from("questoes")
        .select("*")
        .in("pk", questionPks)
      console.log("[v0] Questões completas retornadas:", { count: fullQuestions?.length, error: questionsError })

      if (!fullQuestions) {
        console.log("[v0] ERRO: Não foi possível carregar dados completos das questões")
        setLoading(false)
        return
      }

      const orderedQuestions = questionPks
        .map((pk) => fullQuestions.find((q) => q.pk === pk))
        .filter(Boolean) as Question[]

      console.log("[v0] Questões ordenadas:", orderedQuestions.length)
      console.log("[v0] Primeira questão:", orderedQuestions[0])

      setQuestions(orderedQuestions)
      setCurrentQuestionIndex(0)
      setRoomStatus("started")
      setTimer(roomQuestionCount * 60)
      setLoading(false)
      console.log("[v0] Estado atualizado com sucesso! Status: started")
    } catch (error) {
      console.error("[v0] ERRO CRÍTICO ao carregar questões:", error)
      setLoading(false)
    }
  }

  const handleAnswer = async (questionPk: string, answer: string) => {
    if (!userId || !roomId) return

    const currentQuestion = questions.find((q) => q.pk === questionPk)
    if (!currentQuestion) return

    const isCorrect = answer === currentQuestion.correta

    setAnsweredQuestions((prev) => prev.add(questionPk))

    const supabase = createClient()
    await supabase.from("group_study_answers").upsert({
      room_id: roomId,
      user_id: userId,
      question_pk: questionPk,
      selected_answer: answer,
      is_correct: isCorrect,
    })

    const nextIndex = questions.findIndex((q) => q.pk === questionPk) + 1
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex)
      setSelectedAnswer(null)
    } else {
      await finishGroupStudy(roomId, userId, timer)

      if (isHost) {
        await deleteGroupRoom(roomId)
      }

      const finalRanking = await getRoomRanking(roomId)
      setProgress(finalRanking)
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
    if (roomCode) {
      navigator.clipboard.writeText(roomCode)
      alert("Código copiado!")
    }
  }

  const handleReviewWrongAnswers = async () => {
    if (!userId) return

    const wrongIds = await getUserWrongAnswers(roomId, userId)

    if (wrongIds.length === 0) {
      alert("Parabéns! Você não errou nenhuma questão!")
      return
    }

    const supabase = createClient()
    const { data } = await supabase.from("questoes").select("*").in("pk", wrongIds)

    if (data) {
      setQuestions(data as Question[])
      setCurrentQuestionIndex(0)
      setRoomStatus("review")
    }
  }

  const handleStartSimulation = async () => {
    if (!userId || !isHost || isStarting) {
      console.log("[v0] handleStartSimulation bloqueado:", { userId, isHost, isStarting })
      return
    }

    console.log("[v0] handleStartSimulation INICIADO")
    setIsStarting(true)

    try {
      const supabase = createClient()
      console.log("[v0] Buscando questões aleatórias do banco...")
      const { data: allQuestions, error: questionsError } = await supabase.from("questoes").select("pk").limit(2000)

      console.log("[v0] Questões retornadas:", { count: allQuestions?.length, error: questionsError })

      if (!allQuestions || allQuestions.length === 0) {
        console.log("[v0] ERRO: Nenhuma questão disponível no banco")
        setIsStarting(false)
        return
      }

      const shuffled = allQuestions.sort(() => Math.random() - 0.5)
      const selectedQuestions = shuffled.slice(0, roomQuestionCount)
      const questionPks = selectedQuestions.map((q) => q.pk)

      console.log("[v0] Questões selecionadas:", { count: questionPks.length, pks: questionPks.slice(0, 5) })
      console.log("[v0] Chamando startGroupRoom...")

      const success = await startGroupRoom(roomId, userId, questionPks)
      console.log("[v0] startGroupRoom resultado:", success)

      if (success) {
        console.log("[v0] Chamando loadSimulationQuestions após sucesso...")
        await loadSimulationQuestions()
        console.log("[v0] loadSimulationQuestions concluído!")
      } else {
        console.log("[v0] ERRO: startGroupRoom retornou false")
      }
    } catch (error) {
      console.error("[v0] ERRO CRÍTICO ao iniciar simulado:", error)
    } finally {
      setIsStarting(false)
      console.log("[v0] handleStartSimulation FINALIZADO")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

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
                <div className="w-full bg-muted border border-border rounded-lg py-6 px-4 text-center">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aguardando o host iniciar o simulado...</p>
                </div>
              )}

              {/* Participantes */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participantes ({participants.length}/10)
                </h3>
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm sm:text-base">
                          {participant.user_id === userId ? "Você" : `Participante ${index + 1}`}
                          {participant.is_host && " 👑"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col h-[400px] lg:h-[600px]">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat
              </h3>

              <div className="flex-1 overflow-y-auto mb-3 space-y-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className="font-semibold text-primary">
                      {msg.user_id === userId ? "Você" : "Participante"}:
                    </span>{" "}
                    <span className="text-foreground">{msg.message}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Digite uma mensagem..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (roomStatus === "started") {
    const currentQuestion = questions[currentQuestionIndex]
    const myProgress = answeredQuestions.size

    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Carregando questões...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={() => router.push("/grupo")} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sair
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timer)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span>{participants.length}</span>
              </div>
              <Button onClick={() => router.push("/grupo")} variant="outline" size="sm">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <div className="bg-card border border-border rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Questão {currentQuestionIndex + 1} de {questions.length}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Seu progresso: {myProgress}/{questions.length}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(myProgress / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-8">
                <div className="mb-6">
                  {currentQuestion.tema && (
                    <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-4">
                      {currentQuestion.tema}
                    </span>
                  )}
                  <p className="text-lg text-foreground font-medium leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.enunciado}
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "A", text: currentQuestion.alternativaA },
                    { key: "B", text: currentQuestion.alternativaB },
                    { key: "C", text: currentQuestion.alternativaC },
                    { key: "D", text: currentQuestion.alternativaD },
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
                      <span className="font-semibold">{alt.key}.</span> {alt.text}
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
                  const participantProgress = answeredQuestions.size // Simplified for demonstration
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
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Mensagem..."
                  className="flex-1 text-sm"
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (roomStatus === "review") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Button onClick={() => setRoomStatus("finished")} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Resultado
          </Button>

          <QuestionStudyMode
            questions={questions.map((q) => ({
              id: q.pk,
              questao: q.enunciado,
              alternativas: {
                A: q.alternativaA,
                B: q.alternativaB,
                C: q.alternativaC,
                D: q.alternativaD,
              },
              resposta_correta: q.correta,
              tema: q.tema,
              explicacao: q.explicacao,
            }))}
            onComplete={() => setRoomStatus("finished")}
            isReviewMode={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Button onClick={() => router.push("/dashboard")} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <div className="bg-card border border-border rounded-xl p-8 text-center mb-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Estudo Concluído!</h1>
          <p className="text-muted-foreground mb-8">Confira o ranking dos participantes</p>

          <div className="space-y-3">
            {progress.map((entry, index) => (
              <div key={entry.user_id} className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
                <div className="text-2xl font-bold text-primary">#{index + 1}</div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{entry.user_id === userId ? "Você" : `Participante ${index + 1}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.correct}/{entry.total} corretas ({entry.percentage.toFixed(1)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleReviewWrongAnswers} variant="outline" className="flex-1 bg-transparent">
            Revisar Erros
          </Button>
          <Button onClick={() => router.push("/dashboard")} className="flex-1">
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function GroupRoomPage({ params }: { params: { roomId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <GroupRoomContent params={params} />
    </Suspense>
  )
}
