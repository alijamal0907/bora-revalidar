'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, Lock, BookOpen, Brain, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

const AREAS = [
  'Clínica Médica',
  'Clínica Cirúrgica',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Medicina Preventiva',
] as const

type Area = typeof AREAS[number]

interface Module {
  week: number
  area: Area
  subtema: string
  status_completed: boolean
  completed_at: string | null
}

interface WeekData {
  week: number
  modules: Module[]
  completedCount: number
  isLocked: boolean
  isCurrent: boolean
  isCompleted: boolean
}

// Distribui subtemas reais do banco pelas 20 semanas de forma equilibrada
function buildPlan(subtemasByArea: Record<string, string[]>): Record<number, Record<Area, string>> {
  const plan: Record<number, Record<Area, string>> = {}

  for (let w = 1; w <= 20; w++) {
    plan[w] = {} as Record<Area, string>
  }

  for (const area of AREAS) {
    const subtemas = subtemasByArea[area] || []
    if (subtemas.length === 0) {
      // Fallback se não há subtemas no banco para essa área
      for (let w = 1; w <= 20; w++) {
        plan[w][area] = area
      }
      continue
    }
    // Distribui ciclicamente: semana 1 = subtema[0], semana 2 = subtema[1], etc.
    for (let w = 1; w <= 20; w++) {
      plan[w][area] = subtemas[(w - 1) % subtemas.length]
    }
  }

  return plan
}

export default function PlanoDeEstudosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [currentWeek, setCurrentWeek] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]))
  const [subtemasByArea, setSubtemasByArea] = useState<Record<string, string[]>>({})
  const [planReady, setPlanReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient()
        const { data: { user: u } } = await supabase.auth.getUser()

        if (!u) {
          router.push('/login')
          return
        }
        setUser(u)

        // 1. Buscar subtemas reais do banco via API
        const subtemasRes = await fetch('/api/plano-subtemas')
        const subtemasData = await subtemasRes.json()

        if (subtemasData.error) {
          setError('Erro ao carregar subtemas: ' + subtemasData.error)
          setIsLoading(false)
          return
        }

        const realSubtemas: Record<string, string[]> = subtemasData.subtemas || {}
        setSubtemasByArea(realSubtemas)

        // 2. Buscar progresso do usuário via API
        const progressRes = await fetch(`/api/plano-progresso?userId=${u.id}`)
        const progressData = await progressRes.json()
        let existingProgress: any[] = progressData.data || []

        // 3. Se não há progresso, inicializar com subtemas reais do banco
        if (existingProgress.length === 0) {
          const plan = buildPlan(realSubtemas)
          const records: any[] = []

          for (let week = 1; week <= 20; week++) {
            for (const area of AREAS) {
              records.push({
                user_id: u.id,
                week_number: week,
                area_name: area,
                subtopic_name: plan[week][area] || area,
                status_completed: false,
                completed_at: null,
              })
            }
          }

          await fetch('/api/plano-progresso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'initialize', userId: u.id, records }),
          })

          // Re-buscar progresso
          const refetch = await fetch(`/api/plano-progresso?userId=${u.id}`)
          const refetchData = await refetch.json()
          existingProgress = refetchData.data || records
        }

        // 4. Montar módulos
        const mods: Module[] = existingProgress.map((p: any) => ({
          week: p.week_number,
          area: p.area_name as Area,
          subtema: p.subtopic_name || p.area_name,
          status_completed: p.status_completed || false,
          completed_at: p.completed_at,
        }))
        setModules(mods)

        // 5. Calcular semana atual
        let cw = 1
        for (let w = 1; w <= 20; w++) {
          const wMods = mods.filter((m) => m.week === w)
          const done = wMods.filter((m) => m.status_completed).length
          if (done < AREAS.length) { cw = w; break }
          if (w === 20) cw = 21
        }
        setCurrentWeek(cw)
        setExpandedWeeks(new Set([cw]))
        setPlanReady(true)
      } catch (err: any) {
        console.error('[plano] Erro:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [router])

  async function handleComplete(week: number, area: Area) {
    if (!user) return
    try {
      await fetch('/api/plano-progresso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', userId: user.id, week, area }),
      })
      setModules((prev) =>
        prev.map((m) =>
          m.week === week && m.area === area
            ? { ...m, status_completed: true, completed_at: new Date().toISOString() }
            : m,
        ),
      )
      // Recalcular semana atual
      const updated = modules.map((m) =>
        m.week === week && m.area === area ? { ...m, status_completed: true } : m,
      )
      let cw = 1
      for (let w = 1; w <= 20; w++) {
        const wMods = updated.filter((m) => m.week === w)
        const done = wMods.filter((m) => m.status_completed).length
        if (done < AREAS.length) { cw = w; break }
        if (w === 20) cw = 21
      }
      setCurrentWeek(cw)
    } catch (err) {
      console.error('[plano] Erro ao marcar concluído:', err)
    }
  }

  function toggleWeek(week: number) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week)
      else next.add(week)
      return next
    })
  }

  // Montar semanas
  const weeksData: WeekData[] = Array.from({ length: 20 }, (_, i) => {
    const week = i + 1
    const wMods = modules.filter((m) => m.week === week)
    const completedCount = wMods.filter((m) => m.status_completed).length
    return {
      week,
      modules: wMods,
      completedCount,
      isLocked: week > currentWeek + 1,
      isCurrent: week === currentWeek,
      isCompleted: completedCount === AREAS.length && AREAS.length > 0,
    }
  })

  const totalCompleted = modules.filter((m) => m.status_completed).length
  const totalModules = modules.length || 100
  const overallProgress = Math.round((totalCompleted / totalModules) * 100)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Navbar user={user} />
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando plano de estudos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar user={user} />
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erro ao carregar plano</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Plano de Estudos</h1>
            <p className="text-slate-400 text-sm">Trilha de 20 semanas para o Revalida</p>
          </div>
        </div>

        {/* Progresso geral */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-300 font-medium">Progresso Geral</span>
            <span className="text-white font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">
            {totalCompleted} de {totalModules} módulos concluídos — Semana atual: {currentWeek > 20 ? 'Concluído!' : currentWeek}
          </p>
        </div>

        {/* Lista de semanas */}
        <div className="space-y-3">
          {weeksData.map((wd) => {
            const isExpanded = expandedWeeks.has(wd.week)

            return (
              <div
                key={wd.week}
                className={`border rounded-xl overflow-hidden transition-all ${
                  wd.isCompleted
                    ? 'border-emerald-700/50 bg-emerald-950/20'
                    : wd.isCurrent
                      ? 'border-blue-600/60 bg-blue-950/20'
                      : wd.isLocked
                        ? 'border-slate-800 bg-slate-900/40 opacity-60'
                        : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                {/* Header da semana */}
                <button
                  onClick={() => !wd.isLocked && toggleWeek(wd.week)}
                  disabled={wd.isLocked}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    {wd.isLocked ? (
                      <Lock className="w-5 h-5 text-slate-600 shrink-0" />
                    ) : wd.isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${wd.isCurrent ? 'border-blue-400 bg-blue-400/20' : 'border-slate-600'}`} />
                    )}
                    <div>
                      <span className="font-semibold text-white text-sm">
                        Semana {wd.week}
                        {wd.isCurrent && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Atual</span>
                        )}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {wd.completedCount}/{AREAS.length} módulos concluídos
                      </p>
                    </div>
                  </div>
                  {!wd.isLocked && (
                    isExpanded
                      ? <ChevronUp className="w-4 h-4 text-slate-400" />
                      : <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Módulos da semana */}
                {isExpanded && !wd.isLocked && (
                  <div className="border-t border-slate-800 divide-y divide-slate-800/50">
                    {wd.modules.map((mod) => (
                      <div
                        key={`${mod.week}-${mod.area}`}
                        className={`px-5 py-4 ${mod.status_completed ? 'opacity-70' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {mod.status_completed ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                              )}
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                {mod.area}
                              </span>
                            </div>
                            <p className="text-sm text-white ml-6 leading-snug">{mod.subtema}</p>
                          </div>
                        </div>

                        {/* Botões de ação */}
                        <div className="flex flex-wrap gap-2 ml-6">
                          {/* Resolver Questões */}
                          <Link
                            href={`/study?area=${encodeURIComponent(mod.area)}&subtema=${encodeURIComponent(mod.subtema)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 transition-colors border border-blue-700/30"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            {mod.status_completed ? 'Refazer Questões' : 'Resolver Questões'}
                          </Link>

                          {/* Revisar Flashcards */}
                          <Link
                            href={`/flashcards?area=${encodeURIComponent(mod.area)}&subtema=${encodeURIComponent(mod.subtema)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-700/60 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700/50"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            {mod.status_completed ? 'Refazer Flashcards' : 'Revisar Flashcards'}
                          </Link>

                          {/* Marcar concluído (só se não estiver) */}
                          {!mod.status_completed && (
                            <button
                              onClick={() => handleComplete(mod.week, mod.area)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-700/20 text-emerald-300 hover:bg-emerald-700/40 transition-colors border border-emerald-700/30"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Marcar Concluído
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
