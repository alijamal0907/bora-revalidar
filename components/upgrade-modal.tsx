"use client"

import { X, Crown, Check } from "lucide-react"
import { CAKTO_PAYMENT_URL } from "@/lib/plan-utils"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: "daily_limit" | "theme_limit" | "review_blocked" | "general"
}

export function UpgradeModal({ isOpen, onClose, reason = "general" }: UpgradeModalProps) {
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
          <a
            href={CAKTO_PAYMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-md hover:from-orange-600 hover:to-orange-700 transition-colors text-center"
          >
            Assinar Premium
          </a>
        </div>
      </div>
    </div>
  )
}
