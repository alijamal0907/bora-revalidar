'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseUser } from '@/lib/auth-supabase'
import { Navbar } from '@/components/navbar'
import {
  getUserProgress,
  getUserCurrentWeek,
  completeModule,
  initializeStudyPlan,
  type UserProgress,
} from '@/lib/gamification'
import { ArrowLeft, CheckCircle, Lock, BookOpen, Brain, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function StudyPlanPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [currentWeek, setCurrentWeek] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        setUser(currentUser)

        // Inicializar plano se não existir
        await initializeStudyPlan(currentUser.id)

        // Carregar progresso
        const userProgress = await getUserProgress(currentUser.id)
        setProgress(userProgress)

        // Obter semana atual
        const week = await getUserCurrentWeek(currentUser.id)
        setCurrentWeek(week)

        // Contar módulos completos
        const completed = userProgress.filter((p) => p.status_completed).length
        setCompletedCount(completed)

        setIsLoading(false)
      } catch (err) {
        console.error('[v0] Erro ao carregar plano de estudo:', err)
        setError('Erro ao carregar plano de estudo')
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleCompleteModule = async (week: number, area: string) => {
    try {
      if (!user) return

      await completeModule(user.id, week, area)

      // Atualizar progresso localmente
      setProgress((prev) =>
        prev.map((p) =>
          p.week_number === week && p.area_name === area
            ? {
                ...p,
                status_completed: true,
                completed_at: new Date().toISOString(),
              }
            : p,
        ),
      )

      // Atualizar contagem de completos
      setCompletedCount((prev) => prev + 1)

      // Atualizar semana atual
      const newWeek = await getUserCurrentWeek(user.id)
      setCurrentWeek(newWeek)
    } catch (err) {
      console.error('[v0] Erro ao completar módulo:', err)
      setError('Erro ao marcar módulo como completo')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando plano de estudo...</p>
          </div>
        </div>
      </div>
    )
  }

  const totalModules = 100 // 20 semanas × 5 áreas
  const progressPercentage = Math.round((completedCount / totalModules) * 100)

  // Agrupar progresso por semana
  const weeksData = Array.from({ length: 20 }, (_, i) => {
    const week = i + 1
    const modules = progress.filter((p) => p.week_number === week)
    const completedInWeek = modules.filter((p) => p.status_completed).length
    const isWeekLocked = week > currentWeek
    const isWeekCurrent = week === currentWeek
    const isWeekCompleted = completedInWeek === 5

    return {
      week,
      modules,
      completedInWeek,
      isLocked: isWeekLocked,
      isCurrent: isWeekCurrent,
      isCompleted: isWeekCompleted,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Plano de Aprovação Revalida – 20 Semanas
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Acompanhe seu progresso na trilha de aprendizado gamificada
          </p>
        </div>

        {/* Progresso Geral */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Semana Atual: {currentWeek}/20</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {completedCount} de {totalModules} módulos completos
              </p>
            </div>
            <div className="text-3xl font-bold text-primary">{progressPercentage}%</div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Timeline de Semanas */}
        <div className="space-y-4 sm:space-y-6">
          {weeksData.map((weekData) => (
            <div
              key={weekData.week}
              className={`border rounded-xl overflow-hidden transition-all ${
                weekData.isCompleted
                  ? 'border-emerald-500 bg-emerald-50/10'
                  : weekData.isCurrent
                    ? 'border-primary bg-primary/5'
                    : weekData.isLocked
                      ? 'border-border bg-muted/30'
                      : 'border-border'
              }`}
            >
              {/* Semana Header */}
              <div className="bg-card p-4 sm:p-6 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        weekData.isCompleted
                          ? 'bg-emerald-500 text-white'
                          : weekData.isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : weekData.isLocked
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {weekData.isCompleted ? <CheckCircle className="w-5 h-5" /> : `S${weekData.week}`}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Semana {weekData.week}</h3>
                      <p className="text-sm text-muted-foreground">
                        {weekData.completedInWeek}/5 módulos completos
                      </p>
                    </div>
                  </div>

                  {weekData.isCompleted && (
                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-700 text-xs font-semibold rounded-full">
                      ✓ Completo
                    </div>
                  )}
                  {weekData.isCurrent && (
                    <div className="px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                      Em Progresso
                    </div>
                  )}
                  {weekData.isLocked && (
                    <div className="px-3 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Bloqueada
                    </div>
                  )}
                </div>
              </div>

              {/* Módulos da Semana */}
              <div className="p-4 sm:p-6 space-y-3">
                {weekData.modules.map((module) => (
                  <div
                    key={`${module.week_number}-${module.area_name}`}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      module.status_completed
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : weekData.isLocked
                          ? 'border-border bg-muted/30 opacity-50'
                          : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{module.area_name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{module.subtopic_name}</p>
                      </div>

                      {module.status_completed ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-600">Concluído</span>
                        </div>
                      ) : weekData.isLocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
                      ) : (
                        <div className="flex gap-2 shrink-0">
                          <Link
                            href={`/study?area=${encodeURIComponent(module.area_name)}&subtopic=${encodeURIComponent(module.subtopic_name)}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Questões</span>
                          </Link>
                          <Link
                            href={`/flashcards?area=${encodeURIComponent(module.area_name)}&topic=${encodeURIComponent(module.subtopic_name)}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-md hover:bg-secondary/90 transition-colors"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Flashcards</span>
                          </Link>
                          <button
                            onClick={() => handleCompleteModule(module.week_number, module.area_name)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-700 text-xs font-semibold rounded-md hover:bg-emerald-500/30 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Marcar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 sm:p-6 mt-8">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Como funciona?</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Você progride através de 20 semanas com 5 módulos por semana</li>
                <li>• Estude questões e flashcards para cada módulo</li>
                <li>• Marque como concluído após completar os estudos</li>
                <li>• Desbloque a próxima semana após completar todos os 5 módulos</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
