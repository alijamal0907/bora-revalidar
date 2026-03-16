'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseUser } from '@/lib/auth-supabase'
import { Navbar } from '@/components/navbar'
import { getUserWeakTopics, type WeakTopic } from '@/lib/gamification'
import {
  ArrowLeft,
  AlertTriangle,
  TrendingDown,
  BookOpen,
  Brain,
  Target,
  BarChart2,
} from 'lucide-react'
import Link from 'next/link'

// ─── Tipos de severidade ──────────────────────────────────────────────────────

type Severity = 'critico' | 'alto' | 'medio'

interface SeverityConfig {
  label: string
  bg: string
  border: string
  badgeBg: string
  badgeText: string
  barColor: string
  textColor: string
  dot: string
}

const SEVERITY_CONFIG: Record<Severity, SeverityConfig> = {
  critico: {
    label: 'Crítico',
    bg: 'bg-red-950/40',
    border: 'border-red-700',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white',
    barColor: 'bg-red-500',
    textColor: 'text-red-400',
    dot: 'bg-red-500',
  },
  alto: {
    label: 'Alto',
    bg: 'bg-orange-950/30',
    border: 'border-orange-700',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    barColor: 'bg-orange-500',
    textColor: 'text-orange-400',
    dot: 'bg-orange-500',
  },
  medio: {
    label: 'Médio',
    bg: 'bg-yellow-950/20',
    border: 'border-yellow-700',
    badgeBg: 'bg-yellow-600',
    badgeText: 'text-white',
    barColor: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    dot: 'bg-yellow-500',
  },
}

function getSeverity(errorRate: number): Severity {
  if (errorRate > 0.7) return 'critico'
  if (errorRate > 0.5) return 'alto'
  return 'medio'
}

function getSuccessRate(topic: WeakTopic): number {
  if (topic.total_attempts === 0) return 0
  return Math.round((topic.correct_attempts / topic.total_attempts) * 100)
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function WeakTopicsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<Severity | 'todos'>('todos')

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        setUser(currentUser)

        const topics = await getUserWeakTopics(currentUser.id, 20)
        setWeakTopics(topics)
      } catch (error) {
        console.error('[v0] Erro ao carregar temas fracos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <Navbar user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300">Analisando seus pontos fracos...</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredTopics =
    filter === 'todos'
      ? weakTopics
      : weakTopics.filter((t) => getSeverity(t.error_rate) === filter)

  const countBySeverity = {
    critico: weakTopics.filter((t) => getSeverity(t.error_rate) === 'critico').length,
    alto: weakTopics.filter((t) => getSeverity(t.error_rate) === 'alto').length,
    medio: weakTopics.filter((t) => getSeverity(t.error_rate) === 'medio').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <Navbar user={user} />

      <main className="mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Target className="w-6 h-6 text-red-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Pontos Fracos
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base">
            Temas onde você tem mais dificuldade — concentre esforços aqui para evoluir mais rápido
          </p>
        </div>

        {/* Resumo de severidade */}
        {weakTopics.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(
              [
                { key: 'critico', label: 'Crítico', color: 'text-red-400', border: 'border-red-800', bg: 'bg-red-950/40' },
                { key: 'alto', label: 'Alto', color: 'text-orange-400', border: 'border-orange-800', bg: 'bg-orange-950/30' },
                { key: 'medio', label: 'Médio', color: 'text-yellow-400', border: 'border-yellow-800', bg: 'bg-yellow-950/20' },
              ] as const
            ).map(({ key, label, color, border, bg }) => (
              <button
                key={key}
                onClick={() => setFilter(filter === key ? 'todos' : key)}
                className={`rounded-xl border p-3 sm:p-4 text-center transition-all ${bg} ${border} ${
                  filter === key ? 'ring-2 ring-white/20 scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
              >
                <p className={`text-xl sm:text-2xl font-bold ${color}`}>
                  {countBySeverity[key]}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </button>
            ))}
          </div>
        )}

        {/* Filtro ativo */}
        {filter !== 'todos' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-400">Filtrando por:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEVERITY_CONFIG[filter].badgeBg} ${SEVERITY_CONFIG[filter].badgeText}`}>
              {SEVERITY_CONFIG[filter].label}
            </span>
            <button
              onClick={() => setFilter('todos')}
              className="text-xs text-slate-500 hover:text-white transition-colors underline"
            >
              limpar
            </button>
          </div>
        )}

        {/* Empty State */}
        {weakTopics.length === 0 ? (
          <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Nenhum ponto fraco detectado</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Continue respondendo questões para que o sistema detecte automaticamente suas áreas de dificuldade
            </p>
            <Link
              href="/estudo-gamificado"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
            >
              <BookOpen className="w-4 h-4" />
              Iniciar Estudo
            </Link>
          </div>
        ) : (
          <>
            {filteredTopics.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 text-center">
                <p className="text-slate-400">Nenhum tema com severidade {SEVERITY_CONFIG[filter as Severity]?.label} encontrado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTopics.map((topic) => {
                  const severity = getSeverity(topic.error_rate)
                  const cfg = SEVERITY_CONFIG[severity]
                  const successRate = getSuccessRate(topic)

                  return (
                    <div
                      key={topic.id}
                      className={`border-2 rounded-xl p-4 sm:p-6 transition-all ${cfg.bg} ${cfg.border}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Info principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                            <div>
                              <h3 className="font-bold text-white text-base sm:text-lg leading-snug">
                                {topic.subtema}
                              </h3>
                              <p className="text-sm text-slate-400 mt-0.5">{topic.area_name}</p>
                            </div>
                            <span
                              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${cfg.badgeBg} ${cfg.badgeText}`}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <div className="bg-slate-900/50 rounded-lg p-2 sm:p-3 text-center">
                              <p className="text-xs text-slate-500 mb-0.5">Taxa de Erro</p>
                              <p className={`text-lg sm:text-xl font-bold ${cfg.textColor}`}>
                                {Math.round(topic.error_rate * 100)}%
                              </p>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2 sm:p-3 text-center">
                              <p className="text-xs text-slate-500 mb-0.5">Taxa de Acerto</p>
                              <p className="text-lg sm:text-xl font-bold text-emerald-400">
                                {successRate}%
                              </p>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2 sm:p-3 text-center">
                              <p className="text-xs text-slate-500 mb-0.5">Tentativas</p>
                              <p className="text-lg sm:text-xl font-bold text-white">
                                {topic.total_attempts}
                              </p>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2 sm:p-3 text-center">
                              <p className="text-xs text-slate-500 mb-0.5">Acertos</p>
                              <p className="text-lg sm:text-xl font-bold text-emerald-400">
                                {topic.correct_attempts}
                              </p>
                            </div>
                          </div>

                          {/* Barra de progresso */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-slate-500">Progresso</span>
                              <span className="text-xs font-semibold text-slate-300">
                                {successRate}% corretos
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${cfg.barColor}`}
                                style={{ width: `${successRate}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex sm:flex-col gap-2 sm:w-28 shrink-0">
                          <Link
                            href={`/study?topic=${encodeURIComponent(topic.subtema)}&area=${encodeURIComponent(topic.area_name)}`}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Treinar
                          </Link>
                          <Link
                            href={`/flashcards?topic=${encodeURIComponent(topic.subtema)}&area=${encodeURIComponent(topic.area_name)}`}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors text-xs sm:text-sm"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            Revisar
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Banner de recomendação */}
            <div className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-4 sm:p-6 mt-8">
              <div className="flex gap-3">
                <BarChart2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-300">Estratégia de Estudo</h3>
                  <p className="text-sm text-blue-400 mt-1.5">
                    Priorize os temas <strong className="text-red-400">Críticos</strong> (erro acima de 70%) e{' '}
                    <strong className="text-orange-400">Altos</strong> (erro acima de 50%) antes de qualquer outra área.
                    Combine questões e flashcards para consolidar o aprendizado e reducir a taxa de erro progressivamente.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
