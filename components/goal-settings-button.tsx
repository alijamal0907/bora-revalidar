"use client"

import { useState, useEffect } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { saveUserGoals } from "@/app/actions/goals"
import { UpgradeModal } from "@/components/upgrade-modal"
import type { UserPlan } from "@/lib/plan-utils"

interface GoalSettingsButtonProps {
  currentDailyGoal: number
  currentMonthlyGoal: number
  onGoalsSaved?: () => void
  userPlan?: UserPlan
}

export function GoalSettingsButton({
  currentDailyGoal,
  currentMonthlyGoal,
  onGoalsSaved,
  userPlan = "free",
}: GoalSettingsButtonProps) {
  const [open, setOpen] = useState(false)
  const [dailyGoal, setDailyGoal] = useState(currentDailyGoal)
  const [monthlyGoal, setMonthlyGoal] = useState(currentMonthlyGoal)
  const [loading, setLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const maxDailyGoal = userPlan === "free" ? 20 : 10000
  const maxMonthlyGoal = userPlan === "free" ? 600 : 10000

  useEffect(() => {
    setDailyGoal(currentDailyGoal)
    setMonthlyGoal(currentMonthlyGoal)
  }, [currentDailyGoal, currentMonthlyGoal])

  const handleDailyGoalChange = (value: number) => {
    if (userPlan === "free" && value > 20) {
      setShowUpgradeModal(true)
      return
    }
    setDailyGoal(value)
  }

  const handleMonthlyGoalChange = (value: number) => {
    if (userPlan === "free" && value > 600) {
      setShowUpgradeModal(true)
      return
    }
    setMonthlyGoal(value)
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await saveUserGoals(dailyGoal, monthlyGoal)

      if (!result.success) {
        const errorMessage = result.error || "Erro ao salvar metas. Tente novamente."

        if (errorMessage.includes("autenticado") || errorMessage.includes("login")) {
          setMessage({
            type: "error",
            text: "Sessão expirada. Por favor, faça login novamente para salvar suas metas.",
          })
          setTimeout(() => {
            window.location.href = "/login"
          }, 3000)
        } else {
          setMessage({ type: "error", text: errorMessage })
        }
        return
      }

      setMessage({ type: "success", text: "✓ Metas salvas com sucesso!" })
      setTimeout(() => {
        setOpen(false)
        setMessage(null)
        if (onGoalsSaved) {
          onGoalsSaved()
        }
      }, 2500)
    } catch (error) {
      console.error("[v0] Erro ao salvar metas:", error)
      setMessage({
        type: "error",
        text: "Erro de conexão. Verifique sua internet e tente novamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Settings className="h-4 w-4" />
            Configurar Metas
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configurar Metas de Estudo</DialogTitle>
            <DialogDescription>
              {userPlan === "free"
                ? "Limite de 20 questões por dia no plano Free. Configure sua meta mensal também."
                : "Configure suas metas diárias e mensais de estudo."}
            </DialogDescription>
          </DialogHeader>
          {message && (
            <div
              className={`rounded-lg p-4 text-center text-base font-semibold shadow-lg ${
                message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {message.text}
            </div>
          )}
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="daily-goal">Meta Diária (questões por dia)</Label>
              <Input
                id="daily-goal"
                type="number"
                min="1"
                max={maxDailyGoal}
                value={dailyGoal}
                onChange={(e) => handleDailyGoalChange(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {userPlan === "free" ? "Limite máximo: 20 questões por dia (Free)" : "Sem limites no plano Premium"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-goal">Meta Mensal (questões por mês)</Label>
              <Input
                id="monthly-goal"
                type="number"
                min="1"
                max={maxMonthlyGoal}
                value={monthlyGoal}
                onChange={(e) => handleMonthlyGoalChange(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {userPlan === "free"
                  ? "Limite máximo: 600 questões/mês (Free)"
                  : "Recomendamos entre 300 e 1500 questões por mês"}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Metas"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} reason="general" />
    </>
  )
}
