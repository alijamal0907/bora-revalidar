'use client'

import { useEffect, useState, useCallback } from 'react'
import { getReviewStats, getDueReviewItems, type ReviewItem } from '@/lib/spaced-repetition-v2'
import { AlertCircle, BookOpen, Brain, RefreshCw, Clock, Play, ChevronRight, Sparkles, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SmartReviewSectionProps {
  userId: string
}

interface EnrichedReviewItem extends ReviewItem {
  title?: string
  preview?: string
  tema?: string
  materia?: string
}

type FilterType = 'all' | 'flashcard' | 'questao'

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
  const [allDueItems, setAllDueItems] = useState<EnrichedReviewItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

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
            .select('id, enunciado, tema, subtema, resposta_correta')
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
        
        setAllDueItems(enrichedItems)
        setDueItems(enrichedItems.slice(0, 5))
      } else {
        setAllDueItems([])
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

  // Filter items when filter changes
  useEffect(() => {
    if (filter === 'all') {
      setDueItems(allDueItems.slice(0, 5))
    } else {
      const filtered = allDueItems.filter(item => item.content_type === filter)
      setDueItems(filtered.slice(0, 5))
    }
  }, [filter, allDueItems])

  // Calculate filtered counts
  const flashcardCount = allDueItems.filter(i => i.content_type === 'flashcard').length
  const questionCount = allDueItems.filter(i => i.content_type === 'questao').length
  const filteredTotal = filter === 'all' ? stats.due : filter === 'flashcard' ? flashcardCount : questionCount

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
    <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-6 shadow-xl">
      {/* Header with sparkle effect */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500/30 to-purple-500/20 rounded-xl border border-blue-500/30">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              Revisao Inteligente
              {stats.due > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                  {stats.due}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">Sistema SM-2 de espacamento otimizado</p>
          </div>
        </div>
        <button
          onClick={() => loadReviewData()}
          disabled={isLoading}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
          title="Atualizar dados"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick start button - most prominent */}
      {stats.due > 0 && (
        <Link
          href="/review"
          className="mb-5 w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30 group border border-blue-400/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-lg">Iniciar Revisao</span>
              <span className="block text-xs text-blue-200 font-normal">
                {stats.questoes > 0 && `${stats.questoes} questoes`}
                {stats.questoes > 0 && stats.flashcards > 0 && ' + '}
                {stats.flashcards > 0 && `${stats.flashcards} flashcards`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {stats.due} itens
            </span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}
      
      {/* Last updated */}
      {lastUpdated && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
          <Clock className="w-3 h-3" />
          <span>Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}</span>
        </div>
      )}

      {/* Filter tabs */}
      {stats.due > 0 && (
        <div className="flex gap-2 mb-4 p-1 bg-slate-800/50 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
              filter === 'all'
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <Target className="w-4 h-4" />
            Todos ({stats.due})
          </button>
          <button
            onClick={() => setFilter('questao')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
              filter === 'questao'
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Questoes ({stats.questoes})
          </button>
          <button
            onClick={() => setFilter('flashcard')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
              filter === 'flashcard'
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <Brain className="w-4 h-4" />
            Flashcards ({stats.flashcards})
          </button>
        </div>
      )}

      {/* Stats summary - compact version */}
      {stats.due > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">Progresso:</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-300">{stats.questoes} questoes</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">{stats.flashcards} flashcards</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{stats.overdue} atrasados</span>
            </span>
          </div>
        </div>
      )}

      {/* Due Items preview */}
      {dueItems.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Proximos para revisar ({filter === 'all' ? 'todos' : filter === 'questao' ? 'questoes' : 'flashcards'}):
            </p>
            {allDueItems.length > 5 && (
              <span className="text-xs text-slate-500">
                Mostrando 5 de {filter === 'all' ? allDueItems.length : filteredTotal}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {dueItems.map((item, index) => (
              <div 
                key={item.id} 
                className={cn(
                  "bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-all hover:bg-slate-800/80 group cursor-pointer",
                  index === 0 && "ring-1 ring-blue-500/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-1.5 rounded-lg flex-shrink-0",
                    item.content_type === 'questao' 
                      ? 'bg-blue-500/20' 
                      : 'bg-emerald-500/20'
                  )}>
                    {item.content_type === 'questao' ? (
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Brain className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wide",
                        item.content_type === 'questao'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      )}>
                        {item.content_type === 'questao' ? 'Questao' : 'Flashcard'}
                      </span>
                      {(item.tema || item.materia) && (
                        <span className="text-[10px] text-slate-500 truncate">
                          {item.materia || item.tema}
                        </span>
                      )}
                    </div>
                    {item.title ? (
                      <p className="text-sm text-slate-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                        {item.title}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        Conteudo #{item.content_id.slice(0, 8)}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      item.interval_days <= 1 
                        ? 'bg-red-500/20 text-red-300' 
                        : item.interval_days <= 3 
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-600/50 text-slate-400'
                    )}>
                      {item.interval_days <= 1 ? 'Urgente' : `${item.interval_days}d`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* View all link */}
          <Link 
            href="/review"
            className="block text-center text-sm text-blue-400 hover:text-blue-300 py-2 hover:underline"
          >
            Ver todos os {stats.due} itens e iniciar revisao
          </Link>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 border border-emerald-700/40 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <AlertCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-emerald-300 font-semibold">Tudo em dia!</p>
            <p className="text-emerald-400/70 text-sm mt-0.5">
              Nenhum conteudo pendente para revisao no momento.
            </p>
          </div>
          <Link 
            href="/flashcards" 
            className="px-4 py-2 bg-emerald-600/20 text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-600/30 transition-colors border border-emerald-600/30"
          >
            Estudar novos
          </Link>
        </div>
      )}
    </div>
  )
}
