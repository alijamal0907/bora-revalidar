"use client"

export const dynamic = "force-dynamic"
export const runtime = "edge"

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
import { Zap, TrendingUp, Target, Calendar, Brain } from "lucide-react"
import { GoalSettingsButton } from "@/components/goal-settings-button"
import { getDeviceInfo, storeDeviceId } from "@/lib/device-utils"
import { registerDeviceSession } from "@/lib/storage-supabase"
import { PlanStatusCard } from "@/components/plan-status-card"
import { getUserPlan, getDailyQuestionCount } from "@/lib/storage-supabase"
import type { UserPlan } from "@/lib/plan-utils"
import { getFlashcardProgressByMateria } from "@/lib/flashcards-storage"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cards, setCards] = useState<StudyCard[]>([])
  const [stats, setStats] = useState({ total: 0, dueNow: 0, totalReviews: 0 })
  const [streak, setStreak] = useState(0)
  const [themeProgress, setThemeProgress] = useState<any[]>([])
  const [flashcardProgress, setFlashcardProgress] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailyGoal, setDailyGoal] = useState(10)
  const [monthlyGoal, setMonthlyGoal] = useState(300)
  const [dailyProgress, setDailyProgress] = useState(0)
  const [monthlyProgress, setMonthlyProgress] = useState(0)
  const [userPlan, setUserPlan] = useState<UserPlan>("free")
  const [questionsToday, setQuestionsToday] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  useDeviceSession(user?.id)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const reloadGoalsAndProgress = async () => {
    if (!user) return

    try {
      const [userGoals, dailyProg, monthlyProg] = await Promise.all([
        getUserGoals(user.id),
        getDailyProgress(user.id),
        getMonthlyProgress(user.id),
      ])

      if (userGoals) {
        setDailyGoal(userGoals.daily_questions_goal)
        setMonthlyGoal(userGoals.monthly_questions_goal)
      }
      setDailyProgress(dailyProg)
      setMonthlyProgress(monthlyProg)
    } catch (error) {
      // Removed log of error, just capture silently
    }
  }

  useEffect(() => {
    if (!isMounted) return

    const loadDashboard = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push("/login")
          return
        }

        setUser(currentUser)

        try {
          const deviceInfo = getDeviceInfo()
          storeDeviceId(deviceInfo.deviceId)
          await registerDeviceSession(currentUser.id, currentUser.email || "", deviceInfo)
        } catch (err) {
          // Removed log of error of session registration
        }

        let allCards: any[] = []
        let reviews: any[] = []
        let userStreak = 0
        let progress: any[] = []
        let flashcardProg: any[] = []
        let userGoals: any = null
        let dailyProg = 0
        let monthlyProg = 0
        let plan: UserPlan = "free"
        let todayCount = 0

        try {
          const results = await Promise.allSettled([
            getQuestoesAsCards(currentUser.usuario_id || currentUser.id),
            getHistoricoQuestoes(currentUser.usuario_id || currentUser.id),
            getUserStreak(currentUser.id),
            getProgressByTheme(currentUser.usuario_id || currentUser.id),
            getUserGoals(currentUser.id),
            getDailyProgress(currentUser.id),
            getMonthlyProgress(currentUser.id),
            getUserPlan(currentUser.email),
            getDailyQuestionCount(currentUser.id),
            getFlashcardProgressByMateria(currentUser.id),
          ])

          if (results[0].status === "fulfilled") allCards = results[0].value
          if (results[1].status === "fulfilled") reviews = results[1].value
          if (results[2].status === "fulfilled") userStreak = results[2].value
          if (results[3].status === "fulfilled") progress = results[3].value
          if (results[4].status === "fulfilled") userGoals = results[4].value
          if (results[5].status === "fulfilled") dailyProg = results[5].value
          if (results[6].status === "fulfilled") monthlyProg = results[6].value
          if (results[7].status === "fulfilled") plan = results[7].value
          if (results[8].status === "fulfilled") todayCount = results[8].value
          if (results[9].status === "fulfilled") flashcardProg = results[9].value

          results.forEach((result, index) => {
            if (result.status === "rejected") {
              // Removed log of promise failure
            }
          })
        } catch (err) {
          // Removed log of error of loading dashboard data
        }

        setCards(allCards)

        const dueCards = getDueCards(allCards)

        setStreak(userStreak)

        setStats({
          total: allCards.length,
          dueNow: dueCards.length,
          totalReviews: reviews.length,
        })

        setUserPlan(plan)
        setQuestionsToday(todayCount)

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

        const materiaMapping: { [key: string]: string } = {
          "clinica medica": "Clínica Médica",
          "clínica médica": "Clínica Médica",
          "clinica cirurgica": "Cirurgia",
          "clínica cirúrgica": "Cirurgia",
          cirurgia: "Cirurgia",
          "medicina preventiva": "Medicina Preventiva",
          pediatria: "Pediatria",
          ginecologia: "Ginecologia e Obstetrícia",
          obstetricia: "Ginecologia e Obstetrícia",
          obstetrícia: "Ginecologia e Obstetrícia",
        }

        const materiaStats: { [key: string]: { total: number; correct: number; wrong: number } } = {}

        flashcardProg.forEach((item) => {
          const normalizedMateria = item.materia
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")

          const mappedMateria = materiaMapping[normalizedMateria] || item.materia

          if (!materiaStats[mappedMateria]) {
            materiaStats[mappedMateria] = { total: 0, correct: 0, wrong: 0 }
          }

          materiaStats[mappedMateria].total += item.total
          materiaStats[mappedMateria].correct += item.correct
          materiaStats[mappedMateria].wrong += item.wrong
        })

        const materiaOrder = [
          "Clínica Médica",
          "Cirurgia",
          "Pediatria",
          "Medicina Preventiva",
          "Ginecologia e Obstetrícia",
        ]

        const processedFlashcardProgress = materiaOrder.map((materia) => {
          const stats = materiaStats[materia] || { total: 0, correct: 0, wrong: 0 }
          return {
            materia,
            total: stats.total,
            correct: stats.correct,
            wrong: stats.wrong,
            percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
          }
        })

        setFlashcardProgress(processedFlashcardProgress)

        setIsLoading(false)
      } catch (error: any) {
        setError("Erro ao carregar o dashboard. Verifique sua conexão.")
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [router, isMounted])

  useEffect(() => {
    if (!user || !isMounted) return

    const loadData = async () => {
      try {
        const [currentGoals, plan, dailyProg, monthlyProg] = await Promise.all([
          getUserGoals(user.id),
          getUserPlan(user.id),
          getDailyProgress(user.id),
          getMonthlyProgress(user.id),
        ])

        if (currentGoals) {
          setDailyGoal(currentGoals.daily_questions_goal)
          setMonthlyGoal(currentGoals.monthly_questions_goal)
        }

        setUserPlan(plan)
        setDailyProgress(dailyProg)
        setMonthlyProgress(monthlyProg)
      } catch (error) {
        // Removed log of error
      }
    }

    loadData()
  }, [user, isMounted])

  useEffect(() => {
    if (!user || !isMounted) return

    const interval = setInterval(async () => {
      try {
        const [dailyProg, monthlyProg] = await Promise.all([getDailyProgress(user.id), getMonthlyProgress(user.id)])
        setDailyProgress(dailyProg)
        setMonthlyProgress(monthlyProg)
      } catch (error) {
        // Removed log of error
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [user, isMounted])

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

  if (error) {
    return (
      <div>
        <Navbar user={user} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-foreground mb-4">Erro ao Carregar</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Tentar Novamente
            </button>
          </div>
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
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Bem-vindo de volta!</h1>
          <p className="text-muted-foreground text-lg">Mantenha seu conhecimento fresco com repetição espaçada</p>
        </div>

        <div className="mb-12">
          <PlanStatusCard plan={userPlan} questionsToday={questionsToday} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/study"
            className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-lg p-8 hover:shadow-lg transition-all hover:scale-105 transform cursor-pointer group border border-primary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Iniciar Estudo</h3>
              <Zap className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-primary-foreground/90 text-sm mb-2">Revise questões do Revalida hoje</p>
            <p className="text-primary-foreground/70 text-xs">Continue sua jornada de aprendizado</p>
          </Link>

          <Link
            href="/flashcards"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-8 hover:shadow-lg transition-all hover:scale-105 transform cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Flashcards</h3>
              <Brain className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-sm">Revisar temas do Revalida com flashcards</p>
          </Link>

          <Link
            href="/review"
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-8 hover:shadow-lg transition-all hover:scale-105 transform cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Revisão</h3>
              <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-sm">Veja seu progresso geral e análise por Matéria</p>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-border rounded-lg p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Progresso Diário</h2>
            <GoalSettingsButton
              currentDailyGoal={dailyGoal}
              currentMonthlyGoal={monthlyGoal}
              onGoalsSaved={reloadGoalsAndProgress}
              userPlan={userPlan}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </div>

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
                    {userPlan === "premium" ? (
                      <span className="text-2xl font-bold text-primary">{theme.percentage}%</span>
                    ) : (
                      <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full">Premium</span>
                    )}
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    {userPlan === "premium" ? (
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                        style={{ width: `${theme.percentage}%` }}
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10 blur-sm" />
                    )}
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

        <div className="bg-card border border-border rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-8">Progresso por Flashcards</h2>
          {flashcardProgress.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {flashcardProgress.map((item) => (
                <div key={item.materia}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-bold text-foreground capitalize">{item.materia}</span>
                      <span className="ml-4 text-sm text-muted-foreground">
                        {item.correct}/{item.total} corretos
                      </span>
                    </div>
                    {userPlan === "premium" ? (
                      <span className="text-2xl font-bold text-purple-500">{item.percentage}%</span>
                    ) : (
                      <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full">Premium</span>
                    )}
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    {userPlan === "premium" ? (
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10 blur-sm" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum dado de progresso de flashcards disponível ainda. Comece a estudar flashcards para ver suas
              estatísticas!
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
