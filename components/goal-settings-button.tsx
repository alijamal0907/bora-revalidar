"use client"

import { useState } from "react"
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
import { setUserGoals } from "@/lib/storage-supabase"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { useRouter } from "next/navigation"

interface GoalSettingsButtonProps {
  currentDailyGoal: number
  currentMonthlyGoal: number
}

export function GoalSettingsButton({ currentDailyGoal, currentMonthlyGoal }: GoalSettingsButtonProps) {
  const [open, setOpen] = useState(false)
  const [dailyGoal, setDailyGoal] = useState(currentDailyGoal)
  const [monthlyGoal, setMonthlyGoal] = useState(currentMonthlyGoal)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    try {
      const user = await getSupabaseUser()
      if (!user) {
        alert("Usuário não autenticado")
        return
      }

      await setUserGoals(user.id, dailyGoal, monthlyGoal)
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Erro ao salvar metas:", error)
      alert("Erro ao salvar metas. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
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
          <DialogDescription>Defina quantas questões você deseja responder por dia e por mês.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="daily-goal">Meta Diária (questões por dia)</Label>
            <Input
              id="daily-goal"
              type="number"
              min="1"
              max="500"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Recomendamos entre 10 e 50 questões por dia</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly-goal">Meta Mensal (questões por mês)</Label>
            <Input
              id="monthly-goal"
              type="number"
              min="1"
              max="10000"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Recomendamos entre 300 e 1500 questões por mês</p>
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
  )
}
