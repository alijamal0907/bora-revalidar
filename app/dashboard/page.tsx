"use client"

export const dynamic = "force-dynamic"

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
import { Zap, TrendingUp, Target, Calendar, Brain, Trophy, Crown, Users, BookMarked, AlertTriangle } from "lucide-react"
import { GoalSettingsButton } from "@/components/goal-settings-button"
import { getDeviceInfo, storeDeviceId } from "@/lib/device-utils"
import { registerDeviceSession } from "@/lib/storage-supabase"
import { PlanStatusCard } from "@/components/plan-status-card"
import { getUserPlan, getDailyQuestionCount } from "@/lib/storage-supabase"
import type { UserPlan } from "@/lib/plan-utils"
import { getFlashcardProgressByMateria } from "@/lib/flashcards-storage"
import { DailyGoalsSection } from "@/components/daily-goals-section"
import { SmartReviewSection } from "@/components/smart-review-section"

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
  const [isPremium, setIsPremium] = useState(false)

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
        setIsPremium(plan === "premium")

        // As 5 matérias principais (já normalizadas pela função getProgressByTheme)
        const targetMaterias = [
          "Clínica Médica",
          "Clínica Cirúrgica",
          "Medicina Preventiva",
          "Pediatria",
          "Ginecologia e Obstetrícia",
        ]

        const processedProgress = targetMaterias
          .map((materia) => {
            // Busca direta pelo nome normalizado retornado por getProgressByTheme
            const match = progress.find((p) => p.theme === materia)

            if (match) {
              return {
                theme: materia,
                total: match.total,
                correct: match.correct,
                wrong: match.wrong,
                percentage: match.total > 0 ? Math.round((match.correct / match.total) * 100) : 0,
              }
            }

            return {
              theme: materia,
              total: 0,
              correct: 0,
              wrong: 0,
              percentage: 0,
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
        setIsPremium(plan === "premium")
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
      <div className="min-h-screen bg-background">
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">Carregando seu painel...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1 sm:mb-2">
            Bem-vindo de volta!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Mantenha seu conhecimento fresco com repetição espaçada
          </p>
        </div>

        <div className="mb-6 sm:mb-8 lg:mb-12">
          <PlanStatusCard plan={userPlan} questionsToday={questionsToday} />
        </div>

        {user && (
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <DailyGoalsSection userId={user.id} isPremium={isPremium} />
          </div>
        )}

        {user && (
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <SmartReviewSection userId={user.id} />
          </div>
        )}

        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <Link
            href="/study"
            className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all active:scale-95 cursor-pointer group border border-primary/20"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xl sm:text-2xl font-bold">Iniciar Estudo</h3>
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-primary-foreground/90 text-xs sm:text-sm mb-1 sm:mb-2">
              Revise questões do Revalida hoje
            </p>
            <p className="text-primary-foreground/70 text-xs">Continue sua jornada de aprendizado</p>
          </Link>

          <Link
            href="/flashcards"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Flashcards</h3>
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-xs sm:text-sm">Revisar temas do Revalida com flashcards</p>
          </Link>

          <Link
            href="/review"
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Revisão</h3>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-xs sm:text-sm">Veja seu progresso geral e análise por Matéria</p>
          </Link>

          <Link
            href="/simulados"
            className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all active:scale-95 cursor-pointer group relative"
          >
            {!isPremium && (
              <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </div>
            )}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Simulados</h3>
              <Target className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-xs sm:text-sm">Realize simulados completos do Revalida</p>
          </Link>

          <Link
            href="/conquistas"
            className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all active:scale-95 cursor-pointer group relative"
          >
            {!isPremium && (
              <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </div>
            )}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Conquistas</h3>
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-xs sm:text-sm">Veja suas conquistas e progresso de badges</p>
          </Link>

          <Link
            href="/estudo-gamificado"
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Plano Gamificado</h3>
              <BookMarked className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-xs sm:text-sm">Trilha de 20 semanas estruturada para Revalida</p>
          </Link>

          <Link
            href="/ranking-semanal"
            className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Ranking</h3>
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-xs sm:text-sm">Compete com outros estudantes do Revalida</p>
          </Link>

          <Link
            href="/pontos-fracos"
            className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Pontos Fracos</h3>
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-xs sm:text-sm">Identifique temas com mais dificuldade</p>
          </Link>

          <Link
            href="/grupo"
            className="bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-xl p-6 sm:p-8 hover:shadow-lg transition-all active:scale-95 cursor-pointer group relative"
          >
            {!isPremium && (
              <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </div>
            )}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Estudo em Grupo</h3>
              <Users className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white/90 text-xs sm:text-sm">Estude com amigos em tempo real</p>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-border rounded-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Progresso Diário</h2>
            <GoalSettingsButton
              currentDailyGoal={dailyGoal}
              currentMonthlyGoal={monthlyGoal}
              onGoalsSaved={reloadGoalsAndProgress}
              userPlan={userPlan}
            />
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">Meta Diária</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {dailyProgress} de {dailyGoal} questões
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold text-foreground">{dailyPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 sm:h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${dailyPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {dailyProgress >= dailyGoal
                    ? "Meta diária concluída"
                    : `Faltam ${dailyGoal - dailyProgress} questões para completar hoje`}
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-accent/10 rounded-lg">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">Meta Mensal</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {monthlyProgress} de {monthlyGoal} questões
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold text-foreground">{monthlyPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 sm:h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-accent to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${monthlyPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {monthlyProgress >= monthlyGoal
                    ? "Meta mensal concluída"
                    : `Faltam ${monthlyGoal - monthlyProgress} questões este mês`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 lg:mb-8">Progresso por Matéria</h2>
          {themeProgress.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {themeProgress.map((theme) => {
                const percentage = Math.round((theme.correct / theme.total) * 100)
                return (
                  <div key={theme.theme} className="bg-muted/50 rounded-lg p-4 text-center">
                    <span className="font-medium text-foreground text-sm sm:text-base block mb-2">{theme.theme}</span>
                    <span className="text-2xl sm:text-3xl font-bold text-primary">{percentage}%</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
              Nenhum dado de progresso disponível ainda. Comece a estudar para ver seu desempenho!
            </p>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 lg:mb-8">
            Progresso de Flashcards por Matéria
          </h2>
          {flashcardProgress.length > 0 && flashcardProgress.some((f) => f.total > 0) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {flashcardProgress
                .filter((fc) => fc.total > 0)
                .map((fc) => {
                  const percentage = Math.round((fc.correct / fc.total) * 100)
                  return (
                    <div key={fc.materia} className="bg-muted/50 rounded-lg p-4 text-center">
                      <span className="font-medium text-foreground text-sm sm:text-base block mb-2">{fc.materia}</span>
                      <span className="text-2xl sm:text-3xl font-bold text-purple-500">{percentage}%</span>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
              Nenhum progresso de flashcards disponível ainda. Comece a estudar flashcards para ver seu desempenho!
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
