"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { Navbar } from "@/components/navbar"
import { getWrongAnswers, getProgressByTheme, saveQuizAnswer } from "@/lib/storage-supabase"
import { TrendingUp, Calendar, BookOpen, ArrowLeft, AlertCircle, Play, Filter } from "lucide-react"
import { UpgradeModal } from "@/components/upgrade-modal"
import { getUserPlan } from "@/lib/storage-supabase"
import { canAccessReview } from "@/lib/plan-utils"
import type { UserPlan } from "@/lib/plan-utils"

interface Question {
  id: string
  enunciado: string
  alternativaA: string
  alternativaB: string
  alternativaC: string
  alternativaD: string
  alternativaE: string
  respostaCorreta: string
  wrongCount: number
  [key: string]: any
}

const ALLOWED_THEMES = ["Clínica Médica", "Cirurgia", "Medicina Preventiva", "Pediatria", "Ginecologia e Obstetrícia"]

function normalizeThemeName(theme: string): string {
  return theme
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function mapToAllowedTheme(dbTheme: string): string | null {
  const normalized = normalizeThemeName(dbTheme)

  for (const allowed of ALLOWED_THEMES) {
    const normalizedAllowed = normalizeThemeName(allowed)
    if (normalized.includes(normalizedAllowed) || normalizedAllowed.includes(normalized)) {
      return allowed
    }
  }

  return null
}

export default function ReviewPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [themeProgress, setThemeProgress] = useState<any[]>([])
  const [wrongAnswers, setWrongAnswers] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "wrong" | "review">("overview")
  const [reviewingWrong, setReviewingWrong] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewStats, setReviewStats] = useState({ reviewed: 0, correct: 0 })
  const [reviewAnswered, setReviewAnswered] = useState(false)
  const [reviewSelected, setReviewSelected] = useState<string | null>(null)

  const [filteredReviewQuestions, setFilteredReviewQuestions] = useState<Question[]>([])
  const [selectedReviewTheme, setSelectedReviewTheme] = useState<string | null>(null)

  const [userPlan, setUserPlan] = useState<UserPlan>("free")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    const loadReviewData = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)

        const plan = await getUserPlan(currentUser.email)
        setUserPlan(plan)

        if (!canAccessReview(plan)) {
          setShowUpgradeModal(true)
          setIsLoading(false)
          return
        }

        const [progress, wrong] = await Promise.all([
          getProgressByTheme(currentUser.usuario_id || currentUser.id),
          getWrongAnswers(currentUser.usuario_id || currentUser.id),
        ])

        const themeMap = new Map<string, { correct: number; wrong: number; total: number }>()

        progress.forEach((p) => {
          const mappedTheme = mapToAllowedTheme(p.theme)
          if (mappedTheme) {
            const existing = themeMap.get(mappedTheme) || { correct: 0, wrong: 0, total: 0 }
            themeMap.set(mappedTheme, {
              correct: existing.correct + p.correct,
              wrong: existing.wrong + p.wrong,
              total: existing.total + p.total,
            })
          }
        })

        const consolidatedProgress = Array.from(themeMap.entries()).map(([theme, stats]) => ({
          theme,
          correct: stats.correct,
          wrong: stats.wrong,
          total: stats.total,
          percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        }))

        console.log("[v0] Consolidated progress to 5 main themes:", consolidatedProgress)
        setThemeProgress(consolidatedProgress)
        setWrongAnswers(wrong)
        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error loading review data:", error)
        setIsLoading(false)
      }
    }

    loadReviewData()
  }, [router])

  const startReview = (theme: string | null = null) => {
    let questionsToReview = wrongAnswers

    if (theme) {
      questionsToReview = wrongAnswers.filter((q) => {
        const qTheme = (q.tema || q.category || "").toLowerCase().trim()
        const targetTheme = theme.toLowerCase().trim()
        return qTheme.includes(targetTheme) || targetTheme.includes(qTheme)
      })
    }

    if (questionsToReview.length === 0) return

    setFilteredReviewQuestions(questionsToReview)
    setSelectedReviewTheme(theme)
    setReviewingWrong(true)
    setReviewIndex(0)
    setReviewStats({ reviewed: 0, correct: 0 })
    setReviewAnswered(false)
    setReviewSelected(null)
    setActiveTab("review")
  }

  const getWrongQuestionsByTheme = () => {
    const grouped: { [key: string]: Question[] } = {}

    ALLOWED_THEMES.forEach((theme) => {
      grouped[theme] = []
    })

    wrongAnswers.forEach((q) => {
      const qTheme = (q.tema || q.category || "").toLowerCase().trim()

      // Find matching allowed theme
      const matchedTheme = ALLOWED_THEMES.find((allowed) => {
        const allowedLower = allowed.toLowerCase()
        return qTheme.includes(allowedLower) || allowedLower.includes(qTheme)
      })

      if (matchedTheme) {
        grouped[matchedTheme].push(q)
      } else {
        // Optional: Put in 'Outros' or ignore if we strictly only want the 5 themes
        // For now, let's ignore or put in a generic bucket if needed, but user asked for specific themes
      }
    })

    return grouped
  }

  if (!user || isLoading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">Carregando dados de revisão...</p>
        </div>
      </div>
    )
  }

  // Modal de upgrade para revisão bloqueada
  if (showUpgradeModal) {
    return (
      <div>
        <Navbar user={user} />
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false)
            router.push("/dashboard")
          }}
          reason="review_blocked"
        />
      </div>
    )
  }

  // Overview tab content
  if (activeTab === "overview" && !reviewingWrong) {
    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <h1 className="text-4xl font-bold text-foreground mb-2">Seu Progresso</h1>
          <p className="text-muted-foreground text-lg mb-8">Acompanhe seu desempenho e melhore continuamente</p>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-primary border-b-2 border-primary -mb-2"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("wrong")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "wrong"
                  ? "text-primary border-b-2 border-primary -mb-2"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Questões Erradas ({wrongAnswers.length})
            </button>
          </div>

          {/* Progresso por Matéria */}
          <div className="bg-card border border-border rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-8">Progresso por Matéria</h2>
            <div className="space-y-6">
              {ALLOWED_THEMES.map((themeName) => {
                const themeData = themeProgress.find((t) => t.theme === themeName)
                const correct = themeData?.correct || 0
                const wrong = themeData?.wrong || 0
                const total = themeData?.total || 0
                const percentage = themeData?.percentage || 0

                return (
                  <div key={themeName}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-bold text-foreground">{themeName}</span>
                        <span className="ml-4 text-sm text-muted-foreground">
                          {correct}/{total} corretas
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{percentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Corretas: {correct}</span>
                      <span>Erradas: {wrong}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats Cards */}
          {themeProgress.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total de Questões</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {themeProgress.reduce((sum, t) => sum + t.total, 0)}
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Média de Acerto</p>
                    <p className="text-3xl font-bold text-accent mt-2">
                      {Math.round(themeProgress.reduce((sum, t) => sum + t.percentage, 0) / themeProgress.length)}%
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Matérias Estudadas</p>
                    <p className="text-3xl font-bold text-secondary mt-2">{themeProgress.length}</p>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  // Wrong Answers tab
  if (activeTab === "wrong" && !reviewingWrong) {
    const groupedQuestions = getWrongQuestionsByTheme()

    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <h1 className="text-3xl font-bold text-foreground mb-2">Questões Erradas</h1>
          <p className="text-muted-foreground mb-8">Revise suas questões erradas por tema ou todas de uma vez</p>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <button
              onClick={() => setActiveTab("overview")}
              className="px-4 py-2 font-medium transition-colors text-muted-foreground hover:text-foreground"
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("wrong")}
              className="px-4 py-2 font-medium transition-colors text-primary border-b-2 border-primary -mb-2"
            >
              Questões Erradas ({wrongAnswers.length})
            </button>
          </div>

          {/* Review All Card */}
          <div className="bg-card border border-border rounded-lg p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Revisão Geral</h2>
              <p className="text-muted-foreground">
                Você tem um total de <span className="font-bold text-destructive">{wrongAnswers.length}</span> questões
                erradas para revisar.
              </p>
            </div>
            <button
              onClick={() => startReview(null)}
              disabled={wrongAnswers.length === 0}
              className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <Play className="w-5 h-5" />
              Revisar Todas as Erradas
            </button>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Revisar por Tema
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {ALLOWED_THEMES.map((theme) => {
              const count = groupedQuestions[theme]?.length || 0
              return (
                <div
                  key={theme}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-lg text-foreground">{theme}</h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${count > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
                    >
                      {count} erradas
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-destructive transition-all"
                        style={{ width: `${Math.min((count / (wrongAnswers.length || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => startReview(theme)}
                    disabled={count === 0}
                    className="w-full py-2 border border-primary text-primary font-medium rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-muted disabled:text-muted-foreground flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Revisar {theme}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Recent Wrong Questions List */}
          {wrongAnswers.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold text-foreground mb-6">Últimas Questões Erradas</h3>
              <div className="space-y-4">
                {wrongAnswers.slice(0, 5).map((question) => (
                  <div
                    key={question.id}
                    className="bg-card border border-border rounded-lg p-6 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-2 line-clamp-2">{question.enunciado}</h3>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          <span className="text-sm text-destructive">Errada {question.wrongCount} vez(es)</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full ml-4 whitespace-nowrap">
                        {question.tema || "Geral"}
                      </span>
                    </div>
                  </div>
                ))}
                {wrongAnswers.length > 5 && (
                  <p className="text-center text-muted-foreground text-sm mt-4">
                    E mais {wrongAnswers.length - 5} questões...
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  // Review mode for wrong answers
  if (reviewingWrong && filteredReviewQuestions.length > 0) {
    const currentQuestion = filteredReviewQuestions[reviewIndex]
    const alternatives = [
      { letter: "A", text: currentQuestion.alternativaA },
      { letter: "B", text: currentQuestion.alternativaB },
      { letter: "C", text: currentQuestion.alternativaC },
      { letter: "D", text: currentQuestion.alternativaD },
      { letter: "E", text: currentQuestion.alternativaE },
    ].sort(() => Math.random() - 0.5)

    const correctLetter = currentQuestion.respostaCorreta?.toUpperCase() || "A"
    const isCorrect = reviewSelected === correctLetter

    const handleSelectAnswer = async (letter: string) => {
      if (!reviewAnswered && !isLoading) {
        setReviewSelected(letter)
        setReviewAnswered(true)

        const correct = letter === correctLetter
        if (correct) {
          setReviewStats({
            reviewed: reviewStats.reviewed + 1,
            correct: reviewStats.correct + 1,
          })
        } else {
          setReviewStats({
            reviewed: reviewStats.reviewed + 1,
            correct: reviewStats.correct,
          })
        }

        try {
          await saveQuizAnswer(user.usuario_id || user.id, currentQuestion.id, letter, correct, "estudo")
        } catch (error) {
          console.error("[v0] Error saving answer:", error)
        }
      }
    }

    const handleNext = () => {
      if (reviewIndex < filteredReviewQuestions.length - 1) {
        setReviewIndex(reviewIndex + 1)
        setReviewSelected(null)
        setReviewAnswered(false)
      } else {
        setReviewingWrong(false)
        setReviewIndex(0)
        setReviewStats({ reviewed: 0, correct: 0 })
        setFilteredReviewQuestions([])
        setSelectedReviewTheme(null)
        setActiveTab("wrong") // Go back to wrong list instead of overview
      }
    }

    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <button
            onClick={() => {
              setReviewingWrong(false)
              setReviewIndex(0)
              setReviewStats({ reviewed: 0, correct: 0 })
              setFilteredReviewQuestions([])
              setSelectedReviewTheme(null)
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Lista
          </button>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="text-sm font-medium text-foreground block">
                  Revisando: {selectedReviewTheme || "Todas as Erradas"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Questão {reviewIndex + 1} de {filteredReviewQuestions.length}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(((reviewIndex + 1) / filteredReviewQuestions.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((reviewIndex + 1) / filteredReviewQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {currentQuestion.tema || "Geral"}
              </span>
              <div className="flex items-center gap-1 text-destructive text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>Errada {currentQuestion.wrongCount}x</span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground mb-8">{currentQuestion.enunciado}</h2>

            <div className="space-y-3 mb-8">
              {alternatives.map((alt) => {
                const altLetter = alt.letter
                const isSelected = reviewSelected === altLetter
                const isCorrectAlt = altLetter === correctLetter

                return (
                  <button
                    key={alt.letter}
                    onClick={() => handleSelectAnswer(altLetter)}
                    disabled={reviewAnswered}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? isCorrect
                          ? "border-accent bg-accent/10"
                          : "border-destructive bg-destructive/10"
                        : reviewAnswered && isCorrectAlt
                          ? "border-accent bg-accent/10"
                          : "border-input hover:border-muted"
                    } ${reviewAnswered ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground w-6">{altLetter}</span>
                      <span className="text-foreground flex-1">{alt.text}</span>
                      {reviewAnswered && isCorrectAlt && <span className="text-accent font-bold">✓</span>}
                      {reviewAnswered && isSelected && !isCorrect && (
                        <span className="text-destructive font-bold">✗</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {reviewAnswered && (
              <div
                className={`p-4 rounded-lg ${isCorrect ? "bg-accent/10 border border-accent" : "bg-destructive/10 border border-destructive"}`}
              >
                <p className={`text-sm font-medium ${isCorrect ? "text-accent" : "text-destructive"}`}>
                  {isCorrect ? "Resposta Correta!" : "Resposta Incorreta"}
                </p>
              </div>
            )}
          </div>

          {reviewAnswered && (
            <button
              onClick={handleNext}
              className="w-full px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              {reviewIndex < filteredReviewQuestions.length - 1 ? "Próxima" : "Finalizar Revisão"}
            </button>
          )}
        </main>
      </div>
    )
  }

  return null
}
