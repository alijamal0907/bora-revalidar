"use client"

import { X, Crown, Check, Sparkles } from "lucide-react"
import { useState } from "react"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: "daily_limit" | "theme_limit" | "review_blocked" | "general"
}

const PLANS = [
  {
    name: "Plano Mensal",
    price: "R$ 35,50",
    period: "/ mês",
    link: "https://pay.cakto.com.br/upkbydv_655583",
    benefits: [
      "Acesso ilimitado ao Bora Revalidar",
      "Revisão de questões liberada",
      "Zero limites diários",
      "Suporte prioritário",
    ],
    badge: null,
  },
  {
    name: "Plano Trimestral",
    price: "R$ 94,57",
    period: "a cada 3 meses",
    link: "https://pay.cakto.com.br/gyksd75",
    benefits: ["15% de economia comparado ao mensal", "Tudo do plano mensal incluído"],
    badge: "Mais Popular",
  },
  {
    name: "Plano Anual",
    price: "R$ 347,50",
    period: "/ ano",
    link: "https://pay.cakto.com.br/j5jtax8",
    benefits: ["Mais de 30% de economia", "Acesso anual ilimitado", "Bônus exclusivos futuros"],
    badge: null,
  },
]

export function UpgradeModal({ isOpen, onClose, reason = "general" }: UpgradeModalProps) {
  const [showPlans, setShowPlans] = useState(false)

  if (!isOpen) return null

  const messages = {
    daily_limit: {
      title: "Limite Diário Atingido",
      description: "Você atingiu o limite de 20 questões por dia do plano Free.",
    },
    theme_limit: {
      title: "Limite por Matéria Atingido",
      description: "Você atingiu o limite de 4 questões por matéria hoje no plano Free.",
    },
    review_blocked: {
      title: "Revisão Exclusiva Premium",
      description: "A revisão avançada de questões é um recurso exclusivo do plano Premium.",
    },
    general: {
      title: "Faça Upgrade para Premium",
      description: "Aproveite todos os recursos sem limites.",
    },
  }

  const { title, description } = messages[reason]

  if (showPlans) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200 overflow-y-auto">
        <div className="bg-card border border-border rounded-lg max-w-4xl w-full p-6 relative animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => {
              setShowPlans(false)
              onClose()
            }}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Escolha seu Plano Premium</h2>
            <p className="text-muted-foreground">Selecione o melhor plano para seus estudos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-muted/20 rounded-lg p-6 border ${
                  plan.badge ? "border-cyan-500/50" : "border-border"
                } hover:shadow-lg transition-all`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold text-yellow-500 mb-4 text-center">{plan.name}</h3>

                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-foreground">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">{plan.period}</div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-md hover:from-orange-600 hover:to-orange-700 transition-colors text-center"
                >
                  Assinar agora
                </a>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button onClick={() => setShowPlans(false)} className="text-muted-foreground hover:text-foreground text-sm">
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="bg-muted/30 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Plano Premium inclui:</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">Questões ilimitadas por dia</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">Sem limite por matéria</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">Revisão avançada de erros</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">Estatísticas detalhadas</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">Simulados ilimitados</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => setShowPlans(true)}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-md hover:from-orange-600 hover:to-orange-700 transition-colors text-center"
          >
            Assinar Premium
          </button>
        </div>
      </div>
    </div>
  )
}
