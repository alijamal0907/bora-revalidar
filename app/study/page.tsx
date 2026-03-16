"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { Navbar } from "@/components/navbar"
import {
  saveQuizAnswer,
  getUserPlan,
  getDailyQuestionCount,
  getStudyQuestions,
  getWrongQuestionIds,
  getCorrectlyAnsweredQuestions,
  getSubtemasByTema,
  getQuestionsByTemaAndSubtemas,
} from "@/lib/storage-supabase"
import { ArrowLeft, Lock, Clock } from "lucide-react"
import { UpgradeModal } from "@/components/upgrade-modal"
import { PlanStudySettings } from "@/components/plan-study-settings"
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
  resposta_correta?: string
  explicacao?: string | null
  [key: string]: any
}

interface SessionStats {
  reviewed: number
  correct: number
  incorrect: number
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <StudyInner />
    </Suspense>
  )
}

function StudyInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null)
  const [selectedTemas, setSelectedTemas] = useState<string[]>([])
  const [numQuestions, setNumQuestions] = useState(15) // Default to 15 for FREE users
  const [userPlan, setUserPlan] = useState<UserPlan>("free")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<"daily_limit" | "theme_limit" | "general">("general")
  const [dailyQuestionsCount, setDailyQuestionsCount] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [studyMode, setStudyMode] = useState<"settings" | "questions" | "complete">("settings") // Voltando para "settings" para mostrar tela de configuração primeiro
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [sessionStats, setSessionStats] = useState<SessionStats>({ reviewed: 0, correct: 0, incorrect: 0 })
  const [temas, setTemas] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState<"materia" | "tema_subtema">("materia") // Modo de seleção
  const [selectedGrandeArea, setSelectedGrandeArea] = useState<string | null>(null) // Grande área (tema)
  const [availableSubtemas, setAvailableSubtemas] = useState<Array<{ subtema: string; subtema_slug: string }>>([])
  const [selectedSubtemas, setSelectedSubtemas] = useState<string[]>([]) // Array de subtema texts
  const [loadingSubtemas, setLoadingSubtemas] = useState(false)

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
          if (remaining !== "unlimited" && remaining < 15) {
            setNumQuestions(remaining)
          }
        }

        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
      }
    }

    checkDailyLimit()
  }, [router])

  // Detectar parâmetros de URL vindos do Plano de Estudos
  useEffect(() => {
    const areaParam = searchParams.get('area')
    const subtemaParam = searchParams.get('subtema')
    if (areaParam && !isLoading) {
      setSelectedMateria(areaParam)
      setSelectedGrandeArea(areaParam)        // dispara carregamento de subtemas via outro useEffect
      setSelectionMode('tema_subtema')
      if (subtemaParam) {
        setSelectedSubtemas([subtemaParam])   // pré-seleciona o subtema do plano
      }
      setStudyMode('settings')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoading])

  // Carregar subtemas quando uma grande área é selecionada
  useEffect(() => {
    const loadSubtemas = async () => {
      if (selectionMode === "tema_subtema" && selectedGrandeArea) {
        setLoadingSubtemas(true)
        try {
          const subtemas = await getSubtemasByTema(selectedGrandeArea)
          setAvailableSubtemas(subtemas)
          // Só limpa selectedSubtemas se não veio seleção prévia da URL
          const urlSubtema = new URLSearchParams(window.location.search).get('subtema')
          if (!urlSubtema) {
            setSelectedSubtemas([])
          }
        } catch (error) {
          setAvailableSubtemas([])
        }
        setLoadingSubtemas(false)
      } else {
        setAvailableSubtemas([])
        if (!searchParams.get('area')) setSelectedSubtemas([])
      }
    }
    loadSubtemas()
  }, [selectedGrandeArea, selectionMode])

  const loadStudyCards = async (overrideParams?: { mode: "tema_subtema" | "materia"; area: string; subtemas: string[] }) => {
    try {
      const currentUser = await getSupabaseUser()
      if (!currentUser) { router.push("/login"); return }

      const plan = await getUserPlan(currentUser.email)
      setUserPlan(plan)
      if (plan === "premium") setIsBlocked(false)

      const userId = currentUser.id || currentUser.usuario_id
      const [wrongQuestionIds, correctQuestionIds] = await Promise.all([
        getWrongQuestionIds(userId),
        getCorrectlyAnsweredQuestions(userId),
      ])

      const effectiveMode    = overrideParams?.mode     ?? selectionMode
      const effectiveArea    = overrideParams?.area     ?? selectedGrandeArea
      const effectiveSubtemas = overrideParams?.subtemas ?? selectedSubtemas

      let allQuestions: any[] = []

      // Vindo do plano: usar a API server-side (evita race condition de estado)
      if (effectiveArea && (effectiveMode === "tema_subtema" || effectiveMode === "materia")) {
        const subtema = effectiveSubtemas.length === 1 ? effectiveSubtemas[0] : ""
        const url = `/api/questoes-subtema?area=${encodeURIComponent(effectiveArea)}${subtema ? `&subtema=${encodeURIComponent(subtema)}` : ""}`
        const res = await fetch(url)
        const json = await res.json()
        allQuestions = json.questoes || []
      } else {
        allQuestions = await getStudyQuestions(selectedMateria, selectedTemas)
      }

      const wrongIds = new Set(wrongQuestionIds)
      const wrongQuestions  = allQuestions.filter(q => wrongIds.has(q.id))
      const correctQuestions = allQuestions.filter(q => correctQuestionIds.includes(q.id) && !wrongIds.has(q.id))
      const newQuestions    = allQuestions.filter(q => !wrongIds.has(q.id) && !correctQuestionIds.includes(q.id))

      const prioritized = [
        ...wrongQuestions.sort(() => Math.random() - 0.5),
        ...newQuestions.sort(() => Math.random() - 0.5),
        ...correctQuestions.sort(() => Math.random() - 0.5),
      ]

      const limit = plan === "free" ? 15 : numQuestions
      setQuestions(prioritized.slice(0, limit))
      setCurrentIndex(0)
      setStudyMode("questions")
      setIsLoading(false)
    } catch (err) {
      console.error("[v0] Erro em loadStudyCards:", err)
      setIsLoading(false)
    }
  }

  const handleStartStudy = async (materiaOverride?: string, subtemaOverride?: string) => {
    setIsLoading(true)
    await loadStudyCards(
      materiaOverride
        ? { mode: subtemaOverride ? 'tema_subtema' : 'materia', area: materiaOverride, subtemas: subtemaOverride ? [subtemaOverride] : [] }
        : undefined
    )
  }

  const handleSelectAnswer = async (letter: string) => {
    if (!answered && !isLoading) {
      setSelectedAnswer(letter)
    }
  }

  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || answered) return

    setAnswered(true)

    const correct = selectedAnswer === correctLetter
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
        await saveQuizAnswer(userId, currentQuestion.id, selectedAnswer, correct, "estudo")
      } catch (error) {
        console.error("Error saving answer:", error)
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
      setStudyMode("complete")
    }
  }

  const currentQuestion = questions[currentIndex]
  const correctLetter = String(currentQuestion?.correta || currentQuestion?.resposta_correta || "A")
    .toUpperCase()
    .trim()

  const alternatives = [
    { letter: "A", text: currentQuestion?.alternativaA },
    { letter: "B", text: currentQuestion?.alternativaB },
    { letter: "C", text: currentQuestion?.alternativaC },
    { letter: "D", text: currentQuestion?.alternativaD },
  ]

  const isCorrect = selectedAnswer === correctLetter

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando questões...</p>
        </div>
      </div>
    )
  }

  if (isBlocked) {
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
            <p className="text-muted-foreground mb-8 text-lg">
              Você respondeu suas 15 questões diárias do plano FREE. Volte em aproximadamente{" "}
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

  if (studyMode === "settings") {
    const fromPlan = searchParams.get('area')

    if (fromPlan && selectedMateria) {
      return (
        <PlanStudySettings
          area={selectedMateria}
          preselectedSubtema={searchParams.get('subtema') || undefined}
          userPlan={userPlan}
          numQuestions={numQuestions}
          onNumQuestionsChange={setNumQuestions}
          onStart={(subtema) =>
            handleStartStudy(fromPlan, subtema)
          }
          onBack={() => router.push("/estudo-gamificado")}
        />
      )
    }

    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} />

        <main className="max-w-4xl mx-auto px-4 py-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Configurar Estudo</h1>
            <p className="text-muted-foreground mb-8">Selecione as matérias e configure seu estudo personalizado</p>

            {/* Modo de Seleção */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Modo de Seleção</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setSelectionMode("materia")
                    setSelectedGrandeArea(null)
                    setSelectedSubtemas([])
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectionMode === "materia"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">Por Matéria</div>
                  <p className="text-xs text-muted-foreground mt-1">Seleção tradicional por matéria</p>
                </button>
                <button
                  onClick={() => {
                    setSelectionMode("tema_subtema")
                    setSelectedMateria(null)
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectionMode === "tema_subtema"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">Por Grande Área e Subtemas</div>
                  <p className="text-xs text-muted-foreground mt-1">Seleção avançada por tópicos específicos</p>
                </button>
              </div>
            </div>

            {/* Seleção por Matéria (modo antigo) */}
            {selectionMode === "materia" && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Matéria</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Clínica Médica",
                    "Clínica Cirúrgica",
                    "Medicina Preventiva",
                    "Pediatria",
                    "Ginecologia e Obstetrícia",
                    "Todas",
                  ].map((materia) => (
                    <button
                      key={materia}
                      onClick={() => setSelectedMateria(materia === "Todas" ? null : materia)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        (materia === "Todas" && selectedMateria === null) || selectedMateria === materia
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium">{materia}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Seleção por Grande Área e Subtemas (modo novo) */}
            {selectionMode === "tema_subtema" && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Grande Área</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Clínica Médica",
                      "Clínica Cirúrgica",
                      "Medicina Preventiva",
                      "Pediatria",
                      "Ginecologia e Obstetrícia",
                    ].map((area) => (
                      <button
                        key={area}
                        onClick={() => setSelectedGrandeArea(area)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedGrandeArea === area
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium">{area}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtemas (aparecem após selecionar grande área) */}
                {selectedGrandeArea && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">
                      Subtemas de {selectedGrandeArea}
                      {selectedSubtemas.length === 0 && (
                        <span className="text-muted-foreground font-normal ml-2">(Nenhum selecionado = Todos)</span>
                      )}
                    </label>
                    
                    {loadingSubtemas ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Carregando subtemas...</p>
                      </div>
                    ) : availableSubtemas.length > 0 ? (
                      <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-2">
                          {availableSubtemas.map((item, idx) => (
                            <label
                              key={`${item.subtema_slug}-${idx}`}
                              className="flex items-start gap-3 p-3 rounded-md hover:bg-background cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedSubtemas.includes(item.subtema)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSubtemas([...selectedSubtemas, item.subtema])
                                  } else {
                                    setSelectedSubtemas(selectedSubtemas.filter((s) => s !== item.subtema))
                                  }
                                }}
                                className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary"
                              />
                              <span className="text-sm flex-1">{item.subtema}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Nenhum subtema disponível para esta área</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Quantidade de Questões */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3">
                Quantidade de Questões {userPlan === "free" && "(Máximo 15 no plano Free)"}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max={userPlan === "premium" ? "100" : "15"}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number.parseInt(e.target.value))}
                  className="flex-1"
                  disabled={userPlan === "free"}
                />
                <div className="w-16 text-center font-bold text-lg">{userPlan === "free" ? 15 : numQuestions}</div>
              </div>
              {userPlan === "free" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Usuários premium podem estudar até 100 questões por sessão
                </p>
              )}
            </div>

            {/* Botão Iniciar */}
            <button
              onClick={handleStartStudy}
              disabled={
                isLoading ||
                (selectionMode === "tema_subtema" && !selectedGrandeArea)
              }
              className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? "Carregando questões..." : "Iniciar Estudo"}
            </button>
            
            {selectionMode === "tema_subtema" && !selectedGrandeArea && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                Selecione uma Grande Área para continuar
              </p>
            )}
          </div>
        </main>
      </div>
    )
  }

  if (studyMode === "questions") {
    console.log("[v0] 📝 Renderizando modo de questões - questão atual:", currentIndex + 1, "de", questions.length)

    if (questions.length === 0) {
      console.log("[v0] ⚠️ Nenhuma questão disponível")
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Nenhuma questão disponível no momento.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background pb-20">
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

          {studyMode === "questions" && questions.length > 0 && (
            <div className="container max-w-4xl mx-auto px-4 py-8">
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
                {currentQuestion?.tema && (
                  <div className="flex gap-2 mb-6">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {currentQuestion.tema}
                    </span>
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
                          answered && isSelected
                            ? isCorrect
                              ? "border-accent bg-accent/10"
                              : "border-destructive bg-destructive/10"
                            : answered && isCorrectAlt
                              ? "border-accent bg-accent/10"
                              : isSelected && !answered
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
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

                {/* Indicator when selected but not confirmed */}
                {selectedAnswer && !answered && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ✓ Alternativa <strong>{selectedAnswer}</strong> selecionada. Você pode mudar sua escolha antes de
                      confirmar.
                    </p>
                  </div>
                )}

                {answered && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      selectedAnswer?.toUpperCase() === currentQuestion.correta?.toUpperCase()
                        ? "bg-green-50 dark:bg-green-950/20 border-2 border-green-500"
                        : "bg-red-50 dark:bg-red-950/20 border-2 border-red-500"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        selectedAnswer?.toUpperCase() === currentQuestion.correta?.toUpperCase()
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      {selectedAnswer?.toUpperCase() === currentQuestion.correta?.toUpperCase()
                        ? "✓ Resposta correta!"
                        : "✗ Resposta incorreta"}
                    </p>
                    {selectedAnswer?.toUpperCase() !== currentQuestion.correta?.toUpperCase() && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        A resposta correta é: <strong>{currentQuestion.correta?.toUpperCase()}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Justificativa da questão - sempre mostra após confirmar */}
                {answered && (
                  <div className="mt-4 rounded-lg p-4 border-2 border-[#C6A239] bg-[#0D1B2A]">
                    <h3 className="font-semibold mb-2 text-[#C6A239] flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Justificativa da questão
                    </h3>
                    {currentQuestion.explicacao ? (
                      <p className="text-sm leading-relaxed text-[#E6E6E6]">{currentQuestion.explicacao}</p>
                    ) : (
                      <p className="text-sm leading-relaxed text-[#C6A239] italic">
                        A justificativa desta questão será carregada em breve. Continuamos trabalhando para melhorar seu
                        estudo!
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                  {!answered && (
                    <button
                      onClick={handleConfirmAnswer}
                      className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Confirmar Resposta
                    </button>
                  )}
                  {answered && (
                    <button
                      onClick={handleNext}
                      className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
                    >
                      {currentIndex < questions.length - 1 ? "Próxima" : "Finalizar"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  if (studyMode === "complete") {
    const fromPlan = searchParams.get('area')
    return (
      <div>
        <Navbar user={user} />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {fromPlan && (
              <button
                onClick={() => handleStartStudy(fromPlan)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Estudar Novamente
              </button>
            )}
            {fromPlan ? (
              <button
                onClick={() => router.push("/estudo-gamificado")}
                className="px-6 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Voltar ao Plano
              </button>
            ) : (
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Voltar ao Dashboard
              </button>
            )}
          </div>
        </main>
      </div>
    )
  }

  return null
}
