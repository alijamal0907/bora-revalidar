"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react"
import { getSubtemasByTema } from "@/lib/storage-supabase"

const AREA_LABEL: Record<string, string> = {
  "Cirurgia": "Clínica Cirúrgica",
}

interface Props {
  area: string
  preselectedSubtema?: string
  userPlan: string
  numQuestions: number
  onNumQuestionsChange: (n: number) => void
  onStart: (subtema?: string) => void
  onBack: () => void
}

export function PlanStudySettings({
  area,
  preselectedSubtema,
  userPlan,
  numQuestions,
  onNumQuestionsChange,
  onStart,
  onBack,
}: Props) {
  const [subtemas, setSubtemas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | undefined>(preselectedSubtema)
  const [error, setError] = useState<string | null>(null)

  const displayLabel = AREA_LABEL[area] ?? area

  useEffect(() => {
    async function fetchSubtemas() {
      setLoading(true)
      setError(null)
      try {
        const result = await getSubtemasByTema(area)
        setSubtemas(result.map(r => r.subtema))
      } catch {
        setError("Falha ao carregar subtemas.")
        setSubtemas([])
      }
      setLoading(false)
    }
    fetchSubtemas()
  }, [area])

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={null} />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Plano de Estudos
        </button>

        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-8">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
              Plano de Estudos
            </p>
            <h1 className="text-2xl font-bold">{displayLabel}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha o subtema e a quantidade de questões para iniciar
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">
              Subtema
              {loading && (
                <Loader2 className="inline-block ml-2 w-3 h-3 animate-spin text-muted-foreground" />
              )}
            </p>

            {error && (
              <p className="text-sm text-destructive mb-3">{error}</p>
            )}

            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setSelected(undefined)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-left text-sm font-medium transition-all ${
                    selected === undefined
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  Todos os subtemas
                </button>

                {subtemas.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelected(s)}
                    className={`px-4 py-3 rounded-lg border-2 text-left text-sm transition-all ${
                      selected === s
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}

                {subtemas.length === 0 && !error && (
                  <p className="text-sm text-muted-foreground col-span-2">
                    Nenhum subtema encontrado para esta área.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Quantidade de questões</p>
            <div className="flex flex-wrap gap-3">
              {[5, 10, 15, 20, 30].map((n) => {
                const disabled = userPlan === "free" && n > numQuestions
                return (
                  <button
                    key={n}
                    disabled={disabled}
                    onClick={() => onNumQuestionsChange(n)}
                    className={`w-14 py-3 rounded-lg border-2 font-bold text-base transition-all ${
                      numQuestions === n
                        ? "border-primary bg-primary/10 text-primary"
                        : disabled
                          ? "border-border text-muted-foreground/30 cursor-not-allowed"
                          : "border-border hover:border-primary/50"
                    }`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            {userPlan === "free" && (
              <p className="text-xs text-muted-foreground mt-2">
                Plano FREE: limite de {numQuestions} questões por dia
              </p>
            )}
          </div>

          <button
            onClick={() => onStart(selected)}
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl text-base hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {selected
              ? `Iniciar — ${selected}`
              : `Iniciar — Todos os subtemas de ${displayLabel}`}
          </button>
        </div>
      </main>
    </div>
  )
}
