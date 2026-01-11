"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Users, Clock, Trophy, MessageCircle, Send, Copy, Check, Play } from "lucide-react"
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
  type RoomParticipant,
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

type RoomStatus = "lobby" | "started" | "finished" | "review"

function GroupRoomContent({ params }: { params: { roomId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomCode = searchParams.get("code")

  const [userId, setUserId] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [roomId] = useState(params.roomId)
  const [roomStatus, setRoomStatus] = useState<RoomStatus>("lobby")
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [progress, setProgress] = useState<Map<string, number>>(new Map())
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startTime, setStartTime] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [copiedCode, setCopiedCode] = useState(false)
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({})
  const [showChat, setShowChat] = useState(true)
  const [roomQuestionCount, setRoomQuestionCount] = useState<number | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    async function loadLobby() {
      console.log("[v0] Carregando lobby da sala:", roomId)

      const profile = await getUserProfile()
      if (!profile) {
        router.push("/login")
        return
      }
      setUserId(profile.id)

      const roomParticipants = await getRoomParticipants(roomId)
      setParticipants(roomParticipants)

      const hostParticipant = roomParticipants.find((p) => p.is_host)
      setIsHost(hostParticipant?.user_id === profile.id)

      const supabase = createClient()
      const { data: roomData } = await supabase
        .from("group_study_rooms")
        .select("question_count")
        .eq("id", roomId)
        .single()

      if (roomData) {
        console.log("[v0] Quantidade de questões da sala:", roomData.question_count)
        setRoomQuestionCount(roomData.question_count)
      }

      setLoading(false)
    }

    loadLobby()
  }, [roomId, router])

  useEffect(() => {
    async function loadChat() {
      const messages = await getChatMessages(roomId)
      setChatMessages(messages)
    }

    loadChat()

    const interval = setInterval(loadChat, 3000)
    return () => clearInterval(interval)
  }, [roomId])

  useEffect(() => {
    // O chat agora só rola quando o usuário está interagindo com ele
  }, [chatMessages])

  useEffect(() => {
    if (roomStatus !== "started" || startTime === 0) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, roomStatus])

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
          console.log("[v0] Status da sala mudou:", payload)
          if (payload.new && (payload.new as any).status === "closed") {
            console.log("[v0] Simulado iniciado! Carregando questões...")
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, roomId])

  const loadSimulationQuestions = async () => {
    console.log("[v0] Carregando questões do simulado...")
    setLoading(true)

    try {
      const supabase = createClient()

      // Buscar PKs das questões da sala
      const { data: roomQuestions } = await supabase
        .from("group_study_room_questions")
        .select("question_pk")
        .eq("room_id", roomId)
        .order("question_order", { ascending: true })

      if (!roomQuestions || roomQuestions.length === 0) {
        console.error("[v0] Nenhuma questão encontrada para a sala")
        setLoading(false)
        return
      }

      const questionPks = roomQuestions.map((q) => q.question_pk)
      console.log("[v0] PKs das questões:", questionPks.length)

      // Buscar questões completas
      const { data: fullQuestions } = await supabase.from("questoes").select("*").in("pk", questionPks)

      if (!fullQuestions) {
        console.error("[v0] Erro ao carregar questões completas")
        setLoading(false)
        return
      }

      console.log("[v0] Questões carregadas:", fullQuestions.length)

      // Ordenar questões pela ordem da sala
      const orderedQuestions = questionPks
        .map((pk) => fullQuestions.find((q) => q.pk === pk))
        .filter(Boolean) as Question[]

      setQuestions(orderedQuestions)
      setCurrentQuestionIndex(0)
      setRoomStatus("started")
      setStartTime(Date.now())
      setLoading(false)

      console.log("[v0] Simulado pronto para começar!")
    } catch (error) {
      console.error("[v0] Erro ao carregar questões:", error)
      setLoading(false)
    }
  }

  const handleAnswer = async (questionPk: string, answer: string) => {
    if (!userId || !roomId) return

    const currentQuestion = questions.find((q) => q.pk === questionPk)
    if (!currentQuestion) return

    const isCorrect = answer === currentQuestion.correta

    console.log("[v0] Salvando resposta:", { questionPk, answer, isCorrect })

    setUserAnswers({ ...userAnswers, [questionPk]: answer })

    const supabase = createClient()
    await supabase.from("group_study_answers").upsert({
      room_id: roomId,
      user_id: userId,
      question_pk: questionPk,
      selected_answer: answer,
      is_correct: isCorrect,
    })

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const nextIndex = questions.findIndex((q) => q.pk === questionPk) + 1
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex)
      setSelectedAnswer(null)
    } else {
      console.log("[v0] Última questão respondida, finalizando...")
      await finishGroupStudy(roomId, userId, elapsedTime)

      if (isHost) {
        await deleteGroupRoom(roomId)
      }

      const finalRanking = await getRoomRanking(roomId)
      setRanking(finalRanking)
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
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleReviewWrongAnswers = async () => {
    if (!userId) return

    console.log("[v0] Revisando questões erradas...")
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
    if (!userId || !isHost || isStarting) return

    setIsStarting(true)
    console.log("[v0] Iniciando simulado...")

    try {
      const supabase = createClient()
      const { data: allQuestions } = await supabase.from("questoes").select("pk").limit(2000)

      if (!allQuestions || allQuestions.length === 0) {
        console.error("[v0] Nenhuma questão disponível")
        setIsStarting(false)
        return
      }

      const shuffled = allQuestions.sort(() => Math.random() - 0.5)
      const selectedQuestions = shuffled.slice(0, roomQuestionCount || 25)
      const questionPks = selectedQuestions.map((q) => q.pk)

      console.log("[v0] Questões selecionadas:", questionPks.length)

      const success = await startGroupRoom(roomId, userId, questionPks)

      if (success) {
        console.log("[v0] Sala iniciada com sucesso!")
        await loadSimulationQuestions()
        console.log("[v0] Simulado iniciado com sucesso!")
      } else {
        console.error("[v0] Erro ao iniciar sala")
      }
    } catch (error) {
      console.error("[v0] Erro ao iniciar simulado:", error)
    } finally {
      setIsStarting(false)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (roomStatus === "lobby") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Button onClick={() => router.push("/grupo")} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Sair da Sala
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {roomCode && (
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-8 text-center text-white">
                  <h2 className="text-lg font-semibold mb-2">Código da Sala</h2>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-5xl font-mono font-bold tracking-wider">{roomCode}</p>
                    <Button
                      onClick={handleCopyCode}
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30"
                    >
                      {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-sm mt-3 text-white/80">Compartilhe este código com seus amigos</p>
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participantes ({participants.length}/10)
                </h3>
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {participant.user_id === userId ? "Você" : `Participante ${index + 1}`}
                          {participant.is_host && " 👑"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isHost && (
                <Button
                  onClick={handleStartSimulation}
                  disabled={isStarting}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isStarting ? "Iniciando..." : "Iniciar Simulado"}
                </Button>
              )}

              {!isHost && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Aguardando o host iniciar o simulado...</p>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex flex-col h-[600px]">
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
    const myProgress = progress.get(userId || "") || 0

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
                <span className="font-mono">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span>{participants.length}</span>
              </div>
              <Button onClick={() => setShowChat(!showChat)} variant="outline" size="sm">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className={`grid ${showChat ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1"} gap-4`}>
            <div className={showChat ? "lg:col-span-3" : "col-span-1"}>
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
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
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

            {showChat && (
              <div className="lg:col-span-1 bg-card border border-border rounded-lg p-4 flex flex-col h-[calc(100vh-200px)]">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Progresso
                </h3>
                <div className="mb-4 space-y-2">
                  {participants.map((participant) => {
                    const participantProgress = progress.get(participant.user_id) || 0
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
            )}
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
            {ranking.map((entry, index) => (
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
