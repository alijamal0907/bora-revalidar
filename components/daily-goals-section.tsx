"use client"

import { useEffect, useState } from "react"
import { getTodayGoals, type DailyGoal } from "@/lib/daily-goals"
import { CheckCircle2, Circle, Lock, Crown } from "lucide-react"
import { useRouter } from "next/navigation"

export function DailyGoalsSection({ userId, isPremium }: { userId: string; isPremium: boolean }) {
  const [goals, setGoals] = useState<DailyGoal[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadGoals()
  }, [userId])

  async function loadGoals() {
    try {
      const todayGoals = await getTodayGoals(userId)
      setGoals(todayGoals)
    } catch (error) {
      console.error("Erro ao carregar metas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border">
        <p className="text-muted-foreground text-center">Carregando metas...</p>
      </div>
    )
  }

  const completedCount = goals.filter((g) => g.completed).length

  return (
    <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-foreground">Metas de Hoje</h2>
          {!isPremium && (
            <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" />
              PREMIUM
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {completedCount}/{goals.length} concluídas
        </div>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100))

          return (
            <div
              key={goal.id}
              className={`bg-card border rounded-xl p-4 transition-all ${
                goal.completed ? "border-green-500/50 bg-green-500/5" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">{goal.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground">{goal.name}</h3>
                    {goal.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {goal.current} / {goal.target}
                  </span>
                  <span className="font-semibold text-foreground">{percentage}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      goal.completed ? "bg-green-500" : "bg-primary"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {goal.completed && <p className="text-sm font-medium text-green-500">✓ Meta concluída! 🎉</p>}
              </div>
            </div>
          )
        })}
      </div>

      {!isPremium && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Desbloqueie suas Metas Diárias</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Acompanhe seu progresso diário com metas personalizadas, mantenha sua consistência e alcance a aprovação no
            Revalida mais rápido!
          </p>
          <button
            onClick={() => router.push("/upgrade")}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Tornar-se Premium
          </button>
        </div>
      )}
    </div>
  )
}
