'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getReviewStats, getDueReviewItems, recordReviewResult, type ReviewItem } from '@/lib/spaced-repetition-v2'
import { AlertCircle, BookOpen, Brain, RefreshCw, Clock, Play, ChevronRight, Sparkles, Target, TrendingUp, CheckCircle2, XCircle, Pause, ChevronLeft, Trophy, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { saveQuizAnswer } from '@/lib/storage-supabase'

interface SmartReviewSectionProps {
  userId: string
}

interface EnrichedReviewItem extends ReviewItem {
  title?: string
  preview?: string
  tema?: string
  materia?: string
  // Flashcard fields
  frente?: string
  verso?: string
  alternativa_tendenciosa?: string
  // Question fields
  enunciado?: string
  alternativas?: Record<string, string>
  resposta_correta?: string
  explicacao?: string
  subtema?: string
}

type FilterType = 'all' | 'flashcard' | 'questao'
type ReviewState = 'idle' | 'loading' | 'reviewing' | 'completed' | 'paused'

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
  
  // Review mode state
  const [reviewState, setReviewState] = useState<ReviewState>('idle')
  const [reviewItems, setReviewItems] = useState<EnrichedReviewItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<{ itemId: string; correct: boolean }[]>([])
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string; isCorrect: boolean }[]>([])
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null)

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

  // Start review immediately
  const startReview = async () => {
    setReviewState('loading')
    
    try {
      const supabase = createClient()
      const dueData = await getDueReviewItems(userId)
      
      if (dueData.length === 0) {
        setReviewState('completed')
        return
      }

      // Enrich all items with full content for review
      const enrichedItems: EnrichedReviewItem[] = []
      
      const flashcardIds = dueData.filter(i => i.content_type === 'flashcard').map(i => i.content_id)
      const questionIds = dueData.filter(i => i.content_type === 'questao').map(i => i.content_id)

      // Fetch flashcards
      let flashcardsMap = new Map<string, any>()
      if (flashcardIds.length > 0) {
        const { data } = await supabase
          .from('flashcards')
          .select('id, frente, verso, alternativa_tendenciosa, materia, tema')
          .in('id', flashcardIds)
        if (data) data.forEach(f => flashcardsMap.set(f.id, f))
      }

      // Fetch questions
      let questionsMap = new Map<string, any>()
      if (questionIds.length > 0) {
        const { data } = await supabase
          .from('questoes')
          .select('id, enunciado, alternativaA, alternativaB, alternativaC, alternativaD, alternativaE, resposta_correta, explicacao, tema, subtema')
          .in('id', questionIds)
        if (data) {
          data.forEach(q => {
            const alternativas: Record<string, string> = {}
            if (q.alternativaA) alternativas['A'] = q.alternativaA
            if (q.alternativaB) alternativas['B'] = q.alternativaB
            if (q.alternativaC) alternativas['C'] = q.alternativaC
            if (q.alternativaD) alternativas['D'] = q.alternativaD
            if (q.alternativaE) alternativas['E'] = q.alternativaE
            questionsMap.set(q.id, { ...q, alternativas })
          })
        }
      }

      // Enrich items
      for (const item of dueData) {
        const enriched: EnrichedReviewItem = { ...item }
        
        if (item.content_type === 'flashcard') {
          const f = flashcardsMap.get(item.content_id)
          if (f) {
            enriched.frente = f.frente
            enriched.verso = f.verso
            enriched.alternativa_tendenciosa = f.alternativa_tendenciosa
            enriched.materia = f.materia
            enriched.tema = f.tema
            enriched.title = f.frente?.substring(0, 60)
          }
        } else {
          const q = questionsMap.get(item.content_id)
          if (q) {
            enriched.enunciado = q.enunciado
            enriched.alternativas = q.alternativas
            enriched.resposta_correta = q.resposta_correta
            enriched.explicacao = q.explicacao
            enriched.tema = q.tema
            enriched.subtema = q.subtema
            enriched.title = q.enunciado?.substring(0, 60)
          }
        }
        
        // Only add valid items
        const isValidFlashcard = item.content_type === 'flashcard' && enriched.frente && enriched.verso
        const isValidQuestion = item.content_type === 'questao' && enriched.enunciado
        
        if (isValidFlashcard || isValidQuestion) {
          enrichedItems.push(enriched)
        }
      }

      if (enrichedItems.length === 0) {
        setReviewState('completed')
        return
      }

      setReviewItems(enrichedItems)
      setCurrentIndex(0)
      setResults([])
      setReviewState('reviewing')
    } catch (error) {
      console.error('Erro ao iniciar revisao:', error)
      setReviewState('idle')
    }
  }

  // Generate shuffled options for flashcards
  useEffect(() => {
    if (reviewState !== 'reviewing' || reviewItems.length === 0) return
    
    const currentItem = reviewItems[currentIndex]
    if (!currentItem || currentItem.content_type !== 'flashcard') {
      setShuffledOptions([])
      return
    }

    if (currentItem.verso && currentItem.alternativa_tendenciosa) {
      const options = [
        { text: currentItem.verso, isCorrect: true },
        { text: currentItem.alternativa_tendenciosa, isCorrect: false }
      ]
      setShuffledOptions(options.sort(() => Math.random() - 0.5))
    } else {
      setShuffledOptions([])
    }
  }, [currentIndex, reviewItems, reviewState])

  // Cleanup auto-advance timer
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    }
  }, [])

  const currentItem = reviewItems[currentIndex]
  const correctCount = results.filter(r => r.correct).length
  const wrongCount = results.filter(r => !r.correct).length

  const handleFlashcardAnswer = async (isCorrect: boolean) => {
    if (!currentItem || showResult) return

    setShowResult(true)
    setResults(prev => [...prev, { itemId: currentItem.content_id, correct: isCorrect }])

    await recordReviewResult(userId, currentItem.content_id, 'flashcard', isCorrect, isCorrect ? 4 : 1)

    autoAdvanceRef.current = setTimeout(() => {
      handleNext()
    }, isCorrect ? 1500 : 2500)
  }

  const handleQuestionSubmit = async () => {
    if (!currentItem || !selectedAnswer || showResult) return

    const isCorrect = selectedAnswer.toUpperCase() === (currentItem.resposta_correta || "").toUpperCase()
    
    setShowResult(true)
    setResults(prev => [...prev, { itemId: currentItem.content_id, correct: isCorrect }])

    try {
      await saveQuizAnswer(userId, currentItem.content_id, selectedAnswer.toUpperCase(), isCorrect, "estudo")
    } catch (error) {
      console.error("Erro ao salvar resposta:", error)
    }

    await recordReviewResult(userId, currentItem.content_id, 'questao', isCorrect, isCorrect ? 4 : 1)
  }

  const handleNext = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
    
    if (currentIndex < reviewItems.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setReviewState('completed')
    }
  }

  const handlePause = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
    setReviewState('paused')
  }

  const handleResume = () => {
    setReviewState('reviewing')
  }

  const handleRestart = async () => {
    setReviewState('idle')
    setCurrentIndex(0)
    setResults([])
    setReviewItems([])
    setIsFlipped(false)
    setSelectedAnswer(null)
    setShowResult(false)
    await loadReviewData()
  }

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

  // Loading state for review
  if (reviewState === 'loading') {
    return (
      <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-white font-medium">Carregando revisao...</p>
          <p className="text-slate-400 text-sm mt-1">Preparando conteudo para estudo</p>
        </div>
      </div>
    )
  }

  // Completed state
  if (reviewState === 'completed') {
    const accuracy = reviewItems.length > 0 ? Math.round((correctCount / reviewItems.length) * 100) : 0
    
    return (
      <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-6 shadow-xl">
        <div className="text-center py-6">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Revisao Concluida!</h2>
          
          {reviewItems.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto my-6">
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">{reviewItems.length}</p>
                  <p className="text-xs text-slate-400">Total</p>
                </div>
                <div className="bg-emerald-500/20 rounded-lg p-3">
                  <p className="text-2xl font-bold text-emerald-400">{correctCount}</p>
                  <p className="text-xs text-slate-400">Acertos</p>
                </div>
                <div className="bg-red-500/20 rounded-lg p-3">
                  <p className="text-2xl font-bold text-red-400">{wrongCount}</p>
                  <p className="text-xs text-slate-400">Erros</p>
                </div>
              </div>

              <div className="max-w-sm mx-auto mb-6">
                <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                  <div 
                    className={cn(
                      "h-3 rounded-full transition-all",
                      accuracy >= 70 ? "bg-emerald-500" : accuracy >= 50 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
                <p className="text-lg font-semibold text-white">{accuracy}% de aproveitamento</p>
              </div>
            </>
          ) : (
            <p className="text-slate-400 mb-6">Nenhum item pendente para revisao.</p>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleRestart} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            {reviewItems.length > 0 && (
              <Button onClick={startReview} className="bg-blue-600 hover:bg-blue-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Revisar Novamente
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Paused state
  if (reviewState === 'paused') {
    return (
      <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-6 shadow-xl">
        <div className="text-center py-8">
          <Pause className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Revisao Pausada</h3>
          <p className="text-slate-400 mb-4">
            {currentIndex + 1} de {reviewItems.length} itens revisados
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleRestart} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Encerrar
            </Button>
            <Button onClick={handleResume} className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-2" />
              Continuar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Active review mode
  if (reviewState === 'reviewing' && currentItem) {
    return (
      <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/50 to-purple-900/20 border-2 border-blue-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
        {/* Header with progress */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePause} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
            <Pause className="w-4 h-4" />
            Pausar
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-emerald-400">{correctCount}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="font-medium text-red-400">{wrongCount}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / reviewItems.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-xs text-slate-400 mt-1">
            {currentIndex + 1} de {reviewItems.length}
          </p>
        </div>

        {/* Content type badge */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            currentItem.content_type === 'flashcard' 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
          )}>
            {currentItem.content_type === 'flashcard' ? (
              <>
                <Brain className="w-3.5 h-3.5" />
                Flashcard
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                Questao
              </>
            )}
          </div>
          {currentItem.tema && (
            <span className="text-xs text-slate-500">{currentItem.materia || currentItem.tema}</span>
          )}
        </div>

        {/* Flashcard content */}
        {currentItem.content_type === 'flashcard' ? (
          <div className="space-y-4">
            <div 
              className={cn(
                "bg-slate-800/80 border-2 rounded-xl p-6 min-h-[180px] flex items-center justify-center cursor-pointer transition-all",
                isFlipped ? "border-blue-500/50" : "border-slate-600 hover:border-blue-500/30"
              )}
              onClick={() => !showResult && setIsFlipped(!isFlipped)}
            >
              <div className="text-center max-w-full">
                {!isFlipped ? (
                  <>
                    <p className="text-lg font-medium text-white leading-relaxed">
                      {currentItem.frente}
                    </p>
                    <p className="text-xs text-slate-500 mt-3">Toque para ver a resposta</p>
                  </>
                ) : (
                  <p className="text-lg text-slate-200 leading-relaxed">
                    {currentItem.verso}
                  </p>
                )}
              </div>
            </div>

            {!showResult && (
              <>
                {shuffledOptions.length === 2 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shuffledOptions.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFlashcardAnswer(option.isCorrect)}
                        className="p-3 bg-slate-800/60 hover:bg-slate-700 border border-slate-600 hover:border-blue-500/50 rounded-lg text-left transition-all text-sm text-slate-200"
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                ) : isFlipped ? (
                  <div className="flex gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => handleFlashcardAnswer(false)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Errei
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleFlashcardAnswer(true)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Acertei
                    </Button>
                  </div>
                ) : null}
              </>
            )}

            {showResult && (
              <div className={cn(
                "p-3 rounded-lg border text-center",
                results[results.length - 1]?.correct 
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-red-500/10 border-red-500/30"
              )}>
                {results[results.length - 1]?.correct ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Correto!</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 text-red-400 mb-1">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Incorreto</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Resposta: <span className="text-white">{currentItem.verso}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Question content */
          <div className="space-y-4">
            <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-4">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {currentItem.enunciado}
              </p>
            </div>

            <div className="space-y-2">
              {currentItem.alternativas && Object.entries(currentItem.alternativas).length > 0 ? (
                Object.entries(currentItem.alternativas).map(([key, value]) => {
                  const isSelected = selectedAnswer === key
                  const isCorrectAnswer = key.toUpperCase() === (currentItem.resposta_correta || "").toUpperCase()
                  
                  return (
                    <button
                      key={key}
                      onClick={() => !showResult && setSelectedAnswer(key)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all flex items-start gap-2 text-sm",
                        showResult
                          ? isCorrectAnswer
                            ? "bg-emerald-500/10 border-emerald-500/50"
                            : isSelected
                              ? "bg-red-500/10 border-red-500/50"
                              : "bg-slate-800/30 border-slate-700 opacity-60"
                          : isSelected
                            ? "bg-blue-500/10 border-blue-500"
                            : "bg-slate-800/60 border-slate-600 hover:border-blue-500/30"
                      )}
                    >
                      <span className={cn(
                        "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-medium text-xs",
                        showResult
                          ? isCorrectAnswer
                            ? "bg-emerald-500 text-white"
                            : isSelected
                              ? "bg-red-500 text-white"
                              : "bg-slate-700 text-slate-400"
                          : isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-slate-700 text-slate-400"
                      )}>
                        {key.toUpperCase()}
                      </span>
                      <span className="text-slate-200 pt-0.5">{value as string}</span>
                    </button>
                  )
                })
              ) : (
                <div className="text-center text-slate-500 p-3 bg-slate-800/30 rounded-lg text-sm">
                  Alternativas nao disponiveis.
                </div>
              )}
            </div>

            {!showResult ? (
              <Button 
                onClick={handleQuestionSubmit}
                disabled={!selectedAnswer}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Confirmar
              </Button>
            ) : (
              <div className="space-y-3">
                {currentItem.explicacao && (
                  <div className="bg-slate-800/60 border border-slate-600 rounded-lg p-3">
                    <h4 className="font-medium text-white text-sm mb-1">Explicacao:</h4>
                    <p className="text-xs text-slate-400 whitespace-pre-wrap">{currentItem.explicacao}</p>
                  </div>
                )}
                <Button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700">
                  Proximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
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
        <button
          onClick={startReview}
          className="mb-5 w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30 group border border-blue-400/20 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-lg">Iniciar Revisao Inteligente</span>
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
        </button>
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
          
          {/* Start review button */}
          <button 
            onClick={startReview}
            className="w-full text-center text-sm text-blue-400 hover:text-blue-300 py-2 hover:underline"
          >
            Iniciar revisao com todos os {stats.due} itens
          </button>
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
