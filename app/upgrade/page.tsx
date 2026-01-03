"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { getUserPlan } from "@/lib/storage-supabase"
import { Navbar } from "@/components/navbar"
import { Crown, Check, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import type { UserPlan } from "@/lib/plan-utils"

const PREMIUM_PLAN = {
  name: "Acesso Vitalício Premium",
  price: "R$ 147,00",
  paymentUrl: "https://pay.cakto.com.br/upkbydv_655583",
  benefits: [
    "Acesso ilimitado VITALÍCIO ao Bora Revalidar",
    "Questões ilimitadas por dia",
    "Revisão avançada de questões liberada",
    "Sem limite por matéria",
    "Estatísticas detalhadas",
    "Simulados ilimitados",
    "Suporte prioritário",
    "Todas as atualizações futuras incluídas",
  ],
}

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Oferta Especial - Pagamento Único</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Acesso Vitalício
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-500">
              Bora Revalidar Premium
            </span>
          </h1>
          <p className="text-gray-400 text-xl">Pague uma vez, use para sempre</p>
        </div>

        {/* Single Plan Card - Centered and Prominent */}
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-3xl p-10 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-cyan-500 to-orange-500 text-white px-8 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Melhor Custo-Benefício
              </div>
            </div>

            {/* Plan Name */}
            <div className="text-center mb-8 mt-4">
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">{PREMIUM_PLAN.name}</h2>
              <p className="text-gray-400">Sem mensalidades, sem surpresas</p>
            </div>

            {/* Price - Large and Prominent */}
            <div className="text-center mb-10">
              <div className="inline-block">
                <div className="text-6xl font-bold text-white mb-2">{PREMIUM_PLAN.price}</div>
                <div className="text-cyan-400 text-lg font-medium">Pagamento único • Acesso vitalício</div>
              </div>
            </div>

            {/* Benefits - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {PREMIUM_PLAN.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-4">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Button - Large and Prominent */}
            <a
              href={PREMIUM_PLAN.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-8 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xl font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30"
            >
              Garantir Acesso Vitalício Agora
            </a>

            {/* Security Note */}
            <p className="text-center text-gray-500 text-sm mt-6">
              🔒 Pagamento 100% seguro via Cakto • Acesso liberado automaticamente
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-12">
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
