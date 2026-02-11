"use client"

import { Crown, ArrowRight, Check, Sparkles } from "lucide-react"
import { PlanBadge } from "./plan-badge"
import { getPlanLimits, getRemainingQuestions } from "@/lib/plan-utils"
import type { UserPlan } from "@/lib/plan-utils"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PlanStatusCardProps {
  plan: UserPlan
  questionsToday: number
}

const PREMIUM_PLAN_URL = "https://pay.cakto.com.br/upkbydv_655583"
const PREMIUM_INSTALLMENT_URL = "https://mpago.li/1ztGbRx"

export function PlanStatusCard({ plan, questionsToday }: PlanStatusCardProps) {
  const [showPlansModal, setShowPlansModal] = useState(false)

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
    <>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Seu Plano Atual</h3>
          <PlanBadge plan="free" />
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-2">Limites do plano Free:</p>
          <ul className="text-sm text-foreground space-y-1">
            <li>• Até 15 questões por dia</li>
            <li>• Até 20 flashcards por dia</li>
            <li>
              • Hoje você já respondeu: <strong>{questionsToday}/15</strong>
            </li>
            {typeof remaining === "number" && (
              <li className="text-orange-600 dark:text-orange-400 font-medium">• Restam {remaining} questões hoje</li>
            )}
          </ul>
        </div>

        <button
          onClick={() => setShowPlansModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-md hover:from-orange-600 hover:to-orange-700 transition-colors"
        >
          <Crown className="w-5 h-5" />
          Quero ser Premium
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <Dialog open={showPlansModal} onOpenChange={setShowPlansModal}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-slate-950 to-slate-900 border-slate-800">
          <DialogHeader>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Oferta Especial - Pagamento Único</span>
            </div>
            <DialogTitle className="text-3xl font-bold text-center text-white mb-2">
              Acesso Vitalício Premium
            </DialogTitle>
            <DialogDescription className="text-center text-slate-300">Pague uma vez, use para sempre</DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            <div className="bg-slate-900/50 border-2 border-cyan-500 rounded-lg p-8">
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-white mb-2">R$ 297,00</div>
                <div className="text-cyan-400 font-medium">Pagamento único • Acesso vitalício</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                <div className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Questões ilimitadas</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Revisão avançada</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Sem limite por matéria</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Estatísticas detalhadas</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Simulados ilimitados</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Todas atualizações futuras</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <a
                  href={PREMIUM_PLAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105"
                >
                  Pagar com PIX ou Boleto
                </a>

                <a
                  href={PREMIUM_INSTALLMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center px-6 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-lg font-bold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all transform hover:scale-105"
                >
                  Pagar no Cartão ou Parcelado
                </a>
              </div>

              <p className="text-center text-slate-500 text-sm">
                🔒 Pagamento 100% seguro • Acesso liberado automaticamente
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
