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

// Títulos das semanas (inline para evitar import de módulos server)
const WEEK_TITLES: Record<number, string> = {
  1: 'Fundamentos Clínicos e Cirúrgicos',
  2: 'Cardiologia e Cirurgia Cardíaca',
  3: 'Pneumologia e Cirurgia Torácica',
  4: 'Gastroenterologia e Cirurgia do Abdome',
  5: 'Nefrologia e Urologia',
  6: 'Neurologia e Neurocirurgia',
  7: 'Endocrinologia e Cirurgia Endócrina',
  8: 'Oncologia e Oncologia Cirúrgica',
  9: 'Hematologia e Transplantes',
  10: 'Infectologia e Cirurgia de Urgência',
  11: 'Reumatologia e Ortopedia',
  12: 'Dermatologia e Cirurgia Plástica',
  13: 'Saúde da Mulher e Ginecologia',
  14: 'Obstetrícia e Alto Risco Gestacional',
  15: 'Pediatria – Neonatologia e Lactente',
  16: 'Pediatria – Crescimento e Doenças Crônicas',
  17: 'Medicina Preventiva e Saúde Coletiva',
  18: 'Urgência, Emergência e Trauma',
  19: 'Revisão Multidisciplinar I',
  20: 'Revisão Multidisciplinar II',
}

interface WeekData {
  week: number
  title: string
  modules: UserProgress[]
  completedInWeek: number
  isLocked: boolean
  isCurrent: boolean
  isCompleted: boolean
}

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Carregando plano de estudo...</p>
          </div>
        </div>
      </div>
    )
  }

  const totalModules = 100 // 20 semanas × 5 áreas
  const progressPercentage = Math.round((completedCount / totalModules) * 100)

  // Agrupar progresso por semana
  const weeksData: WeekData[] = Array.from({ length: 20 }, (_, i) => {
    const week = i + 1
    const modules = progress.filter((p) => p.week_number === week)
    const completedInWeek = modules.filter((p) => p.status_completed).length
    const isWeekLocked = week > currentWeek + 1
    const isWeekCurrent = week === currentWeek
    const isWeekCompleted = completedInWeek === 5

    return {
      week,
      title: WEEK_TITLES[week] || `Semana ${week}`,
      modules,
      completedInWeek,
      isLocked: isWeekLocked,
      isCurrent: isWeekCurrent,
      isCompleted: isWeekCompleted,
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <Navbar user={user} />

      <main className="mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Plano de Estudos – 20 Semanas
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Trilha estruturada com 5 módulos por semana
          </p>
        </div>

        {/* Progresso Geral */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Semana Atual: {currentWeek}/20</h2>
              <p className="text-sm text-slate-400 mt-1">
                {completedCount} de {totalModules} módulos completos
              </p>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{progressPercentage}%</div>
          </div>

          {/* Progress Bar - Cor verde esmeralda */}
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
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
                  ? 'border-emerald-500/50 bg-emerald-900/20'
                  : weekData.isCurrent
                    ? 'border-blue-500/50 bg-blue-900/20'
                    : weekData.isLocked
                      ? 'border-slate-700 bg-slate-800/30 opacity-70'
                      : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              {/* Semana Header */}
              <div className="bg-slate-800/50 p-4 sm:p-6 border-b border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        weekData.isCompleted
                          ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500'
                          : weekData.isCurrent
                            ? 'bg-blue-500/30 text-blue-400 border border-blue-500'
                            : weekData.isLocked
                              ? 'bg-slate-700 text-slate-500 border border-slate-600'
                              : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {weekData.isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : weekData.isLocked ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        `S${weekData.week}`
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Semana {weekData.week}</h3>
                      <p className="text-sm text-slate-400">
                        {weekData.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {weekData.completedInWeek}/5 módulos completos
                      </p>
                    </div>
                  </div>

                  {weekData.isCompleted && (
                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
                      ✓ Completo
                    </div>
                  )}
                  {weekData.isCurrent && !weekData.isCompleted && (
                    <div className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                      Em Progresso
                    </div>
                  )}
                  {weekData.isLocked && (
                    <div className="px-3 py-1 bg-slate-700 text-slate-400 text-xs font-semibold rounded-full flex items-center gap-1">
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
                    className={`p-4 rounded-lg border-2 transition-all ${
                      module.status_completed
                        ? 'border-emerald-500/50 bg-emerald-900/30'
                        : weekData.isLocked
                          ? 'border-slate-700 bg-slate-900/30 opacity-60'
                          : 'border-slate-700 bg-slate-900/50 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{module.area_name}</h4>
                        <p className="text-sm text-slate-400 mt-1">{module.subtopic_name}</p>
                      </div>

                      {module.status_completed && (
                        <div className="flex items-center gap-2 shrink-0 px-2 py-1 bg-emerald-500/20 rounded">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">Concluído</span>
                        </div>
                      )}
                    </div>

                    {!module.status_completed && (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={weekData.isLocked ? '#' : `/study?area=${encodeURIComponent(module.area_name)}`}
                          onClick={(e) => weekData.isLocked && e.preventDefault()}
                          className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                            weekData.isLocked
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                              : 'bg-blue-600/70 text-white hover:bg-blue-600'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          Resolver Questões
                        </Link>

                        <Link
                          href={weekData.isLocked ? '#' : `/flashcards?area=${encodeURIComponent(module.area_name)}`}
                          onClick={(e) => weekData.isLocked && e.preventDefault()}
                          className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                            weekData.isLocked
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                          }`}
                        >
                          <Brain className="w-4 h-4" />
                          Revisar Flashcards
                        </Link>

                        <button
                          onClick={() => handleCompleteModule(module.week_number, module.area_name)}
                          disabled={weekData.isLocked}
                          className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                            weekData.isLocked
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                              : 'bg-emerald-600/70 text-white hover:bg-emerald-600'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar Concluído
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4 sm:p-6 mt-8">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-300">Como funciona o plano?</h3>
              <ul className="text-sm text-blue-200/80 mt-2 space-y-1">
                <li>Cor VERDE: Semana/módulo concluído</li>
                <li>Cor AZUL: Semana/módulo em progresso (destravado)</li>
                <li>Cor CINZA: Semana/módulo bloqueado - Complete a semana anterior</li>
                <li>Cada módulo possui questões reais e flashcards para estudo</li>
                <li>Complete os 5 módulos para desbloquear a próxima semana</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

