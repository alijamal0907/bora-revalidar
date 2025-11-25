"use client"

import { Crown, ArrowRight, Check, Gem } from "lucide-react"
import { PlanBadge } from "./plan-badge"
import { getPlanLimits, getRemainingQuestions } from "@/lib/plan-utils"
import type { UserPlan } from "@/lib/plan-utils"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PlanStatusCardProps {
  plan: UserPlan
  questionsToday: number
}

const PLAN_URLS = {
  monthly: "https://pay.cakto.com.br/upkbydv_655583",
  quarterly: "https://pay.cakto.com.br/gyksd75",
  annual: "https://pay.cakto.com.br/j5jtax8",
}

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
        <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-slate-950 to-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-white mb-2">
              Escolha seu plano Premium
            </DialogTitle>
            <DialogDescription className="text-center text-slate-300 text-lg">
              Assine e tenha acesso ilimitado ao Bora Revalidar
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Plano Mensal */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all">
              <div className="flex justify-center mb-4">
                <Gem className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 text-center mb-4">Plano Mensal</h3>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white mb-1">R$ 35,50</div>
                <div className="text-slate-400">/ mês</div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Acesso ilimitado ao Bora Revalidar</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Revisão de questões liberada</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Zero limites diários</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Suporte prioritário</span>
                </li>
              </ul>
              <a
                href={PLAN_URLS.monthly}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
              >
                Assinar agora
              </a>
            </div>

            {/* Plano Trimestral - Mais Popular */}
            <div className="bg-slate-900/50 border-2 border-cyan-500 rounded-lg p-6 relative hover:border-cyan-400 transition-all">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 px-4 py-1 rounded-full text-sm font-bold">
                Mais Popular
              </div>
              <div className="flex justify-center mb-4 mt-2">
                <Gem className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 text-center mb-4">Plano Trimestral</h3>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white mb-1">R$ 94,57</div>
                <div className="text-slate-400">a cada 3 meses</div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">15% de economia comparado ao mensal</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Tudo do plano mensal incluído</span>
                </li>
              </ul>
              <a
                href={PLAN_URLS.quarterly}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-lg transition-colors"
              >
                Assinar agora
              </a>
            </div>

            {/* Plano Anual */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all">
              <div className="flex justify-center mb-4">
                <Gem className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 text-center mb-4">Plano Anual</h3>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white mb-1">R$ 347,50</div>
                <div className="text-slate-400">/ ano</div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold">Mais de 30% de economia</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Acesso anual ilimitado</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Bônus exclusivos futuros</span>
                </li>
              </ul>
              <a
                href={PLAN_URLS.annual}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
              >
                Assinar agora
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
