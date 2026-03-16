'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseUser } from '@/lib/auth-supabase'
import { Navbar } from '@/components/navbar'
import { getUserWeakTopics, type WeakTopic } from '@/lib/gamification'
import { ArrowLeft, AlertTriangle, TrendingDown, BookOpen, Brain } from 'lucide-react'
import Link from 'next/link'

export default function WeakTopicsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getSupabaseUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        setUser(currentUser)

        // Carregar temas fracos
        const topics = await getUserWeakTopics(currentUser.id)
        setWeakTopics(topics)

        setIsLoading(false)
      } catch (error) {
        console.error('[v0] Erro ao carregar temas fracos:', error)
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
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Analisando seus pontos fracos...</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (errorRate: number) => {
    if (errorRate > 0.7) {
      return {
        bg: 'bg-red-900/20',
        border: 'border-red-600',
        label: 'Crítico',
        badge: 'bg-red-600 text-white',
        icon: '🔴',
        color: 'text-red-400',
      }
    }
    if (errorRate > 0.5) {
      return {
        bg: 'bg-orange-900/20',
        border: 'border-orange-600',
        label: 'Alto',
        badge: 'bg-orange-600 text-white',
        icon: '🟠',
        color: 'text-orange-400',
      }
    }
    return {
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-600',
      label: 'Médio',
      badge: 'bg-yellow-600 text-white',
      icon: '🟡',
      color: 'text-yellow-400',
    }
  }

  const getSuccessRate = (topic: WeakTopic) => {
    if (topic.total_attempts === 0) return 0
    return Math.round((topic.correct_attempts / topic.total_attempts) * 100)
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
            Voltar
          </button>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Seus Pontos Fracos
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Temas onde você tem mais dificuldade - concentre-se nessas áreas para melhorar
          </p>
        </div>

        {/* Empty State */}
        {weakTopics.length === 0 ? (
          <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Nenhum ponto fraco detectado</h2>
            <p className="text-slate-400 mb-6">
              Continue respondendo questões para que o sistema detecte automaticamente seus pontos fracos
            </p>
            <Link
              href="/estudo-gamificado"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Iniciar Estudo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {weakTopics.map((topic) => {
              const status = getStatusColor(topic.error_rate)
              const successRate = getSuccessRate(topic)

              return (
                <div
                  key={topic.id}
                  className={`border-2 rounded-xl p-4 sm:p-6 transition-all ${status.bg} ${status.border}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{topic.subtema}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{topic.area_name}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${status.color} bg-white/50`}>
                          {status.label}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Taxa de Erro</p>
                          <p className="text-xl font-bold text-foreground">
                            {Math.round(topic.error_rate * 100)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
                          <p className="text-xl font-bold text-emerald-600">
                            {successRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total de Tentativas</p>
                          <p className="text-xl font-bold text-foreground">
                            {topic.total_attempts}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Acertos</p>
                          <p className="text-xl font-bold text-emerald-600">
                            {topic.correct_attempts}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">Progresso</span>
                          <span className="text-xs font-bold text-foreground">{successRate}% corretos</span>
                        </div>
                        <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              successRate >= 70 ? 'bg-emerald-500' : successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 sm:w-auto">
                      <Link
                        href={`/study?topic=${encodeURIComponent(topic.subtema)}&area=${encodeURIComponent(topic.area_name)}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Treinar</span>
                        <span className="sm:hidden">Treinar</span>
                      </Link>
                      <Link
                        href={`/flashcards?topic=${encodeURIComponent(topic.subtema)}&area=${encodeURIComponent(topic.area_name)}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/90 transition-colors text-sm"
                      >
                        <Brain className="w-4 h-4" />
                        <span className="hidden sm:inline">Revisar</span>
                        <span className="sm:hidden">Revisar</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Banner */}
        {weakTopics.length > 0 && (
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 sm:p-6 mt-8">
            <div className="flex gap-3">
              <TrendingDown className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Recomendação</h3>
                <p className="text-sm text-blue-800 mt-2">
                  Priorize os temas com taxa de erro acima de 40% para melhorar seu desempenho. Use tanto questões quanto
                  flashcards para consolidar o aprendizado.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
