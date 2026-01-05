"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-supabase"
import { getUserPlan } from "@/lib/storage-supabase"
import { UpgradeModal } from "@/components/upgrade-modal"
import {
  getAllAchievements,
  checkAndUnlockAchievements,
  unlockAchievement,
  getRandomMotivationalMessage,
  type Achievement,
} from "@/lib/daily-goals"
import { ArrowLeft, Lock, CheckCircle2, Award, Sparkles, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default function ConquistasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>("")
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [showModal, setShowModal] = useState(false)
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)
  const [motivationalMessage, setMotivationalMessage] = useState("")
  const [userPlan, setUserPlan] = useState<"free" | "premium">("free")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    loadAchievements()
  }, [])

  async function loadAchievements() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      setUserId(user.id)

      const plan = await getUserPlan(user.email)
      setUserPlan(plan)

      if (plan === "free") {
        setShowUpgradeModal(true)
        setLoading(false)
        return
      }

      await checkAndUnlockAchievements(user.id)

      const allAchievements = await getAllAchievements(user.id)
      setAchievements(allAchievements)

      setLoading(false)
    } catch (error) {
      console.error("Erro ao carregar conquistas:", error)
      setLoading(false)
    }
  }

  async function handleUnlockAchievement(achievement: Achievement) {
    console.log("[v0] Clique no botão desbloquear:", achievement.name)
    console.log("[v0] userId:", userId)
    console.log("[v0] achievement.id:", achievement.id)

    try {
      setUnlockedAchievement(achievement)
      const message = getRandomMotivationalMessage()
      console.log("[v0] Mensagem motivacional:", message)
      setMotivationalMessage(message)

      setShowModal(true)

      const success = await unlockAchievement(userId, achievement.id)
      console.log("[v0] Salvamento no banco:", success ? "sucesso" : "falhou (tabela não existe ainda)")

      setTimeout(async () => {
        console.log("[v0] Recarregando conquistas...")
        await loadAchievements()
      }, 2000)
    } catch (error) {
      console.error("[v0] Erro ao desbloquear conquista:", error)
      setUnlockedAchievement(achievement)
      setMotivationalMessage(getRandomMotivationalMessage())
      setShowModal(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando conquistas...</p>
        </div>
      </div>
    )
  }

  if (userPlan === "free") {
    return (
      <div className="min-h-screen bg-background">
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false)
            router.push("/dashboard")
          }}
          reason="general"
        />

        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>

          <div className="bg-card border-2 border-primary/30 rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Conquistas Premium</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Desbloqueie suas conquistas, acompanhe seu progresso e receba mensagens motivacionais no plano Premium!
            </p>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-primary to-accent text-white font-bold px-8 py-6 text-lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Fazer Upgrade para Premium
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalPoints = unlockedCount * 100

  return (
    <div className="min-h-screen bg-background">
      {showModal && unlockedAchievement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-2 border-yellow-500 rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="text-6xl mb-4 animate-bounce">{unlockedAchievement.icon}</div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h2 className="text-2xl font-bold text-foreground">Conquista Desbloqueada!</h2>
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{unlockedAchievement.name}</h3>
            <p className="text-muted-foreground mb-6">{unlockedAchievement.description}</p>

            <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl p-4 mb-6 border border-primary/30">
              <p className="text-lg font-medium text-foreground">{motivationalMessage}</p>
            </div>

            <Button
              onClick={() => setShowModal(false)}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
            >
              Continuar Estudando! 💪
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Conquistas</h1>
          <div className="flex flex-col items-end">
            <div className="text-sm font-medium text-muted-foreground">
              {unlockedCount}/{achievements.length}
            </div>
            <div className="text-xs text-primary font-semibold">{totalPoints} pts</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-8 h-8 text-yellow-500" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Seu Progresso Rumo à Revalidação</h2>
              <p className="text-sm text-muted-foreground">Cada conquista te aproxima do seu objetivo!</p>
            </div>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full h-3 transition-all duration-500"
              style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {Math.round((unlockedCount / achievements.length) * 100)}% completo
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const progressPercentage = Math.round((achievement.progress / achievement.target) * 100)
            const canUnlock = achievement.progress >= achievement.target && !achievement.unlocked

            return (
              <div
                key={achievement.id}
                className={`rounded-xl p-6 border-2 transition-all ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-500"
                    : canUnlock
                      ? "bg-gradient-to-br from-green-400/20 to-emerald-500/20 border-green-500 animate-pulse"
                      : "bg-card border-border opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  {achievement.unlocked ? (
                    <CheckCircle2 className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                <h3 className="font-bold text-lg mb-2">{achievement.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>

                {!achievement.unlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">
                        {achievement.progress}/{achievement.target}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`rounded-full h-2 transition-all ${canUnlock ? "bg-green-500" : "bg-primary"}`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>

                    {canUnlock ? (
                      <Button
                        onClick={() => handleUnlockAchievement(achievement)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Desbloquear Conquista!
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Faltam {achievement.target - achievement.progress} para desbloquear
                      </p>
                    )}
                  </div>
                )}

                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
