"use client"

import { Crown, ArrowRight, Check } from "lucide-react"
import { PlanBadge } from "./plan-badge"
import { CAKTO_PAYMENT_URL, getPlanLimits, getRemainingQuestions } from "@/lib/plan-utils"
import type { UserPlan } from "@/lib/plan-utils"

interface PlanStatusCardProps {
  plan: UserPlan
  questionsToday: number
}

export function PlanStatusCard({ plan, questionsToday }: PlanStatusCardProps) {
  const limits = getPlanLimits(plan)
  const remaining = getRemainingQuestions(questionsToday, plan)

  if (plan === "premium") {
    return (
      <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Seu Plano Atual</h3>
          <PlanBadge plan="premium" />
        </div>
        <p className="text-foreground mb-4">
          Você está no plano Premium. Acesso ilimitado a questões e revisão avançada liberada.
        </p>
        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <Check className="w-4 h-4" />
          <span>Todas as funcionalidades desbloqueadas</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Seu Plano Atual</h3>
        <PlanBadge plan="free" />
      </div>

      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <p className="text-sm text-muted-foreground mb-2">Limites do plano Free:</p>
        <ul className="text-sm text-foreground space-y-1">
          <li>• Até 4 questões por matéria por dia</li>
          <li>• Até 20 questões no total por dia</li>
          <li>
            • Hoje você já respondeu: <strong>{questionsToday}/20</strong>
          </li>
          {typeof remaining === "number" && (
            <li className="text-orange-600 dark:text-orange-400 font-medium">• Restam {remaining} questões hoje</li>
          )}
        </ul>
      </div>

      <a
        href={CAKTO_PAYMENT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-md hover:from-orange-600 hover:to-orange-700 transition-colors"
      >
        <Crown className="w-5 h-5" />
        Quero ser Premium
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  )
}
