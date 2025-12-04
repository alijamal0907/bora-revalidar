"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { Navbar } from "@/components/navbar"
import { MATERIAS, MATERIA_ICONS, MATERIA_DESCRIPTIONS, TEMAS_POR_MATERIA, type Materia } from "@/lib/flashcards-config"
import { BookOpen, ArrowLeft, Brain } from "lucide-react"
import { FlashcardStudyMode } from "@/components/flashcard-study-mode"
import {
  getFlashcardsByMateriaAndTema,
  getAllFlashcardsByMateria,
  getAllFlashcards,
  getFlashcardsStudiedToday,
} from "@/lib/flashcards-storage"
import { getUserPlan } from "@/lib/storage-supabase"
import type { UserPlan } from "@/lib/plan-utils"

type Step = "materia" | "tema" | "study"

export default function FlashcardsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [step, setStep] = useState<Step>("materia")
  const [selectedMateria, setSelectedMateria] = useState<Materia | "todas" | null>(null)
  const [selectedTema, setSelectedTema] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<UserPlan>("free")
  const [flashcardsStudiedToday, setFlashcardsStudiedToday] = useState<number>(0)
  const DAILY_FREE_LIMIT = 10 // Limite diário para usuários free

  const reloadFlashcardsCount = async () => {
    if (user && userPlan === "free") {
      try {
        const studiedToday = await getFlashcardsStudiedToday(user.id)
        setFlashcardsStudiedToday(studiedToday)
      } catch (error) {
        console.error("[v0] Error reloading flashcards count:", error)
      }
    }
  }

  useEffect(() => {
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

          if (plan === "free") {
            const studiedToday = await getFlashcardsStudiedToday(currentUser.id)
            setFlashcardsStudiedToday(studiedToday)
          }
        } catch (error) {
          console.error("[v0] Error getting user plan:", error)
          setUserPlan("free")
        }

        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error checking auth:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  const handleMateriaSelect = (materia: Materia | "todas") => {
    setSelectedMateria(materia)
    setStep("tema")
  }

  const handleTemaSelect = (tema: string) => {
    setSelectedTema(tema)
    setStep("study")
  }

  const handleBack = () => {
    if (step === "materia") {
      router.push("/dashboard")
    } else if (step === "tema") {
      setStep("materia")
      setSelectedMateria(null)
    } else if (step === "study") {
      reloadFlashcardsCount()
      setStep("tema")
      setSelectedTema(null)
    }
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

  return (
    <div>
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => {
                if (step === "materia") {
                  router.push("/dashboard")
                } else {
                  handleBack()
                }
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 text-muted-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Brain className="w-10 h-10 text-primary" />
                Flashcards
                {userPlan === "free" && (
                  <span className="text-sm font-normal bg-muted text-muted-foreground px-3 py-1 rounded-full">
                    Versão Free - Limitado
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground text-lg">
                Use os flashcards para revisar os principais temas do Revalida de forma rápida e ativa
              </p>
              {userPlan === "free" && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Progresso diário (Plano Free)
                    </p>
                    <span className="text-xs text-amber-700 dark:text-amber-300">
                      {flashcardsStudiedToday} / {DAILY_FREE_LIMIT} flashcards
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-2.5">
                    <div
                      className="bg-amber-600 dark:bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((flashcardsStudiedToday / DAILY_FREE_LIMIT) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                    {flashcardsStudiedToday >= DAILY_FREE_LIMIT ? (
                      <>
                        Você atingiu o limite diário!
                        <a href="/pricing" className="underline ml-1 font-medium">
                          Faça upgrade para premium
                        </a>{" "}
                        para acesso ilimitado.
                      </>
                    ) : (
                      <>
                        Faltam {DAILY_FREE_LIMIT - flashcardsStudiedToday} flashcards para completar seu limite diário.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ETAPA 1: Escolha da Matéria */}
        {step === "materia" && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Escolha uma matéria para estudar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Opção "Todas as matérias" */}
              <button
                onClick={() => handleMateriaSelect("todas")}
                className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-lg p-6 hover:shadow-lg transition-all hover:scale-105 transform text-left group border border-primary/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🎯</span>
                  <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-bold mb-2">Todas as matérias</h3>
                <p className="text-primary-foreground/80 text-sm">Revisar todos os temas do Revalida</p>
              </button>

              {/* Cards de matérias específicas */}
              {MATERIAS.map((materia) => (
                <button
                  key={materia}
                  onClick={() => handleMateriaSelect(materia)}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary/50 transition-all hover:scale-105 transform text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{MATERIA_ICONS[materia]}</span>
                    <BookOpen className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{materia}</h3>
                  <p className="text-muted-foreground text-sm">{MATERIA_DESCRIPTIONS[materia]}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ETAPA 2: Escolha do Tema */}
        {step === "tema" && selectedMateria && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {selectedMateria === "todas" ? "Todos os temas" : selectedMateria}
              </h2>
              <p className="text-muted-foreground">Escolha um tema específico para estudar</p>
            </div>

            {selectedMateria === "todas" ? (
              <button
                onClick={() => handleTemaSelect("Todos os temas")}
                className="w-full bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-lg p-6 hover:shadow-lg transition-all hover:scale-[1.02] transform text-left group border border-primary/20 mb-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Revisar todos os temas</h3>
                    <p className="text-primary-foreground/80 text-sm">Estudar flashcards de todas as matérias juntas</p>
                  </div>
                  <Brain className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                {TEMAS_POR_MATERIA[selectedMateria].map((tema, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemaSelect(tema)}
                    className="w-full bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all hover:scale-[1.01] transform text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-bold text-lg">{index + 1}</span>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {tema}
                          </h3>
                        </div>
                      </div>
                      <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ETAPA 3: Modo de Estudo */}
        {step === "study" && selectedMateria && selectedTema && (
          <FlashcardStudyMode
            materia={selectedMateria}
            tema={selectedTema}
            onBack={handleBack}
            userPlan={userPlan}
            onFlashcardAnswered={reloadFlashcardsCount}
            fetchFlashcards={async () => {
              let flashcards = []

              if (selectedMateria === "todas") {
                flashcards = await getAllFlashcards()
              } else if (selectedTema === "Todos os temas") {
                flashcards = await getAllFlashcardsByMateria(selectedMateria)
              } else {
                flashcards = await getFlashcardsByMateriaAndTema(selectedMateria, selectedTema)
              }

              if (userPlan === "free") {
                return flashcards.slice(0, 5)
              }

              return flashcards
            }}
          />
        )}
      </main>
    </div>
  )
}
