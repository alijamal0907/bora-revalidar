"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { Navbar } from "@/components/navbar"
import { Brain, BookOpen, CheckCircle2, XCircle, ArrowLeft, Lock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getWrongAnswers, getUserPlan } from "@/lib/storage-supabase"
import { getWrongFlashcards } from "@/lib/flashcards-storage"
import { QuestionStudyMode } from "@/components/question-study-mode"
import { FlashcardStudyMode } from "@/components/flashcard-study-mode"
import type { UserPlan } from "@/lib/plan-utils"

const normalizeTema = (tema: string): string => {
  const temaLower = tema.toLowerCase().trim()

  if (temaLower.includes("clinica medica") || temaLower.includes("clínica médica")) {
    return "Clínica Médica"
  }
  if (temaLower.includes("cirurgia") || temaLower.includes("cirurgica") || temaLower.includes("cirúrgica")) {
    return "Cirurgia"
  }
  if (temaLower.includes("ginecologia") || temaLower.includes("obstetricia") || temaLower.includes("obstetrícia")) {
    return "Ginecologia e Obstetrícia"
  }
  if (temaLower.includes("pediatria")) {
    return "Pediatria"
  }
  if (
    temaLower.includes("preventiva") ||
    temaLower.includes("saude coletiva") ||
    temaLower.includes("saúde coletiva")
  ) {
    return "Medicina Preventiva"
  }

  return "Outros"
}

export default function ReviewPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userPlan, setUserPlan] = useState<UserPlan>("free")
  const [incorrectQuestions, setIncorrectQuestions] = useState<any[]>([])
  const [wrongFlashcards, setWrongFlashcards] = useState<any[]>([])
  const [reviewingWrong, setReviewingWrong] = useState(false)
  const [reviewingFlashcards, setReviewingFlashcards] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const checkAuth = async () => {
      try {
        console.log("[v0] ReviewPage: Starting auth check")
        const currentUser = await getSupabaseUser()

        if (!currentUser) {
          console.log("[v0] ReviewPage: No user found, redirecting to login")
          router.push("/login")
          return
        }

        console.log("[v0] ReviewPage: User authenticated:", currentUser.id)
        setUser(currentUser)

        // Buscar plano do usuário
        try {
          const plan = await getUserPlan(currentUser.email)
          console.log("[v0] ReviewPage: User plan:", plan)
          setUserPlan(plan)
        } catch (error) {
          console.error("[v0] ReviewPage: Error getting user plan:", error)
          setUserPlan("free")
        }

        // Buscar questões e flashcards errados
        try {
          console.log("[v0] ReviewPage: Fetching wrong answers and flashcards")
          const [wrongQuestions, wrongCards] = await Promise.all([
            getWrongAnswers(currentUser.id),
            getWrongFlashcards(currentUser.id),
          ])

          console.log("[v0] ReviewPage: Wrong questions:", wrongQuestions?.length || 0)
          console.log("[v0] ReviewPage: Wrong flashcards:", wrongCards?.length || 0)

          setIncorrectQuestions(wrongQuestions || [])
          setWrongFlashcards(wrongCards || [])
        } catch (error) {
          console.error("[v0] ReviewPage: Error fetching wrong answers:", error)
          setIncorrectQuestions([])
          setWrongFlashcards([])
        }

        setIsLoading(false)
      } catch (error: any) {
        console.error("[v0] ReviewPage: Error in checkAuth:", error)
        setError(error?.message || "Erro ao carregar dados")
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (error) {
    return (
      <div>
        <Navbar user={user} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Erro ao Carregar</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setError(null)
                setIsLoading(true)
                window.location.reload()
              }}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-muted text-foreground px-6 py-2 rounded-lg hover:bg-muted/80 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

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

  const handleReviewByTheme = (theme: string) => {
    setSelectedTheme(theme)
    setReviewingWrong(true)
  }

  const handleReviewFlashcards = (materia: string) => {
    setSelectedMateria(materia)
    setReviewingFlashcards(true)
  }

  const handleBackToOverview = () => {
    setReviewingWrong(false)
    setReviewingFlashcards(false)
    setSelectedTheme(null)
    setSelectedMateria(null)
  }

  // Modo de revisão de questões erradas por tema
  if (reviewingWrong && selectedTheme) {
    const questionsToReview = incorrectQuestions.filter((q) => normalizeTema(q.tema) === selectedTheme)

    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <button
              onClick={handleBackToOverview}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para visão geral
            </button>
            <h1 className="text-3xl font-bold text-foreground mb-2">Revisando: {selectedTheme}</h1>
            <p className="text-muted-foreground">{questionsToReview.length} questão(ões) para revisar neste tema</p>
          </div>

          <QuestionStudyMode questions={questionsToReview} onComplete={handleBackToOverview} isReviewMode={true} />
        </main>
      </div>
    )
  }

  // Modo de revisão de flashcards errados
  if (reviewingFlashcards && selectedMateria) {
    const flashcardsToReview = wrongFlashcards.filter((f) => f.materia === selectedMateria)

    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <button
              onClick={handleBackToOverview}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para visão geral
            </button>
            <h1 className="text-3xl font-bold text-foreground mb-2">Revisando Flashcards: {selectedMateria}</h1>
            <p className="text-muted-foreground">{flashcardsToReview.length} flashcard(s) para revisar nesta matéria</p>
          </div>

          <FlashcardStudyMode
            materia={selectedMateria}
            tema="Revisão de Erros"
            onBack={handleBackToOverview}
            userPlan={userPlan}
            fetchFlashcards={async () => flashcardsToReview}
          />
        </main>
      </div>
    )
  }

  const questionsByTheme = getWrongQuestionsByTheme()
  const flashcardsByMateria = getWrongFlashcardsByMateria()

  return (
    <div>
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Brain className="w-10 h-10 text-primary" />
                Revisão de Erros
              </h1>
              <p className="text-muted-foreground text-lg">
                Revise suas questões e flashcards incorretos para melhorar seu desempenho
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="questions-wrong">Questões Erradas</TabsTrigger>
            <TabsTrigger value="flashcards-wrong">Flashcards Errados</TabsTrigger>
          </TabsList>

          {/* Aba: Visão Geral */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Questões Erradas</h3>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-4xl font-bold text-foreground mb-2">{incorrectQuestions.length}</p>
                <p className="text-sm text-muted-foreground">Total de questões para revisar</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Flashcards Errados</h3>
                  <BookOpen className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-4xl font-bold text-foreground mb-2">{wrongFlashcards.length}</p>
                <p className="text-sm text-muted-foreground">Total de flashcards para revisar</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Matérias Estudadas</h3>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-4xl font-bold text-foreground mb-2">
                  {Object.keys(questionsByTheme).length + Object.keys(flashcardsByMateria).length}
                </p>
                <p className="text-sm text-muted-foreground">Diferentes áreas</p>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-6 min-w-[200px]">
              <p className="text-sm text-muted-foreground mb-2">Distribuição</p>
              <div className="space-y-2">
                {Object.entries(questionsByTheme)
                  .sort((a, b) => b[1] - a[1])
                  .map(([theme, count]) => (
                    <div key={theme} className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{theme}</span>
                      <span className="text-muted-foreground">{count} questões</span>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Aba: Questões Erradas */}
          <TabsContent value="questions-wrong" className="space-y-6">
            {Object.keys(questionsByTheme).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(questionsByTheme)
                  .sort((a, b) => b[1] - a[1])
                  .map(([theme, count]) => (
                    <button
                      key={theme}
                      onClick={() => handleReviewByTheme(theme)}
                      className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-lg transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {theme}
                        </h3>
                        <XCircle className="w-6 h-6 text-red-500" />
                      </div>
                      <p className="text-3xl font-bold text-foreground mb-2">{count}</p>
                      <p className="text-sm text-muted-foreground">questões para revisar</p>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Parabéns!</h3>
                <p className="text-muted-foreground">Você não tem questões erradas para revisar no momento.</p>
              </div>
            )}
          </TabsContent>

          {/* Aba: Flashcards Errados */}
          <TabsContent value="flashcards-wrong" className="space-y-6">
            {userPlan === "free" ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Recurso Premium</h3>
                <p className="text-muted-foreground mb-6">
                  A revisão de flashcards errados é exclusiva para usuários premium.
                </p>
                <button
                  onClick={() => router.push("/pricing")}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  Fazer Upgrade
                </button>
              </div>
            ) : Object.keys(flashcardsByMateria).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(flashcardsByMateria)
                  .sort((a, b) => b[1] - a[1])
                  .map(([materia, count]) => (
                    <button
                      key={materia}
                      onClick={() => handleReviewFlashcards(materia)}
                      className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-lg transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {materia}
                        </h3>
                        <BookOpen className="w-6 h-6 text-amber-500" />
                      </div>
                      <p className="text-3xl font-bold text-foreground mb-2">{count}</p>
                      <p className="text-sm text-muted-foreground">flashcards para revisar</p>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Excelente!</h3>
                <p className="text-muted-foreground">Você não tem flashcards errados para revisar no momento.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )

  function getWrongQuestionsByTheme() {
    const themeGroups: { [key: string]: number } = {}

    incorrectQuestions.forEach((q) => {
      const normalizedTheme = normalizeTema(q.tema)
      themeGroups[normalizedTheme] = (themeGroups[normalizedTheme] || 0) + 1
    })

    const orderedThemes = [
      "Clínica Médica",
      "Cirurgia",
      "Pediatria",
      "Medicina Preventiva",
      "Ginecologia e Obstetrícia",
    ]

    const result: { [key: string]: number } = {}
    orderedThemes.forEach((theme) => {
      if (themeGroups[theme]) {
        result[theme] = themeGroups[theme]
      }
    })

    return result
  }

  function getWrongFlashcardsByMateria() {
    const materiaGroups: { [key: string]: number } = {}

    wrongFlashcards.forEach((f) => {
      materiaGroups[f.materia] = (materiaGroups[f.materia] || 0) + 1
    })

    return materiaGroups
  }
}
