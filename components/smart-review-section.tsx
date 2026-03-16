'use client'

import { useEffect, useState } from 'react'
import { getReviewStats, getDueReviewItems, type ReviewItem } from '@/lib/spaced-repetition-v2'
import { AlertCircle, BookOpen, Brain, RefreshCw } from 'lucide-react'
import Link from 'next/link'

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

  useEffect(() => {
    const loadReviewData = async () => {
      try {
        const [statsData, dueData] = await Promise.all([
          getReviewStats(userId),
          getDueReviewItems(userId),
        ])

        setStats(statsData)
        setDueItems(dueData.slice(0, 5)) // Mostrar apenas os 5 primeiros
        setIsLoading(false)
      } catch (error) {
        console.error('[v0] Erro ao carregar dados de revisão:', error)
        setIsLoading(false)
      }
    }

    loadReviewData()
  }, [userId])

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-muted rounded mb-4 w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Revisão Inteligente</h3>
            <p className="text-xs text-muted-foreground">Sistema de Espaçamento Otimizado (SM-2)</p>
          </div>
        </div>
        {stats.due > 0 && (
          <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {stats.due} para revisar
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Agendado</p>
          <p className="text-lg font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Vencido</p>
          <p className="text-lg font-bold text-red-600">{stats.due}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Questões</p>
          <p className="text-lg font-bold text-blue-600">{stats.questoes}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Flashcards</p>
          <p className="text-lg font-bold text-purple-600">{stats.flashcards}</p>
        </div>
      </div>

      {/* Due Items */}
      {dueItems.length > 0 ? (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-muted-foreground">Próximos para revisar:</p>
          {dueItems.map((item) => (
            <div key={item.id} className="bg-white/50 rounded-lg p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {item.content_type === 'questao' ? (
                  <BookOpen className="w-4 h-4 text-blue-500" />
                ) : (
                  <Brain className="w-4 h-4 text-purple-500" />
                )}
                <span className="text-foreground">
                  {item.content_type === 'questao' ? 'Questão' : 'Flashcard'} #{item.content_id.slice(0, 8)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Intervalo: {item.interval_days}d
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/50 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-green-600" />
          <span className="text-green-700 font-medium">Nada para revisar agora! 🎉</span>
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
        <p className="text-center text-xs text-muted-foreground">
          Volte mais tarde para revisar conteúdo agendado
        </p>
      )}
    </div>
  )
}
