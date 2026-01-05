"use client"

import { X, Crown, Check, Sparkles } from "lucide-react"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: "daily_limit" | "theme_limit" | "review_blocked" | "premium_feature" | "general"
}

const PREMIUM_PLAN = {
  name: "Acesso Vitalício Premium",
  price: "R$ 247,00",
  link: "https://pay.cakto.com.br/upkbydv_655583",
  installmentLink: "https://mpago.li/1ztGbRx",
  benefits: [
    "Acesso ilimitado VITALÍCIO",
    "Questões ilimitadas por dia",
    "Revisão avançada liberada",
    "Sem limite por matéria",
    "Estatísticas detalhadas",
    "Simulados ilimitados",
    "Todas as atualizações futuras",
  ],
}

export function UpgradeModal({ isOpen, onClose, reason = "general" }: UpgradeModalProps) {
  if (!isOpen) return null

  const messages = {
    daily_limit: {
      title: "Limite Diário Atingido",
      description: "Você atingiu o limite de 15 questões por dia do plano Free.",
    },
    theme_limit: {
      title: "Limite por Matéria Atingido",
      description: "Você atingiu o limite de 4 questões por matéria hoje no plano Free.",
    },
    review_blocked: {
      title: "Revisão Exclusiva Premium",
      description: "A revisão avançada de questões é um recurso exclusivo do plano Premium.",
    },
    premium_feature: {
      title: "Recurso Exclusivo Premium",
      description: "Este recurso está disponível apenas para usuários Premium.",
    },
    general: {
      title: "Faça Upgrade para Premium",
      description: "Aproveite todos os recursos sem limites.",
    },
  }

  const { title, description } = messages[reason]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-lg max-w-lg w-full p-6 relative animate-in zoom-in-95 duration-200">
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

        {/* Oferta Especial - Pagamento Único */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-orange-500/10 border border-cyan-500/30 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-bold">Oferta Especial - Pagamento Único</span>
          </div>

          <h3 className="text-xl font-bold text-yellow-500 text-center mb-3">{PREMIUM_PLAN.name}</h3>

          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-foreground mb-1">{PREMIUM_PLAN.price}</div>
            <div className="text-sm text-cyan-500 font-medium">Pagamento único • Acesso vitalício</div>
          </div>

          <ul className="space-y-2 mb-6">
            {PREMIUM_PLAN.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <a
              href={PREMIUM_PLAN.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all text-center transform hover:scale-105"
            >
              Pagar com PIX ou Boleto
            </a>

            <a
              href={PREMIUM_PLAN.installmentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all text-center transform hover:scale-105"
            >
              Pagar no Cartão ou Parcelado
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}
