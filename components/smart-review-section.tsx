'use client'

import { useEffect, useState, useCallback } from 'react'
import { getReviewStats, getDueReviewItems, type ReviewItem } from '@/lib/spaced-repetition-v2'
import { AlertCircle, BookOpen, Brain, RefreshCw, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SmartReviewSectionProps {
  userId: string
}

export function SmartReviewSection({ userId }: SmartReviewSectionProps) {
  const [stats, setStats] = useState({
    total: 0,
    due: 0,
    overdue: 0,
    questoes: 0,
    flashcards: 0,
    averageEaseFactor: '0',
  })
  const [dueItems, setDueItems] = useState<ReviewItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadReviewData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [statsData, dueData] = await Promise.all([
        getReviewStats(userId),
        getDueReviewItems(userId),
      ])

      setStats(statsData)
      setDueItems(dueData.slice(0, 5)) // Mostrar apenas os 5 primeiros
      setLastUpdated(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error('Erro ao carregar dados de revisão:', error)
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadReviewData()
  }, [loadReviewData])

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded mb-4 w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/50 border-2 border-blue-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Revisão Inteligente</h3>
            <p className="text-xs text-slate-400">Sistema de Espaçamento Otimizado (SM-2)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats.due > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {stats.due} para revisar
            </div>
          )}
          <button
            onClick={() => loadReviewData()}
            disabled={isLoading}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Última atualização */}
      {lastUpdated && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
          <Clock className="w-3 h-3" />
          <span>Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-lg font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Vencido</p>
          <p className="text-lg font-bold text-red-400">{stats.due}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Questões</p>
          <p className="text-lg font-bold text-blue-400">{stats.questoes}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Flashcards</p>
          <p className="text-lg font-bold text-emerald-400">{stats.flashcards}</p>
        </div>
      </div>

      {/* Due Items */}
      {dueItems.length > 0 ? (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Próximos para revisar:</p>
          {dueItems.map((item) => (
            <div key={item.id} className="bg-slate-800/40 rounded-lg p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {item.content_type === 'questao' ? (
                  <BookOpen className="w-4 h-4 text-blue-400" />
                ) : (
                  <Brain className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-slate-200">
                  {item.content_type === 'questao' ? 'Questão' : 'Flashcard'} #{item.content_id.slice(0, 8)}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Intervalo: {item.interval_days}d
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-300 font-medium">Nada para revisar agora. Continue estudando!</span>
        </div>
      )}

      {/* Call to Action */}
      {stats.due > 0 ? (
        <Link
          href="/review"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Iniciar Revisão ({stats.due})
        </Link>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Volte mais tarde para revisar conteúdo agendado
        </p>
      )}
    </div>
  )
}
