'use client'

import { useEffect, useState, useCallback } from 'react'
import { getReviewStats, getDueReviewItems, type ReviewItem } from '@/lib/spaced-repetition-v2'
import { getUserWeakTopics, type WeakTopic } from '@/lib/gamification-client'
import { Brain, BookOpen, RefreshCw, Clock, Play, ChevronRight, Zap, Target, Trophy, AlertTriangle, TrendingDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { CombinedReviewMode } from '@/components/combined-review-mode'
import Link from 'next/link'

interface DashboardSmartReviewProps {
  userId: string
}

interface EnrichedReviewItem extends ReviewItem {
  title?: string
  preview?: string
  tema?: string
  materia?: string
}

export function DashboardSmartReview({ userId }: DashboardSmartReviewProps) {
  const router = useRouter()
  const [stats, setStats] = useState({
    total: 0,
    due: 0,
    overdue: 0,
    questoes: 0,
    flashcards: 0,
    averageEaseFactor: '0',
  })
  const [dueItems, setDueItems] = useState<EnrichedReviewItem[]>([])
  const [rawDueItems, setRawDueItems] = useState<ReviewItem[]>([])
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [isStartingReview, setIsStartingReview] = useState(false)
  const [activeTab, setActiveTab] = useState<'revisao' | 'fracos'>('revisao')
  
  // Limite maximo de itens por sessao
  const MAX_REVIEW_ITEMS = 20

  const loadReviewData = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const [statsData, dueData] = await Promise.all([
        getReviewStats(userId),
        getDueReviewItems(userId),
      ])

      setStats(statsData)
      setRawDueItems(dueData)
      
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
        
        // Enrich each item (max 5 for display)
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

  const handleStartReview = async () => {
    if (rawDueItems.length === 0) return
    
    setIsStartingReview(true)
    
    // Pequeno delay para mostrar a animacao de carregamento
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setIsReviewMode(true)
    setIsStartingReview(false)
  }

  const handleCompleteReview = () => {
    setIsReviewMode(false)
    loadReviewData() // Reload data after review
  }

  const handleBackFromReview = () => {
    setIsReviewMode(false)
  }

  // Itens limitados para a sessao (max 20)
  const reviewSessionItems = rawDueItems.slice(0, MAX_REVIEW_ITEMS)
  const hasMoreItems = rawDueItems.length > MAX_REVIEW_ITEMS

  // Review Mode - Full Screen
  if (isReviewMode && reviewSessionItems.length > 0) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden animate-in fade-in-0 duration-300">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Revisão Inteligente Combinada</h3>
                <p className="text-xs text-muted-foreground">
                  {reviewSessionItems.length} itens nesta sessão
                  {hasMoreItems && ` (${rawDueItems.length - MAX_REVIEW_ITEMS} restantes)`}
                </p>
              </div>
            </div>
            <button
              onClick={handleBackFromReview}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
        <div className="p-4">
          <CombinedReviewMode
            userId={userId}
            dueItems={reviewSessionItems}
            onComplete={handleCompleteReview}
            onBack={handleBackFromReview}
          />
        </div>
      </div>
    )
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Revisão Inteligente</h3>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-muted/50 rounded-lg"></div>
          <div className="h-16 bg-muted/50 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
                <h3 className="font-bold text-foreground">Revisão Inteligente Combinada</h3>
              <p className="text-xs text-muted-foreground">Sistema SM-2 - Flashcards + Questões</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.due > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                {stats.due} para revisar
              </div>
            )}
            <button
              onClick={() => loadReviewData()}
              disabled={isLoading}
              className="p-2 hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
            <Clock className="w-3 h-3" />
            <span>Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-lg p-3 text-center border border-red-500/20">
            <p className="text-2xl font-bold text-red-400">{stats.due}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 text-center border border-blue-500/20">
            <div className="flex items-center justify-center gap-1">
              <Brain className="w-4 h-4 text-blue-400" />
              <p className="text-2xl font-bold text-blue-400">{stats.flashcards}</p>
            </div>
            <p className="text-xs text-muted-foreground">Flashcards</p>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-3 text-center border border-purple-500/20">
            <div className="flex items-center justify-center gap-1">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <p className="text-2xl font-bold text-purple-400">{stats.questoes}</p>
            </div>
            <p className="text-xs text-muted-foreground">Questões</p>
          </div>
        </div>

        {/* Due Items Preview */}
        {dueItems.length > 0 ? (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Próximos para revisar:</p>
              <p className="text-xs text-muted-foreground">
                {Math.min(stats.due, MAX_REVIEW_ITEMS)} itens na próxima sessão
              </p>
            </div>
            {dueItems.slice(0, 3).map((item) => (
              <div 
                key={item.id} 
                className="bg-muted/30 rounded-lg p-3 border border-border/50"
              >
                <div className="flex items-start gap-2">
                  <div className={`p-1.5 rounded flex-shrink-0 ${
                    item.content_type === 'questao' 
                      ? 'bg-purple-500/20' 
                      : 'bg-blue-500/20'
                  }`}>
                    {item.content_type === 'questao' ? (
                      <BookOpen className="w-3 h-3 text-purple-400" />
                    ) : (
                      <Brain className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        item.content_type === 'questao'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {item.content_type === 'questao' ? 'Questão' : 'Flashcard'}
                      </span>
                      {(item.tema || item.materia) && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {item.materia || item.tema}
                        </span>
                      )}
                    </div>
                    {item.title ? (
                      <p className="text-xs text-foreground leading-relaxed line-clamp-1">
                        {item.title}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Conteúdo #{item.content_id.slice(0, 8)}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                    item.interval_days <= 1 
                      ? 'bg-red-500/20 text-red-300' 
                      : item.interval_days <= 3 
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {item.interval_days}d
                  </span>
                </div>
              </div>
            ))}
            {dueItems.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                + {dueItems.length - 3} mais itens
              </p>
            )}
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Trophy className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-green-300 font-medium text-sm">Tudo em dia!</p>
              <p className="text-green-400/70 text-xs">Nenhum conteúdo pendente para revisão.</p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        {stats.due > 0 ? (
          <button
            onClick={handleStartReview}
            disabled={isStartingReview}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl group border-2 border-blue-400/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isStartingReview ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-lg">Iniciando sessão...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-lg">Iniciar Revisão</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold ml-2">
                  {Math.min(stats.due, MAX_REVIEW_ITEMS)} {Math.min(stats.due, MAX_REVIEW_ITEMS) === 1 ? 'item' : 'itens'}
                </span>
                {stats.due > MAX_REVIEW_ITEMS && (
                  <span className="text-xs opacity-80">
                    (+{stats.due - MAX_REVIEW_ITEMS} depois)
                  </span>
                )}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground mb-2">
              Volte mais tarde para revisar conteúdo agendado
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => router.push('/flashcards')}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Estudar novos flashcards
              </button>
              <span className="text-muted-foreground">|</span>
              <Link 
                href="/review"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Ver todas as revisões
              </Link>
            </div>
          </div>
        )}

        {/* Link secundario para pagina de revisao */}
        {stats.due > 0 && (
          <div className="mt-3 text-center">
            <Link 
              href="/review"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Ou acesse a página de revisão completa
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
