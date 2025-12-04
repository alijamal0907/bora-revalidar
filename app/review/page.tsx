"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { Navbar } from "@/components/navbar"
import { Brain, BookOpen, CheckCircle2, XCircle, ArrowLeft, Lock, TrendingUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getWrongAnswers, getUserPlan } from "@/lib/storage-supabase"
import { getWrongFlashcards } from "@/lib/flashcards-storage"
import { QuestionStudyMode } from "@/components/question-study-mode"
import { FlashcardStudyMode } from "@/components/flashcard-study-mode"
import type { UserPlan } from "@/lib/plan-utils"

const TEMAS_PRINCIPAIS = ["Clínica Médica", "Cirurgia", "Medicina Preventiva", "Pediatria", "Ginecologia e Obstetrícia"]

const normalizeTema = (tema: string | null | undefined): string => {
  if (!tema || typeof tema !== "string") return "Outros"

  const temaLower = tema.toLowerCase().trim()

  if (temaLower.includes("clinica") || temaLower.includes("clínica") || temaLower.includes("médica"))
    return "Clínica Médica"
  if (temaLower.includes("cirurgia") || temaLower.includes("cirúrgica")) return "Cirurgia"
  if (temaLower.includes("ginecologia") || temaLower.includes("obstetrícia") || temaLower.includes("obstetricia"))
    return "Ginecologia e Obstetrícia"
  if (temaLower.includes("pediatria") || temaLower.includes("criança")) return "Pediatria"
  if (
    temaLower.includes("preventiva") ||
    temaLower.includes("coletiva") ||
    temaLower.includes("saúde pública") ||
    temaLower.includes("saude publica")
  )
    return "Medicina Preventiva"

  return "Outros"
}

export default function ReviewPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userPlan, setUserPlan] = useState<UserPlan>("free")
  const [incorrectQuestions, setIncorrectQuestions] = useState<any[]>([])
  const [wrongFlashcards, setWrongFlashcards] = useState<any[]>([])

  const [activeReviewMode, setActiveReviewMode] = useState<"none" | "questions" | "flashcards">("none")
  const [activeTheme, setActiveTheme] = useState<string | null>(null)
  const [activeQuestions, setActiveQuestions] = useState<any[]>([])
  const [activeFlashcards, setActiveFlashcards] = useState<any[]>([])

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const checkAuth = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push("/login")
          return
        }

        setUser(currentUser)

        try {
          const plan = await getUserPlan(currentUser.email)
          setUserPlan(plan)
        } catch (error) {
          setUserPlan("free")
        }

        try {
          const [wrongQuestions, wrongCards] = await Promise.all([
            getWrongAnswers(currentUser.id),
            getWrongFlashcards(currentUser.id),
          ])

          setIncorrectQuestions(wrongQuestions || [])
          setWrongFlashcards(wrongCards || [])
        } catch (error) {
          console.error("Erro ao carregar questões erradas:", error)
          setIncorrectQuestions([])
          setWrongFlashcards([])
        }

        setIsLoading(false)
      } catch (error: any) {
        setError(error?.message || "Erro ao carregar dados")
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const questionsByTheme = incorrectQuestions.reduce(
    (acc, q) => {
      const theme = normalizeTema(q.tema)

      if (TEMAS_PRINCIPAIS.includes(theme)) {
        if (!acc[theme]) acc[theme] = []
        acc[theme].push(q)
      }
      return acc
    },
    {} as { [key: string]: any[] },
  )

  const flashcardsByMateria = wrongFlashcards.reduce(
    (acc, f) => {
      const materia = f.materia || "Outras"
      if (!acc[materia]) acc[materia] = []
      acc[materia].push(f)
      return acc
    },
    {} as { [key: string]: any[] },
  )

  const handleReviewByTheme = (theme: string) => {
    const questionsForTheme = questionsByTheme[theme]
    if (!questionsForTheme || questionsForTheme.length === 0) return

    setActiveTheme(theme)
    setActiveQuestions([...questionsForTheme])
    setActiveReviewMode("questions")
  }

  const handleReviewFlashcards = (materia: string) => {
    const flashcardsForMateria = flashcardsByMateria[materia]
    if (!flashcardsForMateria || flashcardsForMateria.length === 0) return

    setActiveTheme(materia)
    setActiveFlashcards([...flashcardsForMateria])
    setActiveReviewMode("flashcards")
  }

  const handleBackToOverview = () => {
    setActiveReviewMode("none")
    setActiveTheme(null)
    setActiveQuestions([])
    setActiveFlashcards([])
  }

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
              onClick={() => window.location.reload()}
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando suas questões erradas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (activeReviewMode === "questions" && activeQuestions.length > 0) {
    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBackToOverview}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para visão geral</span>
          </button>

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 mb-8 border border-primary/20">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Revisando: {activeTheme}
            </h1>
            <p className="text-muted-foreground">
              {activeQuestions.length} questão{activeQuestions.length !== 1 ? "ões" : ""} para revisar neste tema
            </p>
          </div>

          <QuestionStudyMode questions={activeQuestions} onComplete={handleBackToOverview} isReviewMode={true} />
        </main>
      </div>
    )
  }

  if (activeReviewMode === "flashcards" && activeFlashcards.length > 0) {
    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBackToOverview}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para visão geral</span>
          </button>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-6 mb-8 border border-amber-500/20">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-amber-500" />
              Revisando Flashcards: {activeTheme}
            </h1>
            <p className="text-muted-foreground">
              {activeFlashcards.length} flashcard{activeFlashcards.length !== 1 ? "s" : ""} para revisar
            </p>
          </div>

          <FlashcardStudyMode
            materia={activeTheme!}
            tema="Revisão de Erros"
            onBack={handleBackToOverview}
            userPlan={userPlan}
            fetchFlashcards={async () => activeFlashcards}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao Dashboard</span>
          </button>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Revisão Inteligente</h1>
              <p className="text-lg text-muted-foreground">
                Revise suas questões e flashcards errados para fortalecer seu aprendizado
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Questões Erradas</h3>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-5xl font-bold text-foreground mb-1">{incorrectQuestions.length}</p>
            <p className="text-sm text-muted-foreground">para revisar</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Flashcards Errados
              </h3>
              <BookOpen className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-5xl font-bold text-foreground mb-1">{wrongFlashcards.length}</p>
            <p className="text-sm text-muted-foreground">para revisar</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Áreas Cobertas</h3>
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-5xl font-bold text-foreground mb-1">
              {Object.keys(questionsByTheme).length + Object.keys(flashcardsByMateria).length}
            </p>
            <p className="text-sm text-muted-foreground">temas diferentes</p>
          </div>
        </div>

        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 h-auto">
            <TabsTrigger
              value="questions"
              className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Questões Erradas
            </TabsTrigger>
            <TabsTrigger
              value="flashcards"
              className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Flashcards Errados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6 mt-8">
            {Object.keys(questionsByTheme).length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Selecione um Tema para Revisar</h2>
                  <p className="text-muted-foreground">
                    Clique em um tema para iniciar automaticamente a revisão das questões
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {TEMAS_PRINCIPAIS.map((theme) => {
                    const questions = questionsByTheme[theme] || []
                    if (questions.length === 0) return null

                    return (
                      <button
                        key={theme}
                        onClick={() => handleReviewByTheme(theme)}
                        className="group relative bg-card border-2 border-border hover:border-primary/50 rounded-xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 text-left overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />

                        <div className="relative">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {theme}
                            </h3>
                            <div className="p-2 bg-red-500/10 rounded-lg flex-shrink-0 ml-2">
                              <XCircle className="w-5 h-5 text-red-500" />
                            </div>
                          </div>

                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-bold text-foreground">{questions.length}</span>
                            <span className="text-sm text-muted-foreground">
                              questão{questions.length !== 1 ? "ões" : ""}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-primary font-medium">
                            <span>Começar revisão</span>
                            <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-12 text-center">
                <div className="max-w-md mx-auto">
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-foreground mb-3">Parabéns!</h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    Você não tem questões erradas para revisar no momento. Continue assim!
                  </p>
                  <button
                    onClick={() => router.push("/study")}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  >
                    Continuar Estudando
                  </button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="flashcards" className="space-y-6 mt-8">
            {userPlan === "free" ? (
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Lock className="w-20 h-20 text-amber-500 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-foreground mb-3">Recurso Premium</h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    A revisão de flashcards errados é exclusiva para usuários premium.
                  </p>
                  <button
                    onClick={() => router.push("/upgrade")}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg"
                  >
                    Fazer Upgrade Agora
                  </button>
                </div>
              </div>
            ) : Object.keys(flashcardsByMateria).length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Selecione uma Matéria para Revisar</h2>
                  <p className="text-muted-foreground">
                    Clique em um card para começar a revisar os flashcards dessa matéria
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(flashcardsByMateria)
                    .sort((a, b) => b[1].length - a[1].length)
                    .map(([materia, flashcards]) => (
                      <button
                        key={materia}
                        onClick={() => handleReviewFlashcards(materia)}
                        className="group relative bg-card border-2 border-border hover:border-amber-500/50 rounded-xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 text-left overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />

                        <div className="relative">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-amber-600 transition-colors line-clamp-2">
                              {materia}
                            </h3>
                            <div className="p-2 bg-amber-500/10 rounded-lg flex-shrink-0 ml-2">
                              <BookOpen className="w-5 h-5 text-amber-500" />
                            </div>
                          </div>

                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-bold text-foreground">{flashcards.length}</span>
                            <span className="text-sm text-muted-foreground">
                              flashcard{flashcards.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
                            <span>Começar revisão</span>
                            <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-12 text-center">
                <div className="max-w-md mx-auto">
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-foreground mb-3">Perfeito!</h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    Você não tem flashcards errados para revisar. Excelente trabalho!
                  </p>
                  <button
                    onClick={() => router.push("/flashcards")}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  >
                    Estudar Flashcards
                  </button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
