"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseUser } from "@/lib/auth-supabase"
import { Navbar } from "@/components/navbar"
import { getDueCards, type StudyCard } from "@/lib/spaced-repetition"
import {
  getQuestoesAsCards,
  getHistoricoQuestoes,
  getUserStreak,
  getProgressByTheme,
  getUserGoals,
  getDailyProgress,
  getMonthlyProgress,
} from "@/lib/storage-supabase"
import { useDeviceSession } from "@/hooks/use-device-session"
import Link from "next/link"
import { Activity, Zap, TrendingUp, Target, Calendar } from "lucide-react"
import { GoalSettingsButton } from "@/components/goal-settings-button"
import { getDeviceInfo, storeDeviceId } from "@/lib/device-utils"
import { registerDeviceSession } from "@/lib/storage-supabase"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cards, setCards] = useState<StudyCard[]>([])
  const [stats, setStats] = useState({ total: 0, dueNow: 0, totalReviews: 0 })
  const [streak, setStreak] = useState(0)
  const [themeProgress, setThemeProgress] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dailyGoal, setDailyGoal] = useState(10)
  const [monthlyGoal, setMonthlyGoal] = useState(300)
  const [dailyProgress, setDailyProgress] = useState(0)
  const [monthlyProgress, setMonthlyProgress] = useState(0)

  useDeviceSession(user?.id)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push("/login")
          return
        }

        try {
          const deviceInfo = getDeviceInfo()
          storeDeviceId(deviceInfo.deviceId)
          await registerDeviceSession(currentUser.id, currentUser.email || "", deviceInfo)
        } catch (err) {
          console.error("[v0] Error registering session:", err)
        }

        setUser(currentUser)

        const [allCards, reviews, userStreak, progress, userGoals, dailyProg, monthlyProg] = await Promise.all([
          getQuestoesAsCards(currentUser.usuario_id || currentUser.id),
          getHistoricoQuestoes(currentUser.usuario_id || currentUser.id),
          getUserStreak(currentUser.id),
          getProgressByTheme(currentUser.usuario_id || currentUser.id),
          getUserGoals(currentUser.id),
          getDailyProgress(currentUser.id),
          getMonthlyProgress(currentUser.id),
        ])

        if (userGoals) {
          setDailyGoal(userGoals.daily_questions_goal)
          setMonthlyGoal(userGoals.monthly_questions_goal)
        }
        setDailyProgress(dailyProg)
        setMonthlyProgress(monthlyProg)

        setCards(allCards)

        const dueCards = getDueCards(allCards)

        setStreak(userStreak)

        setStats({
          total: allCards.length,
          dueNow: dueCards.length,
          totalReviews: reviews.length,
        })

        const targetThemes = [
          { key: "clinica medica", label: "Clínica Médica" },
          { key: "cirurgia", label: "Cirurgia" },
          { key: "medicina preventiva", label: "Medicina Preventiva" },
          { key: "pediatria", label: "Pediatria" },
          { key: "ginecologia e obstetricia", label: "Ginecologia e Obstetrícia" },
        ]

        const processedProgress = targetThemes
          .map((target) => {
            const matches = progress.filter((p) => {
              const normalizedP = p.theme
                .toLowerCase()
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
              return normalizedP === target.key
            })

            const stats = matches.reduce(
              (acc, curr) => ({
                total: acc.total + curr.total,
                correct: acc.correct + curr.correct,
                wrong: acc.wrong + curr.wrong,
              }),
              { total: 0, correct: 0, wrong: 0 },
            )

            return {
              theme: target.label,
              total: stats.total,
              correct: stats.correct,
              wrong: stats.wrong,
              percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
            }
          })
          .filter((p) => p.total > 0)

        setThemeProgress(processedProgress)

        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error loading dashboard:", error)
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  if (isLoading) {
    return (
      <div>
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">Carregando seu painel...</p>
        </div>
      </div>
    )
  }

  const dailyPercentage = Math.min(100, Math.round((dailyProgress / dailyGoal) * 100))
  const monthlyPercentage = Math.min(100, Math.round((monthlyProgress / monthlyGoal) * 100))

  return (
    <div>
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Bem-vindo de volta, {user?.email?.split("@")[0]}!</h1>
          <p className="text-muted-foreground text-lg">Mantenha seu conhecimento fresco com repetição espaçada</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Start Study Button */}
          <Link
            href="/study"
            className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg p-8 hover:shadow-lg transition-all hover:scale-105 transform cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Iniciar Estudo</h3>
              <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-primary-foreground/90 text-sm">Revise {stats.dueNow} cartões vencidos hoje</p>
          </Link>

          {/* Practice Simulation Button */}
          <Link
            href="/simulations"
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-8 hover:shadow-lg transition-all hover:scale-105 transform cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Simulado</h3>
              <Activity className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-sm">Teste seu conhecimento com simulados</p>
          </Link>

          {/* Review Progress Button */}
          <Link
            href="/review"
            className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground rounded-lg p-8 hover:shadow-lg transition-all hover:scale-105 transform cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Revisão</h3>
              <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-secondary-foreground/90 text-sm">Veja seu progresso e análise</p>
          </Link>
        </div>

        {/* Progresso Diário e Metas */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-border rounded-lg p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Progresso Diário</h2>
            <GoalSettingsButton currentDailyGoal={dailyGoal} currentMonthlyGoal={monthlyGoal} />
          </div>

          {/* Meta Diária */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Meta Diária</h3>
                  <p className="text-sm text-muted-foreground">
                    {dailyProgress} de {dailyGoal} questões
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold text-foreground">{dailyPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${dailyPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {dailyProgress >= dailyGoal
                    ? "Meta diária concluída"
                    : `Faltam ${dailyGoal - dailyProgress} questões para completar hoje`}
                </p>
              </div>
            </div>

            {/* Meta Mensal */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Meta Mensal</h3>
                  <p className="text-sm text-muted-foreground">
                    {monthlyProgress} de {monthlyGoal} questões
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold text-foreground">{monthlyPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-accent to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${monthlyPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {monthlyProgress >= monthlyGoal
                    ? "Meta mensal concluída"
                    : `Faltam ${monthlyGoal - monthlyProgress} questões este mês`}
                </p>
              </div>
            </div>

            {/* Sequência Ativa */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Activity className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Sequência Ativa</h3>
                  <p className="text-sm text-muted-foreground">Dias consecutivos de estudo</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-4xl font-bold text-secondary">
                  {streak} {streak === 1 ? "dia" : "dias"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Continue assim para manter sua sequência</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progresso por Matéria */}
        <div className="bg-card border border-border rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-8">Progresso por Matéria</h2>
          {themeProgress.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {themeProgress.map((theme) => (
                <div key={theme.theme}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-bold text-foreground capitalize">{theme.theme}</span>
                      <span className="ml-4 text-sm text-muted-foreground">
                        {theme.correct}/{theme.total} corretas
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-primary">{theme.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                      style={{ width: `${theme.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum dado de progresso disponível ainda. Comece a estudar para ver suas estatísticas!
            </p>
          )}
        </div>

        {/* Recent Cards Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Cartões Recentes</h2>
          {cards.length > 0 ? (
            <div className="space-y-2">
              {cards.slice(0, 5).map((card) => (
                <div key={card.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                  <div>
                    <p className="font-medium text-foreground">{card.question}</p>
                    <p className="text-sm text-muted-foreground">{card.category}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      card.difficulty === "easy"
                        ? "bg-accent/20 text-accent"
                        : card.difficulty === "medium"
                          ? "bg-secondary/20 text-secondary"
                          : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {card.difficulty}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum cartão disponível ainda</p>
          )}
        </div>
      </main>
    </div>
  )
}
