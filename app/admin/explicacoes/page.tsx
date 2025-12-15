"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Sparkles, Save, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminGuard } from "@/components/admin-guard"

interface Questao {
  id: string
  questao: string
  alternativaa: string
  alternativab: string
  alternativac: string
  alternativad: string
  correta: string
  tema: string
  explicacao: string | null
}

export default function ExplicacoesPage() {
  const router = useRouter()
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [explicacao, setExplicacao] = useState("")
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadQuestoesSemExplicacao()
  }, [])

  const loadQuestoesSemExplicacao = async () => {
    setLoading(true)
    try {
      const { default: storage } = await import("@/lib/storage-supabase")
      const supabase = storage.getSupabaseClient
        ? storage.getSupabaseClient()
        : (await import("@/lib/supabase/client")).createClient()

      const { data, error } = await supabase.from("questoes").select("*").is("explicacao", null).limit(50).order("id")

      if (error) throw error
      setQuestoes(data || [])
      if (data && data.length > 0) {
        setExplicacao("")
      }
    } catch (error) {
      console.error("Erro ao carregar questões:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateExplicacao = async () => {
    if (!questoes[currentIndex]) return

    setGenerating(true)
    try {
      const questao = questoes[currentIndex]
      const alternativas = {
        A: questao.alternativaa,
        B: questao.alternativab,
        C: questao.alternativac,
        D: questao.alternativad,
      }

      const prompt = `Gere uma justificativa COMPLETA para esta questão do Revalida seguindo RIGOROSAMENTE este modelo:

MODELO OBRIGATÓRIO:
1. Começar: "A alternativa ${questao.correta.toUpperCase()} é a correta porque..."
2. Explicar o raciocínio clínico (achados-chave, condutas aceitas, objetivo diagnóstico/tratamento)
3. "As demais alternativas estão incorretas porque..."
4. Comentar brevemente o erro de cada alternativa
5. Finalizar: "Portanto, a conduta correta é a alternativa ${questao.correta.toUpperCase()}..."

ESTILO: Claro, objetivo, didático. Mini-aula sem parágrafos enormes. Focado em raciocínio clínico padrão Revalida.

QUESTÃO:
${questao.questao}

ALTERNATIVAS:
A) ${alternativas.A}
B) ${alternativas.B}
C) ${alternativas.C}
D) ${alternativas.D}

RESPOSTA CORRETA: ${questao.correta.toUpperCase()}
TEMA: ${questao.tema}

Gere a justificativa completa seguindo EXATAMENTE o modelo acima:`

      const response = await fetch("/api/generate-explicacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) throw new Error("Erro ao gerar explicação")

      const data = await response.json()
      setExplicacao(data.explicacao)
    } catch (error) {
      console.error("Erro ao gerar explicação:", error)
      alert("Erro ao gerar explicação. Tente novamente.")
    } finally {
      setGenerating(false)
    }
  }

  const saveExplicacao = async () => {
    if (!questoes[currentIndex] || !explicacao.trim()) return

    setSaving(true)
    try {
      const { default: storage } = await import("@/lib/storage-supabase")
      const supabase = storage.getSupabaseClient
        ? storage.getSupabaseClient()
        : (await import("@/lib/supabase/client")).createClient()

      const { error } = await supabase
        .from("questoes")
        .update({ explicacao: explicacao.trim() })
        .eq("id", questoes[currentIndex].id)

      if (error) throw error

      alert("Explicação salva com sucesso!")

      // Move para próxima questão
      if (currentIndex < questoes.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setExplicacao("")
      } else {
        loadQuestoesSemExplicacao()
        setCurrentIndex(0)
      }
    } catch (error) {
      console.error("Erro ao salvar explicação:", error)
      alert("Erro ao salvar explicação. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const currentQuestao = questoes[currentIndex]

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando questões...</p>
        </div>
      </AdminGuard>
    )
  }

  if (!currentQuestao) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-4xl mx-auto">
            <Button onClick={() => router.push("/admin")} variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">✅ Todas as questões têm explicação!</h2>
              <p className="text-muted-foreground mb-6">Não há questões sem explicação no momento.</p>
              <Button onClick={loadQuestoesSemExplicacao}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar
              </Button>
            </Card>
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button onClick={() => router.push("/admin")} variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="text-sm text-muted-foreground">
              Questão {currentIndex + 1} de {questoes.length}
            </div>
          </div>

          <Card className="p-6 mb-6">
            <div className="mb-4">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                {currentQuestao.tema}
              </span>
            </div>

            <h3 className="text-lg font-semibold mb-4">Questão:</h3>
            <p className="text-foreground mb-6 whitespace-pre-wrap">{currentQuestao.questao}</p>

            <h4 className="text-md font-semibold mb-3">Alternativas:</h4>
            <div className="space-y-2 mb-4">
              {["A", "B", "C", "D"].map((letra) => {
                const alternativa = currentQuestao[`alternativa${letra.toLowerCase()}` as keyof Questao]
                const isCorreta = currentQuestao.correta.toUpperCase() === letra
                return (
                  <div
                    key={letra}
                    className={`p-3 rounded-lg border-2 ${
                      isCorreta ? "border-green-500 bg-green-500/10" : "border-border"
                    }`}
                  >
                    <span className="font-semibold">{letra})</span> {alternativa}
                    {isCorreta && <span className="ml-2 text-xs font-bold text-green-600">✓ CORRETA</span>}
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Explicação / Justificativa:</h3>
              <Button onClick={generateExplicacao} disabled={generating} variant="default" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? "Gerando..." : "Gerar com IA"}
              </Button>
            </div>

            <Textarea
              value={explicacao}
              onChange={(e) => setExplicacao(e.target.value)}
              placeholder="Cole ou edite a justificativa aqui..."
              className="min-h-[300px] font-mono text-sm"
            />

            <div className="mt-4 flex gap-3 justify-end">
              <Button
                onClick={() => {
                  if (currentIndex < questoes.length - 1) {
                    setCurrentIndex(currentIndex + 1)
                    setExplicacao("")
                  }
                }}
                variant="outline"
                disabled={currentIndex >= questoes.length - 1}
              >
                Pular
              </Button>
              <Button onClick={saveExplicacao} disabled={!explicacao.trim() || saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar e Próxima"}
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              <strong>Modelo de justificativa:</strong> Começar com "A alternativa X é a correta porque...", apresentar
              raciocínio clínico, explicar por que as demais estão incorretas, e finalizar reforçando a alternativa
              correta.
            </p>
          </Card>
        </div>
      </div>
    </AdminGuard>
  )
}
