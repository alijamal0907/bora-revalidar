"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { getUserPlan } from "@/lib/storage-supabase"
import { Navbar } from "@/components/navbar"
import { getQuestoesWithAlternatives, saveQuizAnswer, saveSimuladoResult } from "@/lib/storage-supabase"
import { ArrowLeft, Clock, Target, Trophy, Crown } from "lucide-react"
import { UpgradeModal } from "@/components/upgrade-modal"

interface Question {
  id: string
  questao: string
  enunciado: string
  alternativaA: string
  alternativaB: string
  alternativaC: string
  alternativaD: string
  correta: string
  explicacao?: string | null
  tema?: string
}

type SimuladoStatus = "config" | "running" | "finished" | "review"

export default function SimuladosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [status, setStatus] = useState<SimuladoStatus>("config")

  // Configuração
  const [numQuestions, setNumQuestions] = useState(50)

  const [userPlan, setUserPlan] = useState<"free" | "premium">("free")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Durante o simulado
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answers, setAnswers] = useState<{ [key: number]: { selected: string; correct: boolean } }>({})
  const [startTime, setStartTime] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Resultado
  const [totalTime, setTotalTime] = useState(0)
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([])

  // Loading
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const currentUser = await getSupabaseUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)

      const plan = await getUserPlan(currentUser.email)
      setUserPlan(plan)

      if (plan === "free") {
        setShowUpgradeModal(true)
      }

      setIsLoading(false)
    }
    init()
  }, [router])

  // Cronômetro
  useEffect(() => {
    if (status === "running" && startTime > 0) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [status, startTime])

  const handleStartSimulado = async () => {
    setIsLoading(true)
    try {
      const allQuestions = await getQuestoesWithAlternatives(user?.usuario_id || user?.id, undefined, 1000)

      // Embaralhar e selecionar a quantidade escolhida
      const shuffled = allQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, numQuestions)
        .map((q: any) => ({
          id: q.id || q.pk,
          questao: q.enunciado || q.questao,
          enunciado: q.enunciado || q.questao,
          alternativaA: q.alternativaa || q.alternativaA,
          alternativaB: q.alternativab || q.alternativaB,
          alternativaC: q.alternativac || q.alternativaC,
          alternativaD: q.alternativad || q.alternativaD,
          correta: String(q.correta).toUpperCase().trim(),
          explicacao: q.explicacao || null,
          tema: q.tema,
        }))

      setQuestions(shuffled)
      setStatus("running")
      setStartTime(Date.now())
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setAnswers({})
    } catch (error) {
      console.error("Erro ao carregar simulado:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAnswer = (letter: string) => {
    setSelectedAnswer(letter)
  }

  const handleConfirmAnswer = async () => {
    if (!selectedAnswer) return

    const currentQuestion = questions[currentIndex]
    const correctLetter = currentQuestion.correta
    const isCorrect = selectedAnswer === correctLetter

    const newAnswers = {
      ...answers,
      [currentIndex]: {
        selected: selectedAnswer,
        correct: isCorrect,
      },
    }
    setAnswers(newAnswers)

    try {
      await saveQuizAnswer(user?.usuario_id || user?.id, currentQuestion.id, selectedAnswer, isCorrect, "simulado")
    } catch (error) {
      console.error("Erro ao salvar resposta:", error)
    }

    // Avançar automaticamente
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
        setSelectedAnswer(null)
      }, 500)
    } else {
      // Finalizar simulado
      const finalTime = Math.floor((Date.now() - startTime) / 1000)
      setTotalTime(finalTime)

      const acertos = Object.values(newAnswers).filter((a) => a.correct).length
      const erros = Object.values(newAnswers).filter((a) => !a.correct).length
      const percentual = (acertos / questions.length) * 100

      try {
        await saveSimuladoResult(user?.usuario_id || user?.id, questions.length, acertos, erros, percentual, finalTime)
      } catch (error) {
        console.error("Erro ao salvar resultado:", error)
      }

      // Filtrar questões erradas
      const wrong = questions.filter((_, idx) => !newAnswers[idx]?.correct)
      setWrongQuestions(wrong)
      setStatus("finished")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const acertos = Object.values(answers).filter((a) => a.correct).length
  const erros = Object.values(answers).filter((a) => !a.correct).length
  const percentual = questions.length > 0 ? (acertos / questions.length) * 100 : 0

  if (isLoading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (userPlan === "free") {
    return (
      <div>
        <Navbar user={user} />
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false)
            router.push("/dashboard")
          }}
          reason="general"
        />

        <main className="max-w-2xl mx-auto px-4 py-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="bg-card border-2 border-primary/30 rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Simulados Premium</h1>
            <p className="text-muted-foreground mb-8">
              Realize simulados completos do Revalida com cronômetro, estatísticas detalhadas e revisão de questões
              erradas no plano Premium!
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-md hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Fazer Upgrade para Premium
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Tela de Configuração
  if (status === "config") {
    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Simulados</h1>
                <p className="text-muted-foreground">Configure e inicie seu simulado Revalida</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Quantidade de Questões: <span className="text-primary font-bold">{numQuestions}</span>
                </label>
                <input
                  type="range"
                  min="25"
                  max="100"
                  step="5"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number.parseInt(e.target.value))}
                  className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>25 questões</span>
                  <span>100 questões</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-foreground">Regras do Simulado:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Questões reais do banco de dados</li>
                  <li>• Sempre embaralhadas e nunca se repetem</li>
                  <li>• Cronômetro automático</li>
                  <li>• Após confirmar, avança automaticamente</li>
                  <li>• Justificativas disponíveis na revisão</li>
                </ul>
              </div>

              <button
                onClick={handleStartSimulado}
                className="w-full px-6 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-md hover:bg-primary/90 transition-colors"
              >
                Gerar Simulado
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Tela Durante o Simulado
  if (status === "running") {
    const currentQuestion = questions[currentIndex]
    const correctLetter = currentQuestion?.correta

    const alternatives = [
      { letter: "A", text: currentQuestion?.alternativaA },
      { letter: "B", text: currentQuestion?.alternativaB },
      { letter: "C", text: currentQuestion?.alternativaC },
      { letter: "D", text: currentQuestion?.alternativaD },
    ]

    const answered = answers[currentIndex] !== undefined

    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-3xl mx-auto px-4 py-8">
          {/* Header com cronômetro e progresso */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-2xl font-mono font-bold text-foreground">{formatTime(elapsedTime)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Questão {currentIndex + 1} de {questions.length}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Questão */}
          <div className="bg-card border border-border rounded-lg p-8">
            {currentQuestion?.tema && (
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-4">
                {currentQuestion.tema}
              </span>
            )}

            <h2 className="text-xl font-bold text-foreground mb-8 whitespace-pre-wrap">
              {currentQuestion?.enunciado || currentQuestion?.questao}
            </h2>

            <div className="space-y-3">
              {alternatives.map((alt) => {
                const isSelected = selectedAnswer === alt.letter

                return (
                  <button
                    key={alt.letter}
                    onClick={() => !answered && handleSelectAnswer(alt.letter)}
                    disabled={answered}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      isSelected && !answered
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                        : "border-input hover:border-muted"
                    } ${answered ? "cursor-default opacity-60" : "cursor-pointer"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-foreground w-6 flex-shrink-0">{alt.letter}</span>
                      <span className="text-foreground flex-1 whitespace-pre-wrap">{alt.text}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Botão Confirmar */}
          {!answered && selectedAnswer && (
            <button
              onClick={handleConfirmAnswer}
              className="w-full mt-6 px-6 py-4 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-colors animate-pulse"
            >
              Confirmar Resposta
            </button>
          )}

          {answered && <div className="mt-6 text-center text-muted-foreground">Avançando para próxima questão...</div>}
        </main>
      </div>
    )
  }

  // Tela de Resultado Final
  if (status === "finished") {
    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Simulado Concluído!</h1>
              <p className="text-muted-foreground">Você respondeu todas as {questions.length} questões</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold text-foreground">{questions.length}</p>
              </div>
              <div className="bg-accent/10 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Acertos</p>
                <p className="text-2xl font-bold text-accent">{acertos}</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Erros</p>
                <p className="text-2xl font-bold text-destructive">{erros}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Tempo</p>
                <p className="text-2xl font-bold text-foreground">{formatTime(totalTime)}</p>
              </div>
            </div>

            {/* Percentual destaque */}
            <div className="bg-primary/10 border-2 border-primary rounded-lg p-8 mb-8">
              <p className="text-sm text-muted-foreground mb-2">Seu Aproveitamento</p>
              <p className="text-6xl font-bold text-primary mb-2">{percentual.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">
                {percentual >= 70
                  ? "Excelente desempenho!"
                  : percentual >= 50
                    ? "Bom trabalho!"
                    : "Continue praticando!"}
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4">
              {wrongQuestions.length > 0 && (
                <button
                  onClick={() => {
                    setCurrentIndex(0)
                    setSelectedAnswer(null)
                    setStatus("review")
                  }}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 transition-colors"
                >
                  Revisar Questões Erradas ({wrongQuestions.length})
                </button>
              )}
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 px-6 py-3 bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Tela de Revisão
  if (status === "review") {
    const currentQuestion = wrongQuestions[currentIndex]
    const correctLetter = currentQuestion?.correta

    const alternatives = [
      { letter: "A", text: currentQuestion?.alternativaA },
      { letter: "B", text: currentQuestion?.alternativaB },
      { letter: "C", text: currentQuestion?.alternativaC },
      { letter: "D", text: currentQuestion?.alternativaD },
    ]

    const hasNext = currentIndex < wrongQuestions.length - 1

    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <button
            onClick={() => setStatus("finished")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Resultado
          </button>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-foreground">
              Revisando Questões Erradas - {currentIndex + 1} de {wrongQuestions.length}
            </p>
          </div>

          {/* Questão */}
          <div className="bg-card border border-border rounded-lg p-8 mb-6">
            {currentQuestion?.tema && (
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-4">
                {currentQuestion.tema}
              </span>
            )}

            <h2 className="text-xl font-bold text-foreground mb-8 whitespace-pre-wrap">
              {currentQuestion?.enunciado || currentQuestion?.questao}
            </h2>

            <div className="space-y-3 mb-8">
              {alternatives.map((alt) => {
                const isCorrect = alt.letter === correctLetter

                return (
                  <div
                    key={alt.letter}
                    className={`w-full p-4 rounded-lg border-2 ${
                      isCorrect ? "border-accent bg-accent/10" : "border-input"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-foreground w-6 flex-shrink-0">{alt.letter}</span>
                      <span className="text-foreground flex-1 whitespace-pre-wrap">{alt.text}</span>
                      {isCorrect && <span className="text-accent font-bold flex-shrink-0">✓ Correta</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Justificativa */}
            <div className="border-2 border-[#C6A239] bg-[#0D1B2A] rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3" style={{ color: "#C6A239" }}>
                Justificativa da questão
              </h3>
              <div className="text-sm whitespace-pre-wrap" style={{ color: "#E6E6E6" }}>
                {currentQuestion?.explicacao || (
                  <em style={{ color: "#C6A239" }}>A justificativa será carregada em breve.</em>
                )}
              </div>
            </div>
          </div>

          {/* Navegação */}
          <div className="flex gap-4">
            {hasNext ? (
              <button
                onClick={() => {
                  setCurrentIndex(currentIndex + 1)
                  setSelectedAnswer(null)
                }}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                Próxima Questão
              </button>
            ) : (
              <button
                onClick={() => setStatus("finished")}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                Finalizar Revisão
              </button>
            )}
          </div>
        </main>
      </div>
    )
  }

  return null
}
