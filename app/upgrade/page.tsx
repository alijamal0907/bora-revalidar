"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { getUserPlan } from "@/lib/storage-supabase"
import { Navbar } from "@/components/navbar"
import { Crown, Check, ArrowLeft, Gem } from "lucide-react"
import Link from "next/link"
import type { UserPlan } from "@/lib/plan-utils"

const PLANS = [
  {
    id: "monthly",
    name: "Plano Mensal",
    price: "R$ 35,50",
    period: "/ mês",
    paymentUrl: "https://pay.cakto.com.br/upkbydv_655583",
    popular: false,
    benefits: [
      "Acesso ilimitado ao Bora Revalidar",
      "Revisão de questões liberada",
      "Zero limites diários",
      "Suporte prioritário",
    ],
  },
  {
    id: "quarterly",
    name: "Plano Trimestral",
    price: "R$ 94,57",
    period: "a cada 3 meses",
    paymentUrl: "https://pay.cakto.com.br/gyksd75",
    popular: true,
    benefits: ["15% de economia comparado ao mensal", "Tudo do plano mensal incluído"],
  },
  {
    id: "annual",
    name: "Plano Anual",
    price: "R$ 347,50",
    period: "/ ano",
    paymentUrl: "https://pay.cakto.com.br/j5jtax8",
    popular: false,
    benefits: ["Mais de 30% de economia", "Acesso anual ilimitado", "Bônus exclusivos futuros"],
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userPlan, setUserPlan] = useState<UserPlan>("free")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUserPlan = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)

        const plan = await getUserPlan(currentUser.email)
        setUserPlan(plan)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading user plan:", error)
        setIsLoading(false)
      }
    }

    loadUserPlan()
  }, [router])

  if (isLoading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (userPlan === "premium") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar user={user} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Você já é assinante Premium!</h1>
            <p className="text-gray-300 text-lg mb-8">Aproveite todos os recursos ilimitados do Bora Revalidar.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para Home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Escolha seu plano Premium</h1>
          <p className="text-gray-400 text-xl">Assine e tenha acesso ilimitado ao Bora Revalidar</p>
        </div>

        {/* Plans Grid - 3 colunas no desktop, 1 no mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-slate-900/50 backdrop-blur rounded-2xl p-8 border-2 transition-all ${
                plan.popular
                  ? "border-cyan-500 shadow-xl shadow-cyan-500/20"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-1.5 rounded-full text-sm font-bold">
                    Mais Popular
                  </div>
                </div>
              )}

              {/* Diamond Icon */}
              <div className="flex justify-center mb-6">
                <Gem className="w-12 h-12 text-cyan-400" />
              </div>

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-yellow-400 text-center mb-6">{plan.name}</h3>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                </div>
                <span className="text-gray-400 text-lg">{plan.period}</span>
              </div>

              {/* Benefits */}
              <ul className="space-y-4 mb-8">
                {plan.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <a
                href={plan.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all border border-slate-700 hover:border-slate-600"
              >
                Assinar agora
              </a>
            </div>
          ))}
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
