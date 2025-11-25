"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { Navbar } from "@/components/navbar"
import { MultiThemeSelector } from "@/components/multi-theme-selector"
import { getQuestoesWithAlternatives, saveQuizAnswer, getUserPlan, getDailyQuestionCount } from "@/lib/storage-supabase"
import { Settings, ArrowLeft, Lock, Clock } from "lucide-react"
import { UpgradeModal } from "@/components/upgrade-modal"
import { hasReachedDailyLimit, getRemainingQuestions } from "@/lib/plan-utils"
import type { UserPlan } from "@/lib/plan-utils"

interface Question {
  id: string
  enunciado: string
  alternativaA: string
  alternativaB: string
  alternativaC: string
  alternativaD: string
  alternativaE: string
  correta: string
  tema?: string
  subtema?: string
  [key: string]: any
}

export default function StudyPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, incorrect: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [numQuestions, setNumQuestions] = useState(20) // Default to 20 for FREE users
  const [userPlan, setUserPlan] = useState<UserPlan>("free")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"daily_limit" | "theme_limit" | "general">("general")
  const [dailyQuestionsCount, setDailyQuestionsCount] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    const checkDailyLimit = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)

        const plan = await getUserPlan(currentUser.email)
        setUserPlan(plan)

        if (plan === "free") {
          const todayCount = await getDailyQuestionCount(currentUser.id)
          setDailyQuestionsCount(todayCount)

          if (hasReachedDailyLimit(todayCount, plan)) {
            setIsBlocked(true)
            setIsLoading(false)
            return
          }

          const remaining = getRemainingQuestions(todayCount, plan)
          if (remaining !== "unlimited" && remaining < 20) {
            setNumQuestions(remaining)
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error checking daily limit:", error)
        setIsLoading(false)
      }
    }

    checkDailyLimit()
  }, [router])

  useEffect(() => {
    const loadStudyCards = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)

        if (!showSettings) {
          const plan = await getUserPlan(currentUser.email)
          setUserPlan(plan)

          if (plan === "free") {
            const todayCount = await getDailyQuestionCount(currentUser.id)
            setDailyQuestionsCount(todayCount)

            if (hasReachedDailyLimit(todayCount, plan)) {
              setIsBlocked(true)
              setIsLoading(false)
              return
            }

            const remaining = getRemainingQuestions(dailyQuestionsCount, plan)
            if (remaining !== "unlimited") {
              setNumQuestions(Math.min(numQuestions, remaining as number))
            }
          }

          const allQuestions = await getQuestoesWithAlternatives(
            currentUser.usuario_id || currentUser.id,
            selectedThemes.length > 0 ? selectedThemes : undefined,
          )

          let questionsToStudy = allQuestions

          questionsToStudy = questionsToStudy.sort(() => Math.random() - 0.5)

          if (plan === "free") {
            const remaining = getRemainingQuestions(dailyQuestionsCount, plan)
            const maxQuestions = remaining === "unlimited" ? numQuestions : Math.min(numQuestions, remaining as number)
            questionsToStudy = questionsToStudy.slice(0, maxQuestions)
          } else if (numQuestions > 0 && numQuestions < questionsToStudy.length) {
            questionsToStudy = questionsToStudy.slice(0, numQuestions)
          }

          if (questionsToStudy.length === 0) {
            setIsComplete(true)
            setQuestions([])
            setIsLoading(false)
            return
          }

          setQuestions(questionsToStudy)
          setCurrentIndex(0)
          setSessionStats({ reviewed: 0, correct: 0, incorrect: 0 })
          setSelectedAnswer(null)
          setAnswered(false)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error loading study cards:", error)
        setIsLoading(false)
      }
    }

    loadStudyCards()
  }, [router, selectedThemes, showSettings, numQuestions])

  if (isBlocked && userPlan === "free") {
    const hoursUntilReset = 24 - new Date().getHours()

    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Limite Diário Atingido</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Você respondeu suas 20 questões diárias do plano FREE. Volte em aproximadamente{" "}
              <span className="font-bold text-foreground">{hoursUntilReset} horas</span> para continuar estudando.
            </p>

            <div className="bg-muted/50 rounded-lg p-6 mb-8 max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-muted-foreground">Próxima liberação</span>
              </div>
              <p className="text-2xl font-bold text-foreground">00:00 (meia-noite)</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(true)
                  setUpgradeReason("daily_limit")
                }}
                className="w-full max-w-sm mx-auto block px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-md hover:from-orange-600 hover:to-orange-700 transition-colors"
              >
                Quero Questões Ilimitadas - Seja Premium
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full max-w-sm mx-auto block px-6 py-3 bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </main>

        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} reason={upgradeReason} />
      </div>
    )
  }

  if (showSettings) {
    const remaining = userPlan === "free" ? getRemainingQuestions(dailyQuestionsCount, userPlan) : "unlimited"
    const maxAllowed = remaining === "unlimited" ? 100 : (remaining as number)

    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-md mx-auto px-4 py-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Configurações de Estudo</h1>
            </div>

            {userPlan === "free" && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-foreground">
                  <span className="font-bold">Plano FREE:</span> Você pode responder até{" "}
                  <span className="font-bold text-orange-500">{remaining}</span> questões hoje.
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Temas</label>
                <MultiThemeSelector selectedThemes={selectedThemes} onThemesChange={setSelectedThemes} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Quantidade de Cartões: {numQuestions === 0 ? "Todos" : numQuestions}
                  {userPlan === "free" && ` (máximo ${maxAllowed})`}
                </label>
                <input
                  type="range"
                  min="0"
                  max={maxAllowed}
                  value={Math.min(numQuestions, maxAllowed)}
                  onChange={(e) => setNumQuestions(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{userPlan === "free" ? `Máx ${maxAllowed}` : "Todos"}</span>
                  <span>{maxAllowed}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSettings(false)
                  setIsLoading(true)
                }}
                className="w-full px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors mt-8"
              >
                Iniciar Estudo
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isLoading || !user) {
    return (
      <div>
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">Carregando questões...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0 && !isComplete) {
    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">Nenhuma questão disponível para este filtro</p>
            <button
              onClick={() => {
                setShowSettings(true)
                setSelectedThemes([])
                setNumQuestions(0)
              }}
              className="mt-6 px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              Voltar às Configurações
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Sessão de Estudo Concluída!</h1>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Questões Respondidas</p>
                <p className="text-2xl font-bold text-foreground mt-2">{sessionStats.reviewed}</p>
              </div>
              <div className="bg-accent/10 rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Corretas</p>
                <p className="text-2xl font-bold text-accent mt-2">{sessionStats.correct}</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Incorretas</p>
                <p className="text-2xl font-bold text-destructive mt-2">{sessionStats.incorrect}</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const correctLetter = String(currentQuestion?.correta || "A")
    .toUpperCase()
    .trim()

  if (currentQuestion) {
    console.log("[v0] Current question:", {
      id: currentQuestion.id,
      enunciado: currentQuestion.enunciado,
      alternativaA: currentQuestion.alternativaA,
      alternativaB: currentQuestion.alternativaB,
      alternativaC: currentQuestion.alternativaC,
      alternativaD: currentQuestion.alternativaD,
      alternativaE: currentQuestion.alternativaE,
      correta: currentQuestion.correta,
      tema: currentQuestion.tema,
      subtema: currentQuestion.subtema,
      normalizedCorrectLetter: correctLetter,
    })
  }

  const alternatives = [
    { letter: "A", text: currentQuestion?.alternativaA },
    { letter: "B", text: currentQuestion?.alternativaB },
    { letter: "C", text: currentQuestion?.alternativaC },
    { letter: "D", text: currentQuestion?.alternativaD },
    { letter: "E", text: currentQuestion?.alternativaE },
  ]

  const isCorrect = selectedAnswer === correctLetter

  const handleSelectAnswer = async (letter: string) => {
    if (!answered && !isLoading) {
      setSelectedAnswer(letter)
      setAnswered(true)

      const correct = letter === correctLetter
      const newStats = {
        ...sessionStats,
        reviewed: sessionStats.reviewed + 1,
        correct: sessionStats.correct + (correct ? 1 : 0),
        incorrect: sessionStats.incorrect + (correct ? 0 : 1),
      }
      setSessionStats(newStats)

      if (userPlan === "free") {
        const newCount = dailyQuestionsCount + 1
        setDailyQuestionsCount(newCount)

        if (hasReachedDailyLimit(newCount, userPlan)) {
          setIsBlocked(true)
        }
      }

      if (currentQuestion?.id) {
        try {
          const userId = user?.id || user?.usuario_id
          await saveQuizAnswer(userId, currentQuestion.id, letter, correct, "estudo")
          console.log("[v0] Answer saved successfully - progress updated in database")
        } catch (error) {
          console.error("Error saving answer:", error)
        }
      } else {
        console.warn("Skipping save - question has no ID:", currentQuestion)
      }
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setAnswered(false)
    } else {
      setIsComplete(true)
    }
  }

  return (
    <div>
      <Navbar user={user} />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false)
          router.push("/dashboard")
        }}
        reason={upgradeReason}
      />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              Questão {currentIndex + 1} de {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentIndex + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          {(currentQuestion?.tema || currentQuestion?.subtema) && (
            <div className="flex gap-2 mb-6">
              {currentQuestion?.tema && (
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {currentQuestion.tema}
                </span>
              )}
              {currentQuestion?.subtema && (
                <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                  {currentQuestion.subtema}
                </span>
              )}
            </div>
          )}

          <h2 className="text-xl font-bold text-foreground mb-8 whitespace-pre-wrap break-words">
            {currentQuestion?.enunciado}
          </h2>

          <div className="space-y-3 mb-8">
            {alternatives.map((alt) => {
              const altLetter = alt.letter
              const isSelected = selectedAnswer === altLetter
              const isCorrectAlt = altLetter === correctLetter

              return (
                <button
                  key={alt.letter}
                  onClick={() => handleSelectAnswer(altLetter)}
                  disabled={answered}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    isSelected
                      ? isCorrect
                        ? "border-accent bg-accent/10"
                        : "border-destructive bg-destructive/10"
                      : answered && isCorrectAlt
                        ? "border-accent bg-accent/10"
                        : "border-input hover:border-muted"
                  } ${answered ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-foreground w-6 flex-shrink-0">{altLetter}</span>
                    <span className="text-foreground flex-1 whitespace-pre-wrap break-words">{alt.text}</span>
                    {answered && isCorrectAlt && <span className="text-accent font-bold flex-shrink-0">✓</span>}
                    {answered && isSelected && !isCorrect && (
                      <span className="text-destructive font-bold flex-shrink-0">✗</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {answered && (
            <div
              className={`p-4 rounded-lg ${isCorrect ? "bg-accent/10 border border-accent" : "bg-destructive/10 border border-destructive"}`}
            >
              <p className={`text-sm font-medium ${isCorrect ? "text-accent" : "text-destructive"}`}>
                {isCorrect ? "Resposta Correta!" : "Resposta Incorreta"}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {answered && (
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              {currentIndex < questions.length - 1 ? "Próxima" : "Finalizar"}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
