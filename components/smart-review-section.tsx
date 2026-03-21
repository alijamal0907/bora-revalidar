'use client'

import { useEffect, useState, useCallback } from 'react'
import { getReviewStats, getDueReviewItems, type ReviewItem } from '@/lib/spaced-repetition-v2'
import { AlertCircle, BookOpen, Brain, RefreshCw, Clock, Play, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

interface SmartReviewSectionProps {
  userId: string
}

interface EnrichedReviewItem extends ReviewItem {
  title?: string
  preview?: string
  tema?: string
  materia?: string
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
  const [dueItems, setDueItems] = useState<EnrichedReviewItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadReviewData = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const [statsData, dueData] = await Promise.all([
        getReviewStats(userId),
        getDueReviewItems(userId),
      ])

      setStats(statsData)
      
      // Enrich due items with actual content
      if (dueData.length > 0) {
        const enrichedItems: EnrichedReviewItem[] = []
        
        // Separate flashcards and questions
        const flashcardIds = dueData
          .filter(item => item.content_type === 'flashcard')
          .map(item => item.content_id)
        const questionIds = dueData
          .filter(item => item.content_type === 'questao')
          .map(item => item.content_id)
        
        // Fetch flashcard details
        let flashcardsMap = new Map<string, any>()
        if (flashcardIds.length > 0) {
          const { data: flashcards } = await supabase
            .from('flashcards')
            .select('id, frente, verso, materia, tema')
            .in('id', flashcardIds)
          
          if (flashcards) {
            flashcards.forEach(f => flashcardsMap.set(f.id, f))
          }
        }
        
        // Fetch question details
        let questionsMap = new Map<string, any>()
        if (questionIds.length > 0) {
          const { data: questions } = await supabase
            .from('questoes')
            .select('id, enunciado, tema, subtema')
            .in('id', questionIds)
          
          if (questions) {
            questions.forEach(q => questionsMap.set(q.id, q))
          }
        }
        
        // Enrich each item
        for (const item of dueData.slice(0, 5)) {
          const enriched: EnrichedReviewItem = { ...item }
          
          if (item.content_type === 'flashcard') {
            const flashcard = flashcardsMap.get(item.content_id)
            if (flashcard) {
              enriched.title = flashcard.frente?.substring(0, 60) + (flashcard.frente?.length > 60 ? '...' : '')
              enriched.preview = flashcard.verso?.substring(0, 80) + (flashcard.verso?.length > 80 ? '...' : '')
              enriched.materia = flashcard.materia
              enriched.tema = flashcard.tema
            }
          } else if (item.content_type === 'questao') {
            const question = questionsMap.get(item.content_id)
            if (question) {
              enriched.title = question.enunciado?.substring(0, 80) + (question.enunciado?.length > 80 ? '...' : '')
              enriched.tema = question.tema
              enriched.preview = question.subtema
            }
          }
          
          enrichedItems.push(enriched)
        }
        
        setDueItems(enrichedItems)
      } else {
        setDueItems([])
      }
      
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
        <div className="space-y-3 mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Conteúdo para revisar:</p>
          {dueItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  item.content_type === 'questao' 
                    ? 'bg-blue-500/20' 
                    : 'bg-emerald-500/20'
                }`}>
                  {item.content_type === 'questao' ? (
                    <BookOpen className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Brain className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.content_type === 'questao'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {item.content_type === 'questao' ? 'Questão' : 'Flashcard'}
                    </span>
                    {(item.tema || item.materia) && (
                      <span className="text-xs text-slate-500">
                        {item.materia || item.tema}
                      </span>
                    )}
                  </div>
                  {item.title ? (
                    <p className="text-sm text-slate-200 leading-relaxed line-clamp-2">
                      {item.title}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      Conteúdo #{item.content_id.slice(0, 8)}
                    </p>
                  )}
                  {item.preview && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {item.preview}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.interval_days <= 1 
                      ? 'bg-red-500/20 text-red-300' 
                      : item.interval_days <= 3 
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-600/50 text-slate-400'
                  }`}>
                    {item.interval_days}d
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-lg p-4 mb-4 flex items-center gap-3 text-sm">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-300 font-medium">Tudo em dia!</p>
            <p className="text-emerald-400/70 text-xs mt-0.5">Nenhum conteúdo pendente para revisão no momento.</p>
          </div>
        </div>
      )}

      {/* Call to Action */}
      {stats.due > 0 ? (
        <Link
          href="/review"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20 group"
        >
          <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Iniciar Revisão
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">
            {stats.due} {stats.due === 1 ? 'item' : 'itens'}
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-slate-500">
            Volte mais tarde para revisar conteúdo agendado
          </p>
          <Link 
            href="/flashcards" 
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
          >
            Estudar novos flashcards
          </Link>
        </div>
      )}
    </div>
  )
}
