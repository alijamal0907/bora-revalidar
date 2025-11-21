"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { Navbar } from "@/components/navbar"
import { MultiThemeSelector } from "@/components/multi-theme-selector"
import { getQuestoesWithAlternatives, saveQuizAnswer } from "@/lib/storage-supabase"
import { Settings, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { UpgradeModal } from "@/components/upgrade-modal"
import { getUserPlan, getDailyQuestionCount } from "@/lib/storage-supabase"
import { hasReachedDailyLimit } from "@/lib/plan-utils"
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
  [key: string]: any
}

export default function SimulationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [stats, setStats] = useState({ total: 0, correct: 0 })
  const [isComplete, setIsComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [numQuestions, setNumQuestions] = useState(10)
  const [showSettings, setShowSettings] = useState(true)
  const [userPlan, setUserPlan] = useState<UserPlan>("free")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"daily_limit" | "theme_limit" | "general">("general")

  useEffect(() => {
    const loadSimulationCards = async () => {
      if (!showSettings) {
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

            if (hasReachedDailyLimit(todayCount, plan)) {
              setUpgradeReason("daily_limit")
              setShowUpgradeModal(true)
              setIsLoading(false)
              return
            }
          }

          const allQuestions = await getQuestoesWithAlternatives(
            currentUser.usuario_id || currentUser.id,
            selectedThemes.length > 0 ? selectedThemes : undefined,
          )

          const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, numQuestions)

          setQuestions(shuffled)
          setIsLoading(false)
        } catch (error) {
          console.error("[v0] Error loading simulation cards:", error)
          setIsLoading(false)
        }
      }
    }

    loadSimulationCards()
  }, [router, showSettings, selectedThemes, numQuestions])

  if (showSettings) {
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
              <h1 className="text-2xl font-bold text-foreground">Configurações do Simulado</h1>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Temas</label>
                <MultiThemeSelector selectedThemes={selectedThemes} onThemesChange={setSelectedThemes} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Quantidade de Questões: {numQuestions}
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSettings(false)
                  setIsLoading(true)
                }}
                className="w-full px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors mt-8"
              >
                Iniciar Simulado
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">Carregando simulado...</p>
        </div>
      </div>
    )
  }

  if (isComplete || questions.length === 0) {
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
            <h1 className="text-3xl font-bold text-foreground mb-4">Simulado Concluído!</h1>
            <div className="bg-muted/50 rounded-lg p-8 mb-8">
              <p className="text-muted-foreground text-sm mb-2">Sua Pontuação</p>
              <p className="text-5xl font-bold text-primary">
                {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                {stats.correct} de {stats.total} corretas
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowSettings(true)
                  setCurrentIndex(0)
                  setSelectedAnswer(null)
                  setAnswered(false)
                  setStats({ total: 0, correct: 0 })
                }}
                className="flex-1 px-6 py-2 bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const correctLetter = String(currentQuestion.correta || "A")
    .toUpperCase()
    .trim()

  const alternatives = [
    { letter: "A", text: currentQuestion.alternativaA },
    { letter: "B", text: currentQuestion.alternativaB },
    { letter: "C", text: currentQuestion.alternativaC },
    { letter: "D", text: currentQuestion.alternativaD },
    { letter: "E", text: currentQuestion.alternativaE },
  ]

  const isCorrect = selectedAnswer === correctLetter

  const handleSelectAnswer = async (letter: string) => {
    if (!answered && !isLoading) {
      setSelectedAnswer(letter)
      setAnswered(true)

      const correct = letter === correctLetter
      const newStats = {
        total: stats.total + 1,
        correct: stats.correct + (correct ? 1 : 0),
      }
      setStats(newStats)

      try {
        await saveQuizAnswer(user.usuario_id || user.id, currentQuestion.id, letter, correct, "simulado")
      } catch (error) {
        console.error("[v0] Error saving answer:", error)
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

        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-8 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Pontuação Atual</p>
            <p className="text-2xl font-bold text-accent">
              {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : "-"}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Corretas</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.correct}/{stats.total}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-8 whitespace-pre-wrap break-words">
            {currentQuestion.enunciado}
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
                    {answered && isCorrectAlt && <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />}
                    {answered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
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

        {answered && (
          <button
            onClick={handleNext}
            className="w-full px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            {currentIndex < questions.length - 1 ? "Próxima" : "Finalizar"}
          </button>
        )}
      </main>
    </div>
  )
}
